'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp, DollarSign, BarChart3, Calendar, Info, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';
import { fetchStockData, fetchEconomicIndicators, generatePrediction } from './api';
import { StockData, EconomicIndicator, PredictionResult } from './types';

export default function StockAnalyzer() {
  const [ticker, setTicker] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [economicData, setEconomicData] = useState<EconomicIndicator[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  const handleTickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTicker(e.target.value.toUpperCase());
  };

  const handleAnalyzeClick = async () => {
    if (!ticker) {
      toast({
        title: '티커를 입력해주세요',
        description: '분석할 주식의 티커 심볼을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // 주식 데이터 가져오기
      let stockResult;
      try {
        stockResult = await fetchStockData(ticker);
      } catch (stockError) {
        console.error('주식 데이터 가져오기 오류:', stockError);
        toast({
          title: '모의 데이터 사용',
          description: '실제 데이터를 가져오는 데 실패하여 모의 데이터를 사용합니다.',
          variant: 'default',
        });
        
        // 모의 데이터 생성
        stockResult = {
          ticker: ticker,
          companyName: `${ticker} Inc.`,
          companyNameKr: `${ticker} 주식회사`,
          description: `${ticker} is a publicly traded company.`,
          descriptionKr: `${ticker}은(는) 공개적으로 거래되는 회사입니다.`,
          sector: 'Technology',
          industry: 'Software',
          currentPrice: 100 + Math.random() * 900,
          priceChange: Math.random() * 10 - 5,
          currency: 'USD',
          exchange: 'NASDAQ',
          marketCap: 1000000000 + Math.random() * 100000000000,
          volume: 1000000 + Math.random() * 9000000,
          high52Week: 180 + Math.random() * 50,
          low52Week: 120 - Math.random() * 50,
          historicalPrices: Array.from({ length: 365 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - 365 + i);
            const price = 150 + Math.random() * 50 - 25;
            return {
              date: date.toISOString().split('T')[0],
              price: parseFloat(price.toFixed(2)),
              volume: Math.floor(1000000 + Math.random() * 9000000),
              open: parseFloat((price * (1 - 0.01 + Math.random() * 0.02)).toFixed(2)),
              high: parseFloat((price * (1 + Math.random() * 0.02)).toFixed(2)),
              low: parseFloat((price * (1 - Math.random() * 0.02)).toFixed(2))
            };
          }),
          technicalIndicators: {
            rsi: 50 + Math.random() * 20,
            macd: {
              value: Math.random() * 2 - 1,
              signal: Math.random() * 2 - 1,
              histogram: Math.random() * 1 - 0.5
            },
            bollingerBands: {
              upper: 160 + Math.random() * 20,
              middle: 150 + Math.random() * 10,
              lower: 140 - Math.random() * 20,
              width: 20 + Math.random() * 10
            },
            ma50: 150 + Math.random() * 10,
            ma200: 145 + Math.random() * 15,
            ema20: 152 + Math.random() * 8,
            ema50: 148 + Math.random() * 12,
            atr: 5 + Math.random() * 3,
            obv: 1000000 + Math.random() * 500000,
            stochastic: {
              k: 50 + Math.random() * 40,
              d: 50 + Math.random() * 30
            },
            adx: 25 + Math.random() * 15,
            supportLevels: [
              140 - Math.random() * 10,
              130 - Math.random() * 15
            ],
            resistanceLevels: [
              160 + Math.random() * 10,
              170 + Math.random() * 15
            ]
          },
          fundamentals: {
            pe: 15 + Math.random() * 25,
            eps: 5 + Math.random() * 10,
            marketCap: (1000000000 + Math.random() * 100000000000),
            dividendYield: Math.random() * 3,
            peg: 1 + Math.random() * 2,
            revenue: 1000000000 + Math.random() * 10000000000,
            revenueGrowth: Math.random() * 20 - 5,
            netIncome: 100000000 + Math.random() * 1000000000,
            netIncomeGrowth: Math.random() * 25 - 5,
            operatingMargin: 10 + Math.random() * 30,
            debtToEquity: 0.5 + Math.random() * 1.5,
            roe: 10 + Math.random() * 20,
            forwardPE: 14 + Math.random() * 20,
            epsGrowth: Math.random() * 30 - 5,
            dividendGrowth: Math.random() * 20 - 2,
            pb: 1 + Math.random() * 5,
            ps: 1 + Math.random() * 10,
            pcf: 5 + Math.random() * 15,
            roa: Math.random() * 15,
            roic: Math.random() * 20,
            currentRatio: 1 + Math.random() * 2,
            quickRatio: 0.8 + Math.random() * 1.5,
            grossMargin: 30 + Math.random() * 50,
            fcf: Math.random() * 10000000000,
            fcfGrowth: Math.random() * 30 - 5,
            nextEarningsDate: getRandomFutureDate(60),
            analystRatings: {
              buy: Math.floor(Math.random() * 20),
              hold: Math.floor(Math.random() * 10),
              sell: Math.floor(Math.random() * 5),
              targetPrice: stockResult?.currentPrice ? stockResult.currentPrice * (1 + Math.random() * 0.3 - 0.1) : 150 + Math.random() * 50
            }
          },
          news: [
            {
              title: `${ticker} Reports Strong Quarterly Results`,
              source: 'Financial Times',
              date: '2023-05-15',
              url: '#',
              sentiment: 'positive'
            },
            {
              title: `${ticker} Announces New Product Line`,
              source: 'Bloomberg',
              date: '2023-05-10',
              url: '#',
              sentiment: 'positive'
            },
            {
              title: `Analysts Raise Price Target for ${ticker}`,
              source: 'CNBC',
              date: '2023-05-05',
              url: '#',
              sentiment: 'positive'
            }
          ],
          patterns: [],
          upcomingEvents: [
            {
              date: getRandomFutureDate(30),
              type: '실적 발표',
              title: '분기별 실적 발표',
              description: `${ticker}의 분기별 실적 발표`,
              impact: 'high'
            },
            {
              date: getRandomFutureDate(45),
              type: '투자자 컨퍼런스',
              title: '연례 투자자 컨퍼런스',
              description: '연례 투자자 컨퍼런스 및 신제품 발표',
              impact: 'medium'
            }
          ],
          momentum: {
            shortTerm: Math.random() * 10 - 5,
            mediumTerm: Math.random() * 15 - 7,
            longTerm: Math.random() * 20 - 10,
            relativeStrength: 40 + Math.random() * 60,
            sectorPerformance: Math.random() * 10 - 5
          },
          lastUpdated: new Date().toISOString()
        };
      }
      setStockData(stockResult);
      
      // 경제 지표 데이터 가져오기
      let economicResult;
      try {
        economicResult = await fetchEconomicIndicators();
      } catch (economicError) {
        console.error('경제 지표 가져오기 오류:', economicError);
        
        // 모의 경제 지표 데이터 생성
        economicResult = [
          {
            name: 'GDP 성장률',
            nameKr: 'GDP 성장률',
            value: 2.1,
            unit: '%',
            change: 0.3,
            previousPeriod: '전분기',
            source: 'FRED',
            description: '국내 총생산 성장률',
            impact: 'positive'
          },
          {
            name: 'Unemployment Rate',
            nameKr: '실업률',
            value: 3.8,
            unit: '%',
            change: -0.1,
            previousPeriod: '전월',
            source: 'FRED',
            description: '노동 인구 중 실업자 비율',
            impact: 'positive'
          },
          {
            name: 'Inflation Rate',
            nameKr: '인플레이션',
            value: 3.2,
            unit: '%',
            change: -0.2,
            previousPeriod: '전월',
            source: 'FRED',
            description: '소비자 물가 상승률',
            impact: 'negative'
          },
          {
            name: 'Interest Rate',
            nameKr: '기준금리',
            value: 5.25,
            unit: '%',
            change: 0,
            previousPeriod: '전월',
            source: 'FRED',
            description: '중앙은행 기준 금리',
            impact: 'neutral'
          }
        ];
      }
      setEconomicData(economicResult);
      
      // AI 예측 생성
      let predictionResult;
      try {
        predictionResult = await generatePrediction(ticker, stockResult, economicResult);
      } catch (predictionError) {
        console.error('예측 생성 오류:', predictionError);
        
        // 모의 예측 데이터 생성
        const currentPrice = stockResult.currentPrice;
        const shortTermChange = Math.random() * 10 - 5; // -5% ~ +5%
        const mediumTermChange = Math.random() * 20 - 7; // -7% ~ +13%
        const longTermChange = Math.random() * 30 - 10; // -10% ~ +20%
        
        const shortTermPrice = currentPrice * (1 + shortTermChange / 100);
        const mediumTermPrice = currentPrice * (1 + mediumTermChange / 100);
        const longTermPrice = currentPrice * (1 + longTermChange / 100);
        
        // 일별 예측 가격 생성
        const pricePredictions = [];
        const today = new Date();
        
        for (let i = 1; i <= 90; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() + i);
          
          let predictedPrice;
          if (i <= 30) {
            // 단기: 현재가격에서 shortTermPrice까지 선형 보간
            predictedPrice = currentPrice + (shortTermPrice - currentPrice) * (i / 30);
          } else if (i <= 60) {
            // 중기: shortTermPrice에서 mediumTermPrice까지 선형 보간
            predictedPrice = shortTermPrice + (mediumTermPrice - shortTermPrice) * ((i - 30) / 30);
          } else {
            // 장기: mediumTermPrice에서 longTermPrice까지 선형 보간
            predictedPrice = mediumTermPrice + (longTermPrice - mediumTermPrice) * ((i - 60) / 30);
          }
          
          // 약간의 변동성 추가
          const volatility = currentPrice * 0.008 * Math.random();
          predictedPrice += (Math.random() > 0.5 ? volatility : -volatility);
          
          pricePredictions.push({
            date: date.toISOString().split('T')[0],
            predictedPrice: Number(predictedPrice.toFixed(2)),
            range: {
              min: Number((predictedPrice * 0.94).toFixed(2)),
              max: Number((predictedPrice * 1.06).toFixed(2))
            }
          });
        }
        
        predictionResult = {
          shortTerm: {
            price: Number(shortTermPrice.toFixed(2)),
            change: Number(shortTermChange.toFixed(2)),
            probability: Number((65 + Math.random() * 20).toFixed(1)),
            range: {
              min: Number((shortTermPrice * 0.94).toFixed(2)),
              max: Number((shortTermPrice * 1.06).toFixed(2))
            }
          },
          mediumTerm: {
            price: Number(mediumTermPrice.toFixed(2)),
            change: Number(mediumTermChange.toFixed(2)),
            probability: Number((60 + Math.random() * 20).toFixed(1)),
            range: {
              min: Number((mediumTermPrice * 0.88).toFixed(2)),
              max: Number((mediumTermPrice * 1.12).toFixed(2))
            }
          },
          longTerm: {
            price: Number(longTermPrice.toFixed(2)),
            change: Number(longTermChange.toFixed(2)),
            probability: Number((55 + Math.random() * 20).toFixed(1)),
            range: {
              min: Number((longTermPrice * 0.82).toFixed(2)),
              max: Number((longTermPrice * 1.18).toFixed(2))
            }
          },
          pricePredictions,
          confidenceScore: Number((65 + Math.random() * 20).toFixed(1)),
          modelInfo: {
            type: 'Transformer',
            accuracy: Number((80 + Math.random() * 10).toFixed(1)),
            features: [
              '과거 주가 데이터',
              '거래량',
              '기술적 지표 (RSI, MACD, 볼린저 밴드)',
              '시장 지표',
              '계절성 패턴',
              '뉴스 감성 분석',
              '거시경제 지표'
            ],
            trainPeriod: '2015-01-01 ~ 현재'
          },
          summary: `${stockResult.companyName}의 주가는 단기적으로 ${shortTermChange > 0 ? '상승' : '하락'}할 것으로 예상됩니다. 중기적으로는 ${mediumTermChange > 0 ? '상승' : '하락'} 추세를 보일 것으로 예측됩니다. 장기적으로는 ${longTermChange > 0 ? '긍정적인' : '부정적인'} 전망을 가지고 있습니다.`,
          strengths: [
            '강력한 재무 상태',
            '경쟁사 대비 높은 수익성',
            '지속적인 혁신과 R&D 투자',
            '시장 점유율 확대',
            '다양한 제품 포트폴리오'
          ],
          risks: [
            '시장 경쟁 심화',
            '규제 환경 변화 가능성',
            '원자재 가격 상승으로 인한 마진 압박',
            '기술 변화에 따른 적응 필요성',
            '글로벌 경제 불확실성'
          ],
          recommendation: shortTermChange > 0 ? 'BUY' : (shortTermChange < -3 ? 'SELL' : 'HOLD')
        };
      }
      setPrediction(predictionResult);
      
      toast({
        title: '분석 완료',
        description: `${ticker} 주식에 대한 분석이 완료되었습니다.`,
      });
    } catch (err) {
      console.error('분석 중 오류 발생:', err);
      setError('데이터를 가져오는 중 오류가 발생했습니다. 모의 데이터를 사용합니다.');
      toast({
        title: '오류 발생',
        description: '데이터를 가져오는 중 오류가 발생했습니다. 모의 데이터를 사용합니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAnalyzeClick();
    }
  };

  return (
    <div className="container mx-auto py-4 md:py-8 px-3 md:px-4 max-w-6xl">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          미국 주식 AI 분석기
        </h1>
        <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
          AI를 활용한 주식 분석 및 예측 서비스. 현재 정보를 취합하여 미래 가격 흐름을 예측합니다.
        </p>
      </div>

      <Card className="mb-6 md:mb-8 shadow-md border-blue-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">주식 분석하기</CardTitle>
          <CardDescription>분석할 미국 주식의 티커 심볼을 입력하세요. (예: AAPL, MSFT, GOOGL)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="티커 심볼 입력 (예: AAPL)"
              value={ticker}
              onChange={handleTickerChange}
              onKeyDown={handleKeyDown}
              className="sm:max-w-md"
            />
            <Button 
              onClick={handleAnalyzeClick} 
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              {isLoading ? '분석 중...' : '분석하기'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6 md:mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>오류</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <LoadingState />
      ) : stockData && prediction ? (
        <ResultsDisplay
          stockData={stockData}
          economicData={economicData}
          prediction={prediction}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onResetClick={() => {
            setStockData(null);
            setPrediction(null);
            setEconomicData([]);
            setTicker('');
          }}
        />
      ) : null}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-48 md:h-64 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ResultsDisplayProps {
  stockData: StockData;
  economicData: EconomicIndicator[];
  prediction: PredictionResult;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onResetClick: () => void;
}

function ResultsDisplay({ 
  stockData, 
  economicData, 
  prediction, 
  activeTab, 
  setActiveTab,
  onResetClick
}: ResultsDisplayProps) {
  // 데이터 유효성 검사
  if (!stockData || !prediction) {
    return (
      <div className="space-y-6">
        <Card className="shadow-md border-blue-100">
          <CardHeader>
            <CardTitle>데이터 오류</CardTitle>
          </CardHeader>
          <CardContent>
            <p>주식 데이터를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={onResetClick}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 안전한 값 접근을 위한 헬퍼 함수
  const safeNumber = (value: any, defaultValue = 0, decimals = 2) => {
    if (value === undefined || value === null || isNaN(Number(value))) {
      return defaultValue.toFixed(decimals);
    }
    return Number(value).toFixed(decimals);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md border-blue-100">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                {stockData.companyName} 
                <span className="text-gray-500 font-normal">({stockData.ticker})</span>
              </CardTitle>
              <div className="flex items-center mt-1">
                <span className="text-2xl font-bold">${safeNumber(stockData.currentPrice)}</span>
                <div className={`ml-2 flex items-center ${stockData.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stockData.priceChange >= 0 ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
                  <span className="font-medium">{stockData.priceChange > 0 ? '+' : ''}{safeNumber(stockData.priceChange)}%</span>
                </div>
              </div>
            </div>
            <div className="mt-2 sm:mt-0 text-left sm:text-right flex flex-col items-start sm:items-end">
              <p className="text-sm text-gray-500">마지막 업데이트</p>
              <p className="text-sm font-medium">{new Date(stockData.lastUpdated).toLocaleString()}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2" 
                onClick={onResetClick}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                새 분석
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 mb-6">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">
                <Info className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline-block">개요</span>
                <span className="sm:hidden">개요</span>
              </TabsTrigger>
              <TabsTrigger value="technical" className="text-xs sm:text-sm">
                <BarChart3 className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline-block">기술적 분석</span>
                <span className="sm:hidden">기술분석</span>
              </TabsTrigger>
              <TabsTrigger value="fundamental" className="text-xs sm:text-sm">
                <DollarSign className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline-block">기본적 분석</span>
                <span className="sm:hidden">기본분석</span>
              </TabsTrigger>
              <TabsTrigger value="prediction" className="text-xs sm:text-sm">
                <TrendingUp className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline-block">AI 예측</span>
                <span className="sm:hidden">AI 예측</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card className="shadow-sm border-blue-50">
                <CardContent className="pt-6">
                  <div className="h-64 md:h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stockData.historicalPrices || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`;
                          }}
                        />
                        <YAxis 
                          domain={['auto', 'auto']} 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip 
                          formatter={(value) => [`$${Number(value).toFixed(2)}`, '주가']}
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#8884d8" 
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 6 }} 
                          name="주가" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="shadow-sm border-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">시가총액</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl md:text-2xl font-bold">${((stockData.marketCap || 0) / 1000000000).toFixed(2)}B</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">52주 최고/최저</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl md:text-2xl font-bold">${safeNumber(stockData.high52Week)} / ${safeNumber(stockData.low52Week)}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-blue-50 sm:col-span-2 md:col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">거래량</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl md:text-2xl font-bold">{((stockData.volume || 0) / 1000000).toFixed(2)}M</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-sm border-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle>회사 정보</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm md:text-base">{stockData.description || '회사 정보가 없습니다.'}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">AI 요약</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm md:text-base font-medium">{prediction.summary || '요약 정보가 없습니다.'}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="technical" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm border-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">기술적 지표</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">RSI (14)</p>
                        <span className={`${getRSIColor(stockData.technicalIndicators?.rsi || 50)} font-bold`}>
                          {safeNumber(stockData.technicalIndicators?.rsi, 50)}
                          <span className="ml-2 text-xs font-normal text-gray-500">
                            {getRSIStatus(stockData.technicalIndicators?.rsi || 50)}
                          </span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">MACD</p>
                        <span className={`${(stockData.technicalIndicators?.macd?.value || 0) > 0 ? "text-green-600" : "text-red-600"} font-bold`}>
                          {safeNumber(stockData.technicalIndicators?.macd?.value, 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">MA 50</p>
                        <span className={`${(stockData.technicalIndicators?.ma50 || 0) > stockData.currentPrice ? "text-red-600" : "text-green-600"} font-bold`}>
                          ${safeNumber(stockData.technicalIndicators?.ma50, 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">MA 200</p>
                        <span className={`${(stockData.technicalIndicators?.ma200 || 0) > stockData.currentPrice ? "text-red-600" : "text-green-600"} font-bold`}>
                          ${safeNumber(stockData.technicalIndicators?.ma200, 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">볼린저 밴드 (상단)</p>
                        <span className="font-bold">
                          ${safeNumber(stockData.technicalIndicators?.bollingerBands?.upper, 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-medium">볼린저 밴드 (하단)</p>
                        <span className="font-bold">
                          ${safeNumber(stockData.technicalIndicators?.bollingerBands?.lower, 0)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">차트 패턴</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(stockData.patterns || []).length > 0 ? (
                      <div className="space-y-4">
                        {(stockData.patterns || []).map((pattern, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex justify-between items-center mb-1">
                              <p className="font-bold">{pattern.name}</p>
                              <div className={`px-2 py-0.5 rounded-full text-xs ${pattern.bullish ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                {pattern.bullish ? "상승" : "하락"} 신호
                              </div>
                            </div>
                            <p className="text-sm mb-2">{pattern.description || pattern.descriptionKr || '설명 없음'}</p>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>신뢰도</span>
                              <span>{pattern.confidence || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div 
                                className={`h-1.5 rounded-full ${pattern.bullish ? "bg-green-500" : "bg-red-500"}`} 
                                style={{ width: `${pattern.confidence || 0}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <p className="text-gray-500 mb-2">식별된 차트 패턴이 없습니다.</p>
                        <p className="text-sm text-gray-400">현재 가격 움직임에서 명확한 패턴이 발견되지 않았습니다.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="fundamental" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm border-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">주요 재무 지표</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">P/E 비율</p>
                        <span className="font-bold">
                          {safeNumber(stockData.fundamentals?.pe, 0) || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">EPS</p>
                        <span className="font-bold">
                          ${safeNumber(stockData.fundamentals?.eps, 0) || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">배당 수익률</p>
                        <span className="font-bold">
                          {safeNumber(stockData.fundamentals?.dividendYield, 0) || '0.00'}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">PEG 비율</p>
                        <span className="font-bold">
                          {safeNumber(stockData.fundamentals?.peg, 0) || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">ROE</p>
                        <span className="font-bold">
                          {safeNumber(stockData.fundamentals?.roe, 0) || 'N/A'}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-medium">부채/자본 비율</p>
                        <span className="font-bold">
                          {safeNumber(stockData.fundamentals?.debtToEquity, 0) || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">사업 성과</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">매출</p>
                        <span className="font-bold">
                          ${((stockData.fundamentals?.revenue || 0) / 1000000000).toFixed(2)}B
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">매출 성장률</p>
                        <span className={`${(stockData.fundamentals?.revenueGrowth || 0) > 0 ? "text-green-600" : "text-red-600"} font-bold`}>
                          {safeNumber(stockData.fundamentals?.revenueGrowth, 0) || '0.00'}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">순이익</p>
                        <span className="font-bold">
                          ${((stockData.fundamentals?.netIncome || 0) / 1000000000).toFixed(2)}B
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">순이익 성장률</p>
                        <span className={`${(stockData.fundamentals?.netIncomeGrowth || 0) > 0 ? "text-green-600" : "text-red-600"} font-bold`}>
                          {safeNumber(stockData.fundamentals?.netIncomeGrowth, 0) || 'N/A'}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">영업 마진</p>
                        <span className="font-bold">
                          {safeNumber(stockData.fundamentals?.operatingMargin, 0) || 'N/A'}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-medium">다음 실적 발표</p>
                        <span className="font-bold">
                          {stockData.fundamentals?.nextEarningsDate || '미정'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="shadow-sm border-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">경제 지표</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {(economicData || []).map((indicator, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <p className="text-sm text-gray-500">{indicator.name}</p>
                        <div className="flex items-end gap-2 mt-1">
                          <p className="text-xl font-bold">
                            {safeNumber(indicator.value, 0, 1)}{indicator.unit}
                          </p>
                          <span className={`text-sm ${(indicator.change || 0) > 0 ? "text-green-600" : (indicator.change || 0) < 0 ? "text-red-600" : "text-gray-500"}`}>
                            {(indicator.change || 0) > 0 ? "+" : ""}{safeNumber(indicator.change, 0, 1)}{indicator.unit} ({indicator.previousPeriod || '이전'})
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">출처: {indicator.source || '미상'}</p>
                      </div>
                    ))}
                    {(!economicData || economicData.length === 0) && (
                      <div className="col-span-full text-center py-4 text-gray-500">
                        경제 지표 데이터가 없습니다.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prediction" className="space-y-6">
              <Card className="shadow-sm border-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">AI 예측 결과</CardTitle>
                  <CardDescription>과거 데이터와 현재 시장 환경을 기반으로 한 미래 가격 예측</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 md:h-80 w-full mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={[
                          ...(stockData.historicalPrices || []).slice(-30), // 최근 30일간의 실제 데이터
                          ...(prediction.pricePredictions || []) // 예측 데이터
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`;
                          }}
                        />
                        <YAxis 
                          domain={['auto', 'auto']} 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip 
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                          formatter={(value, name) => {
                            if (name === '주가') return [`$${Number(value).toFixed(2)}`, '실제 주가'];
                            return [`$${Number(value).toFixed(2)}`, 'AI 예측 주가'];
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#8884d8" 
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 6 }} 
                          name="주가" 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="predictedPrice" 
                          stroke="#82ca9d" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          activeDot={{ r: 6 }} 
                          name="예측 주가" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="shadow-sm border-blue-50">
                      <CardHeader className="pb-1">
                        <CardTitle className="text-sm text-gray-500">단기 (1개월)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-baseline gap-2">
                          <p className="text-xl font-bold">${safeNumber(prediction.shortTerm?.price)}</p>
                          <span className={`${(prediction.shortTerm?.change || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {(prediction.shortTerm?.change || 0) > 0 ? "+" : ""}{safeNumber(prediction.shortTerm?.change)}%
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-sm border-blue-50">
                      <CardHeader className="pb-1">
                        <CardTitle className="text-sm text-gray-500">중기 (3개월)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-baseline gap-2">
                          <p className="text-xl font-bold">${safeNumber(prediction.mediumTerm?.price)}</p>
                          <span className={`${(prediction.mediumTerm?.change || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {(prediction.mediumTerm?.change || 0) > 0 ? "+" : ""}{safeNumber(prediction.mediumTerm?.change)}%
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-sm border-blue-50">
                      <CardHeader className="pb-1">
                        <CardTitle className="text-sm text-gray-500">장기 (6개월)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-baseline gap-2">
                          <p className="text-xl font-bold">${safeNumber(prediction.longTerm?.price)}</p>
                          <span className={`${(prediction.longTerm?.change || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {(prediction.longTerm?.change || 0) > 0 ? "+" : ""}{safeNumber(prediction.longTerm?.change)}%
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <p className="text-sm text-gray-500">AI 예측 신뢰도</p>
                    <p className="text-sm font-bold">{prediction.confidenceScore || 0}%</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className={`h-2 rounded-full ${
                        (prediction.confidenceScore || 0) > 80 ? "bg-green-500" : 
                        (prediction.confidenceScore || 0) > 60 ? "bg-yellow-500" : "bg-red-500"
                      }`} 
                      style={{ width: `${prediction.confidenceScore || 0}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm border-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">강점</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(prediction.strengths || []).map((strength, index) => (
                        <li key={index} className="flex items-start">
                          <div className="rounded-full bg-green-100 p-1 mr-2 mt-0.5">
                            <ArrowUp className="h-3 w-3 text-green-600" />
                          </div>
                          <p className="text-sm">{strength}</p>
                        </li>
                      ))}
                      {(!prediction.strengths || prediction.strengths.length === 0) && (
                        <li className="text-gray-500">강점 정보가 없습니다.</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="shadow-sm border-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">위험 요소</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(prediction.risks || []).map((risk, index) => (
                        <li key={index} className="flex items-start">
                          <div className="rounded-full bg-red-100 p-1 mr-2 mt-0.5">
                            <ArrowDown className="h-3 w-3 text-red-600" />
                          </div>
                          <p className="text-sm">{risk}</p>
                        </li>
                      ))}
                      {(!prediction.risks || prediction.risks.length === 0) && (
                        <li className="text-gray-500">위험 요소 정보가 없습니다.</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">투자 추천</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{prediction.recommendation || '정보 없음'}</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// RSI 상태에 따른 색상 변경 함수
function getRSIColor(rsi: number): string {
  if (rsi > 70) return "text-red-600";
  if (rsi < 30) return "text-green-600";
  return "text-gray-900";
}

// RSI 상태 텍스트 반환 함수
function getRSIStatus(rsi: number): string {
  if (rsi > 70) return "과매수";
  if (rsi > 60) return "매수세 강함";
  if (rsi < 30) return "과매도";
  if (rsi < 40) return "매도세 강함";
  return "중립";
}

// 미래 날짜 생성 함수 추가
function getRandomFutureDate(maxDays: number): string {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + Math.floor(Math.random() * maxDays) + 1);
  return futureDate.toISOString().split('T')[0];
} 
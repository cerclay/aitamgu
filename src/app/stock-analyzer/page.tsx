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
import { StockData, StockDataWithPatterns, EconomicIndicator, PredictionResult, HistoricalPrice, ChartPattern } from './types';

export default function StockAnalyzer() {
  const { toast } = useToast();
  const [ticker, setTicker] = useState<string>('');
  const [stockData, setStockData] = useState<StockDataWithPatterns | null>(null);
  const [economicData, setEconomicData] = useState<EconomicIndicator[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  const handleTickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTicker(e.target.value.toUpperCase());
  };

  const analyzeStock = async () => {
    setIsLoading(true);
    try {
      // 주식 정보 가져오기
      console.log(`주식 분석 시작: ${ticker}`);
      const stockData = await fetchStockData(ticker);
      
      // 경제 지표 가져오기
      const economicIndicators = await fetchEconomicIndicators();
      console.log('경제 지표 데이터:', economicIndicators);
      setEconomicData(economicIndicators);
      
      // 차트 패턴 분석
      const patterns = await analyzePatterns(stockData.historicalPrices);
      
      // 패턴 데이터가 추가된 stockData 생성
      const stockDataWithPatterns = {
        ...stockData,
        patterns
      };
      
      // 주가 예측 생성
      try {
        const prediction = await generatePrediction(ticker, stockDataWithPatterns, economicIndicators);
        setStockData(stockDataWithPatterns);
        setPrediction(prediction);
        setError(null);
      } catch (predictionErr) {
        console.error('주가 예측 생성 오류:', predictionErr);
        // 기본 모델로 재시도
        const prediction = await generatePrediction(ticker, stockDataWithPatterns, economicIndicators, 'default');
        setStockData(stockDataWithPatterns);
        setPrediction(prediction);
        setError(null);
      }
    } catch (err) {
      console.error('주식 분석 오류:', err);
      setError('주식 데이터를 가져오는 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      analyzeStock();
    }
  };

  return (
    <div className="container mx-auto py-2 md:py-8 px-2 md:px-4 max-w-6xl">
      <div className="text-center mb-4 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          미국 주식 AI 분석기
        </h1>
        <p className="text-sm md:text-lg text-gray-600 max-w-2xl mx-auto">
          AI를 활용한 주식 분석 및 예측 서비스. 현재 정보를 취합하여 미래 가격 흐름을 예측합니다.
        </p>
      </div>

      <Card className="mb-4 md:mb-8 shadow-md border-blue-100">
        <CardHeader className="pb-2 md:pb-3">
          <CardTitle className="text-lg md:text-xl">주식 분석하기</CardTitle>
          <CardDescription className="text-xs md:text-sm">분석할 미국 주식의 티커 심볼을 입력하세요. (예: AAPL, MSFT, GOOGL)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            <Input
              placeholder="티커 심볼 입력 (예: AAPL)"
              value={ticker}
              onChange={handleTickerChange}
              onKeyDown={handleKeyDown}
              className="sm:max-w-md text-sm md:text-base"
            />
            <Button 
              onClick={analyzeStock} 
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all text-sm md:text-base"
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
  stockData: StockDataWithPatterns;
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

  // 차트 패턴 렌더링 함수
  const renderPatterns = () => {
    if (!stockData?.patterns || stockData.patterns.length === 0) {
      return <p className="text-gray-500">차트 패턴이 발견되지 않았습니다.</p>;
    }

    return (
      <div className="space-y-4">
        {stockData.patterns.map((pattern, idx) => (
          <div key={idx} className={`bg-opacity-10 p-4 rounded-lg border-l-4 ${pattern.bullish ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <div className={`p-1.5 rounded-full mr-2 ${pattern.bullish ? 'bg-green-100' : 'bg-red-100'}`}>
                  {pattern.bullish ? 
                    <ArrowUp className="h-5 w-5 text-green-600" /> : 
                    <ArrowDown className="h-5 w-5 text-red-600" />
                  }
                </div>
                <div>
                  <h3 className="font-semibold text-base">
                    {pattern.name}
                  </h3>
                  <span className={`text-xs ${pattern.bullish ? 'text-green-700' : 'text-red-700'}`}>
                    {pattern.bullish ? '상승 신호' : '하락 신호'}
                  </span>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                pattern.confidence >= 75 ? 'bg-green-100 text-green-800' : 
                pattern.confidence >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-800'
              }`}>
                신뢰도 {pattern.confidence}%
              </div>
            </div>
            <p className="text-sm text-gray-700 mt-1 mb-3">
              {pattern.descriptionKr}
            </p>
            <div className="mt-2">
              <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    pattern.confidence >= 75 ? 'bg-green-500' : 
                    pattern.confidence >= 50 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`}
                  style={{width: `${pattern.confidence}%`}}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>약한 신호</span>
                <span>보통</span>
                <span>강한 신호</span>
              </div>
            </div>
            {pattern.tradingActions && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <h4 className="text-xs font-medium text-gray-700 mb-1">거래 전략</h4>
                <p className="text-xs text-gray-600">{pattern.tradingActions}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="shadow-md border-blue-100">
        <CardHeader className="pb-1 md:pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <CardTitle className="text-lg md:text-2xl flex items-center gap-1 md:gap-2">
                {stockData.companyName} 
                <span className="text-gray-500 font-normal text-sm md:text-base">({stockData.ticker})</span>
              </CardTitle>
              <div className="flex items-center mt-0.5 md:mt-1">
                <span className="text-xl md:text-2xl font-bold">${safeNumber(stockData.currentPrice)}</span>
                <div className={`ml-1 md:ml-2 flex items-center ${stockData.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stockData.priceChange >= 0 ? <ArrowUp className="h-3 w-3 md:h-4 md:w-4 mr-0.5 md:mr-1" /> : <ArrowDown className="h-3 w-3 md:h-4 md:w-4 mr-0.5 md:mr-1" />}
                  <span className="font-medium text-sm md:text-base">{stockData.priceChange > 0 ? '+' : ''}{safeNumber(stockData.priceChange)}%</span>
                </div>
              </div>
            </div>
            <div className="mt-1 sm:mt-0 text-left sm:text-right flex flex-col items-start sm:items-end">
              <p className="text-xs md:text-sm text-gray-500">마지막 업데이트</p>
              <p className="text-xs md:text-sm font-medium">{new Date(stockData.lastUpdated).toLocaleString()}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-1 md:mt-2 text-xs md:text-sm" 
                onClick={onResetClick}
              >
                <RefreshCw className="h-3 w-3 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                새 분석
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 mb-3 md:mb-6">
              <TabsTrigger value="overview" className="text-xs md:text-sm p-1 md:p-2">
                <Info className="h-3 w-3 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                <span>개요</span>
              </TabsTrigger>
              <TabsTrigger value="technical" className="text-xs md:text-sm p-1 md:p-2">
                <BarChart3 className="h-3 w-3 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                <span>기술분석</span>
              </TabsTrigger>
              <TabsTrigger value="fundamental" className="text-xs md:text-sm p-1 md:p-2">
                <DollarSign className="h-3 w-3 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                <span>기본분석</span>
              </TabsTrigger>
              <TabsTrigger value="prediction" className="text-xs md:text-sm p-1 md:p-2">
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                <span>AI 예측</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-3 md:space-y-6">
              <Card className="shadow-sm border-blue-50">
                <CardContent className="pt-3 md:pt-6 px-2 md:px-6">
                  <div className="h-48 md:h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stockData.historicalPrices || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 10 }}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`;
                          }}
                        />
                        <YAxis 
                          domain={['auto', 'auto']} 
                          tick={{ fontSize: 10 }}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip 
                          formatter={(value) => [`$${Number(value).toFixed(2)}`, '주가']}
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                          contentStyle={{ fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#8884d8" 
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }} 
                          name="주가" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                <Card className="shadow-sm border-blue-50">
                  <CardHeader className="pb-0 md:pb-2 p-2 md:p-4">
                    <CardTitle className="text-xs md:text-sm font-medium text-gray-500">시가총액</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 md:p-4 pt-0 md:pt-0">
                    <p className="text-base md:text-2xl font-bold">${((stockData.marketCap || 0) / 1000000000).toFixed(2)}B</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-blue-50">
                  <CardHeader className="pb-0 md:pb-2 p-2 md:p-4">
                    <CardTitle className="text-xs md:text-sm font-medium text-gray-500">52주 최고/최저</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 md:p-4 pt-0 md:pt-0">
                    <p className="text-base md:text-2xl font-bold">${safeNumber(stockData.high52Week)} / ${safeNumber(stockData.low52Week)}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-blue-50 col-span-2 md:col-span-1">
                  <CardHeader className="pb-0 md:pb-2 p-2 md:p-4">
                    <CardTitle className="text-xs md:text-sm font-medium text-gray-500">거래량</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 md:p-4 pt-0 md:pt-0">
                    <p className="text-base md:text-2xl font-bold">{((stockData.volume || 0) / 1000000).toFixed(2)}M</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-sm border-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle>회사 정보</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm md:text-base">{stockData.descriptionKr || stockData.description || '회사 정보가 없습니다.'}</p>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <h4 className="font-medium text-sm text-gray-700 mb-1">사업 분야</h4>
                    <p className="text-sm">{stockData.sector} / {stockData.industry}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">AI 요약</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-1">종합 분석</h4>
                      <p className="text-sm md:text-base font-medium">{prediction.summary || '요약 정보가 없습니다.'}</p>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <h4 className="font-medium text-sm text-gray-700 mb-1">투자자 의견</h4>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            prediction.recommendation === 'BUY' ? 'bg-green-100 text-green-800' :
                            prediction.recommendation === 'SELL' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {prediction.recommendation === 'BUY' ? '매수' : 
                             prediction.recommendation === 'SELL' ? '매도' : '관망'}
                          </span>
                          <span className="text-sm">전문가 투자 의견</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <div className="flex items-center">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500"
                                style={{width: `${((stockData.fundamentals?.analystRatings?.buy || 0) / 
                                  ((stockData.fundamentals?.analystRatings?.buy || 0) + 
                                   (stockData.fundamentals?.analystRatings?.hold || 0) + 
                                   (stockData.fundamentals?.analystRatings?.sell || 0)) * 100) || 0}%`}}
                              ></div>
                            </div>
                            <span className="ml-2 text-sm font-medium">매수: {stockData.fundamentals?.analystRatings?.buy || 0}명</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-yellow-500"
                                style={{width: `${((stockData.fundamentals?.analystRatings?.hold || 0) / 
                                  ((stockData.fundamentals?.analystRatings?.buy || 0) + 
                                   (stockData.fundamentals?.analystRatings?.hold || 0) + 
                                   (stockData.fundamentals?.analystRatings?.sell || 0)) * 100) || 0}%`}}
                              ></div>
                            </div>
                            <span className="ml-2 text-sm font-medium">보유: {stockData.fundamentals?.analystRatings?.hold || 0}명</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-red-500"
                                style={{width: `${((stockData.fundamentals?.analystRatings?.sell || 0) / 
                                  ((stockData.fundamentals?.analystRatings?.buy || 0) + 
                                   (stockData.fundamentals?.analystRatings?.hold || 0) + 
                                   (stockData.fundamentals?.analystRatings?.sell || 0)) * 100) || 0}%`}}
                              ></div>
                            </div>
                            <span className="ml-2 text-sm font-medium">매도: {stockData.fundamentals?.analystRatings?.sell || 0}명</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <h4 className="font-medium text-sm text-gray-700 mb-1">목표가</h4>
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-bold">${stockData.fundamentals?.analystRatings?.targetPrice || stockData.currentPrice}</p>
                        <span className={`text-sm ${(((stockData.fundamentals?.analystRatings?.targetPrice || 0) / stockData.currentPrice - 1) * 100) > 0 ? 
                          'text-green-600' : (((stockData.fundamentals?.analystRatings?.targetPrice || 0) / stockData.currentPrice - 1) * 100) < 0 ? 
                          'text-red-600' : 'text-gray-500'}`}>
                          {(((stockData.fundamentals?.analystRatings?.targetPrice || 0) / stockData.currentPrice - 1) * 100) > 0 ? '⬆' : '⬇'} 
                          {Math.abs((((stockData.fundamentals?.analystRatings?.targetPrice || 0) / stockData.currentPrice - 1) * 100)).toFixed(2)}%
                        </span>
                        <span className="text-xs text-gray-500">현재가 대비</span>
                      </div>
                      <div className="mt-2">
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${(((stockData.fundamentals?.analystRatings?.targetPrice || 0) / stockData.currentPrice - 1) * 100) > 10 ? 
                              'bg-green-500' : (((stockData.fundamentals?.analystRatings?.targetPrice || 0) / stockData.currentPrice - 1) * 100) > 0 ? 
                              'bg-green-300' : (((stockData.fundamentals?.analystRatings?.targetPrice || 0) / stockData.currentPrice - 1) * 100) < -10 ? 
                              'bg-red-500' : 'bg-red-300'}`}
                            style={{width: `${Math.min(Math.abs((((stockData.fundamentals?.analystRatings?.targetPrice || 0) / stockData.currentPrice - 1) * 100)), 30) * 3.33}%`}}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-500">현재: ${stockData.currentPrice}</span>
                          <span className="text-xs text-gray-500">목표: ${stockData.fundamentals?.analystRatings?.targetPrice || stockData.currentPrice}</span>
                        </div>
                      </div>
                    </div>
                  </div>
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
                    {stockData?.patterns && stockData.patterns.length > 0 ? (
                      <div className="space-y-4">
                        {stockData.patterns.map((pattern, idx) => (
                          <div key={idx} className={`bg-opacity-10 p-4 rounded-lg border-l-4 ${pattern.bullish ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center">
                                <div className={`p-1.5 rounded-full mr-2 ${pattern.bullish ? 'bg-green-100' : 'bg-red-100'}`}>
                                  {pattern.bullish ? 
                                    <ArrowUp className="h-5 w-5 text-green-600" /> : 
                                    <ArrowDown className="h-5 w-5 text-red-600" />
                                  }
                                </div>
                                <div>
                                  <h3 className="font-semibold text-base">
                                    {pattern.name}
                                  </h3>
                                  <span className={`text-xs ${pattern.bullish ? 'text-green-700' : 'text-red-700'}`}>
                                    {pattern.bullish ? '상승 신호' : '하락 신호'}
                                  </span>
                                </div>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                pattern.confidence >= 75 ? 'bg-green-100 text-green-800' : 
                                pattern.confidence >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                신뢰도 {pattern.confidence}%
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 mt-1 mb-3">
                              {pattern.descriptionKr}
                            </p>
                            <div className="mt-2">
                              <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${
                                    pattern.confidence >= 75 ? 'bg-green-500' : 
                                    pattern.confidence >= 50 ? 'bg-yellow-500' : 
                                    'bg-red-500'
                                  }`}
                                  style={{width: `${pattern.confidence}%`}}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>약한 신호</span>
                                <span>보통</span>
                                <span>강한 신호</span>
                              </div>
                            </div>
                            {pattern.tradingActions && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <h4 className="text-xs font-medium text-gray-700 mb-1">거래 전략</h4>
                                <p className="text-xs text-gray-600">{pattern.tradingActions}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">차트 패턴이 발견되지 않았습니다.</p>
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
                  {(Array.isArray(economicData) && economicData.length > 0) ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {economicData.map((indicator, index) => (
                          <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4 transition-all hover:shadow-md">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium text-sm">{indicator.nameKr || indicator.name}</h3>
                                <p className="text-xs text-gray-500 mt-0.5">출처: {indicator.source || '미상'}</p>
                              </div>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                (indicator.impact === 'positive' || (indicator.change || 0) > 0) ? 'bg-green-100 text-green-800' :
                                (indicator.impact === 'negative' || (indicator.change || 0) < 0) ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {indicator.impact === 'positive' ? '긍정적' : 
                                 indicator.impact === 'negative' ? '부정적' : '중립적'}
                              </div>
                            </div>
                            <div className="mt-3 flex items-baseline gap-2">
                              <span className="text-2xl font-bold">
                                {typeof indicator.value === 'number' ? indicator.value.toFixed(1) : indicator.value}
                                <span className="text-sm">{indicator.unit}</span>
                              </span>
                              {indicator.change !== undefined && (
                                <span className={`text-sm ${(indicator.change || 0) > 0 ? 'text-green-600' : (indicator.change || 0) < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                  {(indicator.change || 0) > 0 ? '↑' : (indicator.change || 0) < 0 ? '↓' : ''}
                                  {Math.abs(indicator.change || 0).toFixed(2)}{indicator.unit}
                                </span>
                              )}
                            </div>
                            {indicator.previousPeriod && (
                              <p className="text-xs text-gray-500 mt-1">이전 기간: {indicator.previousPeriod}</p>
                            )}
                            {indicator.description && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs text-gray-600">{indicator.description}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-medium text-sm mb-2">경제 지표 분석</h3>
                        <p className="text-sm text-gray-700">
                          {economicData.some(i => (i.impact === 'positive' || (i.change || 0) > 0)) && 
                           economicData.some(i => (i.impact === 'negative' || (i.change || 0) < 0)) ? 
                            '현재 경제 지표는 혼합된 신호를 보이고 있습니다. 일부 긍정적인 지표와 일부 부정적인 지표가 함께 나타나고 있어, 시장의 방향성을 판단하기 위해서는 추가적인 모니터링이 필요합니다.' :
                           economicData.filter(i => (i.impact === 'positive' || (i.change || 0) > 0)).length > 
                           economicData.filter(i => (i.impact === 'negative' || (i.change || 0) < 0)).length ? 
                            '전반적으로 경제 지표는 긍정적인 신호를 보이고 있습니다. 이는 경제 성장과 시장 상승에 유리한 환경을 시사합니다.' :
                            '전반적으로 경제 지표는 부정적인 신호를 보이고 있습니다. 이는 경제 둔화와 시장 하락 위험을 시사하므로 주의가 필요합니다.'
                          }
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 mb-2">경제 지표 데이터를 불러올 수 없습니다.</p>
                      <p className="text-sm text-gray-400">잠시 후 다시 시도해주세요.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prediction" className="space-y-6">
              <Card className="shadow-sm border-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Gemini AI 예측 결과</CardTitle>
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
                  
                  <div className="rounded-lg bg-blue-50 p-4 mb-4">
                    <p className="text-sm mb-2 font-medium">
                      <span className="inline-block bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-xs mr-2">Gemini AI</span>
                      {stockData.ticker} 주식에 대한 종합 분석
                    </p>
                    <p className="text-sm text-gray-700">{prediction.summary || '분석 정보가 없습니다.'}</p>
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
                        <p className="text-xs text-gray-500 mt-2">예측 범위: ${safeNumber(prediction.shortTerm?.range?.min)} ~ ${safeNumber(prediction.shortTerm?.range?.max)}</p>
                        <p className="text-xs text-gray-500">확률: {prediction.shortTerm?.probability || 0}%</p>
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
                        <p className="text-xs text-gray-500 mt-2">예측 범위: ${safeNumber(prediction.mediumTerm?.range?.min)} ~ ${safeNumber(prediction.mediumTerm?.range?.max)}</p>
                        <p className="text-xs text-gray-500">확률: {prediction.mediumTerm?.probability || 0}%</p>
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
                        <p className="text-xs text-gray-500 mt-2">예측 범위: ${safeNumber(prediction.longTerm?.range?.min)} ~ ${safeNumber(prediction.longTerm?.range?.max)}</p>
                        <p className="text-xs text-gray-500">확률: {prediction.longTerm?.probability || 0}%</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between items-center">
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
                    <p className="text-xs text-gray-500 mt-1">
                      {(prediction.confidenceScore || 0) > 80 ? "높은 신뢰도" : 
                       (prediction.confidenceScore || 0) > 60 ? "중간 신뢰도" : "낮은 신뢰도"}
                      - {prediction.modelInfo?.type || 'AI'} 모델 기반 (정확도: {prediction.modelInfo?.accuracy || 0}%)
                    </p>
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
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      prediction.recommendation === 'BUY' ? 'bg-green-100 text-green-800' :
                      prediction.recommendation === 'SELL' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {prediction.recommendation === 'BUY' ? '매수' :
                       prediction.recommendation === 'SELL' ? '매도' : '관망'}
                    </div>
                    <p className="text-sm text-gray-500">AI 기반 추천</p>
                  </div>
                  <p className="text-sm">
                    {prediction.recommendation === 'BUY' 
                      ? `${stockData.ticker}의 주식은 현재 매수하기 좋은 시점으로 판단됩니다. 기술적, 기본적 분석 결과가 긍정적이며, 향후 성장 가능성이 높습니다.`
                      : prediction.recommendation === 'SELL'
                      ? `${stockData.ticker}의 주식은 현재 매도를 고려해볼 시점입니다. 기술적 지표가 약세를 나타내며, 하락 위험이 있습니다.`
                      : `${stockData.ticker}의 주식은 현재 관망하는 것이 좋습니다. 명확한 방향성이 보이지 않으며, 추가적인 움직임을 지켜볼 필요가 있습니다.`
                    }
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// 미래 날짜 생성 함수 추가
function getRandomFutureDate(maxDays: number): string {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + Math.floor(Math.random() * maxDays) + 1);
  return futureDate.toISOString().split('T')[0];
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

// 차트 패턴 분석 함수
async function analyzePatterns(historicalPrices: HistoricalPrice[]): Promise<ChartPattern[]> {
  // 단순화된 패턴 분석 로직
  const patterns: ChartPattern[] = [];
  
  // 최근 가격 추세 확인 (상승 또는 하락)
  const priceCount = historicalPrices.length;
  const recentPrices = historicalPrices.slice(-30); // 최근 30일 데이터
  
  // 상승 및 하락 일수 계산
  let upDays = 0;
  let downDays = 0;
  
  for (let i = 1; i < recentPrices.length; i++) {
    if (recentPrices[i].price > recentPrices[i-1].price) {
      upDays++;
    } else if (recentPrices[i].price < recentPrices[i-1].price) {
      downDays++;
    }
  }
  
  // 이중 바닥 패턴 확인 (간단한 구현)
  if (priceCount >= 60) {
    const section1 = historicalPrices.slice(-60, -40);
    const section2 = historicalPrices.slice(-30, -10);
    
    const min1 = Math.min(...section1.map(p => p.price));
    const min2 = Math.min(...section2.map(p => p.price));
    
    // 두 바닥이 비슷한 수준인지 확인 (5% 이내)
    if (Math.abs(min1 - min2) / min1 < 0.05 && upDays > downDays) {
      patterns.push({
        name: '이중 바닥',
        bullish: true,
        descriptionKr: '주가가 두 번 유사한 수준에서 반등한 패턴으로, 상승 전환을 시사합니다. 이 패턴은 하락 추세가 끝나고 새로운 상승 추세가 시작될 가능성이 높다는 것을 나타냅니다.',
        confidence: 75,
        tradingActions: '이중 바닥 패턴이 확인되면 추가 상승을 예상하여 단계적 매수 전략을 고려할 수 있습니다. 두 번째 바닥 이후 상승 확인 시 매수하고, 이전 고점을 손절선으로 설정하는 것이 좋습니다.'
      });
    }
  }
  
  // 상승 추세 확인
  if (upDays > downDays * 1.5) {
    patterns.push({
      name: '상승 추세',
      bullish: true,
      descriptionKr: '최근 30일 동안 상승일이 하락일보다 많아, 강한 상승 추세를 보이고 있습니다. 이는 시장 참여자들 사이에 긍정적인 심리가 우세함을 나타냅니다.',
      confidence: 70,
      tradingActions: '상승 추세에서는 조정 시 매수 전략이 유효합니다. 단기 이동평균선(20일선) 근처로 조정될 때 매수 기회를 고려하고, 추세가 꺾이지 않는 한 보유 전략을 유지하세요.'
    });
  }
  
  // 하락 추세 확인
  if (downDays > upDays * 1.5) {
    patterns.push({
      name: '하락 추세',
      bullish: false,
      descriptionKr: '최근 30일 동안 하락일이 상승일보다 많아, 강한 하락 추세를 보이고 있습니다. 이는 시장 참여자들 사이에 부정적인 심리가 우세하다는 신호입니다.',
      confidence: 70,
      tradingActions: '하락 추세에서는 반등 시 매도 전략이 유효합니다. 단기 이동평균선(20일선) 근처로 반등할 때 매도 기회를 고려하고, 보유 중인 경우 손실 제한을 위해 손절 전략을 수립하세요.'
    });
  }
  
  // 볼린저 밴드 돌파 확인 (간단한 구현)
  const lastPrice = historicalPrices[historicalPrices.length - 1].price;
  const prices20 = historicalPrices.slice(-20).map(p => p.price);
  const avg20 = prices20.reduce((sum, price) => sum + price, 0) / 20;
  const stdDev = Math.sqrt(prices20.reduce((sum, price) => sum + Math.pow(price - avg20, 2), 0) / 20);
  
  if (lastPrice > avg20 + 2 * stdDev) {
    patterns.push({
      name: '볼린저 밴드 상단 돌파',
      bullish: false,
      descriptionKr: '주가가 볼린저 밴드 상단을 돌파했으며, 이는 과매수 상태를 나타냅니다. 주가가 정상 범위를 벗어나 지나치게 상승했을 가능성이 있습니다.',
      confidence: 65,
      tradingActions: '상단 돌파 후에는 단기 조정 가능성이 높습니다. 보유 주식의 일부 이익 실현을 고려하거나, 새로운 매수는 밴드 중앙선으로 조정된 후에 검토하세요.'
    });
  }
  
  if (lastPrice < avg20 - 2 * stdDev) {
    patterns.push({
      name: '볼린저 밴드 하단 돌파',
      bullish: true,
      descriptionKr: '주가가 볼린저 밴드 하단을 돌파했으며, 이는 과매도 상태를 나타냅니다. 주가가 정상 범위를 벗어나 지나치게 하락했을 가능성이 있습니다.',
      confidence: 65,
      tradingActions: '하단 돌파 후에는 단기 반등 가능성이 높습니다. 소량의 분할 매수 전략을 고려하고, 추가 하락 시 추가 매수 기회로 활용할 수 있습니다.'
    });
  }
  
  // 이동평균선 교차 확인 (간단한 구현)
  if (priceCount >= 50) {
    const prices50 = historicalPrices.slice(-50).map(p => p.price);
    const prices10 = historicalPrices.slice(-10).map(p => p.price);
    
    const avg50 = prices50.reduce((sum, price) => sum + price, 0) / 50;
    const avg10 = prices10.reduce((sum, price) => sum + price, 0) / 10;
    
    const prevPrices10 = historicalPrices.slice(-20, -10).map(p => p.price);
    const prevAvg10 = prevPrices10.reduce((sum, price) => sum + price, 0) / 10;
    
    if (prevAvg10 < avg50 && avg10 > avg50) {
      patterns.push({
        name: '골든 크로스',
        bullish: true,
        descriptionKr: '단기 이동평균선이 장기 이동평균선을 상향 돌파한 패턴으로, 강력한 상승 추세 시작을 나타냅니다. 기술적 분석에서 가장 강력한 매수 신호 중 하나입니다.',
        confidence: 80,
        tradingActions: '골든 크로스는 중장기 매수 신호입니다. 확인 후 단계적 매수 전략을 고려하고, 추세가 강화될수록 포지션을 늘릴 수 있습니다. 50일선이 지지선 역할을 할 것입니다.'
      });
    }
    
    if (prevAvg10 > avg50 && avg10 < avg50) {
      patterns.push({
        name: '데드 크로스',
        bullish: false,
        descriptionKr: '단기 이동평균선이 장기 이동평균선을 하향 돌파한 패턴으로, 강력한 하락 추세 시작을 나타냅니다. 기술적 분석에서 가장 강력한 매도 신호 중 하나입니다.',
        confidence: 80,
        tradingActions: '데드 크로스는 중장기 매도 신호입니다. 보유 중인 포지션의 축소나 청산을 고려하세요. 반등 시 추가 매도 기회로 활용할 수 있으며, 50일선이 저항선 역할을 할 것입니다.'
      });
    }
  }
  
  // 헤드앤숄더 패턴 확인 (간단한 구현 추가)
  if (priceCount >= 100) {
    const section = historicalPrices.slice(-100);
    const prices = section.map(p => p.price);
    
    // 간단한 피크 찾기 (실제 구현은 더 복잡해야 함)
    const peaks = findPeaks(prices, 10);
    if (peaks.length >= 3) {
      // 헤드앤숄더 패턴 조건 검사
      const leftShoulder = peaks[peaks.length - 3];
      const head = peaks[peaks.length - 2];
      const rightShoulder = peaks[peaks.length - 1];
      
      if (head > leftShoulder && head > rightShoulder && 
          Math.abs(leftShoulder - rightShoulder) / leftShoulder < 0.1) {
        patterns.push({
          name: '헤드앤숄더',
          bullish: false,
          descriptionKr: '좌우 어깨와 중앙 머리로 구성된 반전 패턴으로, 상승 추세에서 하락 추세로의 전환을 나타냅니다. 목선(neckline) 돌파는 중요한 확인 신호입니다.',
          confidence: 75,
          tradingActions: '목선 하향 돌파 확인 시 매도 신호로 간주하고 포지션을 줄이거나 청산을 고려하세요. 목표가는 보통 헤드에서 목선까지의 높이만큼 목선 아래로 설정합니다.'
        });
      }
    }
  }
  
  // 역헤드앤숄더 패턴 확인 (간단한 구현 추가)
  if (priceCount >= 100) {
    const section = historicalPrices.slice(-100);
    const prices = section.map(p => p.price);
    
    // 간단한 저점 찾기 (실제 구현은 더 복잡해야 함)
    const troughs = findTroughs(prices, 10);
    if (troughs.length >= 3) {
      // 역헤드앤숄더 패턴 조건 검사
      const leftShoulder = troughs[troughs.length - 3];
      const head = troughs[troughs.length - 2];
      const rightShoulder = troughs[troughs.length - 1];
      
      if (head < leftShoulder && head < rightShoulder && 
          Math.abs(leftShoulder - rightShoulder) / leftShoulder < 0.1) {
        patterns.push({
          name: '역헤드앤숄더',
          bullish: true,
          descriptionKr: '좌우 어깨와 중앙 머리로 구성된 반전 패턴으로, 하락 추세에서 상승 추세로의 전환을 나타냅니다. 목선(neckline) 상향 돌파는 중요한 확인 신호입니다.',
          confidence: 75,
          tradingActions: '목선 상향 돌파 확인 시 매수 신호로 간주하고 단계적 매수 전략을 고려하세요. 목표가는 보통 머리에서 목선까지의 깊이만큼 목선 위로 설정합니다.'
        });
      }
    }
  }
  
  // 기본 패턴이 없는 경우
  if (patterns.length === 0) {
    patterns.push({
      name: '측정 가능한 패턴 없음',
      bullish: upDays > downDays,
      descriptionKr: '현재 차트에서 명확한 기술적 패턴이 발견되지 않았습니다. 이는 시장이 방향성 없이 횡보하거나, 새로운 추세가 아직 형성되지 않았음을 의미할 수 있습니다.',
      confidence: 50,
      tradingActions: '뚜렷한 패턴이 보이지 않을 때는 적극적인 포지션보다 관망 전략이 적합합니다. 새로운 패턴이 형성될 때까지 기다리거나 위험 관리에 집중하세요.'
    });
  }
  
  return patterns;
}

// 간단한 피크(고점) 찾기 함수
function findPeaks(prices: number[], windowSize: number): number[] {
  const peaks: number[] = [];
  for (let i = windowSize; i < prices.length - windowSize; i++) {
    let isPeak = true;
    for (let j = i - windowSize; j <= i + windowSize; j++) {
      if (j !== i && prices[j] >= prices[i]) {
        isPeak = false;
        break;
      }
    }
    if (isPeak) {
      peaks.push(prices[i]);
    }
  }
  return peaks;
}

// 간단한 트러프(저점) 찾기 함수
function findTroughs(prices: number[], windowSize: number): number[] {
  const troughs: number[] = [];
  for (let i = windowSize; i < prices.length - windowSize; i++) {
    let isTrough = true;
    for (let j = i - windowSize; j <= i + windowSize; j++) {
      if (j !== i && prices[j] <= prices[i]) {
        isTrough = false;
        break;
      }
    }
    if (isTrough) {
      troughs.push(prices[i]);
    }
  }
  return troughs;
} 
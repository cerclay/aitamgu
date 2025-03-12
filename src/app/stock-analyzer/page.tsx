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
      const stockResult = await fetchStockData(ticker);
      setStockData(stockResult);
      
      // 경제 지표 데이터 가져오기
      const economicResult = await fetchEconomicIndicators();
      setEconomicData(economicResult);
      
      // AI 예측 생성
      const predictionResult = await generatePrediction(ticker, stockResult, economicResult);
      setPrediction(predictionResult);
      
      toast({
        title: '분석 완료',
        description: `${ticker} 주식에 대한 분석이 완료되었습니다.`,
      });
    } catch (err) {
      console.error('분석 중 오류 발생:', err);
      setError('데이터를 가져오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      toast({
        title: '오류 발생',
        description: '데이터를 가져오는 중 오류가 발생했습니다.',
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
          AI를 활용한 주식 분석 및 예측 서비스. Yahoo Finance 데이터를 기반으로 미래 가격 흐름을 예측합니다.
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
                <span className="text-2xl font-bold">${stockData.currentPrice.toFixed(2)}</span>
                <div className={`ml-2 flex items-center ${stockData.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stockData.priceChange >= 0 ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
                  <span className="font-medium">{stockData.priceChange > 0 ? '+' : ''}{stockData.priceChange.toFixed(2)}%</span>
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
                      <LineChart data={stockData.historicalPrices}>
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
                    <p className="text-xl md:text-2xl font-bold">${(stockData.marketCap / 1000000000).toFixed(2)}B</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">52주 최고/최저</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl md:text-2xl font-bold">${stockData.high52Week.toFixed(2)} / ${stockData.low52Week.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-blue-50 sm:col-span-2 md:col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">거래량</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl md:text-2xl font-bold">{(stockData.volume / 1000000).toFixed(2)}M</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-sm border-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle>회사 정보</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm md:text-base">{stockData.description}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">AI 요약</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm md:text-base font-medium">{prediction.summary}</p>
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
                        <span className={`${getRSIColor(stockData.technicalIndicators.rsi)} font-bold`}>
                          {stockData.technicalIndicators.rsi.toFixed(2)}
                          <span className="ml-2 text-xs font-normal text-gray-500">
                            {getRSIStatus(stockData.technicalIndicators.rsi)}
                          </span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">MACD</p>
                        <span className={`${stockData.technicalIndicators.macd > 0 ? "text-green-600" : "text-red-600"} font-bold`}>
                          {stockData.technicalIndicators.macd.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">MA 50</p>
                        <span className={`${stockData.technicalIndicators.ma50 > stockData.currentPrice ? "text-red-600" : "text-green-600"} font-bold`}>
                          ${stockData.technicalIndicators.ma50.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">MA 200</p>
                        <span className={`${stockData.technicalIndicators.ma200 > stockData.currentPrice ? "text-red-600" : "text-green-600"} font-bold`}>
                          ${stockData.technicalIndicators.ma200.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">볼린저 밴드 (상단)</p>
                        <span className="font-bold">
                          ${stockData.technicalIndicators.bollingerUpper.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-medium">볼린저 밴드 (하단)</p>
                        <span className="font-bold">
                          ${stockData.technicalIndicators.bollingerLower.toFixed(2)}
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
                    {stockData.patterns.length > 0 ? (
                      <div className="space-y-4">
                        {stockData.patterns.map((pattern, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex justify-between items-center mb-1">
                              <p className="font-bold">{pattern.name}</p>
                              <div className={`px-2 py-0.5 rounded-full text-xs ${pattern.bullish ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                {pattern.bullish ? "상승" : "하락"} 신호
                              </div>
                            </div>
                            <p className="text-sm mb-2">{pattern.description}</p>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>신뢰도</span>
                              <span>{pattern.confidence}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div 
                                className={`h-1.5 rounded-full ${pattern.bullish ? "bg-green-500" : "bg-red-500"}`} 
                                style={{ width: `${pattern.confidence}%` }}
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
                          {stockData.fundamentals.pe?.toFixed(2) || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">EPS</p>
                        <span className="font-bold">
                          ${stockData.fundamentals.eps?.toFixed(2) || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">배당 수익률</p>
                        <span className="font-bold">
                          {stockData.fundamentals.dividendYield?.toFixed(2) || '0.00'}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">PEG 비율</p>
                        <span className="font-bold">
                          {stockData.fundamentals.peg?.toFixed(2) || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">ROE</p>
                        <span className="font-bold">
                          {stockData.fundamentals.roe?.toFixed(2) || 'N/A'}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-medium">부채/자본 비율</p>
                        <span className="font-bold">
                          {stockData.fundamentals.debtToEquity?.toFixed(2) || 'N/A'}
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
                          ${(stockData.fundamentals.revenue / 1000000000).toFixed(2)}B
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">매출 성장률</p>
                        <span className={`${stockData.fundamentals.revenueGrowth > 0 ? "text-green-600" : "text-red-600"} font-bold`}>
                          {stockData.fundamentals.revenueGrowth?.toFixed(2) || '0.00'}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">순이익</p>
                        <span className="font-bold">
                          ${(stockData.fundamentals.netIncome / 1000000000).toFixed(2)}B
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">순이익 성장률</p>
                        <span className={`${stockData.fundamentals.netIncomeGrowth > 0 ? "text-green-600" : "text-red-600"} font-bold`}>
                          {stockData.fundamentals.netIncomeGrowth?.toFixed(2) || 'N/A'}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">영업 마진</p>
                        <span className="font-bold">
                          {stockData.fundamentals.operatingMargin?.toFixed(2) || 'N/A'}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-medium">다음 실적 발표</p>
                        <span className="font-bold">
                          {stockData.fundamentals.nextEarningsDate || '미정'}
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
                    {economicData.map((indicator, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <p className="text-sm text-gray-500">{indicator.name}</p>
                        <div className="flex items-end gap-2 mt-1">
                          <p className="text-xl font-bold">
                            {indicator.value.toFixed(1)}{indicator.unit}
                          </p>
                          <span className={`text-sm ${indicator.change > 0 ? "text-green-600" : indicator.change < 0 ? "text-red-600" : "text-gray-500"}`}>
                            {indicator.change > 0 ? "+" : ""}{indicator.change.toFixed(1)}{indicator.unit} ({indicator.previousPeriod})
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">출처: {indicator.source}</p>
                      </div>
                    ))}
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
                          ...stockData.historicalPrices.slice(-30), // 최근 30일간의 실제 데이터
                          ...prediction.pricePredictions // 예측 데이터
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
                          <p className="text-xl font-bold">${prediction.shortTerm.price.toFixed(2)}</p>
                          <span className={`${prediction.shortTerm.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {prediction.shortTerm.change > 0 ? "+" : ""}{prediction.shortTerm.change.toFixed(2)}%
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
                          <p className="text-xl font-bold">${prediction.mediumTerm.price.toFixed(2)}</p>
                          <span className={`${prediction.mediumTerm.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {prediction.mediumTerm.change > 0 ? "+" : ""}{prediction.mediumTerm.change.toFixed(2)}%
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
                          <p className="text-xl font-bold">${prediction.longTerm.price.toFixed(2)}</p>
                          <span className={`${prediction.longTerm.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {prediction.longTerm.change > 0 ? "+" : ""}{prediction.longTerm.change.toFixed(2)}%
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <p className="text-sm text-gray-500">AI 예측 신뢰도</p>
                    <p className="text-sm font-bold">{prediction.confidenceScore}%</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className={`h-2 rounded-full ${
                        prediction.confidenceScore > 80 ? "bg-green-500" : 
                        prediction.confidenceScore > 60 ? "bg-yellow-500" : "bg-red-500"
                      }`} 
                      style={{ width: `${prediction.confidenceScore}%` }}
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
                      {prediction.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start">
                          <div className="rounded-full bg-green-100 p-1 mr-2 mt-0.5">
                            <ArrowUp className="h-3 w-3 text-green-600" />
                          </div>
                          <p className="text-sm">{strength}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="shadow-sm border-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">위험 요소</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {prediction.risks.map((risk, index) => (
                        <li key={index} className="flex items-start">
                          <div className="rounded-full bg-red-100 p-1 mr-2 mt-0.5">
                            <ArrowDown className="h-3 w-3 text-red-600" />
                          </div>
                          <p className="text-sm">{risk}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">투자 추천</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{prediction.recommendation}</p>
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
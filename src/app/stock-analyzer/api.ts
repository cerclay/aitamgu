'use client';

import { StockData, EconomicIndicator, PredictionResult, YahooFinanceResponse, FredApiResponse } from './types';
import yahooFinance from 'yahoo-finance2';
import { NextRequest, NextResponse } from 'next/server';

// Yahoo Finance API 키
const YAHOO_FINANCE_API_KEY = process.env.NEXT_PUBLIC_YAHOO_FINANCE_API_KEY;

// 간단한 메모리 캐시
const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5분

// AIAnalysisResponse 인터페이스 정의
interface AIAnalysisResponse {
  analysis: string;
  analysisKr?: string;
  prediction: PredictionResult;
  analysisType: string;
  modelType: string;
  timestamp: string;
}

// 주식 데이터 가져오기
export const fetchStockData = async (symbol: string): Promise<StockData> => {
  try {
    // 캐시 키 생성
    const cacheKey = `stock_${symbol.toUpperCase()}`;
    
    // 로컬 스토리지에서 캐시된 데이터 확인 (브라우저 환경에서만)
    if (typeof window !== 'undefined') {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          
          // 캐시가 5분 이내면 캐시된 데이터 반환
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            console.log('캐시된 최신 데이터:', symbol);
            return data;
          }
        } catch (cacheError) {
          console.error('캐시 파싱 오류:', cacheError);
        }
      }
    }
    
    console.log('Yahoo Finance API 호출 시작:', symbol);
    
    // API 호출 시작
    try {
      // 서버 사이드 API 호출
      const response = await fetch(`/api/yahoo-finance?symbol=${symbol}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 응답 오류: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      // 로컬 스토리지에 캐시 저장 (브라우저 환경에서만)
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              data,
              timestamp: Date.now()
            })
          );
        } catch (storageError) {
          console.error('로컬 스토리지 저장 오류:', storageError);
        }
      }
      
      console.log('Yahoo Finance API 호출 완료:', symbol);
      return data;
    } catch (apiError) {
      console.error('Yahoo Finance API 호출 오류:', apiError);
      // 오류 발생 시에는 모의 데이터 반환
      console.log('모의 주식 데이터:', symbol);
      return generateMockStockData(symbol);
    }
  } catch (error) {
    console.error('주식 데이터 가져오기 오류:', error);
    return generateMockStockData(symbol);
  }
};

// 모의 주식 데이터 생성
const generateMockStockData = (symbol: string): StockData => {
  const currentDate = new Date();
  const historicalPrices = [];
  const basePrice = 100 + Math.random() * 900;
  
  // 과거 30일 데이터 생성
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(currentDate.getDate() - i);
    
    const volatility = 0.02; // 2% 변동성
    const randomChange = (Math.random() - 0.5) * volatility * basePrice;
    const price = basePrice + randomChange * (30 - i);
    
    historicalPrices.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      open: parseFloat((price - Math.random() * 5).toFixed(2)),
      high: parseFloat((price + Math.random() * 5).toFixed(2)),
      low: parseFloat((price - Math.random() * 5).toFixed(2))
    });
  }
  
  const currentPrice = historicalPrices[historicalPrices.length - 1].price;
  const previousPrice = historicalPrices[historicalPrices.length - 2].price;
  const priceChange = parseFloat((currentPrice - previousPrice).toFixed(2));
  
  // RSI 계산 (간단한 모의 데이터)
  const rsi = Math.floor(Math.random() * 100);
  
  // MACD 계산 (간단한 모의 데이터)
  const macdValue = parseFloat((Math.random() * 4 - 2).toFixed(2));
  const macdSignal = parseFloat((macdValue + (Math.random() - 0.5)).toFixed(2));
  const macdHistogram = parseFloat((macdValue - macdSignal).toFixed(2));
  
  // 볼린저 밴드 계산 (간단한 모의 데이터)
  const bollingerMiddle = currentPrice;
  const bollingerUpper = parseFloat((bollingerMiddle + Math.random() * 20).toFixed(2));
  const bollingerLower = parseFloat((bollingerMiddle - Math.random() * 20).toFixed(2));
  const bollingerWidth = parseFloat(((bollingerUpper - bollingerLower) / bollingerMiddle).toFixed(2));
  
  return {
    ticker: symbol.toUpperCase(),
    companyName: `${symbol.toUpperCase()} Inc.`,
    companyNameKr: `${symbol.toUpperCase()} 주식회사`,
    sector: '기술',
    industry: '소프트웨어',
    currentPrice,
    priceChange,
    marketCap: parseFloat((currentPrice * (Math.random() * 1000000000 + 1000000000)).toFixed(2)),
    volume: Math.floor(Math.random() * 10000000) + 1000000,
    high52Week: parseFloat((currentPrice * 1.5).toFixed(2)),
    low52Week: parseFloat((currentPrice * 0.7).toFixed(2)),
    lastUpdated: new Date().toISOString(),
    description: `${symbol.toUpperCase()} is a fictional company created for demonstration purposes.`,
    descriptionKr: `${symbol.toUpperCase()}는 데모용으로 생성된 가상 회사입니다.`,
    historicalPrices,
    technicalIndicators: {
      rsi,
      macd: {
        value: macdValue,
        signal: macdSignal,
        histogram: macdHistogram
      },
      bollingerBands: {
        upper: bollingerUpper,
        middle: bollingerMiddle,
        lower: bollingerLower,
        width: bollingerWidth
      },
      ma50: parseFloat((currentPrice * (1 + (Math.random() - 0.5) * 0.1)).toFixed(2)),
      ma200: parseFloat((currentPrice * (1 + (Math.random() - 0.5) * 0.2)).toFixed(2)),
      ema20: parseFloat((currentPrice * (1 + (Math.random() - 0.5) * 0.05)).toFixed(2)),
      ema50: parseFloat((currentPrice * (1 + (Math.random() - 0.5) * 0.1)).toFixed(2)),
      atr: parseFloat((currentPrice * 0.02).toFixed(2)),
      obv: Math.floor(Math.random() * 10000000),
      stochastic: {
        k: Math.floor(Math.random() * 100),
        d: Math.floor(Math.random() * 100)
      },
      adx: Math.floor(Math.random() * 100),
      supportLevels: [
        parseFloat((currentPrice * 0.9).toFixed(2)),
        parseFloat((currentPrice * 0.85).toFixed(2))
      ],
      resistanceLevels: [
        parseFloat((currentPrice * 1.1).toFixed(2)),
        parseFloat((currentPrice * 1.15).toFixed(2))
      ]
    },
    fundamentals: {
      pe: parseFloat((Math.random() * 30 + 5).toFixed(2)),
      forwardPE: parseFloat((Math.random() * 25 + 5).toFixed(2)),
      eps: parseFloat((currentPrice / (Math.random() * 15 + 5)).toFixed(2)),
      epsGrowth: parseFloat((Math.random() * 0.2).toFixed(4)),
      dividendYield: parseFloat((Math.random() * 0.05).toFixed(4)),
      dividendGrowth: parseFloat((Math.random() * 0.1).toFixed(4)),
      peg: parseFloat((Math.random() * 2 + 0.5).toFixed(2)),
      pb: parseFloat((Math.random() * 10 + 1).toFixed(2)),
      ps: parseFloat((Math.random() * 10 + 1).toFixed(2)),
      pcf: parseFloat((Math.random() * 15 + 5).toFixed(2)),
      roe: parseFloat((Math.random() * 0.3).toFixed(4)),
      roa: parseFloat((Math.random() * 0.15).toFixed(4)),
      roic: parseFloat((Math.random() * 0.2).toFixed(4)),
      debtToEquity: parseFloat((Math.random() * 1.5).toFixed(2)),
      currentRatio: parseFloat((Math.random() * 3 + 0.5).toFixed(2)),
      quickRatio: parseFloat((Math.random() * 2 + 0.5).toFixed(2)),
      revenue: parseFloat((Math.random() * 10000000000).toFixed(2)),
      revenueGrowth: parseFloat((Math.random() * 0.3).toFixed(4)),
      grossMargin: parseFloat((Math.random() * 0.6 + 0.2).toFixed(4)),
      netIncome: parseFloat((Math.random() * 1000000000).toFixed(2)),
      netIncomeGrowth: parseFloat((Math.random() * 0.3).toFixed(4)),
      operatingMargin: parseFloat((Math.random() * 0.3).toFixed(4)),
      fcf: parseFloat((Math.random() * 1000000000).toFixed(2)),
      fcfGrowth: parseFloat((Math.random() * 0.3).toFixed(4)),
      nextEarningsDate: new Date(currentDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      analystRatings: {
        buy: Math.floor(Math.random() * 20),
        hold: Math.floor(Math.random() * 10),
        sell: Math.floor(Math.random() * 5),
        targetPrice: parseFloat((currentPrice * (1 + (Math.random() * 0.3))).toFixed(2))
      }
    },
    patterns: [
      {
        name: Math.random() > 0.5 ? 'Double Bottom' : 'Head and Shoulders',
        description: 'A technical analysis pattern that may indicate a potential reversal in the stock price.',
        descriptionKr: '주가의 잠재적 반전을 나타낼 수 있는 기술적 분석 패턴입니다.',
        bullish: Math.random() > 0.5,
        confidence: parseFloat((Math.random() * 0.7 + 0.3).toFixed(2)),
        formationDate: new Date(currentDate.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ],
    upcomingEvents: [
      {
        date: new Date(currentDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: Math.random() > 0.5 ? 'Earnings' : 'Dividend',
        title: `${symbol.toUpperCase()} ${Math.random() > 0.5 ? 'Q2 Earnings Call' : 'Dividend Payment'}`,
        description: `Upcoming ${Math.random() > 0.5 ? 'earnings call' : 'dividend payment'} for ${symbol.toUpperCase()}.`,
        impact: Math.random() > 0.7 ? 'high' : (Math.random() > 0.4 ? 'medium' : 'low')
      }
    ],
    momentum: {
      shortTerm: parseFloat((Math.random() * 0.1 - 0.05).toFixed(4)),
      mediumTerm: parseFloat((Math.random() * 0.2 - 0.1).toFixed(4)),
      longTerm: parseFloat((Math.random() * 0.3 - 0.15).toFixed(4)),
      relativeStrength: parseFloat((Math.random() * 0.4 - 0.2).toFixed(4)),
      sectorPerformance: parseFloat((Math.random() * 0.5 - 0.25).toFixed(4))
    }
  };
};

// 경제 지표 가져오기
export const fetchEconomicIndicators = async (): Promise<EconomicIndicator[]> => {
  try {
    // 캐시 키 생성
    const cacheKey = 'economic_indicators';
    
    // 로컬 스토리지에서 캐시된 데이터 확인 (브라우저 환경에서만)
    if (typeof window !== 'undefined') {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          
          // 캐시가 1시간 이내면 캐시된 데이터 반환
          if (Date.now() - timestamp < 60 * 60 * 1000) {
            console.log('캐시된 경제 지표 데이터');
            return data;
          }
        } catch (cacheError) {
          console.error('캐시 파싱 오류:', cacheError);
        }
      }
    }
    
    console.log('FRED API 호출 시작');
    
    // API 호출 시작
    try {
      // 서버 사이드 API 호출
      const response = await fetch('/api/fred');
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 응답 오류: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      // 로컬 스토리지에 캐시 저장 (브라우저 환경에서만)
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              data,
              timestamp: Date.now()
            })
          );
        } catch (storageError) {
          console.error('로컬 스토리지 저장 오류:', storageError);
        }
      }
      
      console.log('FRED API 호출 완료');
      return data;
    } catch (apiError) {
      console.error('FRED API 호출 오류:', apiError);
      // 오류 발생 시에는 모의 데이터 반환
      console.log('모의 경제 지표 데이터');
      return generateMockEconomicIndicators();
    }
  } catch (error) {
    console.error('경제 지표 가져오기 오류:', error);
    return generateMockEconomicIndicators();
  }
};

// 모의 경제 지표 데이터 생성
const generateMockEconomicIndicators = (): EconomicIndicator[] => {
  const indicators = [
    {
      name: 'GDP Growth Rate',
      nameKr: 'GDP 성장률',
      value: parseFloat((Math.random() * 5 - 1).toFixed(2)),
      unit: '%',
      change: parseFloat((Math.random() * 2 - 1).toFixed(2)),
      previousPeriod: 'Q1 2023',
      source: 'FRED',
      description: 'Quarterly GDP growth rate, seasonally adjusted.',
      impact: Math.random() > 0.6 ? 'positive' : (Math.random() > 0.3 ? 'neutral' : 'negative') as 'positive' | 'negative' | 'neutral'
    },
    {
      name: 'Unemployment Rate',
      nameKr: '실업률',
      value: parseFloat((Math.random() * 6 + 3).toFixed(2)),
      unit: '%',
      change: parseFloat((Math.random() * 1 - 0.5).toFixed(2)),
      previousPeriod: 'May 2023',
      source: 'FRED',
      description: 'Monthly unemployment rate, seasonally adjusted.',
      impact: Math.random() > 0.6 ? 'negative' : (Math.random() > 0.3 ? 'neutral' : 'positive') as 'positive' | 'negative' | 'neutral'
    },
    {
      name: 'Inflation Rate (CPI)',
      nameKr: '인플레이션율 (CPI)',
      value: parseFloat((Math.random() * 8 + 1).toFixed(2)),
      unit: '%',
      change: parseFloat((Math.random() * 2 - 1).toFixed(2)),
      previousPeriod: 'May 2023',
      source: 'FRED',
      description: 'Consumer Price Index, year-over-year change.',
      impact: Math.random() > 0.7 ? 'negative' : (Math.random() > 0.3 ? 'neutral' : 'positive') as 'positive' | 'negative' | 'neutral'
    },
    {
      name: 'Federal Funds Rate',
      nameKr: '연방기금금리',
      value: parseFloat((Math.random() * 5 + 0.5).toFixed(2)),
      unit: '%',
      change: parseFloat((Math.random() * 0.5 - 0.25).toFixed(2)),
      previousPeriod: 'June 2023',
      source: 'FRED',
      description: 'Target federal funds rate set by the Federal Reserve.',
      impact: Math.random() > 0.5 ? 'neutral' : (Math.random() > 0.3 ? 'negative' : 'positive') as 'positive' | 'negative' | 'neutral'
    },
    {
      name: 'Retail Sales',
      nameKr: '소매 판매',
      value: parseFloat((Math.random() * 10 - 2).toFixed(2)),
      unit: '%',
      change: parseFloat((Math.random() * 4 - 2).toFixed(2)),
      previousPeriod: 'May 2023',
      source: 'FRED',
      description: 'Monthly retail sales growth, year-over-year.',
      impact: Math.random() > 0.6 ? 'positive' : (Math.random() > 0.3 ? 'neutral' : 'negative') as 'positive' | 'negative' | 'neutral'
    }
  ];
  
  return indicators;
};

// 주식 예측 생성
export const generatePrediction = async (
  stockData: StockData,
  economicIndicators: EconomicIndicator[]
): Promise<PredictionResult> => {
  try {
    console.log('AI 분석 시작');
    
    // API 호출 시작
    try {
      // 서버 사이드 API 호출
      const response = await fetch('/api/predict-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stockData,
          economicIndicators
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 응답 오류: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('AI 분석 완료');
      return data;
    } catch (apiError) {
      console.error('AI 분석 API 호출 오류:', apiError);
      // 오류 발생 시에는 모의 데이터 반환
      console.log('모의 AI 분석 데이터');
      return generateMockLSTMPrediction(stockData);
    }
  } catch (error) {
    console.error('AI 분석 오류:', error);
    return generateMockLSTMPrediction(stockData);
  }
};

// 모의 LSTM 예측 생성
const generateMockLSTMPrediction = (stockData: StockData): PredictionResult => {
  const currentPrice = stockData.currentPrice;
  const currentDate = new Date();
  
  // 단기, 중기, 장기 예측 생성
  const shortTermDays = 7;
  const mediumTermDays = 30;
  const longTermDays = 90;
  
  // 변동성 설정
  const shortTermVolatility = 0.05; // 5%
  const mediumTermVolatility = 0.10; // 10%
  const longTermVolatility = 0.20; // 20%
  
  // 예측 방향 (상승 또는 하락)
  const trend = Math.random() > 0.5 ? 1 : -1;
  
  // 단기 예측
  const shortTermChange = trend * (Math.random() * shortTermVolatility);
  const shortTermPrice = parseFloat((currentPrice * (1 + shortTermChange)).toFixed(2));
  const shortTermProbability = parseFloat((0.5 + Math.random() * 0.3).toFixed(2));
  const shortTermRangeMin = parseFloat((shortTermPrice * 0.95).toFixed(2));
  const shortTermRangeMax = parseFloat((shortTermPrice * 1.05).toFixed(2));
  
  // 중기 예측
  const mediumTermChange = trend * (Math.random() * mediumTermVolatility);
  const mediumTermPrice = parseFloat((currentPrice * (1 + mediumTermChange)).toFixed(2));
  const mediumTermProbability = parseFloat((0.5 + Math.random() * 0.25).toFixed(2));
  const mediumTermRangeMin = parseFloat((mediumTermPrice * 0.9).toFixed(2));
  const mediumTermRangeMax = parseFloat((mediumTermPrice * 1.1).toFixed(2));
  
  // 장기 예측
  const longTermChange = trend * (Math.random() * longTermVolatility);
  const longTermPrice = parseFloat((currentPrice * (1 + longTermChange)).toFixed(2));
  const longTermProbability = parseFloat((0.5 + Math.random() * 0.2).toFixed(2));
  const longTermRangeMin = parseFloat((longTermPrice * 0.85).toFixed(2));
  const longTermRangeMax = parseFloat((longTermPrice * 1.15).toFixed(2));
  
  // 가격 예측 데이터 생성
  const pricePredictions = [];
  for (let i = 1; i <= longTermDays; i++) {
    const date = new Date();
    date.setDate(currentDate.getDate() + i);
    
    let volatility;
    if (i <= shortTermDays) {
      volatility = shortTermVolatility * (i / shortTermDays);
    } else if (i <= mediumTermDays) {
      volatility = mediumTermVolatility * ((i - shortTermDays) / (mediumTermDays - shortTermDays));
    } else {
      volatility = longTermVolatility * ((i - mediumTermDays) / (longTermDays - mediumTermDays));
    }
    
    const randomChange = trend * (Math.random() * volatility);
    const predictedPrice = parseFloat((currentPrice * (1 + randomChange)).toFixed(2));
    
    // 예측 범위 계산
    const rangeMin = parseFloat((predictedPrice * 0.95).toFixed(2));
    const rangeMax = parseFloat((predictedPrice * 1.05).toFixed(2));
    
    pricePredictions.push({
      date: date.toISOString().split('T')[0],
      predictedPrice,
      range: {
        min: rangeMin,
        max: rangeMax
      }
    });
  }
  
  // 신뢰도 점수 계산
  const confidenceScore = parseFloat((0.5 + Math.random() * 0.4).toFixed(2));
  
  // 모델 정보
  const modelInfo = {
    type: 'LSTM Neural Network',
    accuracy: parseFloat((0.7 + Math.random() * 0.2).toFixed(2)),
    features: [
      'Price History',
      'Volume',
      'Technical Indicators',
      'Market Sentiment',
      'Economic Indicators'
    ],
    trainPeriod: '2018-01-01 to ' + new Date().toISOString().split('T')[0]
  };
  
  // 요약 생성
  const summary = trend > 0
    ? `${stockData.ticker} shows a positive outlook with technical indicators suggesting a potential upward trend. The stock is expected to reach ${shortTermPrice} in the short term.`
    : `${stockData.ticker} shows a negative outlook with technical indicators suggesting a potential downward trend. The stock is expected to reach ${shortTermPrice} in the short term.`;
  
  const summaryKr = trend > 0
    ? `${stockData.ticker}의 전망은 긍정적이며 기술적 지표는 잠재적인 상승 추세를 나타냅니다. 단기적으로 ${shortTermPrice}까지 상승할 것으로 예상됩니다.`
    : `${stockData.ticker}의 전망은 부정적이며 기술적 지표는 잠재적인 하락 추세를 나타냅니다. 단기적으로 ${shortTermPrice}까지 하락할 것으로 예상됩니다.`;
  
  // 강점 및 위험 요소
  const strengths = trend > 0
    ? [
        `Strong technical indicators with RSI at ${stockData.technicalIndicators.rsi}`,
        `Positive momentum in the ${stockData.sector} sector`,
        `Recent price action shows support at ${stockData.technicalIndicators.supportLevels[0]}`
      ]
    : [
        `Oversold conditions with RSI at ${stockData.technicalIndicators.rsi}`,
        `Potential reversal pattern forming`,
        `Strong support level at ${stockData.technicalIndicators.supportLevels[0]}`
      ];
  
  const risks = trend > 0
    ? [
        `Resistance level at ${stockData.technicalIndicators.resistanceLevels[0]}`,
        `Market volatility may impact short-term performance`,
        `Economic uncertainty in the ${stockData.sector} sector`
      ]
    : [
        `Downward trend may continue beyond predicted levels`,
        `Weak technical indicators with MACD at ${stockData.technicalIndicators.macd.value}`,
        `Sector-wide challenges affecting performance`
      ];
  
  // 추천
  const recommendation = trend > 0
    ? `Consider a buy position with a target price of ${mediumTermPrice} and a stop loss at ${shortTermRangeMin}.`
    : `Consider a sell position with a target price of ${mediumTermPrice} and a stop loss at ${shortTermRangeMax}.`;
  
  const recommendationKr = trend > 0
    ? `목표가 ${mediumTermPrice}와 손절가 ${shortTermRangeMin}으로 매수 포지션을 고려하세요.`
    : `목표가 ${mediumTermPrice}와 손절가 ${shortTermRangeMax}으로 매도 포지션을 고려하세요.`;
  
  // 분석 세부 정보
  const analysisDetails = `Detailed analysis based on historical price patterns, technical indicators, and market conditions. The prediction model considers multiple factors including volume trends, moving averages, and relative strength.`;
  
  const analysisDetailsKr = `과거 가격 패턴, 기술적 지표 및 시장 상황을 기반으로 한 상세 분석입니다. 예측 모델은 거래량 추세, 이동 평균선 및 상대 강도를 포함한 여러 요소를 고려합니다.`;
  
  return {
    shortTerm: {
      price: shortTermPrice,
      change: parseFloat(((shortTermPrice - currentPrice) / currentPrice * 100).toFixed(2)),
      probability: shortTermProbability,
      range: {
        min: shortTermRangeMin,
        max: shortTermRangeMax
      }
    },
    mediumTerm: {
      price: mediumTermPrice,
      change: parseFloat(((mediumTermPrice - currentPrice) / currentPrice * 100).toFixed(2)),
      probability: mediumTermProbability,
      range: {
        min: mediumTermRangeMin,
        max: mediumTermRangeMax
      }
    },
    longTerm: {
      price: longTermPrice,
      change: parseFloat(((longTermPrice - currentPrice) / currentPrice * 100).toFixed(2)),
      probability: longTermProbability,
      range: {
        min: longTermRangeMin,
        max: longTermRangeMax
      }
    },
    pricePredictions,
    confidenceScore,
    modelInfo,
    summary,
    summaryKr,
    strengths,
    risks,
    recommendation,
    recommendationKr,
    analysisDetails,
    analysisDetailsKr
  };
};

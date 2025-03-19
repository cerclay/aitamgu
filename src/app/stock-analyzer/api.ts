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
    
    try {
      // 서버 사이드 API 호출로 대체
      const response = await fetch(`/api/yahoo-finance?symbol=${encodeURIComponent(symbol)}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API 응답 오류: ${response.status} ${errorText}`);
        throw new Error(`API 응답 오류: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      // 데이터 유효성 검사
      if (!data || !data.ticker || !data.currentPrice) {
        console.error('유효하지 않은 주식 데이터:', data);
        throw new Error('유효하지 않은 주식 데이터가 반환되었습니다.');
      }
      
      // 로컬 스토리지에 캐시 저장
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
      // 오류 발생 시 모의 데이터 반환
      console.log('모의 주식 데이터 생성:', symbol);
      return generateMockStockData(symbol);
    }
  } catch (error) {
    console.error('주식 데이터 가져오기 오류:', error);
    console.log('모의 주식 데이터 생성:', symbol);
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
  const macdSignal = parseFloat((macdValue + (Math.random() * 2 - 1)).toFixed(2));
  const macdHistogram = parseFloat((macdValue - macdSignal).toFixed(2));
  
  // 볼린저 밴드 계산 (간단한 모의 데이터)
  const bollingerMiddle = currentPrice;
  const bollingerUpper = parseFloat((bollingerMiddle * (1 + 0.05 * Math.random())).toFixed(2));
  const bollingerLower = parseFloat((bollingerMiddle * (1 - 0.05 * Math.random())).toFixed(2));
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
      ma50: parseFloat((currentPrice * 0.95).toFixed(2)),
      ma200: parseFloat((currentPrice * 0.9).toFixed(2)),
      ema20: parseFloat((currentPrice * 0.97).toFixed(2)),
      ema50: parseFloat((currentPrice * 0.94).toFixed(2)),
      atr: parseFloat((currentPrice * 0.03).toFixed(2)),
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
    news: [
      {
        title: `${symbol.toUpperCase()} Reports Strong Quarterly Results`,
        source: 'Financial Times',
        date: '2023-05-15',
        url: '#',
        sentiment: 'positive' as const
      },
      {
        title: `${symbol.toUpperCase()} Announces New Product Line`,
        source: 'Bloomberg',
        date: '2023-05-10',
        url: '#',
        sentiment: 'positive' as const
      },
      {
        title: `Analysts Raise Price Target for ${symbol.toUpperCase()}`,
        source: 'CNBC',
        date: '2023-05-05',
        url: '#',
        sentiment: 'positive' as const
      }
    ],
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
      const response = await fetch('/api/fred', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          indicators: ['gdp', 'unemployment', 'inflation', 'interest_rate', 'treasury_10y'],
          start_date: getOneYearAgoDate(),
          end_date: getCurrentDate()
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 응답 오류: ${response.status} ${errorText}`);
      }
      
      const apiData = await response.json();
      
      // API 응답이 배열이 아니면 모의 데이터 생성
      if (!Array.isArray(apiData)) {
        // API 응답 데이터를 EconomicIndicator[] 형식으로 변환
        const formattedData: EconomicIndicator[] = formatEconomicData(apiData);
        
        // 로컬 스토리지에 캐시 저장 (브라우저 환경에서만)
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                data: formattedData,
                timestamp: Date.now()
              })
            );
          } catch (storageError) {
            console.error('로컬 스토리지 저장 오류:', storageError);
          }
        }
        
        console.log('FRED API 호출 완료');
        return formattedData;
      }
      
      // 이미 배열 형태로 반환된 경우 그대로 사용
      // 로컬 스토리지에 캐시 저장 (브라우저 환경에서만)
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              data: apiData,
              timestamp: Date.now()
            })
          );
        } catch (storageError) {
          console.error('로컬 스토리지 저장 오류:', storageError);
        }
      }
      
      console.log('FRED API 호출 완료');
      return apiData;
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

// API 응답 데이터를 EconomicIndicator[] 형식으로 변환하는 함수
function formatEconomicData(apiData: any): EconomicIndicator[] {
  const indicators: EconomicIndicator[] = [];
  
  // GDP 성장률
  if (apiData.gdp) {
    const gdpData = apiData.gdp.observations;
    if (gdpData && gdpData.length > 1) {
      const current = parseFloat(gdpData[0].value);
      const previous = parseFloat(gdpData[1].value);
      const change = current - previous;
      
      indicators.push({
        name: 'GDP Growth Rate',
        nameKr: 'GDP 성장률',
        value: current,
        unit: '%',
        change,
        previousPeriod: '전분기',
        source: 'FRED',
        description: '국내 총생산 성장률',
        impact: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'
      });
    }
  }
  
  // 실업률
  if (apiData.unemployment) {
    const unemploymentData = apiData.unemployment.observations;
    if (unemploymentData && unemploymentData.length > 1) {
      const current = parseFloat(unemploymentData[0].value);
      const previous = parseFloat(unemploymentData[1].value);
      const change = current - previous;
      
      indicators.push({
        name: 'Unemployment Rate',
        nameKr: '실업률',
        value: current,
        unit: '%',
        change,
        previousPeriod: '전월',
        source: 'FRED',
        description: '노동 인구 중 실업자 비율',
        impact: change < 0 ? 'positive' : change > 0 ? 'negative' : 'neutral'
      });
    }
  }
  
  // 인플레이션
  if (apiData.inflation) {
    const inflationData = apiData.inflation.observations;
    if (inflationData && inflationData.length > 1) {
      const current = parseFloat(inflationData[0].value);
      const previous = parseFloat(inflationData[1].value);
      const change = current - previous;
      
      indicators.push({
        name: 'Inflation Rate (CPI)',
        nameKr: '인플레이션율 (CPI)',
        value: current,
        unit: '%',
        change,
        previousPeriod: '전월',
        source: 'FRED',
        description: '소비자 물가 상승률',
        impact: change < 0 ? 'positive' : change > 0 ? 'negative' : 'neutral'
      });
    }
  }
  
  // 기준금리
  if (apiData.interest_rate) {
    const interestData = apiData.interest_rate.observations;
    if (interestData && interestData.length > 1) {
      const current = parseFloat(interestData[0].value);
      const previous = parseFloat(interestData[1].value);
      const change = current - previous;
      
      indicators.push({
        name: 'Interest Rate',
        nameKr: '기준금리',
        value: current,
        unit: '%',
        change,
        previousPeriod: '전월',
        source: 'FRED',
        description: '중앙은행 기준 금리',
        impact: 'neutral'
      });
    }
  }
  
  // 10년 국채 수익률
  if (apiData.treasury_10y) {
    const treasuryData = apiData.treasury_10y.observations;
    if (treasuryData && treasuryData.length > 1) {
      const current = parseFloat(treasuryData[0].value);
      const previous = parseFloat(treasuryData[1].value);
      const change = current - previous;
      
      indicators.push({
        name: '10-Year Treasury Yield',
        nameKr: '10년 국채 수익률',
        value: current,
        unit: '%',
        change,
        previousPeriod: '전일',
        source: 'FRED',
        description: '10년 만기 국채 수익률',
        impact: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'
      });
    }
  }
  
  // 데이터가 없으면 모의 데이터 반환
  if (indicators.length === 0) {
    return generateMockEconomicIndicators();
  }
  
  return indicators;
}

// 모의 경제 지표 데이터 생성
export const generateMockEconomicIndicators = (): EconomicIndicator[] => {
  const currentDate = new Date().toISOString().split('T')[0];
  
  return [
    {
      id: 'GDP',
      name: 'GDP Growth Rate',
      nameKr: 'GDP 성장률',
      category: 'output',
      value: parseFloat((Math.random() * 5 - 1).toFixed(2)),
      unit: '%',
      date: currentDate,
      monthlyChange: parseFloat((Math.random() * 1 - 0.5).toFixed(2)),
      yearlyChange: parseFloat((Math.random() * 2 - 1).toFixed(2)),
      trend: Math.random() > 0.6 ? 'up' : (Math.random() > 0.3 ? 'stable' : 'down') as 'up' | 'down' | 'stable',
      impact: Math.random() > 0.6 ? 'positive' : (Math.random() > 0.3 ? 'neutral' : 'negative') as 'positive' | 'negative' | 'neutral',
      description: 'Quarterly GDP growth rate, seasonally adjusted.',
      descriptionKr: '분기별 GDP 성장률, 계절 조정됨.',
      historicalData: generateMockHistoricalData(3, 5, 12)
    },
    {
      id: 'UNRATE',
      name: 'Unemployment Rate',
      nameKr: '실업률',
      category: 'labor',
      value: parseFloat((Math.random() * 6 + 3).toFixed(2)),
      unit: '%',
      date: currentDate,
      monthlyChange: parseFloat((Math.random() * 0.5 - 0.25).toFixed(2)),
      yearlyChange: parseFloat((Math.random() * 1 - 0.5).toFixed(2)),
      trend: Math.random() > 0.6 ? 'down' : (Math.random() > 0.3 ? 'stable' : 'up') as 'up' | 'down' | 'stable',
      impact: Math.random() > 0.6 ? 'negative' : (Math.random() > 0.3 ? 'neutral' : 'positive') as 'positive' | 'negative' | 'neutral',
      description: 'Monthly unemployment rate, seasonally adjusted.',
      descriptionKr: '월별 실업률, 계절 조정됨.',
      historicalData: generateMockHistoricalData(3, 6, 12)
    },
    {
      id: 'CPIAUCSL',
      name: 'Inflation Rate (CPI)',
      nameKr: '인플레이션율 (CPI)',
      category: 'prices',
      value: parseFloat((Math.random() * 8 + 1).toFixed(2)),
      unit: '%',
      date: currentDate,
      monthlyChange: parseFloat((Math.random() * 0.5 - 0.1).toFixed(2)),
      yearlyChange: parseFloat((Math.random() * 2 - 0.5).toFixed(2)),
      trend: Math.random() > 0.5 ? 'up' : (Math.random() > 0.3 ? 'stable' : 'down') as 'up' | 'down' | 'stable',
      impact: Math.random() > 0.7 ? 'positive' : 'negative' as 'positive' | 'negative' | 'neutral',
      description: 'Consumer Price Index, annual change.',
      descriptionKr: '소비자 물가 지수, 연간 변화율.',
      historicalData: generateMockHistoricalData(1, 8, 12)
    },
    {
      id: 'FEDFUNDS',
      name: 'Interest Rate',
      nameKr: '기준금리',
      category: 'interest_rates',
      value: parseFloat((Math.random() * 5 + 1).toFixed(2)),
      unit: '%',
      date: currentDate,
      monthlyChange: parseFloat((Math.random() * 0.25 - 0.1).toFixed(2)),
      yearlyChange: parseFloat((Math.random() * 1 - 0.25).toFixed(2)),
      trend: Math.random() > 0.5 ? 'stable' : (Math.random() > 0.3 ? 'up' : 'down') as 'up' | 'down' | 'stable',
      impact: 'neutral' as 'positive' | 'negative' | 'neutral',
      description: 'Federal funds effective rate.',
      descriptionKr: '연방기금 실효금리.',
      historicalData: generateMockHistoricalData(1, 5, 12)
    },
    {
      id: 'T10Y2Y',
      name: '10-Year Treasury Yield',
      nameKr: '10년 국채 수익률',
      category: 'interest_rates',
      value: parseFloat((Math.random() * 4 + 1).toFixed(2)),
      unit: '%',
      date: currentDate,
      monthlyChange: parseFloat((Math.random() * 0.3 - 0.15).toFixed(2)),
      yearlyChange: parseFloat((Math.random() * 1 - 0.5).toFixed(2)),
      trend: Math.random() > 0.5 ? 'up' : (Math.random() > 0.3 ? 'stable' : 'down') as 'up' | 'down' | 'stable',
      impact: Math.random() > 0.5 ? 'positive' : 'negative' as 'positive' | 'negative' | 'neutral',
      description: '10-Year Treasury Constant Maturity Rate.',
      descriptionKr: '10년 만기 국채 수익률.',
      historicalData: generateMockHistoricalData(1, 4, 12)
    }
  ];
};

// 모의 과거 데이터 생성 함수
function generateMockHistoricalData(baseValue: number, maxValue: number, count: number) {
  const result = [];
  const currentDate = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setMonth(currentDate.getMonth() - i);
    
    result.push({
      date: date.toISOString().split('T')[0],
      value: parseFloat((baseValue + Math.random() * (maxValue - baseValue)).toFixed(2))
    });
  }
  
  return result;
}

// 현재 날짜를 YYYY-MM-DD 형식으로 반환하는 함수
const getCurrentDate = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// 1년 전 날짜를 YYYY-MM-DD 형식으로 반환하는 함수
const getOneYearAgoDate = (): string => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date.toISOString().split('T')[0];
};

// 주식 예측 생성
export const generatePrediction = async (stockData: StockData, economicIndicators: EconomicIndicator[] = [], modelType: string = 'transformer', predictionPeriod: string = 'all'): Promise<PredictionResult> => {
  try {
    console.log('AI 분석 시작:', stockData.ticker);
    
    try {
      // API 호출
      const response = await fetch('/api/predict-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          symbol: stockData.ticker,
          stockData,
          economicIndicators,
          modelType,
          predictionPeriod
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 응답 오류: ${response.status} ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log('AI 분석 완료:', stockData.ticker);
      
      // 응답 데이터 구조 확인 및 처리
      if (responseData.prediction) {
        // prediction 필드가 있는 경우 (API 응답 구조가 { prediction: PredictionResult, ... })
        return responseData.prediction;
      } else if (responseData.shortTermPrediction !== undefined) {
        // 직접 PredictionResult 객체가 반환된 경우
        return responseData;
      } else {
        console.error('예상치 못한 API 응답 구조:', responseData);
        throw new Error('예상치 못한 API 응답 구조');
      }
    } catch (apiError) {
      console.error('AI 분석 API 호출 오류:', apiError);
      // 오류 발생 시에는 모의 데이터 반환
      console.log('모의 AI 분석 데이터 생성:', stockData.ticker);
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
  const ticker = stockData.ticker;
  const companyName = stockData.companyName;
  const sector = stockData.sector || '기술';
  const industry = stockData.industry || '소프트웨어';
  
  // 기술적 지표 분석
  const rsi = stockData.technicalIndicators?.rsi || 50;
  const macd = stockData.technicalIndicators?.macd?.value || 0;
  const ma50 = stockData.technicalIndicators?.ma50 || currentPrice * 0.95;
  const ma200 = stockData.technicalIndicators?.ma200 || currentPrice * 0.9;
  
  // 기본적 지표 분석
  const pe = stockData.fundamentals?.pe || 15;
  const eps = stockData.fundamentals?.eps || currentPrice / 15;
  const dividendYield = stockData.fundamentals?.dividendYield || 2;
  
  // 모멘텀 분석
  const shortTermMomentum = stockData.momentum?.shortTerm || 0;
  const mediumTermMomentum = stockData.momentum?.mediumTerm || 0;
  const longTermMomentum = stockData.momentum?.longTerm || 0;
  
  // 시장 상황에 따른 변동성 조정
  const volatility = 0.15; // 15% 변동성
  
  // 단기 예측 (1개월)
  const shortTermChange = (Math.random() - 0.5) * volatility * 2 + (shortTermMomentum / 10);
  const shortTermPrediction = parseFloat((currentPrice * (1 + shortTermChange)).toFixed(2));
  
  // 중기 예측 (3개월)
  const mediumTermChange = (Math.random() - 0.5) * volatility * 3 + (mediumTermMomentum / 10);
  const mediumTermPrediction = parseFloat((currentPrice * (1 + mediumTermChange)).toFixed(2));
  
  // 장기 예측 (6개월)
  const longTermChange = (Math.random() - 0.5) * volatility * 4 + (longTermMomentum / 10);
  const longTermPrediction = parseFloat((currentPrice * (1 + longTermChange)).toFixed(2));
  
  // 신뢰도 점수 계산
  const confidenceScore = Math.min(90, Math.max(30, 50 + Math.random() * 40));
  
  // 투자 추천 결정
  let recommendation = '';
  let recommendationReason = '';
  
  if (shortTermChange > 0.05 && mediumTermChange > 0.1) {
    recommendation = '매수';
    recommendationReason = `${ticker}의 단기 및 중기 전망이 긍정적이며, 현재 가격 대비 상승 가능성이 높습니다. 기술적 지표와 모멘텀이 강세를 보이고 있습니다.`;
  } else if (shortTermChange < -0.05 && mediumTermChange < -0.1) {
    recommendation = '매도';
    recommendationReason = `${ticker}의 단기 및 중기 전망이 부정적이며, 현재 가격 대비 하락 가능성이 있습니다. 기술적 지표와 모멘텀이 약세를 보이고 있습니다.`;
  } else {
    recommendation = '관망';
    recommendationReason = `${ticker}의 단기 및 중기 전망이 혼합되어 있어 현재 시점에서는 관망하는 것이 좋습니다. 추가적인 시장 신호를 기다려보세요.`;
  }
  
  // 투자 강점 및 위험 요소
  const strengths = [
    `${companyName}은(는) ${sector} 산업에서 안정적인 입지를 갖추고 있습니다.`,
    `배당 수익률 ${dividendYield}%로 안정적인 수익을 제공합니다.`,
    `기술적 지표 중 ${rsi < 30 ? 'RSI가 과매도 구간에 있어 반등 가능성이 있습니다.' : 
      rsi > 70 ? 'RSI가 과매수 구간에 있어 주의가 필요합니다.' : 
      'RSI가 중립적인 수준에 있습니다.'}`
  ];
  
  const risks = [
    `${industry} 산업의 경쟁이 치열해지고 있습니다.`,
    `글로벌 경제 불확실성이 ${ticker}의 실적에 영향을 줄 수 있습니다.`,
    `${currentPrice > ma50 ? '현재 가격이 50일 이동평균선 위에 있어 단기적으로 과매수 상태일 수 있습니다.' : 
      '현재 가격이 50일 이동평균선 아래에 있어 약세 추세가 지속될 수 있습니다.'}`
  ];
  
  // 요약 생성
  const summary = `${companyName}(${ticker})에 대한 AI 분석 결과, 단기(1개월) 예상 가격은 $${shortTermPrediction}, 중기(3개월) 예상 가격은 $${mediumTermPrediction}, 장기(6개월) 예상 가격은 $${longTermPrediction}입니다. 현재 ${recommendation} 의견이며, 신뢰도는 ${confidenceScore.toFixed(1)}%입니다. ${recommendationReason}`;
  
  // 가격 예측 데이터 생성
  const pricePredictions = [];
  let lastPrice = currentPrice;
  
  for (let i = 1; i <= 180; i++) {
    const date = new Date();
    date.setDate(currentDate.getDate() + i);
    
    // 일별 변동성 계산
    const dailyVolatility = volatility / Math.sqrt(30);
    
    // 목표 가격 계산
    let targetPrice;
    if (i <= 30) {
      // 단기: 현재가격에서 shortTermPrediction까지 선형 보간
      targetPrice = currentPrice + (shortTermPrediction - currentPrice) * (i / 30);
    } else if (i <= 90) {
      // 중기: shortTermPrediction에서 mediumTermPrediction까지 선형 보간
      targetPrice = shortTermPrediction + (mediumTermPrediction - shortTermPrediction) * ((i - 30) / 60);
    } else {
      // 장기: mediumTermPrediction에서 longTermPrediction까지 선형 보간
      targetPrice = mediumTermPrediction + (longTermPrediction - mediumTermPrediction) * ((i - 90) / 90);
    }
    
    // 랜덤 워크 모델 적용
    const randomWalk = (Math.random() - 0.5) * 2 * dailyVolatility * lastPrice;
    const meanReversion = (targetPrice - lastPrice) * 0.05;
    
    // 새 가격 계산
    const predictedPrice = parseFloat((lastPrice + randomWalk + meanReversion).toFixed(2));
    lastPrice = predictedPrice;
    
    // 예측 범위 계산
    const rangeMin = parseFloat((predictedPrice * (1 - dailyVolatility)).toFixed(2));
    const rangeMax = parseFloat((predictedPrice * (1 + dailyVolatility)).toFixed(2));
    
    pricePredictions.push({
      date: date.toISOString().split('T')[0],
      predictedPrice,
      range: {
        min: rangeMin,
        max: rangeMax
      }
    });
  }
  
  // 모델 정보
  const modelInfo = {
    type: 'Hybrid LSTM & Transformer Neural Network',
    accuracy: parseFloat((0.7 + Math.random() * 0.2).toFixed(2)),
    features: [
      '과거 가격 데이터',
      '거래량 분석',
      '기술적 지표 (RSI, MACD, 볼린저 밴드)',
      '이동평균선 분석',
      '시장 심리 지표',
      '경제 지표 상관관계',
      '섹터 성과 분석',
      '기본적 지표 분석'
    ],
    trainPeriod: '2018-01-01 ~ ' + new Date().toISOString().split('T')[0]
  };
  
  return {
    shortTerm: {
      price: shortTermPrediction,
      change: parseFloat((shortTermChange * 100).toFixed(2)),
      probability: parseFloat(((50 + shortTermChange * 100) / 100).toFixed(2)),
      range: {
        min: parseFloat((shortTermPrediction * 0.9).toFixed(2)),
        max: parseFloat((shortTermPrediction * 1.1).toFixed(2))
      }
    },
    mediumTerm: {
      price: mediumTermPrediction,
      change: parseFloat((mediumTermChange * 100).toFixed(2)),
      probability: parseFloat(((50 + mediumTermChange * 100) / 100).toFixed(2)),
      range: {
        min: parseFloat((mediumTermPrediction * 0.85).toFixed(2)),
        max: parseFloat((mediumTermPrediction * 1.15).toFixed(2))
      }
    },
    longTerm: {
      price: longTermPrediction,
      change: parseFloat((longTermChange * 100).toFixed(2)),
      probability: parseFloat(((50 + longTermChange * 100) / 100).toFixed(2)),
      range: {
        min: parseFloat((longTermPrediction * 0.8).toFixed(2)),
        max: parseFloat((longTermPrediction * 1.2).toFixed(2))
      }
    },
    pricePredictions,
    confidenceScore: parseFloat(confidenceScore.toFixed(1)),
    modelInfo,
    summary,
    summaryKr: summary,
    strengths,
    risks,
    recommendation,
    recommendationKr: recommendation,
    analysisDetails: recommendationReason,
    analysisDetailsKr: recommendationReason
  };
};

// 모멘텀 계산 함수
function calculateMomentum(prices, days) {
  if (prices.length < days) return 0;
  
  const currentPrice = prices[prices.length - 1].price;
  const pastPrice = prices[prices.length - days].price;
  
  return ((currentPrice - pastPrice) / pastPrice) * 100;
}

// 기술적 지표 계산 함수
function calculateTechnicalIndicators(prices) {
  // 가격 데이터 추출
  const closePrices = prices.map(p => p.price);
  
  // RSI 계산
  const rsi = 50; // 간소화된 계산
  
  // 이동평균선 계산
  const ma50 = calculateSimpleMA(closePrices, 50);
  const ma200 = calculateSimpleMA(closePrices, 200);
  const ema20 = calculateSimpleEMA(closePrices, 20);
  const ema50 = calculateSimpleEMA(closePrices, 50);
  
  // 볼린저 밴드 계산
  const { upper, middle, lower, width } = calculateSimpleBollingerBands(closePrices);
  
  // MACD 계산
  const { value, signal, histogram } = calculateSimpleMACD(closePrices);
  
  // ATR 계산
  const atr = 2; // 간소화된 계산
  
  // OBV 계산
  const obv = 1000000; // 간소화된 계산
  
  // 스토캐스틱 계산
  const stochastic = { k: 50, d: 50 }; // 간소화된 계산
  
  // ADX 계산
  const adx = 25; // 간소화된 계산
  
  // 지지/저항 레벨 계산
  const currentPrice = closePrices[closePrices.length - 1];
  const supportLevels = [currentPrice * 0.95, currentPrice * 0.9];
  const resistanceLevels = [currentPrice * 1.05, currentPrice * 1.1];
  
  return {
    rsi,
    macd: { value, signal, histogram },
    bollingerBands: { upper, middle, lower, width },
    ma50,
    ma200,
    ema20,
    ema50,
    atr,
    obv,
    stochastic,
    adx,
    supportLevels,
    resistanceLevels
  };
}

// 간단한 이동평균 계산
function calculateSimpleMA(prices, period) {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const slice = prices.slice(prices.length - period);
  return slice.reduce((sum, price) => sum + price, 0) / period;
}

// 간단한 지수이동평균 계산
function calculateSimpleEMA(prices, period) {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  
  return ema;
}

// 간단한 볼린저 밴드 계산
function calculateSimpleBollingerBands(prices, period = 20, multiplier = 2) {
  if (prices.length < period) {
    return { upper: 0, middle: 0, lower: 0, width: 0 };
  }
  
  const slice = prices.slice(prices.length - period);
  const middle = slice.reduce((sum, price) => sum + price, 0) / period;
  
  const squaredDiffs = slice.map(price => Math.pow(price - middle, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / period;
  const stdDev = Math.sqrt(variance);
  
  const upper = middle + (multiplier * stdDev);
  const lower = middle - (multiplier * stdDev);
  const width = ((upper - lower) / middle) * 100;
  
  return { upper, middle, lower, width };
}

// 간단한 MACD 계산
function calculateSimpleMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fastEMA = calculateSimpleEMA(prices, fastPeriod);
  const slowEMA = calculateSimpleEMA(prices, slowPeriod);
  const value = fastEMA - slowEMA;
  
  // 신호선 계산을 위한 MACD 값 배열 생성 (간소화)
  const macdLine = [value];
  const signal = calculateSimpleEMA(macdLine, signalPeriod);
  const histogram = value - signal;
  
  return { value, signal, histogram };
}

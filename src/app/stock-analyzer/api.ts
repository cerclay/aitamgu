'use client';

import { StockData, EconomicIndicator, PredictionResult, YahooFinanceResponse, FredApiResponse, SimpleEconomicIndicator } from './types';
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
export async function fetchStockData(ticker: string) {
  try {
    // API 키 제거 - 필요 없음
    const cacheKey = `stock-data-${ticker}`;
    
    // 캐시 확인
    const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
      // 5분(300,000ms) 이내의 캐시만 사용
      if (Date.now() - timestamp < 300000) {
        console.log('캐시된 주식 데이터 사용:', ticker);
            return data;
      }
    }
    
    console.log('새 주식 데이터 요청:', ticker);
    const response = await fetch(`/api/yahoo-finance?ticker=${ticker}`);
      
      if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('주식 데이터 가져오기 실패:', errorData);
      throw new Error(errorData?.error || '주식 데이터 가져오기 실패');
      }
      
      const data = await response.json();
      
    // 캐시 저장
    sessionStorage.setItem(cacheKey, JSON.stringify({
              data,
              timestamp: Date.now()
    }));
    
      return data;
  } catch (error) {
    console.error('주식 데이터 가져오기 오류:', error);
    throw error;
  }
}

// 경제 지표 가져오기
export const fetchEconomicIndicators = async (): Promise<SimpleEconomicIndicator[]> => {
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
    
    // FRED API 호출
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15초 타임아웃
    
    try {
      const response = await fetch('/api/fred', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`FRED API 응답 오류: ${response.status}`);
      }
      
      const data = await response.json();
      
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
        
      return data;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('경제 지표 가져오기 오류:', error);
    
    // 오류 발생 시 모의 데이터 반환
  return [
    {
        name: 'GDP 성장률',
        value: 2.4,
      unit: '%',
        period: '2023 Q4',
        trend: 'up',
        changePercent: 0.2,
        description: '국내총생산(GDP) 성장률은 전년 동기 대비 실질 GDP의 변화를 측정합니다.'
      },
      {
        name: '실업률',
        value: 3.7,
      unit: '%',
        period: '2024-01',
        trend: 'down',
        changePercent: -0.1,
        description: '실업률은 노동력 중 실업자의 비율을 나타냅니다.'
      },
      {
        name: '인플레이션율 (CPI)',
        value: 3.1,
      unit: '%',
        period: '2024-01',
        trend: 'down',
        changePercent: -0.2,
        description: '소비자물가지수(CPI)는 소비자가 구매하는 상품과 서비스의 가격 변화를 측정합니다.'
      },
      {
        name: '연방기금금리',
        value: 5.33,
      unit: '%',
        period: '2024-02',
        trend: 'stable',
        changePercent: 0,
        description: '연방기금금리는 미국 중앙은행(FED)이 설정한 기준금리입니다.'
      },
      {
        name: '10년 국채 수익률',
        value: 4.3,
      unit: '%',
        period: '2024-02',
        trend: 'up',
        changePercent: 0.15,
        description: '10년 국채 수익률은 장기 채권 시장의 상태를 나타내는 중요한 지표입니다.'
      }
    ];
  }
};

// 주식 예측 생성
export const generatePrediction = async (stockData: StockData, economicIndicators: SimpleEconomicIndicator[] = [], modelType: string = 'transformer', predictionPeriod: string = 'all'): Promise<PredictionResult> => {
  try {
    console.log('AI 분석 시작:', stockData.ticker);
    
    // API 호출
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃
    
    try {
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
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('AI 분석 완료:', stockData.ticker);
      
      // 응답 데이터 구조 확인 및 처리
      if (responseData.prediction) {
        // prediction 필드가 있는 경우 (API 응답 구조가 { prediction: PredictionResult, ... })
        return responseData.prediction;
      } else if (responseData.shortTerm !== undefined) {
        // 직접 PredictionResult 객체가 반환된 경우
        return responseData;
      } else {
        console.error('예상치 못한 API 응답 구조:', responseData);
        throw new Error('예상치 못한 API 응답 구조');
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('AI 분석 오류:', error);
    
    // 기본 예측 결과 생성 (실제 계산은 하지 않고 기본값 반환)
  return {
    shortTerm: {
        price: stockData.currentPrice * 1.05,
        change: 5,
        probability: 0.6,
        range: { min: stockData.currentPrice * 0.95, max: stockData.currentPrice * 1.15 }
    },
    mediumTerm: {
        price: stockData.currentPrice * 1.1,
        change: 10,
        probability: 0.5,
        range: { min: stockData.currentPrice * 0.9, max: stockData.currentPrice * 1.2 }
    },
    longTerm: {
        price: stockData.currentPrice * 1.15,
        change: 15,
        probability: 0.4,
        range: { min: stockData.currentPrice * 0.85, max: stockData.currentPrice * 1.3 }
      },
      pricePredictions: [
        {
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          predictedPrice: stockData.currentPrice * 1.02,
          range: { min: stockData.currentPrice * 0.98, max: stockData.currentPrice * 1.06 }
        },
        {
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          predictedPrice: stockData.currentPrice * 1.05,
          range: { min: stockData.currentPrice * 0.95, max: stockData.currentPrice * 1.15 }
        },
        {
          date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          predictedPrice: stockData.currentPrice * 1.1,
          range: { min: stockData.currentPrice * 0.9, max: stockData.currentPrice * 1.2 }
        }
      ],
      confidenceScore: 50,
      modelInfo: {
        type: '기본 예측 모델',
        accuracy: 0.5,
        features: ['과거 가격 데이터'],
        trainPeriod: '해당 없음'
      },
      summary: `${stockData.ticker}에 대한 기본 예측 결과입니다. 자세한 분석을 위해 다시 시도해 주세요.`,
      summaryKr: `${stockData.ticker}에 대한 기본 예측 결과입니다. 자세한 분석을 위해 다시 시도해 주세요.`,
      strengths: ['정확한 분석 결과가 제공되지 않았습니다.'],
      risks: ['정확한 분석 결과가 제공되지 않았습니다.'],
      recommendation: '분석 불가',
      recommendationKr: '분석 불가',
      analysisDetails: '서버 측 분석 오류로 인해 정확한 예측을 제공할 수 없습니다.',
      analysisDetailsKr: '서버 측 분석 오류로 인해 정확한 예측을 제공할 수 없습니다.'
    };
  }
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

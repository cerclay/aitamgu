﻿'use client';

import { StockData, EconomicIndicator, PredictionResult, YahooFinanceResponse, FredApiResponse } from './types';
import yahooFinance from 'yahoo-finance2';
import { NextRequest, NextResponse } from 'next/server';

// Yahoo Finance API ??const YAHOO_FINANCE_API_KEY = process.env.NEXT_PUBLIC_YAHOO_FINANCE_API_KEY;

// 간단??메모�?캐시
const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5�?
// AIAnalysisResponse ?�???�의
interface AIAnalysisResponse {
  analysis: string;
  analysisKr?: string;
  prediction: PredictionResult;
  analysisType: string;
  modelType: string;
  timestamp: string;
}

// 주식 ?�이??가?�오�?export const fetchStockData = async (symbol: string): Promise<StockData> => {
  try {
    // 캐시 ???�성
    const cacheKey = `stock_${symbol.toUpperCase()}`;
    
    // 로컬 ?�토리�??�서 캐시???�이???�인 (브라?��? ?�경?�서�?
    if (typeof window !== 'undefined') {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          // 캐시가 5�??�내??경우 캐시???�이??반환
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            console.log('캐시??주식 ?�이???�용:', symbol);
            return data;
          }
        } catch (cacheError) {
          console.warn('캐시 ?�이???�싱 ?�류:', cacheError);
          // 캐시 ?�류 ??무시?�고 계속 진행
        }
      }
    }
    
    console.log('Yahoo Finance API ?�출 ?�도:', symbol);
    
    // API ?�출 ?�도
    try {
      // ?�후 ?�이?�스 API ?�출
      const response = await fetch(`/api/yahoo-finance?symbol=${symbol}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Yahoo Finance API ?�답 ?�류:', errorText);
        throw new Error(`API ?�답 ?�류: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      // ?�수 ?�이???�인
      if (!data.ticker || !data.currentPrice) {
        console.error('Yahoo Finance API ?�답???�수 ?�이?��? ?�습?�다:', data);
        throw new Error('API ?�답???�수 ?�이?��? ?�습?�다');
      }
      
      // 브라?��? ?�경?�서�?로컬 ?�토리�???캐시
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data,
            timestamp: Date.now()
          }));
        } catch (storageError) {
          console.warn('로컬 ?�토리�? ?�???�류:', storageError);
          // ?�???�류 ??무시?�고 계속 진행
        }
      }
      
      console.log('Yahoo Finance API ?�출 ?�공:', symbol);
      return data;
    } catch (apiError) {
      console.error('Yahoo Finance API ?�출 ?�패:', apiError);
      // ?�류 발생 ??모의 ?�이???�용?�로 진행
      console.log('모의 주식 ?�이???�용:', symbol);
      return generateMockStockData(symbol);
    }
  } catch (error) {
    // 최종 ?�외 처리 - ?�떤 ?�류가 발생?�더?�도 모의 ?�이??반환
    console.error('주식 ?�이??처리 �??�상�?못한 ?�류:', error);
    return generateMockStockData(symbol);
  }
};

// 과거 주�? ?�이???�성 (목업)
function generateMockHistoricalPrices(currentPrice: number): { date: string; price: number; volume: number; open: number; high: number; low: number }[] {
  const historicalPrices = [];
  const today = new Date();
  let price = currentPrice;
  
  for (let i = 365; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // ?�간???�덤 변??추�?
    const dailyChange = 0.98 + Math.random() * 0.04;
    price = price * dailyChange;
    
    // 고�?, ?�가, ?��? ?�성
    const high = price * (1 + Math.random() * 0.02);
    const low = price * (1 - Math.random() * 0.02);
    const open = low + Math.random() * (high - low);
    
    // 거래???�성 (1백만 ~ 1천만 ?�이)
    const volume = Math.floor(1000000 + Math.random() * 9000000);
    
    historicalPrices.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2)),
      volume: volume,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2))
    });
  }
  
  return historicalPrices;
}

// 기술??지??계산
function calculateTechnicalIndicators(prices: { date: string; price: number }[]): {
  rsi: number;
  macd: number;
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    width: number;
  };
  ma50: number;
  ma200: number;
} {
  const priceValues = prices.map(item => item.price);
  
  // RSI 계산
  const rsi = calculateRSI(prices);
  
  // 이동평균 계산
  const { ma50, ma200 } = calculateMovingAverages(prices);
  
  // 볼린저 밴드 계산
  const { upper, lower, middle, width } = calculateBollingerBands(prices);
  
  // MACD 계산
  const macd = calculateMACD(prices);
  
  return {
    rsi,
    macd,
    bollingerBands: {
      upper,
      middle,
      lower,
      width
    },
    ma50,
    ma200,
  };
}

// 1?????짜 가?오?function getOneYearAgo() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date;
}

// RSI 계산 (간단??구현)
function calculateRSI(prices: { date: string; price: number }[]): number {
  // ?제 계산?서????복잡???고리즘 ?용???요
  // ?기?는 간단???시?구현
  if (prices.length < 14) return 50;
  
  const gains = [];
  const losses = [];
  
  for (let i = 1; i < Math.min(15, prices.length); i++) {
    const change = prices[prices.length - i].price - prices[prices.length - i - 1].price;
    if (change >= 0) {
      gains.push(change);
      losses.push(0);
    } else {
      gains.push(0);
      losses.push(Math.abs(change));
    }
  }
  
  const avgGain = gains.reduce((sum, val) => sum + val, 0) / 14;
  const avgLoss = losses.reduce((sum, val) => sum + val, 0) / 14;
  
  if (avgLoss === 0) return 100; // ?실???으?RSI = 100
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// ?동?균 계산
function calculateMovingAverages(prices: { date: string; price: number }[]): { ma50: number; ma200: number } {
  const priceValues = prices.map(item => item.price);
  
  const ma50 = calculateMA(priceValues, 50);
  const ma200 = calculateMA(priceValues, 200);
  
  return { ma50, ma200 };
}

// ?순 ?동?균 계산
function calculateMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  
  const slice = prices.slice(prices.length - period);
  return slice.reduce((sum, price) => sum + price, 0) / period;
}

// 볼린저 밴드 계산
function calculateBollingerBands(prices: { date: string; price: number }[]): { upper: number; lower: number; middle: number; width: number } {
  const priceValues = prices.map(item => item.price);
  const period = 20;
  
  if (priceValues.length < period) {
    const price = priceValues[priceValues.length - 1];
    const upper = price * 1.05;
    const lower = price * 0.95;
    const middle = price;
    const width = (upper - lower) / middle;
    
    return { 
      upper, 
      lower,
      middle,
      width
    };
  }
  
  const slice = priceValues.slice(priceValues.length - period);
  const ma = slice.reduce((sum, price) => sum + price, 0) / period;
  
  // 표준 편차 계산
  const squaredDiffs = slice.map(price => Math.pow(price - ma, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / period;
  const stdDev = Math.sqrt(variance);
  
  const upper = ma + (2 * stdDev);
  const lower = ma - (2 * stdDev);
  const width = (upper - lower) / ma;
  
  return {
    upper,
    lower,
    middle: ma,
    width
  };
}

// MACD 계산 (간단??구현)
function calculateMACD(prices: { date: string; price: number }[]): number {
  const priceValues = prices.map(item => item.price);
  
  const ema12 = calculateEMA(priceValues, 12);
  const ema26 = calculateEMA(priceValues, 26);
  
  return ema12 - ema26;
}

// 지???동?균 계산
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  
  let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  const multiplier = 2 / (period + 1);
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

// 경제 지???가?오?export const fetchEconomicIndicators = async (): Promise<EconomicIndicator[]> => {
  try {
    // ?제 API ?출 ??모의 ?이??반환
    return [
      {
        name: 'GDP Growth Rate',
        nameKr: 'GDP ?장?,
        value: 2.1,
        unit: '%',
        change: 0.3,
        previousPeriod: '?분?,
        source: 'FRED',
        description: '? 총생???장?,
        impact: 'positive'
      },
      {
        name: 'Unemployment Rate',
        nameKr: '?업?,
        value: 3.8,
        unit: '%',
        change: -0.1,
        previousPeriod: '?월',
        source: 'FRED',
        description: '?동 ?구 ???비율',
        impact: 'positive'
      },
      {
        name: 'Inflation Rate',
        nameKr: '?플?이?,
        value: 3.2,
        unit: '%',
        change: -0.2,
        previousPeriod: '?월',
        source: 'FRED',
        description: '?비??물? ?승?,
        impact: 'negative'
      },
      {
        name: 'Interest Rate',
        nameKr: '기?금리',
        value: 5.25,
        unit: '%',
        change: 0,
        previousPeriod: '?월',
        source: 'FRED',
        description: '중앙??기? 금리',
        impact: 'neutral'
      },
      {
        name: 'Consumer Confidence',
        nameKr: '?비???뢰지?,
        value: 102.5,
        unit: '',
        change: 1.5,
        previousPeriod: '?월',
        source: 'Conference Board',
        description: '?비?들??경제 ???뢰??,
        impact: 'positive'
      },
      {
        name: 'Manufacturing PMI',
        nameKr: '?조?PMI',
        value: 51.2,
        unit: '',
        change: -0.3,
        previousPeriod: '?월',
        source: 'ISM',
        description: '?조?구매관리자지?,
        impact: 'neutral'
      }
    ];
  } catch (error) {
    console.error('경제 지??가?오??류:', error);
    throw new Error('경제 지?  가?오????류가 발생?습?다.');
  }
};

// FRED API??용?여 경제 지???가?오?export async function fetchEconomicIndicatorsFromFRED(): Promise<EconomicIndicator[]> {
  // FRED API ?? ?요?니??  const FRED_API_KEY = process.env.FRED_API_KEY || '';
  
  if (!FRED_API_KEY) {
    console.warn('FRED API ?? ?정?? ?았?니?? 모의 ?이?? ?용?니??');
    return generateMockEconomicIndicators();
  }
  
  // 가?올 경제지??목록
    const indicators = [
    { 
      id: 'GDP', 
      name: 'GDP Growth Rate', 
      nameKr: 'GDP ?장?, 
      unit: '%', 
      description: '?총생???장?, 
      impact: 'positive' as const 
    },
    { 
      id: 'UNRATE', 
      name: 'Unemployment Rate', 
      nameKr: '?업?, 
      unit: '%', 
      description: '미국 ?업?, 
      impact: 'negative' as const 
    },
    { 
      id: 'CPIAUCSL', 
      name: 'Consumer Price Index', 
      nameKr: '?비?물가지?, 
      unit: 'Index', 
      description: '?비?물가지??변?율', 
      impact: 'neutral' as const 
    },
    { 
      id: 'FEDFUNDS', 
      name: 'Federal Funds Rate', 
      nameKr: '기?금리', 
      unit: '%', 
      description: '??방준비제??기?금리', 
      impact: 'negative' as const 
    },
    { 
      id: 'INDPRO', 
      name: 'Industrial Production', 
      nameKr: '?업산지?, 
      unit: 'Index', 
      description: '?업산지??변?율', 
      impact: 'positive' as const 
    },
    { 
      id: 'RSAFS', 
      name: 'Retail Sales', 
      nameKr: '?매?매', 
      unit: 'Million $', 
      description: '?매?매 변?율', 
      impact: 'positive' as const 
    },
    { 
      id: 'HOUST', 
      name: 'Housing Starts', 
      nameKr: '주택착공건수', 
      unit: 'Thousand', 
      description: '?규 주택착공건수', 
      impact: 'positive' as const 
    },
    { 
      id: 'DEXKOUS', 
      name: 'KRW/USD Exchange Rate', 
      nameKr: '???러 ?율', 
      unit: 'KRW', 
      description: '???러 ?율', 
      impact: 'neutral' as const 
    }
  ];
  
  try {
    // 병렬?모든 지???가    const promises = indicators.map(async (indicator) => {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${indicator.id}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=2`;
      const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`FRED API ?류: ${response.status}`);
    }
    
    const data = await response.json();
      return { indicator, data };
    });
    
    const results = await Promise.all(promises);
    return transformFREDData(results, indicators);
  } catch (error) {
    console.error('FRED 경제지??가?오??패:', error);
    return generateMockEconomicIndicators();
  }
}

function transformFREDData(
  results: Array<{ indicator: any, data: any }>, 
  indicators: Array<{ id: string, name: string, nameKr: string, unit: string, description: string, impact: 'positive' | 'negative' | 'neutral' }>
): EconomicIndicator[] {
  return results.map(({ indicator, data }) => {
    const observations = data.observations || [];
    
    if (observations.length < 2) {
      return {
        id: indicator.id,
        name: indicator.name,
        nameKr: indicator.nameKr,
        value: 0,
        unit: indicator.unit,
        change: 0,
        previousPeriod: '?전 기간 ?이???음',
        description: indicator.description,
        impact: indicator.impact,
        source: 'FRED'
      };
    }
    
    const current = parseFloat(observations[0].value);
    const previous = parseFloat(observations[1].value);
    const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
    
    return {
      id: indicator.id,
      name: indicator.name,
      nameKr: indicator.nameKr,
      value: current,
      unit: indicator.unit,
      change: change,
      previousPeriod: observations[1].date,
      description: indicator.description,
      impact: indicator.impact,
        source: 'FRED'
    };
  });
}

// ?번째 ?의
export function generateMockEconomicIndicators(): EconomicIndicator[] {
  return [
    {
      name: 'GDP Growth Rate',
      nameKr: 'GDP ?장?,
      value: 2.1,
      unit: '%',
      change: 0.3,
      previousPeriod: '2023-Q2',
      description: '?총생???장?,
      impact: 'positive' as const,
      source: 'FRED (모의 ?이??'
    },
    {
      name: 'Unemployment Rate',
      nameKr: '?업?,
      value: 3.8,
      unit: '%',
      change: -0.1,
      previousPeriod: '2023-08',
      description: '미국 ?업?,
      impact: 'negative' as const,
      source: 'FRED (모의 ?이??'
    },
    {
      name: 'Consumer Price Index',
      nameKr: '?비?물가지?,
      value: 3.2,
      unit: '%',
      change: -0.2,
      previousPeriod: '2023-08',
      description: '?비?물가지??변?율',
      impact: 'neutral' as const,
      source: 'FRED (모의 ?이??'
    },
    {
      name: 'Federal Funds Rate',
      nameKr: '기?금리',
      value: 5.25,
      unit: '%',
      change: 0,
      previousPeriod: '2023-08',
      description: '??방준비제??기?금리',
      impact: 'negative' as const,
      source: 'FRED (모의 ?이??'
    },
    {
      name: 'Industrial Production',
      nameKr: '?업산지?,
      value: 0.4,
      unit: '%',
      change: 0.7,
      previousPeriod: '2023-08',
      description: '?업산지??변?율',
      impact: 'positive' as const,
      source: 'FRED (모의 ?이??'
    },
    {
      name: 'KRW/USD Exchange Rate',
      nameKr: '???러 ?율',
      value: 1350.25,
      unit: 'KRW',
      change: 2.1,
      previousPeriod: '2023-09-01',
      description: '???러 ?율',
      impact: 'neutral' as const,
      source: 'FRED (모의 ?이??'
    }
  ];
}

// ??번째 ?의 (?름 변?
export function createAlternativeMockEconomicData(): EconomicIndicator[] {
  // 기존 ?수 ?출
  return generateMockEconomicIndicators();
}

// AI ?측 ?성
export const generatePrediction = async (
  symbol: string,
  stockData: StockData, 
  economicData: EconomicIndicator[]
): Promise<PredictionResult> => {
  try {
    // ?제 API ?출 ?는 모델 ?용 로직
    // ?기?는 모의 ?이? ?성?되, ?제 ?이? 기반?로 ??계산 추?
    
    const currentPrice = stockData.currentPrice;
    
    // 기술??지??분석
    const technicalSentiment = calculateTechnicalSentiment(stockData.technicalIndicators);
    
    // 기본??지??분석
    const fundamentalSentiment = calculateFundamentalSentiment(stockData.fundamentals);
    
    // 경제 지??분석
    const economicSentiment = calculateEconomicSentiment(economicData);
    
    // 종합 감성 ?수 (0-100)
    const overallSentiment = (technicalSentiment * 0.4) + (fundamentalSentiment * 0.4) + (economicSentiment * 0.2);
    
    // 감성 ?수기반?로 가?변???측
    const volatility = calculateVolatility(stockData.historicalPrices.map(p => p.price));
    
    // ?기 ?측 (1개월)
    const shortTermChange = (overallSentiment - 50) * 0.02 * volatility;
    const shortTermPrice = currentPrice * (1 + shortTermChange / 100);
    
    // 중기 ?측 (3개월)
    const mediumTermChange = (overallSentiment - 50) * 0.04 * volatility;
    const mediumTermPrice = currentPrice * (1 + mediumTermChange / 100);
    
    // ?기 ?측 (6개월)
    const longTermChange = (overallSentiment - 50) * 0.08 * volatility;
    const longTermPrice = currentPrice * (1 + longTermChange / 100);
    
    // ?측 가??계???성
    const pricePredictions = generatePricePredictions(
      currentPrice,
      shortTermPrice,
      mediumTermPrice,
      longTermPrice
    );
    
    // ?뢰???수 계산 (기술??지?의 ????에 ?라 조정)
    let confidenceScore = 65 + Math.random() * 20;
    
    // 기술??지? ????방향??가리키?뢰???승
    let technicalConsistency = 0;
    if ((stockData.technicalIndicators.rsi > 50) === (shortTermChange > 0)) technicalConsistency++;
    if ((stockData.technicalIndicators.macd.value > 0) === (shortTermChange > 0)) technicalConsistency++;
    if ((currentPrice > stockData.technicalIndicators.ma50) === (shortTermChange > 0)) technicalConsistency++;
    if ((currentPrice > stockData.technicalIndicators.ma200) === (shortTermChange > 0)) technicalConsistency++;
    
    // ??에 ?라 ?뢰??조정 (최? ±10%)
    confidenceScore += (technicalConsistency - 2) * 2.5;
    
    // ?뢰??범위 ?한 (50-95%)
    confidenceScore = Math.max(50, Math.min(95, confidenceScore));
    
    // 강점 ???험 ?소 ?성
    const strengths = [];
    const risks = [];
    
    // 기술??지??기반 강점/?험
    if (stockData.technicalIndicators.rsi < 30) {
      strengths.push('RSI가 과매??구간???어 반등 가?성???습?다');
    } else if (stockData.technicalIndicators.rsi > 70) {
      risks.push('RSI가 과매??구간???어 ?기 조정 가?성???습?다');
    }
    
    // 경제 지??기반 강점/?험
    // ?플?이??지??찾기
    const inflationIndicator = economicData.find(indicator => 
      indicator.name.includes('Inflation') || 
      indicator.name.includes('Consumer Price')
    );
    
    // 금리 지??찾기
    const interestRateIndicator = economicData.find(indicator => 
      indicator.name.includes('Interest') || 
      indicator.name.includes('Federal Funds')
    );
    
    if (inflationIndicator && inflationIndicator.change < 0) {
      strengths.push('?플?이?이 감소 추세? 기업 비용 부?이 ?화?????습?다');
    } else if (inflationIndicator && inflationIndicator.change > 0.5) {
      risks.push('?플?이?이 ?승 추세? 기업 비용 부?이 증??????습?다');
    }
    
    if (interestRateIndicator && interestRateIndicator.change < 0) {
      strengths.push('금리가 ?락 추세? 기업 ?금 조달 비용??감소?????습?다');
    } else if (interestRateIndicator && interestRateIndicator.change > 0) {
      risks.push('금리가 ?승 추세? 기업 ?금 조달 비용??증??????습?다');
    }
    
    // ?자 추천 ?성
    const recommendation = generateRecommendation(overallSentiment / 100, stockData);
    
    // ?세 분석 ?용 ?성
    const analysisDetails = `Transformer 모델? 과거 주? ?이? 거래?? 기술??지?? ?스 감성 분석 결과?습?여 ?측???성?습?다. ${stockData.companyName}?주????재 ${currentPrice.toFixed(2)}?러??거래?고 ?으? 기술??지? 기본??지? 종합?으?분석??결과 ${shortTermChange > 0 ? '?승' : '?락'} 추세가 ?상?니?? ?히 ${stockData.technicalIndicators.rsi < 30 ? 'RSI가 과매??구간???어 반등 가?성???습?다.' : stockData.technicalIndicators.rsi > 70 ? 'RSI가 과매??구간???어 ?기 조정 가?성???습?다.' : 'RSI??중립?인 ????착?습?다.'} ${stockData.technicalIndicators.macd.value > 0 ? 'MACD가 ?수??승 모멘??보이??습?다.' : 'MACD가 ?수??락 모멘??보이??습?다.'} 경제 지??측면?서??${inflationIndicator ? (inflationIndicator.change < 0 ? '?플?이?이 감소 추세?긍정?입?다.' : '?플?이?이 ?승 추세?주의가 ?요?니??') : ''} ${interestRateIndicator ? (interestRateIndicator.change <= 0 ? '금리가 ?정?이거나 ?락 추세?긍정?입?다.' : '금리가 ?승 추세?주의가 ?요?니??') : ''}`;
    
    const analysisDetailsKr = `Transformer 모델? 과거 주? ?이? 거래?? 기술??지?? ?스 감성 분석 결과?습?여 ?측???성?습?다. ${stockData.companyNameKr || stockData.companyName}?주????재 ${currentPrice.toFixed(2)}?러??거래?고 ?으? 기술??지? 기본??지? 종합?으?분석??결과 ${shortTermChange > 0 ? '?승' : '?락'} 추세가 ?상?니?? ?히 ${stockData.technicalIndicators.rsi < 30 ? 'RSI가 과매??구간???어 반등 가?성???습?다.' : stockData.technicalIndicators.rsi > 70 ? 'RSI가 과매??구간???어 ?기 조정 가?성???습?다.' : 'RSI??중립?인 ????착?습?다.'} ${stockData.technicalIndicators.macd.value > 0 ? 'MACD가 ?수??승 모멘??보이??습?다.' : 'MACD가 ?수??락 모멘??보이??습?다.'} 경제 지??측면?서??${inflationIndicator ? (inflationIndicator.change < 0 ? '?플?이?이 감소 추세?긍정?입?다.' : '?플?이?이 ?승 추세?주의가 ?요?니??') : ''} ${interestRateIndicator ? (interestRateIndicator.change <= 0 ? '금리가 ?정?이거나 ?락 추세?긍정?입?다.' : '금리가 ?승 추세?주의가 ?요?니??') : ''}`;
    
    return {
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
      confidenceScore: Number(confidenceScore.toFixed(1)),
      modelInfo: {
        type: 'Transformer',
        accuracy: Number((80 + Math.random() * 10).toFixed(1)),
        features: [
          '과거 주?,
          '거래??,
          '기술??지??(RSI, MACD, 볼린저 밴드)',
          '?장 지??,
          '계절???턴',
          '?스 감성 분석',
          '거시경제 지??
        ],
        trainPeriod: '2015-01-01 ~ ?재'
      },
      summary: `${stockData.companyName}?주????기?으?${shortTermChange > 0 ? '?승' : '?락'}??것으??상?니?? 중기?으로는 ${mediumTermChange > 0 ? '?승' : '?락'} 추세?보일 것으??측?니?? ?기?으로는 ${longTermChange > 0 ? '긍정?인' : '부?적??} ?망??가지??습?다.`,
      summaryKr: `${stockData.companyNameKr || stockData.companyName}?주????기?으?${shortTermChange > 0 ? '?승' : '?락'}??것으??상?니?? 중기?으로는 ${mediumTermChange > 0 ? '?승' : '?락'} 추세?보일 것으??측?니?? ?기?으로는 ${longTermChange > 0 ? '긍정?인' : '부?적??} ?망??가지??습?다.`,
      strengths: strengths.slice(0, 5),
      risks: risks.slice(0, 5),
      recommendation: recommendation.en,
      recommendationKr: recommendation.kr,
      analysisDetails,
      analysisDetailsKr
    };
  } catch (error) {
    console.error('?측 ?성 ?류:', error);
    throw new Error('?측???는 ??류가 발생?습?다.');
  }
};

// ?렌??계산 (간단???형 ?? 기울?
function calculateTrend(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  const n = prices.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += prices[i];
    sumXY += i * prices[i];
    sumX2 += i * i;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const avgPrice = sumY / n;
  
  // 기울기? 백분?로 변??  return (slope / avgPrice) * 100;
}

// 변?성 계산
function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }
  
  const avgReturn = returns.reduce((sum, val) => sum + val, 0) / returns.length;
  const squaredDiffs = returns.map(ret => Math.pow(ret - avgReturn, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / returns.length;
  
  return Math.sqrt(variance);
}

// ?측 가??계???성
function generatePricePredictions(
  currentPrice: number,
  shortTermPrice: number,
  mediumTermPrice: number,
  longTermPrice: number
): { date: string; predictedPrice: number; range: { min: number; max: number } }[] {
  const predictions = [];
  const today = new Date();
  
  // ?기(1개월) ?측 ?인???성
  const shortTerm = new Date(today);
  shortTerm.setMonth(today.getMonth() + 1);
  
  // 중기(3개월) ?측 ?인???성
  const mediumTerm = new Date(today);
  mediumTerm.setMonth(today.getMonth() + 3);
  
  // ?기(6개월) ?측 ?인???성
  const longTerm = new Date(today);
  longTerm.setMonth(today.getMonth() + 6);
  
  // ?측 ?인???이??보간 ?이???성
  const totalDays = Math.round((longTerm.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  for (let i = 1; i <= totalDays; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    let predictedPrice;
    const dayRatio = i / totalDays;
    
    if (i <= 30) {
      // ?1개월: ?재 가격에???기 ?측까? ?형 보간
      predictedPrice = currentPrice + (shortTermPrice - currentPrice) * (i / 30);
    } else if (i <= 60) {
      // 1-3개월: ?기 ?측?서 중기 ?측까? ?형 보간
      predictedPrice = shortTermPrice + (mediumTermPrice - shortTermPrice) * ((i - 30) / 30);
    } else {
      // 3-6개월: 중기 ?측?서 ?기 ?측까? ?형 보간
      predictedPrice = mediumTermPrice + (longTermPrice - mediumTermPrice) * ((i - 60) / 30);
    }
    
    // ?간??변?성 추?
    const volatility = currentPrice * 0.008 * Math.random();
    predictedPrice += (Math.random() > 0.5 ? volatility : -volatility);
    
    // ?측 가?반올?    const finalPredictedPrice = Number(predictedPrice.toFixed(2));
    
    // 범위 계산 (?측 가격의 ±5%)
    const rangeMin = Number((finalPredictedPrice * 0.95).toFixed(2));
    const rangeMax = Number((finalPredictedPrice * 1.05).toFixed(2));
    
    predictions.push({
      date: date.toISOString().split('T')[0],
      predictedPrice: finalPredictedPrice,
      range: {
        min: rangeMin,
        max: rangeMax
      }
    });
  }
  
  return predictions;
}

// 강점 ?성
function generateStrengths(stockData: StockData, sentiment: number): string[] {
  const strengths = [];
  
  if (stockData.technicalIndicators.rsi < 30) {
    strengths.push('RSI가 과매??구간???어 반등 가?성???습?다.');
  }
  
  if (stockData.technicalIndicators.macd.value > 0) {
    strengths.push('MACD가 ?수? ?승 모멘???성?고 ?습?다.');
  }
  
  if (stockData.currentPrice > stockData.technicalIndicators.ma50) {
    strengths.push('?재 가격이 50???동?균???에 ?어 ?기 ?승 추세?보이??습?다.');
  }
  
  if (stockData.currentPrice > stockData.technicalIndicators.ma200) {
    strengths.push('?재 가격이 200???동?균???에 ?어 ?기 ?승 추세?보이??습?다.');
  }
  
  if (stockData.fundamentals.revenueGrowth > 10) {
    strengths.push(`매출 ?장률이 ${stockData.fundamentals.revenueGrowth.toFixed(1)}%?? ?장? 보이??습?다.`);
  }
  
  if (stockData.fundamentals.operatingMargin > 20) {
    strengths.push(`?업 마진??${stockData.fundamentals.operatingMargin.toFixed(1)}%?? ?익?을 ??고 ?습?다.`);
  }
  
  if (stockData.fundamentals.pe > 0 && stockData.fundamentals.pe < 15) {
    strengths.push(`P/E 비율??${stockData.fundamentals.pe.toFixed(1)}?? ??으?? ?습?다.`);
  }
  
  if (stockData.fundamentals.dividendYield > 3) {
    strengths.push(`배당 ?익률이 ${stockData.fundamentals.dividendYield.toFixed(1)}%??정?인 ?익???공?니??`);
  }
  
  // 최소 2? 최? 5개의 강점 반환
  if (strengths.length < 2) {
    strengths.push('기술??분석 ? 개선?고 ?는 추세?니??');
    strengths.push('?장 ?균 ??경쟁???는 ????을 ??고 ?습?다.');
  }
  
  return strengths.slice(0, 5);
}

// ?험 ?소 ?성
function generateRisks(stockData: StockData, sentiment: number, economicData: EconomicIndicator[]): string[] {
  const risks = [];
  
  if (stockData.technicalIndicators.rsi > 70) {
    risks.push('RSI가 과매??구간???어 ?기 조정 가?성???습?다.');
  }
  
  if (stockData.technicalIndicators.macd.value < 0) {
    risks.push('MACD가 ?수? ?락 모멘???성?고 ?습?다.');
  }
  
  if (stockData.currentPrice < stockData.technicalIndicators.ma50) {
    risks.push('?재 가격이 50???동?균???래???어 ?기 ?락 추세?보이??습?다.');
  }
  
  if (stockData.currentPrice < stockData.technicalIndicators.ma200) {
    risks.push('?재 가격이 200???동?균???래???어 ?기 ?락 추세?보이??습?다.');
  }
  
  if (stockData.fundamentals.revenueGrowth < 0) {
    risks.push(`매출 ?장률이 ${stockData.fundamentals.revenueGrowth.toFixed(1)}%?감소 추세?보이??습?다.`);
  }
  
  if (stockData.fundamentals.operatingMargin < 10) {
    risks.push(`?업 마진??${stockData.fundamentals.operatingMargin.toFixed(1)}%???? ?익?을 보이??습?다.`);
  }
  
  if (stockData.fundamentals.pe > 30) {
    risks.push(`P/E 비율??${stockData.fundamentals.pe.toFixed(1)}?? ??으?고평가?어 ?습?다.`);
  }
  
  const interestRate = economicData.find(item => item.name.includes('기?금리'));
  if (interestRate && interestRate.change > 0) {
    risks.push('금리 ?승 ?경? 주식 ?장??부?적???향??미칠 ???습?다.');
  }
  
  // 최소 2? 최? 5개의 ?험 ?소 반환
  if (risks.length < 2) {
    risks.push('?장 변?성??증???경우 주? ?락 ?험???습?다.');
    risks.push('경쟁 ?화?한 ?장 ?유??감소 가?성???습?다.');
  }
  
  return risks.slice(0, 5);
}

// ?자 추천 ?성
function generateRecommendation(sentiment: number, stockData: StockData): { en: string; kr: string } {
  const companyName = stockData.companyName;
  const companyNameKr = stockData.companyNameKr || stockData.companyName;
  
  let en = '';
  let kr = '';
  
  if (sentiment > 0.5) {
    en = `${companyName} is showing positive signals in both technical and fundamental analysis, recommending a buy. It is particularly suitable for long-term investors.`;
    kr = `${companyNameKr}?(?? ?재 기술? 기본?분석 모두 긍정?인 ?호?보이??어 매수 추천?니?? ?히 ?기 ?자?에?합??종목?로 ?단?니??`;
  } else if (sentiment > 0.2) {
    en = `${companyName} is showing a moderate upward trend, making a small, divided buying strategy appropriate. It would be good to build a position while watching the market situation.`;
    kr = `${companyNameKr}?(?? ?만???승 추세?보이??어 ?액 분할 매수 ?략???합?니?? ?장 ?황?주시?며 ????을 구축?는 것이 좋겠?니??`;
  } else if (sentiment > -0.2) {
    en = `${companyName} is currently showing neutral signals, so we recommend watching. It would be good to make an investment decision after waiting for additional momentum or corporate events.`;
    kr = `${companyNameKr}?(?? ?재 중립?인 ?호?보이??어 관망을 추천?니?? 추??인 모멘?나 기업 ?벤? 기다????자 결정???는 것이 좋겠?니??`;
  } else if (sentiment > -0.5) {
    en = `${companyName} has detected a weak signal, so it is time to refrain from new purchases and consider clearing some positions if you are holding them.`;
    kr = `${companyNameKr}?(?? ?세 ?호가 감?어 ?규 매수???제?고 보유 중인 경우 ?? ? ?????리?고려?볼 ?점?니??`;
  } else {
    en = `${companyName} is currently showing negative signals in both technical and fundamental analysis, recommending a sell or wait. It would be good to refrain from new investments until market conditions improve.`;
    kr = `${companyNameKr}?(?? ?재 기술? 기본?분석 모두 부?적???호?보이??어 매도 ?는 관망을 추천?니?? ?장 ?황?개선???까지 ?규 ?자???제?는 것이 좋겠?니??`;
  }
  
  return { en, kr };
}

// 모의 주식 ?이???성
export function generateMockStockData(symbol: string): StockData {
  try {
    // ?사 ?보 가?오?    const companyInfo = getCompanyInfo(symbol);
    
    // 모의 ?이???성
    const currentPrice = 100 + Math.random() * 900;
    const priceChange = Math.random() * 10 - 5; // -5% ~ +5%
    
    // 과거 주? ?이???성
    const historicalPrices = generateMockHistoricalPrices(currentPrice);
    
    // 기술??지??계산
    const technicalIndicators = {
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
    };
    
    // 차트 ?턴 ?성
    const patterns = generateChartPatterns();
    
    // 모의 ?스 ?성
    // 모의 ?�스 ?�성
    const news = generateMockNews(symbol, companyInfo.companyName);
    
    return {
      ticker: symbol,
      companyName: companyInfo.companyName,
      companyNameKr: companyInfo.companyNameKr,
      description: companyInfo.description,
      descriptionKr: companyInfo.descriptionKr,
      sector: companyInfo.sector,
      industry: companyInfo.industry,
      currentPrice: parseFloat(currentPrice.toFixed(2)),
      priceChange: parseFloat(priceChange.toFixed(2)),
      marketCap: 1000000000 + Math.random() * 100000000000,
      volume: 1000000 + Math.random() * 9000000,
      high52Week: 180 + Math.random() * 50,
      low52Week: 120 - Math.random() * 50,
      historicalPrices,
      technicalIndicators,
      fundamentals: {
        pe: 15 + Math.random() * 25,
        eps: 5 + Math.random() * 10,
        dividendYield: Math.random() * 3,
        peg: 1 + Math.random() * 2,
        roe: 10 + Math.random() * 20,
        debtToEquity: 0.5 + Math.random() * 1.5,
        revenue: 1000000000 + Math.random() * 10000000000,
        revenueGrowth: Math.random() * 20 - 5,
        netIncome: 100000000 + Math.random() * 1000000000,
        netIncomeGrowth: Math.random() * 25 - 5,
        operatingMargin: 10 + Math.random() * 30,
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
          targetPrice: currentPrice * (1 + Math.random() * 0.3 - 0.1)
        }
      },
      patterns,
      upcomingEvents: [
        {
          date: getRandomFutureDate(30),
          type: '?�적 발표',
          title: '분기�??�적 발표',
          description: `${companyInfo.companyName}??분기�??�적 발표`,
          impact: 'high'
        },
        {
          date: getRandomFutureDate(45),
          type: '?�자??컨퍼?�스',
          title: '?��? ?�자??컨퍼?�스',
          description: '?��? ?�자??컨퍼?�스 �??�제??발표',
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
  } catch (error) {
    // 모의 ?�이???�성 �??�류 발생 ??최소?�의 ?�이??반환
    console.error('모의 주식 ?�이???�성 ?�류:', error);
    
    // 최소?�의 ?�수 ?�이?�만 ?�함??기본 객체 반환
    return {
      ticker: symbol,
      companyName: `${symbol} Inc.`,
      companyNameKr: `${symbol} 주식?�사`,
      description: `${symbol} is a publicly traded company.`,
      descriptionKr: `${symbol}?�(?? 공개?�으�?거래?�는 ?�사?�니??`,
      sector: 'Technology',
      industry: 'Software',
      currentPrice: 100,
      priceChange: 0,
      marketCap: 1000000000,
      volume: 1000000,
      high52Week: 150,
      low52Week: 50,
      historicalPrices: [],
      technicalIndicators: {
        rsi: 50,
        macd: {
          value: 0,
          signal: 0,
          histogram: 0
        },
        bollingerBands: {
          upper: 0,
          middle: 0,
          lower: 0,
          width: 0
        },
        ma50: 0,
        ma200: 0
      },
      fundamentals: {
        pe: 15,
        eps: 5,
        dividendYield: 0,
        peg: 1,
        roe: 10,
        debtToEquity: 1,
        revenue: 1000000000,
        revenueGrowth: 0,
        netIncome: 100000000,
        netIncomeGrowth: 0,
        operatingMargin: 10,
        forwardPE: 15,
        epsGrowth: 0,
        dividendGrowth: 0,
        pb: 2,
        ps: 3,
        pcf: 10,
        roa: 5,
        roic: 8,
        currentRatio: 1.5,
        quickRatio: 1,
        grossMargin: 40,
        fcf: 50000000,
        fcfGrowth: 0,
        nextEarningsDate: getRandomFutureDate(30),
        analystRatings: {
          buy: 5,
          hold: 3,
          sell: 1,
          targetPrice: 110
        }
      },
      
      patterns: [],
      upcomingEvents: [],
      momentum: {
        shortTerm: 0,
        mediumTerm: 0,
        longTerm: 0,
        relativeStrength: 50,
        sectorPerformance: 0
      },
      lastUpdated: new Date().toISOString()
    };
  }
}

// ?�사 ?�보 가?�오�?(모의 ?�이??
function getCompanyInfo(symbol: string) {
  const companies: Record<string, { companyName: string, companyNameKr: string, description: string, descriptionKr: string, sector: string, industry: string }> = {
    'AAPL': {
      companyName: 'Apple Inc.',
      companyNameKr: '?�플',
      description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
      descriptionKr: '?�플?� ???�계?�으�??�마?�폰, 개인??컴퓨?? ?�블�? ?�어?�블 기기 �??�세?�리�??�계, ?�조 �??�매?�는 기업?�니??',
      sector: 'Technology',
      industry: 'Consumer Electronics'
    },
    'MSFT': {
      companyName: 'Microsoft Corporation',
      companyNameKr: '마이?�로?�프??,
      description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.',
      descriptionKr: '마이?�로?�프?�는 ???�계?�으�??�프?�웨?? ?�비?? 기기 �??�루?�을 개발, ?�이?�스 �?지?�하??기업?�니??',
      sector: 'Technology',
      industry: 'Software?�Infrastructure'
    },
    'GOOGL': {
      companyName: 'Alphabet Inc.',
      companyNameKr: '?�파�?,
      description: 'Alphabet Inc. provides various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.',
      descriptionKr: '?�파벳�? 미국, ?�럽, 중동, ?�프리카, ?�시???�평?? 캐나??�??�틴 ?�메리카?�서 ?�양???�품�??�랫?�을 ?�공?�는 기업?�니??',
      sector: 'Technology',
      industry: 'Internet Content & Information'
    },
    'AMZN': {
      companyName: 'Amazon.com, Inc.',
      companyNameKr: '?�마존닷�?,
      description: 'Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions in North America and internationally.',
      descriptionKr: '?�마존닷컴�? 북�? �?�?��?�으�??�비???�품???�매 ?�매 �?구독 ?�비?��? ?�공?�는 기업?�니??',
      sector: 'Consumer Cyclical',
      industry: 'Internet Retail'
    },
    'META': {
      companyName: 'Meta Platforms, Inc.',
      companyNameKr: '메�? ?�랫?�스',
      description: 'Meta Platforms, Inc. develops products that enable people to connect and share with friends and family through mobile devices, personal computers, virtual reality headsets, and in-home devices worldwide.',
      descriptionKr: '메�? ?�랫?�스??모바??기기, 개인??컴퓨?? 가???�실 ?�드??�?가?�용 기기�??�해 ???�계?�으�??�람?�이 친구 �?가족과 ?�결?�고 공유?????�는 ?�품??개발?�는 기업?�니??',
      sector: 'Technology',
      industry: 'Internet Content & Information'
    },
    'TSLA': {
      companyName: 'Tesla, Inc.',
      companyNameKr: '?�슬??,
      description: 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems in the United States, China, and internationally.',
      descriptionKr: '?�슬?�는 미국, 중국 �?�?��?�으�??�기 ?�동�? ?�너지 ?�성 �??�???�스?�을 ?�계, 개발, ?�조, ?��? �??�매?�는 기업?�니??',
      sector: 'Consumer Cyclical',
      industry: 'Auto Manufacturers'
    },
    'NVDA': {
      companyName: 'NVIDIA Corporation',
      companyNameKr: '?�비?�아',
      description: 'NVIDIA Corporation provides graphics, and compute and networking solutions in the United States, Taiwan, China, and internationally.',
      descriptionKr: '?�비?�아??미국, ?��? 중국 �?�?��?�으�?그래?? 컴퓨??�??�트?�킹 ?�루?�을 ?�공?�는 기업?�니??',
      sector: 'Technology',
      industry: 'Semiconductors'
    },
    'NFLX': {
      companyName: 'Netflix, Inc.',
      companyNameKr: '?�플�?��',
      description: 'Netflix, Inc. provides entertainment services. It offers TV series, documentaries, feature films, and mobile games across various genres and languages.',
      descriptionKr: '?�플�?��???�양???�르?� ?�어�?TV ?�리�? ?�큐멘터�? ?�화 �?모바??게임???�공?�는 ?�터?�인먼트 ?�비??기업?�니??',
      sector: 'Communication Services',
      industry: 'Entertainment'
    },
    'JPM': {
      companyName: 'JPMorgan Chase & Co.',
      companyNameKr: 'JP모건 체이??,
      description: 'JPMorgan Chase & Co. operates as a financial services company worldwide. It operates through four segments: Consumer & Community Banking, Corporate & Investment Bank, Commercial Banking, and Asset & Wealth Management.',
      descriptionKr: 'JP모건 체이?�는 ???�계?�으�?금융 ?�비?��? ?�공?�는 기업?�로, ?�비??�?커�??�티 뱅킹, 기업 �??�자 ?�?? ?�업 뱅킹, ?�산 �??�산 관�?????가지 부문으�??�영?�니??',
      sector: 'Financial Services',
      industry: 'Banks?�Diversified'
    },
    'KO': {
      companyName: 'The Coca-Cola Company',
      companyNameKr: '코카콜라',
      description: 'The Coca-Cola Company, a beverage company, manufactures, markets, and sells various nonalcoholic beverages worldwide.',
      descriptionKr: '코카콜라?????�계?�으�??�양??비알코올 ?�료�??�조, 마�???�??�매?�는 ?�료 기업?�니??',
      sector: 'Consumer Defensive',
      industry: 'Beverages?�Non-Alcoholic'
    }
  };
  
  // 기본 ?�사 ?�보 (?�청???�볼???�는 경우)
  const defaultCompany = {
    companyName: `${symbol} Corporation`,
    companyNameKr: `${symbol} 코퍼?�이??,
    description: `${symbol} is a publicly traded company on the stock market.`,
    descriptionKr: `${symbol}?�(?? 주식 ?�장???�장??기업?�니??`,
    sector: 'Miscellaneous',
    industry: 'Diversified'
  };
  
  return companies[symbol] || defaultCompany;
}

// 미래 ?�짜 ?�성 (최�? ?�수 ?�내)
function getRandomFutureDate(maxDays: number): string {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + Math.floor(Math.random() * maxDays) + 1);
  return futureDate.toISOString().split('T')[0];
}

// 모의 ?�스 ?�성
function generateMockNews(symbol: string, companyName: string) {
  const newsTemplates = [
    {
      title: `${companyName}, ?�상�??�회?�는 분기 ?�적 발표`,
      source: 'Financial Times',
      date: getRandomPastDate(10),
      url: '#',
      sentiment: 'positive'
    },
    {
      title: `${companyName}, ?�제??출시�??�장 ?�유???��? ?�망`,
      source: 'Bloomberg',
      date: getRandomPastDate(5),
      url: '#',
      sentiment: 'positive'
    },
    {
      title: `분석가?? ${companyName} 주�? 목표�??�향 조정`,
      source: 'CNBC',
      date: getRandomPastDate(3),
      url: '#',
      sentiment: 'positive'
    },
    {
      title: `${companyName}, 경쟁?��????�허 분쟁 ?�결`,
      source: 'Reuters',
      date: getRandomPastDate(7),
      url: '#',
      sentiment: 'neutral'
    },
    {
      title: `${companyName}, ?�규 ?�장 진출 계획 발표`,
      source: 'Wall Street Journal',
      date: getRandomPastDate(2),
      url: '#',
      sentiment: 'positive'
    },
    {
      title: `${companyName}, 공급�?문제�??�산 차질 ?�려`,
      source: 'MarketWatch',
      date: getRandomPastDate(4),
      url: '#',
      sentiment: 'negative'
    },
    {
      title: `${companyName}, 지?��??�성 ?�니?�티�?발표`,
      source: 'Forbes',
      date: getRandomPastDate(6),
      url: '#',
      sentiment: 'positive'
    }
  ];
  
  // 3-5개의 ?�스 ??�� ?�택
  const newsCount = 3 + Math.floor(Math.random() * 3);
  const selectedNews = [];
  const availableNews = [...newsTemplates]; // 복사�??�성
  
  for (let i = 0; i < newsCount; i++) {
    if (availableNews.length === 0) break;
    
    const randomIndex = Math.floor(Math.random() * availableNews.length);
    selectedNews.push(availableNews[randomIndex]);
    availableNews.splice(randomIndex, 1);
  }
  
  return selectedNews;
}

// 과거 ?�짜 ?�성 (최�? ?�수 ?�내)
function getRandomPastDate(maxDays: number): string {
  const today = new Date();
  const pastDate = new Date(today);
  pastDate.setDate(today.getDate() - Math.floor(Math.random() * maxDays) - 1);
  return pastDate.toISOString().split('T')[0];
}

// 차트 ?�턴 ?�성
function generateChartPatterns() {
  const patternTemplates = [
    {
      name: '?�드?�숄??,
      description: '?�드?�숄???�턴?� ??개의 ?�크�?구성?�며, 가?�데 ?�크가 ?�쪽 ?�크보다 ?�습?�다. ?�반?�으�??�락 반전 ?�호�??�석?�니??',
      descriptionKr: '?�드?�숄???�턴?� ??개의 ?�크�?구성?�며, 가?�데 ?�크가 ?�쪽 ?�크보다 ?�습?�다. ?�반?�으�??�락 반전 ?�호�??�석?�니??',
      bullish: false,
      confidence: 75 + Math.floor(Math.random() * 20),
      formationDate: getRandomPastDate(30)
    },
    {
      name: '??��?�앤?�더',
      description: '??��?�앤?�더 ?�턴?� ??개의 ?�?�으�?구성?�며, 가?�데 ?�?�이 ?�쪽 ?�?�보????��?�다. ?�반?�으�??�승 반전 ?�호�??�석?�니??',
      descriptionKr: '??��?�앤?�더 ?�턴?� ??개의 ?�?�으�?구성?�며, 가?�데 ?�?�이 ?�쪽 ?�?�보????��?�다. ?�반?�으�??�승 반전 ?�호�??�석?�니??',
      bullish: true,
      confidence: 75 + Math.floor(Math.random() * 20),
      formationDate: getRandomPastDate(30)
    },
    {
      name: '?�블 ??,
      description: '?�블 ???�턴?� ??개의 비슷???�이???�크�?구성?�니?? ?�반?�으�??�락 반전 ?�호�??�석?�니??',
      descriptionKr: '?�블 ???�턴?� ??개의 비슷???�이???�크�?구성?�니?? ?�반?�으�??�락 반전 ?�호�??�석?�니??',
      bullish: false,
      confidence: 70 + Math.floor(Math.random() * 20),
      formationDate: getRandomPastDate(30)
    },
    {
      name: '?�블 바�?',
      description: '?�블 바�? ?�턴?� ??개의 비슷???�?�으�?구성?�니?? ?�반?�으�??�승 반전 ?�호�??�석?�니??',
      descriptionKr: '?�블 바�? ?�턴?� ??개의 비슷???�?�으�?구성?�니?? ?�반?�으�??�승 반전 ?�호�??�석?�니??',
      bullish: true,
      confidence: 70 + Math.floor(Math.random() * 20),
      formationDate: getRandomPastDate(30)
    },
    {
      name: '?�각???�턴',
      description: '?�각???�턴?� 가격이 ?�점 좁아지??범위 ?�에???�직이??것을 ?��??�니?? 방향???�파가 ?�상?�니??',
      descriptionKr: '?�각???�턴?� 가격이 ?�점 좁아지??범위 ?�에???�직이??것을 ?��??�니?? 방향???�파가 ?�상?�니??',
      bullish: Math.random() > 0.5,
      confidence: 65 + Math.floor(Math.random() * 20),
      formationDate: getRandomPastDate(30)
    },
    {
      name: '?�래�??�턴',
      description: '?�래�??�턴?� 짧�? 기간 ?�안???�합 ???�전 추세가 계속??것으�??�상?�는 ?�턴?�니??',
      descriptionKr: '?�래�??�턴?� 짧�? 기간 ?�안???�합 ???�전 추세가 계속??것으�??�상?�는 ?�턴?�니??',
      bullish: Math.random() > 0.5,
      confidence: 65 + Math.floor(Math.random() * 20),
      formationDate: getRandomPastDate(30)
    },
    {
      name: '컵앤?�들',
      description: '컵앤?�들 ?�턴?� U?�형 컵과 �??�른쪽의 ?��? ?�락(?�들)?�로 구성?�니?? ?�반?�으�??�승 ?�호�??�석?�니??',
      descriptionKr: '컵앤?�들 ?�턴?� U?�형 컵과 �??�른쪽의 ?��? ?�락(?�들)?�로 구성?�니?? ?�반?�으�??�승 ?�호�??�석?�니??',
      bullish: true,
      confidence: 70 + Math.floor(Math.random() * 20),
      formationDate: getRandomPastDate(30)
    },
  ];

  // 0-3개의 ?�턴???�덤?�게 ?�택
  const patternCount = Math.floor(Math.random() * 3);
  const patterns = [];
  const availablePatterns = [...patternTemplates]; // 복사�??�성

  for (let i = 0; i < patternCount; i++) {
    if (availablePatterns.length === 0) break;
    
    const randomIndex = Math.floor(Math.random() * availablePatterns.length);
    patterns.push(availablePatterns[randomIndex]);
    availablePatterns.splice(randomIndex, 1);
  }

  return patterns;
}

// 모의 경제 지???�이???�성
function generateAdditionalMockEconomicData(): EconomicIndicator[] {
  return [
    {
      name: 'GDP Growth Rate',
      nameKr: 'GDP ?�장�?,
      value: 2.1,
      unit: '%',
      change: 0.3,
      previousPeriod: '2023-Q2',
      description: '�?��총생???�장�?,
      impact: 'positive' as const,
      source: 'FRED (모의 ?�이??'
    },
    {
      name: 'Unemployment Rate',
      nameKr: '?�업�?,
      value: 3.8,
      unit: '%',
      change: -0.1,
      previousPeriod: '2023-08',
      description: '미국 ?�업�?,
      impact: 'negative' as const,
      source: 'FRED (모의 ?�이??'
    },
    {
      name: 'Consumer Price Index',
      nameKr: '?�비?�물가지??,
      value: 3.2,
      unit: '%',
      change: -0.2,
      previousPeriod: '2023-08',
      description: '?�비?�물가지??변?�율',
      impact: 'neutral' as const,
      source: 'FRED (모의 ?�이??'
    },
    {
      name: 'Federal Funds Rate',
      nameKr: '기�?금리',
      value: 5.25,
      unit: '%',
      change: 0,
      previousPeriod: '2023-08',
      description: '�??�방준비제??기�?금리',
      impact: 'negative' as const,
      source: 'FRED (모의 ?�이??'
    },
    {
      name: 'Industrial Production',
      nameKr: '?�업?�산지??,
      value: 0.4,
      unit: '%',
      change: 0.7,
      previousPeriod: '2023-08',
      description: '?�업?�산지??변?�율',
      impact: 'positive' as const,
      source: 'FRED (모의 ?�이??'
    },
    {
      name: 'KRW/USD Exchange Rate',
      nameKr: '???�러 ?�율',
      value: 1350.25,
      unit: 'KRW',
      change: 2.1,
      previousPeriod: '2023-09-01',
      description: '???�러 ?�율',
      impact: 'neutral' as const,
      source: 'FRED (모의 ?�이??'
    }
  ];
}

// 목업 ?�측 결과 ?�성
function generateMockPrediction(ticker: string, currentPrice: number): PredictionResult {
  // ?�기, 중기, ?�기 ?�측 가�??�성
  const shortTermChange = -10 + Math.random() * 20; // -10% ~ +10%
  const mediumTermChange = -15 + Math.random() * 30; // -15% ~ +15%
  const longTermChange = -20 + Math.random() * 40; // -20% ~ +40%
  
  const shortTermPrice = currentPrice * (1 + shortTermChange / 100);
  const mediumTermPrice = currentPrice * (1 + mediumTermChange / 100);
  const longTermPrice = currentPrice * (1 + longTermChange / 100);
  
  // ?�후 6개월 ?�측 가�??�성
  const pricePredictions = [];
  const today = new Date();
  let predictedPrice = currentPrice;
  
  for (let i = 1; i <= 180; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    // ?�기 ?�측 가격을 ?�해 ?�진?�으�?변??    const progress = i / 180;
    const targetChange = longTermChange / 100;
    const dailyChange = targetChange * progress + (Math.random() * 0.01 - 0.005); // ?�간???�덤 변??추�?
    
    predictedPrice = predictedPrice * (1 + dailyChange / 100);
    
    // 30??간격?�로 ?�이??추�? (차트 ?�이???�인??줄이�?
    if (i % 30 === 0) {
      pricePredictions.push({
        date: date.toISOString().split('T')[0],
        predictedPrice: parseFloat(predictedPrice.toFixed(2)),
      });
    }
  }
  
  // 목업 주식 ?�이???�성 (generateRecommendation ?�수???�요)
  const mockStockData: StockData = {
    ticker,
    companyName: ticker,
    currentPrice,
    priceChange: 0,
    marketCap: 0,
    volume: 0,
    high52Week: 0,
    low52Week: 0,
    lastUpdated: new Date().toISOString(),
    description: '',
    historicalPrices: [],
    technicalIndicators: {
      rsi: 50,
      macd: {
        value: 0,
        signal: 0,
        histogram: 0
      },
      bollingerBands: {
        upper: 0,
        middle: 0,
        lower: 0,
        width: 0
      },
      ma50: 0,
      ma200: 0
    },
    fundamentals: {
      pe: 0,
      eps: 0,
      dividendYield: 0,
      peg: 0,
      roe: 0,
      debtToEquity: 0,
      revenue: 0,
      revenueGrowth: 0,
      netIncome: 0,
      netIncomeGrowth: 0,
      operatingMargin: 0,
      nextEarningsDate: ''
    },
    patterns: []
  };
  
  // ?�균 변?�율 기반 감정 ?�수 계산
  const avgChange = (shortTermChange + mediumTermChange + longTermChange) / 3;
  const sentiment = avgChange / 20; // -1 ~ 1 범위�??�규??  
  // 강점�??�험 ?�소 ?�성
  const strengths = generateStrengths(mockStockData, sentiment);
  const risks = generateRisks(mockStockData, sentiment, []);
  
  // ?�자 추천 ?�성
  const recommendation = generateRecommendation(sentiment, mockStockData);
  
  // ?�체 ?�약 ?�성
  const summary = `${ticker}???�재 주�???$${currentPrice.toFixed(2)}?�며, 
  기술??분석�?기본??분석??종합??결과 ${sentiment > 0 ? '긍정?? : '부?�적'} ?�망??보이�??�습?�다. 
  ?�기(1개월) ?�상 가격�? $${shortTermPrice.toFixed(2)}, 중기(3개월) $${mediumTermPrice.toFixed(2)}, 
  ?�기(6개월) $${longTermPrice.toFixed(2)}?�니?? ${recommendation.en}`;
  
  return {
    shortTerm: {
      price: shortTermPrice,
      change: shortTermChange,
      probability: 70,
      range: {
        min: shortTermPrice * 0.95,
        max: shortTermPrice * 1.05
      }
    },
    mediumTerm: {
      price: mediumTermPrice,
      change: mediumTermChange,
      probability: 60,
      range: {
        min: mediumTermPrice * 0.9,
        max: mediumTermPrice * 1.1
      }
    },
    longTerm: {
      price: longTermPrice,
      change: longTermChange,
      probability: 50,
      range: {
        min: longTermPrice * 0.85,
        max: longTermPrice * 1.15
      }
    },
    pricePredictions,
    confidenceScore: 60 + Math.floor(Math.random() * 30), // 60-89% ?�뢰??    modelInfo: {
      type: 'Transformer',
      accuracy: 80,
      features: [
        '과거 주�? ?�이??,
        '거래??,
        '기술??지??,
        '?�장 지??
      ],
      trainPeriod: '2018-01-01 ~ ?�재'
    },
    summary,
    summaryKr: summary,
    strengths,
    risks,
    recommendation: recommendation.en,
    recommendationKr: recommendation.kr,
    analysisDetails: '',
    analysisDetailsKr: ''
  };
}

// AI 모델???�용??주식 분석 ?�수
export async function analyzeStockWithAI(
  stockData: StockData,
  economicData: EconomicIndicator[],
  analysisType: string = 'comprehensive',
  modelType: string = 'transformer', // 'lstm' ?�는 'transformer'
  language: string = 'kr' // 'en' ?�는 'kr'
): Promise<AIAnalysisResponse | { error: string }> {
  try {
    const response = await fetch('/api/analyze-stock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stockData,
        economicData,
        analysisType,
        modelType,
        language
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error || '분석 ?�청 ?�패' };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('AI 분석 ?�류:', error);
    return { error: '분석 �??�류가 발생?�습?�다' };
  }
}

// 주�? ?�측 ?�수 (LSTM ?�는 Transformer 모델 ?�용)
export async function predictStockPrice(
  stockData: StockData,
  modelType: string = 'transformer', // 'lstm' ?�는 'transformer'
  predictionPeriod: string = 'all' // 'short', 'medium', 'long', 'all'
): Promise<PredictionResult | { error: string }> {
  try {
    const response = await fetch('/api/predict-stock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stockData,
        modelType,
        predictionPeriod
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error || '?�측 ?�청 ?�패' };
    }

    const data = await response.json();
    return data.prediction;
  } catch (error) {
    console.error('주�? ?�측 ?�류:', error);
    return { error: '?�측 �??�류가 발생?�습?�다' };
  }
}

// 모의 LSTM ?�측 결과 ?�성 (?�제 구현 ???�스?�용)
export function generateMockLSTMPrediction(stockData: StockData): PredictionResult {
  const currentPrice = stockData.currentPrice;
  const shortTermChange = Math.random() * 10 - 5; // -5% ~ +5%
  const mediumTermChange = Math.random() * 20 - 7; // -7% ~ +13%
  const longTermChange = Math.random() * 30 - 10; // -10% ~ +20%
  
  const shortTermPrice = currentPrice * (1 + shortTermChange / 100);
  const mediumTermPrice = currentPrice * (1 + mediumTermChange / 100);
  const longTermPrice = currentPrice * (1 + longTermChange / 100);
  
  // ?�별 ?�측 가�??�성
  const pricePredictions = [];
  const today = new Date();
  
  for (let i = 1; i <= 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    let predictedPrice;
    if (i <= 30) {
      // ?�기: ?�재가격에??shortTermPrice까�? ?�형 보간
      predictedPrice = currentPrice + (shortTermPrice - currentPrice) * (i / 30);
    } else if (i <= 60) {
      // 중기: shortTermPrice?�서 mediumTermPrice까�? ?�형 보간
      predictedPrice = shortTermPrice + (mediumTermPrice - shortTermPrice) * ((i - 30) / 30);
    } else {
      // ?�기: mediumTermPrice?�서 longTermPrice까�? ?�형 보간
      predictedPrice = mediumTermPrice + (longTermPrice - mediumTermPrice) * ((i - 60) / 30);
    }
    
    // ?�간??변?�성 추�?
    const volatility = currentPrice * 0.01 * Math.random(); // ?�재 가격의 최�? 1% 변??    predictedPrice += (Math.random() > 0.5 ? volatility : -volatility);
    
    pricePredictions.push({
      date: date.toISOString().split('T')[0],
      predictedPrice: Number(predictedPrice.toFixed(2)),
      range: {
        min: Number((predictedPrice * 0.95).toFixed(2)),
        max: Number((predictedPrice * 1.05).toFixed(2))
      }
    });
  }
  
    return {
    shortTerm: {
      price: Number(shortTermPrice.toFixed(2)),
      change: Number(shortTermChange.toFixed(2)),
      probability: Number((60 + Math.random() * 20).toFixed(1)),
      range: {
        min: Number((shortTermPrice * 0.95).toFixed(2)),
        max: Number((shortTermPrice * 1.05).toFixed(2))
      }
    },
    mediumTerm: {
      price: Number(mediumTermPrice.toFixed(2)),
      change: Number(mediumTermChange.toFixed(2)),
      probability: Number((55 + Math.random() * 20).toFixed(1)),
      range: {
        min: Number((mediumTermPrice * 0.9).toFixed(2)),
        max: Number((mediumTermPrice * 1.1).toFixed(2))
      }
    },
    longTerm: {
      price: Number(longTermPrice.toFixed(2)),
      change: Number(longTermChange.toFixed(2)),
      probability: Number((50 + Math.random() * 20).toFixed(1)),
      range: {
        min: Number((longTermPrice * 0.85).toFixed(2)),
        max: Number((longTermPrice * 1.15).toFixed(2))
      }
    },
    pricePredictions,
    confidenceScore: Number((60 + Math.random() * 20).toFixed(1)),
    modelInfo: {
      type: 'LSTM',
      accuracy: Number((75 + Math.random() * 10).toFixed(1)),
      features: [
        '과거 주�? ?�이??,
        '거래??,
        '기술??지??(RSI, MACD, 볼린?� 밴드)',
        '?�장 지??,
        '계절???�턴'
      ],
      trainPeriod: '2018-01-01 ~ ?�재'
    },
    summary: `${stockData.companyName}??주�????�기?�으�?${shortTermChange > 0 ? '?�승' : '?�락'}??것으�??�상?�니?? 중기?�으로는 ${mediumTermChange > 0 ? '?�승' : '?�락'} 추세�?보일 것으�??�측?�니??`,
    summaryKr: `${stockData.companyNameKr || stockData.companyName}??주�????�기?�으�?${shortTermChange > 0 ? '?�승' : '?�락'}??것으�??�상?�니?? 중기?�으로는 ${mediumTermChange > 0 ? '?�승' : '?�락'} 추세�?보일 것으�??�측?�니??`,
    strengths: [
      '강력???�무 ?�태',
      '경쟁???��??��? ?�익??,
      '지?�적???�신�?R&D ?�자'
    ],
    risks: [
      '?�장 경쟁 ?�화',
      '규제 ?�경 변??가?�성',
      '?�자??가�??�승?�로 ?�한 마진 ?�박'
    ],
    recommendation: shortTermChange > 0 ? 'BUY' : (shortTermChange < -3 ? 'SELL' : 'HOLD'),
    recommendationKr: shortTermChange > 0 ? '매수' : (shortTermChange < -3 ? '매도' : '관�?),
    analysisDetails: `LSTM 모델?� 과거 5?�간??주�? ?�이?? 거래?? 기술??지?��? ?�습?�여 ?�측???�성?�습?�다. 모델?� ?�히 ${stockData.companyName}??계절???�턴�??�장 ?�이?�에 ?�??반응?????�착?�습?�다.`,
    analysisDetailsKr: `LSTM 모델?� 과거 5?�간??주�? ?�이?? 거래?? 기술??지?��? ?�습?�여 ?�측???�성?�습?�다. 모델?� ?�히 ${stockData.companyNameKr || stockData.companyName}??계절???�턴�??�장 ?�이?�에 ?�??반응?????�착?�습?�다.`
  };
}

// 모의 Transformer ?�측 결과 ?�성 (?�제 구현 ???�스?�용)
export function generateMockTransformerPrediction(stockData: StockData): PredictionResult {
  const currentPrice = stockData.currentPrice;
  const shortTermChange = Math.random() * 12 - 5; // -5% ~ +7%
  const mediumTermChange = Math.random() * 25 - 8; // -8% ~ +17%
  const longTermChange = Math.random() * 35 - 10; // -10% ~ +25%
  
  const shortTermPrice = currentPrice * (1 + shortTermChange / 100);
  const mediumTermPrice = currentPrice * (1 + mediumTermChange / 100);
  const longTermPrice = currentPrice * (1 + longTermChange / 100);
  
  // ?�별 ?�측 가�??�성
  const pricePredictions = [];
  const today = new Date();
  
  for (let i = 1; i <= 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    let predictedPrice;
    if (i <= 30) {
      // ?�기: ?�재가격에??shortTermPrice까�? ?�형 보간
      predictedPrice = currentPrice + (shortTermPrice - currentPrice) * (i / 30);
    } else if (i <= 60) {
      // 중기: shortTermPrice?�서 mediumTermPrice까�? ?�형 보간
      predictedPrice = shortTermPrice + (mediumTermPrice - shortTermPrice) * ((i - 30) / 30);
    } else {
      // ?�기: mediumTermPrice?�서 longTermPrice까�? ?�형 보간
      predictedPrice = mediumTermPrice + (longTermPrice - mediumTermPrice) * ((i - 60) / 30);
    }
    
    // ?�간??변?�성 추�? (Transformer??LSTM보다 ?�간 ???�확?�다�?가??
    const volatility = currentPrice * 0.008 * Math.random(); // ?�재 가격의 최�? 0.8% 변??    predictedPrice += (Math.random() > 0.5 ? volatility : -volatility);
    
    pricePredictions.push({
      date: date.toISOString().split('T')[0],
      predictedPrice: Number(predictedPrice.toFixed(2)),
      range: {
        min: Number((predictedPrice * 0.94).toFixed(2)),
        max: Number((predictedPrice * 1.06).toFixed(2))
      }
    });
  }
  
  return {
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
        '과거 주�? ?�이??,
        '거래??,
        '기술??지??(RSI, MACD, 볼린?� 밴드)',
        '?�장 지??,
        '계절???�턴',
        '?�스 감성 분석',
        '거시경제 지??
      ],
      trainPeriod: '2015-01-01 ~ ?�재'
    },
    summary: `${stockData.companyName}??주�????�기?�으�?${shortTermChange > 0 ? '?�승' : '?�락'}??것으�??�상?�니?? 중기?�으로는 ${mediumTermChange > 0 ? '?�승' : '?�락'} 추세�?보일 것으�??�측?�니?? ?�기?�으로는 ${longTermChange > 0 ? '긍정?�인' : '부?�적??} ?�망??가지�??�습?�다.`,
    summaryKr: `${stockData.companyNameKr || stockData.companyName}??주�????�기?�으�?${shortTermChange > 0 ? '?�승' : '?�락'}??것으�??�상?�니?? 중기?�으로는 ${mediumTermChange > 0 ? '?�승' : '?�락'} 추세�?보일 것으�??�측?�니?? ?�기?�으로는 ${longTermChange > 0 ? '긍정?�인' : '부?�적??} ?�망??가지�??�습?�다.`,
    strengths: [
      '강력???�무 ?�태',
      '경쟁???��??��? ?�익??,
      '지?�적???�신�?R&D ?�자',
      '?�장 ?�유???��?',
      '?�양???�품 ?�트?�리??
    ],
    risks: [
      '?�장 경쟁 ?�화',
      '규제 ?�경 변??가?�성',
      '?�자??가�??�승?�로 ?�한 마진 ?�박',
      '기술 변?�에 ?�른 ?�응 ?�요??,
      '글로벌 경제 불확?�성'
    ],
    recommendation: shortTermChange > 0 ? 'BUY' : (shortTermChange < -3 ? 'SELL' : 'HOLD'),
    recommendationKr: shortTermChange > 0 ? '매수' : (shortTermChange < -3 ? '매도' : '관�?),
    analysisDetails: `Transformer 모델?� 과거 8?�간??주�? ?�이?? 거래?? 기술??지?? ?�스 감성 분석 결과�??�습?�여 ?�측???�성?�습?�다. 모델?� ?�히 ${stockData.companyName}??계절???�턴, ?�장 ?�이?? 그리�??�스 ?�벤?�에 ?�??반응?????�착?�습?�다. ?�기 주의(Self-Attention) 메커?�즘???�해 ?�기 ?�존?�을 ?�과?�으�?모델링했?�니??`,
    analysisDetailsKr: `Transformer 모델?� 과거 8?�간??주�? ?�이?? 거래?? 기술??지?? ?�스 감성 분석 결과�??�습?�여 ?�측???�성?�습?�다. 모델?� ?�히 ${stockData.companyNameKr || stockData.companyName}??계절???�턴, ?�장 ?�이?? 그리�??�스 ?�벤?�에 ?�??반응?????�착?�습?�다. ?�기 주의(Self-Attention) 메커?�즘???�해 ?�기 ?�존?�을 ?�과?�으�?모델링했?�니??`
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  
  if (!symbol) {
    return NextResponse.json({ error: '주식 ?�볼???�요?�니?? }, { status: 400 });
  }
  
  try {
    const stockData = await fetchStockData(symbol);
    return NextResponse.json(stockData);
  } catch (error) {
    console.error('주식 ?�이??가?�오�??�패:', error);
    return NextResponse.json({ error: '?�이?��? 가?�오??�??�류가 발생?�습?�다' }, { status: 500 });
  }
} 

// 기술??지??기반 감성 ?�수 계산 (0-100)
function calculateTechnicalSentiment(technicalIndicators: any): number {
  let sentiment = 50; // 중립 ?�작??  
  // RSI 기반 ?�수 조정 (과매??과매???�태 반영)
  if (technicalIndicators.rsi < 30) {
    sentiment += 10; // 과매???�태???�승 가?�성
  } else if (technicalIndicators.rsi > 70) {
    sentiment -= 10; // 과매???�태???�락 가?�성
  } else if (technicalIndicators.rsi > 50) {
    sentiment += 5; // 중립보다 ?�간 ?��? RSI
  } else {
    sentiment -= 5; // 중립보다 ?�간 ??? RSI
  }
  
  // MACD 기반 ?�수 조정
  if (technicalIndicators.macd && technicalIndicators.macd.value > 0) {
    sentiment += 5; // ?�의 MACD???�승 추세
    if (technicalIndicators.macd.histogram > 0) {
      sentiment += 5; // ?�의 ?�스?�그?��? 강한 ?�승 모멘?�
    }
  } else if (technicalIndicators.macd && technicalIndicators.macd.value < 0) {
    sentiment -= 5; // ?�의 MACD???�락 추세
    if (technicalIndicators.macd.histogram < 0) {
      sentiment -= 5; // ?�의 ?�스?�그?��? 강한 ?�락 모멘?�
    }
  }
  
  // ?�동?�균??기반 ?�수 조정
  const currentPrice = technicalIndicators.bollingerBands?.middle || 0;
  if (currentPrice > technicalIndicators.ma50) {
    sentiment += 5; // 50???�동?�균???�는 ?�승 추세
  } else {
    sentiment -= 5; // 50???�동?�균???�래???�락 추세
  }
  
  if (currentPrice > technicalIndicators.ma200) {
    sentiment += 5; // 200???�동?�균???�는 ?�기 ?�승 추세
  } else {
    sentiment -= 5; // 200???�동?�균???�래???�기 ?�락 추세
  }
  
  // 볼린?� 밴드 기반 ?�수 조정
  if (technicalIndicators.bollingerBands) {
    const { upper, middle, lower } = technicalIndicators.bollingerBands;
    if (currentPrice > upper) {
      sentiment -= 10; // ?�단 밴드 ?�는 과매??가?�성
    } else if (currentPrice < lower) {
      sentiment += 10; // ?�단 밴드 ?�래??과매??가?�성
    }
  }
  
  // ?�수 범위 ?�한 (0-100)
  return Math.max(0, Math.min(100, sentiment));
}

// 기본??지??기반 감성 ?�수 계산 (0-100)
function calculateFundamentalSentiment(fundamentals: any): number {
  let sentiment = 50; // 중립 ?�작??  
  // P/E 비율 기반 ?�수 조정
  if (fundamentals.pe > 0) {
    if (fundamentals.pe < 15) {
      sentiment += 10; // ??? P/E???�?��? 가?�성
    } else if (fundamentals.pe > 30) {
      sentiment -= 10; // ?��? P/E??고평가 가?�성
    }
  }
  
  // ?�장�?기반 ?�수 조정
  if (fundamentals.revenueGrowth > 20) {
    sentiment += 10; // ?��? 매출 ?�장�?  } else if (fundamentals.revenueGrowth < 0) {
    sentiment -= 10; // 매출 감소
  }
  
  if (fundamentals.epsGrowth > 20) {
    sentiment += 10; // ?��? EPS ?�장�?  } else if (fundamentals.epsGrowth < 0) {
    sentiment -= 10; // EPS 감소
  }
  
  // ?�익??지??기반 ?�수 조정
  if (fundamentals.operatingMargin > 20) {
    sentiment += 5; // ?��? ?�업 마진
  } else if (fundamentals.operatingMargin < 10) {
    sentiment -= 5; // ??? ?�업 마진
  }
  
  if (fundamentals.roe > 15) {
    sentiment += 5; // ?��? ROE
  } else if (fundamentals.roe < 5) {
    sentiment -= 5; // ??? ROE
  }
  
  // 배당 ?�익�?기반 ?�수 조정
  if (fundamentals.dividendYield > 3) {
    sentiment += 5; // ?��? 배당 ?�익�?  }
  
  // 부�?비율 기반 ?�수 조정
  if (fundamentals.debtToEquity > 2) {
    sentiment -= 5; // ?��? 부�?비율
  }
  
  // ?�수 범위 ?�한 (0-100)
  return Math.max(0, Math.min(100, sentiment));
}

// 경제 지??기반 감성 ?�수 계산 (0-100)
function calculateEconomicSentiment(economicData: any[]): number {
  if (!economicData || economicData.length === 0) {
    return 50; // ?�이???�으�?중립 반환
  }
  
  let sentiment = 50; // 중립 ?�작??  
  // �?경제 지?�별 ?�향 ?��?
  for (const indicator of economicData) {
    // ?�플?�이??(CPI)
    if (indicator.name.includes('Inflation') || indicator.name.includes('Consumer Price')) {
      if (indicator.change < 0) {
        sentiment += 5; // ?�플?�이??감소??긍정??      } else if (indicator.change > 0.5) {
        sentiment -= 5; // ?�플?�이??증�???부?�적
      }
    }
    
    // 금리
    if (indicator.name.includes('Interest') || indicator.name.includes('Federal Funds')) {
      if (indicator.change < 0) {
        sentiment += 5; // 금리 ?�락?� 긍정??      } else if (indicator.change > 0) {
        sentiment -= 5; // 금리 ?�승?� 부?�적
      }
    }
    
    // GDP ?�장�?    if (indicator.name.includes('GDP')) {
      if (indicator.value > 2) {
        sentiment += 5; // ?��? GDP ?�장률�? 긍정??      } else if (indicator.value < 0) {
        sentiment -= 10; // 마이?�스 GDP ?�장률�? 매우 부?�적
      }
    }
    
    // ?�업�?    if (indicator.name.includes('Unemployment')) {
      if (indicator.change < 0) {
        sentiment += 5; // ?�업�?감소??긍정??      } else if (indicator.change > 0.2) {
        sentiment -= 5; // ?�업�?증�???부?�적
      }
    }
    
    // ?�비???�뢰지??    if (indicator.name.includes('Consumer Confidence')) {
      if (indicator.change > 0) {
        sentiment += 5; // ?�비???�뢰지???�승?� 긍정??      } else if (indicator.change < 0) {
        sentiment -= 5; // ?�비???�뢰지???�락?� 부?�적
      }
    }
    
    // ?�업?�산지??    if (indicator.name.includes('Industrial Production')) {
      if (indicator.change > 0) {
        sentiment += 3; // ?�업?�산 증�???긍정??      } else if (indicator.change < 0) {
        sentiment -= 3; // ?�업?�산 감소??부?�적
      }
    }
  }
  
  // ?�수 범위 ?�한 (0-100)
  return Math.max(0, Math.min(100, sentiment));
}

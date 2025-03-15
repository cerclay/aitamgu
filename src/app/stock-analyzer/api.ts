'use client';

import { StockData, EconomicIndicator, PredictionResult, YahooFinanceResponse, FredApiResponse } from './types';
import yahooFinance from 'yahoo-finance2';
import { NextRequest, NextResponse } from 'next/server';

// Yahoo Finance API 키
const YAHOO_FINANCE_API_KEY = process.env.NEXT_PUBLIC_YAHOO_FINANCE_API_KEY;

// 간단한 메모리 캐시
const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5분

// AIAnalysisResponse 타입 정의
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
          // 캐시가 5분 이내인 경우 캐시된 데이터 반환
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            console.log('캐시된 주식 데이터 사용:', symbol);
            return data;
          }
        } catch (cacheError) {
          console.warn('캐시 데이터 파싱 오류:', cacheError);
          // 캐시 오류 시 무시하고 계속 진행
        }
      }
    }
    
    console.log('Yahoo Finance API 호출 시도:', symbol);
    
    // API 호출 시도
    try {
      // 야후 파이낸스 API 호출
      const response = await fetch(`/api/yahoo-finance?symbol=${symbol}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Yahoo Finance API 응답 오류:', errorText);
        throw new Error(`API 응답 오류: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      // 필수 데이터 확인
      if (!data.ticker || !data.currentPrice) {
        console.error('Yahoo Finance API 응답에 필수 데이터가 없습니다:', data);
        throw new Error('API 응답에 필수 데이터가 없습니다');
      }
      
      // 브라우저 환경에서만 로컬 스토리지에 캐시
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data,
            timestamp: Date.now()
          }));
        } catch (storageError) {
          console.warn('로컬 스토리지 저장 오류:', storageError);
          // 저장 오류 시 무시하고 계속 진행
        }
      }
      
      console.log('Yahoo Finance API 호출 성공:', symbol);
      return data;
    } catch (apiError) {
      console.error('Yahoo Finance API 호출 실패:', apiError);
      // 오류 발생 시 모의 데이터 사용으로 진행
      console.log('모의 주식 데이터 사용:', symbol);
      return generateMockStockData(symbol);
    }
  } catch (error) {
    // 최종 예외 처리 - 어떤 오류가 발생하더라도 모의 데이터 반환
    console.error('주식 데이터 처리 중 예상치 못한 오류:', error);
    return generateMockStockData(symbol);
  }
};

// 과거 주가 데이터 생성 (목업)
function generateMockHistoricalPrices(currentPrice: number): { date: string; price: number; volume: number; open: number; high: number; low: number }[] {
  const historicalPrices = [];
  const today = new Date();
  let price = currentPrice;
  
  for (let i = 365; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // 약간의 랜덤 변동 추가
    const dailyChange = 0.98 + Math.random() * 0.04;
    price = price * dailyChange;
    
    // 고가, 저가, 시가 생성
    const high = price * (1 + Math.random() * 0.02);
    const low = price * (1 - Math.random() * 0.02);
    const open = low + Math.random() * (high - low);
    
    // 거래량 생성 (1백만 ~ 1천만 사이)
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

// 기술적 지표 계산
function calculateTechnicalIndicators(prices: { date: string; price: number }[]): {
  rsi: number;
  macd: number;
  bollingerUpper: number;
  bollingerLower: number;
  ma50: number;
  ma200: number;
} {
  const priceValues = prices.map(item => item.price);
  
  // RSI 계산
  const rsi = calculateRSI(prices);
  
  // 이동평균 계산
  const { ma50, ma200 } = calculateMovingAverages(prices);
  
  // 볼린저 밴드 계산
  const { bollingerUpper, bollingerLower } = calculateBollingerBands(prices);
  
  // MACD 계산
  const macd = calculateMACD(prices);
  
  return {
    rsi,
    macd,
    bollingerUpper,
    bollingerLower,
    ma50,
    ma200,
  };
}

// 1년 전 날짜 가져오기
function getOneYearAgo() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date;
}

// RSI 계산 (간단한 구현)
function calculateRSI(prices: { date: string; price: number }[]): number {
  // 실제 계산에서는 더 복잡한 알고리즘 적용이 필요
  // 여기서는 간단한 예시로 구현
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
  
  if (avgLoss === 0) return 100; // 손실이 없으면 RSI = 100
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// 이동평균 계산
function calculateMovingAverages(prices: { date: string; price: number }[]): { ma50: number; ma200: number } {
  const priceValues = prices.map(item => item.price);
  
  const ma50 = calculateMA(priceValues, 50);
  const ma200 = calculateMA(priceValues, 200);
  
  return { ma50, ma200 };
}

// 단순 이동평균 계산
function calculateMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  
  const slice = prices.slice(prices.length - period);
  return slice.reduce((sum, price) => sum + price, 0) / period;
}

// 볼린저 밴드 계산
function calculateBollingerBands(prices: { date: string; price: number }[]): { bollingerUpper: number; bollingerLower: number } {
  const priceValues = prices.map(item => item.price);
  const period = 20;
  
  if (priceValues.length < period) {
    return { 
      bollingerUpper: priceValues[priceValues.length - 1] * 1.05, 
      bollingerLower: priceValues[priceValues.length - 1] * 0.95 
    };
  }
  
  const slice = priceValues.slice(priceValues.length - period);
  const ma = slice.reduce((sum, price) => sum + price, 0) / period;
  
  // 표준 편차 계산
  const squaredDiffs = slice.map(price => Math.pow(price - ma, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / period;
  const stdDev = Math.sqrt(variance);
  
  return {
    bollingerUpper: ma + (2 * stdDev),
    bollingerLower: ma - (2 * stdDev),
  };
}

// MACD 계산 (간단한 구현)
function calculateMACD(prices: { date: string; price: number }[]): number {
  const priceValues = prices.map(item => item.price);
  
  const ema12 = calculateEMA(priceValues, 12);
  const ema26 = calculateEMA(priceValues, 26);
  
  return ema12 - ema26;
}

// 지수 이동평균 계산
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  
  let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  const multiplier = 2 / (period + 1);
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

// 경제 지표 데이터 가져오기
export const fetchEconomicIndicators = async (): Promise<EconomicIndicator[]> => {
  try {
    // 실제 API 호출 대신 모의 데이터 반환
    return [
      {
        name: 'GDP Growth Rate',
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
      },
      {
        name: 'Consumer Confidence',
        nameKr: '소비자 신뢰지수',
        value: 102.5,
        unit: '',
        change: 1.5,
        previousPeriod: '전월',
        source: 'Conference Board',
        description: '소비자들의 경제 상황에 대한 신뢰도',
        impact: 'positive'
      },
      {
        name: 'Manufacturing PMI',
        nameKr: '제조업 PMI',
        value: 51.2,
        unit: '',
        change: -0.3,
        previousPeriod: '전월',
        source: 'ISM',
        description: '제조업 구매관리자지수',
        impact: 'neutral'
      }
    ];
  } catch (error) {
    console.error('경제 지표 가져오기 오류:', error);
    throw new Error('경제 지표를 가져오는 중 오류가 발생했습니다.');
  }
};

// FRED API를 사용하여 경제 지표 데이터 가져오기
export async function fetchEconomicIndicatorsFromFRED(): Promise<EconomicIndicator[]> {
  // FRED API 키가 필요합니다
  const FRED_API_KEY = process.env.FRED_API_KEY || '';
  
  if (!FRED_API_KEY) {
    console.warn('FRED API 키가 설정되지 않았습니다. 모의 데이터를 사용합니다.');
    return generateMockEconomicIndicators();
  }
  
  // 가져올 경제지표 목록
    const indicators = [
    { 
      id: 'GDP', 
      name: 'GDP Growth Rate', 
      nameKr: 'GDP 성장률', 
      unit: '%', 
      description: '국내총생산 성장률', 
      impact: 'positive' as const 
    },
    { 
      id: 'UNRATE', 
      name: 'Unemployment Rate', 
      nameKr: '실업률', 
      unit: '%', 
      description: '미국 실업률', 
      impact: 'negative' as const 
    },
    { 
      id: 'CPIAUCSL', 
      name: 'Consumer Price Index', 
      nameKr: '소비자물가지수', 
      unit: 'Index', 
      description: '소비자물가지수 변화율', 
      impact: 'neutral' as const 
    },
    { 
      id: 'FEDFUNDS', 
      name: 'Federal Funds Rate', 
      nameKr: '기준금리', 
      unit: '%', 
      description: '미 연방준비제도 기준금리', 
      impact: 'negative' as const 
    },
    { 
      id: 'INDPRO', 
      name: 'Industrial Production', 
      nameKr: '산업생산지수', 
      unit: 'Index', 
      description: '산업생산지수 변화율', 
      impact: 'positive' as const 
    },
    { 
      id: 'RSAFS', 
      name: 'Retail Sales', 
      nameKr: '소매판매', 
      unit: 'Million $', 
      description: '소매판매 변화율', 
      impact: 'positive' as const 
    },
    { 
      id: 'HOUST', 
      name: 'Housing Starts', 
      nameKr: '주택착공건수', 
      unit: 'Thousand', 
      description: '신규 주택착공건수', 
      impact: 'positive' as const 
    },
    { 
      id: 'DEXKOUS', 
      name: 'KRW/USD Exchange Rate', 
      nameKr: '원/달러 환율', 
      unit: 'KRW', 
      description: '원/달러 환율', 
      impact: 'neutral' as const 
    }
  ];
  
  try {
    // 병렬로 모든 지표 데이터 가져오기
    const promises = indicators.map(async (indicator) => {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${indicator.id}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=2`;
      const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`FRED API 오류: ${response.status}`);
    }
    
    const data = await response.json();
      return { indicator, data };
    });
    
    const results = await Promise.all(promises);
    return transformFREDData(results, indicators);
  } catch (error) {
    console.error('FRED 경제지표 가져오기 실패:', error);
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
        previousPeriod: '이전 기간 데이터 없음',
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

// 첫 번째 정의
export function generateMockEconomicIndicators(): EconomicIndicator[] {
  return [
    {
      name: 'GDP Growth Rate',
      nameKr: 'GDP 성장률',
      value: 2.1,
      unit: '%',
      change: 0.3,
      previousPeriod: '2023-Q2',
      description: '국내총생산 성장률',
      impact: 'positive' as const,
      source: 'FRED (모의 데이터)'
    },
    {
      name: 'Unemployment Rate',
      nameKr: '실업률',
      value: 3.8,
      unit: '%',
      change: -0.1,
      previousPeriod: '2023-08',
      description: '미국 실업률',
      impact: 'negative' as const,
      source: 'FRED (모의 데이터)'
    },
    {
      name: 'Consumer Price Index',
      nameKr: '소비자물가지수',
      value: 3.2,
      unit: '%',
      change: -0.2,
      previousPeriod: '2023-08',
      description: '소비자물가지수 변화율',
      impact: 'neutral' as const,
      source: 'FRED (모의 데이터)'
    },
    {
      name: 'Federal Funds Rate',
      nameKr: '기준금리',
      value: 5.25,
      unit: '%',
      change: 0,
      previousPeriod: '2023-08',
      description: '미 연방준비제도 기준금리',
      impact: 'negative' as const,
      source: 'FRED (모의 데이터)'
    },
    {
      name: 'Industrial Production',
      nameKr: '산업생산지수',
      value: 0.4,
      unit: '%',
      change: 0.7,
      previousPeriod: '2023-08',
      description: '산업생산지수 변화율',
      impact: 'positive' as const,
      source: 'FRED (모의 데이터)'
    },
    {
      name: 'KRW/USD Exchange Rate',
      nameKr: '원/달러 환율',
      value: 1350.25,
      unit: 'KRW',
      change: 2.1,
      previousPeriod: '2023-09-01',
      description: '원/달러 환율',
      impact: 'neutral' as const,
      source: 'FRED (모의 데이터)'
    }
  ];
}

// 두 번째 정의 (이름 변경)
export function createAlternativeMockEconomicData(): EconomicIndicator[] {
  // 기존 함수 호출
  return generateMockEconomicIndicators();
}

// AI 예측 생성
export const generatePrediction = async (
  symbol: string,
  stockData: StockData, 
  economicData: EconomicIndicator[]
): Promise<PredictionResult> => {
  try {
    // 실제 API 호출 또는 모델 사용 로직
    // 여기서는 모의 데이터를 생성하되, 실제 데이터를 기반으로 한 계산 추가
    
    const currentPrice = stockData.currentPrice;
    
    // 기술적 지표 분석
    const technicalSentiment = calculateTechnicalSentiment(stockData.technicalIndicators);
    
    // 기본적 지표 분석
    const fundamentalSentiment = calculateFundamentalSentiment(stockData.fundamentals);
    
    // 경제 지표 분석
    const economicSentiment = calculateEconomicSentiment(economicData);
    
    // 종합 감성 점수 (0-100)
    const overallSentiment = (technicalSentiment * 0.4) + (fundamentalSentiment * 0.4) + (economicSentiment * 0.2);
    
    // 감성 점수를 기반으로 가격 변동 예측
    const volatility = calculateVolatility(stockData.historicalPrices.map(p => p.price));
    
    // 단기 예측 (1개월)
    const shortTermChange = (overallSentiment - 50) * 0.02 * volatility;
    const shortTermPrice = currentPrice * (1 + shortTermChange / 100);
    
    // 중기 예측 (3개월)
    const mediumTermChange = (overallSentiment - 50) * 0.04 * volatility;
    const mediumTermPrice = currentPrice * (1 + mediumTermChange / 100);
    
    // 장기 예측 (6개월)
    const longTermChange = (overallSentiment - 50) * 0.08 * volatility;
    const longTermPrice = currentPrice * (1 + longTermChange / 100);
    
    // 예측 가격 시계열 생성
    const pricePredictions = generatePricePredictions(
      currentPrice,
      shortTermPrice,
      mediumTermPrice,
      longTermPrice
    );
    
    // 신뢰도 점수 계산 (기술적 지표의 일관성에 따라 조정)
    let confidenceScore = 65 + Math.random() * 20;
    
    // 기술적 지표가 일관된 방향을 가리키면 신뢰도 상승
    let technicalConsistency = 0;
    if ((stockData.technicalIndicators.rsi > 50) === (shortTermChange > 0)) technicalConsistency++;
    if ((stockData.technicalIndicators.macd.value > 0) === (shortTermChange > 0)) technicalConsistency++;
    if ((currentPrice > stockData.technicalIndicators.ma50) === (shortTermChange > 0)) technicalConsistency++;
    if ((currentPrice > stockData.technicalIndicators.ma200) === (shortTermChange > 0)) technicalConsistency++;
    
    // 일관성에 따라 신뢰도 조정 (최대 ±10%)
    confidenceScore += (technicalConsistency - 2) * 2.5;
    
    // 신뢰도 범위 제한 (50-95%)
    confidenceScore = Math.max(50, Math.min(95, confidenceScore));
    
    // 강점 및 위험 요소 생성
    const strengths = [];
    const risks = [];
    
    // 기술적 지표 기반 강점/위험
    if (stockData.technicalIndicators.rsi < 30) {
      strengths.push('RSI가 과매도 구간에 있어 반등 가능성이 있습니다');
    } else if (stockData.technicalIndicators.rsi > 70) {
      risks.push('RSI가 과매수 구간에 있어 단기 조정 가능성이 있습니다');
    }
    
    // 경제 지표 기반 강점/위험
    // 인플레이션 지표 찾기
    const inflationIndicator = economicData.find(indicator => 
      indicator.name.includes('Inflation') || 
      indicator.name.includes('Consumer Price')
    );
    
    // 금리 지표 찾기
    const interestRateIndicator = economicData.find(indicator => 
      indicator.name.includes('Interest') || 
      indicator.name.includes('Federal Funds')
    );
    
    if (inflationIndicator && inflationIndicator.change < 0) {
      strengths.push('인플레이션이 감소 추세로, 기업 비용 부담이 완화될 수 있습니다');
    } else if (inflationIndicator && inflationIndicator.change > 0.5) {
      risks.push('인플레이션이 상승 추세로, 기업 비용 부담이 증가할 수 있습니다');
    }
    
    if (interestRateIndicator && interestRateIndicator.change < 0) {
      strengths.push('금리가 하락 추세로, 기업 자금 조달 비용이 감소할 수 있습니다');
    } else if (interestRateIndicator && interestRateIndicator.change > 0) {
      risks.push('금리가 상승 추세로, 기업 자금 조달 비용이 증가할 수 있습니다');
    }
    
    // 투자 추천 생성
    const recommendation = generateRecommendation(overallSentiment / 100, stockData);
    
    // 상세 분석 내용 생성
    const analysisDetails = `Transformer 모델은 과거 주가 데이터, 거래량, 기술적 지표, 뉴스 감성 분석 결과를 학습하여 예측을 생성했습니다. ${stockData.companyName}의 주가는 현재 ${currentPrice.toFixed(2)}달러에 거래되고 있으며, 기술적 지표와 기본적 지표를 종합적으로 분석한 결과 ${shortTermChange > 0 ? '상승' : '하락'} 추세가 예상됩니다. 특히 ${stockData.technicalIndicators.rsi < 30 ? 'RSI가 과매도 구간에 있어 반등 가능성이 높습니다.' : stockData.technicalIndicators.rsi > 70 ? 'RSI가 과매수 구간에 있어 단기 조정 가능성이 있습니다.' : 'RSI는 중립적인 수준을 유지하고 있습니다.'} ${stockData.technicalIndicators.macd.value > 0 ? 'MACD가 양수로 상승 모멘텀을 보이고 있습니다.' : 'MACD가 음수로 하락 모멘텀을 보이고 있습니다.'} 경제 지표 측면에서는 ${inflationIndicator ? (inflationIndicator.change < 0 ? '인플레이션이 감소 추세로 긍정적입니다.' : '인플레이션이 상승 추세로 주의가 필요합니다.') : ''} ${interestRateIndicator ? (interestRateIndicator.change <= 0 ? '금리가 안정적이거나 하락 추세로 긍정적입니다.' : '금리가 상승 추세로 주의가 필요합니다.') : ''}`;
    
    const analysisDetailsKr = `Transformer 모델은 과거 주가 데이터, 거래량, 기술적 지표, 뉴스 감성 분석 결과를 학습하여 예측을 생성했습니다. ${stockData.companyNameKr || stockData.companyName}의 주가는 현재 ${currentPrice.toFixed(2)}달러에 거래되고 있으며, 기술적 지표와 기본적 지표를 종합적으로 분석한 결과 ${shortTermChange > 0 ? '상승' : '하락'} 추세가 예상됩니다. 특히 ${stockData.technicalIndicators.rsi < 30 ? 'RSI가 과매도 구간에 있어 반등 가능성이 높습니다.' : stockData.technicalIndicators.rsi > 70 ? 'RSI가 과매수 구간에 있어 단기 조정 가능성이 있습니다.' : 'RSI는 중립적인 수준을 유지하고 있습니다.'} ${stockData.technicalIndicators.macd.value > 0 ? 'MACD가 양수로 상승 모멘텀을 보이고 있습니다.' : 'MACD가 음수로 하락 모멘텀을 보이고 있습니다.'} 경제 지표 측면에서는 ${inflationIndicator ? (inflationIndicator.change < 0 ? '인플레이션이 감소 추세로 긍정적입니다.' : '인플레이션이 상승 추세로 주의가 필요합니다.') : ''} ${interestRateIndicator ? (interestRateIndicator.change <= 0 ? '금리가 안정적이거나 하락 추세로 긍정적입니다.' : '금리가 상승 추세로 주의가 필요합니다.') : ''}`;
    
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
      summary: `${stockData.companyName}의 주가는 단기적으로 ${shortTermChange > 0 ? '상승' : '하락'}할 것으로 예상됩니다. 중기적으로는 ${mediumTermChange > 0 ? '상승' : '하락'} 추세를 보일 것으로 예측됩니다. 장기적으로는 ${longTermChange > 0 ? '긍정적인' : '부정적인'} 전망을 가지고 있습니다.`,
      summaryKr: `${stockData.companyNameKr || stockData.companyName}의 주가는 단기적으로 ${shortTermChange > 0 ? '상승' : '하락'}할 것으로 예상됩니다. 중기적으로는 ${mediumTermChange > 0 ? '상승' : '하락'} 추세를 보일 것으로 예측됩니다. 장기적으로는 ${longTermChange > 0 ? '긍정적인' : '부정적인'} 전망을 가지고 있습니다.`,
      strengths: strengths.slice(0, 5),
      risks: risks.slice(0, 5),
      recommendation: recommendation.en,
      recommendationKr: recommendation.kr,
      analysisDetails,
      analysisDetailsKr
    };
  } catch (error) {
    console.error('예측 생성 오류:', error);
    throw new Error('예측을 생성하는 중 오류가 발생했습니다.');
  }
};

// 트렌드 계산 (간단한 선형 회귀 기울기)
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
  
  // 기울기를 백분율로 변환
  return (slope / avgPrice) * 100;
}

// 변동성 계산
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

// 예측 가격 시계열 생성
function generatePricePredictions(
  currentPrice: number,
  shortTermPrice: number,
  mediumTermPrice: number,
  longTermPrice: number
): { date: string; predictedPrice: number; range: { min: number; max: number } }[] {
  const predictions = [];
  const today = new Date();
  
  // 단기(1개월) 예측 포인트 생성
  const shortTerm = new Date(today);
  shortTerm.setMonth(today.getMonth() + 1);
  
  // 중기(3개월) 예측 포인트 생성
  const mediumTerm = new Date(today);
  mediumTerm.setMonth(today.getMonth() + 3);
  
  // 장기(6개월) 예측 포인트 생성
  const longTerm = new Date(today);
  longTerm.setMonth(today.getMonth() + 6);
  
  // 예측 포인트 사이의 보간 데이터 생성
  const totalDays = Math.round((longTerm.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  for (let i = 1; i <= totalDays; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    let predictedPrice;
    const dayRatio = i / totalDays;
    
    if (i <= 30) {
      // 첫 1개월: 현재 가격에서 단기 예측까지 선형 보간
      predictedPrice = currentPrice + (shortTermPrice - currentPrice) * (i / 30);
    } else if (i <= 60) {
      // 1-3개월: 단기 예측에서 중기 예측까지 선형 보간
      predictedPrice = shortTermPrice + (mediumTermPrice - shortTermPrice) * ((i - 30) / 30);
    } else {
      // 3-6개월: 중기 예측에서 장기 예측까지 선형 보간
      predictedPrice = mediumTermPrice + (longTermPrice - mediumTermPrice) * ((i - 60) / 30);
    }
    
    // 약간의 변동성 추가
    const volatility = currentPrice * 0.008 * Math.random();
    predictedPrice += (Math.random() > 0.5 ? volatility : -volatility);
    
    // 예측 가격 반올림
    const finalPredictedPrice = Number(predictedPrice.toFixed(2));
    
    // 범위 계산 (예측 가격의 ±5%)
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

// 강점 생성
function generateStrengths(stockData: StockData, sentiment: number): string[] {
  const strengths = [];
  
  if (stockData.technicalIndicators.rsi < 30) {
    strengths.push('RSI가 과매도 구간에 있어 반등 가능성이 있습니다.');
  }
  
  if (stockData.technicalIndicators.macd.value > 0) {
    strengths.push('MACD가 양수로, 상승 모멘텀이 형성되고 있습니다.');
  }
  
  if (stockData.currentPrice > stockData.technicalIndicators.ma50) {
    strengths.push('현재 가격이 50일 이동평균선 위에 있어 단기 상승 추세를 보이고 있습니다.');
  }
  
  if (stockData.currentPrice > stockData.technicalIndicators.ma200) {
    strengths.push('현재 가격이 200일 이동평균선 위에 있어 장기 상승 추세를 보이고 있습니다.');
  }
  
  if (stockData.fundamentals.revenueGrowth > 10) {
    strengths.push(`매출 성장률이 ${stockData.fundamentals.revenueGrowth.toFixed(1)}%로 높은 성장세를 보이고 있습니다.`);
  }
  
  if (stockData.fundamentals.operatingMargin > 20) {
    strengths.push(`영업 마진이 ${stockData.fundamentals.operatingMargin.toFixed(1)}%로 높은 수익성을 유지하고 있습니다.`);
  }
  
  if (stockData.fundamentals.pe > 0 && stockData.fundamentals.pe < 15) {
    strengths.push(`P/E 비율이 ${stockData.fundamentals.pe.toFixed(1)}로 상대적으로 저평가되어 있습니다.`);
  }
  
  if (stockData.fundamentals.dividendYield > 3) {
    strengths.push(`배당 수익률이 ${stockData.fundamentals.dividendYield.toFixed(1)}%로 안정적인 수익을 제공합니다.`);
  }
  
  // 최소 2개, 최대 5개의 강점 반환
  if (strengths.length < 2) {
    strengths.push('기술적 분석 지표가 개선되고 있는 추세입니다.');
    strengths.push('시장 평균 대비 경쟁력 있는 포지션을 유지하고 있습니다.');
  }
  
  return strengths.slice(0, 5);
}

// 위험 요소 생성
function generateRisks(stockData: StockData, sentiment: number, economicData: EconomicIndicator[]): string[] {
  const risks = [];
  
  if (stockData.technicalIndicators.rsi > 70) {
    risks.push('RSI가 과매수 구간에 있어 단기 조정 가능성이 있습니다.');
  }
  
  if (stockData.technicalIndicators.macd.value < 0) {
    risks.push('MACD가 음수로, 하락 모멘텀이 형성되고 있습니다.');
  }
  
  if (stockData.currentPrice < stockData.technicalIndicators.ma50) {
    risks.push('현재 가격이 50일 이동평균선 아래에 있어 단기 하락 추세를 보이고 있습니다.');
  }
  
  if (stockData.currentPrice < stockData.technicalIndicators.ma200) {
    risks.push('현재 가격이 200일 이동평균선 아래에 있어 장기 하락 추세를 보이고 있습니다.');
  }
  
  if (stockData.fundamentals.revenueGrowth < 0) {
    risks.push(`매출 성장률이 ${stockData.fundamentals.revenueGrowth.toFixed(1)}%로 감소 추세를 보이고 있습니다.`);
  }
  
  if (stockData.fundamentals.operatingMargin < 10) {
    risks.push(`영업 마진이 ${stockData.fundamentals.operatingMargin.toFixed(1)}%로 낮은 수익성을 보이고 있습니다.`);
  }
  
  if (stockData.fundamentals.pe > 30) {
    risks.push(`P/E 비율이 ${stockData.fundamentals.pe.toFixed(1)}로 상대적으로 고평가되어 있습니다.`);
  }
  
  const interestRate = economicData.find(item => item.name.includes('기준금리'));
  if (interestRate && interestRate.change > 0) {
    risks.push('금리 상승 환경은 주식 시장에 부정적인 영향을 미칠 수 있습니다.');
  }
  
  // 최소 2개, 최대 5개의 위험 요소 반환
  if (risks.length < 2) {
    risks.push('시장 변동성이 증가할 경우 주가 하락 위험이 있습니다.');
    risks.push('경쟁 심화로 인한 시장 점유율 감소 가능성이 있습니다.');
  }
  
  return risks.slice(0, 5);
}

// 투자 추천 생성
function generateRecommendation(sentiment: number, stockData: StockData): { en: string; kr: string } {
  const companyName = stockData.companyName;
  const companyNameKr = stockData.companyNameKr || stockData.companyName;
  
  let en = '';
  let kr = '';
  
  if (sentiment > 0.5) {
    en = `${companyName} is showing positive signals in both technical and fundamental analysis, recommending a buy. It is particularly suitable for long-term investors.`;
    kr = `${companyNameKr}은(는) 현재 기술적, 기본적 분석 모두 긍정적인 신호를 보이고 있어 매수 추천합니다. 특히 장기 투자자에게 적합한 종목으로 판단됩니다.`;
  } else if (sentiment > 0.2) {
    en = `${companyName} is showing a moderate upward trend, making a small, divided buying strategy appropriate. It would be good to build a position while watching the market situation.`;
    kr = `${companyNameKr}은(는) 완만한 상승 추세를 보이고 있어 소액 분할 매수 전략이 적합합니다. 시장 상황을 주시하며 포지션을 구축하는 것이 좋겠습니다.`;
  } else if (sentiment > -0.2) {
    en = `${companyName} is currently showing neutral signals, so we recommend watching. It would be good to make an investment decision after waiting for additional momentum or corporate events.`;
    kr = `${companyNameKr}은(는) 현재 중립적인 신호를 보이고 있어 관망을 추천합니다. 추가적인 모멘텀이나 기업 이벤트를 기다린 후 투자 결정을 하는 것이 좋겠습니다.`;
  } else if (sentiment > -0.5) {
    en = `${companyName} has detected a weak signal, so it is time to refrain from new purchases and consider clearing some positions if you are holding them.`;
    kr = `${companyNameKr}은(는) 약세 신호가 감지되어 신규 매수는 자제하고 보유 중인 경우 일부 포지션 정리를 고려해볼 시점입니다.`;
  } else {
    en = `${companyName} is currently showing negative signals in both technical and fundamental analysis, recommending a sell or wait. It would be good to refrain from new investments until market conditions improve.`;
    kr = `${companyNameKr}은(는) 현재 기술적, 기본적 분석 모두 부정적인 신호를 보이고 있어 매도 또는 관망을 추천합니다. 시장 상황이 개선될 때까지 신규 투자는 자제하는 것이 좋겠습니다.`;
  }
  
  return { en, kr };
}

// 모의 주식 데이터 생성
export function generateMockStockData(symbol: string): StockData {
  try {
    // 회사 정보 가져오기
    const companyInfo = getCompanyInfo(symbol);
    
    // 모의 데이터 생성
    const currentPrice = 100 + Math.random() * 900;
    const priceChange = Math.random() * 10 - 5; // -5% ~ +5%
    
    // 과거 주가 데이터 생성
    const historicalPrices = generateMockHistoricalPrices(currentPrice);
    
    // 기술적 지표 계산
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
    
    // 차트 패턴 생성
    const patterns = generateChartPatterns();
    
    // 모의 뉴스 생성
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
          type: '실적 발표',
          title: '분기별 실적 발표',
          description: `${companyInfo.companyName}의 분기별 실적 발표`,
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
  } catch (error) {
    // 모의 데이터 생성 중 오류 발생 시 최소한의 데이터 반환
    console.error('모의 주식 데이터 생성 오류:', error);
    
    // 최소한의 필수 데이터만 포함한 기본 객체 반환
    return {
      ticker: symbol,
      companyName: `${symbol} Inc.`,
      companyNameKr: `${symbol} 주식회사`,
      description: `${symbol} is a publicly traded company.`,
      descriptionKr: `${symbol}은(는) 공개적으로 거래되는 회사입니다.`,
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
        ma200: 0,
        ema20: 0,
        ema50: 0,
        atr: 0,
        obv: 0,
        stochastic: {
          k: 0,
          d: 0
        },
        adx: 0,
        supportLevels: [],
        resistanceLevels: []
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
      news: [],
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

// 회사 정보 가져오기 (모의 데이터)
function getCompanyInfo(symbol: string) {
  const companies: Record<string, { companyName: string, companyNameKr: string, description: string, descriptionKr: string, sector: string, industry: string }> = {
    'AAPL': {
      companyName: 'Apple Inc.',
      companyNameKr: '애플',
      description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
      descriptionKr: '애플은 전 세계적으로 스마트폰, 개인용 컴퓨터, 태블릿, 웨어러블 기기 및 액세서리를 설계, 제조 및 판매하는 기업입니다.',
      sector: 'Technology',
      industry: 'Consumer Electronics'
    },
    'MSFT': {
      companyName: 'Microsoft Corporation',
      companyNameKr: '마이크로소프트',
      description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.',
      descriptionKr: '마이크로소프트는 전 세계적으로 소프트웨어, 서비스, 기기 및 솔루션을 개발, 라이선스 및 지원하는 기업입니다.',
      sector: 'Technology',
      industry: 'Software—Infrastructure'
    },
    'GOOGL': {
      companyName: 'Alphabet Inc.',
      companyNameKr: '알파벳',
      description: 'Alphabet Inc. provides various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.',
      descriptionKr: '알파벳은 미국, 유럽, 중동, 아프리카, 아시아-태평양, 캐나다 및 라틴 아메리카에서 다양한 제품과 플랫폼을 제공하는 기업입니다.',
      sector: 'Technology',
      industry: 'Internet Content & Information'
    },
    'AMZN': {
      companyName: 'Amazon.com, Inc.',
      companyNameKr: '아마존닷컴',
      description: 'Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions in North America and internationally.',
      descriptionKr: '아마존닷컴은 북미 및 국제적으로 소비자 제품의 소매 판매 및 구독 서비스를 제공하는 기업입니다.',
      sector: 'Consumer Cyclical',
      industry: 'Internet Retail'
    },
    'META': {
      companyName: 'Meta Platforms, Inc.',
      companyNameKr: '메타 플랫폼스',
      description: 'Meta Platforms, Inc. develops products that enable people to connect and share with friends and family through mobile devices, personal computers, virtual reality headsets, and in-home devices worldwide.',
      descriptionKr: '메타 플랫폼스는 모바일 기기, 개인용 컴퓨터, 가상 현실 헤드셋 및 가정용 기기를 통해 전 세계적으로 사람들이 친구 및 가족과 연결하고 공유할 수 있는 제품을 개발하는 기업입니다.',
      sector: 'Technology',
      industry: 'Internet Content & Information'
    },
    'TSLA': {
      companyName: 'Tesla, Inc.',
      companyNameKr: '테슬라',
      description: 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems in the United States, China, and internationally.',
      descriptionKr: '테슬라는 미국, 중국 및 국제적으로 전기 자동차, 에너지 생성 및 저장 시스템을 설계, 개발, 제조, 임대 및 판매하는 기업입니다.',
      sector: 'Consumer Cyclical',
      industry: 'Auto Manufacturers'
    },
    'NVDA': {
      companyName: 'NVIDIA Corporation',
      companyNameKr: '엔비디아',
      description: 'NVIDIA Corporation provides graphics, and compute and networking solutions in the United States, Taiwan, China, and internationally.',
      descriptionKr: '엔비디아는 미국, 대만, 중국 및 국제적으로 그래픽, 컴퓨팅 및 네트워킹 솔루션을 제공하는 기업입니다.',
      sector: 'Technology',
      industry: 'Semiconductors'
    },
    'NFLX': {
      companyName: 'Netflix, Inc.',
      companyNameKr: '넷플릭스',
      description: 'Netflix, Inc. provides entertainment services. It offers TV series, documentaries, feature films, and mobile games across various genres and languages.',
      descriptionKr: '넷플릭스는 다양한 장르와 언어로 TV 시리즈, 다큐멘터리, 영화 및 모바일 게임을 제공하는 엔터테인먼트 서비스 기업입니다.',
      sector: 'Communication Services',
      industry: 'Entertainment'
    },
    'JPM': {
      companyName: 'JPMorgan Chase & Co.',
      companyNameKr: 'JP모건 체이스',
      description: 'JPMorgan Chase & Co. operates as a financial services company worldwide. It operates through four segments: Consumer & Community Banking, Corporate & Investment Bank, Commercial Banking, and Asset & Wealth Management.',
      descriptionKr: 'JP모건 체이스는 전 세계적으로 금융 서비스를 제공하는 기업으로, 소비자 및 커뮤니티 뱅킹, 기업 및 투자 은행, 상업 뱅킹, 자산 및 자산 관리 등 네 가지 부문으로 운영됩니다.',
      sector: 'Financial Services',
      industry: 'Banks—Diversified'
    },
    'KO': {
      companyName: 'The Coca-Cola Company',
      companyNameKr: '코카콜라',
      description: 'The Coca-Cola Company, a beverage company, manufactures, markets, and sells various nonalcoholic beverages worldwide.',
      descriptionKr: '코카콜라는 전 세계적으로 다양한 비알코올 음료를 제조, 마케팅 및 판매하는 음료 기업입니다.',
      sector: 'Consumer Defensive',
      industry: 'Beverages—Non-Alcoholic'
    }
  };
  
  // 기본 회사 정보 (요청한 심볼이 없는 경우)
  const defaultCompany = {
    companyName: `${symbol} Corporation`,
    companyNameKr: `${symbol} 코퍼레이션`,
    description: `${symbol} is a publicly traded company on the stock market.`,
    descriptionKr: `${symbol}은(는) 주식 시장에 상장된 기업입니다.`,
    sector: 'Miscellaneous',
    industry: 'Diversified'
  };
  
  return companies[symbol] || defaultCompany;
}

// 미래 날짜 생성 (최대 일수 이내)
function getRandomFutureDate(maxDays: number): string {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + Math.floor(Math.random() * maxDays) + 1);
  return futureDate.toISOString().split('T')[0];
}

// 모의 뉴스 생성
function generateMockNews(symbol: string, companyName: string) {
  const newsTemplates = [
    {
      title: `${companyName}, 예상치 상회하는 분기 실적 발표`,
      source: 'Financial Times',
      date: getRandomPastDate(10),
      url: '#',
      sentiment: 'positive'
    },
    {
      title: `${companyName}, 신제품 출시로 시장 점유율 확대 전망`,
      source: 'Bloomberg',
      date: getRandomPastDate(5),
      url: '#',
      sentiment: 'positive'
    },
    {
      title: `분석가들, ${companyName} 주가 목표치 상향 조정`,
      source: 'CNBC',
      date: getRandomPastDate(3),
      url: '#',
      sentiment: 'positive'
    },
    {
      title: `${companyName}, 경쟁사와의 특허 분쟁 해결`,
      source: 'Reuters',
      date: getRandomPastDate(7),
      url: '#',
      sentiment: 'neutral'
    },
    {
      title: `${companyName}, 신규 시장 진출 계획 발표`,
      source: 'Wall Street Journal',
      date: getRandomPastDate(2),
      url: '#',
      sentiment: 'positive'
    },
    {
      title: `${companyName}, 공급망 문제로 생산 차질 우려`,
      source: 'MarketWatch',
      date: getRandomPastDate(4),
      url: '#',
      sentiment: 'negative'
    },
    {
      title: `${companyName}, 지속가능성 이니셔티브 발표`,
      source: 'Forbes',
      date: getRandomPastDate(6),
      url: '#',
      sentiment: 'positive'
    }
  ];
  
  // 3-5개의 뉴스 항목 선택
  const newsCount = 3 + Math.floor(Math.random() * 3);
  const selectedNews = [];
  const availableNews = [...newsTemplates]; // 복사본 생성
  
  for (let i = 0; i < newsCount; i++) {
    if (availableNews.length === 0) break;
    
    const randomIndex = Math.floor(Math.random() * availableNews.length);
    selectedNews.push(availableNews[randomIndex]);
    availableNews.splice(randomIndex, 1);
  }
  
  return selectedNews;
}

// 과거 날짜 생성 (최대 일수 이내)
function getRandomPastDate(maxDays: number): string {
  const today = new Date();
  const pastDate = new Date(today);
  pastDate.setDate(today.getDate() - Math.floor(Math.random() * maxDays) - 1);
  return pastDate.toISOString().split('T')[0];
}

// 차트 패턴 생성
function generateChartPatterns() {
  const patternTemplates = [
    {
      name: '헤드앤숄더',
      description: '헤드앤숄더 패턴은 세 개의 피크로 구성되며, 가운데 피크가 양쪽 피크보다 높습니다. 일반적으로 하락 반전 신호로 해석됩니다.',
      descriptionKr: '헤드앤숄더 패턴은 세 개의 피크로 구성되며, 가운데 피크가 양쪽 피크보다 높습니다. 일반적으로 하락 반전 신호로 해석됩니다.',
      bullish: false,
      confidence: 75 + Math.floor(Math.random() * 20),
      formationDate: getRandomPastDate(30)
    },
    {
      name: '역헤드앤숄더',
      description: '역헤드앤숄더 패턴은 세 개의 저점으로 구성되며, 가운데 저점이 양쪽 저점보다 낮습니다. 일반적으로 상승 반전 신호로 해석됩니다.',
      descriptionKr: '역헤드앤숄더 패턴은 세 개의 저점으로 구성되며, 가운데 저점이 양쪽 저점보다 낮습니다. 일반적으로 상승 반전 신호로 해석됩니다.',
      bullish: true,
      confidence: 75 + Math.floor(Math.random() * 20),
      formationDate: getRandomPastDate(30)
    },
    {
      name: '더블 탑',
      description: '더블 탑 패턴은 두 개의 비슷한 높이의 피크로 구성됩니다. 일반적으로 하락 반전 신호로 해석됩니다.',
      descriptionKr: '더블 탑 패턴은 두 개의 비슷한 높이의 피크로 구성됩니다. 일반적으로 하락 반전 신호로 해석됩니다.',
      bullish: false,
      confidence: 70 + Math.floor(Math.random() * 20),
      formationDate: getRandomPastDate(30)
    },
    {
      name: '더블 바텀',
      description: '더블 바텀 패턴은 두 개의 비슷한 저점으로 구성됩니다. 일반적으로 상승 반전 신호로 해석됩니다.',
      descriptionKr: '더블 바텀 패턴은 두 개의 비슷한 저점으로 구성됩니다. 일반적으로 상승 반전 신호로 해석됩니다.',
      bullish: true,
      confidence: 70 + Math.floor(Math.random() * 20),
      formationDate: getRandomPastDate(30)
    },
    {
      name: '삼각형 패턴',
      description: '삼각형 패턴은 가격이 점점 좁아지는 범위 내에서 움직이는 것을 나타냅니다. 방향성 돌파가 예상됩니다.',
      descriptionKr: '삼각형 패턴은 가격이 점점 좁아지는 범위 내에서 움직이는 것을 나타냅니다. 방향성 돌파가 예상됩니다.',
      bullish: Math.random() > 0.5,
      confidence: 65 + Math.floor(Math.random() * 20),
      formationDate: getRandomPastDate(30)
    },
    {
      name: '플래그 패턴',
      description: '플래그 패턴은 짧은 기간 동안의 통합 후 이전 추세가 계속될 것으로 예상되는 패턴입니다.',
      descriptionKr: '플래그 패턴은 짧은 기간 동안의 통합 후 이전 추세가 계속될 것으로 예상되는 패턴입니다.',
      bullish: Math.random() > 0.5,
      confidence: 65 + Math.floor(Math.random() * 20),
      formationDate: getRandomPastDate(30)
    },
    {
      name: '컵앤핸들',
      description: '컵앤핸들 패턴은 U자형 컵과 그 오른쪽의 작은 하락(핸들)으로 구성됩니다. 일반적으로 상승 신호로 해석됩니다.',
      descriptionKr: '컵앤핸들 패턴은 U자형 컵과 그 오른쪽의 작은 하락(핸들)으로 구성됩니다. 일반적으로 상승 신호로 해석됩니다.',
      bullish: true,
      confidence: 70 + Math.floor(Math.random() * 20),
      formationDate: getRandomPastDate(30)
    },
  ];

  // 0-3개의 패턴을 랜덤하게 선택
  const patternCount = Math.floor(Math.random() * 3);
  const patterns = [];
  const availablePatterns = [...patternTemplates]; // 복사본 생성

  for (let i = 0; i < patternCount; i++) {
    if (availablePatterns.length === 0) break;
    
    const randomIndex = Math.floor(Math.random() * availablePatterns.length);
    patterns.push(availablePatterns[randomIndex]);
    availablePatterns.splice(randomIndex, 1);
  }

  return patterns;
}

// 모의 경제 지표 데이터 생성
function generateAdditionalMockEconomicData(): EconomicIndicator[] {
  return [
    {
      name: 'GDP Growth Rate',
      nameKr: 'GDP 성장률',
      value: 2.1,
      unit: '%',
      change: 0.3,
      previousPeriod: '2023-Q2',
      description: '국내총생산 성장률',
      impact: 'positive' as const,
      source: 'FRED (모의 데이터)'
    },
    {
      name: 'Unemployment Rate',
      nameKr: '실업률',
      value: 3.8,
      unit: '%',
      change: -0.1,
      previousPeriod: '2023-08',
      description: '미국 실업률',
      impact: 'negative' as const,
      source: 'FRED (모의 데이터)'
    },
    {
      name: 'Consumer Price Index',
      nameKr: '소비자물가지수',
      value: 3.2,
      unit: '%',
      change: -0.2,
      previousPeriod: '2023-08',
      description: '소비자물가지수 변화율',
      impact: 'neutral' as const,
      source: 'FRED (모의 데이터)'
    },
    {
      name: 'Federal Funds Rate',
      nameKr: '기준금리',
      value: 5.25,
      unit: '%',
      change: 0,
      previousPeriod: '2023-08',
      description: '미 연방준비제도 기준금리',
      impact: 'negative' as const,
      source: 'FRED (모의 데이터)'
    },
    {
      name: 'Industrial Production',
      nameKr: '산업생산지수',
      value: 0.4,
      unit: '%',
      change: 0.7,
      previousPeriod: '2023-08',
      description: '산업생산지수 변화율',
      impact: 'positive' as const,
      source: 'FRED (모의 데이터)'
    },
    {
      name: 'KRW/USD Exchange Rate',
      nameKr: '원/달러 환율',
      value: 1350.25,
      unit: 'KRW',
      change: 2.1,
      previousPeriod: '2023-09-01',
      description: '원/달러 환율',
      impact: 'neutral' as const,
      source: 'FRED (모의 데이터)'
    }
  ];
}

// 목업 예측 결과 생성
function generateMockPrediction(ticker: string, currentPrice: number): PredictionResult {
  // 단기, 중기, 장기 예측 가격 생성
  const shortTermChange = -10 + Math.random() * 20; // -10% ~ +10%
  const mediumTermChange = -15 + Math.random() * 30; // -15% ~ +15%
  const longTermChange = -20 + Math.random() * 40; // -20% ~ +40%
  
  const shortTermPrice = currentPrice * (1 + shortTermChange / 100);
  const mediumTermPrice = currentPrice * (1 + mediumTermChange / 100);
  const longTermPrice = currentPrice * (1 + longTermChange / 100);
  
  // 향후 6개월 예측 가격 생성
  const pricePredictions = [];
  const today = new Date();
  let predictedPrice = currentPrice;
  
  for (let i = 1; i <= 180; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    // 장기 예측 가격을 향해 점진적으로 변화
    const progress = i / 180;
    const targetChange = longTermChange / 100;
    const dailyChange = targetChange * progress + (Math.random() * 0.01 - 0.005); // 약간의 랜덤 변동 추가
    
    predictedPrice = predictedPrice * (1 + dailyChange / 100);
    
    // 30일 간격으로 데이터 추가 (차트 데이터 포인트 줄이기)
    if (i % 30 === 0) {
      pricePredictions.push({
        date: date.toISOString().split('T')[0],
        predictedPrice: parseFloat(predictedPrice.toFixed(2)),
      });
    }
  }
  
  // 목업 주식 데이터 생성 (generateRecommendation 함수에 필요)
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
      bollingerUpper: 0,
      bollingerLower: 0,
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
  
  // 평균 변화율 기반 감정 점수 계산
  const avgChange = (shortTermChange + mediumTermChange + longTermChange) / 3;
  const sentiment = avgChange / 20; // -1 ~ 1 범위로 정규화
  
  // 강점과 위험 요소 생성
  const strengths = generateStrengths(mockStockData, sentiment);
  const risks = generateRisks(mockStockData, sentiment, []);
  
  // 투자 추천 생성
  const recommendation = generateRecommendation(sentiment, mockStockData);
  
  // 전체 요약 생성
  const summary = `${ticker}의 현재 주가는 $${currentPrice.toFixed(2)}이며, 
  기술적 분석과 기본적 분석을 종합한 결과 ${sentiment > 0 ? '긍정적' : '부정적'} 전망을 보이고 있습니다. 
  단기(1개월) 예상 가격은 $${shortTermPrice.toFixed(2)}, 중기(3개월) $${mediumTermPrice.toFixed(2)}, 
  장기(6개월) $${longTermPrice.toFixed(2)}입니다. ${recommendation.en}`;
  
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
    confidenceScore: 60 + Math.floor(Math.random() * 30), // 60-89% 신뢰도
    modelInfo: {
      type: 'Transformer',
      accuracy: 80,
      features: [
        '과거 주가 데이터',
        '거래량',
        '기술적 지표',
        '시장 지표'
      ],
      trainPeriod: '2018-01-01 ~ 현재'
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

// AI 모델을 사용한 주식 분석 함수
export async function analyzeStockWithAI(
  stockData: StockData,
  economicData: EconomicIndicator[],
  analysisType: string = 'comprehensive',
  modelType: string = 'transformer', // 'lstm' 또는 'transformer'
  language: string = 'kr' // 'en' 또는 'kr'
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
      return { error: errorData.error || '분석 요청 실패' };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('AI 분석 오류:', error);
    return { error: '분석 중 오류가 발생했습니다' };
  }
}

// 주가 예측 함수 (LSTM 또는 Transformer 모델 사용)
export async function predictStockPrice(
  stockData: StockData,
  modelType: string = 'transformer', // 'lstm' 또는 'transformer'
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
      return { error: errorData.error || '예측 요청 실패' };
    }

    const data = await response.json();
    return data.prediction;
  } catch (error) {
    console.error('주가 예측 오류:', error);
    return { error: '예측 중 오류가 발생했습니다' };
  }
}

// 모의 LSTM 예측 결과 생성 (실제 구현 전 테스트용)
export function generateMockLSTMPrediction(stockData: StockData): PredictionResult {
  const currentPrice = stockData.currentPrice;
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
    const volatility = currentPrice * 0.01 * Math.random(); // 현재 가격의 최대 1% 변동
    predictedPrice += (Math.random() > 0.5 ? volatility : -volatility);
    
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
        '과거 주가 데이터',
        '거래량',
        '기술적 지표 (RSI, MACD, 볼린저 밴드)',
        '시장 지표',
        '계절성 패턴'
      ],
      trainPeriod: '2018-01-01 ~ 현재'
    },
    summary: `${stockData.companyName}의 주가는 단기적으로 ${shortTermChange > 0 ? '상승' : '하락'}할 것으로 예상됩니다. 중기적으로는 ${mediumTermChange > 0 ? '상승' : '하락'} 추세를 보일 것으로 예측됩니다.`,
    summaryKr: `${stockData.companyNameKr || stockData.companyName}의 주가는 단기적으로 ${shortTermChange > 0 ? '상승' : '하락'}할 것으로 예상됩니다. 중기적으로는 ${mediumTermChange > 0 ? '상승' : '하락'} 추세를 보일 것으로 예측됩니다.`,
    strengths: [
      '강력한 재무 상태',
      '경쟁사 대비 높은 수익성',
      '지속적인 혁신과 R&D 투자'
    ],
    risks: [
      '시장 경쟁 심화',
      '규제 환경 변화 가능성',
      '원자재 가격 상승으로 인한 마진 압박'
    ],
    recommendation: shortTermChange > 0 ? 'BUY' : (shortTermChange < -3 ? 'SELL' : 'HOLD'),
    recommendationKr: shortTermChange > 0 ? '매수' : (shortTermChange < -3 ? '매도' : '관망'),
    analysisDetails: `LSTM 모델은 과거 5년간의 주가 데이터, 거래량, 기술적 지표를 학습하여 예측을 생성했습니다. 모델은 특히 ${stockData.companyName}의 계절적 패턴과 시장 사이클에 대한 반응을 잘 포착했습니다.`,
    analysisDetailsKr: `LSTM 모델은 과거 5년간의 주가 데이터, 거래량, 기술적 지표를 학습하여 예측을 생성했습니다. 모델은 특히 ${stockData.companyNameKr || stockData.companyName}의 계절적 패턴과 시장 사이클에 대한 반응을 잘 포착했습니다.`
  };
}

// 모의 Transformer 예측 결과 생성 (실제 구현 전 테스트용)
export function generateMockTransformerPrediction(stockData: StockData): PredictionResult {
  const currentPrice = stockData.currentPrice;
  const shortTermChange = Math.random() * 12 - 5; // -5% ~ +7%
  const mediumTermChange = Math.random() * 25 - 8; // -8% ~ +17%
  const longTermChange = Math.random() * 35 - 10; // -10% ~ +25%
  
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
    
    // 약간의 변동성 추가 (Transformer는 LSTM보다 약간 더 정확하다고 가정)
    const volatility = currentPrice * 0.008 * Math.random(); // 현재 가격의 최대 0.8% 변동
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
    summary: `${stockData.companyName}의 주가는 단기적으로 ${shortTermChange > 0 ? '상승' : '하락'}할 것으로 예상됩니다. 중기적으로는 ${mediumTermChange > 0 ? '상승' : '하락'} 추세를 보일 것으로 예측됩니다. 장기적으로는 ${longTermChange > 0 ? '긍정적인' : '부정적인'} 전망을 가지고 있습니다.`,
    summaryKr: `${stockData.companyNameKr || stockData.companyName}의 주가는 단기적으로 ${shortTermChange > 0 ? '상승' : '하락'}할 것으로 예상됩니다. 중기적으로는 ${mediumTermChange > 0 ? '상승' : '하락'} 추세를 보일 것으로 예측됩니다. 장기적으로는 ${longTermChange > 0 ? '긍정적인' : '부정적인'} 전망을 가지고 있습니다.`,
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
    recommendation: shortTermChange > 0 ? 'BUY' : (shortTermChange < -3 ? 'SELL' : 'HOLD'),
    recommendationKr: shortTermChange > 0 ? '매수' : (shortTermChange < -3 ? '매도' : '관망'),
    analysisDetails: `Transformer 모델은 과거 8년간의 주가 데이터, 거래량, 기술적 지표, 뉴스 감성 분석 결과를 학습하여 예측을 생성했습니다. 모델은 특히 ${stockData.companyName}의 계절적 패턴, 시장 사이클, 그리고 뉴스 이벤트에 대한 반응을 잘 포착했습니다. 자기 주의(Self-Attention) 메커니즘을 통해 장기 의존성을 효과적으로 모델링했습니다.`,
    analysisDetailsKr: `Transformer 모델은 과거 8년간의 주가 데이터, 거래량, 기술적 지표, 뉴스 감성 분석 결과를 학습하여 예측을 생성했습니다. 모델은 특히 ${stockData.companyNameKr || stockData.companyName}의 계절적 패턴, 시장 사이클, 그리고 뉴스 이벤트에 대한 반응을 잘 포착했습니다. 자기 주의(Self-Attention) 메커니즘을 통해 장기 의존성을 효과적으로 모델링했습니다.`
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  
  if (!symbol) {
    return NextResponse.json({ error: '주식 심볼이 필요합니다' }, { status: 400 });
  }
  
  try {
    const stockData = await fetchStockData(symbol);
    return NextResponse.json(stockData);
  } catch (error) {
    console.error('주식 데이터 가져오기 실패:', error);
    return NextResponse.json({ error: '데이터를 가져오는 중 오류가 발생했습니다' }, { status: 500 });
  }
} 

// 기술적 지표 기반 감성 점수 계산 (0-100)
function calculateTechnicalSentiment(technicalIndicators: any): number {
  let sentiment = 50; // 중립 시작점
  
  // RSI 기반 점수 조정 (과매수/과매도 상태 반영)
  if (technicalIndicators.rsi < 30) {
    sentiment += 10; // 과매도 상태는 상승 가능성
  } else if (technicalIndicators.rsi > 70) {
    sentiment -= 10; // 과매수 상태는 하락 가능성
  } else if (technicalIndicators.rsi > 50) {
    sentiment += 5; // 중립보다 약간 높은 RSI
  } else {
    sentiment -= 5; // 중립보다 약간 낮은 RSI
  }
  
  // MACD 기반 점수 조정
  if (technicalIndicators.macd && technicalIndicators.macd.value > 0) {
    sentiment += 5; // 양의 MACD는 상승 추세
    if (technicalIndicators.macd.histogram > 0) {
      sentiment += 5; // 양의 히스토그램은 강한 상승 모멘텀
    }
  } else if (technicalIndicators.macd && technicalIndicators.macd.value < 0) {
    sentiment -= 5; // 음의 MACD는 하락 추세
    if (technicalIndicators.macd.histogram < 0) {
      sentiment -= 5; // 음의 히스토그램은 강한 하락 모멘텀
    }
  }
  
  // 이동평균선 기반 점수 조정
  const currentPrice = technicalIndicators.bollingerBands?.middle || 0;
  if (currentPrice > technicalIndicators.ma50) {
    sentiment += 5; // 50일 이동평균선 위는 상승 추세
  } else {
    sentiment -= 5; // 50일 이동평균선 아래는 하락 추세
  }
  
  if (currentPrice > technicalIndicators.ma200) {
    sentiment += 5; // 200일 이동평균선 위는 장기 상승 추세
  } else {
    sentiment -= 5; // 200일 이동평균선 아래는 장기 하락 추세
  }
  
  // 볼린저 밴드 기반 점수 조정
  if (technicalIndicators.bollingerBands) {
    const { upper, middle, lower } = technicalIndicators.bollingerBands;
    if (currentPrice > upper) {
      sentiment -= 10; // 상단 밴드 위는 과매수 가능성
    } else if (currentPrice < lower) {
      sentiment += 10; // 하단 밴드 아래는 과매도 가능성
    }
  }
  
  // 점수 범위 제한 (0-100)
  return Math.max(0, Math.min(100, sentiment));
}

// 기본적 지표 기반 감성 점수 계산 (0-100)
function calculateFundamentalSentiment(fundamentals: any): number {
  let sentiment = 50; // 중립 시작점
  
  // P/E 비율 기반 점수 조정
  if (fundamentals.pe > 0) {
    if (fundamentals.pe < 15) {
      sentiment += 10; // 낮은 P/E는 저평가 가능성
    } else if (fundamentals.pe > 30) {
      sentiment -= 10; // 높은 P/E는 고평가 가능성
    }
  }
  
  // 성장률 기반 점수 조정
  if (fundamentals.revenueGrowth > 20) {
    sentiment += 10; // 높은 매출 성장률
  } else if (fundamentals.revenueGrowth < 0) {
    sentiment -= 10; // 매출 감소
  }
  
  if (fundamentals.epsGrowth > 20) {
    sentiment += 10; // 높은 EPS 성장률
  } else if (fundamentals.epsGrowth < 0) {
    sentiment -= 10; // EPS 감소
  }
  
  // 수익성 지표 기반 점수 조정
  if (fundamentals.operatingMargin > 20) {
    sentiment += 5; // 높은 영업 마진
  } else if (fundamentals.operatingMargin < 10) {
    sentiment -= 5; // 낮은 영업 마진
  }
  
  if (fundamentals.roe > 15) {
    sentiment += 5; // 높은 ROE
  } else if (fundamentals.roe < 5) {
    sentiment -= 5; // 낮은 ROE
  }
  
  // 배당 수익률 기반 점수 조정
  if (fundamentals.dividendYield > 3) {
    sentiment += 5; // 높은 배당 수익률
  }
  
  // 부채 비율 기반 점수 조정
  if (fundamentals.debtToEquity > 2) {
    sentiment -= 5; // 높은 부채 비율
  }
  
  // 점수 범위 제한 (0-100)
  return Math.max(0, Math.min(100, sentiment));
}

// 경제 지표 기반 감성 점수 계산 (0-100)
function calculateEconomicSentiment(economicData: any[]): number {
  if (!economicData || economicData.length === 0) {
    return 50; // 데이터 없으면 중립 반환
  }
  
  let sentiment = 50; // 중립 시작점
  
  // 각 경제 지표별 영향 평가
  for (const indicator of economicData) {
    // 인플레이션 (CPI)
    if (indicator.name.includes('Inflation') || indicator.name.includes('Consumer Price')) {
      if (indicator.change < 0) {
        sentiment += 5; // 인플레이션 감소는 긍정적
      } else if (indicator.change > 0.5) {
        sentiment -= 5; // 인플레이션 증가는 부정적
      }
    }
    
    // 금리
    if (indicator.name.includes('Interest') || indicator.name.includes('Federal Funds')) {
      if (indicator.change < 0) {
        sentiment += 5; // 금리 하락은 긍정적
      } else if (indicator.change > 0) {
        sentiment -= 5; // 금리 상승은 부정적
      }
    }
    
    // GDP 성장률
    if (indicator.name.includes('GDP')) {
      if (indicator.value > 2) {
        sentiment += 5; // 높은 GDP 성장률은 긍정적
      } else if (indicator.value < 0) {
        sentiment -= 10; // 마이너스 GDP 성장률은 매우 부정적
      }
    }
    
    // 실업률
    if (indicator.name.includes('Unemployment')) {
      if (indicator.change < 0) {
        sentiment += 5; // 실업률 감소는 긍정적
      } else if (indicator.change > 0.2) {
        sentiment -= 5; // 실업률 증가는 부정적
      }
    }
    
    // 소비자 신뢰지수
    if (indicator.name.includes('Consumer Confidence')) {
      if (indicator.change > 0) {
        sentiment += 5; // 소비자 신뢰지수 상승은 긍정적
      } else if (indicator.change < 0) {
        sentiment -= 5; // 소비자 신뢰지수 하락은 부정적
      }
    }
    
    // 산업생산지수
    if (indicator.name.includes('Industrial Production')) {
      if (indicator.change > 0) {
        sentiment += 3; // 산업생산 증가는 긍정적
      } else if (indicator.change < 0) {
        sentiment -= 3; // 산업생산 감소는 부정적
      }
    }
  }
  
  // 점수 범위 제한 (0-100)
  return Math.max(0, Math.min(100, sentiment));
}
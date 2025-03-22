'use client';

import { StockData, EconomicIndicator, PredictionResult, YahooFinanceResponse, FredApiResponse, SimpleEconomicIndicator } from './types';
import yahooFinance from 'yahoo-finance2';
import { NextRequest, NextResponse } from 'next/server';
import { format, subDays, subMonths } from 'date-fns';

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
export async function fetchStockData(ticker: string): Promise<StockData> {
  try {
    // Yahoo Finance API 직접 호출시 CORS 오류 발생 가능성이 있습니다.
    // 개발 환경에서는 모의 데이터를 사용하고, 프로덕션에서는 실제 API 호출을 시도합니다.
    if (process.env.NODE_ENV === 'development') {
      console.log('개발 환경에서 모의 데이터를 사용합니다.');
      return await getMockStockData(ticker);
    }
    
    try {
      // 라이브러리를 사용한 Yahoo Finance API 호출
      const quote = await yahooFinance.quote(ticker);
      const profile = await yahooFinance.quoteSummary(ticker, { modules: ['assetProfile', 'summaryDetail', 'price', 'defaultKeyStatistics', 'financialData'] });
      
      // 히스토리컬 데이터 가져오기 (1년)
      const endDate = new Date();
      const startDate = subMonths(endDate, 12);
      const historical = await yahooFinance.historical(ticker, {
        period1: startDate,
        period2: endDate,
        interval: '1d'
      });

      // 기술적 지표 계산
      const technicalIndicators = calculateTechnicalIndicators(historical);

      return {
        ticker,
        companyName: quote.longName || quote.shortName || ticker,
        currentPrice: quote.regularMarketPrice,
        priceChange: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume,
        marketCap: quote.marketCap,
        high52Week: quote.fiftyTwoWeekHigh,
        low52Week: quote.fiftyTwoWeekLow,
        description: profile.assetProfile?.longBusinessSummary,
        descriptionKr: await translateToKorean(profile.assetProfile?.longBusinessSummary),
        sector: profile.assetProfile?.sector,
        industry: profile.assetProfile?.industry,
        lastUpdated: new Date().toISOString(),
        historicalPrices: historical.map(item => ({
          date: format(item.date, 'yyyy-MM-dd'),
          price: item.close,
          volume: item.volume,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close
        })),
        technicalIndicators,
        fundamentals: {
          pe: profile.summaryDetail?.trailingPE,
          eps: profile.defaultKeyStatistics?.trailingEps,
          dividendYield: profile.summaryDetail?.dividendYield ? profile.summaryDetail.dividendYield * 100 : 0,
          peg: profile.defaultKeyStatistics?.pegRatio,
          roe: profile.financialData?.returnOnEquity ? profile.financialData.returnOnEquity * 100 : undefined,
          debtToEquity: profile.financialData?.debtToEquity,
          revenue: profile.financialData?.totalRevenue,
          revenueGrowth: profile.financialData?.revenueGrowth ? profile.financialData.revenueGrowth * 100 : undefined,
          netIncome: profile.financialData?.netIncome,
          netIncomeGrowth: calculateGrowthRate(historical),
          operatingMargin: profile.financialData?.operatingMargins ? profile.financialData.operatingMargins * 100 : undefined,
          nextEarningsDate: profile.defaultKeyStatistics?.nextEarningsDate,
          analystRatings: {
            buy: profile.financialData?.recommendationKey === 'buy' ? 1 : 0,
            hold: profile.financialData?.recommendationKey === 'hold' ? 1 : 0,
            sell: profile.financialData?.recommendationKey === 'sell' ? 1 : 0,
            targetPrice: profile.financialData?.targetHighPrice || quote.regularMarketPrice
          }
        }
      };
    } catch (apiError) {
      console.error('Yahoo Finance API 호출 오류:', apiError);
      console.log('API 호출 실패, 모의 데이터로 대체합니다.');
      return await getMockStockData(ticker);
    }
  } catch (error) {
    console.error('Error fetching stock data:', error);
    throw new Error('주식 데이터를 가져오는데 실패했습니다.');
  }
}

// 모의 주식 데이터 생성 함수 - 비동기 함수로 변경
async function getMockStockData(ticker: string): Promise<StockData> {
  const endDate = new Date();
  const startPrice = 150 + Math.random() * 100;
  let currentPrice = startPrice;
  const historicalPrices: any[] = [];
  
  // 365일치의 모의 주가 데이터 생성
  for (let i = 365; i >= 0; i--) {
    const date = new Date();
    date.setDate(endDate.getDate() - i);
    
    // 약간의 랜덤 변동
    const change = (Math.random() - 0.48) * 3; // 약간 상승 편향
    currentPrice = Math.max(currentPrice * (1 + change / 100), 1);
    
    const dayVolume = Math.floor(100000 + Math.random() * 1000000);
    const dayOpen = currentPrice * (1 + (Math.random() - 0.5) / 100);
    const dayHigh = Math.max(currentPrice, dayOpen) * (1 + Math.random() / 100);
    const dayLow = Math.min(currentPrice, dayOpen) * (1 - Math.random() / 100);
    
    historicalPrices.push({
      date: format(date, 'yyyy-MM-dd'),
      price: currentPrice,
      volume: dayVolume,
      open: dayOpen,
      high: dayHigh,
      low: dayLow,
      close: currentPrice
    });
  }
  
  // 기술적 지표 계산
  const technicalIndicators = calculateTechnicalIndicators(
    historicalPrices.map(p => ({ 
      close: p.price,
      volume: p.volume,
      date: new Date(p.date)
    }))
  );
  
  // 모의 기업 정보
  const companyDescriptions: Record<string, string> = {
    'AAPL': 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
    'MSFT': 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.',
    'GOOGL': 'Alphabet Inc. provides various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.',
    'AMZN': 'Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions through online and physical stores in North America and internationally.',
    'META': 'Meta Platforms, Inc. engages in the development of products that enable people to connect and share with friends and family.',
    'TSLA': 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, energy generation and storage systems worldwide.',
    'NVDA': 'NVIDIA Corporation provides graphics, computing, and networking solutions in the United States, Taiwan, China, and internationally.',
    'DEFAULT': '이 회사는 다양한 제품과 서비스를 제공하는 글로벌 기업입니다.'
  };
  
  const companyName = {
    'AAPL': '애플',
    'MSFT': '마이크로소프트',
    'GOOGL': '알파벳 (구글)',
    'AMZN': '아마존',
    'META': '메타 플랫폼스 (페이스북)',
    'TSLA': '테슬라',
    'NVDA': '엔비디아',
    'DEFAULT': ticker
  }[ticker.toUpperCase()] || ticker;
  
  const sector = {
    'AAPL': 'Technology',
    'MSFT': 'Technology',
    'GOOGL': 'Communication Services',
    'AMZN': 'Consumer Discretionary',
    'META': 'Communication Services',
    'TSLA': 'Consumer Discretionary',
    'NVDA': 'Technology',
    'DEFAULT': 'Various'
  }[ticker.toUpperCase()] || 'Technology';
  
  const industry = {
    'AAPL': 'Consumer Electronics',
    'MSFT': 'Software—Infrastructure',
    'GOOGL': 'Internet Content & Information',
    'AMZN': 'Internet Retail',
    'META': 'Internet Content & Information',
    'TSLA': 'Auto Manufacturers',
    'NVDA': 'Semiconductors',
    'DEFAULT': 'Electronics'
  }[ticker.toUpperCase()] || 'Electronics';
  
  // 기업 설명 한글화
  const koreanDescription = await translateToKorean(companyDescriptions[ticker.toUpperCase()] || companyDescriptions['DEFAULT']);
  
  // 모의 주식 데이터 객체 반환
  return {
    ticker: ticker.toUpperCase(),
    companyName: companyName,
    currentPrice: currentPrice,
    priceChange: ((currentPrice - startPrice) / startPrice) * 100,
    volume: Math.floor(500000 + Math.random() * 5000000),
    marketCap: currentPrice * (10000000 + Math.random() * 100000000),
    high52Week: Math.max(...historicalPrices.map(p => p.price)),
    low52Week: Math.min(...historicalPrices.map(p => p.price)),
    description: companyDescriptions[ticker.toUpperCase()] || companyDescriptions['DEFAULT'],
    descriptionKr: koreanDescription,
    sector: sector,
    industry: industry,
    lastUpdated: new Date().toISOString(),
    historicalPrices: historicalPrices,
    technicalIndicators: technicalIndicators,
    fundamentals: {
      pe: 15 + Math.random() * 30,
      eps: 5 + Math.random() * 15,
      dividendYield: Math.random() * 3,
      peg: 1 + Math.random() * 3,
      roe: 10 + Math.random() * 30,
      debtToEquity: 0.1 + Math.random() * 2,
      revenue: (1 + Math.random() * 20) * 1000000000,
      revenueGrowth: 5 + Math.random() * 30,
      netIncome: (0.1 + Math.random() * 5) * 1000000000,
      netIncomeGrowth: 3 + Math.random() * 40,
      operatingMargin: 10 + Math.random() * 30,
      nextEarningsDate: format(new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * (1 + Math.random())), 'yyyy-MM-dd'),
      analystRatings: {
        buy: Math.floor(Math.random() * 10) + 5,
        hold: Math.floor(Math.random() * 5) + 2,
        sell: Math.floor(Math.random() * 3),
        targetPrice: currentPrice * (1 + (Math.random() * 0.3))
      }
    }
  };
}

function calculateTechnicalIndicators(historical: any[]): StockData['technicalIndicators'] {
  if (!historical || historical.length === 0) return {};

  const prices = historical.map(h => h.close);
  const volumes = historical.map(h => h.volume);

  // RSI 계산 (14일)
  const rsi = calculateRSI(prices, 14);

  // MACD 계산 (12, 26, 9)
  const macd = calculateMACD(prices);

  // 이동평균선 계산
  const ma50 = calculateMA(prices, 50);
  const ma200 = calculateMA(prices, 200);

  // 볼린저 밴드 계산 (20일, 2표준편차)
  const bb = calculateBollingerBands(prices);

  return {
    rsi,
    macd,
    ma50,
    ma200,
    bollingerBands: bb
  };
}

function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const difference = prices[prices.length - i] - prices[prices.length - i - 1];
    if (difference >= 0) {
      gains += difference;
    } else {
      losses -= difference;
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateMACD(prices: number[]): { value: number; signal: number; histogram: number; } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  const signalLine = calculateEMA([...Array(prices.length - 26).fill(0), macdLine], 9);
  
  return {
    value: macdLine,
    signal: signalLine,
    histogram: macdLine - signalLine
  };
}

function calculateMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
}

function calculateEMA(prices: number[], period: number): number {
  const k = 2 / (period + 1);
  let ema = prices[0];
  
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  
  return ema;
}

function calculateBollingerBands(prices: number[]): { upper: number; middle: number; lower: number; } {
  const period = 20;
  if (prices.length < period) {
    return {
      upper: prices[prices.length - 1],
      middle: prices[prices.length - 1],
      lower: prices[prices.length - 1]
    };
  }

  const ma = calculateMA(prices, period);
  const recentPrices = prices.slice(-period);
  const stdDev = Math.sqrt(
    recentPrices.reduce((sum, price) => sum + Math.pow(price - ma, 2), 0) / period
  );

  return {
    upper: ma + (2 * stdDev),
    middle: ma,
    lower: ma - (2 * stdDev)
  };
}

function calculateGrowthRate(historical: any[]): number {
  if (!historical || historical.length < 2) return 0;
  
  const oldPrice = historical[0].close;
  const newPrice = historical[historical.length - 1].close;
  return ((newPrice - oldPrice) / oldPrice) * 100;
}

async function translateToKorean(text: string | undefined): Promise<string | undefined> {
  if (!text) return undefined;
  
  // TODO: 실제 번역 API 연동
  // 현재는 원문을 그대로 반환
  return text;
}

// 경제 지표 데이터 가져오기
export async function fetchEconomicIndicators(): Promise<EconomicIndicator[]> {
  // 실제 경제 지표 API 연동 필요
  return [
    {
      name: 'Federal Funds Rate',
      nameKr: '기준금리',
      value: 5.25,
      change: -0.25,
      unit: '%',
      source: 'Federal Reserve',
      impact: 'positive',
      description: '연방준비제도이사회가 설정한 현재 기준금리입니다.'
    },
    {
      name: 'Inflation Rate',
      nameKr: '물가상승률',
      value: 3.2,
      change: -0.1,
      unit: '%',
      source: 'Bureau of Labor Statistics',
      impact: 'neutral',
      description: '전년 대비 소비자물가 상승률입니다.'
    },
    {
      name: 'GDP Growth Rate',
      nameKr: 'GDP 성장률',
      value: 2.1,
      change: 0.3,
      unit: '%',
      source: 'Bureau of Economic Analysis',
      impact: 'positive',
      description: '전분기 대비 경제성장률입니다.'
    }
  ];
}

// 주식 예측 생성
export async function generatePrediction(
  ticker: string,
  stockData: StockData,
  economicIndicators: EconomicIndicator[],
  modelType: string = 'default'
): Promise<PredictionResult> {
  // 실제 AI 모델 연동 필요
  const currentPrice = stockData.currentPrice;
  const shortTermChange = Math.random() * 10 - 5; // -5% to +5%
  const mediumTermChange = Math.random() * 20 - 10; // -10% to +10%
  const longTermChange = Math.random() * 30 - 15; // -15% to +15%

  const generatePricePredictions = () => {
    const predictions = [];
    let currentDate = new Date();
    let currentPriceValue = currentPrice;

    for (let i = 1; i <= 180; i++) { // 6개월
      currentDate.setDate(currentDate.getDate() + 1);
      const randomChange = (Math.random() - 0.5) * 2; // -1% to +1%
      currentPriceValue *= (1 + randomChange / 100);

      predictions.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        predictedPrice: currentPriceValue
      });
    }

    return predictions;
  };

  return {
    summary: `${stockData.companyName}의 주가는 현재 기술적 지표와 기본적 지표를 종합적으로 고려할 때, 중장기적으로 상승이 예상됩니다.`,
    recommendation: Math.random() > 0.5 ? 'BUY' : 'HOLD',
    confidenceScore: Math.round(Math.random() * 30 + 70), // 70-100
    modelInfo: {
      type: 'Ensemble ML',
      accuracy: Math.round(Math.random() * 10 + 85) // 85-95
    },
    shortTerm: {
      price: currentPrice * (1 + shortTermChange / 100),
      change: shortTermChange,
      probability: Math.round(Math.random() * 20 + 70),
      range: {
        min: currentPrice * 0.95,
        max: currentPrice * 1.05
      }
    },
    mediumTerm: {
      price: currentPrice * (1 + mediumTermChange / 100),
      change: mediumTermChange,
      probability: Math.round(Math.random() * 20 + 60),
      range: {
        min: currentPrice * 0.9,
        max: currentPrice * 1.1
      }
    },
    longTerm: {
      price: currentPrice * (1 + longTermChange / 100),
      change: longTermChange,
      probability: Math.round(Math.random() * 20 + 50),
      range: {
        min: currentPrice * 0.85,
        max: currentPrice * 1.15
      }
    },
    pricePredictions: generatePricePredictions(),
    strengths: [
      '강력한 재무상태와 수익성',
      '시장 점유율 확대 추세',
      '혁신적인 제품 파이프라인'
    ],
    risks: [
      '경쟁 심화로 인한 마진 압박',
      '규제 리스크 증가',
      '원자재 가격 상승'
    ],
    technicalAnalysis: '단기 기술적 지표들이 과매도 구간에서 반등을 시사하고 있습니다.',
    fundamentalAnalysis: '실적 성장과 수익성이 업계 평균을 상회하고 있습니다.',
    marketAnalysis: '전반적인 시장 환경이 개선되고 있어 상승 모멘텀이 예상됩니다.'
  };
}

// 모멘텀 계산 함수
function calculateMomentum(prices, days) {
  if (prices.length < days) return 0;
  
  const currentPrice = prices[prices.length - 1].price;
  const pastPrice = prices[prices.length - days].price;
  
  return ((currentPrice - pastPrice) / pastPrice) * 100;
}

// 기술적 지표 계산 함수
function calculateSimpleTechnicalIndicators(prices) {
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

// 영문 요약을 한글로 변환하는 함수
function translateSummaryToKorean(summary: string, ticker: string, recommendation: string): string {
  // 기본 번역 포맷 생성
  const companyName = `${ticker}`;
  
  let koreanSummary = '';
  
  // 추천에 따라 다른 문구 사용
  if (recommendation?.toUpperCase() === 'BUY') {
    koreanSummary = `${companyName} 주식은 단기적으로 상승할 것으로 예상됩니다. 기술적 분석과 기본적 분석 결과 긍정적인 모멘텀을 보이고 있으며, 현재 가격대는 매수 기회로 판단됩니다. 최근의 시장 환경과 기업 실적을 고려할 때, 중장기적으로도 성장 가능성이 높습니다.`;
  } else if (recommendation?.toUpperCase() === 'SELL') {
    koreanSummary = `${companyName} 주식은 단기적으로 하락 압력을 받을 것으로 예상됩니다. 기술적 분석에서 약세 신호가 감지되었으며, 현재 가격은 고평가되어 있을 수 있습니다. 현재 포지션의 조정을 고려하는 것이 좋습니다.`;
  } else {
    koreanSummary = `${companyName} 주식은 현재 안정적인 흐름을 보이고 있습니다. 단기적으로는 큰 변동성이 예상되지 않으며, 현재 포지션을 유지하는 것이 좋을 것으로 판단됩니다. 시장 환경 변화에 따라 추가적인 분석이 필요합니다.`;
  }
  
  // 원본 요약에서 특정 키워드가 있는지 확인하여 추가 정보 제공
  if (summary.includes('growth') || summary.includes('increase')) {
    koreanSummary += ` 매출 성장과 수익성 개선이 기대되어 투자자들의 관심이 높아질 것으로 예상됩니다.`;
  }
  
  if (summary.includes('risk') || summary.includes('volatility')) {
    koreanSummary += ` 다만, 시장 변동성과 외부 리스크 요인을 주의 깊게 모니터링할 필요가 있습니다.`;
  }
  
  if (summary.includes('dividend') || summary.includes('yield')) {
    koreanSummary += ` 안정적인 배당 수익률도 투자 매력도를 높이는 요소입니다.`;
  }
  
  return koreanSummary;
}

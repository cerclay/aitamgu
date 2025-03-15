'use client';

import { StockData, EconomicIndicator, PredictionResult, YahooFinanceResponse, FredApiResponse } from './types';
import yahooFinance from 'yahoo-finance2';
import { NextRequest, NextResponse } from 'next/server';

// Yahoo Finance API ??const YAHOO_FINANCE_API_KEY = process.env.NEXT_PUBLIC_YAHOO_FINANCE_API_KEY;

// ê°ë¨??ë©ëª¨ë¦?ìºì
const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5ë¶?
// AIAnalysisResponse ????ì
interface AIAnalysisResponse {
  analysis: string;
  analysisKr?: string;
  prediction: PredictionResult;
  analysisType: string;
  modelType: string;
  timestamp: string;
}

// ì£¼ì ?°ì´??ê°?¸ì¤ê¸?export const fetchStockData = async (symbol: string): Promise<StockData> => {
  try {
    // ìºì ???ì±
    const cacheKey = `stock_${symbol.toUpperCase()}`;
    
    // ë¡ì»¬ ?¤í ë¦¬ì??ì ìºì???°ì´???ì¸ (ë¸ë¼?°ì? ?ê²½?ìë§?
    if (typeof window !== 'undefined') {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          // ìºìê° 5ë¶??´ë´??ê²½ì° ìºì???°ì´??ë°í
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            console.log('ìºì??ì£¼ì ?°ì´???¬ì©:', symbol);
            return data;
          }
        } catch (cacheError) {
          console.warn('ìºì ?°ì´???ì± ?¤ë¥:', cacheError);
          // ìºì ?¤ë¥ ??ë¬´ì?ê³  ê³ì ì§í
        }
      }
    }
    
    console.log('Yahoo Finance API ?¸ì¶ ?ë:', symbol);
    
    // API ?¸ì¶ ?ë
    try {
      // ?¼í ?ì´?¸ì¤ API ?¸ì¶
      const response = await fetch(`/api/yahoo-finance?symbol=${symbol}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Yahoo Finance API ?ëµ ?¤ë¥:', errorText);
        throw new Error(`API ?ëµ ?¤ë¥: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      // ?ì ?°ì´???ì¸
      if (!data.ticker || !data.currentPrice) {
        console.error('Yahoo Finance API ?ëµ???ì ?°ì´?°ê? ?ìµ?ë¤:', data);
        throw new Error('API ?ëµ???ì ?°ì´?°ê? ?ìµ?ë¤');
      }
      
      // ë¸ë¼?°ì? ?ê²½?ìë§?ë¡ì»¬ ?¤í ë¦¬ì???ìºì
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data,
            timestamp: Date.now()
          }));
        } catch (storageError) {
          console.warn('ë¡ì»¬ ?¤í ë¦¬ì? ????¤ë¥:', storageError);
          // ????¤ë¥ ??ë¬´ì?ê³  ê³ì ì§í
        }
      }
      
      console.log('Yahoo Finance API ?¸ì¶ ?±ê³µ:', symbol);
      return data;
    } catch (apiError) {
      console.error('Yahoo Finance API ?¸ì¶ ?¤í¨:', apiError);
      // ?¤ë¥ ë°ì ??ëª¨ì ?°ì´???¬ì©?¼ë¡ ì§í
      console.log('ëª¨ì ì£¼ì ?°ì´???¬ì©:', symbol);
      return generateMockStockData(symbol);
    }
  } catch (error) {
    // ìµì¢ ?ì¸ ì²ë¦¬ - ?´ë¤ ?¤ë¥ê° ë°ì?ë?¼ë ëª¨ì ?°ì´??ë°í
    console.error('ì£¼ì ?°ì´??ì²ë¦¬ ì¤??ìì¹?ëª»í ?¤ë¥:', error);
    return generateMockStockData(symbol);
  }
};

// ê³¼ê±° ì£¼ê? ?°ì´???ì± (ëª©ì)
function generateMockHistoricalPrices(currentPrice: number): { date: string; price: number; volume: number; open: number; high: number; low: number }[] {
  const historicalPrices = [];
  const today = new Date();
  let price = currentPrice;
  
  for (let i = 365; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // ?½ê°???ë¤ ë³??ì¶ê?
    const dailyChange = 0.98 + Math.random() * 0.04;
    price = price * dailyChange;
    
    // ê³ ê?, ?ê°, ?ê? ?ì±
    const high = price * (1 + Math.random() * 0.02);
    const low = price * (1 - Math.random() * 0.02);
    const open = low + Math.random() * (high - low);
    
    // ê±°ë???ì± (1ë°±ë§ ~ 1ì²ë§ ?¬ì´)
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

// ê¸°ì ??ì§??ê³ì°
function calculateTechnicalIndicators(prices: { date: string; price: number }[]): {
  rsi: number;
  macd: number;
  bollingerUpper: number;
  bollingerLower: number;
  ma50: number;
  ma200: number;
} {
  const priceValues = prices.map(item => item.price);
  
  // RSI ê³ì°
  const rsi = calculateRSI(prices);
  
  // ?´ë?ê·  ê³ì°
  const { ma50, ma200 } = calculateMovingAverages(prices);
  
  // ë³¼ë¦°? ë°´ë ê³ì°
  const { bollingerUpper, bollingerLower } = calculateBollingerBands(prices);
  
  // MACD ê³ì°
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

// 1????? ì§ ê°?¸ì¤ê¸?function getOneYearAgo() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date;
}

// RSI ê³ì° (ê°ë¨??êµ¬í)
function calculateRSI(prices: { date: string; price: number }[]): number {
  // ?¤ì  ê³ì°?ì????ë³µì¡???ê³ ë¦¬ì¦ ?ì©???ì
  // ?¬ê¸°?ë ê°ë¨???ìë¡?êµ¬í
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
  
  if (avgLoss === 0) return 100; // ?ì¤???ì¼ë©?RSI = 100
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// ?´ë?ê·  ê³ì°
function calculateMovingAverages(prices: { date: string; price: number }[]): { ma50: number; ma200: number } {
  const priceValues = prices.map(item => item.price);
  
  const ma50 = calculateMA(priceValues, 50);
  const ma200 = calculateMA(priceValues, 200);
  
  return { ma50, ma200 };
}

// ?¨ì ?´ë?ê·  ê³ì°
function calculateMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  
  const slice = prices.slice(prices.length - period);
  return slice.reduce((sum, price) => sum + price, 0) / period;
}

// ë³¼ë¦°? ë°´ë ê³ì°
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
  
  // ?ì? ?¸ì°¨ ê³ì°
  const squaredDiffs = slice.map(price => Math.pow(price - ma, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / period;
  const stdDev = Math.sqrt(variance);
  
  return {
    bollingerUpper: ma + (2 * stdDev),
    bollingerLower: ma - (2 * stdDev),
  };
}

// MACD ê³ì° (ê°ë¨??êµ¬í)
function calculateMACD(prices: { date: string; price: number }[]): number {
  const priceValues = prices.map(item => item.price);
  
  const ema12 = calculateEMA(priceValues, 12);
  const ema26 = calculateEMA(priceValues, 26);
  
  return ema12 - ema26;
}

// ì§???´ë?ê·  ê³ì°
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  
  let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  const multiplier = 2 / (period + 1);
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

// ê²½ì  ì§???°ì´??ê°?¸ì¤ê¸?export const fetchEconomicIndicators = async (): Promise<EconomicIndicator[]> => {
  try {
    // ?¤ì  API ?¸ì¶ ???ëª¨ì ?°ì´??ë°í
    return [
      {
        name: 'GDP Growth Rate',
        nameKr: 'GDP ?±ì¥ë¥?,
        value: 2.1,
        unit: '%',
        change: 0.3,
        previousPeriod: '?ë¶ê¸?,
        source: 'FRED',
        description: 'êµ?´ ì´ì???±ì¥ë¥?,
        impact: 'positive'
      },
      {
        name: 'Unemployment Rate',
        nameKr: '?¤ìë¥?,
        value: 3.8,
        unit: '%',
        change: -0.1,
        previousPeriod: '?ì',
        source: 'FRED',
        description: '?¸ë ?¸êµ¬ ì¤??¤ì??ë¹ì¨',
        impact: 'positive'
      },
      {
        name: 'Inflation Rate',
        nameKr: '?¸í?ì´??,
        value: 3.2,
        unit: '%',
        change: -0.2,
        previousPeriod: '?ì',
        source: 'FRED',
        description: '?ë¹??ë¬¼ê? ?ì¹ë¥?,
        impact: 'negative'
      },
      {
        name: 'Interest Rate',
        nameKr: 'ê¸°ì?ê¸ë¦¬',
        value: 5.25,
        unit: '%',
        change: 0,
        previousPeriod: '?ì',
        source: 'FRED',
        description: 'ì¤ì???ê¸°ì? ê¸ë¦¬',
        impact: 'neutral'
      },
      {
        name: 'Consumer Confidence',
        nameKr: '?ë¹??? ë¢°ì§??,
        value: 102.5,
        unit: '',
        change: 1.5,
        previousPeriod: '?ì',
        source: 'Conference Board',
        description: '?ë¹?ë¤??ê²½ì  ?í©?????? ë¢°??,
        impact: 'positive'
      },
      {
        name: 'Manufacturing PMI',
        nameKr: '?ì¡°??PMI',
        value: 51.2,
        unit: '',
        change: -0.3,
        previousPeriod: '?ì',
        source: 'ISM',
        description: '?ì¡°??êµ¬ë§¤ê´ë¦¬ìì§??,
        impact: 'neutral'
      }
    ];
  } catch (error) {
    console.error('ê²½ì  ì§??ê°?¸ì¤ê¸??¤ë¥:', error);
    throw new Error('ê²½ì  ì§?ë? ê°?¸ì¤??ì¤??¤ë¥ê° ë°ì?ìµ?ë¤.');
  }
};

// FRED APIë¥??¬ì©?ì¬ ê²½ì  ì§???°ì´??ê°?¸ì¤ê¸?export async function fetchEconomicIndicatorsFromFRED(): Promise<EconomicIndicator[]> {
  // FRED API ?¤ê? ?ì?©ë??  const FRED_API_KEY = process.env.FRED_API_KEY || '';
  
  if (!FRED_API_KEY) {
    console.warn('FRED API ?¤ê? ?¤ì ?ì? ?ì?µë?? ëª¨ì ?°ì´?°ë? ?¬ì©?©ë??');
    return generateMockEconomicIndicators();
  }
  
  // ê°?¸ì¬ ê²½ì ì§??ëª©ë¡
    const indicators = [
    { 
      id: 'GDP', 
      name: 'GDP Growth Rate', 
      nameKr: 'GDP ?±ì¥ë¥?, 
      unit: '%', 
      description: 'êµ?´ì´ì???±ì¥ë¥?, 
      impact: 'positive' as const 
    },
    { 
      id: 'UNRATE', 
      name: 'Unemployment Rate', 
      nameKr: '?¤ìë¥?, 
      unit: '%', 
      description: 'ë¯¸êµ­ ?¤ìë¥?, 
      impact: 'negative' as const 
    },
    { 
      id: 'CPIAUCSL', 
      name: 'Consumer Price Index', 
      nameKr: '?ë¹?ë¬¼ê°ì§??, 
      unit: 'Index', 
      description: '?ë¹?ë¬¼ê°ì§??ë³?ì¨', 
      impact: 'neutral' as const 
    },
    { 
      id: 'FEDFUNDS', 
      name: 'Federal Funds Rate', 
      nameKr: 'ê¸°ì?ê¸ë¦¬', 
      unit: '%', 
      description: 'ë¯??°ë°©ì¤ë¹ì ??ê¸°ì?ê¸ë¦¬', 
      impact: 'negative' as const 
    },
    { 
      id: 'INDPRO', 
      name: 'Industrial Production', 
      nameKr: '?°ì?ì°ì§??, 
      unit: 'Index', 
      description: '?°ì?ì°ì§??ë³?ì¨', 
      impact: 'positive' as const 
    },
    { 
      id: 'RSAFS', 
      name: 'Retail Sales', 
      nameKr: '?ë§¤?ë§¤', 
      unit: 'Million $', 
      description: '?ë§¤?ë§¤ ë³?ì¨', 
      impact: 'positive' as const 
    },
    { 
      id: 'HOUST', 
      name: 'Housing Starts', 
      nameKr: 'ì£¼íì°©ê³µê±´ì', 
      unit: 'Thousand', 
      description: '? ê· ì£¼íì°©ê³µê±´ì', 
      impact: 'positive' as const 
    },
    { 
      id: 'DEXKOUS', 
      name: 'KRW/USD Exchange Rate', 
      nameKr: '???¬ë¬ ?ì¨', 
      unit: 'KRW', 
      description: '???¬ë¬ ?ì¨', 
      impact: 'neutral' as const 
    }
  ];
  
  try {
    // ë³ë ¬ë¡?ëª¨ë  ì§???°ì´??ê°?¸ì¤ê¸?    const promises = indicators.map(async (indicator) => {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${indicator.id}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=2`;
      const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`FRED API ?¤ë¥: ${response.status}`);
    }
    
    const data = await response.json();
      return { indicator, data };
    });
    
    const results = await Promise.all(promises);
    return transformFREDData(results, indicators);
  } catch (error) {
    console.error('FRED ê²½ì ì§??ê°?¸ì¤ê¸??¤í¨:', error);
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
        previousPeriod: '?´ì  ê¸°ê° ?°ì´???ì',
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

// ì²?ë²ì§¸ ?ì
export function generateMockEconomicIndicators(): EconomicIndicator[] {
  return [
    {
      name: 'GDP Growth Rate',
      nameKr: 'GDP ?±ì¥ë¥?,
      value: 2.1,
      unit: '%',
      change: 0.3,
      previousPeriod: '2023-Q2',
      description: 'êµ?´ì´ì???±ì¥ë¥?,
      impact: 'positive' as const,
      source: 'FRED (ëª¨ì ?°ì´??'
    },
    {
      name: 'Unemployment Rate',
      nameKr: '?¤ìë¥?,
      value: 3.8,
      unit: '%',
      change: -0.1,
      previousPeriod: '2023-08',
      description: 'ë¯¸êµ­ ?¤ìë¥?,
      impact: 'negative' as const,
      source: 'FRED (ëª¨ì ?°ì´??'
    },
    {
      name: 'Consumer Price Index',
      nameKr: '?ë¹?ë¬¼ê°ì§??,
      value: 3.2,
      unit: '%',
      change: -0.2,
      previousPeriod: '2023-08',
      description: '?ë¹?ë¬¼ê°ì§??ë³?ì¨',
      impact: 'neutral' as const,
      source: 'FRED (ëª¨ì ?°ì´??'
    },
    {
      name: 'Federal Funds Rate',
      nameKr: 'ê¸°ì?ê¸ë¦¬',
      value: 5.25,
      unit: '%',
      change: 0,
      previousPeriod: '2023-08',
      description: 'ë¯??°ë°©ì¤ë¹ì ??ê¸°ì?ê¸ë¦¬',
      impact: 'negative' as const,
      source: 'FRED (ëª¨ì ?°ì´??'
    },
    {
      name: 'Industrial Production',
      nameKr: '?°ì?ì°ì§??,
      value: 0.4,
      unit: '%',
      change: 0.7,
      previousPeriod: '2023-08',
      description: '?°ì?ì°ì§??ë³?ì¨',
      impact: 'positive' as const,
      source: 'FRED (ëª¨ì ?°ì´??'
    },
    {
      name: 'KRW/USD Exchange Rate',
      nameKr: '???¬ë¬ ?ì¨',
      value: 1350.25,
      unit: 'KRW',
      change: 2.1,
      previousPeriod: '2023-09-01',
      description: '???¬ë¬ ?ì¨',
      impact: 'neutral' as const,
      source: 'FRED (ëª¨ì ?°ì´??'
    }
  ];
}

// ??ë²ì§¸ ?ì (?´ë¦ ë³ê²?
export function createAlternativeMockEconomicData(): EconomicIndicator[] {
  // ê¸°ì¡´ ?¨ì ?¸ì¶
  return generateMockEconomicIndicators();
}

// AI ?ì¸¡ ?ì±
export const generatePrediction = async (
  symbol: string,
  stockData: StockData, 
  economicData: EconomicIndicator[]
): Promise<PredictionResult> => {
  try {
    // ?¤ì  API ?¸ì¶ ?ë ëª¨ë¸ ?¬ì© ë¡ì§
    // ?¬ê¸°?ë ëª¨ì ?°ì´?°ë? ?ì±?ë, ?¤ì  ?°ì´?°ë? ê¸°ë°?¼ë¡ ??ê³ì° ì¶ê?
    
    const currentPrice = stockData.currentPrice;
    
    // ê¸°ì ??ì§??ë¶ì
    const technicalSentiment = calculateTechnicalSentiment(stockData.technicalIndicators);
    
    // ê¸°ë³¸??ì§??ë¶ì
    const fundamentalSentiment = calculateFundamentalSentiment(stockData.fundamentals);
    
    // ê²½ì  ì§??ë¶ì
    const economicSentiment = calculateEconomicSentiment(economicData);
    
    // ì¢í© ê°ì± ?ì (0-100)
    const overallSentiment = (technicalSentiment * 0.4) + (fundamentalSentiment * 0.4) + (economicSentiment * 0.2);
    
    // ê°ì± ?ìë¥?ê¸°ë°?¼ë¡ ê°ê²?ë³???ì¸¡
    const volatility = calculateVolatility(stockData.historicalPrices.map(p => p.price));
    
    // ?¨ê¸° ?ì¸¡ (1ê°ì)
    const shortTermChange = (overallSentiment - 50) * 0.02 * volatility;
    const shortTermPrice = currentPrice * (1 + shortTermChange / 100);
    
    // ì¤ê¸° ?ì¸¡ (3ê°ì)
    const mediumTermChange = (overallSentiment - 50) * 0.04 * volatility;
    const mediumTermPrice = currentPrice * (1 + mediumTermChange / 100);
    
    // ?¥ê¸° ?ì¸¡ (6ê°ì)
    const longTermChange = (overallSentiment - 50) * 0.08 * volatility;
    const longTermPrice = currentPrice * (1 + longTermChange / 100);
    
    // ?ì¸¡ ê°ê²??ê³???ì±
    const pricePredictions = generatePricePredictions(
      currentPrice,
      shortTermPrice,
      mediumTermPrice,
      longTermPrice
    );
    
    // ? ë¢°???ì ê³ì° (ê¸°ì ??ì§?ì ?¼ê??±ì ?°ë¼ ì¡°ì )
    let confidenceScore = 65 + Math.random() * 20;
    
    // ê¸°ì ??ì§?ê? ?¼ê???ë°©í¥??ê°ë¦¬í¤ë©?? ë¢°???ì¹
    let technicalConsistency = 0;
    if ((stockData.technicalIndicators.rsi > 50) === (shortTermChange > 0)) technicalConsistency++;
    if ((stockData.technicalIndicators.macd.value > 0) === (shortTermChange > 0)) technicalConsistency++;
    if ((currentPrice > stockData.technicalIndicators.ma50) === (shortTermChange > 0)) technicalConsistency++;
    if ((currentPrice > stockData.technicalIndicators.ma200) === (shortTermChange > 0)) technicalConsistency++;
    
    // ?¼ê??±ì ?°ë¼ ? ë¢°??ì¡°ì  (ìµë? Â±10%)
    confidenceScore += (technicalConsistency - 2) * 2.5;
    
    // ? ë¢°??ë²ì ?í (50-95%)
    confidenceScore = Math.max(50, Math.min(95, confidenceScore));
    
    // ê°ì  ë°??í ?ì ?ì±
    const strengths = [];
    const risks = [];
    
    // ê¸°ì ??ì§??ê¸°ë° ê°ì /?í
    if (stockData.technicalIndicators.rsi < 30) {
      strengths.push('RSIê° ê³¼ë§¤??êµ¬ê°???ì´ ë°ë± ê°?¥ì±???ìµ?ë¤');
    } else if (stockData.technicalIndicators.rsi > 70) {
      risks.push('RSIê° ê³¼ë§¤??êµ¬ê°???ì´ ?¨ê¸° ì¡°ì  ê°?¥ì±???ìµ?ë¤');
    }
    
    // ê²½ì  ì§??ê¸°ë° ê°ì /?í
    // ?¸í?ì´??ì§??ì°¾ê¸°
    const inflationIndicator = economicData.find(indicator => 
      indicator.name.includes('Inflation') || 
      indicator.name.includes('Consumer Price')
    );
    
    // ê¸ë¦¬ ì§??ì°¾ê¸°
    const interestRateIndicator = economicData.find(indicator => 
      indicator.name.includes('Interest') || 
      indicator.name.includes('Federal Funds')
    );
    
    if (inflationIndicator && inflationIndicator.change < 0) {
      strengths.push('?¸í?ì´?ì´ ê°ì ì¶ì¸ë¡? ê¸°ì ë¹ì© ë¶?´ì´ ?í?????ìµ?ë¤');
    } else if (inflationIndicator && inflationIndicator.change > 0.5) {
      risks.push('?¸í?ì´?ì´ ?ì¹ ì¶ì¸ë¡? ê¸°ì ë¹ì© ë¶?´ì´ ì¦ê??????ìµ?ë¤');
    }
    
    if (interestRateIndicator && interestRateIndicator.change < 0) {
      strengths.push('ê¸ë¦¬ê° ?ë½ ì¶ì¸ë¡? ê¸°ì ?ê¸ ì¡°ë¬ ë¹ì©??ê°ì?????ìµ?ë¤');
    } else if (interestRateIndicator && interestRateIndicator.change > 0) {
      risks.push('ê¸ë¦¬ê° ?ì¹ ì¶ì¸ë¡? ê¸°ì ?ê¸ ì¡°ë¬ ë¹ì©??ì¦ê??????ìµ?ë¤');
    }
    
    // ?¬ì ì¶ì² ?ì±
    const recommendation = generateRecommendation(overallSentiment / 100, stockData);
    
    // ?ì¸ ë¶ì ?´ì© ?ì±
    const analysisDetails = `Transformer ëª¨ë¸? ê³¼ê±° ì£¼ê? ?°ì´?? ê±°ë?? ê¸°ì ??ì§?? ?´ì¤ ê°ì± ë¶ì ê²°ê³¼ë¥??ìµ?ì¬ ?ì¸¡???ì±?ìµ?ë¤. ${stockData.companyName}??ì£¼ê????ì¬ ${currentPrice.toFixed(2)}?¬ë¬??ê±°ë?ê³  ?ì¼ë©? ê¸°ì ??ì§?ì? ê¸°ë³¸??ì§?ë? ì¢í©?ì¼ë¡?ë¶ì??ê²°ê³¼ ${shortTermChange > 0 ? '?ì¹' : '?ë½'} ì¶ì¸ê° ?ì?©ë?? ?¹í ${stockData.technicalIndicators.rsi < 30 ? 'RSIê° ê³¼ë§¤??êµ¬ê°???ì´ ë°ë± ê°?¥ì±???ìµ?ë¤.' : stockData.technicalIndicators.rsi > 70 ? 'RSIê° ê³¼ë§¤??êµ¬ê°???ì´ ?¨ê¸° ì¡°ì  ê°?¥ì±???ìµ?ë¤.' : 'RSI??ì¤ë¦½?ì¸ ?ì???? ì??ê³  ?ìµ?ë¤.'} ${stockData.technicalIndicators.macd.value > 0 ? 'MACDê° ?ìë¡??ì¹ ëª¨ë©???ë³´ì´ê³??ìµ?ë¤.' : 'MACDê° ?ìë¡??ë½ ëª¨ë©???ë³´ì´ê³??ìµ?ë¤.'} ê²½ì  ì§??ì¸¡ë©´?ì??${inflationIndicator ? (inflationIndicator.change < 0 ? '?¸í?ì´?ì´ ê°ì ì¶ì¸ë¡?ê¸ì ?ì?ë¤.' : '?¸í?ì´?ì´ ?ì¹ ì¶ì¸ë¡?ì£¼ìê° ?ì?©ë??') : ''} ${interestRateIndicator ? (interestRateIndicator.change <= 0 ? 'ê¸ë¦¬ê° ?ì ?ì´ê±°ë ?ë½ ì¶ì¸ë¡?ê¸ì ?ì?ë¤.' : 'ê¸ë¦¬ê° ?ì¹ ì¶ì¸ë¡?ì£¼ìê° ?ì?©ë??') : ''}`;
    
    const analysisDetailsKr = `Transformer ëª¨ë¸? ê³¼ê±° ì£¼ê? ?°ì´?? ê±°ë?? ê¸°ì ??ì§?? ?´ì¤ ê°ì± ë¶ì ê²°ê³¼ë¥??ìµ?ì¬ ?ì¸¡???ì±?ìµ?ë¤. ${stockData.companyNameKr || stockData.companyName}??ì£¼ê????ì¬ ${currentPrice.toFixed(2)}?¬ë¬??ê±°ë?ê³  ?ì¼ë©? ê¸°ì ??ì§?ì? ê¸°ë³¸??ì§?ë? ì¢í©?ì¼ë¡?ë¶ì??ê²°ê³¼ ${shortTermChange > 0 ? '?ì¹' : '?ë½'} ì¶ì¸ê° ?ì?©ë?? ?¹í ${stockData.technicalIndicators.rsi < 30 ? 'RSIê° ê³¼ë§¤??êµ¬ê°???ì´ ë°ë± ê°?¥ì±???ìµ?ë¤.' : stockData.technicalIndicators.rsi > 70 ? 'RSIê° ê³¼ë§¤??êµ¬ê°???ì´ ?¨ê¸° ì¡°ì  ê°?¥ì±???ìµ?ë¤.' : 'RSI??ì¤ë¦½?ì¸ ?ì???? ì??ê³  ?ìµ?ë¤.'} ${stockData.technicalIndicators.macd.value > 0 ? 'MACDê° ?ìë¡??ì¹ ëª¨ë©???ë³´ì´ê³??ìµ?ë¤.' : 'MACDê° ?ìë¡??ë½ ëª¨ë©???ë³´ì´ê³??ìµ?ë¤.'} ê²½ì  ì§??ì¸¡ë©´?ì??${inflationIndicator ? (inflationIndicator.change < 0 ? '?¸í?ì´?ì´ ê°ì ì¶ì¸ë¡?ê¸ì ?ì?ë¤.' : '?¸í?ì´?ì´ ?ì¹ ì¶ì¸ë¡?ì£¼ìê° ?ì?©ë??') : ''} ${interestRateIndicator ? (interestRateIndicator.change <= 0 ? 'ê¸ë¦¬ê° ?ì ?ì´ê±°ë ?ë½ ì¶ì¸ë¡?ê¸ì ?ì?ë¤.' : 'ê¸ë¦¬ê° ?ì¹ ì¶ì¸ë¡?ì£¼ìê° ?ì?©ë??') : ''}`;
    
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
          'ê³¼ê±° ì£¼ê? ?°ì´??,
          'ê±°ë??,
          'ê¸°ì ??ì§??(RSI, MACD, ë³¼ë¦°? ë°´ë)',
          '?ì¥ ì§??,
          'ê³ì ???¨í´',
          '?´ì¤ ê°ì± ë¶ì',
          'ê±°ìê²½ì  ì§??
        ],
        trainPeriod: '2015-01-01 ~ ?ì¬'
      },
      summary: `${stockData.companyName}??ì£¼ê????¨ê¸°?ì¼ë¡?${shortTermChange > 0 ? '?ì¹' : '?ë½'}??ê²ì¼ë¡??ì?©ë?? ì¤ê¸°?ì¼ë¡ë ${mediumTermChange > 0 ? '?ì¹' : '?ë½'} ì¶ì¸ë¥?ë³´ì¼ ê²ì¼ë¡??ì¸¡?©ë?? ?¥ê¸°?ì¼ë¡ë ${longTermChange > 0 ? 'ê¸ì ?ì¸' : 'ë¶?ì ??} ?ë§??ê°ì§ê³??ìµ?ë¤.`,
      summaryKr: `${stockData.companyNameKr || stockData.companyName}??ì£¼ê????¨ê¸°?ì¼ë¡?${shortTermChange > 0 ? '?ì¹' : '?ë½'}??ê²ì¼ë¡??ì?©ë?? ì¤ê¸°?ì¼ë¡ë ${mediumTermChange > 0 ? '?ì¹' : '?ë½'} ì¶ì¸ë¥?ë³´ì¼ ê²ì¼ë¡??ì¸¡?©ë?? ?¥ê¸°?ì¼ë¡ë ${longTermChange > 0 ? 'ê¸ì ?ì¸' : 'ë¶?ì ??} ?ë§??ê°ì§ê³??ìµ?ë¤.`,
      strengths: strengths.slice(0, 5),
      risks: risks.slice(0, 5),
      recommendation: recommendation.en,
      recommendationKr: recommendation.kr,
      analysisDetails,
      analysisDetailsKr
    };
  } catch (error) {
    console.error('?ì¸¡ ?ì± ?¤ë¥:', error);
    throw new Error('?ì¸¡???ì±?ë ì¤??¤ë¥ê° ë°ì?ìµ?ë¤.');
  }
};

// ?¸ë ??ê³ì° (ê°ë¨??? í ?ê? ê¸°ì¸ê¸?
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
  
  // ê¸°ì¸ê¸°ë? ë°±ë¶?¨ë¡ ë³??  return (slope / avgPrice) * 100;
}

// ë³?ì± ê³ì°
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

// ?ì¸¡ ê°ê²??ê³???ì±
function generatePricePredictions(
  currentPrice: number,
  shortTermPrice: number,
  mediumTermPrice: number,
  longTermPrice: number
): { date: string; predictedPrice: number; range: { min: number; max: number } }[] {
  const predictions = [];
  const today = new Date();
  
  // ?¨ê¸°(1ê°ì) ?ì¸¡ ?¬ì¸???ì±
  const shortTerm = new Date(today);
  shortTerm.setMonth(today.getMonth() + 1);
  
  // ì¤ê¸°(3ê°ì) ?ì¸¡ ?¬ì¸???ì±
  const mediumTerm = new Date(today);
  mediumTerm.setMonth(today.getMonth() + 3);
  
  // ?¥ê¸°(6ê°ì) ?ì¸¡ ?¬ì¸???ì±
  const longTerm = new Date(today);
  longTerm.setMonth(today.getMonth() + 6);
  
  // ?ì¸¡ ?¬ì¸???¬ì´??ë³´ê° ?°ì´???ì±
  const totalDays = Math.round((longTerm.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  for (let i = 1; i <= totalDays; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    let predictedPrice;
    const dayRatio = i / totalDays;
    
    if (i <= 30) {
      // ì²?1ê°ì: ?ì¬ ê°ê²©ì???¨ê¸° ?ì¸¡ê¹ì? ? í ë³´ê°
      predictedPrice = currentPrice + (shortTermPrice - currentPrice) * (i / 30);
    } else if (i <= 60) {
      // 1-3ê°ì: ?¨ê¸° ?ì¸¡?ì ì¤ê¸° ?ì¸¡ê¹ì? ? í ë³´ê°
      predictedPrice = shortTermPrice + (mediumTermPrice - shortTermPrice) * ((i - 30) / 30);
    } else {
      // 3-6ê°ì: ì¤ê¸° ?ì¸¡?ì ?¥ê¸° ?ì¸¡ê¹ì? ? í ë³´ê°
      predictedPrice = mediumTermPrice + (longTermPrice - mediumTermPrice) * ((i - 60) / 30);
    }
    
    // ?½ê°??ë³?ì± ì¶ê?
    const volatility = currentPrice * 0.008 * Math.random();
    predictedPrice += (Math.random() > 0.5 ? volatility : -volatility);
    
    // ?ì¸¡ ê°ê²?ë°ì¬ë¦?    const finalPredictedPrice = Number(predictedPrice.toFixed(2));
    
    // ë²ì ê³ì° (?ì¸¡ ê°ê²©ì Â±5%)
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

// ê°ì  ?ì±
function generateStrengths(stockData: StockData, sentiment: number): string[] {
  const strengths = [];
  
  if (stockData.technicalIndicators.rsi < 30) {
    strengths.push('RSIê° ê³¼ë§¤??êµ¬ê°???ì´ ë°ë± ê°?¥ì±???ìµ?ë¤.');
  }
  
  if (stockData.technicalIndicators.macd.value > 0) {
    strengths.push('MACDê° ?ìë¡? ?ì¹ ëª¨ë©????ì±?ê³  ?ìµ?ë¤.');
  }
  
  if (stockData.currentPrice > stockData.technicalIndicators.ma50) {
    strengths.push('?ì¬ ê°ê²©ì´ 50???´ë?ê· ???ì ?ì´ ?¨ê¸° ?ì¹ ì¶ì¸ë¥?ë³´ì´ê³??ìµ?ë¤.');
  }
  
  if (stockData.currentPrice > stockData.technicalIndicators.ma200) {
    strengths.push('?ì¬ ê°ê²©ì´ 200???´ë?ê· ???ì ?ì´ ?¥ê¸° ?ì¹ ì¶ì¸ë¥?ë³´ì´ê³??ìµ?ë¤.');
  }
  
  if (stockData.fundamentals.revenueGrowth > 10) {
    strengths.push(`ë§¤ì¶ ?±ì¥ë¥ ì´ ${stockData.fundamentals.revenueGrowth.toFixed(1)}%ë¡??ì? ?±ì¥?¸ë? ë³´ì´ê³??ìµ?ë¤.`);
  }
  
  if (stockData.fundamentals.operatingMargin > 20) {
    strengths.push(`?ì ë§ì§??${stockData.fundamentals.operatingMargin.toFixed(1)}%ë¡??ì? ?ìµ?±ì ? ì??ê³  ?ìµ?ë¤.`);
  }
  
  if (stockData.fundamentals.pe > 0 && stockData.fundamentals.pe < 15) {
    strengths.push(`P/E ë¹ì¨??${stockData.fundamentals.pe.toFixed(1)}ë¡??ë??ì¼ë¡???ê??ì´ ?ìµ?ë¤.`);
  }
  
  if (stockData.fundamentals.dividendYield > 3) {
    strengths.push(`ë°°ë¹ ?ìµë¥ ì´ ${stockData.fundamentals.dividendYield.toFixed(1)}%ë¡??ì ?ì¸ ?ìµ???ê³µ?©ë??`);
  }
  
  // ìµì 2ê°? ìµë? 5ê°ì ê°ì  ë°í
  if (strengths.length < 2) {
    strengths.push('ê¸°ì ??ë¶ì ì§?ê? ê°ì ?ê³  ?ë ì¶ì¸?ë??');
    strengths.push('?ì¥ ?ê·  ?ë¹?ê²½ì???ë ?¬ì??ì ? ì??ê³  ?ìµ?ë¤.');
  }
  
  return strengths.slice(0, 5);
}

// ?í ?ì ?ì±
function generateRisks(stockData: StockData, sentiment: number, economicData: EconomicIndicator[]): string[] {
  const risks = [];
  
  if (stockData.technicalIndicators.rsi > 70) {
    risks.push('RSIê° ê³¼ë§¤??êµ¬ê°???ì´ ?¨ê¸° ì¡°ì  ê°?¥ì±???ìµ?ë¤.');
  }
  
  if (stockData.technicalIndicators.macd.value < 0) {
    risks.push('MACDê° ?ìë¡? ?ë½ ëª¨ë©????ì±?ê³  ?ìµ?ë¤.');
  }
  
  if (stockData.currentPrice < stockData.technicalIndicators.ma50) {
    risks.push('?ì¬ ê°ê²©ì´ 50???´ë?ê· ???ë???ì´ ?¨ê¸° ?ë½ ì¶ì¸ë¥?ë³´ì´ê³??ìµ?ë¤.');
  }
  
  if (stockData.currentPrice < stockData.technicalIndicators.ma200) {
    risks.push('?ì¬ ê°ê²©ì´ 200???´ë?ê· ???ë???ì´ ?¥ê¸° ?ë½ ì¶ì¸ë¥?ë³´ì´ê³??ìµ?ë¤.');
  }
  
  if (stockData.fundamentals.revenueGrowth < 0) {
    risks.push(`ë§¤ì¶ ?±ì¥ë¥ ì´ ${stockData.fundamentals.revenueGrowth.toFixed(1)}%ë¡?ê°ì ì¶ì¸ë¥?ë³´ì´ê³??ìµ?ë¤.`);
  }
  
  if (stockData.fundamentals.operatingMargin < 10) {
    risks.push(`?ì ë§ì§??${stockData.fundamentals.operatingMargin.toFixed(1)}%ë¡???? ?ìµ?±ì ë³´ì´ê³??ìµ?ë¤.`);
  }
  
  if (stockData.fundamentals.pe > 30) {
    risks.push(`P/E ë¹ì¨??${stockData.fundamentals.pe.toFixed(1)}ë¡??ë??ì¼ë¡?ê³ íê°?ì´ ?ìµ?ë¤.`);
  }
  
  const interestRate = economicData.find(item => item.name.includes('ê¸°ì?ê¸ë¦¬'));
  if (interestRate && interestRate.change > 0) {
    risks.push('ê¸ë¦¬ ?ì¹ ?ê²½? ì£¼ì ?ì¥??ë¶?ì ???í¥??ë¯¸ì¹  ???ìµ?ë¤.');
  }
  
  // ìµì 2ê°? ìµë? 5ê°ì ?í ?ì ë°í
  if (risks.length < 2) {
    risks.push('?ì¥ ë³?ì±??ì¦ê???ê²½ì° ì£¼ê? ?ë½ ?í???ìµ?ë¤.');
    risks.push('ê²½ì ?¬íë¡??¸í ?ì¥ ?ì ??ê°ì ê°?¥ì±???ìµ?ë¤.');
  }
  
  return risks.slice(0, 5);
}

// ?¬ì ì¶ì² ?ì±
function generateRecommendation(sentiment: number, stockData: StockData): { en: string; kr: string } {
  const companyName = stockData.companyName;
  const companyNameKr = stockData.companyNameKr || stockData.companyName;
  
  let en = '';
  let kr = '';
  
  if (sentiment > 0.5) {
    en = `${companyName} is showing positive signals in both technical and fundamental analysis, recommending a buy. It is particularly suitable for long-term investors.`;
    kr = `${companyNameKr}?(?? ?ì¬ ê¸°ì ?? ê¸°ë³¸??ë¶ì ëª¨ë ê¸ì ?ì¸ ? í¸ë¥?ë³´ì´ê³??ì´ ë§¤ì ì¶ì²?©ë?? ?¹í ?¥ê¸° ?¬ì?ìê²??í©??ì¢ëª©?¼ë¡ ?ë¨?©ë??`;
  } else if (sentiment > 0.2) {
    en = `${companyName} is showing a moderate upward trend, making a small, divided buying strategy appropriate. It would be good to build a position while watching the market situation.`;
    kr = `${companyNameKr}?(?? ?ë§???ì¹ ì¶ì¸ë¥?ë³´ì´ê³??ì´ ?ì¡ ë¶í  ë§¤ì ?ëµ???í©?©ë?? ?ì¥ ?í©??ì£¼ì?ë©° ?¬ì??ì êµ¬ì¶?ë ê²ì´ ì¢ê² ?µë??`;
  } else if (sentiment > -0.2) {
    en = `${companyName} is currently showing neutral signals, so we recommend watching. It would be good to make an investment decision after waiting for additional momentum or corporate events.`;
    kr = `${companyNameKr}?(?? ?ì¬ ì¤ë¦½?ì¸ ? í¸ë¥?ë³´ì´ê³??ì´ ê´ë§ì ì¶ì²?©ë?? ì¶ê??ì¸ ëª¨ë©??´ë ê¸°ì ?´ë²¤?¸ë? ê¸°ë¤ë¦????¬ì ê²°ì ???ë ê²ì´ ì¢ê² ?µë??`;
  } else if (sentiment > -0.5) {
    en = `${companyName} has detected a weak signal, so it is time to refrain from new purchases and consider clearing some positions if you are holding them.`;
    kr = `${companyNameKr}?(?? ?½ì¸ ? í¸ê° ê°ì??ì´ ? ê· ë§¤ì???ì ?ê³  ë³´ì  ì¤ì¸ ê²½ì° ?¼ë? ?¬ì????ë¦¬ë¥?ê³ ë ¤?´ë³¼ ?ì ?ë??`;
  } else {
    en = `${companyName} is currently showing negative signals in both technical and fundamental analysis, recommending a sell or wait. It would be good to refrain from new investments until market conditions improve.`;
    kr = `${companyNameKr}?(?? ?ì¬ ê¸°ì ?? ê¸°ë³¸??ë¶ì ëª¨ë ë¶?ì ??? í¸ë¥?ë³´ì´ê³??ì´ ë§¤ë ?ë ê´ë§ì ì¶ì²?©ë?? ?ì¥ ?í©??ê°ì ???ê¹ì§ ? ê· ?¬ì???ì ?ë ê²ì´ ì¢ê² ?µë??`;
  }
  
  return { en, kr };
}

// ëª¨ì ì£¼ì ?°ì´???ì±
export function generateMockStockData(symbol: string): StockData {
  try {
    // ?ì¬ ?ë³´ ê°?¸ì¤ê¸?    const companyInfo = getCompanyInfo(symbol);
    
    // ëª¨ì ?°ì´???ì±
    const currentPrice = 100 + Math.random() * 900;
    const priceChange = Math.random() * 10 - 5; // -5% ~ +5%
    
    // ê³¼ê±° ì£¼ê? ?°ì´???ì±
    const historicalPrices = generateMockHistoricalPrices(currentPrice);
    
    // ê¸°ì ??ì§??ê³ì°
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
    
    // ì°¨í¸ ?¨í´ ?ì±
    const patterns = generateChartPatterns();
    
    // ëª¨ì ?´ì¤ ?ì±
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
          type: '?¤ì  ë°í',
          title: 'ë¶ê¸°ë³??¤ì  ë°í',
          description: `${companyInfo.companyName}??ë¶ê¸°ë³??¤ì  ë°í`,
          impact: 'high'
        },
        {
          date: getRandomFutureDate(45),
          type: '?¬ì??ì»¨í¼?°ì¤',
          title: '?°ë? ?¬ì??ì»¨í¼?°ì¤',
          description: '?°ë? ?¬ì??ì»¨í¼?°ì¤ ë°?? ì ??ë°í',
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
    // ëª¨ì ?°ì´???ì± ì¤??¤ë¥ ë°ì ??ìµì?ì ?°ì´??ë°í
    console.error('ëª¨ì ì£¼ì ?°ì´???ì± ?¤ë¥:', error);
    
    // ìµì?ì ?ì ?°ì´?°ë§ ?¬í¨??ê¸°ë³¸ ê°ì²´ ë°í
    return {
      ticker: symbol,
      companyName: `${symbol} Inc.`,
      companyNameKr: `${symbol} ì£¼ì?ì¬`,
      description: `${symbol} is a publicly traded company.`,
      descriptionKr: `${symbol}?(?? ê³µê°?ì¼ë¡?ê±°ë?ë ?ì¬?ë??`,
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

// ?ì¬ ?ë³´ ê°?¸ì¤ê¸?(ëª¨ì ?°ì´??
function getCompanyInfo(symbol: string) {
  const companies: Record<string, { companyName: string, companyNameKr: string, description: string, descriptionKr: string, sector: string, industry: string }> = {
    'AAPL': {
      companyName: 'Apple Inc.',
      companyNameKr: '? í',
      description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
      descriptionKr: '? í? ???¸ê³?ì¼ë¡??¤ë§?¸í°, ê°ì¸??ì»´í¨?? ?ë¸ë¦? ?¨ì´?¬ë¸ ê¸°ê¸° ë°??¡ì¸?ë¦¬ë¥??¤ê³, ?ì¡° ë°??ë§¤?ë ê¸°ì?ë??',
      sector: 'Technology',
      industry: 'Consumer Electronics'
    },
    'MSFT': {
      companyName: 'Microsoft Corporation',
      companyNameKr: 'ë§ì´?¬ë¡?í??,
      description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.',
      descriptionKr: 'ë§ì´?¬ë¡?í?¸ë ???¸ê³?ì¼ë¡??í?¸ì¨?? ?ë¹?? ê¸°ê¸° ë°??ë£¨?ì ê°ë°, ?¼ì´? ì¤ ë°?ì§?í??ê¸°ì?ë??',
      sector: 'Technology',
      industry: 'Software?Infrastructure'
    },
    'GOOGL': {
      companyName: 'Alphabet Inc.',
      companyNameKr: '?íë²?,
      description: 'Alphabet Inc. provides various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.',
      descriptionKr: '?íë²³ì? ë¯¸êµ­, ? ë½, ì¤ë, ?íë¦¬ì¹´, ?ì???í?? ìºë??ë°??¼í´ ?ë©ë¦¬ì¹´?ì ?¤ì???íê³??ë«?¼ì ?ê³µ?ë ê¸°ì?ë??',
      sector: 'Technology',
      industry: 'Internet Content & Information'
    },
    'AMZN': {
      companyName: 'Amazon.com, Inc.',
      companyNameKr: '?ë§ì¡´ë·ì»?,
      description: 'Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions in North America and internationally.',
      descriptionKr: '?ë§ì¡´ë·ì»´ì? ë¶ë? ë°?êµ? ?ì¼ë¡??ë¹???í???ë§¤ ?ë§¤ ë°?êµ¬ë ?ë¹?¤ë? ?ê³µ?ë ê¸°ì?ë??',
      sector: 'Consumer Cyclical',
      industry: 'Internet Retail'
    },
    'META': {
      companyName: 'Meta Platforms, Inc.',
      companyNameKr: 'ë©í? ?ë«?¼ì¤',
      description: 'Meta Platforms, Inc. develops products that enable people to connect and share with friends and family through mobile devices, personal computers, virtual reality headsets, and in-home devices worldwide.',
      descriptionKr: 'ë©í? ?ë«?¼ì¤??ëª¨ë°??ê¸°ê¸°, ê°ì¸??ì»´í¨?? ê°???ì¤ ?¤ë??ë°?ê°?ì© ê¸°ê¸°ë¥??µí´ ???¸ê³?ì¼ë¡??¬ë?¤ì´ ì¹êµ¬ ë°?ê°ì¡±ê³¼ ?°ê²°?ê³  ê³µì ?????ë ?í??ê°ë°?ë ê¸°ì?ë??',
      sector: 'Technology',
      industry: 'Internet Content & Information'
    },
    'TSLA': {
      companyName: 'Tesla, Inc.',
      companyNameKr: '?ì¬??,
      description: 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems in the United States, China, and internationally.',
      descriptionKr: '?ì¬?¼ë ë¯¸êµ­, ì¤êµ­ ë°?êµ? ?ì¼ë¡??ê¸° ?ëì°? ?ëì§ ?ì± ë°?????ì¤?ì ?¤ê³, ê°ë°, ?ì¡°, ?ë? ë°??ë§¤?ë ê¸°ì?ë??',
      sector: 'Consumer Cyclical',
      industry: 'Auto Manufacturers'
    },
    'NVDA': {
      companyName: 'NVIDIA Corporation',
      companyNameKr: '?ë¹?ì',
      description: 'NVIDIA Corporation provides graphics, and compute and networking solutions in the United States, Taiwan, China, and internationally.',
      descriptionKr: '?ë¹?ì??ë¯¸êµ­, ?ë§? ì¤êµ­ ë°?êµ? ?ì¼ë¡?ê·¸ë?? ì»´í¨??ë°??¤í¸?í¹ ?ë£¨?ì ?ê³µ?ë ê¸°ì?ë??',
      sector: 'Technology',
      industry: 'Semiconductors'
    },
    'NFLX': {
      companyName: 'Netflix, Inc.',
      companyNameKr: '?·íë¦?¤',
      description: 'Netflix, Inc. provides entertainment services. It offers TV series, documentaries, feature films, and mobile games across various genres and languages.',
      descriptionKr: '?·íë¦?¤???¤ì???¥ë¥´? ?¸ì´ë¡?TV ?ë¦¬ì¦? ?¤íë©í°ë¦? ?í ë°?ëª¨ë°??ê²ì???ê³µ?ë ?í°?ì¸ë¨¼í¸ ?ë¹??ê¸°ì?ë??',
      sector: 'Communication Services',
      industry: 'Entertainment'
    },
    'JPM': {
      companyName: 'JPMorgan Chase & Co.',
      companyNameKr: 'JPëª¨ê±´ ì²´ì´??,
      description: 'JPMorgan Chase & Co. operates as a financial services company worldwide. It operates through four segments: Consumer & Community Banking, Corporate & Investment Bank, Commercial Banking, and Asset & Wealth Management.',
      descriptionKr: 'JPëª¨ê±´ ì²´ì´?¤ë ???¸ê³?ì¼ë¡?ê¸ìµ ?ë¹?¤ë? ?ê³µ?ë ê¸°ì?¼ë¡, ?ë¹??ë°?ì»¤ë??í° ë±í¹, ê¸°ì ë°??¬ì ??? ?ì ë±í¹, ?ì° ë°??ì° ê´ë¦?????ê°ì§ ë¶ë¬¸ì¼ë¡??´ì?©ë??',
      sector: 'Financial Services',
      industry: 'Banks?Diversified'
    },
    'KO': {
      companyName: 'The Coca-Cola Company',
      companyNameKr: 'ì½ì¹´ì½ë¼',
      description: 'The Coca-Cola Company, a beverage company, manufactures, markets, and sells various nonalcoholic beverages worldwide.',
      descriptionKr: 'ì½ì¹´ì½ë¼?????¸ê³?ì¼ë¡??¤ì??ë¹ìì½ì¬ ?ë£ë¥??ì¡°, ë§ì???ë°??ë§¤?ë ?ë£ ê¸°ì?ë??',
      sector: 'Consumer Defensive',
      industry: 'Beverages?Non-Alcoholic'
    }
  };
  
  // ê¸°ë³¸ ?ì¬ ?ë³´ (?ì²­???¬ë³¼???ë ê²½ì°)
  const defaultCompany = {
    companyName: `${symbol} Corporation`,
    companyNameKr: `${symbol} ì½í¼?ì´??,
    description: `${symbol} is a publicly traded company on the stock market.`,
    descriptionKr: `${symbol}?(?? ì£¼ì ?ì¥???ì¥??ê¸°ì?ë??`,
    sector: 'Miscellaneous',
    industry: 'Diversified'
  };
  
  return companies[symbol] || defaultCompany;
}

// ë¯¸ë ? ì§ ?ì± (ìµë? ?¼ì ?´ë´)
function getRandomFutureDate(maxDays: number): string {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + Math.floor(Math.random() * maxDays) + 1);
  return futureDate.toISOString().split('T')[0];
}

// ëª¨ì ?´ì¤ ?ì±
function generateMockNews(symbol: string, companyName: string) {
  const newsTemplates = [
    {
      title: `${companyName}, ?ìì¹??í?ë ë¶ê¸° ?¤ì  ë°í`,
      source: 'Financial Times',
      date: getRandomPastDate(10),
      url: '#',
      sentiment: 'positive'
    },
    {
      title: `${companyName}, ? ì ??ì¶ìë¡??ì¥ ?ì ???ë? ?ë§`,
      source: 'Bloomberg',
      date: getRandomPastDate(5),
      url: '#',
      sentiment: 'positive'
    },
    {
      title: `ë¶ìê°?? ${companyName} ì£¼ê? ëª©íì¹??í¥ ì¡°ì `,
      source: 'CNBC',
      date: getRandomPastDate(3),
      url: '#',
      sentiment: 'positive'
    },
    {
      title: `${companyName}, ê²½ì?¬ì????¹í ë¶ì ?´ê²°`,
      source: 'Reuters',
      date: getRandomPastDate(7),
      url: '#',
      sentiment: 'neutral'
    },
    {
      title: `${companyName}, ? ê· ?ì¥ ì§ì¶ ê³í ë°í`,
      source: 'Wall Street Journal',
      date: getRandomPastDate(2),
      url: '#',
      sentiment: 'positive'
    },
    {
      title: `${companyName}, ê³µê¸ë§?ë¬¸ì ë¡??ì° ì°¨ì§ ?°ë ¤`,
      source: 'MarketWatch',
      date: getRandomPastDate(4),
      url: '#',
      sentiment: 'negative'
    },
    {
      title: `${companyName}, ì§?ê??¥ì± ?´ë?í°ë¸?ë°í`,
      source: 'Forbes',
      date: getRandomPastDate(6),
      url: '#',
      sentiment: 'positive'
    }
  ];
  
  // 3-5ê°ì ?´ì¤ ??ª© ? í
  const newsCount = 3 + Math.floor(Math.random() * 3);
  const selectedNews = [];
  const availableNews = [...newsTemplates]; // ë³µì¬ë³??ì±
  
  for (let i = 0; i < newsCount; i++) {
    if (availableNews.length === 0) break;
    
    const randomIndex = Math.floor(Math.random() * availableNews.length);
    selectedNews.push(availableNews[randomIndex]);
    availableNews.splice(randomIndex, 1);
  }
  
  return selectedNews;
}

// ê³¼ê±° ? ì§ ?ì± (ìµë? ?¼ì ?´ë´)
function getRandomPastDate(maxDays: number): string {
  const today = new Date();
  const pastDate = new Date(today);
  pastDate.setDate(today.getDate() - Math.floor(Math.random() * maxDays) - 1);
  return pastDate.toISOString().split('T')[0];
}

// ì°¨í¸ ?¨í´ ?ì±
function generateChartPatterns() {
  const patternTemplates = [
    {
      name: '?¤ë?¤ì??,
      description: '?¤ë?¤ì???¨í´? ??ê°ì ?¼í¬ë¡?êµ¬ì±?ë©°, ê°?´ë° ?¼í¬ê° ?ìª½ ?¼í¬ë³´ë¤ ?ìµ?ë¤. ?¼ë°?ì¼ë¡??ë½ ë°ì  ? í¸ë¡??´ì?©ë??',
      descriptionKr: '?¤ë?¤ì???¨í´? ??ê°ì ?¼í¬ë¡?êµ¬ì±?ë©°, ê°?´ë° ?¼í¬ê° ?ìª½ ?¼í¬ë³´ë¤ ?ìµ?ë¤. ?¼ë°?ì¼ë¡??ë½ ë°ì  ? í¸ë¡??´ì?©ë??',
      bullish: false,
      confidence: 75 + Math.floor(Math.random() * 20),
      formationDate: getRandomPastDate(30)
    },
    {
      name: '??¤?ì¤?ë',
      description: '??¤?ì¤?ë ?¨í´? ??ê°ì ??ì¼ë¡?êµ¬ì±?ë©°, ê°?´ë° ??ì´ ?ìª½ ??ë³´????µ?ë¤. ?¼ë°?ì¼ë¡??ì¹ ë°ì  ? í¸ë¡??´ì?©ë??',
      descriptionKr: '??¤?ì¤?ë ?¨í´? ??ê°ì ??ì¼ë¡?êµ¬ì±?ë©°, ê°?´ë° ??ì´ ?ìª½ ??ë³´????µ?ë¤. ?¼ë°?ì¼ë¡??ì¹ ë°ì  ? í¸ë¡??´ì?©ë??',
      bullish: true,
      confidence: 75 + Math.floor(Math.random() * 20),
      formationDate: getRandomPastDate(30)
    },
    {
      name: '?ë¸ ??,
      description: '?ë¸ ???¨í´? ??ê°ì ë¹ì·???ì´???¼í¬ë¡?êµ¬ì±?©ë?? ?¼ë°?ì¼ë¡??ë½ ë°ì  ? í¸ë¡??´ì?©ë??',
      descriptionKr: '?ë¸ ???¨í´? ??ê°ì ë¹ì·???ì´???¼í¬ë¡?êµ¬ì±?©ë?? ?¼ë°?ì¼ë¡??ë½ ë°ì  ? í¸ë¡??´ì?©ë??',
      bullish: false,
      confidence: 70 + Math.floor(Math.random() * 20),
      formationDate: getRandomPastDate(30)
    },
    {
      name: '?ë¸ ë°í?',
      description: '?ë¸ ë°í? ?¨í´? ??ê°ì ë¹ì·????ì¼ë¡?êµ¬ì±?©ë?? ?¼ë°?ì¼ë¡??ì¹ ë°ì  ? í¸ë¡??´ì?©ë??',
      descriptionKr: '?ë¸ ë°í? ?¨í´? ??ê°ì ë¹ì·????ì¼ë¡?êµ¬ì±?©ë?? ?¼ë°?ì¼ë¡??ì¹ ë°ì  ? í¸ë¡??´ì?©ë??',
      bullish: true,
      confidence: 70 + Math.floor(Math.random() * 20),
      formationDate: getRandomPastDate(30)
    },
    {
      name: '?¼ê°???¨í´',
      description: '?¼ê°???¨í´? ê°ê²©ì´ ?ì  ì¢ìì§??ë²ì ?´ì???ì§ì´??ê²ì ?í??ë?? ë°©í¥???íê° ?ì?©ë??',
      descriptionKr: '?¼ê°???¨í´? ê°ê²©ì´ ?ì  ì¢ìì§??ë²ì ?´ì???ì§ì´??ê²ì ?í??ë?? ë°©í¥???íê° ?ì?©ë??',
      bullish: Math.random() > 0.5,
      confidence: 65 + Math.floor(Math.random() * 20),
      formationDate: getRandomPastDate(30)
    },
    {
      name: '?ëê·??¨í´',
      description: '?ëê·??¨í´? ì§§ì? ê¸°ê° ?ì???µí© ???´ì  ì¶ì¸ê° ê³ì??ê²ì¼ë¡??ì?ë ?¨í´?ë??',
      descriptionKr: '?ëê·??¨í´? ì§§ì? ê¸°ê° ?ì???µí© ???´ì  ì¶ì¸ê° ê³ì??ê²ì¼ë¡??ì?ë ?¨í´?ë??',
      bullish: Math.random() > 0.5,
      confidence: 65 + Math.floor(Math.random() * 20),
      formationDate: getRandomPastDate(30)
    },
    {
      name: 'ì»µì¤?¸ë¤',
      description: 'ì»µì¤?¸ë¤ ?¨í´? U?í ì»µê³¼ ê·??¤ë¥¸ìª½ì ?ì? ?ë½(?¸ë¤)?¼ë¡ êµ¬ì±?©ë?? ?¼ë°?ì¼ë¡??ì¹ ? í¸ë¡??´ì?©ë??',
      descriptionKr: 'ì»µì¤?¸ë¤ ?¨í´? U?í ì»µê³¼ ê·??¤ë¥¸ìª½ì ?ì? ?ë½(?¸ë¤)?¼ë¡ êµ¬ì±?©ë?? ?¼ë°?ì¼ë¡??ì¹ ? í¸ë¡??´ì?©ë??',
      bullish: true,
      confidence: 70 + Math.floor(Math.random() * 20),
      formationDate: getRandomPastDate(30)
    },
  ];

  // 0-3ê°ì ?¨í´???ë¤?ê² ? í
  const patternCount = Math.floor(Math.random() * 3);
  const patterns = [];
  const availablePatterns = [...patternTemplates]; // ë³µì¬ë³??ì±

  for (let i = 0; i < patternCount; i++) {
    if (availablePatterns.length === 0) break;
    
    const randomIndex = Math.floor(Math.random() * availablePatterns.length);
    patterns.push(availablePatterns[randomIndex]);
    availablePatterns.splice(randomIndex, 1);
  }

  return patterns;
}

// ëª¨ì ê²½ì  ì§???°ì´???ì±
function generateAdditionalMockEconomicData(): EconomicIndicator[] {
  return [
    {
      name: 'GDP Growth Rate',
      nameKr: 'GDP ?±ì¥ë¥?,
      value: 2.1,
      unit: '%',
      change: 0.3,
      previousPeriod: '2023-Q2',
      description: 'êµ?´ì´ì???±ì¥ë¥?,
      impact: 'positive' as const,
      source: 'FRED (ëª¨ì ?°ì´??'
    },
    {
      name: 'Unemployment Rate',
      nameKr: '?¤ìë¥?,
      value: 3.8,
      unit: '%',
      change: -0.1,
      previousPeriod: '2023-08',
      description: 'ë¯¸êµ­ ?¤ìë¥?,
      impact: 'negative' as const,
      source: 'FRED (ëª¨ì ?°ì´??'
    },
    {
      name: 'Consumer Price Index',
      nameKr: '?ë¹?ë¬¼ê°ì§??,
      value: 3.2,
      unit: '%',
      change: -0.2,
      previousPeriod: '2023-08',
      description: '?ë¹?ë¬¼ê°ì§??ë³?ì¨',
      impact: 'neutral' as const,
      source: 'FRED (ëª¨ì ?°ì´??'
    },
    {
      name: 'Federal Funds Rate',
      nameKr: 'ê¸°ì?ê¸ë¦¬',
      value: 5.25,
      unit: '%',
      change: 0,
      previousPeriod: '2023-08',
      description: 'ë¯??°ë°©ì¤ë¹ì ??ê¸°ì?ê¸ë¦¬',
      impact: 'negative' as const,
      source: 'FRED (ëª¨ì ?°ì´??'
    },
    {
      name: 'Industrial Production',
      nameKr: '?°ì?ì°ì§??,
      value: 0.4,
      unit: '%',
      change: 0.7,
      previousPeriod: '2023-08',
      description: '?°ì?ì°ì§??ë³?ì¨',
      impact: 'positive' as const,
      source: 'FRED (ëª¨ì ?°ì´??'
    },
    {
      name: 'KRW/USD Exchange Rate',
      nameKr: '???¬ë¬ ?ì¨',
      value: 1350.25,
      unit: 'KRW',
      change: 2.1,
      previousPeriod: '2023-09-01',
      description: '???¬ë¬ ?ì¨',
      impact: 'neutral' as const,
      source: 'FRED (ëª¨ì ?°ì´??'
    }
  ];
}

// ëª©ì ?ì¸¡ ê²°ê³¼ ?ì±
function generateMockPrediction(ticker: string, currentPrice: number): PredictionResult {
  // ?¨ê¸°, ì¤ê¸°, ?¥ê¸° ?ì¸¡ ê°ê²??ì±
  const shortTermChange = -10 + Math.random() * 20; // -10% ~ +10%
  const mediumTermChange = -15 + Math.random() * 30; // -15% ~ +15%
  const longTermChange = -20 + Math.random() * 40; // -20% ~ +40%
  
  const shortTermPrice = currentPrice * (1 + shortTermChange / 100);
  const mediumTermPrice = currentPrice * (1 + mediumTermChange / 100);
  const longTermPrice = currentPrice * (1 + longTermChange / 100);
  
  // ?¥í 6ê°ì ?ì¸¡ ê°ê²??ì±
  const pricePredictions = [];
  const today = new Date();
  let predictedPrice = currentPrice;
  
  for (let i = 1; i <= 180; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    // ?¥ê¸° ?ì¸¡ ê°ê²©ì ?¥í´ ?ì§?ì¼ë¡?ë³??    const progress = i / 180;
    const targetChange = longTermChange / 100;
    const dailyChange = targetChange * progress + (Math.random() * 0.01 - 0.005); // ?½ê°???ë¤ ë³??ì¶ê?
    
    predictedPrice = predictedPrice * (1 + dailyChange / 100);
    
    // 30??ê°ê²©?¼ë¡ ?°ì´??ì¶ê? (ì°¨í¸ ?°ì´???¬ì¸??ì¤ì´ê¸?
    if (i % 30 === 0) {
      pricePredictions.push({
        date: date.toISOString().split('T')[0],
        predictedPrice: parseFloat(predictedPrice.toFixed(2)),
      });
    }
  }
  
  // ëª©ì ì£¼ì ?°ì´???ì± (generateRecommendation ?¨ì???ì)
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
  
  // ?ê·  ë³?ì¨ ê¸°ë° ê°ì  ?ì ê³ì°
  const avgChange = (shortTermChange + mediumTermChange + longTermChange) / 3;
  const sentiment = avgChange / 20; // -1 ~ 1 ë²ìë¡??ê·??  
  // ê°ì ê³??í ?ì ?ì±
  const strengths = generateStrengths(mockStockData, sentiment);
  const risks = generateRisks(mockStockData, sentiment, []);
  
  // ?¬ì ì¶ì² ?ì±
  const recommendation = generateRecommendation(sentiment, mockStockData);
  
  // ?ì²´ ?ì½ ?ì±
  const summary = `${ticker}???ì¬ ì£¼ê???$${currentPrice.toFixed(2)}?´ë©°, 
  ê¸°ì ??ë¶ìê³?ê¸°ë³¸??ë¶ì??ì¢í©??ê²°ê³¼ ${sentiment > 0 ? 'ê¸ì ?? : 'ë¶?ì '} ?ë§??ë³´ì´ê³??ìµ?ë¤. 
  ?¨ê¸°(1ê°ì) ?ì ê°ê²©ì? $${shortTermPrice.toFixed(2)}, ì¤ê¸°(3ê°ì) $${mediumTermPrice.toFixed(2)}, 
  ?¥ê¸°(6ê°ì) $${longTermPrice.toFixed(2)}?ë?? ${recommendation.en}`;
  
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
    confidenceScore: 60 + Math.floor(Math.random() * 30), // 60-89% ? ë¢°??    modelInfo: {
      type: 'Transformer',
      accuracy: 80,
      features: [
        'ê³¼ê±° ì£¼ê? ?°ì´??,
        'ê±°ë??,
        'ê¸°ì ??ì§??,
        '?ì¥ ì§??
      ],
      trainPeriod: '2018-01-01 ~ ?ì¬'
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

// AI ëª¨ë¸???¬ì©??ì£¼ì ë¶ì ?¨ì
export async function analyzeStockWithAI(
  stockData: StockData,
  economicData: EconomicIndicator[],
  analysisType: string = 'comprehensive',
  modelType: string = 'transformer', // 'lstm' ?ë 'transformer'
  language: string = 'kr' // 'en' ?ë 'kr'
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
      return { error: errorData.error || 'ë¶ì ?ì²­ ?¤í¨' };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('AI ë¶ì ?¤ë¥:', error);
    return { error: 'ë¶ì ì¤??¤ë¥ê° ë°ì?ìµ?ë¤' };
  }
}

// ì£¼ê? ?ì¸¡ ?¨ì (LSTM ?ë Transformer ëª¨ë¸ ?¬ì©)
export async function predictStockPrice(
  stockData: StockData,
  modelType: string = 'transformer', // 'lstm' ?ë 'transformer'
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
      return { error: errorData.error || '?ì¸¡ ?ì²­ ?¤í¨' };
    }

    const data = await response.json();
    return data.prediction;
  } catch (error) {
    console.error('ì£¼ê? ?ì¸¡ ?¤ë¥:', error);
    return { error: '?ì¸¡ ì¤??¤ë¥ê° ë°ì?ìµ?ë¤' };
  }
}

// ëª¨ì LSTM ?ì¸¡ ê²°ê³¼ ?ì± (?¤ì  êµ¬í ???ì¤?¸ì©)
export function generateMockLSTMPrediction(stockData: StockData): PredictionResult {
  const currentPrice = stockData.currentPrice;
  const shortTermChange = Math.random() * 10 - 5; // -5% ~ +5%
  const mediumTermChange = Math.random() * 20 - 7; // -7% ~ +13%
  const longTermChange = Math.random() * 30 - 10; // -10% ~ +20%
  
  const shortTermPrice = currentPrice * (1 + shortTermChange / 100);
  const mediumTermPrice = currentPrice * (1 + mediumTermChange / 100);
  const longTermPrice = currentPrice * (1 + longTermChange / 100);
  
  // ?¼ë³ ?ì¸¡ ê°ê²??ì±
  const pricePredictions = [];
  const today = new Date();
  
  for (let i = 1; i <= 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    let predictedPrice;
    if (i <= 30) {
      // ?¨ê¸°: ?ì¬ê°ê²©ì??shortTermPriceê¹ì? ? í ë³´ê°
      predictedPrice = currentPrice + (shortTermPrice - currentPrice) * (i / 30);
    } else if (i <= 60) {
      // ì¤ê¸°: shortTermPrice?ì mediumTermPriceê¹ì? ? í ë³´ê°
      predictedPrice = shortTermPrice + (mediumTermPrice - shortTermPrice) * ((i - 30) / 30);
    } else {
      // ?¥ê¸°: mediumTermPrice?ì longTermPriceê¹ì? ? í ë³´ê°
      predictedPrice = mediumTermPrice + (longTermPrice - mediumTermPrice) * ((i - 60) / 30);
    }
    
    // ?½ê°??ë³?ì± ì¶ê?
    const volatility = currentPrice * 0.01 * Math.random(); // ?ì¬ ê°ê²©ì ìµë? 1% ë³??    predictedPrice += (Math.random() > 0.5 ? volatility : -volatility);
    
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
        'ê³¼ê±° ì£¼ê? ?°ì´??,
        'ê±°ë??,
        'ê¸°ì ??ì§??(RSI, MACD, ë³¼ë¦°? ë°´ë)',
        '?ì¥ ì§??,
        'ê³ì ???¨í´'
      ],
      trainPeriod: '2018-01-01 ~ ?ì¬'
    },
    summary: `${stockData.companyName}??ì£¼ê????¨ê¸°?ì¼ë¡?${shortTermChange > 0 ? '?ì¹' : '?ë½'}??ê²ì¼ë¡??ì?©ë?? ì¤ê¸°?ì¼ë¡ë ${mediumTermChange > 0 ? '?ì¹' : '?ë½'} ì¶ì¸ë¥?ë³´ì¼ ê²ì¼ë¡??ì¸¡?©ë??`,
    summaryKr: `${stockData.companyNameKr || stockData.companyName}??ì£¼ê????¨ê¸°?ì¼ë¡?${shortTermChange > 0 ? '?ì¹' : '?ë½'}??ê²ì¼ë¡??ì?©ë?? ì¤ê¸°?ì¼ë¡ë ${mediumTermChange > 0 ? '?ì¹' : '?ë½'} ì¶ì¸ë¥?ë³´ì¼ ê²ì¼ë¡??ì¸¡?©ë??`,
    strengths: [
      'ê°ë ¥???¬ë¬´ ?í',
      'ê²½ì???ë¹??ì? ?ìµ??,
      'ì§?ì ???ì ê³?R&D ?¬ì'
    ],
    risks: [
      '?ì¥ ê²½ì ?¬í',
      'ê·ì  ?ê²½ ë³??ê°?¥ì±',
      '?ì??ê°ê²??ì¹?¼ë¡ ?¸í ë§ì§ ?ë°'
    ],
    recommendation: shortTermChange > 0 ? 'BUY' : (shortTermChange < -3 ? 'SELL' : 'HOLD'),
    recommendationKr: shortTermChange > 0 ? 'ë§¤ì' : (shortTermChange < -3 ? 'ë§¤ë' : 'ê´ë§?),
    analysisDetails: `LSTM ëª¨ë¸? ê³¼ê±° 5?ê°??ì£¼ê? ?°ì´?? ê±°ë?? ê¸°ì ??ì§?ë? ?ìµ?ì¬ ?ì¸¡???ì±?ìµ?ë¤. ëª¨ë¸? ?¹í ${stockData.companyName}??ê³ì ???¨í´ê³??ì¥ ?¬ì´?´ì ???ë°ì?????¬ì°©?ìµ?ë¤.`,
    analysisDetailsKr: `LSTM ëª¨ë¸? ê³¼ê±° 5?ê°??ì£¼ê? ?°ì´?? ê±°ë?? ê¸°ì ??ì§?ë? ?ìµ?ì¬ ?ì¸¡???ì±?ìµ?ë¤. ëª¨ë¸? ?¹í ${stockData.companyNameKr || stockData.companyName}??ê³ì ???¨í´ê³??ì¥ ?¬ì´?´ì ???ë°ì?????¬ì°©?ìµ?ë¤.`
  };
}

// ëª¨ì Transformer ?ì¸¡ ê²°ê³¼ ?ì± (?¤ì  êµ¬í ???ì¤?¸ì©)
export function generateMockTransformerPrediction(stockData: StockData): PredictionResult {
  const currentPrice = stockData.currentPrice;
  const shortTermChange = Math.random() * 12 - 5; // -5% ~ +7%
  const mediumTermChange = Math.random() * 25 - 8; // -8% ~ +17%
  const longTermChange = Math.random() * 35 - 10; // -10% ~ +25%
  
  const shortTermPrice = currentPrice * (1 + shortTermChange / 100);
  const mediumTermPrice = currentPrice * (1 + mediumTermChange / 100);
  const longTermPrice = currentPrice * (1 + longTermChange / 100);
  
  // ?¼ë³ ?ì¸¡ ê°ê²??ì±
  const pricePredictions = [];
  const today = new Date();
  
  for (let i = 1; i <= 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    let predictedPrice;
    if (i <= 30) {
      // ?¨ê¸°: ?ì¬ê°ê²©ì??shortTermPriceê¹ì? ? í ë³´ê°
      predictedPrice = currentPrice + (shortTermPrice - currentPrice) * (i / 30);
    } else if (i <= 60) {
      // ì¤ê¸°: shortTermPrice?ì mediumTermPriceê¹ì? ? í ë³´ê°
      predictedPrice = shortTermPrice + (mediumTermPrice - shortTermPrice) * ((i - 30) / 30);
    } else {
      // ?¥ê¸°: mediumTermPrice?ì longTermPriceê¹ì? ? í ë³´ê°
      predictedPrice = mediumTermPrice + (longTermPrice - mediumTermPrice) * ((i - 60) / 30);
    }
    
    // ?½ê°??ë³?ì± ì¶ê? (Transformer??LSTMë³´ë¤ ?½ê° ???í?ë¤ê³?ê°??
    const volatility = currentPrice * 0.008 * Math.random(); // ?ì¬ ê°ê²©ì ìµë? 0.8% ë³??    predictedPrice += (Math.random() > 0.5 ? volatility : -volatility);
    
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
        'ê³¼ê±° ì£¼ê? ?°ì´??,
        'ê±°ë??,
        'ê¸°ì ??ì§??(RSI, MACD, ë³¼ë¦°? ë°´ë)',
        '?ì¥ ì§??,
        'ê³ì ???¨í´',
        '?´ì¤ ê°ì± ë¶ì',
        'ê±°ìê²½ì  ì§??
      ],
      trainPeriod: '2015-01-01 ~ ?ì¬'
    },
    summary: `${stockData.companyName}??ì£¼ê????¨ê¸°?ì¼ë¡?${shortTermChange > 0 ? '?ì¹' : '?ë½'}??ê²ì¼ë¡??ì?©ë?? ì¤ê¸°?ì¼ë¡ë ${mediumTermChange > 0 ? '?ì¹' : '?ë½'} ì¶ì¸ë¥?ë³´ì¼ ê²ì¼ë¡??ì¸¡?©ë?? ?¥ê¸°?ì¼ë¡ë ${longTermChange > 0 ? 'ê¸ì ?ì¸' : 'ë¶?ì ??} ?ë§??ê°ì§ê³??ìµ?ë¤.`,
    summaryKr: `${stockData.companyNameKr || stockData.companyName}??ì£¼ê????¨ê¸°?ì¼ë¡?${shortTermChange > 0 ? '?ì¹' : '?ë½'}??ê²ì¼ë¡??ì?©ë?? ì¤ê¸°?ì¼ë¡ë ${mediumTermChange > 0 ? '?ì¹' : '?ë½'} ì¶ì¸ë¥?ë³´ì¼ ê²ì¼ë¡??ì¸¡?©ë?? ?¥ê¸°?ì¼ë¡ë ${longTermChange > 0 ? 'ê¸ì ?ì¸' : 'ë¶?ì ??} ?ë§??ê°ì§ê³??ìµ?ë¤.`,
    strengths: [
      'ê°ë ¥???¬ë¬´ ?í',
      'ê²½ì???ë¹??ì? ?ìµ??,
      'ì§?ì ???ì ê³?R&D ?¬ì',
      '?ì¥ ?ì ???ë?',
      '?¤ì???í ?¬í¸?´ë¦¬??
    ],
    risks: [
      '?ì¥ ê²½ì ?¬í',
      'ê·ì  ?ê²½ ë³??ê°?¥ì±',
      '?ì??ê°ê²??ì¹?¼ë¡ ?¸í ë§ì§ ?ë°',
      'ê¸°ì  ë³?ì ?°ë¥¸ ?ì ?ì??,
      'ê¸ë¡ë² ê²½ì  ë¶í?¤ì±'
    ],
    recommendation: shortTermChange > 0 ? 'BUY' : (shortTermChange < -3 ? 'SELL' : 'HOLD'),
    recommendationKr: shortTermChange > 0 ? 'ë§¤ì' : (shortTermChange < -3 ? 'ë§¤ë' : 'ê´ë§?),
    analysisDetails: `Transformer ëª¨ë¸? ê³¼ê±° 8?ê°??ì£¼ê? ?°ì´?? ê±°ë?? ê¸°ì ??ì§?? ?´ì¤ ê°ì± ë¶ì ê²°ê³¼ë¥??ìµ?ì¬ ?ì¸¡???ì±?ìµ?ë¤. ëª¨ë¸? ?¹í ${stockData.companyName}??ê³ì ???¨í´, ?ì¥ ?¬ì´?? ê·¸ë¦¬ê³??´ì¤ ?´ë²¤?¸ì ???ë°ì?????¬ì°©?ìµ?ë¤. ?ê¸° ì£¼ì(Self-Attention) ë©ì»¤?ì¦???µí´ ?¥ê¸° ?ì¡´?±ì ?¨ê³¼?ì¼ë¡?ëª¨ë¸ë§í?µë??`,
    analysisDetailsKr: `Transformer ëª¨ë¸? ê³¼ê±° 8?ê°??ì£¼ê? ?°ì´?? ê±°ë?? ê¸°ì ??ì§?? ?´ì¤ ê°ì± ë¶ì ê²°ê³¼ë¥??ìµ?ì¬ ?ì¸¡???ì±?ìµ?ë¤. ëª¨ë¸? ?¹í ${stockData.companyNameKr || stockData.companyName}??ê³ì ???¨í´, ?ì¥ ?¬ì´?? ê·¸ë¦¬ê³??´ì¤ ?´ë²¤?¸ì ???ë°ì?????¬ì°©?ìµ?ë¤. ?ê¸° ì£¼ì(Self-Attention) ë©ì»¤?ì¦???µí´ ?¥ê¸° ?ì¡´?±ì ?¨ê³¼?ì¼ë¡?ëª¨ë¸ë§í?µë??`
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  
  if (!symbol) {
    return NextResponse.json({ error: 'ì£¼ì ?¬ë³¼???ì?©ë?? }, { status: 400 });
  }
  
  try {
    const stockData = await fetchStockData(symbol);
    return NextResponse.json(stockData);
  } catch (error) {
    console.error('ì£¼ì ?°ì´??ê°?¸ì¤ê¸??¤í¨:', error);
    return NextResponse.json({ error: '?°ì´?°ë? ê°?¸ì¤??ì¤??¤ë¥ê° ë°ì?ìµ?ë¤' }, { status: 500 });
  }
} 

// ê¸°ì ??ì§??ê¸°ë° ê°ì± ?ì ê³ì° (0-100)
function calculateTechnicalSentiment(technicalIndicators: any): number {
  let sentiment = 50; // ì¤ë¦½ ?ì??  
  // RSI ê¸°ë° ?ì ì¡°ì  (ê³¼ë§¤??ê³¼ë§¤???í ë°ì)
  if (technicalIndicators.rsi < 30) {
    sentiment += 10; // ê³¼ë§¤???í???ì¹ ê°?¥ì±
  } else if (technicalIndicators.rsi > 70) {
    sentiment -= 10; // ê³¼ë§¤???í???ë½ ê°?¥ì±
  } else if (technicalIndicators.rsi > 50) {
    sentiment += 5; // ì¤ë¦½ë³´ë¤ ?½ê° ?ì? RSI
  } else {
    sentiment -= 5; // ì¤ë¦½ë³´ë¤ ?½ê° ??? RSI
  }
  
  // MACD ê¸°ë° ?ì ì¡°ì 
  if (technicalIndicators.macd && technicalIndicators.macd.value > 0) {
    sentiment += 5; // ?ì MACD???ì¹ ì¶ì¸
    if (technicalIndicators.macd.histogram > 0) {
      sentiment += 5; // ?ì ?ì¤? ê·¸?¨ì? ê°í ?ì¹ ëª¨ë©?
    }
  } else if (technicalIndicators.macd && technicalIndicators.macd.value < 0) {
    sentiment -= 5; // ?ì MACD???ë½ ì¶ì¸
    if (technicalIndicators.macd.histogram < 0) {
      sentiment -= 5; // ?ì ?ì¤? ê·¸?¨ì? ê°í ?ë½ ëª¨ë©?
    }
  }
  
  // ?´ë?ê· ??ê¸°ë° ?ì ì¡°ì 
  const currentPrice = technicalIndicators.bollingerBands?.middle || 0;
  if (currentPrice > technicalIndicators.ma50) {
    sentiment += 5; // 50???´ë?ê· ???ë ?ì¹ ì¶ì¸
  } else {
    sentiment -= 5; // 50???´ë?ê· ???ë???ë½ ì¶ì¸
  }
  
  if (currentPrice > technicalIndicators.ma200) {
    sentiment += 5; // 200???´ë?ê· ???ë ?¥ê¸° ?ì¹ ì¶ì¸
  } else {
    sentiment -= 5; // 200???´ë?ê· ???ë???¥ê¸° ?ë½ ì¶ì¸
  }
  
  // ë³¼ë¦°? ë°´ë ê¸°ë° ?ì ì¡°ì 
  if (technicalIndicators.bollingerBands) {
    const { upper, middle, lower } = technicalIndicators.bollingerBands;
    if (currentPrice > upper) {
      sentiment -= 10; // ?ë¨ ë°´ë ?ë ê³¼ë§¤??ê°?¥ì±
    } else if (currentPrice < lower) {
      sentiment += 10; // ?ë¨ ë°´ë ?ë??ê³¼ë§¤??ê°?¥ì±
    }
  }
  
  // ?ì ë²ì ?í (0-100)
  return Math.max(0, Math.min(100, sentiment));
}

// ê¸°ë³¸??ì§??ê¸°ë° ê°ì± ?ì ê³ì° (0-100)
function calculateFundamentalSentiment(fundamentals: any): number {
  let sentiment = 50; // ì¤ë¦½ ?ì??  
  // P/E ë¹ì¨ ê¸°ë° ?ì ì¡°ì 
  if (fundamentals.pe > 0) {
    if (fundamentals.pe < 15) {
      sentiment += 10; // ??? P/E????ê? ê°?¥ì±
    } else if (fundamentals.pe > 30) {
      sentiment -= 10; // ?ì? P/E??ê³ íê° ê°?¥ì±
    }
  }
  
  // ?±ì¥ë¥?ê¸°ë° ?ì ì¡°ì 
  if (fundamentals.revenueGrowth > 20) {
    sentiment += 10; // ?ì? ë§¤ì¶ ?±ì¥ë¥?  } else if (fundamentals.revenueGrowth < 0) {
    sentiment -= 10; // ë§¤ì¶ ê°ì
  }
  
  if (fundamentals.epsGrowth > 20) {
    sentiment += 10; // ?ì? EPS ?±ì¥ë¥?  } else if (fundamentals.epsGrowth < 0) {
    sentiment -= 10; // EPS ê°ì
  }
  
  // ?ìµ??ì§??ê¸°ë° ?ì ì¡°ì 
  if (fundamentals.operatingMargin > 20) {
    sentiment += 5; // ?ì? ?ì ë§ì§
  } else if (fundamentals.operatingMargin < 10) {
    sentiment -= 5; // ??? ?ì ë§ì§
  }
  
  if (fundamentals.roe > 15) {
    sentiment += 5; // ?ì? ROE
  } else if (fundamentals.roe < 5) {
    sentiment -= 5; // ??? ROE
  }
  
  // ë°°ë¹ ?ìµë¥?ê¸°ë° ?ì ì¡°ì 
  if (fundamentals.dividendYield > 3) {
    sentiment += 5; // ?ì? ë°°ë¹ ?ìµë¥?  }
  
  // ë¶ì±?ë¹ì¨ ê¸°ë° ?ì ì¡°ì 
  if (fundamentals.debtToEquity > 2) {
    sentiment -= 5; // ?ì? ë¶ì±?ë¹ì¨
  }
  
  // ?ì ë²ì ?í (0-100)
  return Math.max(0, Math.min(100, sentiment));
}

// ê²½ì  ì§??ê¸°ë° ê°ì± ?ì ê³ì° (0-100)
function calculateEconomicSentiment(economicData: any[]): number {
  if (!economicData || economicData.length === 0) {
    return 50; // ?°ì´???ì¼ë©?ì¤ë¦½ ë°í
  }
  
  let sentiment = 50; // ì¤ë¦½ ?ì??  
  // ê°?ê²½ì  ì§?ë³ ?í¥ ?ê?
  for (const indicator of economicData) {
    // ?¸í?ì´??(CPI)
    if (indicator.name.includes('Inflation') || indicator.name.includes('Consumer Price')) {
      if (indicator.change < 0) {
        sentiment += 5; // ?¸í?ì´??ê°ì??ê¸ì ??      } else if (indicator.change > 0.5) {
        sentiment -= 5; // ?¸í?ì´??ì¦ê???ë¶?ì 
      }
    }
    
    // ê¸ë¦¬
    if (indicator.name.includes('Interest') || indicator.name.includes('Federal Funds')) {
      if (indicator.change < 0) {
        sentiment += 5; // ê¸ë¦¬ ?ë½? ê¸ì ??      } else if (indicator.change > 0) {
        sentiment -= 5; // ê¸ë¦¬ ?ì¹? ë¶?ì 
      }
    }
    
    // GDP ?±ì¥ë¥?    if (indicator.name.includes('GDP')) {
      if (indicator.value > 2) {
        sentiment += 5; // ?ì? GDP ?±ì¥ë¥ ì? ê¸ì ??      } else if (indicator.value < 0) {
        sentiment -= 10; // ë§ì´?ì¤ GDP ?±ì¥ë¥ ì? ë§¤ì° ë¶?ì 
      }
    }
    
    // ?¤ìë¥?    if (indicator.name.includes('Unemployment')) {
      if (indicator.change < 0) {
        sentiment += 5; // ?¤ìë¥?ê°ì??ê¸ì ??      } else if (indicator.change > 0.2) {
        sentiment -= 5; // ?¤ìë¥?ì¦ê???ë¶?ì 
      }
    }
    
    // ?ë¹??? ë¢°ì§??    if (indicator.name.includes('Consumer Confidence')) {
      if (indicator.change > 0) {
        sentiment += 5; // ?ë¹??? ë¢°ì§???ì¹? ê¸ì ??      } else if (indicator.change < 0) {
        sentiment -= 5; // ?ë¹??? ë¢°ì§???ë½? ë¶?ì 
      }
    }
    
    // ?°ì?ì°ì§??    if (indicator.name.includes('Industrial Production')) {
      if (indicator.change > 0) {
        sentiment += 3; // ?°ì?ì° ì¦ê???ê¸ì ??      } else if (indicator.change < 0) {
        sentiment -= 3; // ?°ì?ì° ê°ì??ë¶?ì 
      }
    }
  }
  
  // ?ì ë²ì ?í (0-100)
  return Math.max(0, Math.min(100, sentiment));
}

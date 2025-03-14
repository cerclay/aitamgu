import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';
import axios from 'axios';
import { StockData } from '@/app/stock-analyzer/types';

// 회사 정보 한글 번역을 위한 API 키 (실제 사용 시 환경 변수로 관리해야 합니다)
const PAPAGO_API_KEY = process.env.PAPAGO_API_KEY || '';
const PAPAGO_API_SECRET = process.env.PAPAGO_API_SECRET || '';

// 기술적 지표 계산 함수들
import {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateEMA,
  calculateATR,
  calculateOBV,
  calculateStochastic,
  calculateADX,
  identifySupportResistance,
  detectChartPatterns
} from '@/app/stock-analyzer/technical-indicators';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const lang = searchParams.get('lang') || 'kr'; // 기본값은 한국어
  
  if (!symbol) {
    return NextResponse.json({ error: '주식 심볼이 필요합니다' }, { status: 400 });
  }
  
  try {
    // 주식 정보 가져오기
    const quote = await yahooFinance.quote(symbol);
    const summary = await yahooFinance.quoteSummary(symbol, {
      modules: ['price', 'summaryDetail', 'financialData', 'defaultKeyStatistics', 'assetProfile']
    });
    
    // 과거 주가 데이터 가져오기 (1년)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    
    const historical = await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    });
    
    // 기술적 지표 계산
    const prices = historical.map(item => ({
      date: item.date.toISOString().split('T')[0],
      price: item.close,
      volume: item.volume,
      open: item.open,
      high: item.high,
      low: item.low
    }));

    // 주식 데이터 구성
    const stockData = {
      ticker: symbol,
      companyName: quote.longName || quote.shortName || symbol,
      companyNameKr: quote.longName || quote.shortName || symbol, // 한글 이름은 별도 API 필요
      description: summary.assetProfile?.longBusinessSummary || '',
      descriptionKr: summary.assetProfile?.longBusinessSummary || '', // 한글 설명은 별도 API 필요
      sector: summary.assetProfile?.sector || '',
      industry: summary.assetProfile?.industry || '',
      currentPrice: quote.regularMarketPrice,
      priceChange: quote.regularMarketChangePercent,
      exchange: quote.fullExchangeName || '',
      marketCap: quote.marketCap,
      volume: quote.regularMarketVolume,
      high52Week: quote.fiftyTwoWeekHigh,
      low52Week: quote.fiftyTwoWeekLow,
      historicalPrices: prices,
      technicalIndicators: calculateTechnicalIndicators(prices),
      fundamentals: {
        pe: summary.summaryDetail?.trailingPE || 0,
        eps: summary.defaultKeyStatistics?.trailingEps || 0,
        dividendYield: summary.summaryDetail?.dividendYield ? summary.summaryDetail.dividendYield * 100 : 0,
        peg: summary.defaultKeyStatistics?.pegRatio || 0,
        roe: summary.financialData?.returnOnEquity ? summary.financialData.returnOnEquity * 100 : 0,
        debtToEquity: summary.financialData?.debtToEquity || 0,
        revenue: summary.financialData?.totalRevenue || 0,
        revenueGrowth: summary.financialData?.revenueGrowth ? summary.financialData.revenueGrowth * 100 : 0,
        netIncome: summary.defaultKeyStatistics?.netIncomeToCommon || 0,
        netIncomeGrowth: 0, // 야후 파이낸스에서 직접 제공하지 않음
        operatingMargin: summary.financialData?.operatingMargins ? summary.financialData.operatingMargins * 100 : 0,
        forwardPE: summary.summaryDetail?.forwardPE || 0,
        epsGrowth: 0, // 야후 파이낸스에서 직접 제공하지 않음
        dividendGrowth: 0, // 야후 파이낸스에서 직접 제공하지 않음
        pb: summary.defaultKeyStatistics?.priceToBook || 0,
        ps: 0, // 계산 필요
        pcf: 0, // 계산 필요
        roa: summary.financialData?.returnOnAssets ? summary.financialData.returnOnAssets * 100 : 0,
        roic: 0, // 야후 파이낸스에서 직접 제공하지 않음
        currentRatio: summary.financialData?.currentRatio || 0,
        quickRatio: summary.financialData?.quickRatio || 0,
        grossMargin: summary.financialData?.grossMargins ? summary.financialData.grossMargins * 100 : 0,
        fcf: summary.financialData?.freeCashflow || 0,
        fcfGrowth: 0, // 야후 파이낸스에서 직접 제공하지 않음
        nextEarningsDate: summary.defaultKeyStatistics?.nextEarningsDate ? 
          new Date(summary.defaultKeyStatistics.nextEarningsDate).toISOString() : '',
        analystRatings: {
          buy: summary.financialData?.recommendationKey === 'buy' || 
               summary.financialData?.recommendationKey === 'strong_buy' ? 1 : 0,
          hold: summary.financialData?.recommendationKey === 'hold' ? 1 : 0,
          sell: summary.financialData?.recommendationKey === 'sell' || 
                summary.financialData?.recommendationKey === 'strong_sell' ? 1 : 0,
          targetPrice: summary.financialData?.targetMeanPrice || 0
        }
      },
      news: [], // 뉴스는 별도 API 호출 필요
      patterns: [], // 차트 패턴은 별도 분석 필요
      upcomingEvents: [], // 이벤트는 별도 API 호출 필요
      momentum: {
        shortTerm: calculateMomentum(prices, 7),
        mediumTerm: calculateMomentum(prices, 30),
        longTerm: calculateMomentum(prices, 90),
        relativeStrength: 50, // 별도 계산 필요
        sectorPerformance: 0 // 별도 API 호출 필요
      },
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(stockData);
  } catch (error) {
    console.error('Yahoo Finance API 오류:', error);
    return NextResponse.json({ error: '주식 데이터를 가져오는데 실패했습니다.' }, { status: 500 });
  }
}

// 기술적 지표 계산 함수
function calculateTechnicalIndicators(prices) {
  // 가격 데이터 추출
  const closePrices = prices.map(p => p.price);
  
  // RSI 계산
  const rsi = calculateSimpleRSI(closePrices);
  
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
  const atr = calculateSimpleATR(prices);
  
  // OBV 계산
  const obv = calculateSimpleOBV(prices);
  
  // 스토캐스틱 계산
  const stochastic = calculateSimpleStochastic(prices);
  
  // ADX 계산
  const adx = calculateSimpleADX(prices);
  
  // 지지/저항 레벨 계산
  const { supportLevels, resistanceLevels } = calculateSupportResistance(closePrices);
  
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

// 모멘텀 계산 함수
function calculateMomentum(prices, days) {
  if (prices.length < days) return 0;
  
  const currentPrice = prices[prices.length - 1].price;
  const pastPrice = prices[prices.length - days].price;
  
  return ((currentPrice - pastPrice) / pastPrice) * 100;
}

// 여기에 필요한 기술적 지표 계산 함수들 구현
function calculateSimpleRSI(prices, period = 14) {
  // RSI 계산 로직
  // ... 구현 ...
  return 50; // 임시 값
}

function calculateSimpleMA(prices, period) {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const slice = prices.slice(prices.length - period);
  return slice.reduce((sum, price) => sum + price, 0) / period;
}

function calculateSimpleEMA(prices, period) {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  
  return ema;
}

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

function calculateSimpleATR(prices, period = 14) {
  if (prices.length < 2) return 0;
  
  const ranges = [];
  for (let i = 1; i < prices.length; i++) {
    const high = prices[i].high;
    const low = prices[i].low;
    const prevClose = prices[i-1].price;
    
    const tr1 = high - low;
    const tr2 = Math.abs(high - prevClose);
    const tr3 = Math.abs(low - prevClose);
    
    ranges.push(Math.max(tr1, tr2, tr3));
  }
  
  if (ranges.length < period) return ranges.reduce((sum, range) => sum + range, 0) / ranges.length;
  
  const slice = ranges.slice(ranges.length - period);
  return slice.reduce((sum, range) => sum + range, 0) / period;
}

function calculateSimpleOBV(prices) {
  if (prices.length < 2) return 0;
  
  let obv = 0;
  for (let i = 1; i < prices.length; i++) {
    const currentPrice = prices[i].price;
    const prevPrice = prices[i-1].price;
    const volume = prices[i].volume;
    
    if (currentPrice > prevPrice) {
      obv += volume;
    } else if (currentPrice < prevPrice) {
      obv -= volume;
    }
    // 가격이 같으면 OBV 변화 없음
  }
  
  return obv;
}

function calculateSimpleStochastic(prices, kPeriod = 14, dPeriod = 3) {
  if (prices.length < kPeriod) return { k: 50, d: 50 };
  
  const kValues = [];
  
  for (let i = kPeriod - 1; i < prices.length; i++) {
    const currentSlice = prices.slice(i - kPeriod + 1, i + 1);
    const currentClose = currentSlice[currentSlice.length - 1].price;
    
    const highPrices = currentSlice.map(p => p.high || p.price);
    const lowPrices = currentSlice.map(p => p.low || p.price);
    
    const highest = Math.max(...highPrices);
    const lowest = Math.min(...lowPrices);
    
    const k = ((currentClose - lowest) / (highest - lowest)) * 100;
    kValues.push(k);
  }
  
  const k = kValues[kValues.length - 1];
  const dSlice = kValues.slice(-dPeriod);
  const d = dSlice.reduce((sum, k) => sum + k, 0) / dPeriod;
  
  return { k, d };
}

function calculateSimpleADX(prices, period = 14) {
  // ADX 계산 로직 (간소화)
  return 25; // 임시 값
}

function calculateSupportResistance(prices) {
  // 간소화된 지지/저항 레벨 계산
  const currentPrice = prices[prices.length - 1];
  
  return {
    supportLevels: [
      currentPrice * 0.95,
      currentPrice * 0.9
    ],
    resistanceLevels: [
      currentPrice * 1.05,
      currentPrice * 1.1
    ]
  };
}

// 텍스트 번역 함수 (Papago API 사용)
async function translateText(text: string, source: string, target: string): Promise<string> {
  if (!PAPAGO_API_KEY || !PAPAGO_API_SECRET || !text) {
    return '';
  }
  
  try {
    const response = await axios.post(
      'https://openapi.naver.com/v1/papago/n2mt',
      {
        source,
        target,
        text
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Naver-Client-Id': PAPAGO_API_KEY,
          'X-Naver-Client-Secret': PAPAGO_API_SECRET
        }
      }
    );
    
    return response.data.message.result.translatedText;
  } catch (error) {
    console.error('번역 API 오류:', error);
    return '';
  }
}

// 모듈 요약 데이터를 가져오는 엔드포인트
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbol, modules } = body;
    
    if (!symbol) {
      return NextResponse.json(
        { error: '주식 심볼이 필요합니다.' },
        { status: 400 }
      );
    }

    // 모듈 목록을 쿼리 파라미터로 변환
    const moduleParam = modules && modules.length > 0 
      ? `&modules=${modules.join(',')}`
      : '';

    // 야후 파이넨스 API 호출
    const summaryUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?formatted=true${moduleParam}`;
    const response = await fetch(summaryUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: '야후 파이넨스 API 호출 실패' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('야후 파이넨스 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
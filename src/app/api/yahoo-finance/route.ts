import { NextResponse } from 'next/server';
import { callExternalApi } from '@/lib/api-helper';
import yahooFinance from 'yahoo-finance2';

// 산업 정보 데이터
const industries = {
  '기술': ['소프트웨어', '하드웨어', '반도체', '인터넷', '클라우드'],
  '금융': ['은행', '보험', '자산관리', '핀테크', '부동산'],
  '헬스케어': ['제약', '의료기기', '바이오테크', '헬스케어 서비스', '생명과학'],
  '소비재': ['소매', '식품', '의류', '자동차', '엔터테인먼트'],
  '에너지': ['석유', '가스', '재생에너지', '유틸리티', '에너지 서비스'],
  '통신': ['통신 서비스', '미디어', '엔터테인먼트', '광고', '소셜 미디어'],
  '산업재': ['제조', '항공우주', '방위산업', '건설', '기계']
};

// 주식 데이터 타입 정의
interface HistoricalPrice {
  date: string;
  price: number;
  volume: number;
  open: number;
  high: number;
  low: number;
}

interface StockData {
  ticker: string;
  companyName: string;
  companyNameKr: string;
  sector: string;
  industry: string;
  currentPrice: number;
  priceChange: number;
  marketCap: number;
  volume: number;
  high52Week: number;
  low52Week: number;
  description: string;
  descriptionKr: string;
  historicalPrices: HistoricalPrice[];
  technicalIndicators: any;
  fundamentals: any;
  news: any[];
  patterns: string[];
  upcomingEvents: any[];
  momentum: any;
  lastUpdated: string;
}

// 영어 섹터명을 한글로 변환하는 맵
const sectorTranslation = {
  'Technology': '기술',
  'Financial Services': '금융',
  'Healthcare': '헬스케어',
  'Consumer Cyclical': '소비재',
  'Energy': '에너지',
  'Communication Services': '통신',
  'Industrials': '산업재',
  'Basic Materials': '원자재',
  'Consumer Defensive': '필수소비재',
  'Real Estate': '부동산',
  'Utilities': '유틸리티'
};

// API 라우트 핸들러
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let symbol = searchParams.get('symbol');
  
  if (!symbol || symbol.trim() === '') {
    return NextResponse.json({ error: '심볼이 필요합니다.' }, { status: 400 });
  }
  
  symbol = symbol.trim().toUpperCase();
  
  try {
    // Yahoo Finance 라이브러리를 사용하여 데이터 가져오기
    const quote = await yahooFinance.quote(symbol);
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    
    const historical = await yahooFinance.historical(symbol, {
      period1: startDate,
      interval: '1d'
    });
    
    // 주가 데이터 가공
    const historicalPrices = historical
      .filter(item => item && item.close && !isNaN(item.close))
      .map(item => ({
        date: item.date.toISOString().split('T')[0],
        price: item.adjClose || item.close,
        volume: item.volume,
        open: item.open,
        high: item.high,
        low: item.low
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 기업 상세 정보 가져오기
    const quoteSummary = await yahooFinance.quoteSummary(symbol, {
      modules: ['assetProfile', 'summaryDetail', 'price', 'defaultKeyStatistics']
    });

    const response = {
      ticker: symbol,
      companyName: quote.longName || quote.shortName,
      currentPrice: quote.regularMarketPrice,
      priceChange: quote.regularMarketChangePercent,
      marketCap: quote.marketCap,
      volume: quote.regularMarketVolume,
      historicalPrices,
      profile: quoteSummary.assetProfile,
      stats: quoteSummary.defaultKeyStatistics,
      details: quoteSummary.summaryDetail,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Yahoo Finance 데이터 가져오기 실패:', error);
    return NextResponse.json(
      { error: '주식 데이터를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

function getPriceSentiment(priceChange) {
  if (priceChange > 3) return 'very_positive';
  if (priceChange > 0) return 'positive';
  if (priceChange < -3) return 'very_negative';
  if (priceChange < 0) return 'negative';
  return 'neutral';
}

// 모의 주식 데이터 생성 함수
function generateMockStockData(symbol: string): StockData {
  // 무작위 값을 생성하는 대신 일관된 값을 사용합니다.
  // 심볼을 기반으로 일관된 값을 생성합니다.
  const getNumericHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; // 32비트 정수로 변환
    }
    return Math.abs(hash);
  };
  
  const symbolHash = getNumericHash(symbol);
  const seedValue = symbolHash / 2147483647; // 0과 1 사이의 값으로 정규화
  
  // 일관된 값 생성 함수
  const pseudoRandom = (index: number) => {
    const value = (seedValue * 9301 + 49297 * index) % 233280;
    return value / 233280;
  };
  
  const basePrice = 100 + pseudoRandom(1) * 900;
  const currentDate = new Date(); // 현재 날짜 사용
  const historicalPrices = [];
  
  // 과거 365일 데이터 생성 (일관된 방식으로)
  for (let i = 365; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() - i);
    
    const volatility = 0.02; // 2% 변동성
    const randomChange = (pseudoRandom(i) - 0.5) * volatility * basePrice;
    const price = basePrice + randomChange * (365 - i) / 100;
    
    historicalPrices.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2)),
      volume: Math.floor(pseudoRandom(i + 1000) * 10000000) + 1000000,
      open: parseFloat((price - pseudoRandom(i + 2000) * 5).toFixed(2)),
      high: parseFloat((price + pseudoRandom(i + 3000) * 5).toFixed(2)),
      low: parseFloat((price - pseudoRandom(i + 4000) * 5).toFixed(2))
    });
  }
  
  const currentPrice = historicalPrices[historicalPrices.length - 1].price;
  const previousPrice = historicalPrices[historicalPrices.length - 2].price;
  const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;
  
  // 기술적 지표 계산
  const prices = historicalPrices.map(p => p.price);
  const highs = historicalPrices.map(p => p.high);
  const lows = historicalPrices.map(p => p.low);
  const volumes = historicalPrices.map(p => p.volume);
  
  const rsi = calculateRelativeStrengthIndex(prices, 14);
  const macd = calculateMACDIndicator(prices);
  const bollingerBands = calculateBollingerBandIndicator(prices, 20, 2);
  const ma50 = calculateMovingAverage(prices, 50);
  const ma200 = calculateMovingAverage(prices, 200);
  const ema20 = calculateExponentialMovingAverage(prices, 20);
  const ema50 = calculateExponentialMovingAverage(prices, 50);
  const atr = calculateATR(highs, lows, prices, 14);
  const obv = calculateOBV(prices, volumes);
  const stochastic = calculateStochastic(prices, highs, lows);
  const adx = calculateADX(highs, lows, prices);
  const { support: supportLevels, resistance: resistanceLevels } = findSupportResistanceLevels(prices, 20);
  const patterns = detectChartPatterns(prices, highs, lows, volumes);
  
  // 모의 회사 정보 생성
  const sectors = ['기술', '금융', '헬스케어', '소비재', '에너지', '통신', '산업재'];
  
  const randomSector = sectors[Math.floor(Math.random() * sectors.length)];
  const randomIndustry = industries[randomSector][Math.floor(Math.random() * industries[randomSector].length)];
  
  // 모의 회사 설명 생성
  const descriptions = [
    `${symbol}은(는) ${randomSector} 분야의 선도적인 기업으로, 특히 ${randomIndustry} 부문에서 혁신적인 제품과 서비스를 제공하고 있습니다. 글로벌 시장에서 강력한 입지를 구축하고 있으며, 지속적인 성장을 위한 전략적 투자를 진행하고 있습니다.`,
    `${symbol}은(는) ${randomIndustry} 산업에서 혁신을 주도하는 기업으로, 고객 중심의 솔루션을 개발하여 시장에서 차별화된 가치를 제공하고 있습니다. 최근 몇 년간 꾸준한 매출 성장을 보이고 있으며, 신규 시장 진출을 통해 사업 다각화를 추진하고 있습니다.`,
    `${symbol}은(는) ${randomSector} 분야에서 ${randomIndustry} 솔루션을 제공하는 글로벌 기업입니다. 최첨단 기술과 혁신적인 비즈니스 모델을 통해 산업 표준을 정의하고 있으며, 지속 가능한 성장과 주주 가치 창출에 집중하고 있습니다.`
  ];
  
  const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
  
  // 모의 주식 데이터 생성
  return {
    ticker: symbol,
    companyName: `${symbol} Corporation`,
    companyNameKr: `${symbol} 주식회사`,
    sector: randomSector,
    industry: randomIndustry,
    currentPrice: currentPrice,
    priceChange: parseFloat(priceChange.toFixed(2)),
    marketCap: currentPrice * (Math.floor(Math.random() * 1000000) + 1000000),
    volume: Math.floor(Math.random() * 10000000) + 1000000,
    high52Week: Math.max(...historicalPrices.map(p => p.price)),
    low52Week: Math.min(...historicalPrices.map(p => p.price)),
    description: randomDescription,
    descriptionKr: randomDescription,
    historicalPrices: historicalPrices,
    technicalIndicators: {
      rsi,
      macd,
      bollingerBands,
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
    },
    fundamentals: {
      pe: parseFloat((Math.random() * 30 + 5).toFixed(2)),
      eps: parseFloat((currentPrice / (Math.random() * 30 + 5)).toFixed(2)),
      dividendYield: parseFloat((Math.random() * 5).toFixed(2)),
      peg: parseFloat((Math.random() * 3 + 0.5).toFixed(2)),
      roe: parseFloat((Math.random() * 30 + 5).toFixed(2)),
      debtToEquity: parseFloat((Math.random() * 2).toFixed(2)),
      revenue: Math.floor(Math.random() * 10000000000) + 100000000,
      revenueGrowth: parseFloat((Math.random() * 30 - 5).toFixed(2)),
      netIncome: Math.floor(Math.random() * 1000000000) + 10000000,
      netIncomeGrowth: parseFloat((Math.random() * 30 - 5).toFixed(2)),
      operatingMargin: parseFloat((Math.random() * 30 + 5).toFixed(2)),
      forwardPE: parseFloat((Math.random() * 25 + 5).toFixed(2)),
      epsGrowth: parseFloat((Math.random() * 30 - 5).toFixed(2)),
      dividendGrowth: parseFloat((Math.random() * 20 - 5).toFixed(2)),
      pb: parseFloat((Math.random() * 10 + 0.5).toFixed(2)),
      ps: parseFloat((Math.random() * 10 + 0.5).toFixed(2)),
      pcf: parseFloat((Math.random() * 20 + 1).toFixed(2)),
      roa: parseFloat((Math.random() * 20 + 1).toFixed(2)),
      roic: parseFloat((Math.random() * 25 + 5).toFixed(2)),
      currentRatio: parseFloat((Math.random() * 3 + 0.5).toFixed(2)),
      quickRatio: parseFloat((Math.random() * 2 + 0.5).toFixed(2)),
      grossMargin: parseFloat((Math.random() * 50 + 20).toFixed(2)),
      fcf: Math.floor(Math.random() * 500000000) + 10000000,
      fcfGrowth: parseFloat((Math.random() * 30 - 5).toFixed(2)),
      nextEarningsDate: (() => {
        const date = new Date();
        date.setDate(date.getDate() + Math.floor(Math.random() * 90) + 1);
        return date.toISOString().split('T')[0];
      })(),
      analystRatings: {
        buy: Math.floor(Math.random() * 10) + 1,
        hold: Math.floor(Math.random() * 5) + 1,
        sell: Math.floor(Math.random() * 3),
        targetPrice: parseFloat((currentPrice * (1 + (Math.random() * 0.4 - 0.1))).toFixed(2))
      }
    },
    news: [
      {
        title: `${symbol} 분기 실적 예상치 상회`,
        source: '경제신문',
        date: (() => {
          const date = new Date();
          date.setDate(date.getDate() - Math.floor(pseudoRandom(100) * 30));
          return date.toISOString().split('T')[0];
        })(),
        url: '#',
        sentiment: 'positive'
      },
      {
        title: `${symbol}, 신규 제품 라인업 발표`,
        source: '비즈니스 투데이',
        date: (() => {
          const date = new Date();
          date.setDate(date.getDate() - Math.floor(pseudoRandom(100) * 60) - 30);
          return date.toISOString().split('T')[0];
        })(),
        url: '#',
        sentiment: 'positive'
      },
      {
        title: `애널리스트들, ${symbol} 목표가 상향 조정`,
        source: '투자저널',
        date: (() => {
          const date = new Date();
          date.setDate(date.getDate() - Math.floor(pseudoRandom(100) * 90) - 60);
          return date.toISOString().split('T')[0];
        })(),
        url: '#',
        sentiment: 'positive'
      }
    ],
    patterns: patterns,
    upcomingEvents: [
      {
        date: (() => {
          const date = new Date();
          date.setDate(date.getDate() + Math.floor(pseudoRandom(100) * 30) + 1);
          return date.toISOString().split('T')[0];
        })(),
        type: '실적 발표',
        title: '분기별 실적 발표',
        description: `${symbol}의 분기별 실적 발표`,
        impact: 'high'
      },
      {
        date: (() => {
          const date = new Date();
          date.setDate(date.getDate() + Math.floor(pseudoRandom(100) * 30) + 30);
          return date.toISOString().split('T')[0];
        })(),
        type: '투자자 컨퍼런스',
        title: '연례 투자자 컨퍼런스',
        description: '연례 투자자 컨퍼런스 및 신제품 발표',
        impact: 'medium'
      }
    ],
    momentum: {
      shortTerm: calculateMomentum(historicalPrices, 7),
      mediumTerm: calculateMomentum(historicalPrices, 30),
      longTerm: calculateMomentum(historicalPrices, 90),
      relativeStrength: parseFloat((Math.random() * 100).toFixed(2)),
      sectorPerformance: parseFloat((Math.random() * 20 - 10).toFixed(2))
    },
    lastUpdated: new Date().toISOString() // 현재 날짜 사용
  };
}

// 이동 평균 계산
function calculateMovingAverage(data, period) {
  if (data.length < period) return 0;

  const sum = data.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
}

// 볼린저 밴드 계산
function calculateBollingerBandIndicator(data, period, deviation) {
  const sma = calculateMovingAverage(data, period);
  
  // 표준 편차 계산
  const slice = data.slice(-period);
  const squaredDifferences = slice.map(price => Math.pow(price - sma, 2));
  const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / period;
  const stdDev = Math.sqrt(variance);
  
  const upper = sma + (stdDev * deviation);
  const lower = sma - (stdDev * deviation);
  
  return {
    upper,
    middle: sma,
    lower,
    width: (upper - lower) / sma * 100
  };
}

// 지수 이동 평균 계산
function calculateExponentialMovingAverage(data, period) {
  if (data.length < period) return 0;
  
  const k = 2 / (period + 1);
  
  // EMA 계산 로직
  let ema = data.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  
  for (let i = period; i < data.length; i++) {
    ema = (data[i] * k) + (ema * (1 - k));
  }
  
  return ema;
}

// MACD 계산
function calculateMACDIndicator(data) {
  const ema12 = calculateExponentialMovingAverage(data, 12);
  const ema26 = calculateExponentialMovingAverage(data, 26);
  const macdValue = ema12 - ema26;
  const signal = calculateExponentialMovingAverage([...Array(8).fill(0), macdValue], 9);
  
  return {
    value: macdValue,
    signal: signal,
    histogram: macdValue - signal
  };
}

// RSI 계산
function calculateRelativeStrengthIndex(data, period) {
  if (data.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const change = data[data.length - i] - data[data.length - i - 1];
    if (change >= 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }
  
  if (losses === 0) return 100;
  
  const rs = gains / losses;
  
  return 100 - (100 / (1 + rs));
}

// 지지/저항 레벨 탐색
function findSupportResistanceLevels(data, lookback) {
  const recentData = data.slice(-lookback * 2);
  const support = [];
  const resistance = [];
  
  // 매우 단순한 구현 - 최근 저가와 고가 찾기
  const min = Math.min(...recentData);
  const max = Math.max(...recentData);
  
  // 최근 60일 데이터에서 저점과 고점 찾기
  support.push(min * 0.98);
  support.push(min * 0.95);
  resistance.push(max * 1.02);
  resistance.push(max * 1.05);
  
  return { support, resistance };
}

// 차트 패턴 감지
function detectChartPatterns(prices, highs, lows, volumes) {
  const patterns = [];
  const length = prices.length;
  
  if (length < 30) return ['데이터 부족'];
  
  // 상승/하락 추세 확인
  const isUptrend = prices[length - 1] > prices[length - 20];
  patterns.push(isUptrend ? "상승 추세" : "하락 추세");
  
  // 이동평균선 기준 추세 확인
  const ma50 = calculateMovingAverage(prices, 50);
  const ma200 = calculateMovingAverage(prices, 200);
  
  if (ma50 > ma200) {
    patterns.push("골든 크로스 형성됨");
  } else if (ma50 < ma200) {
    patterns.push("데드 크로스 형성됨");
  }
  
  // 최근 가격 변동성 확인
  const recentPrices = prices.slice(-10);
  const volatility = Math.std(recentPrices) / calculateMovingAverage(recentPrices, recentPrices.length);
  if (volatility > 0.03) {
    patterns.push("높은 변동성");
  } else if (volatility < 0.01) {
    patterns.push("낮은 변동성");
  }
  
  // 거래량 급증 확인
  const avgVolume = calculateMovingAverage(volumes.slice(-10), 10);
  const recentVolume = volumes[volumes.length - 1];
  if (recentVolume > avgVolume * 1.5) {
    patterns.push("거래량 급증");
  }
  
  // 가격 지지/저항 확인
  const supportLevel = Math.min(...prices.slice(-30)) * 1.03;
  const resistanceLevel = Math.max(...prices.slice(-30)) * 0.97;
  
  if (Math.abs(prices[length - 1] - supportLevel) / supportLevel < 0.03) {
    patterns.push("지지선 근처에서 거래 중");
  }
  
  if (Math.abs(prices[length - 1] - resistanceLevel) / resistanceLevel < 0.03) {
    patterns.push("저항선 근처에서 거래 중");
  }
  
  // 추가 패턴들...
  // 헤드앤숄더, 더블 바텀, 더블 탑 등의 패턴 감지 로직 추가
  
  return patterns;
}

// ATR 계산
function calculateATR(highs, lows, prices, period) {
  if (highs.length < period + 1) return 0;
  
  let sum = 0;
  for (let i = 1; i <= period; i++) {
    const tr = Math.max(
      highs[highs.length - i] - lows[lows.length - i],
      Math.abs(highs[highs.length - i] - prices[prices.length - i - 1]),
      Math.abs(lows[lows.length - i] - prices[prices.length - i - 1])
    );
    sum += tr;
  }
  
  return sum / period;
}

// OBV 계산
function calculateOBV(prices, volumes) {
  if (prices.length < 2) return 0;
  
  let obv = 0;
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > prices[i - 1]) {
      obv += volumes[i];
    } else if (prices[i] < prices[i - 1]) {
      obv -= volumes[i];
    }
  }
  
  return obv;
}

// 스토캐스틱 계산
function calculateStochastic(prices, highs, lows) {
  if (prices.length < 14) return { k: 50, d: 50 };
  
  const recent = prices.slice(-14);
  const high14 = Math.max(...recent);
  const low14 = Math.min(...recent);
  
  const k = ((prices[prices.length - 1] - low14) / (high14 - low14)) * 100;
  
  // 간단한 방법으로 D 값 계산 (3일 이동평균)
  const d = k; // 실제로는 최근 3일간의 %K의 이동평균이어야 합니다
  
  return { k, d };
}

// ADX 계산
function calculateADX(highs, lows, prices) {
  // 간단한 ADX 구현
  return Math.random() * 100; // 실제로는 정확한 ADX 계산이 필요합니다
}

// 모멘텀 계산
function calculateMomentum(historicalPrices, days) {
  if (historicalPrices.length < days) return 0;
  
  const currentPrice = historicalPrices[historicalPrices.length - 1].price;
  const pastPrice = historicalPrices[historicalPrices.length - days].price;
  
  return parseFloat(((currentPrice / pastPrice - 1) * 100).toFixed(2));
}

// Math.std 함수 추가 (표준편차 계산)
Math.std = function(array) {
  const mean = array.reduce((sum, val) => sum + val, 0) / array.length;
  const squaredDiffs = array.map(val => Math.pow(val - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((sum, val) => sum + val, 0) / array.length);
};

// 모의 과거 주가 데이터 생성 함수 추가
function generateMockHistoricalData(symbol: string, startDate: Date) {
  const endDate = new Date();
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const result = [];
  
  // 심볼에서 숫자 해시 생성
  const seedValue = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const basePrice = 50 + (seedValue % 200); // 50~250 사이의 기본 가격
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    // 주말 제외
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    // 시드 기반 랜덤 변동
    const dailyChange = ((Math.sin(seedValue + i) + 1) / 2) * 0.06 - 0.03; // -3%~+3% 변동
    
    const prevPrice = i > 0 ? result[result.length - 1].close : basePrice;
    const close = prevPrice * (1 + dailyChange);
    const volume = Math.floor(100000 + Math.random() * 1000000);
    const open = close * (0.99 + Math.random() * 0.02); // +/- 1% 오프닝
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    
    result.push({
      date,
      open,
      high,
      low,
      close,
      volume
    });
  }
  
  return result;
}

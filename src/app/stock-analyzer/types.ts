// 주식 데이터 타입
export interface HistoricalPrice {
  date: string;
  price: number;
  volume: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: {
    value: number;
    signal: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    width: number;
  };
  ma50: number;
  ma200: number;
  ema20: number;
  ema50: number;
  atr: number;
  obv: number;
  stochastic: {
    k: number;
    d: number;
  };
  adx: number;
  supportLevels: number[];
  resistanceLevels: number[];
}

export interface Fundamentals {
  pe: number;
  eps: number;
  dividendYield: number;
  peg: number;
  roe: number;
  debtToEquity: number;
  revenue: number;
  revenueGrowth: number;
  netIncome: number;
  netIncomeGrowth: number;
  operatingMargin: number;
  forwardPE: number;
  epsGrowth: number;
  dividendGrowth: number;
  pb: number;
  ps: number;
  pcf: number;
  roa: number;
  roic: number;
  currentRatio: number;
  quickRatio: number;
  grossMargin: number;
  fcf: number;
  fcfGrowth: number;
  nextEarningsDate: string;
  analystRatings: {
    buy: number;
    hold: number;
    sell: number;
    targetPrice: number;
  };
}

export interface NewsItem {
  title: string;
  source: string;
  date: string;
  url: string;
  sentiment: string;
}

export interface UpcomingEvent {
  date: string;
  type: string;
  title: string;
  description: string;
  impact: string;
}

export interface Momentum {
  shortTerm: number;
  mediumTerm: number;
  longTerm: number;
  relativeStrength: number;
  sectorPerformance: number;
}

export interface StockData {
  ticker: string;
  companyName: string;
  currentPrice: number;
  priceChange: number;
  volume: number;
  marketCap: number;
  high52Week: number;
  low52Week: number;
  description?: string;
  descriptionKr?: string;
  sector?: string;
  industry?: string;
  lastUpdated: string;
  historicalPrices: HistoricalPrice[];
  technicalIndicators?: {
    rsi?: number;
    macd?: {
      value: number;
      signal: number;
      histogram: number;
    };
    ma50?: number;
    ma200?: number;
    bollingerBands?: {
      upper: number;
      middle: number;
      lower: number;
    };
  };
  fundamentals?: {
    pe?: number;
    eps?: number;
    dividendYield?: number;
    peg?: number;
    roe?: number;
    debtToEquity?: number;
    revenue?: number;
    revenueGrowth?: number;
    netIncome?: number;
    netIncomeGrowth?: number;
    operatingMargin?: number;
    nextEarningsDate?: string;
    analystRatings?: {
      buy: number;
      hold: number;
      sell: number;
      targetPrice: number;
    };
  };
}

// 간소화된 경제 지표 타입
export interface SimpleEconomicIndicator {
  name: string;
  value: number;
  unit: string;
  period: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  description: string;
}

// 경제 지표 타입
export interface EconomicIndicator {
  name: string;
  nameKr?: string;
  value: number | string;
  change?: number;
  unit?: string;
  source?: string;
  impact?: 'positive' | 'negative' | 'neutral';
  description?: string;
  previousPeriod?: string;
}

// 예측 결과 타입
export interface PriceRange {
  min: number;
  max: number;
}

export interface TermPrediction {
  price: number;
  change: number;
  probability: number;
  range: PriceRange;
}

export interface PricePrediction {
  date: string;
  predictedPrice: number;
  range: PriceRange;
}

export interface ModelInfo {
  type: string;
  accuracy: number;
  features: string[];
  trainPeriod: string;
}

export interface PredictionResult {
  summary: string;
  technicalAnalysis?: string;
  fundamentalAnalysis?: string;
  marketAnalysis?: string;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidenceScore: number;
  modelInfo?: {
    type: string;
    accuracy: number;
  };
  shortTerm?: {
    price: number;
    change: number;
    probability: number;
    range?: {
      min: number;
      max: number;
    };
  };
  mediumTerm?: {
    price: number;
    change: number;
    probability: number;
    range?: {
      min: number;
      max: number;
    };
  };
  longTerm?: {
    price: number;
    change: number;
    probability: number;
    range?: {
      min: number;
      max: number;
    };
  };
  strengths?: string[];
  risks?: string[];
  pricePredictions?: Array<{
    date: string;
    predictedPrice: number;
  }>;
}

// AI 분석 요청 타입
export interface AIAnalysisRequest {
  stockData: StockData;
  economicData: EconomicIndicator[];
  analysisType: string;
  language?: string;
  modelType?: string;
}

// AI 분석 응답 타입
export interface AIAnalysisResponse {
  analysis: string;
  analysisKr?: string;
  prediction: PredictionResult;
  analysisType: string;
  modelType: string;
  timestamp: string;
}

// API 응답 타입
export interface YahooFinanceResponse {
  chart: {
    result: {
      meta: {
        symbol: string;
        regularMarketPrice: number;
        previousClose: number;
        currency: string;
        exchangeName: string;
        instrumentType: string;
        firstTradeDate: number;
        gmtoffset: number;
        timezone: string;
        exchangeTimezoneName: string;
      };
      timestamp: number[];
      indicators: {
        quote: {
          open: number[];
          high: number[];
          low: number[];
          close: number[];
          volume: number[];
        }[];
        adjclose?: {
          adjclose: number[];
        }[];
      };
    }[];
  };
}

export interface FredApiResponse {
  observations: {
    date: string;
    value: string;
  }[];
}

// API 요청 파라미터 타입
export interface StockApiParams {
  ticker: string;
  range?: string;
  interval?: string;
  lang?: string;
}

export interface EconomicApiParams {
  seriesId: string;
  startDate?: string;
  endDate?: string;
}

// 에러 타입
export interface ApiError {
  code: string;
  message: string;
}

// 차트 패턴 타입
export interface ChartPattern {
  name: string;
  bullish: boolean;
  description: string;
  descriptionKr: string;
  confidence: number;
  tradingActions: string;
}

export interface StockDataWithPatterns extends StockData {
  patterns?: ChartPattern[];
} 
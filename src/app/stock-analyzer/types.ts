// 주식 데이터 타입
export interface HistoricalPrice {
  date: string;
  price: number;
  volume: number;
  open: number;
  high: number;
  low: number;
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
  technicalIndicators: TechnicalIndicators;
  fundamentals: Fundamentals;
  news: NewsItem[];
  patterns: string[];
  upcomingEvents: UpcomingEvent[];
  momentum: Momentum;
  lastUpdated: string;
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
  nameKr: string;
  value: number;
  unit: string;
  change: number;
  previousPeriod: string;
  source: string;
  description: string;
  impact: string;
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
  shortTerm: TermPrediction;
  mediumTerm: TermPrediction;
  longTerm: TermPrediction;
  pricePredictions: PricePrediction[];
  confidenceScore: number;
  modelInfo: ModelInfo;
  summary: string;
  strengths: string[];
  risks: string[];
  recommendation: string;
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
  descriptionKr: string;
  confidence: number;
  tradingActions?: string;
}

// 패턴이 포함된 주식 데이터 타입
export interface StockDataWithPatterns extends Omit<StockData, 'patterns'> {
  patterns: ChartPattern[];
} 
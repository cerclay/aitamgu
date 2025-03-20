// 주식 데이터 타입
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
  lastUpdated: string;
  description: string;
  descriptionKr: string;
  historicalPrices: {
    date: string;
    price: number;
    volume: number;
    open: number;
    high: number;
    low: number;
  }[];
  technicalIndicators: {
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
  };
  fundamentals: {
    pe: number;
    forwardPE: number;
    eps: number;
    epsGrowth: number;
    dividendYield: number;
    dividendGrowth: number;
    peg: number;
    pb: number;
    ps: number;
    pcf: number;
    roe: number;
    roa: number;
    roic: number;
    debtToEquity: number;
    currentRatio: number;
    quickRatio: number;
    revenue: number;
    revenueGrowth: number;
    grossMargin: number;
    netIncome: number;
    netIncomeGrowth: number;
    operatingMargin: number;
    fcf: number;
    fcfGrowth: number;
    nextEarningsDate: string;
    analystRatings: {
      buy: number;
      hold: number;
      sell: number;
      targetPrice: number;
    };
  };
  news: {
    title: string;
    source: string;
    date: string;
    url: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  }[];
  patterns: {
    name: string;
    description: string;
    descriptionKr: string;
    bullish: boolean;
    confidence: number;
    formationDate: string;
  }[];
  upcomingEvents: {
    date: string;
    type: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }[];
  momentum: {
    shortTerm: number;
    mediumTerm: number;
    longTerm: number;
    relativeStrength: number;
    sectorPerformance: number;
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
  id: string;
  name: string;
  nameKr: string;
  category: string;
  value: number;
  unit: string;
  date: string;
  monthlyChange: number;
  yearlyChange: number;
  trend: 'up' | 'down' | 'stable';
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  descriptionKr: string;
  historicalData: {
    date: string;
    value: number;
  }[];
}

// 예측 결과 타입
export interface PredictionResult {
  shortTerm: {
    price: number;
    change: number;
    probability: number;
    range: { min: number; max: number };
  };
  mediumTerm: {
    price: number;
    change: number;
    probability: number;
    range: { min: number; max: number };
  };
  longTerm: {
    price: number;
    change: number;
    probability: number;
    range: { min: number; max: number };
  };
  pricePredictions: {
    date: string;
    predictedPrice: number;
    range: { min: number; max: number };
  }[];
  confidenceScore: number;
  modelInfo: {
    type: string;
    accuracy: number;
    features: string[];
    trainPeriod: string;
  };
  summary: string;
  summaryKr: string;
  strengths: string[];
  risks: string[];
  recommendation: string;
  recommendationKr: string;
  analysisDetails: string;
  analysisDetailsKr: string;
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
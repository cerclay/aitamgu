// 주식 데이터 타입
export interface StockData {
  ticker: string;
  companyName: string;
  currentPrice: number;
  priceChange: number;
  marketCap: number;
  volume: number;
  high52Week: number;
  low52Week: number;
  lastUpdated: string;
  description: string;
  historicalPrices: {
    date: string;
    price: number;
  }[];
  technicalIndicators: {
    rsi: number;
    macd: number;
    bollingerUpper: number;
    bollingerLower: number;
    ma50: number;
    ma200: number;
  };
  fundamentals: {
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
    nextEarningsDate: string;
  };
  patterns: {
    name: string;
    description: string;
    bullish: boolean;
    confidence: number;
  }[];
}

// 경제 지표 타입
export interface EconomicIndicator {
  name: string;
  value: number;
  unit: string;
  change: number;
  previousPeriod: string;
  source: string;
}

// 예측 결과 타입
export interface PredictionResult {
  shortTerm: {
    price: number;
    change: number;
  };
  mediumTerm: {
    price: number;
    change: number;
  };
  longTerm: {
    price: number;
    change: number;
  };
  pricePredictions: {
    date: string;
    predictedPrice: number;
  }[];
  confidenceScore: number;
  summary: string;
  strengths: string[];
  risks: string[];
  recommendation: string;
}

// API 응답 타입
export interface YahooFinanceResponse {
  chart: {
    result: {
      meta: {
        symbol: string;
        regularMarketPrice: number;
        previousClose: number;
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
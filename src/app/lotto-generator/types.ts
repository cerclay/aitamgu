export interface RecommendationOption {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface LottoGeneratorParams {
  birthdate?: string;
  luckyNumber?: number;
}

export interface WinningNumber {
  round: number;
  numbers: number[];
  date: string;
  totalPrize: number;
}

export interface WinningStats {
  mostFrequent: number[];
  leastFrequent: number[];
  recentWinning: WinningNumber[];
  lastUpdated: string;
}

export interface GeneratedNumbers {
  numbers: number[][];
  method: string;
} 
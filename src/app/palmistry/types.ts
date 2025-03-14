export interface PalmistryResult {
  id: string;
  imageUrl: string;
  analysis: {
    overall: string;
    personality: string;
    loveLife: string;
    career: string;
    health: string;
    fortune: string;
    talent: string;
    future: string;
  };
  createdAt: string;
}

export interface PalmLinePoint {
  x: number;
  y: number;
}

export interface PalmistryHistoryItem {
  id: string;
  imageUrl: string;
  createdAt: string;
  summary: string;
}

export interface PalmistryAnalysisResponse {
  analysis: {
    overall: string;
    personality: string;
    loveLife: string;
    career: string;
    health: string;
    fortune: string;
    talent: string;
    future: string;
  };
} 
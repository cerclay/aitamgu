export interface PalmistryResult {
  id: string;
  imageUrl: string;
  analysis: {
    overall: string;
    lifeLine: string;
    heartLine: string;
    headLine: string;
    fateLine: string;
    loveLife: string;
    career: string;
    health: string;
    fortune: string;
  };
  createdAt: string;
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
    lifeLine: string;
    heartLine: string;
    headLine: string;
    fateLine: string;
    loveLife: string;
    career: string;
    health: string;
    fortune: string;
  };
} 
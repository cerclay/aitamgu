// 환경 변수 통합 관리 모듈
export const getEnvVariable = (key: string): string => {
  // 로컬 환경에서는 process.env에서 직접 접근 가능하지만,
  // Vercel 환경에서는 NEXT_PUBLIC_ 접두사가 없는 변수는 서버 사이드에서만 접근 가능
  const value = process.env[key] || process.env[`NEXT_PUBLIC_${key}`] || '';
  
  if (!value && typeof window === 'undefined') {
    console.warn(`환경 변수 ${key}가 설정되지 않았습니다.`);
  }
  
  return value;
};

// Vercel에서 서버리스 함수 실행 시 타임아웃 설정
export const SERVERLESS_TIMEOUT = 10000; // 10초

// API 키 중앙 관리
export const API_KEYS = {
  GEMINI: getEnvVariable('GEMINI_API_KEY'),
  YOUTUBE: getEnvVariable('YOUTUBE_API_KEY'),
  YAHOO_FINANCE: getEnvVariable('YAHOO_FINANCE_API_KEY'),
  FRED: getEnvVariable('FRED_API_KEY'),
}; 
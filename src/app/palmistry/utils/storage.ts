import { PalmistryResult } from '../types';

const STORAGE_KEY = 'palmistry_results';

/**
 * 손금 분석 결과 저장
 */
export const savePalmistryResult = (result: PalmistryResult): void => {
  if (typeof window === 'undefined') return;
  
  try {
    // 기존 결과 불러오기
    const existingResults = getPalmistryResults();
    
    // 새 결과 추가
    const updatedResults = [result, ...existingResults];
    
    // 최대 10개까지만 저장
    const limitedResults = updatedResults.slice(0, 10);
    
    // 로컬 스토리지에 저장
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedResults));
  } catch (error) {
    console.error('손금 분석 결과 저장 중 오류 발생:', error);
  }
};

/**
 * 모든 손금 분석 결과 불러오기
 */
export const getPalmistryResults = (): PalmistryResult[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const resultsJson = localStorage.getItem(STORAGE_KEY);
    if (!resultsJson) return [];
    
    return JSON.parse(resultsJson) as PalmistryResult[];
  } catch (error) {
    console.error('손금 분석 결과 불러오기 중 오류 발생:', error);
    return [];
  }
};

/**
 * 특정 ID의 손금 분석 결과 불러오기
 */
export const getPalmistryResult = (id: string): PalmistryResult | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const results = getPalmistryResults();
    return results.find(result => result.id === id) || null;
  } catch (error) {
    console.error('손금 분석 결과 불러오기 중 오류 발생:', error);
    return null;
  }
};

/**
 * 손금 분석 결과 삭제
 */
export const deletePalmistryResult = (id: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const results = getPalmistryResults();
    const updatedResults = results.filter(result => result.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedResults));
  } catch (error) {
    console.error('손금 분석 결과 삭제 중 오류 발생:', error);
  }
}; 
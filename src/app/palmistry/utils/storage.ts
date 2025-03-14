import { PalmistryResult } from '../types';

const STORAGE_KEY = 'palmistry_results';
const MAX_RESULTS = 10; // 최대 저장 결과 수

/**
 * 손금 분석 결과 저장
 */
export const savePalmistryResult = (result: PalmistryResult): void => {
  try {
    // 기존 결과 가져오기
    const existingResults = getPalmistryResults();
    
    // 새 결과 추가 (최신 결과가 앞에 오도록)
    const updatedResults = [result, ...existingResults];
    
    // 최대 저장 개수 제한
    const limitedResults = updatedResults.slice(0, MAX_RESULTS);
    
    // 로컬 스토리지에 저장
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedResults));
  } catch (error) {
    console.error('손금 분석 결과 저장 중 오류 발생:', error);
  }
};

/**
 * 모든 손금 분석 결과 가져오기
 */
export const getPalmistryResults = (): PalmistryResult[] => {
  try {
    const resultsJson = localStorage.getItem(STORAGE_KEY);
    if (!resultsJson) return [];
    
    const results = JSON.parse(resultsJson) as PalmistryResult[];
    return results;
  } catch (error) {
    console.error('손금 분석 결과 불러오기 중 오류 발생:', error);
    return [];
  }
};

/**
 * ID로 특정 손금 분석 결과 가져오기
 */
export const getPalmistryResultById = (id: string): PalmistryResult | null => {
  try {
    const results = getPalmistryResults();
    const result = results.find(r => r.id === id);
    return result || null;
  } catch (error) {
    console.error('손금 분석 결과 검색 중 오류 발생:', error);
    return null;
  }
};

/**
 * 특정 손금 분석 결과 삭제
 */
export const deletePalmistryResult = (id: string): boolean => {
  try {
    const results = getPalmistryResults();
    const updatedResults = results.filter(r => r.id !== id);
    
    // 변경된 내용이 없으면 false 반환
    if (updatedResults.length === results.length) {
      return false;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedResults));
    return true;
  } catch (error) {
    console.error('손금 분석 결과 삭제 중 오류 발생:', error);
    return false;
  }
};

/**
 * 모든 손금 분석 결과 삭제
 */
export const clearAllPalmistryResults = (): boolean => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('모든 손금 분석 결과 삭제 중 오류 발생:', error);
    return false;
  }
};

/**
 * 손금 분석 결과를 텍스트 파일로 내보내기
 */
export const exportPalmistryResultAsText = (result: PalmistryResult): void => {
  try {
    const { analysis, createdAt } = result;
    
    // 분석 결과 텍스트 생성
    let content = `손금 분석 결과 (${new Date(createdAt).toLocaleString()})\n\n`;
    
    // 각 분석 항목 추가
    content += `✨ 종합 분석\n${analysis.overall}\n\n`;
    content += `👤 성격\n${analysis.personality}\n\n`;
    content += `💖 사랑\n${analysis.love}\n\n`;
    content += `💼 직업\n${analysis.career}\n\n`;
    content += `🏥 건강\n${analysis.health}\n\n`;
    content += `💰 재물\n${analysis.wealth}\n\n`;
    content += `💡 재능\n${analysis.talent}\n\n`;
    content += `🧭 미래\n${analysis.future}\n\n`;
    
    // 텍스트 파일 다운로드
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `손금분석_${new Date(createdAt).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('손금 분석 결과 내보내기 중 오류 발생:', error);
    alert('파일 내보내기에 실패했습니다.');
  }
}; 
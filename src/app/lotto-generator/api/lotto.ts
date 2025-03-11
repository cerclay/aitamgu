import { WinningNumber } from '../types';

// 로또 당첨번호 가져오기
export const fetchLottoWinningNumbers = async (): Promise<WinningNumber[]> => {
  try {
    const response = await fetch('/api/lotto');
    if (!response.ok) {
      throw new Error('API 호출 실패');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('로또 당첨번호 가져오기 실패:', error);
    throw error;
  }
}; 
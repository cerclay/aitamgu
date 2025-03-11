import { LottoGeneratorParams } from '../types';
import { fetchLottoWinningNumbers } from '../api/lotto';

// 기본 랜덤 번호 생성
const getRandomNumbers = (): number[] => {
  const numbers = new Set<number>();
  while(numbers.size < 6) {
    numbers.add(Math.floor(Math.random() * 45) + 1);
  }
  return Array.from(numbers).sort((a, b) => a - b);
};

// 최근 당첨번호 기반 번호 생성
const getFrequentNumbers = async (isFrequent: boolean = true): Promise<number[]> => {
  try {
    const winningNumbers = await fetchLottoWinningNumbers();
    const frequency: { [key: number]: number } = {};
    
    // 1-45까지의 모든 번호의 빈도수를 0으로 초기화
    for (let i = 1; i <= 45; i++) {
      frequency[i] = 0;
    }
    
    // 당첨번호의 빈도수 계산
    winningNumbers.forEach(winning => {
      winning.numbers.forEach(num => {
        frequency[num]++;
      });
    });
    
    // 빈도수를 기준으로 정렬
    const sortedNumbers = Object.entries(frequency)
      .sort((a, b) => isFrequent ? b[1] - a[1] : a[1] - b[1])
      .map(([num]) => parseInt(num));
    
    // 상위 또는 하위 6개 번호 반환
    return sortedNumbers.slice(0, 6);
  } catch (error) {
    console.error('당첨번호 분석 실패:', error);
    return getRandomNumbers();
  }
};

// 패턴 분석 기반 번호 생성
const getPatternNumbers = async (): Promise<number[]> => {
  try {
    const winningNumbers = await fetchLottoWinningNumbers();
    const lastWinning = winningNumbers[0].numbers;
    
    // 구간별로 최소 1개의 번호 선택 (1-15, 16-30, 31-45)
    const sections = [
      [1, 15],
      [16, 30],
      [31, 45]
    ];
    
    const numbers = new Set<number>();
    
    // 각 구간에서 하나씩 선택
    sections.forEach(([min, max]) => {
      const sectionNumbers = lastWinning.filter(n => n >= min && n <= max);
      if (sectionNumbers.length > 0) {
        numbers.add(sectionNumbers[Math.floor(Math.random() * sectionNumbers.length)]);
      } else {
        numbers.add(Math.floor(Math.random() * (max - min + 1)) + min);
      }
    });
    
    // 남은 번호는 랜덤 생성
    while(numbers.size < 6) {
      numbers.add(Math.floor(Math.random() * 45) + 1);
    }
    
    return Array.from(numbers).sort((a, b) => a - b);
  } catch (error) {
    console.error('패턴 분석 실패:', error);
    return getRandomNumbers();
  }
};

// 메인 번호 생성 함수
export const generateLottoNumbers = async (optionId: string): Promise<number[][]> => {
  const result: number[][] = [];
  
  switch (optionId) {
    case 'most-frequent':
      // 자주 나오는 번호 기반 생성
      result.push(await getFrequentNumbers(true));
      for (let i = 0; i < 4; i++) {
        result.push(getRandomNumbers());
      }
      break;
      
    case 'recent-missing':
      // 적게 나오는 번호 기반 생성
      result.push(await getFrequentNumbers(false));
      for (let i = 0; i < 4; i++) {
        result.push(getRandomNumbers());
      }
      break;
      
    case 'pattern-analysis':
      // 패턴 기반 번호 생성
      result.push(await getPatternNumbers());
      for (let i = 0; i < 4; i++) {
        result.push(getRandomNumbers());
      }
      break;
      
    case 'all-options':
      // 각 방식별로 1개씩 번호 생성
      result.push(await getFrequentNumbers(true)); // 자주 나오는 번호
      result.push(await getFrequentNumbers(false)); // 적게 나오는 번호
      result.push(await getPatternNumbers()); // 패턴 분석
      result.push(getRandomNumbers()); // AI 기반
      result.push(getRandomNumbers()); // 랜덤
      break;
      
    default:
      // 기본적으로 5개의 랜덤 번호 생성
      for (let i = 0; i < 5; i++) {
        result.push(getRandomNumbers());
      }
  }
  
  return result;
}; 
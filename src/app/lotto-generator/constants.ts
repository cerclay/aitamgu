import { RecommendationOption } from './types';

export const RECOMMENDATION_OPTIONS: RecommendationOption[] = [
  {
    id: 'frequency',
    title: '최근 자주 나온 번호',
    description: '최근 회차에서 자주 등장한 번호들을 기반으로 조합',
    icon: '🔥'
  },
  {
    id: 'pattern',
    title: '최근 당첨 번호 패턴',
    description: '최근 당첨 번호들의 패턴을 분석하여 추천',
    icon: '📊'
  },
  {
    id: 'cold',
    title: '오랫동안 안나온 번호',
    description: '장기간 미출현 번호들을 고려한 조합',
    icon: '❄️'
  },
  {
    id: 'prediction',
    title: '다음 회차 패턴 예상 번호',
    description: 'AI가 예측한 다음 회차 패턴 기반 번호',
    icon: '🔮'
  },
  {
    id: 'all',
    title: '모든 방식',
    description: '모든 분석 방식을 종합적으로 고려한 추천',
    icon: '🎯'
  }
]; 
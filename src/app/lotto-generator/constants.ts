import { RecommendationOption } from './types';

export const RECOMMENDATION_OPTIONS: RecommendationOption[] = [
  {
    id: 'random',
    title: '랜덤 번호',
    description: '완전한 무작위로 생성된 번호',
    icon: '🎲'
  },
  {
    id: 'personal-lucky',
    title: '럭키 번호',
    description: '행운의 숫자를 기반으로 생성',
    icon: '🍀'
  },
  {
    id: 'pattern-analysis',
    title: '패턴 분석',
    description: '당첨 번호 패턴 기반 추천',
    icon: '📊'
  },
  {
    id: 'all-options',
    title: '모든 방식',
    description: '모든 방식으로 번호 생성',
    icon: '🎯'
  },
  {
    title: '최근 자주 나온 번호',
    description: '최근 회차에서 자주 등장한 번호들을 기반으로 조합',
    category: 'frequency'
  },
  {
    title: '최근 당첨 번호 패턴',
    description: '최근 당첨 번호들의 패턴을 분석하여 추천',
    category: 'pattern'
  },
  {
    title: '오랫동안 안나온 번호',
    description: '장기간 미출현 번호들을 고려한 조합',
    category: 'cold'
  },
  {
    title: '다음 회차 패턴 예상 번호',
    description: 'AI가 예측한 다음 회차 패턴 기반 번호',
    category: 'prediction'
  },
  {
    title: '모든 방식',
    description: '모든 분석 방식을 종합적으로 고려한 추천',
    category: 'all'
  }
]; 
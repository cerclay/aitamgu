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
  }
]; 
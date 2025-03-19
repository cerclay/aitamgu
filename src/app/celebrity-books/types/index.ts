// 유명인 정보 인터페이스
export interface Celebrity {
  id: number;
  name: string;
  image: string;
  role: string;
  slug: string; // URL 슬러그
  category: 'entrepreneur' | 'entertainer' | 'athlete' | 'other'; // 분류 카테고리
  description?: string;
  popularity?: number;
  achievements?: string[]; // 주요 업적
}

// 책 정보 인터페이스
export interface Book {
  id: number;
  title: string;
  author: string;
  cover: string;
  year: number;
  description: string;
  tags: string[];
  isbn?: string;
  publisher?: string;
  amazonUrl?: string;
  goodreadsRating?: number;
  recommendationText?: string; // 유명인이 이 책을 추천하는 이유
}

// 유명인 독서 목록 인터페이스
export interface CelebrityBookList {
  celebrityId: number;
  books: Book[];
  lastUpdated: string;
}

// API 응답 인터페이스
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 책 추천 결과 인터페이스
export interface BookRecommendation {
  sourceBooks: Book[];
  recommendedBooks: Book[];
  similarity: number;
  reason: string;
}

// 필터 타입 정의
export type CategoryFilter = 'all' | 'entrepreneur' | 'entertainer' | 'athlete' | 'other';

// 검색 파라미터 인터페이스
export interface SearchParams {
  query?: string;
  category?: CategoryFilter;
} 
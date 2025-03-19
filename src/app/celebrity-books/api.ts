import { ApiResponse, Book, Celebrity, CategoryFilter, CelebrityBookList } from './types';

// 유명인 더미 데이터
const celebrities: Celebrity[] = [
  {
    id: 1,
    name: '빌 게이츠',
    slug: 'bill-gates',
    image: 'https://picsum.photos/id/1025/400/400',
    role: '마이크로소프트 공동 창업자, 자선가',
    category: 'entrepreneur',
    description: '빌 게이츠는 마이크로소프트의 공동 창업자이자 전 CEO로, 세계 최고의 부자 중 한 명입니다. 현재는 빌 & 멜린다 게이츠 재단을 통해 자선 활동에 전념하고 있습니다.',
    achievements: ['마이크로소프트 창업', '윈도우 운영체제 개발', '빌 & 멜린다 게이츠 재단 설립'],
    popularity: 95,
  },
  {
    id: 2,
    name: '일론 머스크',
    slug: 'elon-musk',
    image: 'https://picsum.photos/id/1012/400/400',
    role: 'Tesla, SpaceX, X(구 Twitter) CEO',
    category: 'entrepreneur',
    description: '일론 머스크는 테슬라, 스페이스X, X(구 트위터)의 CEO로, 혁신적인 기술과 도전적인 비전으로 유명합니다. 전기차, 우주 여행, 뇌-컴퓨터 인터페이스 등 다양한 분야에서 혁신을 주도하고 있습니다.',
    achievements: ['테슬라 전기차 대중화', 'SpaceX 재사용 로켓 개발', 'Starlink 인터넷 서비스'],
    popularity: 98,
  },
  {
    id: 3,
    name: '마크 저커버그',
    slug: 'mark-zuckerberg',
    image: 'https://picsum.photos/id/1074/400/400',
    role: 'Meta(구 Facebook) CEO',
    category: 'entrepreneur',
    description: '마크 저커버그는 페이스북(현 메타)의 창업자이자 CEO로, 소셜 미디어 혁명을 주도했습니다. 현재는 메타버스라는 새로운 디지털 세계 구축에 집중하고 있습니다.',
    achievements: ['페이스북 창업', 'Instagram 및 WhatsApp 인수', '메타버스 비전 제시'],
    popularity: 85,
  },
  {
    id: 4,
    name: '김연아',
    slug: 'yuna-kim',
    image: 'https://picsum.photos/id/1027/400/400',
    role: '전 피겨스케이팅 선수, 올림픽 금메달리스트',
    category: 'athlete',
    description: '김연아는 대한민국의 전 피겨스케이팅 선수로, 2010 밴쿠버 동계올림픽 금메달리스트입니다. 뛰어난 기술과 예술성으로 "피겨여왕"이라 불리며, 은퇴 후에도 다양한 분야에서 활동 중입니다.',
    achievements: ['2010 밴쿠버 동계올림픽 금메달', '2014 소치 동계올림픽 은메달', '세계선수권 2회 우승'],
    popularity: 90,
  },
  {
    id: 5,
    name: '손흥민',
    slug: 'heung-min-son',
    image: 'https://picsum.photos/id/1066/400/400',
    role: '축구선수, 토트넘 홋스퍼 FC',
    category: 'athlete',
    description: '손흥민은 대한민국의 축구선수로, 현재 잉글랜드 프리미어리그 토트넘 홋스퍼 FC에서 활약 중입니다. 아시아 선수 최초로 프리미어리그 득점왕을 차지했으며, 세계적인 공격수로 인정받고 있습니다.',
    achievements: ['프리미어리그 득점왕', '아시아 최고의 축구선수', '토트넘 역대 최다 골 기록'],
    popularity: 92,
  },
  {
    id: 6,
    name: '아이유',
    slug: 'iu',
    image: 'https://picsum.photos/id/1014/400/400',
    role: '가수, 배우',
    category: 'entertainer',
    description: '아이유는 대한민국의 가수, 배우, 작곡가로, 다재다능한 재능을 지닌 아티스트입니다. 맑고 독특한 음색과 작사 작곡 능력을 인정받아 "국민 여동생"에서 "음악의 요정"으로 성장했습니다.',
    achievements: ['다수의 음원 차트 1위', '작사 작곡가로서의 성공', '연기자로서의 호평'],
    popularity: 95,
  },
  {
    id: 7,
    name: '방탄소년단',
    slug: 'bts',
    image: 'https://picsum.photos/id/1036/400/400',
    role: '글로벌 K-pop 그룹',
    category: 'entertainer',
    description: '방탄소년단(BTS)은 대한민국의 7인조 보이그룹으로, 전 세계적인 인기를 얻고 있는 K-pop 대표 그룹입니다. 음악성과 퍼포먼스는 물론, 선한 영향력으로도 많은 사랑을 받고 있습니다.',
    achievements: ['빌보드 차트 1위 다수 기록', '그래미 어워드 노미네이션', '유엔 연설'],
    popularity: 99,
  },
  {
    id: 8,
    name: '오프라 윈프리',
    slug: 'oprah-winfrey',
    image: 'https://picsum.photos/id/1077/400/400',
    role: '방송인, 기업가, 자선가',
    category: 'other',
    description: '오프라 윈프리는 미국의 방송인, 기업가이자 자선가로, 자신의 이름을 건 토크쇼로 큰 성공을 거두었습니다. 특히 그녀의 독서 클럽은 많은 책들을 베스트셀러로 만들었습니다.',
    achievements: ['오프라 윈프리 쇼 25년 방영', '오프라 독서 클럽 운영', '미디어 기업 하포 설립'],
    popularity: 88,
  },
];

// 책 더미 데이터
const books: Book[] = [
  {
    id: 1,
    title: '사피엔스',
    author: '유발 하라리',
    cover: 'https://picsum.photos/id/24/300/450',
    year: 2015,
    description: '인류의 역사와 문명의 발전 과정을 다룬 책입니다.',
    tags: ['역사', '인류학', '철학'],
    goodreadsRating: 4.4,
    recommendationText: '인류의 과거와 미래에 대한 통찰력 있는 분석이 돋보이는 책입니다.',
  },
  {
    id: 2,
    title: '팩트풀니스',
    author: '한스 로슬링',
    cover: 'https://picsum.photos/id/20/300/450',
    year: 2018,
    description: '세계가 생각보다 더 나아지고 있다는 사실을 데이터로 보여주는 책입니다.',
    tags: ['사회과학', '통계', '세계정세'],
    goodreadsRating: 4.3,
    recommendationText: '데이터에 기반해 세상을 객관적으로는바라보는 방법을 알려주는 책입니다.',
  },
  {
    id: 3,
    title: '아톰 습관',
    author: '제임스 클리어',
    cover: 'https://picsum.photos/id/21/300/450',
    year: 2018,
    description: '작은 습관의 변화로 인생을 바꾸는 방법을 알려주는 책입니다.',
    tags: ['자기계발', '습관', '생산성'],
    goodreadsRating: 4.3,
    recommendationText: '습관의 힘을 이해하고 활용하는 방법을 명확하게 설명한 책입니다.',
  },
  {
    id: 4,
    title: '제로 투 원',
    author: '피터 틸',
    cover: 'https://picsum.photos/id/22/300/450',
    year: 2014,
    description: '스타트업과 혁신에 대한 통찰을 담은 책입니다.',
    tags: ['경영', '스타트업', '혁신'],
    goodreadsRating: 4.2,
    recommendationText: '창업과 혁신의 본질에 대해 깊이 생각해볼 수 있는 책입니다.',
  },
  {
    id: 5,
    title: '이기적 유전자',
    author: '리처드 도킨스',
    cover: 'https://picsum.photos/id/23/300/450',
    year: 1976,
    description: '진화 생물학의 관점에서 생명의 본질을 탐구하는 책입니다.',
    tags: ['과학', '생물학', '진화론'],
    goodreadsRating: 4.1,
    recommendationText: '생명의 본질과 진화의 메커니즘을 이해하는 데 도움이 되는 책입니다.',
  },
  {
    id: 6,
    title: '어떻게 일할 것인가',
    author: '리어 제프리스',
    cover: 'https://picsum.photos/id/25/300/450',
    year: 2010,
    description: '효율적인 업무 방식과 생산성 향상에 대한 책입니다.',
    tags: ['자기계발', '생산성', '업무방식'],
    goodreadsRating: 4.0,
    recommendationText: '효율적으로 일하는 방법에 대한 실용적인 조언이 담긴 책입니다.',
  },
  {
    id: 7,
    title: '빅 픽처',
    author: '션 캐럴',
    cover: 'https://picsum.photos/id/26/300/450',
    year: 2016,
    description: '현대 물리학의 주요 개념을 쉽게 설명하는 책입니다.',
    tags: ['과학', '물리학', '우주론'],
    goodreadsRating: 4.2,
    recommendationText: '복잡한 물리학 개념을 일반인도 이해하기 쉽게 설명한 책입니다.',
  },
  {
    id: 8,
    title: '잠자는 뇌를 깨워라',
    author: '데이비드 이글먼',
    cover: 'https://picsum.photos/id/27/300/450',
    year: 2017,
    description: '뇌과학의 최신 연구 결과와 뇌의 작동 방식에 대한 책입니다.',
    tags: ['과학', '뇌과학', '심리학'],
    goodreadsRating: 4.1,
    recommendationText: '뇌의 신비로운 작동 방식을 흥미롭게 설명한 책입니다.',
  },
  {
    id: 9,
    title: '불안한 도시',
    author: '리차드 세넷',
    cover: 'https://picsum.photos/id/28/300/450',
    year: 2018,
    description: '현대 도시의 문제와 해결책을 모색하는 책입니다.',
    tags: ['사회과학', '도시계획', '건축'],
    goodreadsRating: 4.0,
    recommendationText: '도시 환경이 인간 심리에 미치는 영향을 깊이 있게 분석한 책입니다.',
  },
  {
    id: 10,
    title: '사이보그가 되다',
    author: '앤디 클라크',
    cover: 'https://picsum.photos/id/29/300/450',
    year: 2019,
    description: '기술과 인간의 융합에 대한 철학적 탐구를 담은 책입니다.',
    tags: ['철학', '기술', '미래학'],
    goodreadsRating: 4.2,
    recommendationText: '인간과 기술의 공존에 대한 깊은 통찰력을 제공하는 책입니다.',
  },
  {
    id: 11,
    title: '여행의 이유',
    author: '김영하',
    cover: 'https://picsum.photos/id/30/300/450',
    year: 2019,
    description: '여행의 의미와 가치에 대해 사색하는 에세이입니다.',
    tags: ['에세이', '여행', '문학'],
    goodreadsRating: 4.3,
    recommendationText: '여행에 대한 새로운 시각과 깊은 성찰을 담은 아름다운 에세이입니다.',
  },
  {
    id: 12,
    title: '아주 작은 습관의 힘',
    author: 'BJ 포그',
    cover: 'https://picsum.photos/id/31/300/450',
    year: 2020,
    description: '작은 행동 변화로 큰 변화를 이끌어내는 방법을 알려주는 책입니다.',
    tags: ['자기계발', '습관', '행동심리학'],
    goodreadsRating: 4.2,
    recommendationText: '행동 변화의 원리를 과학적으로 분석하고 실천 방법을 제시한 책입니다.',
  },
];

// 유명인별 책 추천 목록
const celebrityBookLists: CelebrityBookList[] = [
  {
    celebrityId: 1, // 빌 게이츠
    books: [1, 2, 4, 5, 7].map(id => books.find(book => book.id === id)!),
    lastUpdated: '2023-12-10'
  },
  {
    celebrityId: 2, // 일론 머스크
    books: [3, 4, 7, 10].map(id => books.find(book => book.id === id)!),
    lastUpdated: '2023-11-15'
  },
  {
    celebrityId: 3, // 마크 저커버그
    books: [1, 4, 8, 10].map(id => books.find(book => book.id === id)!),
    lastUpdated: '2023-10-20'
  },
  {
    celebrityId: 4, // 김연아
    books: [3, 6, 11].map(id => books.find(book => book.id === id)!),
    lastUpdated: '2023-09-05'
  },
  {
    celebrityId: 5, // 손흥민
    books: [3, 6, 12].map(id => books.find(book => book.id === id)!),
    lastUpdated: '2023-08-12'
  },
  {
    celebrityId: 6, // 아이유
    books: [9, 11, 12].map(id => books.find(book => book.id === id)!),
    lastUpdated: '2023-12-01'
  },
  {
    celebrityId: 7, // 방탄소년단
    books: [2, 8, 11].map(id => books.find(book => book.id === id)!),
    lastUpdated: '2023-11-20'
  },
  {
    celebrityId: 8, // 오프라 윈프리
    books: [1, 2, 3, 11, 12].map(id => books.find(book => book.id === id)!),
    lastUpdated: '2023-10-15'
  }
];

// API 함수들
export const api = {
  // 모든 유명인 목록 가져오기
  getAllCelebrities: async (): Promise<ApiResponse<Celebrity[]>> => {
    try {
      // 실제 구현에서는 서버 API 호출
      return {
        success: true,
        data: celebrities
      };
    } catch (error) {
      return {
        success: false,
        error: '유명인 목록을 불러오는데 실패했습니다.'
      };
    }
  },

  // 카테고리별 유명인 필터링
  getCelebritiesByCategory: async (category: CategoryFilter): Promise<ApiResponse<Celebrity[]>> => {
    try {
      if (category === 'all') {
        return {
          success: true,
          data: celebrities
        };
      }
      
      const filtered = celebrities.filter(celebrity => celebrity.category === category);
      return {
        success: true,
        data: filtered
      };
    } catch (error) {
      return {
        success: false,
        error: '유명인 목록을 필터링하는데 실패했습니다.'
      };
    }
  },

  // 유명인 상세 정보 가져오기
  getCelebrityBySlug: async (slug: string): Promise<ApiResponse<Celebrity>> => {
    try {
      const celebrity = celebrities.find(c => c.slug === slug);
      if (!celebrity) {
        return {
          success: false,
          error: '해당 유명인을 찾을 수 없습니다.'
        };
      }
      
      return {
        success: true,
        data: celebrity
      };
    } catch (error) {
      return {
        success: false,
        error: '유명인 정보를 불러오는데 실패했습니다.'
      };
    }
  },

  // 유명인의 추천 도서 목록 가져오기
  getCelebrityBooks: async (celebrityId: number): Promise<ApiResponse<Book[]>> => {
    try {
      const bookList = celebrityBookLists.find(list => list.celebrityId === celebrityId);
      if (!bookList) {
        return {
          success: false,
          error: '해당 유명인의 추천 도서를 찾을 수 없습니다.'
        };
      }
      
      return {
        success: true,
        data: bookList.books
      };
    } catch (error) {
      return {
        success: false,
        error: '추천 도서 목록을 불러오는데 실패했습니다.'
      };
    }
  },
  
  // 책 검색
  searchBooks: async (query: string): Promise<ApiResponse<Book[]>> => {
    try {
      const lowerQuery = query.toLowerCase();
      const results = books.filter(book => 
        book.title.toLowerCase().includes(lowerQuery) || 
        book.author.toLowerCase().includes(lowerQuery) ||
        book.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
      
      return {
        success: true,
        data: results
      };
    } catch (error) {
      return {
        success: false,
        error: '책 검색에 실패했습니다.'
      };
    }
  },
  
  // 유명인 검색
  searchCelebrities: async (query: string): Promise<ApiResponse<Celebrity[]>> => {
    try {
      const lowerQuery = query.toLowerCase();
      const results = celebrities.filter(celebrity => 
        celebrity.name.toLowerCase().includes(lowerQuery) || 
        celebrity.role.toLowerCase().includes(lowerQuery) ||
        celebrity.description?.toLowerCase().includes(lowerQuery)
      );
      
      return {
        success: true,
        data: results
      };
    } catch (error) {
      return {
        success: false,
        error: '유명인 검색에 실패했습니다.'
      };
    }
  }
};
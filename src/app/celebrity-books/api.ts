import { ApiResponse, Book, Celebrity, CategoryFilter, CelebrityBookList } from './types';

// 유명인 더미 데이터
const celebrities: Celebrity[] = [
  {
    id: 1,
    name: '빌 게이츠',
    slug: 'bill-gates',
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Bill_Gates_2017_%28cropped%29.jpg',
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
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Elon_Musk_Royal_Society_%28crop2%29.jpg',
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
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Mark_Zuckerberg_F8_2019_Keynote_%2832830578717%29_%28cropped%29.jpg',
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
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/08/KOCIS_Korea_London_Olympics_Yuna_Kim_02_%287696103368%29.jpg',
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
    image: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Team_Korea_Russia_WorldCup_02_%28cropped%29.png',
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
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/d2/IU_for_Chamisul_%281%29.png',
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
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/BTS_for_Dispatch_White_Day_Special%2C_27_February_2019_01.jpg',
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
    image: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Oprah_in_2014.jpg',
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
    cover: 'https://image.yes24.com/goods/23784410/XL',
    year: 2015,
    description: '인류의 역사와 문명의 발전 과정을 다룬 책으로, 인류가 어떻게 지구의 지배자가 되었는지 설명합니다.',
    tags: ['역사', '인류학', '철학'],
    isbn: '9788934972464',
    publisher: '김영사',
    goodreadsRating: 4.4,
    amazonUrl: 'https://www.amazon.com/Sapiens-Humankind-Yuval-Noah-Harari/dp/0062316095',
    recommendationText: '인류의 과거와 미래에 대한 통찰력 있는 분석이 돋보이는 책입니다. 우리가 어디서 왔고 어디로 가는지 생각하게 합니다.',
  },
  {
    id: 2,
    title: '팩트풀니스',
    author: '한스 로슬링',
    cover: 'https://image.yes24.com/goods/69724044/XL',
    year: 2018,
    description: '세계가 생각보다 더 나아지고 있다는 사실을 데이터로 보여주며, 세상을 올바르게 바라보는 방법을 알려줍니다.',
    tags: ['사회과학', '통계', '세계정세'],
    isbn: '9791188810666',
    publisher: '김영사',
    goodreadsRating: 4.3,
    amazonUrl: 'https://www.amazon.com/Factfulness-Reasons-World-Things-Better/dp/1250107814',
    recommendationText: '데이터에 기반해 세상을 객관적으로 바라보는 방법을 알려주는 책입니다. 우리의 선입견이 얼마나 잘못되었는지 깨닫게 해줍니다.',
  },
  {
    id: 3,
    title: '아주 작은 습관의 힘',
    author: '제임스 클리어',
    cover: 'https://image.yes24.com/goods/73270169/XL',
    year: 2019,
    description: '작은 습관의 변화가 어떻게 인생을 크게 바꿀 수 있는지 과학적으로 설명하고, 효과적인 습관 형성 방법을 알려줍니다.',
    tags: ['자기계발', '습관', '생산성'],
    isbn: '9791188850846',
    publisher: '비즈니스북스',
    goodreadsRating: 4.3,
    amazonUrl: 'https://www.amazon.com/Atomic-Habits-Proven-Build-Break/dp/0735211299',
    recommendationText: '습관의 힘을 이해하고 활용하는 방법을 명확하게 설명한 책입니다. 1% 더 나아지는 방법이 결국 큰 변화로 이어진다는 것을 보여줍니다.',
  },
  {
    id: 4,
    title: '제로 투 원',
    author: '피터 틸',
    cover: 'https://image.yes24.com/goods/17255340/XL',
    year: 2014,
    description: '페이팔 창업자이자 실리콘밸리의 투자자인 피터 틸이 말하는 스타트업과 혁신에 대한 통찰을 담은 책입니다.',
    tags: ['경영', '스타트업', '혁신'],
    isbn: '9788996991342',
    publisher: '한국경제신문사',
    goodreadsRating: 4.2,
    amazonUrl: 'https://www.amazon.com/Zero-One-Notes-Startups-Future/dp/0804139296',
    recommendationText: '창업과 혁신의 본질에 대해 깊이 생각해볼 수 있는 책입니다. 경쟁이 아닌 독점을 추구해야 한다는 역설적 조언이 인상적입니다.',
  },
  {
    id: 5,
    title: '이기적 유전자',
    author: '리처드 도킨스',
    cover: 'https://image.yes24.com/goods/104938917/XL',
    year: 2018,
    description: '진화 생물학의 고전으로, 유전자 중심의 진화론을 대중적으로 설명한 책입니다.',
    tags: ['과학', '생물학', '진화론'],
    isbn: '9788932473901',
    publisher: '을유문화사',
    goodreadsRating: 4.1,
    amazonUrl: 'https://www.amazon.com/Selfish-Gene-Anniversary-Landmark-Science/dp/0198788606',
    recommendationText: '생명의 본질과 진화의 메커니즘을 이해하는 데 도움이 되는 책입니다. 유전자가 어떻게 우리의 행동에 영향을 미치는지 알 수 있습니다.',
  },
  {
    id: 6,
    title: '마음의 작동법',
    author: '스티븐 핑커',
    cover: 'https://image.yes24.com/goods/3303718/XL',
    year: 2007,
    description: '인간의 마음이 어떻게 작동하는지에 대한 인지과학적 접근을 담은 책입니다.',
    tags: ['심리학', '인지과학', '뇌과학'],
    isbn: '9788934934080',
    publisher: '김영사',
    goodreadsRating: 4.0,
    amazonUrl: 'https://www.amazon.com/How-Mind-Works-Steven-Pinker/dp/0393334775',
    recommendationText: '인간의 사고와 감정, 행동의 원리를 과학적으로 설명한 책입니다. 마음이 왜 그렇게 작동하는지 이해하는 데 큰 도움이 됩니다.',
  },
  {
    id: 7,
    title: '코스모스',
    author: '칼 세이건',
    cover: 'https://image.yes24.com/goods/109742211/XL',
    year: 2006,
    description: '우주와 과학의 역사, 그리고 인류의 위치에 대한 깊은 통찰을 담은 과학의 고전입니다.',
    tags: ['과학', '우주론', '천문학'],
    isbn: '9788983711892',
    publisher: '사이언스북스',
    goodreadsRating: 4.4,
    amazonUrl: 'https://www.amazon.com/Cosmos-Carl-Sagan/dp/0345539435',
    recommendationText: '우주의 광대함과 인류의 작은 존재감을 동시에 느끼게 해주는 책입니다. 과학에 대한 경외심과 호기심을 불러일으킵니다.',
  },
  {
    id: 8,
    title: '넛지',
    author: '리처드 탈러, 캐스 선스타인',
    cover: 'https://image.yes24.com/goods/3333282/XL',
    year: 2009,
    description: '사람들의 선택을 유도하는 \'넛지(Nudge)\' 개념을 소개하고, 이를 통해 더 나은 결정을 내리게 하는 방법을 설명합니다.',
    tags: ['경제학', '행동경제학', '심리학'],
    isbn: '9788934938873',
    publisher: '리더스북',
    goodreadsRating: 3.8,
    amazonUrl: 'https://www.amazon.com/Nudge-Improving-Decisions-Health-Happiness/dp/014311526X',
    recommendationText: '인간의 비합리적인 행동 패턴을 이해하고 이를 활용해 더 나은 선택을 이끌어내는 방법을 알려주는 책입니다.',
  },
  {
    id: 9,
    title: '총, 균, 쇠',
    author: '재레드 다이아몬드',
    cover: 'https://image.yes24.com/goods/9686449/XL',
    year: 2005,
    description: '인류 문명의 불균등한 발전 과정을 지리, 생물학, 언어학 등 다양한 관점에서 분석한 책입니다.',
    tags: ['역사', '인류학', '지리학'],
    isbn: '9788970127248',
    publisher: '문학사상사',
    goodreadsRating: 4.0,
    amazonUrl: 'https://www.amazon.com/Guns-Germs-Steel-Fates-Societies/dp/0393354326',
    recommendationText: '문명의 발전에 영향을 준 환경적 요인들을 종합적으로 분석한 책입니다. 왜 어떤 문명은 번성하고 다른 문명은 그렇지 못했는지 이해할 수 있습니다.',
  },
  {
    id: 10,
    title: '호모 데우스',
    author: '유발 하라리',
    cover: 'https://image.yes24.com/goods/35359520/XL',
    year: 2017,
    description: '사피엔스의 후속작으로, 인류의 미래와 기술 발전에 따른 인간의 위치 변화에 대해 다룬 책입니다.',
    tags: ['미래학', '철학', '과학기술'],
    isbn: '9788934982879',
    publisher: '김영사',
    goodreadsRating: 4.2,
    amazonUrl: 'https://www.amazon.com/Homo-Deus-Brief-History-Tomorrow/dp/0062464310',
    recommendationText: '인류가 어떻게 신의 영역에 도전하고 있는지, 그리고 그 과정에서 어떤 문제들이 발생할 수 있는지 생각해볼 수 있는 책입니다.',
  },
  {
    id: 11,
    title: '열린 마음',
    author: '남궁인',
    cover: 'https://image.yes24.com/goods/59879639/XL',
    year: 2019,
    description: '문화, 예술, 삶에 대한 다양한 시각과 철학을 담은 에세이 모음집입니다.',
    tags: ['에세이', '문화', '철학'],
    isbn: '9788954651578',
    publisher: '문학동네',
    goodreadsRating: 4.3,
    recommendationText: '열린 마음으로 세상을 바라보는 방법에 대해 생각해볼 수 있는 책입니다. 삶의 다양한 측면에서 영감을 얻을 수 있습니다.',
  },
  {
    id: 12,
    title: '멘탈의 연금술',
    author: '미리 앤 로스',
    cover: 'https://image.yes24.com/goods/104722422/XL',
    year: 2021,
    description: '스트레스와 불안을 다스리는 새로운 심리학적 접근법을 소개하는 책입니다.',
    tags: ['심리학', '자기계발', '정신건강'],
    isbn: '9791191056587',
    publisher: '다산북스',
    goodreadsRating: 4.2,
    recommendationText: '생각을 바꾸면 감정도 바뀌고, 행동도 바뀐다는 것을 과학적으로 설명한 책입니다. 정신적 회복력을 키우는 데 큰 도움이 됩니다.',
  },
];

// 유명인별 책 추천 목록 (실제 추천 도서로 업데이트)
const celebrityBookLists: CelebrityBookList[] = [
  {
    celebrityId: 1, // 빌 게이츠
    books: [1, 2, 5, 7, 9].map(id => books.find(book => book.id === id)!),
    lastUpdated: '2023-12-10'
  },
  {
    celebrityId: 2, // 일론 머스크
    books: [3, 4, 7, 10, 6].map(id => books.find(book => book.id === id)!),
    lastUpdated: '2023-11-15'
  },
  {
    celebrityId: 3, // 마크 저커버그
    books: [1, 4, 8, 10, 2].map(id => books.find(book => book.id === id)!),
    lastUpdated: '2023-10-20'
  },
  {
    celebrityId: 4, // 김연아
    books: [3, 6, 11, 12].map(id => books.find(book => book.id === id)!),
    lastUpdated: '2023-09-05'
  },
  {
    celebrityId: 5, // 손흥민
    books: [2, 3, 9, 12].map(id => books.find(book => book.id === id)!),
    lastUpdated: '2023-08-15'
  },
  {
    celebrityId: 6, // 아이유
    books: [1, 6, 8, 11].map(id => books.find(book => book.id === id)!),
    lastUpdated: '2023-07-20'
  },
  {
    celebrityId: 7, // 방탄소년단
    books: [1, 3, 10, 11].map(id => books.find(book => book.id === id)!),
    lastUpdated: '2023-06-25'
  },
  {
    celebrityId: 8, // 오프라 윈프리
    books: [2, 5, 8, 9, 10].map(id => books.find(book => book.id === id)!),
    lastUpdated: '2023-05-30'
  },
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
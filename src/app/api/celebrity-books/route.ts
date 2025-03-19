import { NextRequest, NextResponse } from 'next/server';
import { Celebrity, Book, BookRecommendation } from '@/app/celebrity-books/types';

// 모든 유명인 목록 가져오기
export async function GET(request: NextRequest) {
  try {
    // URL에서 쿼리 파라미터 가져오기
    const searchParams = request.nextUrl.searchParams;
    const celebrityId = searchParams.get('celebrityId');
    
    // 특정 유명인 정보를 요청한 경우
    if (celebrityId) {
      const celebrity = getMockCelebrities().find(c => c.id === parseInt(celebrityId));
      
      if (!celebrity) {
        return NextResponse.json(
          { success: false, error: "유명인을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ success: true, data: celebrity });
    }
    
    // 모든 유명인 목록 반환
    return NextResponse.json({
      success: true,
      data: getMockCelebrities()
    });
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 책 추천 API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { celebrityId } = body;
    
    if (!celebrityId) {
      return NextResponse.json(
        { success: false, error: "유명인 ID가 필요합니다." },
        { status: 400 }
      );
    }
    
    // 유명인 정보 확인
    const celebrity = getMockCelebrities().find(c => c.id === parseInt(celebrityId));
    
    if (!celebrity) {
      return NextResponse.json(
        { success: false, error: "유명인을 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    
    // 책 추천 결과 생성
    const recommendation: BookRecommendation = {
      sourceBooks: getMockBooks().slice(0, 2),
      recommendedBooks: getMockRecommendedBooks(),
      similarity: 0.85,
      reason: `${celebrity.name}의 독서 취향과 관심사를 분석한 맞춤형 추천 도서입니다.`
    };
    
    return NextResponse.json({
      success: true,
      data: recommendation
    });
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 임시 데이터: 유명인 목록
function getMockCelebrities(): Celebrity[] {
  return [
    { 
      id: 1, 
      name: '빌 게이츠', 
      image: '/images/celebrities/bill-gates.jpg', 
      role: '기업가, 자선가',
      description: '마이크로소프트 공동 창업자이자 자선가. 기술, 사회 문제, 과학 분야의 도서를 즐겨 읽습니다.',
      popularity: 95
    },
    { 
      id: 2, 
      name: '버락 오바마', 
      image: '/images/celebrities/barack-obama.jpg', 
      role: '전 미국 대통령',
      description: '미국의 제44대 대통령으로, 역사, 정치, 문학 장르를 선호합니다.',
      popularity: 92
    },
    { 
      id: 3, 
      name: '오프라 윈프리', 
      image: '/images/celebrities/oprah-winfrey.jpg', 
      role: '방송인, 사업가',
      description: '유명 방송인이자 오프라 북클럽을 통해 독서 문화에 큰 영향을 미쳤습니다.',
      popularity: 88
    },
    { 
      id: 4, 
      name: '마크 저커버그', 
      image: '/images/celebrities/mark-zuckerberg.jpg', 
      role: '페이스북 창업자',
      description: '페이스북의 창립자로, 과학, 기술, 혁신 관련 도서를 자주 읽습니다.',
      popularity: 85
    },
    { 
      id: 5, 
      name: '일론 머스크', 
      image: '/images/celebrities/elon-musk.jpg', 
      role: '기업가, 혁신가',
      description: '테슬라, 스페이스X의 CEO로, 공학, 물리학, SF 소설을 좋아합니다.',
      popularity: 90
    },
    { 
      id: 6, 
      name: '워렌 버핏', 
      image: '/images/celebrities/warren-buffett.jpg', 
      role: '투자자',
      description: '세계적인 투자자로 경제, 투자, 비즈니스 관련 도서를 즐겨 읽습니다.',
      popularity: 87
    },
    { 
      id: 7, 
      name: '이나모리 가즈오', 
      image: '/images/celebrities/kazuo-inamori.jpg', 
      role: '교세라 창업자',
      description: '교세라 및 KDDI 창업자로 경영 철학과 자기계발 서적을 중요시합니다.',
      popularity: 80
    },
    { 
      id: 8, 
      name: '손정의', 
      image: '/images/celebrities/masayoshi-son.jpg', 
      role: '소프트뱅크 회장',
      description: '소프트뱅크 그룹의 창업자이자 회장으로, 기술 혁신과 미래 예측 관련 도서를 선호합니다.',
      popularity: 82
    }
  ];
}

// 임시 데이터: 책 목록
function getMockBooks(): Book[] {
  return [
    { 
      id: 1, 
      title: '미래를 만든 글로벌 리더', 
      author: '글로벌 비즈니스 연구소', 
      cover: '/images/books/placeholder-1.jpg',
      year: 2022,
      description: '세계적인 기업가들의 리더십 철학을 담은 책',
      tags: ['리더십', '비즈니스', '자기계발'],
      publisher: '비즈니스북스',
      isbn: '978-89-6050-123-4',
      goodreadsRating: 4.2
    },
    { 
      id: 2, 
      title: '인공지능 시대의 창업 전략', 
      author: '테크 이노베이션 랩', 
      cover: '/images/books/placeholder-2.jpg',
      year: 2021,
      description: '기술 혁신을 통한 성공적인 스타트업 전략을 소개합니다',
      tags: ['창업', '기술', '혁신'],
      publisher: '테크북스',
      isbn: '978-89-7050-456-7',
      goodreadsRating: 4.0
    }
  ];
}

// 임시 데이터: 추천 책 목록
function getMockRecommendedBooks(): Book[] {
  return [
    { 
      id: 3, 
      title: '디지털 트랜스포메이션', 
      author: '김기술', 
      cover: '/images/books/placeholder-3.jpg',
      year: 2023,
      description: '디지털 시대의 기업 변혁에 대한 통찰력 있는 안내서',
      tags: ['디지털', '비즈니스', '혁신'],
      publisher: '미래출판',
      isbn: '978-89-8050-789-0',
      goodreadsRating: 4.5
    },
    { 
      id: 4, 
      title: '블록체인 비즈니스', 
      author: '이더리움', 
      cover: '/images/books/placeholder-4.jpg',
      year: 2022,
      description: '블록체인 기술을 비즈니스에 적용하는 실용적인 가이드',
      tags: ['블록체인', '기술', '비즈니스'],
      publisher: '크립토 출판사',
      isbn: '978-89-9050-012-3',
      goodreadsRating: 4.3
    },
    { 
      id: 5, 
      title: '지속 가능한 성장', 
      author: '에코 비즈니스', 
      cover: '/images/books/placeholder-5.jpg',
      year: 2023,
      description: '환경 친화적인 비즈니스 모델을 통한 장기적 성장 전략',
      tags: ['지속가능성', '비즈니스', 'ESG'],
      publisher: '그린 북스',
      isbn: '978-89-0150-345-6',
      goodreadsRating: 4.7
    }
  ];
} 
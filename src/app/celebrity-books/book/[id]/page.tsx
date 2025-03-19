'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Book as BookIcon, Star, ChevronLeft, User, Bookmark, Share2, ThumbsUp } from 'lucide-react';
import { Book } from '@/app/celebrity-books/types';

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // 실제로는 API에서 도서 정보를 가져와야 함
    // 현재는 임시 데이터 사용
    const fetchBookDetails = async () => {
      try {
        setIsLoading(true);
        
        // 임시 데이터로 대체
        setTimeout(() => {
          const mockBook: Book = {
            id: parseInt(params.id as string) || 1,
            title: '디지털 트랜스포메이션',
            author: '김기술',
            cover: '/images/books/placeholder-3.jpg',
            year: 2023,
            description: '디지털 시대의 기업 변혁에 대한 통찰력 있는 안내서입니다. 이 책은 기업이 디지털 시대에 적응하고 성장하기 위한 전략과 방법론을 제시합니다. 현대 비즈니스 환경에서 기술을 활용해 혁신을 이루는 방법, 조직 문화를 변화시키는 방법, 그리고 데이터 기반 의사결정의 중요성에 대해 상세히 다룹니다. 또한 실제 성공 사례와 실패 사례를 통해 실질적인 교훈을 제공합니다.',
            tags: ['디지털', '비즈니스', '혁신', '리더십', '기술혁신'],
            publisher: '미래출판',
            isbn: '978-89-8050-789-0',
            goodreadsRating: 4.5,
            amazonUrl: 'https://amazon.com'
          };
          
          setBook(mockBook);
          setIsLoading(false);
        }, 1000);
      } catch (err) {
        setError('책 정보를 불러오는 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };
    
    fetchBookDetails();
  }, [params.id]);
  
  // 별점 렌더링 함수
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="text-amber-500 fill-amber-500" size={18} />);
    }
    
    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative">
          <Star className="text-gray-300 fill-gray-300" size={18} />
          <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
            <Star className="text-amber-500 fill-amber-500" size={18} />
          </div>
        </div>
      );
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="text-gray-300" size={18} />);
    }
    
    return <div className="flex">{stars}</div>;
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-8 px-4 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">책 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }
  
  if (error || !book) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-8 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">오류가 발생했습니다</h1>
          <p className="text-gray-700 mb-6">{error || '책 정보를 찾을 수 없습니다.'}</p>
          <button
            onClick={() => router.back()}
            className="flex items-center text-orange-600 font-medium"
          >
            <ChevronLeft className="mr-1" size={20} />
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center text-orange-600 font-medium mb-4 hover:underline"
          >
            <ChevronLeft className="mr-1" size={20} />
            뒤로 가기
          </button>
        </motion.div>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* 책 표지 이미지 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex-shrink-0"
              >
                <div className="w-48 h-64 bg-orange-100 rounded-lg shadow-md overflow-hidden mx-auto md:mx-0">
                  <div className="w-full h-full flex items-center justify-center bg-orange-200">
                    <BookIcon size={40} className="text-orange-700 opacity-30" />
                  </div>
                </div>
              </motion.div>
              
              {/* 책 정보 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex-grow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 mb-1">{book.year}</p>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{book.title}</h1>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button className="p-2 rounded-full hover:bg-orange-100 transition-colors">
                      <Bookmark className="text-orange-600" size={20} />
                    </button>
                    <button className="p-2 rounded-full hover:bg-orange-100 transition-colors">
                      <Share2 className="text-orange-600" size={20} />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center mb-4">
                  <User className="text-gray-500 mr-2" size={18} />
                  <p className="text-gray-700 font-medium">{book.author}</p>
                </div>
                
                <div className="flex items-center mb-6">
                  <div className="flex items-center">
                    {renderStars(book.goodreadsRating || 0)}
                    <span className="ml-2 text-gray-600">
                      {book.goodreadsRating}
                      <span className="text-gray-400 text-sm ml-1">/5.0</span>
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {book.tags.map((tag, idx) => (
                    <span 
                      key={idx} 
                      className="inline-block bg-orange-100 text-orange-800 text-xs px-3 py-1 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                
                <div className="mb-6">
                  <h2 className="font-semibold text-gray-700 mb-2">출판 정보</h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">출판사</p>
                      <p className="text-gray-800">{book.publisher}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">출판 연도</p>
                      <p className="text-gray-800">{book.year}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">ISBN</p>
                      <p className="text-gray-800">{book.isbn}</p>
                    </div>
                  </div>
                </div>
                
                {book.amazonUrl && (
                  <a 
                    href={book.amazonUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    구매하기
                  </a>
                )}
              </motion.div>
            </div>
          </div>
          
          {/* 책 설명 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="border-t border-gray-100 p-6 md:p-8"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">책 소개</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {book.description}
            </p>
            
            <div className="flex justify-end mt-4">
              <button className="flex items-center text-orange-600 hover:text-orange-700 transition-colors">
                <ThumbsUp className="mr-1" size={18} />
                <span className="text-sm">유용한 정보예요</span>
              </button>
            </div>
          </motion.div>
        </div>
        
        {/* 관련 추천 도서 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-6">함께 읽으면 좋은 책</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="text-center">
                <div className="w-full aspect-[3/4] bg-orange-100 rounded-lg shadow-sm overflow-hidden mb-2">
                  <div className="w-full h-full flex items-center justify-center bg-orange-200">
                    <BookIcon size={24} className="text-orange-700 opacity-30" />
                  </div>
                </div>
                <h3 className="font-medium text-gray-800 text-sm truncate">관련 추천 도서 {item}</h3>
                <p className="text-gray-600 text-xs">작가 이름</p>
              </div>
            ))}
          </div>
        </motion.div>
        
        {/* 푸터 */}
        <div className="text-center text-gray-500 text-xs mt-8 mb-4">
          <p>© {new Date().getFullYear()} 유명인 책 추천기 | AI 탐구생활</p>
        </div>
      </div>
    </div>
  );
} 
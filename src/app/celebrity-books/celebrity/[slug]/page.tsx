"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Star, Award, BookOpen } from "lucide-react";
import { api } from "../../api";
import { Book, Celebrity } from "../../types";
import { BookCard } from "../../components/BookCard";

interface CelebrityDetailPageProps {
  params: {
    slug: string;
  };
}

export default function CelebrityDetailPage({ params }: CelebrityDetailPageProps) {
  const { slug } = params;
  
  const [celebrity, setCelebrity] = useState<Celebrity | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCelebrityDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // 유명인 정보 가져오기
        const celebrityResponse = await api.getCelebrityBySlug(slug);
        
        if (!celebrityResponse.success || !celebrityResponse.data) {
          setError(celebrityResponse.error || "유명인 정보를 불러오는데 실패했습니다.");
          setIsLoading(false);
          return;
        }
        
        setCelebrity(celebrityResponse.data);
        
        // 유명인 추천 도서 목록 가져오기
        const booksResponse = await api.getCelebrityBooks(celebrityResponse.data.id);
        
        if (booksResponse.success && booksResponse.data) {
          setBooks(booksResponse.data);
        } else {
          setError(booksResponse.error || "추천 도서 목록을 불러오는데 실패했습니다.");
        }
      } catch (err) {
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCelebrityDetails();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-primary mb-4">오류가 발생했습니다</h2>
        <p className="text-accent mb-8">{error}</p>
        <Link href="/celebrity-books">
          <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-accent transition-colors">
            메인으로 돌아가기
          </button>
        </Link>
      </div>
    );
  }

  if (!celebrity) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-primary mb-4">유명인을 찾을 수 없습니다</h2>
        <Link href="/celebrity-books">
          <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-accent transition-colors">
            메인으로 돌아가기
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* 뒤로 가기 버튼 */}
      <div className="mb-8">
        <Link href="/celebrity-books">
          <button className="flex items-center text-gray-dark hover:text-accent transition-colors">
            <ChevronLeft className="h-5 w-5 mr-1" />
            <span>돌아가기</span>
          </button>
        </Link>
      </div>

      {/* 유명인 정보 섹션 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-md overflow-hidden"
      >
        <div className="md:flex">
          {/* 유명인 이미지 */}
          <div className="md:w-1/3 relative h-64 md:h-auto">
            <Image
              src={celebrity.image}
              alt={celebrity.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
          </div>
          
          {/* 유명인 정보 */}
          <div className="p-6 md:w-2/3">
            <div className="flex items-center mb-2">
              <span className="px-3 py-1 bg-accent text-white text-sm rounded-full">
                {getCategory(celebrity.category)}
              </span>
              {celebrity.popularity && (
                <div className="flex items-center ml-3">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-gray-dark ml-1">
                    인기도 {celebrity.popularity}/100
                  </span>
                </div>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
              {celebrity.name}
            </h1>
            
            <p className="text-gray-dark mb-4">{celebrity.role}</p>
            
            <p className="text-gray-dark mb-6">{celebrity.description}</p>
            
            {celebrity.achievements && (
              <div>
                <h3 className="text-lg font-semibold text-primary mb-3 flex items-center">
                  <Award className="h-5 w-5 mr-2 text-accent" />
                  주요 업적
                </h3>
                <ul className="list-disc list-inside pl-2 space-y-1">
                  {celebrity.achievements.map((achievement, index) => (
                    <li key={index} className="text-gray-dark">
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* 추천 도서 섹션 */}
      <section className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2 flex items-center">
            <BookOpen className="h-6 w-6 mr-2 text-accent" />
            {celebrity.name}의 추천 도서
          </h2>
          <p className="text-gray-dark mb-6">
            {celebrity.name}이(가) 추천하는 도서 목록입니다. 각 도서에는 추천 이유가 담겨 있습니다.
          </p>
        </motion.div>

        {books.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-lg text-gray-dark">추천 도서 목록이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {books.map((book, index) => (
                <BookCard
                  key={book.id}
                  book={book}
                  index={index}
                  showRecommendation={true}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* 추천 섹션 */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="bg-white rounded-xl p-6 md:p-8 shadow-md"
      >
        <h2 className="text-xl font-bold text-primary mb-4">다른 유명인도 확인해보세요</h2>
        <p className="text-gray-dark mb-4">
          다양한 분야의 유명인들이 추천하는 도서를 확인하고 새로운 지식과 인사이트를 얻어보세요.
        </p>
        <Link href="/celebrity-books">
          <button className="px-5 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors">
            메인으로 돌아가기
          </button>
        </Link>
      </motion.section>
    </div>
  );
}

function getCategory(category: string): string {
  switch (category) {
    case "entrepreneur":
      return "기업가";
    case "entertainer":
      return "연예인";
    case "athlete":
      return "스포츠 선수";
    case "other":
      return "기타";
    default:
      return category;
  }
} 
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "./api";
import { Celebrity, CategoryFilter } from "./types";
import { CelebrityCard } from "./components/CelebrityCard";

// 이 페이지를 동적 페이지로 표시
export const dynamic = 'force-dynamic';

function CelebrityBooksContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") as CategoryFilter | null;
  
  const [celebrities, setCelebrities] = useState<Celebrity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(
    categoryParam || "all"
  );

  // 카테고리 필터 옵션
  const categoryOptions = [
    { value: "all", label: "전체" },
    { value: "entrepreneur", label: "기업가" },
    { value: "entertainer", label: "연예인" },
    { value: "athlete", label: "스포츠 선수" },
    { value: "other", label: "기타" },
  ];

  // 유명인 데이터 로드
  useEffect(() => {
    const fetchCelebrities = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.getCelebritiesByCategory(activeCategory);
        if (response.success && response.data) {
          setCelebrities(response.data);
        } else {
          setError("데이터를 불러오는데 실패했습니다.");
        }
      } catch (err) {
        console.error("Error fetching celebrities:", err);
        setError("데이터를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCelebrities();
  }, [activeCategory]);

  const handleCategoryChange = (category: CategoryFilter) => {
    // URL 파라미터 업데이트
    const url = new URL(window.location.href);
    if (category === "all") {
      url.searchParams.delete("category");
    } else {
      url.searchParams.set("category", category);
    }
    window.history.pushState({}, "", url.toString());

    setActiveCategory(category);
  };

  return (
    <div className="space-y-10">
      {/* 헤더 섹션 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary">
          유명인들이 추천하는 도서
        </h1>
        <p className="text-lg text-gray-dark max-w-2xl mx-auto">
          기업가, 연예인, 스포츠 선수 등 각 분야에서 활약하는 유명인들이 추천하는
          도서 목록을 만나보세요.
        </p>
      </motion.section>

      {/* 카테고리 필터 섹션 */}
      <section className="flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2"
        >
          {categoryOptions.map((category) => (
            <button
              key={category.value}
              onClick={() => handleCategoryChange(category.value as CategoryFilter)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === category.value
                  ? "bg-accent text-white"
                  : "bg-white text-gray-dark hover:bg-gray-light"
              }`}
            >
              {category.label}
            </button>
          ))}
        </motion.div>
      </section>

      {/* 유명인 목록 그리드 */}
      <section>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-lg text-accent">{error}</p>
          </div>
        ) : celebrities.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-lg text-gray-dark">해당 카테고리의 유명인이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {celebrities.map((celebrity, index) => (
              <CelebrityCard
                key={celebrity.id}
                celebrity={celebrity}
                index={index}
              />
            ))}
          </div>
        )}
      </section>

      {/* 서비스 설명 섹션 */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="bg-white rounded-xl p-6 md:p-8 shadow-md"
      >
        <h2 className="text-2xl font-bold text-primary mb-4">
          이 서비스는 어떻게 이용하나요?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-center w-12 h-12 bg-accent text-white rounded-full font-bold text-xl">
              1
            </div>
            <h3 className="text-lg font-semibold text-primary">
              관심 있는 유명인 선택
            </h3>
            <p className="text-gray-dark">
              다양한 분야의 유명인 중 관심 있는 인물을 선택하세요.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center w-12 h-12 bg-accent text-white rounded-full font-bold text-xl">
              2
            </div>
            <h3 className="text-lg font-semibold text-primary">
              추천 도서 목록 확인
            </h3>
            <p className="text-gray-dark">
              해당 유명인이 추천하는 도서 목록과 추천 이유를 확인하세요.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center w-12 h-12 bg-accent text-white rounded-full font-bold text-xl">
              3
            </div>
            <h3 className="text-lg font-semibold text-primary">새로운 지식 습득</h3>
            <p className="text-gray-dark">
              유명인들의 추천 도서를 통해 새롭고 다양한 지식을 얻어보세요.
            </p>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

export default function CelebrityBooksPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    }>
      <CelebrityBooksContent />
    </Suspense>
  );
} 
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { api } from "./api";
import { Celebrity, CategoryFilter } from "./types";
import { CelebrityCard } from "./components/CelebrityCard";
import { BookIcon, Search, User, ArrowRight } from "lucide-react";

// 이 페이지를 동적 페이지로 표시
export const dynamic = 'force-dynamic';

// 애니메이션 변수
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
      when: "beforeChildren"
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      damping: 15, 
      stiffness: 300 
    } 
  }
};

const fadeInUpVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.6, 
      ease: "easeOut" 
    } 
  }
};

const categoryVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5, 
      delay: 0.1 
    } 
  }
};

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
    { value: "all", label: "전체", icon: <BookIcon className="w-3 h-3 mr-1" /> },
    { value: "entrepreneur", label: "기업가", icon: <User className="w-3 h-3 mr-1" /> },
    { value: "entertainer", label: "연예인", icon: <User className="w-3 h-3 mr-1" /> },
    { value: "athlete", label: "스포츠 선수", icon: <User className="w-3 h-3 mr-1" /> },
    { value: "other", label: "기타", icon: <User className="w-3 h-3 mr-1" /> },
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
    <div className="space-y-10 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto py-6 md:py-10">
      {/* 헤더 섹션 */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="text-center space-y-6"
      >
        <motion.div variants={itemVariants} className="inline-block bg-accent/10 px-4 py-1 rounded-full">
          <p className="text-xs sm:text-sm font-medium text-accent">유명인들의 인사이트를 책으로 만나보세요</p>
        </motion.div>
        
        <motion.h1 
          variants={itemVariants}
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary"
        >
          유명인들이 추천하는 도서
        </motion.h1>
        
        <motion.p 
          variants={itemVariants}
          className="text-base sm:text-lg text-gray-dark max-w-2xl mx-auto"
        >
          기업가, 연예인, 스포츠 선수 등 각 분야에서 활약하는 유명인들이 추천하는
          도서 목록을 만나보세요.
        </motion.p>

        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row justify-center gap-4 pt-2"
        >
          <motion.a 
            href="/celebrity-books/search"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center gap-2 bg-accent text-white font-medium rounded-lg px-6 py-3 hover:bg-accent/90 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>도서 검색하기</span>
          </motion.a>
          
          <motion.a 
            href="#categories"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center gap-2 bg-white text-primary font-medium rounded-lg px-6 py-3 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <span>카테고리 보기</span>
            <ArrowRight className="w-4 h-4" />
          </motion.a>
        </motion.div>
      </motion.section>

      {/* 카테고리 필터 섹션 */}
      <motion.section 
        id="categories"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={categoryVariants}
        className="flex justify-center py-4"
      >
        <div className="bg-white p-2 rounded-full shadow-sm flex flex-wrap justify-center gap-2">
          {categoryOptions.map((category) => (
            <motion.button
              key={category.value}
              onClick={() => handleCategoryChange(category.value as CategoryFilter)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === category.value
                  ? "bg-accent text-white shadow-md"
                  : "bg-gray-50 text-gray-dark hover:bg-gray-100"
              }`}
            >
              {category.icon}
              {category.label}
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* 유명인 목록 그리드 */}
      <AnimatePresence mode="wait">
        <motion.section
          key={activeCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <motion.div 
                animate={{ 
                  rotate: 360,
                  transition: { 
                    repeat: Infinity, 
                    duration: 1,
                    ease: "linear"
                  } 
                }}
                className="rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"
              ></motion.div>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-lg text-accent">{error}</p>
            </div>
          ) : celebrities.length === 0 ? (
            <div className="text-center py-16">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-md mx-auto"
              >
                <p className="text-lg text-gray-dark mb-4">해당 카테고리의 유명인이 없습니다.</p>
                <button 
                  onClick={() => handleCategoryChange('all')}
                  className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors"
                >
                  모든 유명인 보기
                </button>
              </motion.div>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {celebrities.map((celebrity, index) => (
                <CelebrityCard
                  key={celebrity.id}
                  celebrity={celebrity}
                  index={index}
                />
              ))}
            </motion.div>
          )}
        </motion.section>
      </AnimatePresence>

      {/* 서비스 설명 섹션 */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUpVariants}
        className="bg-white rounded-xl p-6 md:p-8 shadow-md"
      >
        <h2 className="text-2xl font-bold text-primary mb-6 text-center">
          이 서비스는 어떻게 이용하나요?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <motion.div 
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="space-y-3 p-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-accent text-white rounded-full font-bold text-xl">
              1
            </div>
            <h3 className="text-lg font-semibold text-primary">
              관심 있는 유명인 선택
            </h3>
            <p className="text-gray-dark">
              다양한 분야의 유명인 중 관심 있는 인물을 선택하세요.
            </p>
          </motion.div>
          <motion.div 
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="space-y-3 p-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-accent text-white rounded-full font-bold text-xl">
              2
            </div>
            <h3 className="text-lg font-semibold text-primary">
              추천 도서 목록 확인
            </h3>
            <p className="text-gray-dark">
              해당 유명인이 추천하는 도서 목록과 추천 이유를 확인하세요.
            </p>
          </motion.div>
          <motion.div 
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="space-y-3 p-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-accent text-white rounded-full font-bold text-xl">
              3
            </div>
            <h3 className="text-lg font-semibold text-primary">새로운 지식 습득</h3>
            <p className="text-gray-dark">
              유명인들의 추천 도서를 통해 새롭고 다양한 지식을 얻어보세요.
            </p>
          </motion.div>
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
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowLeft } from "lucide-react";
import { api } from "../api";
import { Celebrity, Book } from "../types";
import { CelebrityCard } from "../components/CelebrityCard";
import { BookCard } from "../components/BookCard";
import Link from "next/link";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(query);
  const [activeTab, setActiveTab] = useState<"celebrities" | "books">("celebrities");
  const [celebrities, setCelebrities] = useState<Celebrity[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 검색 결과 가져오기
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) return;

      setIsLoading(true);
      setError(null);

      try {
        // 유명인 검색
        const celebritiesResponse = await api.searchCelebrities(query);
        if (celebritiesResponse.success && celebritiesResponse.data) {
          setCelebrities(celebritiesResponse.data);
        }

        // 책 검색
        const booksResponse = await api.searchBooks(query);
        if (booksResponse.success && booksResponse.data) {
          setBooks(booksResponse.data);
        }

        // 결과에 따라 활성 탭 결정
        if (
          (celebritiesResponse.success && celebritiesResponse.data && celebritiesResponse.data.length > 0) ||
          (!booksResponse.success || !booksResponse.data || booksResponse.data.length === 0)
        ) {
          setActiveTab("celebrities");
        } else {
          setActiveTab("books");
        }
      } catch (err) {
        setError("검색 결과를 가져오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  // 검색 제출 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/celebrity-books/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="space-y-10">
      {/* 뒤로 가기 버튼 */}
      <div>
        <Link href="/celebrity-books">
          <button className="flex items-center text-gray-dark hover:text-accent transition-colors">
            <ArrowLeft className="h-5 w-5 mr-1" />
            <span>메인으로 돌아가기</span>
          </button>
        </Link>
      </div>

      {/* 검색 폼 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-md p-6"
      >
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="유명인 이름, 책 제목, 저자 검색..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            className="bg-accent text-white py-3 px-6 rounded-lg hover:bg-accent/90 transition-colors font-medium"
          >
            검색
          </button>
        </form>
      </motion.div>

      {/* 검색 결과 */}
      {query && (
        <div className="space-y-6">
          {/* 결과 헤더 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-primary">
              "{query}" 검색 결과
            </h1>
            <p className="text-gray-dark mt-2">
              {isLoading
                ? "검색 중..."
                : `유명인 ${celebrities.length}명, 도서 ${books.length}권을 찾았습니다.`}
            </p>
          </motion.div>

          {/* 탭 */}
          <div className="border-b border-gray-light">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab("celebrities")}
                className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === "celebrities"
                    ? "border-accent text-accent"
                    : "border-transparent text-gray-dark hover:text-primary"
                }`}
              >
                유명인 ({celebrities.length})
              </button>
              <button
                onClick={() => setActiveTab("books")}
                className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === "books"
                    ? "border-accent text-accent"
                    : "border-transparent text-gray-dark hover:text-primary"
                }`}
              >
                도서 ({books.length})
              </button>
            </div>
          </div>

          {/* 결과 컨텐츠 */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-lg text-accent">{error}</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "celebrities" ? (
                <motion.div
                  key="celebrities"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {celebrities.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-lg text-gray-dark">
                        "{query}"에 해당하는 유명인을 찾을 수 없습니다.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {celebrities.map((celebrity, index) => (
                        <CelebrityCard
                          key={celebrity.id}
                          celebrity={celebrity}
                          index={index}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="books"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {books.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-lg text-gray-dark">
                        "{query}"에 해당하는 도서를 찾을 수 없습니다.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {books.map((book, index) => (
                        <BookCard key={book.id} book={book} index={index} />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* 검색 팁 */}
      {!query && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-md"
        >
          <h2 className="text-xl font-bold text-primary mb-4">검색 팁</h2>
          <ul className="space-y-3 text-gray-dark">
            <li className="flex items-start">
              <span className="inline-block w-5 h-5 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold mr-2 mt-0.5">
                1
              </span>
              <span>유명인 이름(예: 빌 게이츠, 아이유)으로 검색해보세요.</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-5 h-5 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold mr-2 mt-0.5">
                2
              </span>
              <span>책 제목이나 저자 이름으로 검색할 수도 있습니다.</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-5 h-5 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold mr-2 mt-0.5">
                3
              </span>
              <span>
                특정 분야(예: 과학, 리더십, 자기계발)로 검색하면 관련 도서를 찾을 수
                있습니다.
              </span>
            </li>
          </ul>
        </motion.div>
      )}
    </div>
  );
} 
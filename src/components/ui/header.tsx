"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "./input";

interface HeaderProps {
  showSearch?: boolean;
}

export function Header({ showSearch = true }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  
  const isCelebrityBooksPath = pathname.includes("/celebrity-books");

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/celebrity-books/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const categories = [
    { name: "전체", path: "/celebrity-books" },
    { name: "기업가", path: "/celebrity-books?category=entrepreneur" },
    { name: "연예인", path: "/celebrity-books?category=entertainer" },
    { name: "스포츠 선수", path: "/celebrity-books?category=athlete" },
    { name: "기타", path: "/celebrity-books?category=other" },
  ];

  // 애니메이션 변수
  const menuVariants = {
    closed: {
      opacity: 0,
      x: "100%",
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    },
    open: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-light shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="flex items-center space-x-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-xl md:text-2xl font-bold flex items-center">
              <span className="text-primary">Celebrity</span>
              <span className="text-accent">Books</span>
            </h1>
          </motion.div>
        </Link>

        {/* 데스크톱 내비게이션 */}
        {isCelebrityBooksPath && (
          <nav className="hidden md:flex items-center space-x-8">
            {categories.map((item) => (
              <Link href={item.path} key={item.path}>
                <span className="text-gray-dark hover:text-accent transition-colors">
                  {item.name}
                </span>
              </Link>
            ))}
          </nav>
        )}

        {/* 데스크톱 검색 */}
        {showSearch && (
          <div className="hidden md:flex items-center">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="책이나 유명인을 검색하세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 focus:ring-accent focus:border-accent"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-dark" />
            </form>
          </div>
        )}

        {/* 모바일 메뉴 토글 */}
        <div className="flex md:hidden items-center space-x-4">
          {showSearch && (
            <button 
              onClick={() => router.push("/celebrity-books/search")}
              aria-label="검색"
            >
              <Search className="h-5 w-5 text-primary" />
            </button>
          )}
          <button onClick={toggleMenu} className="focus:outline-none" aria-label="메뉴 토글">
            {isMenuOpen ? (
              <X className="h-6 w-6 text-primary" />
            ) : (
              <Menu className="h-6 w-6 text-primary" />
            )}
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {isCelebrityBooksPath && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          initial="closed"
          animate={isMenuOpen ? "open" : "closed"}
          variants={{
            open: { opacity: 1, display: "block" },
            closed: { 
              opacity: 0, 
              transitionEnd: { 
                display: "none" 
              } 
            }
          }}
        >
          <motion.div
            className="fixed right-0 top-0 h-full w-64 bg-white p-5 shadow-lg"
            variants={menuVariants}
          >
            <div className="flex flex-col space-y-6 mt-12">
              {categories.map((item) => (
                <Link 
                  href={item.path} 
                  key={item.path}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="text-primary text-lg hover:text-accent transition-colors">
                    {item.name}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </header>
  );
} 
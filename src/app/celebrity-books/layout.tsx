"use client";

import { Header } from "@/components/ui/header";
import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CelebrityBooksLayoutProps {
  children: ReactNode;
}

export default function CelebrityBooksLayout({
  children,
}: CelebrityBooksLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-neutral">
      <Header showSearch={true} />
      <AnimatePresence mode="wait">
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="flex-grow container mx-auto px-4 py-8"
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <footer className="bg-primary text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Celebrity Books</h3>
              <p className="text-sm">
                유명인들이 추천하는 도서를 한눈에 확인하고, 다양한 분야의 지식과
                인사이트를 얻어보세요.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">카테고리</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/celebrity-books?category=entrepreneur" className="hover:text-accent">
                    기업가
                  </a>
                </li>
                <li>
                  <a href="/celebrity-books?category=entertainer" className="hover:text-accent">
                    연예인
                  </a>
                </li>
                <li>
                  <a href="/celebrity-books?category=athlete" className="hover:text-accent">
                    스포츠 선수
                  </a>
                </li>
                <li>
                  <a href="/celebrity-books?category=other" className="hover:text-accent">
                    기타
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">문의하기</h3>
              <p className="text-sm">
                서비스 이용 중 궁금한 점이 있으시면 아래 이메일로 문의해주세요.
              </p>
              <p className="text-sm mt-2">
                <a href="mailto:contact@celebritybooks.com" className="text-accent">
                  contact@celebritybooks.com
                </a>
              </p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-700 text-center text-sm">
            <p>© {new Date().getFullYear()} Celebrity Books. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 
"use client";

import { Book } from "../types";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { StarIcon, BookOpenIcon } from "lucide-react";

interface BookCardProps {
  book: Book;
  index: number;
  showRecommendation?: boolean;
  celebrityName?: string;
}

// 애니메이션 변수
const bookCardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (index: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      delay: index * 0.1,
      ease: "easeOut",
    }
  }),
  hover: { 
    y: -12,
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    transition: {
      duration: 0.3,
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};

// 커버 이미지 애니메이션
const coverVariants = {
  hover: {
    scale: 1.03,
    rotateY: 5,
    transition: {
      duration: 0.5,
      ease: "easeInOut"
    }
  }
};

// 추천 텍스트 애니메이션
const recommendationVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { 
    opacity: 1, 
    height: "auto",
    transition: {
      duration: 0.4,
      delay: 0.3,
      ease: "easeInOut"
    }
  }
};

export function BookCard({ 
  book, 
  index, 
  showRecommendation = false,
  celebrityName
}: BookCardProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      whileHover="hover"
      custom={index}
      variants={bookCardVariants}
      className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col"
    >
      <div className="flex flex-col h-full">
        <div className="relative pt-[140%] overflow-hidden bg-gray-100">
          <motion.div
            variants={coverVariants}
            className="absolute inset-0 origin-left transform-gpu"
            style={{ perspective: "1000px" }}
          >
            <Image
              src={book.cover}
              alt={`${book.title} 표지`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 shadow-inner pointer-events-none"></div>
          </motion.div>
        </div>
        <div className="p-4 flex-grow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md sm:text-lg font-bold text-primary line-clamp-1">{book.title}</h3>
              {book.goodreadsRating && (
                <div className="flex items-center bg-amber-50 px-2 py-1 rounded-full">
                  <StarIcon className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs text-gray-dark ml-1">{book.goodreadsRating}</span>
                </div>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-dark mb-2">{book.author} · {book.year}년</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {book.tags.slice(0, 3).map((tag) => (
                <span 
                  key={tag} 
                  className="px-2 py-0.5 text-[10px] sm:text-xs bg-neutral rounded-full text-gray-dark"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-xs sm:text-sm text-gray-dark line-clamp-2 mb-3">
              {book.description}
            </p>
          </div>
          
          {showRecommendation && book.recommendationText && (
            <motion.div 
              variants={recommendationVariants}
              className="mt-3 p-3 bg-neutral rounded-md border-l-2 border-accent"
            >
              {celebrityName && (
                <p className="text-xs font-medium text-gray-dark mb-1">
                  {celebrityName}님의 추천:
                </p>
              )}
              <p className="text-xs sm:text-sm text-gray-dark italic flex gap-2">
                <BookOpenIcon className="h-4 w-4 text-accent flex-shrink-0" />
                <span className="flex-grow">
                  &quot;{book.recommendationText}&quot;
                </span>
              </p>
            </motion.div>
          )}
          
          {book.amazonUrl && (
            <div className="mt-3 text-center">
              <Link href={book.amazonUrl} target="_blank" rel="noopener noreferrer">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full text-xs bg-accent/90 hover:bg-accent text-white py-2 px-3 rounded-md transition-colors"
                >
                  아마존에서 보기
                </motion.button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 
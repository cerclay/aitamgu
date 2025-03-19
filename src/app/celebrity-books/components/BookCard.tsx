"use client";

import { Book } from "../types";
import Image from "next/image";
import { motion } from "framer-motion";
import { StarIcon } from "lucide-react";

interface BookCardProps {
  book: Book;
  index: number;
  showRecommendation?: boolean;
}

export function BookCard({ 
  book, 
  index, 
  showRecommendation = false 
}: BookCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
    >
      <div className="flex flex-col h-full">
        <div className="relative w-full pt-[140%]">
          <Image
            src={book.cover}
            alt={`${book.title} 표지`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover absolute inset-0"
          />
        </div>
        <div className="p-4 flex-grow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-primary line-clamp-1">{book.title}</h3>
              {book.goodreadsRating && (
                <div className="flex items-center">
                  <StarIcon className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-gray-dark ml-1">{book.goodreadsRating}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-dark mb-2">{book.author} · {book.year}년</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {book.tags.slice(0, 3).map((tag) => (
                <span 
                  key={tag} 
                  className="px-2 py-0.5 text-xs bg-neutral rounded-full text-gray-dark"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-dark line-clamp-2 mb-3">
              {book.description}
            </p>
          </div>
          
          {showRecommendation && book.recommendationText && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mt-3 p-3 bg-neutral rounded-md"
            >
              <p className="text-sm text-gray-dark italic">
                "<span className="text-accent">{book.recommendationText}</span>"
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 
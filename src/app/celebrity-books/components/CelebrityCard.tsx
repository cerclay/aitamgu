"use client";

import { Celebrity } from "../types";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { StarIcon } from "lucide-react";

interface CelebrityCardProps {
  celebrity: Celebrity;
  index: number;
}

export function CelebrityCard({ celebrity, index }: CelebrityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
    >
      <Link href={`/celebrity-books/celebrity/${celebrity.slug}`}>
        <div className="relative h-48 overflow-hidden">
          <Image
            src={celebrity.image}
            alt={celebrity.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transform hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full p-4">
            <div className="flex items-center space-x-1 mb-1">
              {celebrity.popularity && (
                <div className="flex items-center">
                  <StarIcon className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-white ml-1">
                    {celebrity.popularity / 10}
                  </span>
                </div>
              )}
              <span className="px-2 py-1 text-xs bg-accent text-white rounded-full">
                {getCategory(celebrity.category)}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">{celebrity.name}</h2>
          </div>
        </div>
        <div className="p-4">
          <div className="text-sm text-gray-dark font-medium mb-2">
            {celebrity.role}
          </div>
          <p className="text-sm text-gray-dark line-clamp-2">
            {celebrity.description}
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="mt-4 flex justify-between items-center"
          >
            <span className="text-xs text-gray-dark">자세히 보기</span>
            <span className="text-accent text-sm font-medium">추천 도서 보기 →</span>
          </motion.div>
        </div>
      </Link>
    </motion.div>
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
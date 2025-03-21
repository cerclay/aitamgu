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

// 카드 애니메이션 변수
const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: index * 0.1,
      ease: "easeOut",
    },
  }),
  hover: {
    y: -10,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 15
    }
  }
};

// 이미지 애니메이션 변수
const imageVariants = {
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.4,
      ease: "easeInOut"
    }
  }
};

// 버튼 애니메이션 변수
const buttonVariants = {
  hover: {
    scale: 1.05,
    x: 5,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
      yoyo: Infinity
    }
  }
};

export function CelebrityCard({ celebrity, index }: CelebrityCardProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      whileHover="hover"
      custom={index}
      variants={cardVariants}
      className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col"
    >
      <Link href={`/celebrity-books/celebrity/${celebrity.slug}`} className="flex flex-col h-full">
        <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
          <motion.div variants={imageVariants} className="h-full w-full">
            <Image
              src={celebrity.image}
              alt={celebrity.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover object-center"
              loading="lazy"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full p-4">
            <div className="flex items-center flex-wrap gap-2 mb-2">
              {celebrity.popularity && (
                <div className="flex items-center px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full">
                  <StarIcon className="h-3 w-3 text-yellow-400 mr-1" />
                  <span className="text-xs text-white">
                    {celebrity.popularity / 10}
                  </span>
                </div>
              )}
              <span className="px-2 py-1 text-xs bg-accent/90 backdrop-blur-sm text-white rounded-full">
                {getCategory(celebrity.category)}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white text-shadow">{celebrity.name}</h2>
          </div>
        </div>
        <div className="p-4 flex-grow flex flex-col justify-between">
          <div>
            <div className="text-sm text-gray-dark font-medium mb-2">
              {celebrity.role}
            </div>
            <p className="text-xs sm:text-sm text-gray-dark line-clamp-2">
              {celebrity.description}
            </p>
          </div>
          <motion.div
            className="mt-4 flex justify-between items-center"
            variants={buttonVariants}
          >
            <span className="text-xs text-gray-light">자세히 보기</span>
            <span className="text-accent text-sm font-medium group-hover:translate-x-1 transition-transform duration-300">
              추천 도서 보기 →
            </span>
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
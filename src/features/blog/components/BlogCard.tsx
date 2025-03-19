'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BlogPost } from '../types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface BlogCardProps {
  post: BlogPost;
  index?: number;
}

export const BlogCard = ({ post, index = 0 }: BlogCardProps) => {
  // HTML 내용에서 텍스트만 추출하는 함수
  const extractTextFromHtml = (html: string): string => {
    // DOM 파싱 없이 간단히 태그 제거
    const withoutTags = html.replace(/<[^>]*>/g, ' ');
    return withoutTags.length > 100 
      ? withoutTags.substring(0, 100) + '...' 
      : withoutTags;
  };

  // 요약이 없으면 HTML에서 추출
  const summary = post.summary || extractTextFromHtml(post.content);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="h-full"
    >
      <Link href={`/blog/${post.id}`} className="block h-full">
        <Card className="h-full border border-gray-200 hover:border-blue-500 transition-all duration-300 hover:shadow-md">
          {post.thumbnailUrl && (
            <div className="w-full h-48 overflow-hidden rounded-t-lg">
              <img 
                src={post.thumbnailUrl} 
                alt={post.title} 
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800 line-clamp-2">{post.title}</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              {format(new Date(post.createdAt), 'yyyy년 MM월 dd일', { locale: ko })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 line-clamp-3 text-sm">{summary}</p>
          </CardContent>
          <CardFooter className="text-blue-600 text-sm font-medium">
            <div className="flex items-center">
              <span>더 읽기</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}; 
'use client';

import { useEffect, useState } from 'react';
import { BlogCard } from './BlogCard';
import { BlogPost } from '../types';
import { getLatestBlogPosts } from '../lib/blog-storage';
import { motion } from 'framer-motion';
import { Pencil, Book } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const LatestBlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 클라이언트 측에서만 실행
    if (typeof window !== 'undefined') {
      async function fetchPosts() {
        try {
          const latestPosts = await getLatestBlogPosts(6);
          setPosts(latestPosts);
        } catch (error) {
          console.error('블로그 포스트 불러오기 오류:', error);
        } finally {
          setIsLoading(false);
        }
      }
      
      fetchPosts();
    }
  }, []);

  // 로딩 상태 또는 포스트가 없는 경우 스켈레톤 UI 표시
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6).fill(0).map((_, index) => (
          <div key={index} className="h-96 bg-gray-100 animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  // 포스트가 없는 경우 안내 메시지 표시
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4 flex justify-center">
          <Book className="h-12 w-12 text-blue-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">아직 작성된 블로그 포스트가 없습니다</h3>
        <p className="text-gray-600 mb-6">첫 번째 블로그 포스트를 작성해보세요!</p>
        <Link href="/blog/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Pencil className="mr-2 h-4 w-4" />
            첫 글 작성하기
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {posts.map((post, index) => (
        <BlogCard key={post.id} post={post} index={index} />
      ))}
    </motion.div>
  );
}; 
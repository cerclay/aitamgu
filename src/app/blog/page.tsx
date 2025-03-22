import { getBlogPosts } from '@/features/blog/lib/blog-storage';

// 서버 컴포넌트로 변환
export default async function BlogPage() {
  // 서버에서 데이터 가져오기
  const posts = await getBlogPosts();
  
  // 나머지 클라이언트 로직을 위한 컴포넌트 사용
  return <BlogPageClient initialPosts={posts} />;
}

// 클라이언트 컴포넌트로 분리
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Pencil, ChevronLeft, Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlogCard } from '@/features/blog/components/BlogCard';
import { AuthDialog } from '@/features/blog/components/AuthDialog';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BlogPost } from '@/features/blog/types';

function BlogPageClient({ initialPosts }) {
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 클라이언트 측에서만 실행
    if (typeof window !== 'undefined') {
      setIsLoading(false);
    }
  }, []);

  const handleAuthSuccess = () => {
    router.push('/blog/new');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex flex-col items-center text-center mb-12">
          <Link 
            href="/" 
            className="self-start inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-8"
          >
            <ChevronLeft className="mr-1 h-5 w-5" />
            <span>홈으로</span>
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4"
          >
            <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full">
              <Book className="h-8 w-8 text-blue-600" />
            </div>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl font-bold text-gray-800 mb-4"
          >
            AI 탐구생활 블로그
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-600 max-w-2xl mb-8"
          >
            AI와 관련된 유용한 정보와 인사이트를 공유합니다
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Button 
              onClick={() => setIsAuthDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Pencil className="mr-2 h-4 w-4" />
              글쓰기
            </Button>
          </motion.div>
        </div>

        {/* 블로그 포스트 목록 */}
        <div className="mb-16">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, index) => (
                <div key={index} className="h-96 bg-gray-100 animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, index) => (
                <BlogCard key={post.id} post={post} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mb-4 inline-flex items-center justify-center p-3 bg-gray-100 rounded-full">
                <Book className="h-8 w-8 text-gray-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">아직 작성된 포스트가 없습니다</h2>
              <p className="text-gray-600 mb-8">
                글쓰기 버튼을 눌러 첫 번째 블로그 포스트를 작성해보세요!
              </p>
            </div>
          )}
        </div>
        
        {/* 하단 설명 */}
        <div className="max-w-2xl mx-auto text-center text-gray-600 border-t border-gray-200 pt-8">
          <p className="mb-4">
            이 블로그는 HTML 형식으로 글을 작성할 수 있는 간단한 블로그 서비스입니다.
            첫 번째 글 작성 시 입력한 비밀번호가 관리자 비밀번호로 설정됩니다.
          </p>
          <p className="text-sm">© 2024 AI 탐구생활 블로그. 모든 권리 보유.</p>
        </div>
      </div>

      {/* 인증 다이얼로그 */}
      <AuthDialog 
        isOpen={isAuthDialogOpen} 
        onOpenChange={setIsAuthDialogOpen} 
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
} 
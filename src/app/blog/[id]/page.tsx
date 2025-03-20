// @ts-nocheck - Next.js 15 migration
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Edit, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthDialog } from '@/features/blog/components/AuthDialog';
import { getBlogPostById, deleteBlogPost } from '@/features/blog/lib/blog-storage';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface BlogDetailParams {
  params: {
    id: string;
  };
}

export default function BlogDetail({ params }: BlogDetailParams) {
  const { id } = params;
  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'edit' | 'delete' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const postData = getBlogPostById(id);
        if (postData) {
          setPost(postData);
        } else {
          setError('포스트를 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('포스트 로딩 오류:', err);
        setError('포스트를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
  }, [id]);

  const openAuthDialog = (type: 'edit' | 'delete') => {
    setActionType(type);
    setIsAuthDialogOpen(true);
  };

  const handleAuthSuccess = () => {
    if (actionType === 'edit') {
      router.push(`/blog/edit/${id}`);
    } else if (actionType === 'delete') {
      handleDelete();
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const success = deleteBlogPost(id);
      if (success) {
        router.push('/blog');
      } else {
        setError('포스트를 삭제하지 못했습니다.');
      }
    } catch (err) {
      console.error('포스트 삭제 오류:', err);
      setError('포스트를 삭제하는 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-8"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-12"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
              <div className="h-64 bg-gray-200 rounded w-full mb-4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Link href="/blog" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-8">
              <ChevronLeft className="mr-1 h-5 w-5" />
              <span>블로그로 돌아가기</span>
            </Link>
            
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || '포스트를 찾을 수 없습니다.'}</AlertDescription>
            </Alert>
            
            <Button onClick={() => router.push('/blog')} className="mt-4">
              블로그 홈으로
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* 헤더 및 작업 버튼 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <Link 
              href="/blog" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ChevronLeft className="mr-1 h-5 w-5" />
              <span>블로그로 돌아가기</span>
            </Link>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => openAuthDialog('edit')}
                className="text-blue-600 border-blue-300"
              >
                <Edit className="mr-1 h-4 w-4" />
                수정
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => openAuthDialog('delete')}
                className="text-red-600 border-red-300"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    삭제 중...
                  </span>
                ) : (
                  <>
                    <Trash2 className="mr-1 h-4 w-4" />
                    삭제
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 블로그 포스트 내용 */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-md p-8 mb-8"
          >
            {/* 제목 및 날짜 */}
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">{post.title}</h1>
              <p className="text-gray-500">
                {format(new Date(post.createdAt), 'yyyy년 MM월 dd일', { locale: ko })}
                {post.updatedAt !== post.createdAt && 
                  ` · 수정됨: ${format(new Date(post.updatedAt), 'yyyy년 MM월 dd일', { locale: ko })}`
                }
              </p>
            </header>

            {/* 썸네일 이미지 */}
            {post.thumbnailUrl && (
              <div className="mb-8">
                <img 
                  src={post.thumbnailUrl} 
                  alt={post.title} 
                  className="w-full h-auto rounded-lg shadow-sm"
                />
              </div>
            )}

            {/* 요약 */}
            {post.summary && (
              <div className="mb-8 bg-gray-50 p-4 rounded-md border-l-4 border-blue-500">
                <p className="text-gray-700 italic">{post.summary}</p>
              </div>
            )}

            {/* 본문 */}
            <div 
              className="prose prose-blue max-w-none" 
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </motion.article>
          
          {/* 하단 내비게이션 */}
          <div className="flex justify-center">
            <Link href="/blog">
              <Button variant="outline">
                <ChevronLeft className="mr-1 h-4 w-4" />
                블로그 목록으로
              </Button>
            </Link>
          </div>
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
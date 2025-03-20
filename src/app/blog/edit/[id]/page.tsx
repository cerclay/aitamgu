// @ts-nocheck - Next.js 15 migration
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Save, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { updateBlogPost, getBlogPostById } from '@/features/blog/lib/blog-storage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BlogPost } from '@/features/blog/types';

interface EditBlogPostParams {
  params: {
    id: string;
  };
}

export default function EditBlogPost({ params }: EditBlogPostParams) {
  const { id } = params;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 포스트 데이터 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const postData = getBlogPostById(id);
        
        if (postData) {
          setPost(postData);
          setTitle(postData.title);
          setContent(postData.content);
          setSummary(postData.summary || '');
          setThumbnailUrl(postData.thumbnailUrl || '');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!title.trim()) {
        setError('제목을 입력해주세요.');
        setIsSubmitting(false);
        return;
      }

      if (!content.trim()) {
        setError('내용을 입력해주세요.');
        setIsSubmitting(false);
        return;
      }

      if (!post) {
        setError('수정할 포스트를 찾을 수 없습니다.');
        setIsSubmitting(false);
        return;
      }

      // 블로그 포스트 업데이트
      const updatedPost = updateBlogPost({
        ...post,
        title,
        content,
        summary: summary || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
      });

      if (updatedPost) {
        router.push(`/blog/${id}`);
      } else {
        setError('포스트를 업데이트하지 못했습니다.');
      }
    } catch (err) {
      console.error('블로그 업데이트 오류:', err);
      setError('블로그 포스트를 업데이트하는 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/blog/${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-8"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-12"></div>
              <div className="h-10 bg-gray-200 rounded w-full mb-6"></div>
              <div className="h-10 bg-gray-200 rounded w-full mb-6"></div>
              <div className="h-32 bg-gray-200 rounded w-full mb-6"></div>
              <div className="h-64 bg-gray-200 rounded w-full mb-6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto text-center">
            <Link href="/blog" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-8">
              <ChevronLeft className="mr-1 h-5 w-5" />
              <span>블로그로 돌아가기</span>
            </Link>
            
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <Link 
              href={`/blog/${id}`} 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ChevronLeft className="mr-1 h-5 w-5" />
              <span>포스트로 돌아가기</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">글 수정</h1>
          </div>

          {/* 글 수정 폼 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-lg shadow-md p-6 mb-8"
          >
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* 제목 입력 */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    제목
                  </label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="제목을 입력하세요"
                    className="w-full"
                    disabled={isSubmitting}
                  />
                </div>

                {/* 썸네일 URL 입력 */}
                <div>
                  <label htmlFor="thumbnailUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    썸네일 URL (선택사항)
                  </label>
                  <Input
                    id="thumbnailUrl"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg (비워두면 기본 이미지가 사용됩니다)"
                    className="w-full"
                    disabled={isSubmitting}
                  />
                </div>

                {/* 요약 입력 */}
                <div>
                  <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
                    요약 (선택사항)
                  </label>
                  <Textarea
                    id="summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="글의 요약을 입력하세요 (최대 200자)"
                    maxLength={200}
                    className="w-full h-20"
                    disabled={isSubmitting}
                  />
                </div>

                {/* 본문 HTML 입력 */}
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                    본문 (HTML)
                  </label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="<p>여기에 HTML 형식으로 본문을 작성하세요</p>"
                    className="w-full h-96 font-mono"
                    disabled={isSubmitting}
                  />
                </div>

                {/* 에러 메시지 */}
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* 버튼 그룹 */}
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="flex items-center"
                  >
                    <X className="mr-2 h-4 w-4" />
                    취소
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        저장하기
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>

          {/* 도움말 */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <h3 className="text-lg font-medium text-blue-800 mb-2 flex items-center">
              <Check className="mr-2 h-5 w-5 text-blue-600" />
              HTML 작성 도움말
            </h3>
            <div className="text-sm text-blue-700 space-y-2">
              <p>
                본문은 HTML 형식으로 작성할 수 있습니다. 아래와 같은 태그를 사용해보세요:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><code>&lt;p&gt;...&lt;/p&gt;</code> - 문단 작성</li>
                <li><code>&lt;h2&gt;...&lt;/h2&gt;</code>, <code>&lt;h3&gt;...&lt;/h3&gt;</code> - 제목 작성</li>
                <li><code>&lt;strong&gt;...&lt;/strong&gt;</code> - 굵은 글씨</li>
                <li><code>&lt;em&gt;...&lt;/em&gt;</code> - 기울임 글씨</li>
                <li><code>&lt;ul&gt;&lt;li&gt;...&lt;/li&gt;&lt;/ul&gt;</code> - 목록</li>
                <li><code>&lt;a href=&quot;URL&quot;&gt;...&lt;/a&gt;</code> - 링크</li>
                <li><code>&lt;img src=&quot;URL&quot; alt=&quot;설명&quot;&gt;</code> - 이미지</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Save, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { saveBlogPost } from '@/features/blog/lib/blog-storage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { isAdminAuthenticated } from '@/features/blog/lib/auth';

export default function NewBlogPost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    // 인증 상태 확인
    const authStatus = isAdminAuthenticated();
    setIsAuthenticated(authStatus);
    
    // 인증되지 않은 사용자는 블로그 메인으로 리디렉션
    if (!authStatus) {
      router.push('/blog');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // 인증 상태 재확인
      if (!isAuthenticated) {
        setError('권한이 없습니다. 로그인 후 다시 시도해주세요.');
        setIsSubmitting(false);
        return;
      }

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

      // 블로그 포스트 저장
      const newPost = await saveBlogPost({
        title,
        content,
        summary: summary || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        published: true,
      });

      // 포스트 작성 완료 후 블로그 메인 페이지로 이동
      if (newPost) {
        router.push('/blog');
      } else {
        setError('블로그 포스트를 저장하는 중 문제가 발생했습니다.');
      }
    } catch (err) {
      console.error('블로그 저장 오류:', err);
      setError('블로그 포스트를 저장하는 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/blog');
  };

  // 클라이언트 측에서만 렌더링
  if (!isClient) {
    return null;
  }

  // 인증되지 않은 사용자는 로딩 중 표시
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">권한 확인 중...</h2>
            <p className="text-gray-600">권한이 없으면 블로그 메인 페이지로 이동합니다.</p>
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
              href="/blog" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ChevronLeft className="mr-1 h-5 w-5" />
              <span>블로그로 돌아가기</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">새 글 작성</h1>
          </div>

          {/* 글 작성 폼 */}
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
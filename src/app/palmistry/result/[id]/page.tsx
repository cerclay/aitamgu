'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Download, Trash2, Copy, Check, Info, Heart, Brain, Activity, Star, Sparkles, Briefcase, Coins, Lightbulb, Compass, FileText, User } from 'lucide-react';
import { 
  FacebookShareButton, 
  TwitterShareButton, 
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon
} from 'react-share';
import { 
  getPalmistryResultById, 
  deletePalmistryResult,
  exportPalmistryResultAsText
} from '../../utils/storage';
import { PalmistryResult } from '../../types';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function PalmistryResultPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [result, setResult] = useState<PalmistryResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultCardRef = useRef<HTMLDivElement>(null);
  const fullResultRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 결과 불러오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadedResult = getPalmistryResultById(id);
      setResult(loadedResult);
      setIsLoading(false);
    }
  }, [id]);

  // 결과 삭제
  const handleDelete = () => {
    if (window.confirm('정말로 이 분석 결과를 삭제하시겠습니까?')) {
      deletePalmistryResult(id);
      router.push('/palmistry');
    }
  };

  // 링크 복사
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // 카카오톡 공유
  const shareToKakao = () => {
    if (window.Kakao && result) {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: 'AI 손금 분석 결과',
          description: result.analysis.overall.substring(0, 100) + '...',
          imageUrl: result.imageUrl,
          link: {
            mobileWebUrl: window.location.href,
            webUrl: window.location.href,
          },
        },
        buttons: [
          {
            title: '결과 보기',
            link: {
              mobileWebUrl: window.location.href,
              webUrl: window.location.href,
            },
          },
        ],
      });
    } else {
      alert('카카오톡 공유 기능을 사용할 수 없습니다.');
    }
  };

  // 결과 이미지로 저장
  const handleSaveAsImage = async () => {
    if (!resultRef.current || !result) return;
    
    try {
      setIsSaving(true);
      const canvas = await html2canvas(resultRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      const imageUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `손금분석_${new Date(result.createdAt).toISOString().split('T')[0]}.png`;
      link.href = imageUrl;
      link.click();
    } catch (error) {
      console.error('이미지 저장 중 오류 발생:', error);
      alert('이미지 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // 결과 텍스트로 저장
  const handleSaveAsText = () => {
    if (!result) return;
    exportPalmistryResultAsText(result);
  };

  // 공유 URL
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = '내 손금 분석 결과를 확인해보세요!';

  // 분석 결과 섹션 컴포넌트
  const AnalysisSection = ({ 
    title, 
    content, 
    icon,
    color
  }: { 
    title: string; 
    content: string; 
    icon: React.ReactNode;
    color: string;
  }) => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className={`p-3 bg-gradient-to-r ${color} text-white`}>
        <h3 className="text-lg font-semibold flex items-center">
          {icon}
          <span className="ml-2">{title}</span>
        </h3>
      </div>
      <div className="p-4">
        <p className="text-gray-700 whitespace-pre-line">{content}</p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 py-6 px-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 py-6 px-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-xl font-bold text-gray-800 mb-3">분석 결과를 찾을 수 없습니다</h1>
          <p className="text-sm text-gray-600 mb-6">요청하신 손금 분석 결과가 존재하지 않거나 삭제되었습니다.</p>
          <Link 
            href="/palmistry" 
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span>손금 분석기로 돌아가기</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : !result ? (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">결과를 찾을 수 없습니다</h2>
            <p className="text-gray-600 mb-6">
              요청하신 손금 분석 결과를 찾을 수 없습니다. 결과가 만료되었거나 잘못된 링크일 수 있습니다.
            </p>
            <Link href="/palmistry" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              손금 분석으로 돌아가기
            </Link>
          </div>
        </div>
      ) : (
        <div ref={resultRef} className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-b-3xl shadow-lg">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <Link 
                  href="/palmistry" 
                  className="flex items-center text-white hover:text-indigo-100 transition-colors"
                >
                  <ArrowLeft className="mr-1 h-5 w-5" />
                  <span>돌아가기</span>
                </Link>
                
                <div className="flex items-center space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>공유하기</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <FacebookShareButton url={shareUrl} className="w-full flex items-center">
                          <FacebookIcon size={24} round className="mr-2" />
                          <span>페이스북</span>
                        </FacebookShareButton>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <TwitterShareButton url={shareUrl} className="w-full flex items-center">
                          <TwitterIcon size={24} round className="mr-2" />
                          <span>트위터</span>
                        </TwitterShareButton>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <WhatsappShareButton url={shareUrl} className="w-full flex items-center">
                          <WhatsappIcon size={24} round className="mr-2" />
                          <span>왓츠앱</span>
                        </WhatsappShareButton>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleCopyLink}>
                        <div className="flex items-center w-full">
                          {copied ? (
                            <Check className="mr-2 h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="mr-2 h-4 w-4" />
                          )}
                          <span>{copied ? '복사됨' : '링크 복사'}</span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                        <Download className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>저장하기</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSaveAsImage}>
                        <div className="flex items-center">
                          {isSaving ? (
                            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-b-2 border-current"></div>
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          <span>{isSaving ? '저장 중...' : '이미지로 저장'}</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSaveAsText}>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>텍스트로 저장</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:bg-white/20"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold mb-2">AI 손금 분석 결과</h1>
              <p className="text-indigo-100">
                {new Date(result.createdAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          
          {/* 이미지 및 분석 결과 */}
          <div className="max-w-3xl mx-auto px-4 -mt-6">
            {/* 손바닥 이미지 */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">손바닥 이미지</h2>
                <div className="relative aspect-square max-h-[300px] overflow-hidden rounded-lg">
                  <img 
                    src={result.imageUrl} 
                    alt="손바닥 이미지" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
            
            {/* 종합 분석 */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
              <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                <h2 className="text-xl font-semibold flex items-center">
                  <Sparkles className="mr-2 h-5 w-5" />
                  종합 분석
                </h2>
              </div>
              <div className="p-6">
                <p className="text-gray-700 whitespace-pre-line">{result.analysis.overall}</p>
              </div>
            </div>
            
            {/* 상세 분석 결과 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <AnalysisSection 
                title="성격" 
                icon={<User className="h-5 w-5" />}
                content={result.analysis.personality}
                color="from-blue-500 to-cyan-500"
              />
              
              <AnalysisSection 
                title="사랑" 
                icon={<Heart className="h-5 w-5" />}
                content={result.analysis.loveLife}
                color="from-pink-500 to-rose-500"
              />
              
              <AnalysisSection 
                title="직업" 
                icon={<Briefcase className="h-5 w-5" />}
                content={result.analysis.career}
                color="from-amber-500 to-orange-500"
              />
              
              <AnalysisSection 
                title="건강" 
                icon={<Activity className="h-5 w-5" />}
                content={result.analysis.health}
                color="from-emerald-500 to-green-500"
              />
              
              <AnalysisSection 
                title="재물" 
                icon={<Coins className="h-5 w-5" />}
                content={result.analysis.fortune}
                color="from-yellow-500 to-amber-500"
              />
              
              <AnalysisSection 
                title="재능" 
                icon={<Lightbulb className="h-5 w-5" />}
                content={result.analysis.talent}
                color="from-violet-500 to-purple-500"
              />
              
              <div className="md:col-span-2">
                <AnalysisSection 
                  title="미래" 
                  icon={<Compass className="h-5 w-5" />}
                  content={result.analysis.future}
                  color="from-indigo-500 to-blue-500"
                />
              </div>
            </div>
            
            {/* 푸터 */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 p-6 text-center">
              <p className="text-gray-500 text-sm mb-4">
                이 분석 결과는 AI에 의해 생성되었으며, 재미로만 참고하시기 바랍니다.
              </p>
              
              <div className="flex flex-wrap justify-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={handleSaveAsImage}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-current"></div>
                      <span>저장 중...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" />
                      <span>이미지로 저장</span>
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={handleSaveAsText}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>텍스트로 저장</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  asChild
                >
                  <Link href="/palmistry">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>새 분석하기</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
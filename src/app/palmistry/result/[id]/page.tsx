'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Download, Trash2, Copy, Check } from 'lucide-react';
import { 
  FacebookShareButton, 
  TwitterShareButton, 
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon
} from 'react-share';
import { getPalmistryResult, deletePalmistryResult } from '../../utils/storage';
import { PalmistryResult } from '../../types';
import html2canvas from 'html2canvas';

// 카카오톡 타입 정의
declare global {
  interface Window {
    Kakao: any;
  }
}

export default function PalmistryResultPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [result, setResult] = useState<PalmistryResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overall');
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultCardRef = useRef<HTMLDivElement>(null);

  // 결과 불러오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadedResult = getPalmistryResult(id);
      setResult(loadedResult);
      setIsLoading(false);
      
      // 카카오톡 SDK 초기화
      if (window.Kakao && !window.Kakao.isInitialized()) {
        // 카카오톡 JavaScript SDK 키
        const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY || '';
        if (kakaoKey) {
          window.Kakao.init(kakaoKey);
        } else {
          console.error('카카오톡 JavaScript SDK 키가 설정되지 않았습니다.');
        }
      }
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
  const copyToClipboard = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // 카카오톡 공유
  const shareToKakao = () => {
    if (window.Kakao && result) {
      window.Kakao.Link.sendDefault({
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
  const saveAsImage = async () => {
    if (!resultCardRef.current || !result) return;
    
    try {
      const canvas = await html2canvas(resultCardRef.current, {
        scale: 2, // 고해상도
        useCORS: true, // 외부 이미지 허용
        backgroundColor: null, // 투명 배경
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `손금분석_${new Date(result.createdAt).toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('이미지 저장 중 오류 발생:', error);
      alert('이미지 저장에 실패했습니다.');
    }
  };

  // 결과 텍스트 다운로드
  const handleDownload = () => {
    if (!result) return;
    
    const analysisText = `
# AI 손금 분석 결과

분석 일시: ${new Date(result.createdAt).toLocaleString()}

## 전체적인 분석
${result.analysis.overall}

## 생명선
${result.analysis.lifeLine}

## 감정선/사랑선
${result.analysis.heartLine}

## 지능선/머리선
${result.analysis.headLine}

## 운명선
${result.analysis.fateLine}

## 사랑과 연애 운세
${result.analysis.loveLife}

## 직업과 경력 운세
${result.analysis.career}

## 건강 운세
${result.analysis.health}

## 재물과 금전 운세
${result.analysis.fortune}
    `;
    
    const blob = new Blob([analysisText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `손금분석_${new Date(result.createdAt).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 공유 URL
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = '내 손금 분석 결과를 확인해보세요!';

  // 탭 데이터
  const tabs = [
    { id: 'overall', label: '전체 분석', content: result?.analysis.overall },
    { id: 'lifeLine', label: '생명선', content: result?.analysis.lifeLine },
    { id: 'heartLine', label: '감정선', content: result?.analysis.heartLine },
    { id: 'headLine', label: '지능선', content: result?.analysis.headLine },
    { id: 'fateLine', label: '운명선', content: result?.analysis.fateLine },
    { id: 'loveLife', label: '사랑 운세', content: result?.analysis.loveLife },
    { id: 'career', label: '직업 운세', content: result?.analysis.career },
    { id: 'health', label: '건강 운세', content: result?.analysis.health },
    { id: 'fortune', label: '재물 운세', content: result?.analysis.fortune }
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 py-6 px-4">
      <div className="max-w-md mx-auto">
        {/* 뒤로 가기 버튼 */}
        <div className="mb-4">
          <Link 
            href="/palmistry" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 transition-colors font-medium text-sm"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            <span>손금 분석기로 돌아가기</span>
          </Link>
        </div>

        {/* 헤더 */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-indigo-800 mb-1">손금 분석 결과</h1>
          <p className="text-xs text-gray-600">
            {new Date(result.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* 결과 카드 (이미지 저장용) */}
        <div ref={resultCardRef} className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* 이미지 */}
          <div className="bg-gray-100 p-4 flex items-center justify-center">
            <div className="w-full h-56 rounded-lg overflow-hidden">
              <img 
                src={result.imageUrl} 
                alt="손금 이미지" 
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
              />
            </div>
          </div>
          
          {/* 결과 요약 */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center mb-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></div>
              <h3 className="text-sm font-semibold text-gray-800">요약</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {result.analysis.overall.substring(0, 150)}...
            </p>
          </div>
          
          {/* 주요 운세 결과 */}
          <div className="grid grid-cols-2 gap-px bg-gray-100">
            {[
              { label: '사랑 운세', content: result.analysis.loveLife, color: 'bg-pink-100', textColor: 'text-pink-700' },
              { label: '직업 운세', content: result.analysis.career, color: 'bg-blue-100', textColor: 'text-blue-700' },
              { label: '건강 운세', content: result.analysis.health, color: 'bg-green-100', textColor: 'text-green-700' },
              { label: '재물 운세', content: result.analysis.fortune, color: 'bg-yellow-100', textColor: 'text-yellow-700' }
            ].map((item, index) => (
              <div key={index} className={`${item.color} p-3`}>
                <h4 className={`text-xs font-semibold ${item.textColor} mb-1`}>{item.label}</h4>
                <p className="text-xs text-gray-700 line-clamp-3">
                  {item.content.substring(0, 60)}...
                </p>
              </div>
            ))}
          </div>
          
          {/* 워터마크 */}
          <div className="p-2 bg-indigo-50 text-center">
            <p className="text-xs text-indigo-500">AI 손금 분석기 by Gemini</p>
          </div>
        </div>
        
        {/* 액션 버튼 */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            onClick={() => setShowShareOptions(!showShareOptions)}
            className="flex flex-col items-center justify-center py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Share2 className="h-5 w-5 mb-1" />
            <span className="text-xs">공유하기</span>
          </button>
          
          <button
            onClick={saveAsImage}
            className="flex flex-col items-center justify-center py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-5 w-5 mb-1" />
            <span className="text-xs">이미지 저장</span>
          </button>
          
          <button
            onClick={handleDelete}
            className="flex flex-col items-center justify-center py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="h-5 w-5 mb-1" />
            <span className="text-xs">삭제하기</span>
          </button>
        </div>
        
        {/* 공유 옵션 */}
        {showShareOptions && (
          <div className="mt-3 p-4 bg-white rounded-lg shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">공유하기</h3>
            <div className="grid grid-cols-5 gap-2">
              <button
                onClick={copyToClipboard}
                className="flex flex-col items-center justify-center"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                  {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5 text-gray-500" />}
                </div>
                <span className="text-xs text-gray-700">{copied ? '복사됨' : '링크'}</span>
              </button>
              
              <FacebookShareButton url={shareUrl} quote={shareTitle}>
                <div className="flex flex-col items-center">
                  <FacebookIcon size={40} round />
                  <span className="text-xs text-gray-700 mt-1">페이스북</span>
                </div>
              </FacebookShareButton>
              
              <TwitterShareButton url={shareUrl} title={shareTitle}>
                <div className="flex flex-col items-center">
                  <TwitterIcon size={40} round />
                  <span className="text-xs text-gray-700 mt-1">트위터</span>
                </div>
              </TwitterShareButton>
              
              <WhatsappShareButton url={shareUrl} title={shareTitle}>
                <div className="flex flex-col items-center">
                  <WhatsappIcon size={40} round />
                  <span className="text-xs text-gray-700 mt-1">왓츠앱</span>
                </div>
              </WhatsappShareButton>
              
              <button
                onClick={shareToKakao}
                className="flex flex-col items-center justify-center"
              >
                <div className="w-10 h-10 rounded-full bg-yellow-300 flex items-center justify-center mb-1">
                  <span className="text-black font-bold text-sm">K</span>
                </div>
                <span className="text-xs text-gray-700">카카오</span>
              </button>
            </div>
          </div>
        )}
        
        {/* 탭 내비게이션 */}
        <div className="mt-4 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 text-xs font-medium whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* 탭 컨텐츠 */}
          <div className="p-4">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={activeTab === tab.id ? 'block' : 'hidden'}
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{tab.label}</h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {tab.content}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        {/* 푸터 */}
        <div className="mt-4 text-center text-gray-500 text-xs">
          <p>이 분석 결과는 Google Gemini AI에 의해 생성되었으며, 재미로만 봐주세요.</p>
          <p className="mt-1">© 2024 AI 손금 분석기</p>
        </div>
      </div>
    </div>
  );
} 
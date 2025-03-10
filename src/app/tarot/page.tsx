'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, Upload, Share2, Download, RefreshCw, Copy, Link2, MessageCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as htmlToImage from 'html-to-image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// Gemini API 키
const API_KEY = 'AIzaSyC_Woxwt323fN5CRAHbGRrzAp10bGZMA_4';

// 메이저 아르카나 타로 카드 정보
const majorArcanaCards = [
  { id: 0, name: "바보", image: "/tarot/fool.jpg", description: "새로운 시작, 순수함, 모험" },
  { id: 1, name: "마법사", image: "/tarot/magician.jpg", description: "창의성, 기술, 의지력" },
  { id: 2, name: "여사제", image: "/tarot/high-priestess.jpg", description: "직관, 무의식, 내면의 지혜" },
  { id: 3, name: "여황제", image: "/tarot/empress.jpg", description: "풍요, 모성애, 창조성" },
  { id: 4, name: "황제", image: "/tarot/emperor.jpg", description: "권위, 구조, 통제" },
  { id: 5, name: "교황", image: "/tarot/hierophant.jpg", description: "전통, 신념, 교육" },
  { id: 6, name: "연인", image: "/tarot/lovers.jpg", description: "사랑, 조화, 선택" },
  { id: 7, name: "전차", image: "/tarot/chariot.jpg", description: "의지력, 결단력, 승리" },
  { id: 8, name: "힘", image: "/tarot/strength.jpg", description: "용기, 인내, 내면의 힘" },
  { id: 9, name: "은둔자", image: "/tarot/hermit.jpg", description: "성찰, 내면 탐색, 지혜" },
  { id: 10, name: "운명의 수레바퀴", image: "/tarot/wheel-of-fortune.jpg", description: "운명, 전환점, 기회" },
  { id: 11, name: "정의", image: "/tarot/justice.jpg", description: "균형, 진실, 법" },
  { id: 12, name: "매달린 사람", image: "/tarot/hanged-man.jpg", description: "희생, 새로운 관점, 기다림" },
  { id: 13, name: "죽음", image: "/tarot/death.jpg", description: "변화, 종결, 변형" },
  { id: 14, name: "절제", image: "/tarot/temperance.jpg", description: "균형, 조화, 중용" },
  { id: 15, name: "악마", image: "/tarot/devil.jpg", description: "속박, 유혹, 그림자 자아" },
  { id: 16, name: "탑", image: "/tarot/tower.jpg", description: "갑작스러운 변화, 혼란, 계시" },
  { id: 17, name: "별", image: "/tarot/star.jpg", description: "희망, 영감, 평온" },
  { id: 18, name: "달", image: "/tarot/moon.jpg", description: "환상, 불확실성, 직관" },
  { id: 19, name: "태양", image: "/tarot/sun.jpg", description: "성공, 기쁨, 활력" },
  { id: 20, name: "심판", image: "/tarot/judgement.jpg", description: "재생, 내적 부름, 반성" },
  { id: 21, name: "세계", image: "/tarot/world.jpg", description: "완성, 성취, 통합" }
];

// 카카오톡 API 타입 정의
declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (options: any) => void;
      };
    };
  }
}

export default function Tarot() {
  // 상태 관리
  const [step, setStep] = useState<'input' | 'select' | 'analyzing' | 'result'>('input');
  const [concern, setConcern] = useState<string>('');
  const [isShuffling, setIsShuffling] = useState(false);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [shuffledCards, setShuffledCards] = useState<number[]>([]);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const resultRef = useRef<HTMLDivElement>(null);
  
  // 카드 섞기
  const handleShuffle = () => {
    if (!concern.trim()) {
      setError('고민을 입력해주세요.');
      return;
    }
    
    setError(null);
    setIsShuffling(true);
    setSelectedCards([]);
    
    // 카드 인덱스 섞기 (0-21)
    const indices = Array.from({ length: 22 }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    setShuffledCards(indices);
    
    setTimeout(() => {
      setIsShuffling(false);
      setStep('select');
    }, 2000);
  };
  
  // 카드 선택
  const handleSelectCard = (index: number) => {
    if (selectedCards.length < 5 && !selectedCards.includes(index)) {
      setSelectedCards([...selectedCards, index]);
    }
  };
  
  // 타로 해석 분석
  const analyzeTarot = async () => {
    if (selectedCards.length !== 5) {
      setError('5장의 카드를 모두 선택해주세요.');
      return;
    }
    
    setIsLoading(true);
    setStep('analyzing');
    
    try {
      // Gemini API 초기화
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // 선택된 카드 정보 가져오기
      const selectedCardInfo = selectedCards.map((cardIndex, i) => {
        const card = majorArcanaCards[shuffledCards[cardIndex]];
        return `${i+1}번째 카드: ${card.name} - ${card.description}`;
      }).join('\n');
      
      // 프롬프트 작성
      const prompt = `
        당신은 전문 타로 해석가입니다. 고객의 고민과 선택한 5장의 타로 카드를 바탕으로 심층적인 타로 해석을 제공해주세요.
        
        고객의 고민: "${concern}"
        
        선택된 타로 카드:
        ${selectedCardInfo}
        
        각 카드의 의미와 고객의 고민을 연결하여 다음 형식으로 해석해주세요:
        
        1. 전체적인 요약 (고민에 대한 전반적인 해석)
        2. 각 카드별 상세 해석 (각 카드가 고민과 어떻게 연결되는지)
        3. 미래 전망 (앞으로의 가능성과 조언)
        4. 행동 제안 (고객이 취할 수 있는 구체적인 행동)
        
        해석은 긍정적이고 건설적이며, 고객에게 도움이 되는 방향으로 작성해주세요.
        결과는 JSON 형식으로 응답해주세요:
        
        {
          "summary": "전체적인 요약",
          "cardReadings": [
            {
              "cardName": "카드1 이름",
              "interpretation": "카드1 해석"
            },
            {
              "cardName": "카드2 이름",
              "interpretation": "카드2 해석"
            },
            {
              "cardName": "카드3 이름",
              "interpretation": "카드3 해석"
            },
            {
              "cardName": "카드4 이름",
              "interpretation": "카드4 해석"
            },
            {
              "cardName": "카드5 이름",
              "interpretation": "카드5 해석"
            }
          ],
          "futurePerspective": "미래 전망",
          "actionSuggestions": "행동 제안"
        }
      `;
      
      // API 요청
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // JSON 추출
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const jsonData = JSON.parse(jsonMatch[0]);
          setAnalysisResult(jsonData);
          setStep('result');
        } catch (jsonError) {
          console.error('JSON 파싱 오류:', jsonError);
          // 백업 파싱 시도
          try {
            const cleanedText = text.replace(/```json|```/g, '').trim();
            const jsonData = JSON.parse(cleanedText);
            setAnalysisResult(jsonData);
            setStep('result');
          } catch (backupError) {
            console.error('백업 JSON 파싱 오류:', backupError);
            setError('결과 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
            setStep('select');
          }
        }
      } else {
        setError('분석 결과를 처리할 수 없습니다.');
        setStep('select');
      }
    } catch (err) {
      console.error('분석 오류:', err);
      if (err instanceof Error) {
        setError(`타로 해석 중 오류가 발생했습니다: ${err.message}`);
      } else {
        setError('타로 해석 중 알 수 없는 오류가 발생했습니다.');
      }
      setStep('select');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 결과 이미지로 저장
  const saveAsImage = async () => {
    if (resultRef.current) {
      try {
        const dataUrl = await htmlToImage.toPng(resultRef.current);
        const link = document.createElement('a');
        link.download = '타로_운세_결과.png';
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('이미지 저장 오류:', err);
        setError('이미지 저장 중 오류가 발생했습니다.');
      }
    }
  };
  
  // 결과 공유
  const shareResult = async () => {
    if (resultRef.current && navigator.share) {
      try {
        const dataUrl = await htmlToImage.toPng(resultRef.current);
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], '타로_운세_결과.png', { type: 'image/png' });
        
        await navigator.share({
          title: '타로 운세 결과',
          text: `${concern}에 대한 타로 운세 결과입니다.`,
          files: [file]
        });
      } catch (err) {
        console.error('공유 오류:', err);
        if (err instanceof Error && err.name !== 'AbortError') {
          setError('결과 공유 중 오류가 발생했습니다.');
        }
      }
    } else {
      setError('이 브라우저에서는 공유 기능을 지원하지 않습니다.');
    }
  };
  
  // 결과 링크 복사
  const copyResultLink = () => {
    const resultId = Date.now().toString(36);
    const resultLink = `${window.location.origin}/tarot/result/${resultId}`;
    
    navigator.clipboard.writeText(resultLink).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch(err => {
      console.error('링크 복사 오류:', err);
      setError('링크를 복사하는 중 오류가 발생했습니다.');
    });
  };
  
  // 카카오톡 공유
  const shareToKakao = async () => {
    if (!window.Kakao) {
      setError('카카오톡 공유 기능을 사용할 수 없습니다.');
      return;
    }
    
    try {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init('YOUR_KAKAO_JAVASCRIPT_KEY');
      }
      
      if (resultRef.current) {
        const dataUrl = await htmlToImage.toPng(resultRef.current);
        
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: '타로 운세 결과',
            description: `${concern}에 대한 타로 운세 결과입니다.`,
            imageUrl: dataUrl,
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
      }
    } catch (err) {
      console.error('카카오톡 공유 오류:', err);
      setError('카카오톡 공유 중 오류가 발생했습니다.');
    }
  };
  
  // 다시 시작
  const restart = () => {
    setConcern('');
    setSelectedCards([]);
    setShuffledCards([]);
    setAnalysisResult(null);
    setError(null);
    setStep('input');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6">
        <Link href="/" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span>홈으로 돌아가기</span>
        </Link>
        
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 text-orange-600 text-center">타로 운세보기</h1>
          
          {/* 고민 입력 화면 */}
          {step === 'input' && (
            <div className="space-y-6">
              <p className="text-gray-600 mb-4 text-center">
                타로 카드를 통해 당신의 고민을 해결해 드립니다. 아래에 고민을 입력해주세요.
              </p>
              
              <div className="bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  당신의 고민을 입력해주세요
                </label>
                <Textarea
                  placeholder="예: 올해 취업을 할 수 있을까요?"
                  className="w-full h-32 resize-none border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  value={concern}
                  onChange={(e) => setConcern(e.target.value)}
                />
                
                <Button 
                  className="w-full mt-4 bg-orange-600 hover:bg-orange-700"
                  onClick={handleShuffle}
                >
                  타로 카드 펼치기
                </Button>
              </div>
              
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
                  {error}
                </div>
              )}
            </div>
          )}
          
          {/* 카드 선택 화면 */}
          {step === 'select' && (
            <div className="space-y-6">
              <p className="text-gray-600 mb-2 text-center">
                5장의 카드를 선택해주세요. 선택한 카드를 바탕으로 운세를 해석해 드립니다.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200 mb-4">
                <p className="text-sm text-gray-700 mb-2 font-medium">당신의 고민:</p>
                <p className="text-gray-800 bg-white p-3 rounded-lg border border-gray-100">{concern}</p>
              </div>
              
              <div className="grid grid-cols-4 gap-2 md:gap-3">
                {shuffledCards.slice(0, 20).map((cardId, index) => (
                  <div 
                    key={index}
                    className="aspect-[2/3] cursor-pointer"
                    onClick={() => !isShuffling && handleSelectCard(index)}
                  >
                    <div 
                      className={`h-full w-full flex items-center justify-center transition-all duration-300 rounded-lg overflow-hidden ${
                        isShuffling ? 'animate-pulse' : ''
                      } ${
                        selectedCards.includes(index) 
                          ? 'ring-2 ring-orange-500 ring-offset-2' 
                          : 'bg-gradient-to-br from-purple-500 to-indigo-700 hover:shadow-lg'
                      }`}
                    >
                      {selectedCards.includes(index) ? (
                        <div className="relative w-full h-full">
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white font-bold">
                            {selectedCards.indexOf(index) + 1}
                          </div>
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            🔮
                          </div>
                        </div>
                      ) : (
                        <div className="text-white font-bold text-2xl">?</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center">
                <Button 
                  variant="outline" 
                  className="border-orange-600 text-orange-600 hover:bg-orange-50"
                  onClick={restart}
                >
                  다시 시작
                </Button>
                
                <div className="text-sm text-gray-500">
                  {selectedCards.length}/5 선택됨
                </div>
                
                <Button 
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={analyzeTarot}
                  disabled={selectedCards.length !== 5}
                >
                  해석하기
                </Button>
              </div>
              
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
                  {error}
                </div>
              )}
            </div>
          )}
          
          {/* 분석 중 화면 */}
          {step === 'analyzing' && (
            <div className="space-y-6 text-center">
              <p className="text-lg text-gray-600 mb-6">
                타로 카드를 해석하고 있습니다. 잠시만 기다려주세요...
              </p>
              
              <div className="flex justify-center mb-8">
                <RefreshCw className="h-12 w-12 text-orange-600 animate-spin" />
              </div>
              
              <div className="bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {selectedCards.map((cardIndex, i) => (
                    <div key={i} className="w-16 h-24 bg-purple-100 rounded-lg flex items-center justify-center">
                      <div className="text-3xl">🔮</div>
                    </div>
                  ))}
                </div>
                <p className="text-gray-500 text-sm">선택하신 카드를 바탕으로 운세를 해석 중입니다...</p>
              </div>
            </div>
          )}
          
          {/* 결과 화면 */}
          {step === 'result' && analysisResult && (
            <div className="space-y-4">
              <p className="text-lg text-gray-600 mb-2 text-center">
                타로 해석이 완료되었습니다
              </p>
              
              <div 
                ref={resultRef}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                {/* 헤더 섹션 */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
                  <h2 className="text-xl font-bold text-center">
                    타로 운세 결과
                  </h2>
                  <p className="text-center text-white/90 text-sm mt-1">
                    {concern}
                  </p>
                </div>
                
                {/* 카드 및 요약 */}
                <div className="p-4">
                  {/* 선택된 카드 표시 */}
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {selectedCards.map((cardIndex, i) => {
                      const card = majorArcanaCards[shuffledCards[cardIndex]];
                      return (
                        <div key={i} className="relative">
                          <div className="w-14 h-20 bg-purple-100 rounded-lg flex items-center justify-center">
                            <div className="text-2xl">🔮</div>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {i+1}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* 요약 */}
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-2 text-gray-700 border-b pb-1">전체 요약</h3>
                    <p className="text-sm text-gray-700 bg-purple-50 p-3 rounded-xl border border-purple-100">
                      {analysisResult.summary}
                    </p>
                  </div>
                  
                  {/* 카드별 해석 */}
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-2 text-gray-700 border-b pb-1">카드별 해석</h3>
                    <div className="space-y-3">
                      {analysisResult.cardReadings.map((reading, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {index+1}
                            </div>
                            <h4 className="font-medium text-purple-700">{reading.cardName}</h4>
                          </div>
                          <p className="text-xs text-gray-700">{reading.interpretation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* 미래 전망 */}
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-2 text-gray-700 border-b pb-1">미래 전망</h3>
                    <p className="text-sm text-gray-700 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                      {analysisResult.futurePerspective}
                    </p>
                  </div>
                  
                  {/* 행동 제안 */}
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-2 text-gray-700 border-b pb-1">행동 제안</h3>
                    <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-xl border border-blue-100">
                      {analysisResult.actionSuggestions}
                    </p>
                  </div>
                  
                  <div className="text-center text-xs text-gray-400 mt-2">
                    Ai탐구생활 - 타로 운세보기
                  </div>
                </div>
              </div>
              
              {/* 공유 버튼 */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-1 h-10 rounded-xl text-sm"
                  onClick={saveAsImage}
                >
                  <Download className="h-4 w-4" />
                  <span>저장</span>
                </Button>
                
                <div className="relative">
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-1 h-10 rounded-xl text-sm w-full"
                    onClick={() => {
                      const shareMenu = document.getElementById('shareMenu');
                      if (shareMenu) {
                        shareMenu.classList.toggle('hidden');
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                    <span>공유</span>
                  </Button>
                  
                  <div id="shareMenu" className="hidden absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <div className="p-2">
                      <button 
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 flex items-center gap-2 text-sm"
                        onClick={copyResultLink}
                      >
                        <Link2 className="h-4 w-4 text-gray-600" />
                        <span>링크 복사</span>
                        {copySuccess && <span className="text-green-600 text-xs ml-2">복사됨!</span>}
                      </button>
                      
                      <button 
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 flex items-center gap-2 text-sm"
                        onClick={shareResult}
                      >
                        <Share2 className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
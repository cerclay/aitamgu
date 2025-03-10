'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, Upload, Share2, Download, RefreshCw, Copy, Link2, MessageCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as htmlToImage from 'html-to-image';

// Gemini API 키
const API_KEY = 'AIzaSyC_Woxwt323fN5CRAHbGRrzAp10bGZMA_4';

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

export default function CalorieCalculator() {
  const [step, setStep] = useState<'intro' | 'upload' | 'analyzing' | 'result'>('intro');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'nutrition' | 'alternatives'>('nutrition');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  
  // 카메라 활성화
  const activateCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      setError('카메라에 접근할 수 없습니다. 권한을 확인해주세요.');
      console.error('카메라 접근 오류:', err);
    }
  };
  
  // 카메라로 사진 촬영
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        setSelectedImage(imageDataUrl);
        
        // 카메라 스트림 중지
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        setCameraActive(false);
        setStep('upload');
      }
    }
  };
  
  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setStep('upload');
      };
      reader.readAsDataURL(file);
    }
  };
  
  // 이미지 분석 함수
  const analyzeImage = async () => {
    if (!selectedImage) return;
    
    setIsLoading(true);
    setStep('analyzing');
    
    try {
      // Gemini API 초기화
      const genAI = new GoogleGenerativeAI(API_KEY);
      // gemini-pro-vision에서 gemini-1.5-flash로 모델 변경
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // 이미지를 base64로 변환
      const base64Image = selectedImage.split(',')[1];
      
      // 프롬프트 작성 - 음식 크기 분석 추가 및 대체 식단 정보 요청
      const prompt = `
        당신은 음식 영양 분석 전문가입니다. 이 이미지에 있는 음식을 정확히 식별하고 분석해주세요.
        
        1. 먼저 이미지에서 음식을 정확히 식별하세요.
        2. 음식의 크기와 양을 추정하세요 (예: 작은 접시, 큰 그릇, 1인분, 2인분 등).
        3. 식별된 음식과 크기를 기반으로 다음 정보를 제공해주세요:
        
        - 음식 이름
        - 추정 크기/양 (그램 단위로 추정)
        - 예상 칼로리 (kcal)
        - 영양소 분석: 탄수화물(g), 단백질(g), 지방(g)
        - 혈당 영향도 (낮음/중간/높음)
        - 다이어트 위험도 (100점 만점)
        - 건강에 미치는 영향에 대한 간략한 설명
        - 다음 대상별 대체 식단 추천 (각 대상별로 1가지씩만 간결하게):
          * 고혈당자를 위한 대체 식단
          * 저혈당자를 위한 대체 식단
          * 고혈압자를 위한 대체 식단
          * 다이어트를 위한 대체 식단
        
        컴퓨터 비전과 딥러닝 기술을 활용하여 정확한 분석을 제공해주세요.
        
        다음 JSON 형식으로 응답해주세요:
        {
          "foodName": "음식 이름",
          "portion": {
            "description": "크기 설명 (예: 중간 크기 1인분)",
            "estimatedGrams": 숫자
          },
          "calories": 숫자,
          "nutrition": {
            "carbs": 숫자,
            "protein": 숫자,
            "fat": 숫자
          },
          "glycemicImpact": "낮음/중간/높음",
          "dietRisk": 숫자,
          "healthImpact": "설명",
          "analysisConfidence": 숫자 (0-100 사이, 분석 신뢰도),
          "alternativeDiets": {
            "highBloodSugar": "대체 식단",
            "lowBloodSugar": "대체 식단",
            "highBloodPressure": "대체 식단",
            "diet": "대체 식단"
          }
        }
        
        JSON 형식만 응답하고 다른 설명은 포함하지 마세요.
      `;
      
      // 이미지 분석 요청
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image
          }
        }
      ]);
      
      const response = await result.response;
      const text = response.text();
      
      // JSON 추출 (텍스트에서 JSON 부분만 추출)
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
            // 정규식을 사용하여 JSON 형식의 데이터를 추출
            const cleanedText = text.replace(/```json|```/g, '').trim();
            const jsonData = JSON.parse(cleanedText);
            setAnalysisResult(jsonData);
            setStep('result');
          } catch (backupError) {
            console.error('백업 JSON 파싱 오류:', backupError);
            setError('결과 처리 중 오류가 발생했습니다. 다른 이미지로 다시 시도해주세요.');
            setStep('upload');
          }
        }
      } else {
        // JSON이 없는 경우 텍스트에서 정보 추출 시도
        try {
          const fallbackData = {
            foodName: "알 수 없는 음식",
            portion: {
              description: "추정 불가",
              estimatedGrams: 100
            },
            calories: 0,
            nutrition: {
              carbs: 0,
              protein: 0,
              fat: 0
            },
            glycemicImpact: "중간",
            dietRisk: 50,
            healthImpact: "이미지에서 음식을 정확히 식별할 수 없습니다. 다른 이미지로 다시 시도해주세요.",
            analysisConfidence: 0
          };
          
          // 음식 이름 추출 시도
          const foodNameMatch = text.match(/음식\s*이름[^\n]*:([^\n]+)/i);
          if (foodNameMatch && foodNameMatch[1]) {
            fallbackData.foodName = foodNameMatch[1].trim();
          }
          
          // 칼로리 추출 시도
          const caloriesMatch = text.match(/칼로리[^\n]*:([^\n]+)/i);
          if (caloriesMatch && caloriesMatch[1]) {
            const caloriesValue = parseInt(caloriesMatch[1].replace(/[^0-9]/g, ''));
            if (!isNaN(caloriesValue)) {
              fallbackData.calories = caloriesValue;
            }
          }
          
          setAnalysisResult(fallbackData);
          setStep('result');
        } catch (fallbackError) {
          console.error('대체 데이터 생성 오류:', fallbackError);
          setError('이미지 분석에 실패했습니다. 다른 이미지로 다시 시도해주세요.');
          setStep('upload');
        }
      }
    } catch (err) {
      console.error('분석 오류:', err);
      // 오류 메시지 개선
      if (err instanceof Error) {
        if (err.message.includes('deprecated')) {
          setError('Gemini API 모델이 변경되었습니다. 관리자에게 문의해주세요.');
        } else if (err.message.includes('quota')) {
          setError('API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
        } else if (err.message.includes('permission') || err.message.includes('access')) {
          setError('API 접근 권한이 없습니다. API 키를 확인해주세요.');
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          setError('네트워크 연결을 확인하고 다시 시도해주세요.');
        } else {
          setError(`이미지 분석 중 오류가 발생했습니다: ${err.message}`);
        }
      } else {
        setError('이미지 분석 중 알 수 없는 오류가 발생했습니다.');
      }
      setStep('upload');
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
        link.download = '음식_칼로리_분석.png';
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
        const file = new File([blob], '음식_칼로리_분석.png', { type: 'image/png' });
        
        await navigator.share({
          title: '음식 칼로리 분석 결과',
          text: '내 음식의 칼로리와 영양소 분석 결과입니다.',
          files: [file]
        });
      } catch (err) {
        console.error('공유 오류:', err);
        // 사용자가 공유를 취소한 경우는 오류로 처리하지 않음
        if (err instanceof Error && err.name !== 'AbortError') {
          setError('결과 공유 중 오류가 발생했습니다.');
        }
      }
    } else {
      setError('이 브라우저에서는 공유 기능을 지원하지 않습니다.');
    }
  };
  
  // 다시 시작
  const restart = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    setError(null);
    setStep('intro');
  };
  
  // 카메라 스트림 정리
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    };
  }, []);
  
  // 다이어트 위험도에 따른 색상 반환
  const getDietRiskColor = (risk: number) => {
    if (risk <= 30) return 'text-green-500';
    if (risk <= 70) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  // 혈당 영향도에 따른 색상 반환
  const getGlycemicImpactColor = (impact: string) => {
    if (impact === '낮음') return 'text-green-500';
    if (impact === '중간') return 'text-yellow-500';
    return 'text-red-500';
  };

  // 결과 링크 복사
  const copyResultLink = () => {
    // 실제 서비스에서는 고유 ID를 생성하여 결과 페이지 링크를 만들어야 함
    // 여기서는 예시로 현재 URL + 가상의 결과 ID를 사용
    const resultId = Date.now().toString(36);
    const resultLink = `${window.location.origin}/calorie-calculator/result/${resultId}`;
    
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
        // 실제 서비스에서는 카카오 개발자 센터에서 발급받은 JavaScript 키를 사용해야 함
        window.Kakao.init('YOUR_KAKAO_JAVASCRIPT_KEY');
      }
      
      // 결과 이미지 생성
      if (resultRef.current) {
        const dataUrl = await htmlToImage.toPng(resultRef.current);
        
        // 카카오 공유하기
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: `${analysisResult.foodName} 칼로리 분석 결과`,
            description: `칼로리: ${analysisResult.calories}kcal, 탄수화물: ${analysisResult.nutrition.carbs}g, 단백질: ${analysisResult.nutrition.protein}g, 지방: ${analysisResult.nutrition.fat}g`,
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

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6">
        <Link href="/" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span>홈으로 돌아가기</span>
        </Link>
        
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 text-orange-600 text-center">음식 칼로리 측정기</h1>
          
          {/* 소개 화면 */}
          {step === 'intro' && (
            <div className="space-y-6">
              <p className="text-lg text-gray-600 mb-6">
                음식 사진을 업로드하면 AI가 칼로리와 영양소를 분석해 드립니다. 건강한 식습관 관리를 위한 첫 걸음을 시작해보세요.
              </p>
              
              <div className="bg-gray-50 p-8 rounded-lg border-2 border-gray-100 mb-8">
                <h2 className="text-xl font-semibold mb-4">사용 방법</h2>
                <ol className="list-decimal list-inside space-y-3 text-gray-700">
                  <li>카메라로 음식 사진을 찍거나 갤러리에서 사진을 선택하세요.</li>
                  <li>AI가 음식을 분석하여 칼로리와 영양소 정보를 제공합니다.</li>
                  <li>분석 결과를 저장하거나 공유할 수 있습니다.</li>
                </ol>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2"
                  onClick={activateCamera}
                >
                  <Camera className="h-5 w-5" />
                  카메라로 촬영하기
                </Button>
                
                <Button 
                  className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-5 w-5" />
                  갤러리에서 선택하기
                </Button>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileSelect}
                />
              </div>
            </div>
          )}
          
          {/* 카메라 활성화 화면 */}
          {cameraActive && (
            <div className="space-y-6">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-auto"
                />
                
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <Button 
                    className="bg-orange-600 hover:bg-orange-700 rounded-full w-16 h-16 flex items-center justify-center"
                    onClick={capturePhoto}
                  >
                    <Camera className="h-8 w-8" />
                  </Button>
                </div>
              </div>
              
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  className="border-orange-600 text-orange-600 hover:bg-orange-50"
                  onClick={() => {
                    if (videoRef.current) {
                      const stream = videoRef.current.srcObject as MediaStream;
                      if (stream) {
                        stream.getTracks().forEach(track => track.stop());
                      }
                    }
                    setCameraActive(false);
                    setStep('intro');
                  }}
                >
                  취소
                </Button>
              </div>
            </div>
          )}
          
          {/* 업로드 화면 */}
          {step === 'upload' && selectedImage && (
            <div className="space-y-6">
              <p className="text-lg text-gray-600 mb-4">
                선택한 음식 사진을 분석할 준비가 되었습니다.
              </p>
              
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-100 mb-6">
                <div className="aspect-video relative rounded-lg overflow-hidden mb-6">
                  <img 
                    src={selectedImage} 
                    alt="선택한 음식" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    className="bg-orange-600 hover:bg-orange-700 flex-1"
                    onClick={analyzeImage}
                  >
                    음식 분석하기
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="border-orange-600 text-orange-600 hover:bg-orange-50 flex-1"
                    onClick={restart}
                  >
                    다시 선택하기
                  </Button>
                </div>
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
                AI가 음식을 분석하고 있습니다. 잠시만 기다려주세요...
              </p>
              
              <div className="flex justify-center mb-8">
                <RefreshCw className="h-12 w-12 text-orange-600 animate-spin" />
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-100">
                <div className="aspect-video relative rounded-lg overflow-hidden mb-6">
                  <img 
                    src={selectedImage!} 
                    alt="분석 중인 음식" 
                    className="w-full h-full object-contain opacity-50"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/80 px-6 py-3 rounded-lg">
                      <p className="text-orange-600 font-medium">음식 분석 중...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* 결과 화면 */}
          {step === 'result' && analysisResult && (
            <div className="space-y-4">
              <p className="text-lg text-gray-600 mb-2 text-center">
                음식 분석이 완료되었습니다
              </p>
              
              <div 
                ref={resultRef}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                {/* 헤더 섹션 */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white">
                  <h2 className="text-xl font-bold text-center">
                    {analysisResult.foodName}
                  </h2>
                  
                  {analysisResult.portion && (
                    <p className="text-center text-white/90 text-sm mt-1">
                      {analysisResult.portion.description} 
                      {analysisResult.portion.estimatedGrams && ` (약 ${analysisResult.portion.estimatedGrams}g)`}
                    </p>
                  )}
                </div>
                
                {/* 이미지 및 주요 정보 */}
                <div className="p-4">
                  <div className="flex flex-col items-center mb-4">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md mb-2">
                      <img 
                        src={selectedImage!} 
                        alt={analysisResult.foodName} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* 칼로리 및 다이어트 위험도 */}
                    <div className="grid grid-cols-2 gap-3 w-full mt-2">
                      <div className="bg-orange-50 p-3 rounded-xl shadow-sm border border-orange-100 text-center">
                        <p className="text-xs text-gray-500 mb-1">총 칼로리</p>
                        <p className="text-xl font-bold text-orange-600">
                          {analysisResult.calories} kcal
                        </p>
                      </div>
                      
                      <div className="bg-orange-50 p-3 rounded-xl shadow-sm border border-orange-100 text-center">
                        <p className="text-xs text-gray-500 mb-1">다이어트 위험도</p>
                        <p className={`text-xl font-bold ${getDietRiskColor(analysisResult.dietRisk)}`}>
                          {analysisResult.dietRisk}/100
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 분석 신뢰도 */}
                  {analysisResult.analysisConfidence !== undefined && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                        <span>분석 신뢰도</span>
                        <span>{analysisResult.analysisConfidence}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full" 
                          style={{ width: `${analysisResult.analysisConfidence}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {/* 영양소 분석 */}
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-2 text-gray-700 border-b pb-1">영양소 분석</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gradient-to-b from-blue-50 to-blue-100 p-3 rounded-xl shadow-sm border border-blue-200 text-center">
                        <p className="text-xs text-gray-600 mb-1">탄수화물</p>
                        <p className="font-bold text-blue-700">{analysisResult.nutrition.carbs}g</p>
                      </div>
                      
                      <div className="bg-gradient-to-b from-green-50 to-green-100 p-3 rounded-xl shadow-sm border border-green-200 text-center">
                        <p className="text-xs text-gray-600 mb-1">단백질</p>
                        <p className="font-bold text-green-700">{analysisResult.nutrition.protein}g</p>
                      </div>
                      
                      <div className="bg-gradient-to-b from-yellow-50 to-yellow-100 p-3 rounded-xl shadow-sm border border-yellow-200 text-center">
                        <p className="text-xs text-gray-600 mb-1">지방</p>
                        <p className="font-bold text-yellow-700">{analysisResult.nutrition.fat}g</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 혈당 영향도 */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-gray-700">혈당 영향도</h3>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        analysisResult.glycemicImpact === '낮음' 
                          ? 'bg-green-100 text-green-800' 
                          : analysisResult.glycemicImpact === '중간'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {analysisResult.glycemicImpact}
                      </span>
                    </div>
                  </div>
                  
                  {/* 건강 영향 */}
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-2 text-gray-700 border-b pb-1">건강 영향</h3>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-200">
                      {analysisResult.healthImpact}
                    </p>
                  </div>
                  
                  {/* 대체 식단 */}
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-2 text-gray-700 border-b pb-1">대체 식단 추천</h3>
                    <div className="space-y-2">
                      <div className="flex bg-gradient-to-r from-red-50 to-white p-2 rounded-lg border border-red-100">
                        <div className="w-24 flex-shrink-0">
                          <p className="text-xs font-medium text-red-700">고혈당자</p>
                        </div>
                        <p className="text-xs text-gray-700">
                          {typeof analysisResult.alternativeDiets?.highBloodSugar === 'string' 
                            ? analysisResult.alternativeDiets.highBloodSugar 
                            : (analysisResult.alternativeDiets?.highBloodSugar?.[0] || '추천 정보 없음')}
                        </p>
                      </div>
                      
                      <div className="flex bg-gradient-to-r from-blue-50 to-white p-2 rounded-lg border border-blue-100">
                        <div className="w-24 flex-shrink-0">
                          <p className="text-xs font-medium text-blue-700">저혈당자</p>
                        </div>
                        <p className="text-xs text-gray-700">
                          {typeof analysisResult.alternativeDiets?.lowBloodSugar === 'string' 
                            ? analysisResult.alternativeDiets.lowBloodSugar 
                            : (analysisResult.alternativeDiets?.lowBloodSugar?.[0] || '추천 정보 없음')}
                        </p>
                      </div>
                      
                      <div className="flex bg-gradient-to-r from-purple-50 to-white p-2 rounded-lg border border-purple-100">
                        <div className="w-24 flex-shrink-0">
                          <p className="text-xs font-medium text-purple-700">고혈압자</p>
                        </div>
                        <p className="text-xs text-gray-700">
                          {typeof analysisResult.alternativeDiets?.highBloodPressure === 'string' 
                            ? analysisResult.alternativeDiets.highBloodPressure 
                            : (analysisResult.alternativeDiets?.highBloodPressure?.[0] || '추천 정보 없음')}
                        </p>
                      </div>
                      
                      <div className="flex bg-gradient-to-r from-green-50 to-white p-2 rounded-lg border border-green-100">
                        <div className="w-24 flex-shrink-0">
                          <p className="text-xs font-medium text-green-700">다이어트</p>
                        </div>
                        <p className="text-xs text-gray-700">
                          {typeof analysisResult.alternativeDiets?.diet === 'string' 
                            ? analysisResult.alternativeDiets.diet 
                            : (analysisResult.alternativeDiets?.diet?.[0] || '추천 정보 없음')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 건강 TIP */}
                  <div className="bg-orange-50 p-3 rounded-xl border border-orange-200 mb-2">
                    <h4 className="text-xs font-semibold text-orange-800 mb-1">건강한 식습관 TIP</h4>
                    <p className="text-xs text-gray-700">
                      음식섭취는 <span className="font-semibold">식이섬유 → 단백질 → 탄수화물</span> 순으로 섭취하세요!
                      이 순서로 섭취하면 혈당 상승을 완화하고 포만감을 오래 유지할 수 있습니다.
                    </p>
                  </div>
                  
                  <div className="text-center text-xs text-gray-400 mt-2">
                    Ai탐구생활 - 음식 칼로리 측정기
                  </div>
                </div>
              </div>
              
              {/* 공유 버튼 */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <Button 
                  className="bg-orange-600 hover:bg-orange-700 flex items-center justify-center gap-1 h-10 rounded-xl text-sm"
                  onClick={saveAsImage}
                >
                  <Download className="h-4 w-4" />
                  <span>저장</span>
                </Button>
                
                <div className="relative">
                  <Button 
                    className="bg-orange-600 hover:bg-orange-700 flex items-center justify-center gap-1 h-10 rounded-xl text-sm w-full"
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
                        <span>기본 공유</span>
                      </button>
                      
                      <button 
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 flex items-center gap-2 text-sm"
                        onClick={shareToKakao}
                      >
                        <MessageCircle className="h-4 w-4 text-yellow-500" />
                        <span>카카오톡</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="border-orange-600 text-orange-600 hover:bg-orange-50 flex items-center justify-center gap-1 h-10 rounded-xl text-sm"
                  onClick={restart}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>다시</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
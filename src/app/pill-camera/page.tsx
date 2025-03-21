'use client';

import { useState, useRef } from 'react';
import { PillCameraCard } from '@/components/pill-camera/PillCameraCard';
import { PillResultCard } from '@/components/pill-camera/PillResultCard';
import { PillData, PillAnalysisError } from '@/types/pill';
import { Pill, Camera, ArrowLeft, Info, AlertCircle, HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

export default function PillCameraPage() {
  const router = useRouter();
  const [pillData, setPillData] = useState<PillData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [errorSuggestion, setErrorSuggestion] = useState<string | null>(null);
  const [showFullResult, setShowFullResult] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  // 오류 발생 횟수 추적
  const errorCountRef = useRef(0);

  const handlePillAnalysis = async (imageFile: File) => {
    setIsLoading(true);
    setError(null);
    setErrorDetails(null);
    setErrorSuggestion(null);
    setPillData(null);
    
    try {
      // 이미지 파일을 Base64로 변환
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      // Base64 데이터에서 실제 이미지 데이터만 추출 (data:image/jpeg;base64, 부분 제거)
      const base64Data = base64Image.split(',')[1];
      
      // 내부 API 엔드포인트 호출
      const response = await fetch('/api/pill-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Data
        }),
      });
      
      // 응답이 JSON이 아닐 경우를 대비한 에러 처리
      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error('JSON 파싱 오류:', error);
        throw new Error('알약 분석 결과를 처리할 수 없습니다. 다시 시도해주세요.');
      }
      
      // API 응답 실패 처리
      if (!response.ok || !data.success || data.resultCode !== '00') {
        // 에러 카운트 증가
        errorCountRef.current += 1;
        
        // API 에러 메시지 처리
        const errorMessage = data.error || '알약 분석 중 오류가 발생했습니다.';
        throw new Error(errorMessage);
      }
      
      // 결과 데이터 검증
      if (!data.data) {
        throw new Error('알약 정보를 찾을 수 없습니다. 다른 이미지를 시도해주세요.');
      }

      const mainResult = data.data;
      const similarItems = mainResult.similarItems || [];
      
      // 신뢰도가 낮은 경우 경고
      if (mainResult.confidence < 70) {
        setErrorSuggestion('알약 인식 신뢰도가 낮습니다. 더 선명한 이미지로 다시 시도해보세요.');
      }
      
      // 유사한 알약이 있는 경우 안내
      if (similarItems.length > 0) {
        setErrorDetails(`유사한 알약이 ${similarItems.length}개 발견되었습니다.`);
      }
      
      // 에러 카운트 초기화
      errorCountRef.current = 0;
      
      // 결과 데이터 설정
      setPillData(mainResult);
      setShowFullResult(true);
    } catch (err: any) {
      console.error('알약 분석 실패:', err);
      
      if (err.message) {
        setError(err.message);
        setErrorDetails(err.details || null);
        setErrorSuggestion(err.suggestion || '다른 각도에서 다시 촬영하거나, 조명을 밝게 하여 시도해보세요.');
      } else {
        setError('알 수 없는 오류가 발생했습니다.');
      }
      
      // 오류 발생 시 pillData 초기화
      setPillData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const closeGuide = () => {
    setShowGuide(false);
  };

  // 알약 촬영 가이드
  const renderGuide = () => (
    <motion.div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white rounded-lg max-w-md w-full p-5 max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-blue-700 flex items-center">
            <HelpCircle className="h-5 w-5 mr-2 text-blue-500" />
            알약 촬영 가이드
          </h2>
          <Button variant="ghost" size="icon" onClick={closeGuide} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">좋은 사진을 위한 팁</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>알약을 밝은 배경(흰 종이 등)에 올려놓고 촬영하세요.</li>
              <li>그림자를 줄이기 위해 충분한 조명을 확보하세요.</li>
              <li>알약이 프레임의 중앙에 위치하도록 하세요.</li>
              <li>가능한 알약에 초점을 맞추고 흔들리지 않게 촬영하세요.</li>
              <li>각인(글자나 숫자)이 보이는 면을 위로 향하게 하세요.</li>
            </ul>
          </div>
          
          <div className="border-t pt-3">
            <h3 className="font-semibold text-gray-800 mb-1">인식이 잘 되지 않을 때</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>다른 각도에서 다시 촬영해보세요.</li>
              <li>조명을 밝게 하거나 위치를 변경해보세요.</li>
              <li>알약 주변에 다른 물체가 없도록 정리하세요.</li>
              <li>카메라 렌즈가 깨끗한지 확인하세요.</li>
              <li>색상, 모양, 각인이 잘 보이는 위치에서 촬영하세요.</li>
            </ul>
          </div>
          
          <div className="pt-2">
            <Button onClick={closeGuide} className="w-full bg-blue-600">
              확인했습니다
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <AnimatePresence>
        {showGuide && renderGuide()}
      </AnimatePresence>
      
      <AnimatePresence mode="wait">
        {!showFullResult ? (
          <motion.div
            key="camera-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.3 }}
            className="container max-w-md mx-auto py-4 px-4 md:py-8 flex flex-col min-h-screen"
          >
            <header className="text-center mb-6">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, delay: 0.1 }}
                className="inline-flex items-center justify-center p-2 bg-blue-100 rounded-full mb-3"
              >
                <Pill className="h-6 w-6 text-blue-600" />
              </motion.div>
              <motion.h1 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="text-2xl font-bold mb-1 text-gray-800"
              >
                알약 카메라
              </motion.h1>
              <motion.p 
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="text-sm text-gray-600 max-w-xs mx-auto"
              >
                알약을 카메라로 촬영하거나 이미지를 업로드하면 AI가 분석하여 약 정보를 확인해드립니다.
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => setShowGuide(true)} 
                  className="text-blue-600 mt-1 text-xs font-medium"
                >
                  <HelpCircle className="h-3 w-3 mr-1" />
                  촬영 가이드 보기
                </Button>
              </motion.div>
            </header>
            
            <div className="flex-grow">
              <PillCameraCard onPillAnalysis={handlePillAnalysis} isLoading={isLoading} />
              
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 space-y-2"
                  >
                    <Alert variant="destructive" className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertDescription className="text-red-600">{error}</AlertDescription>
                    </Alert>
                    
                    {errorDetails && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-gray-600 px-3"
                      >
                        {errorDetails}
                      </motion.p>
                    )}
                    
                    {errorSuggestion && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-blue-50 p-3 rounded-md border border-blue-100"
                      >
                        <p className="text-xs text-blue-700 flex items-start">
                          <Info className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                          <span>{errorSuggestion}</span>
                        </p>
                      </motion.div>
                    )}
                    
                    {errorCountRef.current >= 2 && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-2"
                      >
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => setShowGuide(true)}
                        >
                          <HelpCircle className="h-3 w-3 mr-1" />
                          촬영 가이드 확인하기
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-auto pt-4 text-center text-xs text-gray-500"
            >
              <p>© 2023 알약 식별 서비스</p>
              <p className="mt-1 flex items-center justify-center">
                <Info className="h-3 w-3 mr-1" />
                식약처 데이터를 기반으로 작동합니다
              </p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="result-view"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="container max-w-md mx-auto py-4 px-4 md:py-8 flex flex-col min-h-screen"
          >
            <motion.header 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center mb-4"
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="mr-2" 
                onClick={() => setShowFullResult(false)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold text-gray-800">분석 결과</h1>
            </motion.header>
            
            <div className="flex-grow">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <PillResultCard 
                  pillData={pillData} 
                  isLoading={isLoading} 
                  error={error} 
                />
              </motion.div>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="mt-6 flex justify-center"
              >
                <Button 
                  onClick={() => setShowFullResult(false)}
                  variant="outline"
                  className="w-full max-w-xs"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  다른 알약 촬영하기
                </Button>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-auto pt-4 text-center text-xs text-gray-500"
            >
              <p>© 2023 알약 식별 서비스</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 
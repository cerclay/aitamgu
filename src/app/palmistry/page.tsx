'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Image as ImageIcon, Upload, ChevronRight, ChevronDown, Info, Hand, Sparkles, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { savePalmistryResult, getPalmistryResults } from './utils/storage';
import { PalmistryResult } from './types';
import PalmistryGuide from './components/PalmistryGuide';
import { motion, AnimatePresence } from 'framer-motion';
import { optimizeImage } from './utils/image';

export default function PalmistryPage() {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [results, setResults] = useState<PalmistryResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // 이전 분석 결과 불러오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedResults = getPalmistryResults();
      setResults(savedResults);
    }
  }, []);

  // 이미지 선택 처리
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      
      // 에러 메시지 초기화
      setError(null);
    }
  };

  // 카메라로 촬영
  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  // 갤러리에서 선택
  const handleGallerySelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 드래그 앤 드롭 처리
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      // 이미지 파일 확인
      if (!file.type.match('image.*')) {
        setError('이미지 파일만 업로드 가능합니다.');
        return;
      }
      
      setImage(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      
      // 에러 메시지 초기화
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // 이미지 분석 요청
  const handleAnalyze = async () => {
    if (!image) {
      setError('손금 이미지를 업로드해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 이미지 최적화 (모바일 환경 고려)
      const optimizedImage = await optimizeImage(image, 800, 0.8);
      
      // 이미지를 base64로 변환
      const reader = new FileReader();
      reader.readAsDataURL(optimizedImage);
      
      reader.onload = async () => {
        try {
          const base64Image = reader.result as string;
          
          // API 요청
          const response = await fetch('/api/analyze-palm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: base64Image }),
          });
  
          const data = await response.json();
          
          // 에러 응답 확인
          if (!response.ok && data.error) {
            throw new Error(data.error);
          }
          
          // 분석 결과 확인
          if (!data.analysis) {
            throw new Error('분석 결과를 받지 못했습니다.');
          }
          
          // 분석 실패 확인
          if (data.analysis.overall.includes('분석에 실패했습니다') || 
              data.analysis.overall.includes('분석 실패')) {
            throw new Error('손금 분석에 실패했습니다. 더 선명한 이미지로 다시 시도해주세요.');
          }
          
          // 결과 저장
          const resultId = uuidv4();
          const result: PalmistryResult = {
            id: resultId,
            imageUrl: base64Image,
            analysis: data.analysis,
            createdAt: new Date().toISOString(),
          };
          
          savePalmistryResult(result);
          
          // 결과 페이지로 이동
          router.push(`/palmistry/result/${resultId}`);
        } catch (innerError) {
          console.error('분석 처리 오류:', innerError);
          setError(innerError instanceof Error ? innerError.message : '손금 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
          setIsLoading(false);
        }
      };
      
      reader.onerror = () => {
        setError('이미지 처리 중 오류가 발생했습니다.');
        setIsLoading(false);
      };
    } catch (err) {
      console.error('분석 오류:', err);
      setError('손금 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <Hand className="text-white" size={28} />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            AI 손금 분석기
          </h1>
          <p className="text-gray-600 text-lg">
            손바닥 사진을 업로드하면 AI가 당신의 손금을 분석해드립니다
          </p>
          <p className="text-sm text-indigo-600 mt-2">
            이제 AI가 손금 선을 자동으로 감지하여 더 정확한 분석 결과를 제공합니다!
          </p>
        </motion.div>

        {/* 이미지 업로드 영역 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`bg-white rounded-xl shadow-lg p-6 mb-6 border-2 ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-dashed border-gray-300'} transition-colors`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {imagePreview ? (
            <div className="text-center">
              <div className="relative w-64 h-64 mx-auto mb-4 rounded-lg overflow-hidden">
                <img 
                  src={imagePreview} 
                  alt="손금 이미지 미리보기" 
                  className="w-full h-full object-contain"
                />
                <button 
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                  aria-label="이미지 삭제"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mb-4">손금 이미지가 선택되었습니다.</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="mb-4">
                <Upload className="h-12 w-12 text-indigo-400 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">손바닥 이미지 업로드</h3>
              <p className="text-gray-500 text-sm mb-4">
                손바닥 이미지를 드래그 앤 드롭하거나 아래 버튼을 클릭하세요
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 mb-2">
                <button
                  onClick={handleCameraCapture}
                  className="flex items-center justify-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  <span>카메라로 촬영</span>
                </button>
                <button
                  onClick={handleGallerySelect}
                  className="flex items-center justify-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  <span>갤러리에서 선택</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                선명한 손바닥 이미지를 사용할수록 더 정확한 분석이 가능합니다
              </p>
            </div>
          )}
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />
          
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleImageChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />
        </motion.div>

        {/* 분석 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !image}
            className={`px-6 py-3 rounded-lg text-white font-medium shadow-lg transition-all transform hover:scale-105 ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : image 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700' 
                  : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span>분석 중...</span>
              </div>
            ) : (
              '손금 분석하기'
            )}
          </button>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start"
            >
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{error}</p>
                <p className="text-sm mt-1">
                  더 선명한 손바닥 이미지를 사용하거나, 다른 이미지로 다시 시도해보세요.
                </p>
                <button 
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                    setError(null);
                  }}
                  className="mt-2 text-sm font-medium text-red-700 hover:text-red-800"
                >
                  다시 시도하기
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* 손금 분석 가이드 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden mb-6"
        >
          <div 
            className="p-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white flex justify-between items-center cursor-pointer"
            onClick={() => setShowGuide(!showGuide)}
          >
            <h2 className="text-xl font-semibold flex items-center">
              <Info className="mr-2" size={20} />
              손금 분석 가이드
            </h2>
            <motion.div
              animate={{ rotate: showGuide ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown size={20} />
            </motion.div>
          </div>
          
          <AnimatePresence>
            {showGuide && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4">
                  <PalmistryGuide />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 이전 분석 결과 */}
        {results.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            <div 
              className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white flex justify-between items-center cursor-pointer"
              onClick={() => setShowHistory(!showHistory)}
            >
              <h2 className="text-xl font-semibold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                이전 분석 결과
              </h2>
              <motion.div
                animate={{ rotate: showHistory ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown size={20} />
              </motion.div>
            </div>
            
            <AnimatePresence>
              {showHistory && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-3">
                    {results.map((result, index) => (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                      >
                        <a 
                          href={`/palmistry/result/${result.id}`}
                          className="flex items-center"
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 mr-3 flex-shrink-0">
                            <img 
                              src={result.imageUrl} 
                              alt="손금 이미지" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              손금 분석 결과
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(result.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <ChevronRight className="text-gray-400" size={16} />
                        </a>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
        
        {/* 푸터 */}
        <div className="text-center text-gray-500 text-xs mt-8 mb-4">
          <p>© {new Date().getFullYear()} AI 손금 분석기</p>
          <p className="mt-1">이 분석 결과는 재미로만 봐주세요!</p>
        </div>
      </div>
    </div>
  );
} 
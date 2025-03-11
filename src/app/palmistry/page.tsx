'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Image as ImageIcon, Upload, ChevronRight, ChevronDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { savePalmistryResult, getPalmistryResults } from './utils/storage';
import { PalmistryResult } from './types';
import PalmistryGuide from './components/PalmistryGuide';

export default function PalmistryPage() {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [results, setResults] = useState<PalmistryResult[]>([]);
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

  // 이미지 최적화 함수
  const optimizeImage = (file: File, maxWidth: number, quality: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // 이미지 크기 조정
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }
            
            const optimizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            resolve(optimizedFile);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Image loading error'));
      };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 py-6 px-4">
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">✋</div>
          <h1 className="text-2xl font-bold text-indigo-800 mb-1">AI 손금 분석기</h1>
          <p className="text-sm text-gray-600">
            손바닥 사진을 업로드하면 AI가 당신의 손금을 분석해드립니다
          </p>
        </div>

        {/* 이미지 업로드 영역 */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-4">
          <div 
            className="p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 flex flex-col items-center justify-center"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {imagePreview ? (
              <div className="w-full">
                <div className="relative w-full h-56 mb-3">
                  <img 
                    src={imagePreview} 
                    alt="손금 이미지" 
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    이미지 삭제
                  </button>
                  <button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
                      isLoading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {isLoading ? '분석 중...' : '손금 분석하기'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-4xl text-gray-300 mb-2">✋</div>
                <p className="text-sm text-gray-500 mb-4">
                  손바닥 사진을 업로드하거나 카메라로 촬영하세요
                </p>
                
                <div className="grid grid-cols-2 gap-3 mb-2">
                  {/* 카메라 촬영 버튼 */}
                  <button
                    onClick={handleCameraCapture}
                    className="flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    <span className="text-sm">카메라 촬영</span>
                  </button>
                  
                  {/* 갤러리 선택 버튼 */}
                  <button
                    onClick={handleGallerySelect}
                    className="flex items-center justify-center px-4 py-3 bg-white text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    <ImageIcon className="h-5 w-5 mr-2" />
                    <span className="text-sm">갤러리 선택</span>
                  </button>
                </div>
                
                <p className="text-xs text-gray-400 mt-2">
                  또는 이미지를 이 영역에 끌어다 놓으세요
                </p>
                
                {/* 숨겨진 파일 입력 */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                
                {/* 숨겨진 카메라 입력 */}
                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />
              </div>
            )}
          </div>
          
          {/* 로딩 상태 */}
          {isLoading && (
            <div className="p-4 bg-indigo-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mr-3"></div>
              <p className="text-sm text-indigo-700">손금을 분석하고 있습니다...</p>
            </div>
          )}
          
          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm">
              <p>{error}</p>
            </div>
          )}
        </div>
        
        {/* 손금 분석 가이드 토글 */}
        <div className="mb-4">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <span className="text-indigo-600 mr-2">✋</span>
              <span className="text-gray-800 font-medium">손금 분석 가이드</span>
            </div>
            {showGuide ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
          </button>
          
          {showGuide && (
            <div className="mt-2">
              <PalmistryGuide />
            </div>
          )}
        </div>
        
        {/* 최근 분석 기록 */}
        <div className="mb-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <span className="text-indigo-600 mr-2">📋</span>
              <span className="text-gray-800 font-medium">최근 분석 기록</span>
            </div>
            {showHistory ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
          </button>
          
          {showHistory && (
            <div className="mt-2 bg-white rounded-lg shadow-md overflow-hidden">
              {results.length > 0 ? (
                <div>
                  {results.slice(0, 5).map((result) => (
                    <a
                      key={result.id}
                      href={`/palmistry/result/${result.id}`}
                      className="flex items-center p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden mr-3 flex-shrink-0">
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
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-500">아직 분석 기록이 없습니다.</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 푸터 */}
        <div className="text-center text-xs text-gray-500 mt-6">
          <p>© 2024 AI 손금 분석기 | Google Gemini API 사용</p>
          <p className="mt-1">이 분석은 재미로만 봐주세요. 실제 운세나 미래를 예측하지 않습니다.</p>
        </div>
      </div>
    </div>
  );
} 
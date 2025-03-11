'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, Upload, Share2, Download, Info } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import CameraCapture from './components/CameraCapture';

interface AnalysisResult {
  foodName: string;
  calories: number;
  nutrients: {
    carbs: number;
    protein: number;
    fat: number;
    sugar: number;
    fiber: number;
    sodium: number;
  };
  healthInfo: {
    benefits: string[];
    cautions: string[];
  };
  recommendations: {
    highBloodSugar: string;
    highBloodPressure: string;
    diet: string;
    healthy: string;
  };
  servingSize: string;
  mealTiming: string[];
}

export default function CalorieCalculator() {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowGuide(false);
    analyzeImage(file);
  };

  const handleCameraCapture = (imageBlob: Blob) => {
    const file = new File([imageBlob], 'camera-capture.jpg', { type: 'image/jpeg' });
    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowCamera(false);
    setShowGuide(false);
    analyzeImage(file);
  };

  const analyzeImage = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const genAI = new GoogleGenerativeAI('AIzaSyDiyeeFnh1ewkDcSg_7jceQ23JHxBOaxhs');
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `이 음식 사진을 분석하여 정확한 JSON 형식으로만 응답해주세요. 다른 설명이나 텍스트는 포함하지 말고 오직 JSON만 응답해주세요.

필요한 JSON 형식:
{
  "foodName": "음식의 정확한 이름",
  "calories": 칼로리(숫자),
  "servingSize": "1인분 기준 그램 수",
  "nutrients": {
    "carbs": 탄수화물(g),
    "protein": 단백질(g),
    "fat": 지방(g),
    "sugar": 당류(g),
    "fiber": 식이섬유(g),
    "sodium": 나트륨(mg)
  },
  "healthInfo": {
    "benefits": [
      "이 음식의 건강상 이점 3가지"
    ],
    "cautions": [
      "섭취 시 주의사항 2가지"
    ]
  },
  "recommendations": {
    "highBloodSugar": "고혈당자를 위한 대체 음식과 조리법 추천",
    "highBloodPressure": "고혈압자를 위한 대체 음식과 조리법 추천",
    "diet": "다이어트 중인 사람을 위한 대체 음식과 조리법 추천",
    "healthy": "건강식을 원하는 사람을 위한 대체 음식과 조리법 추천"
  },
  "mealTiming": [
    "이 음식을 섭취하기 가장 좋은 시간대 2가지"
  ]
}

중요: 응답은 반드시 위의 JSON 형식만 포함해야 합니다. 다른 설명이나 텍스트는 포함하지 마세요. 모든 필드를 포함하고, 숫자 값은 따옴표 없이 숫자로 표기하세요.`;

      // 이미지를 base64로 변환
      const reader = new FileReader();
      const imageDataPromise = new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });

      const imageData = await imageDataPromise;
      const base64Image = (imageData as string).split(',')[1];

      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: file.type,
                data: base64Image
              }
            }
          ]
        }]
      });

      const response = await result.response;
      const text = response.text();
      
      try {
        // 다양한 방식으로 JSON 추출 시도
        let jsonData;
        
        // 방법 1: 정규식으로 중괄호로 둘러싸인 부분 추출
        const jsonMatch = text.match(/{[\s\S]*}/);
        if (jsonMatch) {
          try {
            jsonData = JSON.parse(jsonMatch[0]);
          } catch (e) {
            console.log('정규식 추출 후 파싱 실패:', e);
          }
        }
        
        // 방법 2: 코드 블록 내부 추출 시도
        if (!jsonData) {
          const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (codeBlockMatch && codeBlockMatch[1]) {
            try {
              jsonData = JSON.parse(codeBlockMatch[1]);
            } catch (e) {
              console.log('코드 블록 추출 후 파싱 실패:', e);
            }
          }
        }
        
        // 방법 3: 전체 텍스트를 JSON으로 파싱 시도
        if (!jsonData) {
          try {
            jsonData = JSON.parse(text);
          } catch (e) {
            console.log('전체 텍스트 파싱 실패:', e);
          }
        }
        
        // 방법 4: 수동으로 JSON 형식 찾기
        if (!jsonData) {
          const startIndex = text.indexOf('{');
          const endIndex = text.lastIndexOf('}');
          if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            const jsonStr = text.substring(startIndex, endIndex + 1);
            try {
              jsonData = JSON.parse(jsonStr);
            } catch (e) {
              console.log('수동 추출 후 파싱 실패:', e);
            }
          }
        }
        
        if (!jsonData) {
          console.error('JSON 추출 실패. 원본 응답:', text);
          throw new Error('음식을 인식하지 못했습니다. 더 선명한 이미지로 다시 시도해주세요.');
        }
        
        // 필수 필드 검증
        if (!jsonData.foodName || !jsonData.calories || !jsonData.nutrients) {
          throw new Error('음식 분석이 불완전합니다. 다른 각도에서 촬영한 이미지로 다시 시도해주세요.');
        }
        
        // 누락된 필드 기본값 설정
        if (!jsonData.healthInfo) jsonData.healthInfo = { benefits: [], cautions: [] };
        if (!jsonData.healthInfo.benefits) jsonData.healthInfo.benefits = [];
        if (!jsonData.healthInfo.cautions) jsonData.healthInfo.cautions = [];
        if (!jsonData.recommendations) jsonData.recommendations = { 
          highBloodSugar: '', highBloodPressure: '', diet: '', healthy: '' 
        };
        if (!jsonData.mealTiming) jsonData.mealTiming = [];
        if (!jsonData.servingSize) jsonData.servingSize = '1인분';
        
        setResult(jsonData);
      } catch (parseError) {
        console.error('JSON 파싱 에러:', parseError);
        setError(parseError instanceof Error ? parseError.message : '분석 결과를 처리하는 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('이미지 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!result) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'AI 칼로리 분석 결과',
          text: `음식: ${result.foodName}\n칼로리: ${result.calories}kcal\n영양성분:\n- 탄수화물: ${result.nutrients.carbs}g\n- 단백질: ${result.nutrients.protein}g\n- 지방: ${result.nutrients.fat}g\n- 당류: ${result.nutrients.sugar}g`,
          url: window.location.href
        });
      } else {
        setError('공유 기능을 사용할 수 없습니다.');
      }
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const handleDownload = async () => {
    if (!result || !previewUrl) return;

    try {
      // 결과를 포함한 이미지 생성
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 원본 이미지 로드
      const img = new Image();
      img.src = previewUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // 캔버스 크기 설정
      canvas.width = img.width;
      canvas.height = img.height + 400; // 결과 표시를 위한 추가 공간

      // 배경 그리기
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 이미지 그리기
      ctx.drawImage(img, 0, 0);

      // 결과 텍스트 그리기
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`${result.foodName} - ${result.calories}kcal`, 20, img.height + 40);

      ctx.font = '20px Arial';
      ctx.fillText(`탄수화물: ${result.nutrients.carbs}g`, 20, img.height + 80);
      ctx.fillText(`단백질: ${result.nutrients.protein}g`, 20, img.height + 120);
      ctx.fillText(`지방: ${result.nutrients.fat}g`, 20, img.height + 160);
      ctx.fillText(`당류: ${result.nutrients.sugar}g`, 20, img.height + 200);

      // 이미지로 변환하여 다운로드
      const link = document.createElement('a');
      link.download = `${result.foodName}-분석결과.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download error:', err);
      setError('이미지 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
      
      <div className="max-w-md mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span>홈으로</span>
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            AI 칼로리 계산기
          </h1>
        </div>

        {/* 가이드 */}
        {showGuide && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 transform transition-all hover:scale-[1.02]">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-100 p-2 rounded-xl">
                <Info className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                사용 방법
              </h2>
            </div>
            <div className="space-y-4 text-gray-600">
              <p className="leading-relaxed">
                AI 칼로리 계산기는 음식 사진을 분석하여 상세한 영양 정보와 맞춤형 건강 조언을 제공합니다.
              </p>
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5">
                <h3 className="font-medium text-indigo-900 mb-3">주요 기능</h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-600">1</span>
                    </div>
                    <span>정확한 칼로리와 영양소 분석</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600">2</span>
                    </div>
                    <span>건강 상태별 맞춤 추천</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-pink-600">3</span>
                    </div>
                    <span>최적의 섭취 시간 안내</span>
                  </li>
                </ul>
              </div>
              <p className="text-sm text-gray-500 italic">
                카메라로 음식을 촬영하거나 갤러리에서 사진을 선택하여 시작하세요.
              </p>
            </div>
          </div>
        )}

        {/* 이미지 업로드 영역 */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 transform transition-all hover:scale-[1.02]">
          {!previewUrl ? (
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setShowCamera(true)}
                className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] hover:shadow-lg"
              >
                <Camera className="w-5 h-5" />
                <span className="font-medium">카메라로 촬영하기</span>
              </button>
              <label className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 rounded-xl cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-all transform hover:scale-[1.02] hover:shadow-md">
                <Upload className="w-5 h-5" />
                <span className="font-medium">갤러리에서 선택하기</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                />
              </label>
            </div>
          ) : (
            <div className="relative group">
              <img
                src={previewUrl}
                alt="Selected food"
                className="w-full h-64 object-cover rounded-xl transition-transform transform group-hover:scale-[1.02]"
              />
              <button
                onClick={() => {
                  setImage(null);
                  setPreviewUrl(null);
                  setResult(null);
                  setShowGuide(true);
                }}
                className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white/100 transition-all transform hover:scale-110"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-100 animate-spin"></div>
                <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-t-4 border-indigo-600 animate-spin"></div>
              </div>
              <p className="text-gray-600 mt-4 animate-pulse">AI가 음식을 분석하고 있습니다...</p>
            </div>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start">
            <div className="text-red-600 mr-3 mt-0.5">
              <Info size={18} />
            </div>
            <div>
              <p className="text-red-700 font-medium mb-1">분석 오류</p>
              <p className="text-red-600 text-sm">{error}</p>
              <p className="text-xs text-gray-500 mt-2">
                • 음식이 잘 보이는 선명한 이미지를 사용해보세요<br />
                • 다른 각도에서 촬영해보세요<br />
                • 조명이 밝은 환경에서 촬영해보세요
              </p>
            </div>
          </div>
        )}

        {/* 분석 결과 */}
        {result && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="border-b border-gray-200 pb-4 mb-6">
              <h2 className="text-xl font-bold text-gray-900">{result.foodName}</h2>
              <p className="text-sm text-gray-500 mt-1">1인분 기준: {result.servingSize}</p>
            </div>
            
            {/* 칼로리 및 영양성분 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-indigo-50 rounded-xl p-4">
                <div className="text-sm text-gray-600">칼로리</div>
                <div className="text-2xl font-bold text-indigo-600">{result.calories}kcal</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <div className="text-sm text-gray-600">탄수화물</div>
                <div className="text-2xl font-bold text-green-600">{result.nutrients.carbs}g</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="text-sm text-gray-600">단백질</div>
                <div className="text-2xl font-bold text-blue-600">{result.nutrients.protein}g</div>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4">
                <div className="text-sm text-gray-600">지방</div>
                <div className="text-2xl font-bold text-yellow-600">{result.nutrients.fat}g</div>
              </div>
            </div>

            {/* 상세 영양정보 */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">상세 영양정보</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">당류</span>
                  <span className="float-right font-medium">{result.nutrients.sugar}g</span>
                </div>
                <div>
                  <span className="text-gray-600">식이섬유</span>
                  <span className="float-right font-medium">{result.nutrients.fiber}g</span>
                </div>
                <div>
                  <span className="text-gray-600">나트륨</span>
                  <span className="float-right font-medium">{result.nutrients.sodium}mg</span>
                </div>
              </div>
            </div>

            {/* 건강 정보 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">건강 정보</h3>
              <div className="space-y-4">
                <div className="bg-green-50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-green-800 mb-2">건강상 이점</h4>
                  <ul className="space-y-2">
                    {result.healthInfo.benefits.map((benefit, index) => (
                      <li key={index} className="text-gray-600 flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-amber-800 mb-2">섭취 시 주의사항</h4>
                  <ul className="space-y-2">
                    {result.healthInfo.cautions.map((caution, index) => (
                      <li key={index} className="text-gray-600 flex items-start gap-2">
                        <span className="text-amber-500 mt-1">•</span>
                        {caution}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 섭취 시간 */}
            <div className="bg-indigo-50 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-medium text-indigo-900 mb-2">최적 섭취 시간</h3>
              <ul className="space-y-2">
                {result.mealTiming.map((timing, index) => (
                  <li key={index} className="text-gray-600 flex items-start gap-2">
                    <span className="text-indigo-500 mt-1">•</span>
                    {timing}
                  </li>
                ))}
              </ul>
            </div>

            {/* 맞춤 추천 */}
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900">맞춤 추천</h3>
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">고혈당자 추천</h4>
                <p className="text-gray-600">{result.recommendations.highBloodSugar}</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-purple-800 mb-2">고혈압자 추천</h4>
                <p className="text-gray-600">{result.recommendations.highBloodPressure}</p>
              </div>
              <div className="bg-pink-50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-pink-800 mb-2">다이어트 추천</h4>
                <p className="text-gray-600">{result.recommendations.diet}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-emerald-800 mb-2">건강식 추천</h4>
                <p className="text-gray-600">{result.recommendations.healthy}</p>
              </div>
            </div>

            {/* 공유 버튼 */}
            <div className="flex gap-4">
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span>공유하기</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>저장하기</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
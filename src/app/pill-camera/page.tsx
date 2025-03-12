'use client';

import { useState } from 'react';
import { PillCameraCard } from '@/components/pill-camera/PillCameraCard';
import { PillResultCard } from '@/components/pill-camera/PillResultCard';
import { PillData } from '@/types/pill';
import { Pill, Camera, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PillCameraPage() {
  const [pillData, setPillData] = useState<PillData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePillAnalysis = async (imageFile: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 이미지 파일을 FormData에 추가
      const formData = new FormData();
      formData.append('image', imageFile);
      
      // 서버에 이미지 분석 요청
      const response = await fetch('/api/pill-analysis', {
        method: 'POST',
        body: formData,
      });
      
      // 응답 텍스트 먼저 확인
      const responseText = await response.text();
      
      // JSON으로 파싱 시도
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        console.error('JSON 파싱 오류:', error, '응답 텍스트:', responseText.substring(0, 200));
        throw new Error('알약 분석 결과를 처리할 수 없습니다. 다시 시도해주세요.');
      }
      
      if (!response.ok) {
        throw new Error(data.error || '알약 분석 중 오류가 발생했습니다.');
      }
      
      // 결과가 비어있는지 확인
      if (!data || Object.keys(data).length === 0) {
        throw new Error('알약 정보를 찾을 수 없습니다. 다른 이미지를 시도해주세요.');
      }
      
      setPillData(data);
    } catch (err) {
      console.error('알약 분석 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      // 오류 발생 시 pillData 초기화
      setPillData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center p-2 bg-blue-100 rounded-full mb-4">
            <Pill className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-800">알약 카메라</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            알약을 카메라로 촬영하거나 이미지를 업로드하면 AI가 분석하여 약 정보를 확인해드립니다.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <PillCameraCard onPillAnalysis={handlePillAnalysis} isLoading={isLoading} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <PillResultCard 
              pillData={pillData} 
              isLoading={isLoading} 
              error={error} 
            />
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 text-center text-sm text-gray-500"
        >
          <p>
            <span className="inline-flex items-center text-blue-600 font-medium">
              <Sparkles className="h-4 w-4 mr-1" />
              AI 기반 알약 인식 기술
            </span>
          </p>
          <p className="mt-2">
            본 서비스는 식품의약품안전처 의약품 데이터베이스를 기반으로 정보를 제공합니다.
            <br />
            정확한 의약품 정보는 의사나 약사에게 문의하시기 바랍니다.
          </p>
        </motion.div>
      </div>
    </div>
  );
} 
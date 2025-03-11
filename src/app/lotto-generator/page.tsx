'use client';

import { useState, useEffect } from 'react';
import RecommendationCard from './components/RecommendationCard';
import NumberDisplay from './components/NumberDisplay';
import WinningStats from './components/WinningStats';
import { generateLottoNumbers } from './utils/numberGenerator';
import { RECOMMENDATION_OPTIONS } from './constants';
import { motion } from 'framer-motion';

export default function LottoGenerator() {
  const [selectedNumbers, setSelectedNumbers] = useState<number[][]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (selectedNumbers.length > 0) {
      setShowResults(true);
    }
  }, [selectedNumbers]);

  const handleGenerateNumbers = async (optionId: string) => {
    setIsGenerating(true);
    try {
      const numbers = await generateLottoNumbers(optionId);
      setSelectedNumbers(numbers);
      setSelectedMethod(optionId);
    } catch (error) {
      console.error('번호 생성 중 오류 발생:', error);
    }
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 py-6 px-4">
      <div className="max-w-md mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            AI 로또 번호 생성기
          </h1>
          <p className="text-gray-600">
            AI가 분석한 다양한 방식의 번호를 생성해보세요
          </p>
        </motion.div>

        {/* 번호 추천 방식 선택 */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, staggerChildren: 0.1 }}
          className="space-y-3 mb-6"
        >
          {RECOMMENDATION_OPTIONS.map((option) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <RecommendationCard
                option={option}
                onSelect={handleGenerateNumbers}
                isSelected={selectedMethod === option.id}
                isGenerating={isGenerating}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* 생성된 번호 표시 */}
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-5 mb-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="bg-indigo-100 text-indigo-600 p-1 rounded-full mr-2">🎲</span>
              생성된 번호
            </h2>
            <div className="space-y-4">
              {selectedNumbers.map((numbers, index) => (
                <NumberDisplay
                  key={`number-set-${index}`}
                  numbers={numbers}
                  label={`${index + 1}세트`}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* 당첨 통계 */}
        <WinningStats />
      </div>
    </div>
  );
} 
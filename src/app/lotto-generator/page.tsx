'use client';

import { useState } from 'react';
import RecommendationCard from './components/RecommendationCard';
import NumberDisplay from './components/NumberDisplay';
import WinningStats from './components/WinningStats';
import { generateLottoNumbers } from './utils/numberGenerator';
import { RECOMMENDATION_OPTIONS } from './constants';

export default function LottoGenerator() {
  const [selectedNumbers, setSelectedNumbers] = useState<number[][]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-800 mb-2">
            AI 로또 번호 생성기
          </h1>
          <p className="text-gray-600">
            다양한 방식으로 로또 번호를 생성해보세요
          </p>
        </div>

        {/* 번호 추천 방식 선택 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {RECOMMENDATION_OPTIONS.map((option) => (
            <RecommendationCard
              key={option.id}
              option={option}
              onSelect={handleGenerateNumbers}
              isSelected={selectedMethod === option.id}
              isGenerating={isGenerating}
            />
          ))}
        </div>

        {/* 생성된 번호 표시 */}
        {selectedNumbers.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              생성된 번호
            </h2>
            <div className="space-y-4">
              {selectedNumbers.map((numbers, index) => (
                <NumberDisplay
                  key={index}
                  numbers={numbers}
                  label={`${index + 1}세트`}
                />
              ))}
            </div>
          </div>
        )}

        {/* 당첨 통계 */}
        <WinningStats />
      </div>
    </div>
  );
} 
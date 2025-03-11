'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import RecommendationOptions from './components/RecommendationOptions';
import NumberDisplay from './components/NumberDisplay';
import AlgorithmExplanation from './components/AlgorithmExplanation';
import WinningStats from './components/WinningStats';
import { generateLottoNumbers } from './utils/numberGenerator';
import { RecommendationOption } from './types';

// 추천 방식 옵션 정의
export const RECOMMENDATION_OPTIONS: RecommendationOption[] = [
  { 
    id: 'recent-missing', 
    name: '최근 미출현 번호', 
    description: '최근 50회 동안 나오지 않은 번호 중에서 추천',
    icon: '📊'
  },
  { 
    id: 'most-frequent', 
    name: '최근 가장 자주 나온 번호', 
    description: '최근 50회 동안 가장 많이 나온 번호 중에서 추천',
    icon: '📈'
  },
  { 
    id: 'pattern-analysis', 
    name: '최근 번호 패턴 분석 추천', 
    description: '특정 패턴(연속된 번호, 끝자리 같은 번호 등)을 분석하여 추천',
    icon: '🔄'
  },
  { 
    id: 'ai-recommendation', 
    name: 'AI 기반 추천', 
    description: '인공지능이 분석한 패턴을 기반으로 번호 추천',
    icon: '🤖'
  },
  { 
    id: 'all-options', 
    name: '전부 하나씩 추천', 
    description: '위 4가지의 옵션의 번호를 한번씩 모두 추천',
    icon: '🎲'
  }
];

export default function LottoGenerator() {
  const [selectedOption, setSelectedOption] = useState('');
  const [recommendedNumbers, setRecommendedNumbers] = useState<number[][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleOptionChange = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const getRecommendation = async () => {
    if (!selectedOption) return;
    
    setIsLoading(true);
    try {
      const numbers = await generateLottoNumbers(selectedOption);
      setRecommendedNumbers(numbers);
    } catch (error) {
      console.error('번호 생성 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    const textToCopy = recommendedNumbers
      .map((game, index) => `게임 ${index + 1}: ${game.join(', ')}`)
      .join('\n');
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* 홈으로 돌아가기 버튼 */}
        <div className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 transition-colors font-medium"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            <span>홈으로 돌아가기</span>
          </Link>
        </div>

        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-indigo-800 mb-4">행운의 로또 번호 추천</h1>
          <p className="text-lg text-gray-600">AI와 통계 분석으로 당신의 행운을 찾아보세요!</p>
        </div>

        {/* 추천 방식 선택 */}
        <RecommendationOptions
          options={RECOMMENDATION_OPTIONS}
          selectedOption={selectedOption}
          onOptionChange={handleOptionChange}
          onGetRecommendation={getRecommendation}
          isLoading={isLoading}
        />

        {/* 추천 번호 표시 */}
        {recommendedNumbers.length > 0 && (
          <NumberDisplay
            numbers={recommendedNumbers}
            onCopy={copyToClipboard}
            copied={copied}
            onRegenerate={getRecommendation}
          />
        )}

        {/* 당첨 통계 */}
        <WinningStats />

        {/* 알고리즘 설명 */}
        <AlgorithmExplanation />
      </div>
    </div>
  );
} 
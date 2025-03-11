'use client';

import { useState } from 'react';
import { RecommendationOption } from '../types';
import { motion } from 'framer-motion';

interface RecommendationCardProps {
  option: RecommendationOption;
  onSelect: (id: string) => void;
  isSelected: boolean;
  isGenerating: boolean;
}

export default function RecommendationCard({
  option,
  onSelect,
  isSelected,
  isGenerating
}: RecommendationCardProps) {
  const [showInfo, setShowInfo] = useState(false);

  const handleClick = () => {
    if (isGenerating) return;
    
    if (isSelected) {
      setShowInfo(!showInfo);
    } else {
      onSelect(option.id);
      setShowInfo(true);
    }
  };

  return (
    <div className="w-full">
      <motion.button
        onClick={handleClick}
        disabled={isGenerating}
        whileTap={{ scale: 0.98 }}
        className={`w-full p-5 rounded-2xl shadow-md transition-all ${
          isSelected
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
            : 'bg-white hover:bg-gray-50'
        } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center">
          <div className="text-3xl mr-3 bg-white bg-opacity-20 w-12 h-12 flex items-center justify-center rounded-full">
            {option.icon}
          </div>
          <div className="text-left">
            <h3 className={`font-bold ${isSelected ? 'text-white' : 'text-gray-800'} text-lg`}>
              {option.title}
            </h3>
            <p className={`text-sm ${isSelected ? 'text-white text-opacity-90' : 'text-gray-600'}`}>
              {option.description}
            </p>
          </div>
        </div>
      </motion.button>
      
      {isSelected && showInfo && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-xl shadow-md p-4 mt-2"
        >
          <h4 className="font-semibold text-indigo-700 mb-2">번호 생성 방식</h4>
          <p className="text-gray-700 text-sm mb-3">
            {option.id === 'frequency' && '최근 당첨 번호에서 자주 등장한 번호들을 분석하여 통계적으로 높은 확률을 가진 번호들을 조합합니다.'}
            {option.id === 'pattern' && '최근 당첨 번호들의 패턴(홀짝 비율, 번호 간격, 합계 등)을 분석하여 유사한 패턴을 가진 번호 조합을 생성합니다.'}
            {option.id === 'cold' && '장기간 당첨되지 않은 번호들은 확률적으로 다음 회차에 등장할 가능성이 높다는 이론을 바탕으로 번호를 조합합니다.'}
            {option.id === 'prediction' && '과거 당첨 번호의 통계와 패턴을 AI가 분석하여 다음 회차에 나올 가능성이 높은 번호들을 예측합니다.'}
            {option.id === 'all' && '모든 분석 방법(출현 빈도, 패턴, 미출현 기간, 예측)을 종합적으로 고려하여 가장 균형 잡힌 번호 조합을 생성합니다.'}
          </p>
          <div className="text-xs text-gray-500 italic">
            * 이 방식은 단순 참고용이며, 실제 당첨을 보장하지 않습니다.
          </div>
        </motion.div>
      )}
    </div>
  );
} 
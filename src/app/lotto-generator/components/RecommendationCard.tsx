'use client';

import { useState } from 'react';
import { RecommendationOption } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Check, Loader2, ArrowRight } from 'lucide-react';

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

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInfo(!showInfo);
  };

  return (
    <div className="w-full">
      <motion.div
        whileHover={{ scale: isGenerating ? 1 : 1.03 }}
        whileTap={{ scale: isGenerating ? 1 : 0.98 }}
        className="relative"
      >
        <motion.div
          onClick={handleClick}
          className={`w-full p-5 rounded-2xl shadow-md transition-all duration-300 ${
            isSelected
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-2 border-indigo-300'
              : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-indigo-300'
          } ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          role="button"
          tabIndex={0}
          aria-disabled={isGenerating}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
        >
          <div className="flex items-center">
            <div className={`text-3xl mr-3 ${isSelected ? 'bg-white bg-opacity-20' : 'bg-indigo-100'} w-12 h-12 flex items-center justify-center rounded-full transition-colors`}>
              {option.icon}
            </div>
            <div className="text-left flex-1">
              <h3 className={`font-bold ${isSelected ? 'text-white' : 'text-gray-800'} text-lg`}>
                {option.title}
              </h3>
              <p className={`text-sm ${isSelected ? 'text-white text-opacity-90' : 'text-gray-600'}`}>
                {option.description}
              </p>
            </div>
            <div className="ml-2">
              {isSelected ? (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, 10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="bg-white bg-opacity-20 p-1.5 rounded-full"
                >
                  <Check size={18} className="text-white" />
                </motion.div>
              ) : (
                <div className="flex items-center">
                  <motion.div
                    onClick={handleInfoClick}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-gray-400 hover:text-indigo-500 p-1.5 rounded-full hover:bg-indigo-50 transition-colors cursor-pointer mr-1"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleInfoClick(e as unknown as React.MouseEvent);
                      }
                    }}
                  >
                    <Info size={18} />
                  </motion.div>
                  <motion.div
                    whileHover={{ x: 3 }}
                    className="text-indigo-500 p-1"
                  >
                    <ArrowRight size={18} />
                  </motion.div>
                </div>
              )}
            </div>
          </div>
          
          {isGenerating && isSelected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-2xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 size={30} className="text-white" />
              </motion.div>
            </div>
          )}
        </motion.div>
      </motion.div>
      
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-md p-4 mt-2 overflow-hidden border-l-4 border-indigo-500"
          >
            <h4 className="font-semibold text-indigo-700 mb-2 flex items-center">
              <Info size={16} className="mr-1" />
              번호 생성 방식
            </h4>
            <p className="text-gray-700 text-sm mb-3">
              {option.id === 'frequency' && '최근 당첨 번호에서 자주 등장한 번호들을 분석하여 통계적으로 높은 확률을 가진 번호들을 조합합니다.'}
              {option.id === 'pattern' && '최근 당첨 번호들의 패턴(홀짝 비율, 번호 간격, 합계 등)을 분석하여 유사한 패턴을 가진 번호 조합을 생성합니다.'}
              {option.id === 'cold' && '장기간 당첨되지 않은 번호들은 확률적으로 다음 회차에 등장할 가능성이 높다는 이론을 바탕으로 번호를 조합합니다.'}
              {option.id === 'prediction' && '과거 당첨 번호의 통계와 패턴을 AI가 분석하여 다음 회차에 나올 가능성이 높은 번호들을 예측합니다.'}
              {option.id === 'all' && '모든 분석 방법(출현 빈도, 패턴, 미출현 기간, 예측)을 종합적으로 고려하여 가장 균형 잡힌 번호 조합을 생성합니다.'}
            </p>
            <div className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded">
              * 이 방식은 단순 참고용이며, 실제 당첨을 보장하지 않습니다.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 
'use client';

import { RecommendationOption } from '../types';
import { motion } from 'framer-motion';

interface RecommendationOptionsProps {
  options: RecommendationOption[];
  selectedOption: string;
  onOptionChange: (id: string) => void;
  onGetRecommendation: () => void;
  isLoading: boolean;
}

export default function RecommendationOptions({
  options,
  selectedOption,
  onOptionChange,
  onGetRecommendation,
  isLoading
}: RecommendationOptionsProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">추천 방식 선택</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {options.map((option) => (
          <motion.div
            key={option.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedOption === option.id 
                ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
            }`}
            onClick={() => onOptionChange(option.id)}
          >
            <div className="flex items-center mb-2">
              <div 
                className={`w-4 h-4 rounded-full mr-2 border ${
                  selectedOption === option.id 
                    ? 'border-indigo-500 bg-indigo-500' 
                    : 'border-gray-400'
                }`}
              />
              <div className="flex items-center gap-2">
                <span className="text-xl">{option.icon}</span>
                <h3 className="font-semibold text-gray-800">{option.name}</h3>
              </div>
            </div>
            <p className="text-sm text-gray-600">{option.description}</p>
          </motion.div>
        ))}
      </div>
      
      <button
        onClick={onGetRecommendation}
        disabled={!selectedOption || isLoading}
        className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-all ${
          !selectedOption || isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            번호 생성 중...
          </div>
        ) : "번호 추천 받기"}
      </button>
    </div>
  );
} 
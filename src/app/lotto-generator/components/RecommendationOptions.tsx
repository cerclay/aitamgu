'use client';

import { RecommendationOption } from '../types';
import { Button } from '@/components/ui/button';

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((option) => (
          <div
            key={option.id}
            className={`p-4 rounded-xl cursor-pointer transition-all ${
              selectedOption === option.id
                ? 'bg-indigo-100 border-2 border-indigo-500'
                : 'bg-white hover:bg-gray-50 border-2 border-transparent'
            }`}
            onClick={() => onOptionChange(option.id)}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{option.icon}</span>
              <h3 className="font-semibold text-gray-800">{option.title}</h3>
            </div>
            <p className="text-sm text-gray-600">{option.description}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded-lg"
          onClick={onGetRecommendation}
          disabled={!selectedOption || isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>번호 생성 중...</span>
            </div>
          ) : (
            '번호 생성하기'
          )}
        </Button>
      </div>
    </div>
  );
} 
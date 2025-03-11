import { RecommendationOption } from '../types';

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
  return (
    <button
      onClick={() => onSelect(option.id)}
      disabled={isGenerating}
      className={`p-4 rounded-xl shadow-md transition-all ${
        isSelected
          ? 'bg-indigo-100 border-2 border-indigo-500'
          : 'bg-white hover:bg-gray-50'
      } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="text-3xl mb-2">{option.icon}</div>
      <h3 className="font-semibold text-gray-800 mb-1">{option.title}</h3>
      <p className="text-sm text-gray-600">{option.description}</p>
    </button>
  );
} 
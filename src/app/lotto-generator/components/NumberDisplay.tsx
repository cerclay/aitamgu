'use client';

import { motion } from 'framer-motion';
import { Copy, RefreshCw } from 'lucide-react';

interface NumberDisplayProps {
  numbers: number[][];
  onCopy: () => void;
  copied: boolean;
  onRegenerate: () => void;
}

export default function NumberDisplay({
  numbers,
  onCopy,
  copied,
  onRegenerate
}: NumberDisplayProps) {
  const getNumberColor = (number: number) => {
    if (number <= 10) return 'bg-yellow-500';
    if (number <= 20) return 'bg-blue-500';
    if (number <= 30) return 'bg-red-500';
    if (number <= 40) return 'bg-gray-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8 animate-fadeIn">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">추천 번호</h2>
        <button 
          onClick={onCopy}
          className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          <Copy className="h-4 w-4" />
          <span>{copied ? "복사됨!" : "모두 복사"}</span>
        </button>
      </div>
      
      <div className="space-y-4">
        {numbers.map((game, gameIndex) => (
          <div key={gameIndex} className="p-4 border border-gray-200 rounded-lg">
            <div className="text-gray-500 mb-2">게임 {gameIndex + 1}</div>
            <div className="flex flex-wrap gap-2">
              {game.map((number, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`w-12 h-12 flex items-center justify-center rounded-full font-bold text-white shadow-md ${getNumberColor(number)}`}
                >
                  {number}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={onRegenerate}
          className="flex items-center gap-2 py-2 px-6 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>다시 추천받기</span>
        </button>
      </div>
    </div>
  );
} 
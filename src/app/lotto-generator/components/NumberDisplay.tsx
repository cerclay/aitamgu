'use client';

import { motion } from 'framer-motion';
import { Copy, Share2 } from 'lucide-react';
import { useState } from 'react';

interface NumberDisplayProps {
  numbers: number[];
  label: string;
}

export default function NumberDisplay({ numbers, label }: NumberDisplayProps) {
  const [copied, setCopied] = useState(false);

  const getNumberColor = (number: number) => {
    if (number <= 10) return 'bg-yellow-500 text-yellow-900';
    if (number <= 20) return 'bg-blue-500 text-white';
    if (number <= 30) return 'bg-red-500 text-white';
    if (number <= 40) return 'bg-gray-600 text-white';
    return 'bg-green-500 text-white';
  };

  const handleCopy = () => {
    const text = numbers.join(', ');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI 로또 번호 추천',
          text: `AI가 추천한 로또 번호: ${numbers.join(', ')}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('공유 실패:', error);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">{label}</span>
        <div className="flex space-x-2">
          <button 
            onClick={handleCopy} 
            className="text-gray-500 hover:text-indigo-600 transition-colors p-1 rounded-full hover:bg-indigo-50"
            title="번호 복사"
          >
            <Copy size={16} />
            {copied && (
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded">
                복사됨!
              </span>
            )}
          </button>
          <button 
            onClick={handleShare} 
            className="text-gray-500 hover:text-indigo-600 transition-colors p-1 rounded-full hover:bg-indigo-50"
            title="번호 공유"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>
      <div className="flex justify-between gap-1">
        {numbers.map((number, index) => (
          <motion.div
            key={`number-${index}-${number}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
            className={`w-10 h-10 rounded-full ${getNumberColor(number)} flex items-center justify-center shadow-sm`}
          >
            <span className="text-sm font-bold">
              {number}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
} 
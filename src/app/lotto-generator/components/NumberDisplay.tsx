'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Share2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NumberDisplayProps {
  numbers: number[];
  label: string;
}

export default function NumberDisplay({ numbers, label }: NumberDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [visibleNumbers, setVisibleNumbers] = useState<number[]>([]);

  // 번호를 순차적으로 표시하는 효과
  useEffect(() => {
    setVisibleNumbers([]);
    const showNumbersSequentially = async () => {
      for (let i = 0; i < numbers.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setVisibleNumbers(prev => [...prev, numbers[i]]);
      }
    };
    showNumbersSequentially();
  }, [numbers]);

  const getNumberColor = (number: number) => {
    if (number <= 10) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900';
    if (number <= 20) return 'bg-gradient-to-br from-blue-400 to-blue-600 text-white';
    if (number <= 30) return 'bg-gradient-to-br from-red-400 to-red-600 text-white';
    if (number <= 40) return 'bg-gradient-to-br from-gray-500 to-gray-700 text-white';
    return 'bg-gradient-to-br from-green-400 to-green-600 text-white';
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
      transition={{ duration: 0.5 }}
      className="bg-white p-5 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{label}</span>
        <div className="flex space-x-2">
          <motion.button 
            onClick={handleCopy} 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-gray-500 hover:text-indigo-600 transition-colors p-1.5 rounded-full hover:bg-indigo-50"
            title="번호 복사"
          >
            <Copy size={16} />
            <AnimatePresence>
              {copied && (
                <motion.span 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: -30 }}
                  exit={{ opacity: 0, y: -40 }}
                  className="absolute bg-black text-white text-xs py-1 px-2 rounded"
                >
                  복사됨!
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <motion.button 
            onClick={handleShare} 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-gray-500 hover:text-indigo-600 transition-colors p-1.5 rounded-full hover:bg-indigo-50"
            title="번호 공유"
          >
            <Share2 size={16} />
          </motion.button>
        </div>
      </div>
      <div className="flex justify-between gap-2">
        {numbers.map((number, index) => (
          <div key={`number-${index}-${number}`} className="relative flex items-center justify-center">
            {index < visibleNumbers.length ? (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 260, 
                  damping: 20,
                  duration: 0.6
                }}
                className={`w-12 h-12 rounded-full ${getNumberColor(number)} flex items-center justify-center shadow-lg`}
              >
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-base font-bold"
                >
                  {number}
                </motion.span>
              </motion.div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center shadow-sm animate-pulse">
                <span className="text-transparent">00</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
} 
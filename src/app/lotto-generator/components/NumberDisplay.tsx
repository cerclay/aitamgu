'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Share2, Star } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NumberDisplayProps {
  numbers: number[];
  label: string;
}

export default function NumberDisplay({ numbers, label }: NumberDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [visibleNumbers, setVisibleNumbers] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // 번호를 순차적으로 표시하는 효과
  useEffect(() => {
    setVisibleNumbers([]);
    setIsComplete(false);
    
    const showNumbersSequentially = async () => {
      for (let i = 0; i < numbers.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setVisibleNumbers(prev => [...prev, numbers[i]]);
        
        // 마지막 번호가 표시되면 완료 상태로 설정
        if (i === numbers.length - 1) {
          setTimeout(() => {
            setIsComplete(true);
          }, 500);
        }
      }
    };
    
    showNumbersSequentially();
  }, [numbers]);

  const getNumberColor = (number: number) => {
    if (number <= 10) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900 border-yellow-300';
    if (number <= 20) return 'bg-gradient-to-br from-blue-400 to-blue-600 text-white border-blue-300';
    if (number <= 30) return 'bg-gradient-to-br from-red-400 to-red-600 text-white border-red-300';
    if (number <= 40) return 'bg-gradient-to-br from-gray-500 to-gray-700 text-white border-gray-400';
    return 'bg-gradient-to-br from-green-400 to-green-600 text-white border-green-300';
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
      
      <div className="flex justify-between gap-2 relative">
        {/* 완료 효과 */}
        <AnimatePresence>
          {isComplete && (
            <motion.div 
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: [1, 1.2, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <motion.div 
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                className="text-indigo-500 opacity-10"
              >
                <Star size={150} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {numbers.map((number, index) => (
          <div key={`number-${index}-${number}`} className="relative flex items-center justify-center">
            {index < visibleNumbers.length ? (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ 
                  scale: 1, 
                  rotate: 0,
                  y: isComplete ? [0, -5, 0] : 0
                }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 260, 
                  damping: 20,
                  duration: 0.6,
                  y: { 
                    duration: 1.5, 
                    repeat: isComplete ? Infinity : 0, 
                    repeatType: "reverse",
                    ease: "easeInOut",
                    delay: index * 0.1
                  }
                }}
                className={`w-14 h-14 rounded-full ${getNumberColor(number)} flex items-center justify-center shadow-lg border-2`}
              >
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg font-bold"
                >
                  {number}
                </motion.span>
                
                {/* 번호 주변 효과 */}
                <AnimatePresence>
                  {isComplete && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 rounded-full"
                      style={{ 
                        background: `radial-gradient(circle, transparent 60%, rgba(255,255,255,0.2) 70%)`,
                        zIndex: -1
                      }}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div 
                className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center shadow-sm"
                animate={{ 
                  scale: [0.95, 1.05, 0.95],
                  opacity: [0.7, 0.9, 0.7]
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <span className="text-transparent">00</span>
              </motion.div>
            )}
          </div>
        ))}
      </div>
      
      {/* 행운의 메시지 */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-4 text-center"
          >
            <p className="text-sm text-indigo-600 font-medium">
              행운이 함께하길 바랍니다! 🍀
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 
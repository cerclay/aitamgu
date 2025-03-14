'use client';

import { useState, useEffect } from 'react';
import RecommendationCard from './components/RecommendationCard';
import NumberDisplay from './components/NumberDisplay';
import WinningStats from './components/WinningStats';
import { generateLottoNumbers } from './utils/numberGenerator';
import { RECOMMENDATION_OPTIONS } from './constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, ChevronUp, Gift, Zap } from 'lucide-react';

export default function LottoGenerator() {
  const [selectedNumbers, setSelectedNumbers] = useState<number[][]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showOptions, setShowOptions] = useState(true);

  useEffect(() => {
    if (selectedNumbers.length > 0) {
      setShowResults(true);
      // 번호가 생성되면 옵션 섹션을 자동으로 접기
      setShowOptions(false);
    }
  }, [selectedNumbers]);

  const handleGenerateNumbers = async (optionId: string) => {
    setIsGenerating(true);
    setShowResults(false); // 새로운 번호 생성 시 이전 결과 숨기기
    
    try {
      // 로딩 애니메이션을 위해 약간의 지연 추가
      await new Promise(resolve => setTimeout(resolve, 800));
      const numbers = await generateLottoNumbers(optionId);
      setSelectedNumbers(numbers);
      setSelectedMethod(optionId);
    } catch (error) {
      console.error('번호 생성 중 오류 발생:', error);
    }
    
    setIsGenerating(false);
  };

  const handleReset = () => {
    setSelectedNumbers([]);
    setSelectedMethod('');
    setShowResults(false);
    setShowOptions(true);
  };

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  // 선택된 방식의 이름 찾기
  const getSelectedMethodName = () => {
    const option = RECOMMENDATION_OPTIONS.find(opt => opt.id === selectedMethod);
    return option ? option.title : '랜덤 생성';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <Sparkles className="text-white" size={28} />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            로또 번호 생성기
          </h1>
          <p className="text-gray-600 text-lg">
            AI가 분석한 다양한 방식의 번호를 생성해보세요
          </p>
        </motion.div>

        {/* 번호 생성 방식 선택 섹션 */}
        <motion.div 
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          className="mb-6 bg-white rounded-2xl shadow-lg overflow-hidden border border-indigo-100"
        >
          <motion.div 
            className="p-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex justify-between items-center cursor-pointer"
            onClick={toggleOptions}
            whileHover={{ backgroundColor: 'rgba(79, 70, 229, 0.9)' }}
          >
            <h2 className="text-xl font-semibold flex items-center">
              <Zap className="mr-2" size={20} />
              번호 생성 방식 선택
            </h2>
            <motion.div
              animate={{ rotate: showOptions ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronUp size={20} />
            </motion.div>
          </motion.div>
          
          <AnimatePresence>
            {showOptions && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  {RECOMMENDATION_OPTIONS.map((option, index) => (
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <RecommendationCard
                        option={option}
                        onSelect={handleGenerateNumbers}
                        isSelected={selectedMethod === option.id}
                        isGenerating={isGenerating}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 로딩 인디케이터 */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-white rounded-xl shadow-lg p-8 mb-6 flex flex-col items-center justify-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="text-indigo-600 mb-4"
              >
                <RefreshCw size={40} />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">행운의 번호 생성 중...</h3>
              <p className="text-gray-600 text-center">
                AI가 최적의 번호 조합을 분석하고 있습니다.
                <br />잠시만 기다려주세요.
              </p>
              
              <motion.div 
                className="w-full h-2 bg-gray-200 rounded-full mt-4 overflow-hidden"
              >
                <motion.div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 생성된 번호 표시 */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-indigo-100"
            >
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-1.5 rounded-full mr-2 shadow-md">
                    <Gift size={18} />
                  </div>
                  생성된 번호
                </h2>
                <div className="flex items-center">
                  <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full mr-2 font-medium">
                    {getSelectedMethodName()}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleReset}
                    className="text-gray-500 hover:text-indigo-600 bg-gray-100 hover:bg-indigo-50 p-2 rounded-full transition-colors shadow-sm"
                  >
                    <RefreshCw size={16} />
                  </motion.button>
                </div>
              </div>
              <motion.div 
                className="space-y-4"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.3
                    }
                  },
                  hidden: {}
                }}
              >
                {selectedNumbers.map((numbers, index) => (
                  <motion.div
                    key={`number-set-${index}`}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                  >
                    <NumberDisplay
                      numbers={numbers}
                      label={`${index + 1}세트`}
                    />
                  </motion.div>
                ))}
              </motion.div>
              <div className="mt-5 pt-4 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-500 italic">
                  * 생성된 번호는 참고용이며, 당첨을 보장하지 않습니다.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 당첨 통계 */}
        <WinningStats />
      </div>
    </div>
  );
} 
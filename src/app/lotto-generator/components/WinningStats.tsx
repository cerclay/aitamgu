'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WinningStats as WinningStatsType } from '../types';
import { fetchLottoWinningNumbers } from '../api/lotto';
import { ChevronDown, ChevronUp, RefreshCw, TrendingUp, TrendingDown, History, Award } from 'lucide-react';

// 최근 당첨번호를 분석하여 빈도수 계산
const analyzeLottoFrequency = (winningNumbers: WinningStatsType['recentWinning']): { mostFrequent: number[], leastFrequent: number[] } => {
  const frequency: { [key: number]: number } = {};
  
  // 1-45까지의 모든 번호의 빈도수를 0으로 초기화
  for (let i = 1; i <= 45; i++) {
    frequency[i] = 0;
  }
  
  // 당첨번호의 빈도수 계산
  winningNumbers.forEach(winning => {
    winning.numbers.forEach(num => {
      frequency[num]++;
    });
  });
  
  // 빈도수를 기준으로 정렬
  const sortedNumbers = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .map(([num]) => parseInt(num));
  
  return {
    mostFrequent: sortedNumbers.slice(0, 6),
    leastFrequent: sortedNumbers.slice(-6).reverse()
  };
};

// 번호 색상 결정 함수
const getNumberColor = (number: number) => {
  if (number <= 10) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900';
  if (number <= 20) return 'bg-gradient-to-br from-blue-400 to-blue-600 text-white';
  if (number <= 30) return 'bg-gradient-to-br from-red-400 to-red-600 text-white';
  if (number <= 40) return 'bg-gradient-to-br from-gray-500 to-gray-700 text-white';
  return 'bg-gradient-to-br from-green-400 to-green-600 text-white';
};

export default function WinningStats() {
  const [stats, setStats] = useState<WinningStatsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  const refreshStats = async () => {
    setRefreshing(true);
    try {
      const winningNumbers = await fetchLottoWinningNumbers();
      const { mostFrequent, leastFrequent } = analyzeLottoFrequency(winningNumbers);
      
      setStats({
        mostFrequent,
        leastFrequent,
        recentWinning: winningNumbers,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('통계 데이터 로딩 실패:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const winningNumbers = await fetchLottoWinningNumbers();
        const { mostFrequent, leastFrequent } = analyzeLottoFrequency(winningNumbers);
        
        setStats({
          mostFrequent,
          leastFrequent,
          recentWinning: winningNumbers,
          lastUpdated: new Date().toISOString()
        });
      } catch (error) {
        console.error('통계 데이터 로딩 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // 금액 포맷팅 함수
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Award className="text-indigo-600 mr-2" size={24} />
            당첨 통계 분석
          </h2>
        </div>
        <div className="animate-pulse space-y-5">
          <div className="h-14 bg-gray-200 rounded-lg w-full"></div>
          <div className="h-14 bg-gray-200 rounded-lg w-full"></div>
          <div className="h-14 bg-gray-200 rounded-lg w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </motion.div>
    );
  }

  if (!stats) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <Award className="text-indigo-600 mr-2" size={24} />
          당첨 통계 분석
        </h2>
        <motion.button 
          onClick={refreshStats}
          disabled={refreshing}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-full hover:bg-indigo-50 transition-colors text-indigo-500"
        >
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
        </motion.button>
      </div>
      
      {/* 자주 나오는 번호 섹션 */}
      <div className="mb-4">
        <motion.button 
          onClick={() => toggleSection('frequent')}
          whileHover={{ scale: 1.01 }}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center">
            <div className="bg-amber-200 p-2 rounded-full mr-3">
              <TrendingUp size={20} className="text-amber-600" />
            </div>
            <span className="font-semibold text-gray-800">자주 나오는 번호</span>
          </div>
          <motion.div
            animate={{ rotate: expandedSection === 'frequent' ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown size={20} className="text-amber-600" />
          </motion.div>
        </motion.button>
        
        <AnimatePresence>
          {expandedSection === 'frequent' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-5 bg-amber-50 rounded-b-xl mt-1 border-t-2 border-amber-100">
                <div className="flex flex-wrap gap-3 justify-center">
                  {stats.mostFrequent.map((number, index) => (
                    <motion.div
                      key={`frequent-${number}`}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        delay: index * 0.1,
                        type: 'spring',
                        stiffness: 260,
                        damping: 20
                      }}
                      className={`w-12 h-12 flex items-center justify-center rounded-full ${getNumberColor(number)} font-bold shadow-md`}
                    >
                      {number}
                    </motion.div>
                  ))}
                </div>
                <p className="text-sm text-amber-700 mt-4 text-center bg-amber-100 p-2 rounded-lg">
                  최근 당첨 번호에서 가장 자주 등장한 번호들입니다.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 적게 나오는 번호 섹션 */}
      <div className="mb-4">
        <motion.button 
          onClick={() => toggleSection('rare')}
          whileHover={{ scale: 1.01 }}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center">
            <div className="bg-blue-200 p-2 rounded-full mr-3">
              <TrendingDown size={20} className="text-blue-600" />
            </div>
            <span className="font-semibold text-gray-800">적게 나오는 번호</span>
          </div>
          <motion.div
            animate={{ rotate: expandedSection === 'rare' ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown size={20} className="text-blue-600" />
          </motion.div>
        </motion.button>
        
        <AnimatePresence>
          {expandedSection === 'rare' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-5 bg-blue-50 rounded-b-xl mt-1 border-t-2 border-blue-100">
                <div className="flex flex-wrap gap-3 justify-center">
                  {stats.leastFrequent.map((number, index) => (
                    <motion.div
                      key={`rare-${number}`}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        delay: index * 0.1,
                        type: 'spring',
                        stiffness: 260,
                        damping: 20
                      }}
                      className={`w-12 h-12 flex items-center justify-center rounded-full ${getNumberColor(number)} font-bold shadow-md`}
                    >
                      {number}
                    </motion.div>
                  ))}
                </div>
                <p className="text-sm text-blue-700 mt-4 text-center bg-blue-100 p-2 rounded-lg">
                  최근 당첨 번호에서 가장 적게 등장한 번호들입니다.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 최근 당첨 번호 섹션 */}
      <div className="mb-4">
        <motion.button 
          onClick={() => toggleSection('recent')}
          whileHover={{ scale: 1.01 }}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center">
            <div className="bg-emerald-200 p-2 rounded-full mr-3">
              <History size={20} className="text-emerald-600" />
            </div>
            <span className="font-semibold text-gray-800">최근 당첨 번호</span>
          </div>
          <motion.div
            animate={{ rotate: expandedSection === 'recent' ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown size={20} className="text-emerald-600" />
          </motion.div>
        </motion.button>
        
        <AnimatePresence>
          {expandedSection === 'recent' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-5 bg-emerald-50 rounded-b-xl mt-1 border-t-2 border-emerald-100">
                <div className="space-y-4">
                  {stats.recentWinning.map((winning, index) => (
                    <motion.div 
                      key={`winning-${winning.round}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center">
                          <span className="bg-emerald-100 text-emerald-700 text-sm font-medium px-3 py-1 rounded-full">
                            {winning.round}회
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            {formatDate(winning.date)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-purple-600">
                          {formatCurrency(winning.totalPrize)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {winning.numbers.map((number, idx) => (
                          <motion.div
                            key={`winning-${winning.round}-${number}`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3 + idx * 0.05 }}
                            className={`w-10 h-10 flex items-center justify-center rounded-full ${getNumberColor(number)} text-sm font-bold shadow-sm`}
                          >
                            {number}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-center text-xs text-gray-500 mt-5 bg-gray-50 p-3 rounded-lg">
        마지막 업데이트: {new Date(stats.lastUpdated).toLocaleString('ko-KR')}
      </div>
    </motion.div>
  );
} 
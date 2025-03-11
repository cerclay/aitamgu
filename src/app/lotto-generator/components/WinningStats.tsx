'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WinningStats as WinningStatsType } from '../types';
import { fetchLottoWinningNumbers } from '../api/lotto';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

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

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-lg p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <span className="bg-indigo-100 text-indigo-600 p-1 rounded-full mr-2">📊</span>
            당첨 통계
          </h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded-lg w-full"></div>
          <div className="h-12 bg-gray-200 rounded-lg w-full"></div>
          <div className="h-12 bg-gray-200 rounded-lg w-full"></div>
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
      className="bg-white rounded-xl shadow-lg p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <span className="bg-indigo-100 text-indigo-600 p-1 rounded-full mr-2">📊</span>
          당첨 통계
        </h2>
        <button 
          onClick={refreshStats}
          disabled={refreshing}
          className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${refreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={18} className="text-gray-500" />
        </button>
      </div>
      
      {/* 자주 나오는 번호 섹션 */}
      <div className="mb-3">
        <button 
          onClick={() => toggleSection('frequent')}
          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg hover:from-yellow-100 hover:to-yellow-200 transition-colors"
        >
          <div className="flex items-center">
            <span className="text-yellow-500 mr-2">🔥</span>
            <span className="font-medium text-gray-800">자주 나오는 번호</span>
          </div>
          {expandedSection === 'frequent' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        
        <AnimatePresence>
          {expandedSection === 'frequent' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-3 bg-yellow-50 rounded-b-lg mt-1">
                <div className="flex flex-wrap gap-2 justify-center">
                  {stats.mostFrequent.map((number, index) => (
                    <motion.div
                      key={`frequent-${number}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-yellow-500 text-white font-bold shadow-sm"
                    >
                      {number}
                    </motion.div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  최근 당첨 번호에서 가장 자주 등장한 번호들입니다.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 적게 나오는 번호 섹션 */}
      <div className="mb-3">
        <button 
          onClick={() => toggleSection('rare')}
          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-colors"
        >
          <div className="flex items-center">
            <span className="text-blue-500 mr-2">❄️</span>
            <span className="font-medium text-gray-800">적게 나오는 번호</span>
          </div>
          {expandedSection === 'rare' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        
        <AnimatePresence>
          {expandedSection === 'rare' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-3 bg-blue-50 rounded-b-lg mt-1">
                <div className="flex flex-wrap gap-2 justify-center">
                  {stats.leastFrequent.map((number, index) => (
                    <motion.div
                      key={`rare-${number}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold shadow-sm"
                    >
                      {number}
                    </motion.div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  최근 당첨 번호에서 가장 적게 등장한 번호들입니다.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 최근 당첨 번호 섹션 */}
      <div className="mb-3">
        <button 
          onClick={() => toggleSection('recent')}
          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition-colors"
        >
          <div className="flex items-center">
            <span className="text-green-500 mr-2">🎯</span>
            <span className="font-medium text-gray-800">최근 당첨 번호</span>
          </div>
          {expandedSection === 'recent' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        
        <AnimatePresence>
          {expandedSection === 'recent' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-3 bg-green-50 rounded-b-lg mt-1">
                <div className="space-y-3">
                  {stats.recentWinning.map((winning) => (
                    <div key={`winning-${winning.round}`} className="p-3 bg-white rounded-lg shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-medium text-gray-700">
                          {winning.round}회 ({winning.date})
                        </div>
                        <div className="text-sm font-medium text-green-600">
                          {(winning.totalPrize / 100000000).toFixed(1)}억원
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {winning.numbers.map((number, index) => {
                          let bgColor = 'bg-gray-200 text-gray-700';
                          if (number <= 10) bgColor = 'bg-yellow-500 text-white';
                          else if (number <= 20) bgColor = 'bg-blue-500 text-white';
                          else if (number <= 30) bgColor = 'bg-red-500 text-white';
                          else if (number <= 40) bgColor = 'bg-gray-600 text-white';
                          else bgColor = 'bg-green-500 text-white';
                          
                          return (
                            <div
                              key={`recent-${winning.round}-${index}`}
                              className={`w-8 h-8 flex items-center justify-center rounded-full ${bgColor} text-sm font-bold shadow-sm`}
                            >
                              {number}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-3 text-right text-xs text-gray-500">
        마지막 업데이트: {new Date(stats.lastUpdated).toLocaleString()}
      </div>
    </motion.div>
  );
} 
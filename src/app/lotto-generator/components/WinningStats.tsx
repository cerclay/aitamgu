'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WinningStats as WinningStatsType } from '../types';
import { fetchLottoWinningNumbers } from '../api/lotto';

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
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">당첨 통계</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">자주 나오는 번호</h3>
          <div className="flex flex-wrap gap-2">
            {stats.mostFrequent.map((number, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-700 font-semibold"
              >
                {number}
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">적게 나오는 번호</h3>
          <div className="flex flex-wrap gap-2">
            {stats.leastFrequent.map((number, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold"
              >
                {number}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">최근 당첨 번호</h3>
        <div className="space-y-4">
          {stats.recentWinning.map((winning) => (
            <div key={winning.round} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-gray-600">
                  {winning.round}회 ({winning.date})
                </div>
                <div className="text-sm font-medium text-green-600">
                  {(winning.totalPrize / 100000000).toFixed(1)}억원
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {winning.numbers.map((number, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold"
                  >
                    {number}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-right text-sm text-gray-500">
        마지막 업데이트: {new Date(stats.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
} 
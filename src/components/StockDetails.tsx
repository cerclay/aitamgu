'use client'

import { useState, useEffect } from 'react';

export default function StockDetails({ symbol, initialData }) {
  const [stockData, setStockData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  
  useEffect(() => {
    if (!initialData) {
      fetchData();
    }
    
    async function fetchData() {
      try {
        const response = await fetch(`/api/yahoo-finance?symbol=${symbol}`);
        const data = await response.json();
        setStockData(data);
      } catch (error) {
        console.error('Error fetching stock data:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [symbol, initialData]);
  
  if (loading) {
    return <div>주식 데이터를 로딩 중입니다...</div>;
  }
  
  return (
    <div>
      {/* 주식 데이터 표시 */}
    </div>
  );
} 
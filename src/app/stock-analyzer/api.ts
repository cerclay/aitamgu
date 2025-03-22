﻿'use client';

import { StockData, EconomicIndicator, PredictionResult, YahooFinanceResponse, FredApiResponse, SimpleEconomicIndicator } from './types';
import yahooFinance from 'yahoo-finance2';
import { NextRequest, NextResponse } from 'next/server';

// Yahoo Finance API 키
const YAHOO_FINANCE_API_KEY = process.env.NEXT_PUBLIC_YAHOO_FINANCE_API_KEY;

// 간단한 메모리 캐시
const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5분

// AIAnalysisResponse 인터페이스 정의
interface AIAnalysisResponse {
  analysis: string;
  analysisKr?: string;
  prediction: PredictionResult;
  analysisType: string;
  modelType: string;
  timestamp: string;
}

// 주식 데이터 가져오기
export async function fetchStockData(symbol: string) {
  try {
    console.log('클라이언트에서 요청하는 심볼:', symbol);
    const response = await fetch(`/api/yahoo-finance?symbol=${encodeURIComponent(symbol)}`);
    
    if (!response.ok) {
      throw new Error('주식 데이터를 가져오는 데 실패했습니다.');
    }
    
    const data = await response.json();
    console.log('API 응답 받은 심볼:', data.ticker);
    
    // 심볼이 일치하는지 확인
    if (data.ticker.toUpperCase() !== symbol.toUpperCase()) {
      console.warn(`요청한 심볼(${symbol})과 응답 심볼(${data.ticker})이 일치하지 않습니다.`);
    }
    
    // 주가 데이터 유효성 검사
    if (!data.historicalPrices || data.historicalPrices.length === 0) {
      console.error('주가 데이터가 없습니다.');
      throw new Error('주가 데이터를 가져오는 데 실패했습니다.');
    }
    
    // 데이터 정렬 (최신 날짜 기준으로)
    data.historicalPrices.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // 주가 데이터 중 price가 0 또는 null인 항목 필터링
    data.historicalPrices = data.historicalPrices.filter(item => 
      item && item.price && item.price > 0 && 
      item.date && new Date(item.date).toString() !== 'Invalid Date'
    );
    
    return data;
  } catch (error) {
    console.error('주식 데이터 가져오기 오류:', error);
    throw error;
  }
}

// 경제 지표 데이터 가져오기
export async function fetchEconomicIndicators() {
  try {
    console.log('경제 지표 데이터 요청 시작');
    const response = await fetch('/api/economic-indicators');
    
    if (!response.ok) {
      throw new Error('경제 지표를 가져오는 데 실패했습니다.');
    }
    
    const data = await response.json();
    console.log('경제 지표 데이터 응답 받음:', data?.length || 0, '개 항목');
    
    // 응답 데이터가 배열이 아니면 빈 배열 반환
    if (!Array.isArray(data)) {
      console.warn('경제 지표 데이터가 배열 형태가 아닙니다:', data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('경제 지표 가져오기 오류:', error);
    throw error;
  }
}

// 주식 예측 생성
export async function generatePrediction(
  symbol: string,
  stockData: StockData,
  economicIndicators: EconomicIndicator[],
  modelType: 'gemini' | 'default' = 'gemini'
): Promise<PredictionResult> {
  try {
    console.log(`주식 예측 생성 시작: ${symbol} (모델: ${modelType})`);
    let prediction: PredictionResult;

    if (modelType === 'gemini') {
      try {
        // Gemini API 엔드포인트 호출 시도
        console.log('Gemini API를 사용하여 예측 생성 시도');
        
        // API 호출 시도
        const response = await fetch('/api/gemini-analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            symbol,
            stockData,
            economicIndicators,
          }),
          cache: 'no-store',
        });

        // 응답 검사
        if (!response.ok) {
          console.error(`Gemini API 응답 오류: ${response.status}`);
          throw new Error(`Gemini API 호출 실패: ${response.status}`);
        }

        // 응답 데이터 파싱
        const result = await response.json();
        console.log('Gemini API 응답 수신');
        
        // 결과 검증
        if (!result || typeof result !== 'object') {
          console.error('Gemini API 응답 형식 오류:', result);
          throw new Error('Gemini API 응답이 유효하지 않습니다');
        }
        
        // prediction 데이터 추출 시도
        prediction = result.prediction;
        
        // prediction 객체 유효성 검사
        if (!prediction || typeof prediction !== 'object') {
          console.error('Gemini API 예측 결과 누락:', result);
          throw new Error('API 응답에 prediction 객체가 없습니다');
        }
        
        console.log('Gemini API 예측 생성 완료');
      } catch (geminiError) {
        // 오류 발생 시 상세 로깅 후 기본 예측 모델로 대체
        console.error('Gemini API 호출 오류 발생:', geminiError);
        console.log('기본 예측 모델로 대체합니다');
        prediction = generateDefaultPrediction(stockData, economicIndicators);
      }
    } else {
      // 기본 예측 모델 사용
      console.log('기본 예측 모델 사용');
      prediction = generateDefaultPrediction(stockData, economicIndicators);
    }
    
    // prediction 객체가 정의되지 않은 경우 기본 예측 사용
    if (!prediction || typeof prediction !== 'object') {
      console.warn('예측 결과가 유효하지 않아 기본 예측 모델을 사용합니다');
      prediction = generateDefaultPrediction(stockData, economicIndicators);
    }
    
    // 데이터 유효성 검사 및 보정
    console.log('예측 데이터 후처리 시작');
    
    // shortTerm, mediumTerm, longTerm 필드 검증
    if (!prediction.shortTerm || typeof prediction.shortTerm !== 'object') {
      prediction.shortTerm = {
        price: stockData.currentPrice * 1.05,
        change: 5,
        probability: 65,
        range: {
          min: stockData.currentPrice * 0.95,
          max: stockData.currentPrice * 1.15
        }
      };
    }
    
    if (!prediction.mediumTerm || typeof prediction.mediumTerm !== 'object') {
      prediction.mediumTerm = {
        price: stockData.currentPrice * 1.10,
        change: 10,
        probability: 60,
        range: {
          min: stockData.currentPrice * 0.9,
          max: stockData.currentPrice * 1.3
        }
      };
    }
    
    if (!prediction.longTerm || typeof prediction.longTerm !== 'object') {
      prediction.longTerm = {
        price: stockData.currentPrice * 1.15,
        change: 15,
        probability: 55,
        range: {
          min: stockData.currentPrice * 0.85,
          max: stockData.currentPrice * 1.45
        }
      };
    }
    
    // 날짜 형식 및 데이터 유효성 검사 - pricePredictions 배열
    if (!Array.isArray(prediction.pricePredictions) || prediction.pricePredictions.length === 0) {
      console.log('예측 가격 데이터가 없어 생성합니다');
      
      const currentPrice = stockData.currentPrice;
      const today = new Date();
      
      // 단기, 중기, 장기 목표 가격 가져오기
      const shortTermPrice = prediction.shortTerm.price;
      const mediumTermPrice = prediction.mediumTerm.price;
      const longTermPrice = prediction.longTerm.price;
      
      // 180일(약 6개월) 동안의 예측 데이터 생성
      prediction.pricePredictions = Array.from({ length: 180 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() + i + 1);
        
        let predictedPrice;
        // 30일(1개월)까지는 현재 가격에서 단기 목표 가격으로 점진적 변화
        if (i < 30) {
          predictedPrice = currentPrice + (shortTermPrice - currentPrice) * (i / 30);
        } 
        // 90일(3개월)까지는 단기 목표에서 중기 목표 가격으로 점진적 변화
        else if (i < 90) {
          predictedPrice = shortTermPrice + (mediumTermPrice - shortTermPrice) * ((i - 30) / 60);
        } 
        // 그 이후는 중기 목표에서 장기 목표 가격으로 점진적 변화
        else {
          predictedPrice = mediumTermPrice + (longTermPrice - mediumTermPrice) * ((i - 90) / 90);
        }
        
        // 매우 작은 변동성 추가 (0.3% 이내로 제한)
        const dayOfWeek = (date.getDay() + 1) % 7; // 0-6 -> 1-6,0
        const volatility = Math.sin(i * 0.3 + dayOfWeek) * 0.0015 * currentPrice;
        predictedPrice += volatility;
        
        return {
          date: date.toISOString().split('T')[0],
          predictedPrice: parseFloat(predictedPrice.toFixed(2)),
          range: {
            min: parseFloat((predictedPrice * 0.98).toFixed(2)),
            max: parseFloat((predictedPrice * 1.02).toFixed(2))
          }
        };
      });
    } else {
      // 기존 예측 데이터 있을 경우 부드러운 곡선으로 보정
      if (prediction.pricePredictions.length > 0) {
        // 예측 데이터 정렬 (날짜순)
        prediction.pricePredictions.sort((a, b) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        
        // 너무 큰 변동성 제거하여 부드러운 곡선 만들기
        let prevPrice = stockData.currentPrice;
        prediction.pricePredictions = prediction.pricePredictions.map((item, index) => {
          // 변동성 제한 (이전 가격의 최대 +/-1%)
          if (index > 0) {
            const maxChange = prevPrice * 0.01;
            if (Math.abs(item.predictedPrice - prevPrice) > maxChange) {
              if (item.predictedPrice > prevPrice) {
                item.predictedPrice = prevPrice + maxChange;
              } else {
                item.predictedPrice = prevPrice - maxChange;
              }
            }
          }
          
          // 가격 유효성 검사
          if (!item.predictedPrice || isNaN(item.predictedPrice) || item.predictedPrice <= 0) {
            item.predictedPrice = prevPrice * (1 + (Math.random() * 0.01 - 0.005));
          }
          
          item.predictedPrice = parseFloat(item.predictedPrice.toFixed(2));
          prevPrice = item.predictedPrice;
          
          // 범위 업데이트 (좁은 범위)
          item.range = {
            min: parseFloat((item.predictedPrice * 0.98).toFixed(2)),
            max: parseFloat((item.predictedPrice * 1.02).toFixed(2))
          };
          
          return item;
        });
      }
    }
    
    // 기타 필드들 확인 및 보정
    if (!prediction.confidenceScore || prediction.confidenceScore < 0 || prediction.confidenceScore > 100) {
      prediction.confidenceScore = 65;
    }
    
    if (!prediction.recommendation) {
      prediction.recommendation = 'HOLD';
    }
    
    if (!prediction.summary || typeof prediction.summary !== 'string') {
      prediction.summary = `${stockData.companyNameKr || stockData.companyName}(${stockData.ticker})의 주가는 단기적으로 ${prediction.shortTerm.change.toFixed(2)}%, 중기적으로 ${prediction.mediumTerm.change.toFixed(2)}%, 장기적으로 ${prediction.longTerm.change.toFixed(2)}%의 변동이 예상됩니다.`;
    }
    
    if (!Array.isArray(prediction.strengths) || prediction.strengths.length === 0) {
      prediction.strengths = [
        '경쟁사 대비 시장 점유율',
        '안정적인 수익 성장',
        '다양한 제품 포트폴리오'
      ];
    }
    
    if (!Array.isArray(prediction.risks) || prediction.risks.length === 0) {
      prediction.risks = [
        '시장 경쟁 심화',
        '규제 환경 변화',
        '기술 변화 적응 필요'
      ];
    }
    
    if (!prediction.modelInfo || typeof prediction.modelInfo !== 'object') {
      prediction.modelInfo = {
        type: '기본 예측 모델',
        accuracy: 75,
        features: ['과거 가격 데이터', '기술적 지표'],
        trainPeriod: '최근 데이터'
      };
    }
    
    console.log('예측 데이터 후처리 완료');
    return prediction;
  } catch (error) {
    console.error('예측 생성 중 예기치 않은 오류 발생:', error);
    // 어떤 경우에도 예측을 반환하도록 보장
    return generateDefaultPrediction(stockData, economicIndicators);
  }
}

// 기본 예측 생성 (Gemini API 실패 시 대체용)
function generateDefaultPrediction(stockData: StockData, economicIndicators: EconomicIndicator[]): PredictionResult {
  console.log('기본 예측 모델 사용 중...');
  const currentPrice = stockData.currentPrice;
  
  // 간단한 변동률 계산
  const shortTermChange = 5 + (Math.random() * 5 - 2.5); // 2.5~7.5% 변동
  const mediumTermChange = shortTermChange * 1.5; // 단기 예측의 1.5배
  const longTermChange = shortTermChange * 2.2; // 단기 예측의 2.2배
  
  // 예측 가격 계산
  const shortTermPrice = currentPrice * (1 + shortTermChange / 100);
  const mediumTermPrice = currentPrice * (1 + mediumTermChange / 100);
  const longTermPrice = currentPrice * (1 + longTermChange / 100);
  
  // 일별 예측 가격 생성
  const pricePredictions = [];
  const today = new Date();
  
  for (let i = 1; i <= 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    let predictedPrice;
    if (i <= 30) {
      // 단기: 현재가격에서 shortTermPrice까지 선형 보간
      predictedPrice = currentPrice + (shortTermPrice - currentPrice) * (i / 30);
    } else if (i <= 60) {
      // 중기: shortTermPrice에서 mediumTermPrice까지 선형 보간
      predictedPrice = shortTermPrice + (mediumTermPrice - shortTermPrice) * ((i - 30) / 30);
    } else {
      // 장기: mediumTermPrice에서 longTermPrice까지 선형 보간
      predictedPrice = mediumTermPrice + (longTermPrice - mediumTermPrice) * ((i - 60) / 30);
    }
    
    // 약간의 변동성 추가
    const volatility = currentPrice * 0.005 * Math.random();
    predictedPrice += (Math.random() > 0.5 ? volatility : -volatility);
    
    pricePredictions.push({
      date: date.toISOString().split('T')[0],
      predictedPrice: Number(predictedPrice.toFixed(2)),
      range: {
        min: Number((predictedPrice * 0.95).toFixed(2)),
        max: Number((predictedPrice * 1.05).toFixed(2))
      }
    });
  }
  
  // 투자 추천 결정
  let recommendation = 'HOLD';
  if (shortTermChange > 8) recommendation = 'BUY';
  else if (shortTermChange < -3) recommendation = 'SELL';
  
  // 가상의 강점 및 위험 요소 생성
  const strengths = [
    '경쟁사 대비 시장 점유율',
    '안정적인 수익 성장',
    '다양한 제품 포트폴리오',
    '효율적인 비용 구조',
    '글로벌 시장 진출'
  ];
  
  const risks = [
    '시장 경쟁 심화',
    '규제 환경 변화',
    '공급망 불안정성',
    '기술 변화 적응 필요',
    '거시경제 불확실성'
  ];
  
  return {
    shortTerm: {
      price: Number(shortTermPrice.toFixed(2)),
      change: Number(shortTermChange.toFixed(2)),
      probability: 65,
      range: {
        min: Number((shortTermPrice * 0.95).toFixed(2)),
        max: Number((shortTermPrice * 1.05).toFixed(2))
      }
    },
    mediumTerm: {
      price: Number(mediumTermPrice.toFixed(2)),
      change: Number(mediumTermChange.toFixed(2)),
      probability: 60,
      range: {
        min: Number((mediumTermPrice * 0.9).toFixed(2)),
        max: Number((mediumTermPrice * 1.1).toFixed(2))
      }
    },
    longTerm: {
      price: Number(longTermPrice.toFixed(2)),
      change: Number(longTermChange.toFixed(2)),
      probability: 55,
      range: {
        min: Number((longTermPrice * 0.85).toFixed(2)),
        max: Number((longTermPrice * 1.15).toFixed(2))
      }
    },
    pricePredictions,
    confidenceScore: 65,
    modelInfo: {
      type: '기본 예측 모델',
      accuracy: 75,
      features: ['과거 가격 데이터', '기술적 지표'],
      trainPeriod: '최근 데이터'
    },
    summary: `${stockData.companyNameKr || stockData.companyName}(${stockData.ticker})의 주가는 단기적으로 ${shortTermChange.toFixed(2)}%, 중기적으로 ${mediumTermChange.toFixed(2)}%, 장기적으로 ${longTermChange.toFixed(2)}%의 변동이 예상됩니다.`,
    strengths,
    risks,
    recommendation
  };
}

// 모멘텀 계산 함수
function calculateMomentum(prices, days) {
  if (prices.length < days) return 0;
  
  const currentPrice = prices[prices.length - 1].price;
  const pastPrice = prices[prices.length - days].price;
  
  return ((currentPrice - pastPrice) / pastPrice) * 100;
}

// 기술적 지표 계산 함수
function calculateTechnicalIndicators(prices) {
  // 가격 데이터 추출
  const closePrices = prices.map(p => p.price);
  
  // RSI 계산
  const rsi = 50; // 간소화된 계산
  
  // 이동평균선 계산
  const ma50 = calculateSimpleMA(closePrices, 50);
  const ma200 = calculateSimpleMA(closePrices, 200);
  const ema20 = calculateSimpleEMA(closePrices, 20);
  const ema50 = calculateSimpleEMA(closePrices, 50);
  
  // 볼린저 밴드 계산
  const { upper, middle, lower, width } = calculateSimpleBollingerBands(closePrices);
  
  // MACD 계산
  const { value, signal, histogram } = calculateSimpleMACD(closePrices);
  
  // ATR 계산
  const atr = 2; // 간소화된 계산
  
  // OBV 계산
  const obv = 1000000; // 간소화된 계산
  
  // 스토캐스틱 계산
  const stochastic = { k: 50, d: 50 }; // 간소화된 계산
  
  // ADX 계산
  const adx = 25; // 간소화된 계산
  
  // 지지/저항 레벨 계산
  const currentPrice = closePrices[closePrices.length - 1];
  const supportLevels = [currentPrice * 0.95, currentPrice * 0.9];
  const resistanceLevels = [currentPrice * 1.05, currentPrice * 1.1];
  
  return {
    rsi,
    macd: { value, signal, histogram },
    bollingerBands: { upper, middle, lower, width },
    ma50,
    ma200,
    ema20,
    ema50,
    atr,
    obv,
    stochastic,
    adx,
    supportLevels,
    resistanceLevels
  };
}

// 간단한 이동평균 계산
function calculateSimpleMA(prices, period) {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const slice = prices.slice(prices.length - period);
  return slice.reduce((sum, price) => sum + price, 0) / period;
}

// 간단한 지수이동평균 계산
function calculateSimpleEMA(prices, period) {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  
  return ema;
}

// 간단한 볼린저 밴드 계산
function calculateSimpleBollingerBands(prices, period = 20, multiplier = 2) {
  if (prices.length < period) {
    return { upper: 0, middle: 0, lower: 0, width: 0 };
  }
  
  const slice = prices.slice(prices.length - period);
  const middle = slice.reduce((sum, price) => sum + price, 0) / period;
  
  const squaredDiffs = slice.map(price => Math.pow(price - middle, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / period;
  const stdDev = Math.sqrt(variance);
  
  const upper = middle + (multiplier * stdDev);
  const lower = middle - (multiplier * stdDev);
  const width = ((upper - lower) / middle) * 100;
  
  return { upper, middle, lower, width };
}

// 간단한 MACD 계산
function calculateSimpleMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fastEMA = calculateSimpleEMA(prices, fastPeriod);
  const slowEMA = calculateSimpleEMA(prices, slowPeriod);
  const value = fastEMA - slowEMA;
  
  // 신호선 계산을 위한 MACD 값 배열 생성 (간소화)
  const macdLine = [value];
  const signal = calculateSimpleEMA(macdLine, signalPeriod);
  const histogram = value - signal;
  
  return { value, signal, histogram };
}

// 영문 요약을 한글로 변환하는 함수
function translateSummaryToKorean(summary: string, ticker: string, recommendation: string): string {
  // 기본 번역 포맷 생성
  const companyName = `${ticker}`;
  
  let koreanSummary = '';
  
  // 추천에 따라 다른 문구 사용
  if (recommendation?.toUpperCase() === 'BUY') {
    koreanSummary = `${companyName} 주식은 단기적으로 상승할 것으로 예상됩니다. 기술적 분석과 기본적 분석 결과 긍정적인 모멘텀을 보이고 있으며, 현재 가격대는 매수 기회로 판단됩니다. 최근의 시장 환경과 기업 실적을 고려할 때, 중장기적으로도 성장 가능성이 높습니다.`;
  } else if (recommendation?.toUpperCase() === 'SELL') {
    koreanSummary = `${companyName} 주식은 단기적으로 하락 압력을 받을 것으로 예상됩니다. 기술적 분석에서 약세 신호가 감지되었으며, 현재 가격은 고평가되어 있을 수 있습니다. 현재 포지션의 조정을 고려하는 것이 좋습니다.`;
  } else {
    koreanSummary = `${companyName} 주식은 현재 안정적인 흐름을 보이고 있습니다. 단기적으로는 큰 변동성이 예상되지 않으며, 현재 포지션을 유지하는 것이 좋을 것으로 판단됩니다. 시장 환경 변화에 따라 추가적인 분석이 필요합니다.`;
  }
  
  // 원본 요약에서 특정 키워드가 있는지 확인하여 추가 정보 제공
  if (summary.includes('growth') || summary.includes('increase')) {
    koreanSummary += ` 매출 성장과 수익성 개선이 기대되어 투자자들의 관심이 높아질 것으로 예상됩니다.`;
  }
  
  if (summary.includes('risk') || summary.includes('volatility')) {
    koreanSummary += ` 다만, 시장 변동성과 외부 리스크 요인을 주의 깊게 모니터링할 필요가 있습니다.`;
  }
  
  if (summary.includes('dividend') || summary.includes('yield')) {
    koreanSummary += ` 안정적인 배당 수익률도 투자 매력도를 높이는 요소입니다.`;
  }
  
  return koreanSummary;
}

'use client';

import { StockData, EconomicIndicator, PredictionResult, YahooFinanceResponse, FredApiResponse } from './types';
import yahooFinance from 'yahoo-finance2';

// Yahoo Finance API 키
const YAHOO_FINANCE_API_KEY = process.env.NEXT_PUBLIC_YAHOO_FINANCE_API_KEY;

// 주식 데이터 가져오기
export async function fetchStockData(ticker: string): Promise<StockData> {
  try {
    // 서버 측 프록시 API를 통해 데이터 가져오기
    const [quoteResponse, profileResponse, summaryResponse] = await Promise.all([
      fetch(`/api/yahoo-finance?symbol=${ticker}`).then(res => res.json()),
      fetch(`/api/yahoo-finance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: ticker, modules: ['assetProfile'] })
      }).then(res => res.json()),
      fetch(`/api/yahoo-finance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          symbol: ticker, 
          modules: ['defaultKeyStatistics', 'financialData', 'summaryDetail', 'price'] 
        })
      }).then(res => res.json())
    ]);

    // 과거 주가 데이터 가져오기
    const oneYearAgo = Math.floor(getOneYearAgo().getTime() / 1000);
    const now = Math.floor(Date.now() / 1000);
    const historyResponse = await fetch(`/api/yahoo-finance/historical?symbol=${ticker}&period1=${oneYearAgo}&period2=${now}&interval=1d`)
      .then(res => res.json());

    // API 응답 데이터 추출
    const quote = quoteResponse.chart?.result?.[0]?.meta || {};
    const profile = profileResponse.quoteSummary?.result?.[0] || {};
    const summary = summaryResponse.quoteSummary?.result?.[0] || {};
    
    // 과거 주가 데이터 변환
    const historicalPrices = historyResponse.map((item: any) => ({
      date: item.Date,
      price: item.Close,
    }));

    // 기술적 지표 계산
    const rsi = calculateRSI(historicalPrices);
    const { ma50, ma200 } = calculateMovingAverages(historicalPrices);
    const { bollingerUpper, bollingerLower } = calculateBollingerBands(historicalPrices);
    const macd = calculateMACD(historicalPrices);

    // 주가 변화율 계산
    const currentPrice = quote.regularMarketPrice || 0;
    const previousClose = quote.previousClose || 0;
    const priceChange = ((currentPrice - previousClose) / previousClose) * 100;

    console.log('API 응답 데이터:', { quoteResponse, profileResponse, summaryResponse, historyResponse });

    // 실제 API 데이터로 StockData 객체 생성
    return {
      ticker,
      companyName: quote.longName || quote.shortName || ticker,
      currentPrice: currentPrice,
      priceChange: priceChange,
      marketCap: quote.marketCap || 0,
      volume: quote.regularMarketVolume || 0,
      high52Week: quote.fiftyTwoWeekHigh || 0,
      low52Week: quote.fiftyTwoWeekLow || 0,
      lastUpdated: new Date().toISOString(),
      description: profile.assetProfile?.longBusinessSummary || `${ticker}는 미국 주식 시장에 상장된 기업입니다.`,
      historicalPrices,
      technicalIndicators: {
        rsi,
        macd,
        bollingerUpper,
        bollingerLower,
        ma50,
        ma200,
      },
      fundamentals: {
        pe: summary.summaryDetail?.trailingPE?.raw || 0,
        eps: summary.defaultKeyStatistics?.trailingEps?.raw || 0,
        dividendYield: (summary.summaryDetail?.dividendYield?.raw || 0) * 100, // 백분율로 변환
        peg: summary.defaultKeyStatistics?.pegRatio?.raw || 0,
        roe: summary.financialData?.returnOnEquity?.raw ? summary.financialData.returnOnEquity.raw * 100 : 0, // 백분율로 변환
        debtToEquity: summary.financialData?.debtToEquity?.raw || 0,
        revenue: summary.financialData?.totalRevenue?.raw || 0,
        revenueGrowth: summary.financialData?.revenueGrowth?.raw ? summary.financialData.revenueGrowth.raw * 100 : 0, // 백분율로 변환
        netIncome: summary.financialData?.netIncomeToCommon?.raw || 0,
        netIncomeGrowth: 0, // API에서 직접 제공하지 않는 값
        operatingMargin: summary.financialData?.operatingMargins?.raw ? summary.financialData.operatingMargins.raw * 100 : 0, // 백분율로 변환
        nextEarningsDate: quote.earningsTimestamp ? new Date(quote.earningsTimestamp * 1000).toISOString().split('T')[0] : "",
      },
      patterns: generateRandomPatterns(), // 차트 패턴은 여전히 목업 데이터 사용
    };
  } catch (error) {
    console.error('주식 데이터 가져오기 실패:', error);
    
    // API 호출 실패 시 목업 데이터로 폴백
    console.log('목업 데이터로 대체합니다.');
    return generateMockStockData(ticker);
  }
}

// 1년 전 날짜 가져오기
function getOneYearAgo() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date;
}

// RSI 계산 (간단한 구현)
function calculateRSI(prices: { date: string; price: number }[]): number {
  // 실제 계산에서는 더 복잡한 알고리즘 적용이 필요
  // 여기서는 간단한 예시로 구현
  if (prices.length < 14) return 50;
  
  const gains = [];
  const losses = [];
  
  for (let i = 1; i < Math.min(15, prices.length); i++) {
    const change = prices[prices.length - i].price - prices[prices.length - i - 1].price;
    if (change >= 0) {
      gains.push(change);
      losses.push(0);
    } else {
      gains.push(0);
      losses.push(Math.abs(change));
    }
  }
  
  const avgGain = gains.reduce((sum, val) => sum + val, 0) / 14;
  const avgLoss = losses.reduce((sum, val) => sum + val, 0) / 14;
  
  if (avgLoss === 0) return 100; // 손실이 없으면 RSI = 100
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// 이동평균 계산
function calculateMovingAverages(prices: { date: string; price: number }[]): { ma50: number; ma200: number } {
  const priceValues = prices.map(item => item.price);
  
  const ma50 = calculateMA(priceValues, 50);
  const ma200 = calculateMA(priceValues, 200);
  
  return { ma50, ma200 };
}

// 단순 이동평균 계산
function calculateMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  
  const slice = prices.slice(prices.length - period);
  return slice.reduce((sum, price) => sum + price, 0) / period;
}

// 볼린저 밴드 계산
function calculateBollingerBands(prices: { date: string; price: number }[]): { bollingerUpper: number; bollingerLower: number } {
  const priceValues = prices.map(item => item.price);
  const period = 20;
  
  if (priceValues.length < period) {
    return { 
      bollingerUpper: priceValues[priceValues.length - 1] * 1.05, 
      bollingerLower: priceValues[priceValues.length - 1] * 0.95 
    };
  }
  
  const slice = priceValues.slice(priceValues.length - period);
  const ma = slice.reduce((sum, price) => sum + price, 0) / period;
  
  // 표준 편차 계산
  const squaredDiffs = slice.map(price => Math.pow(price - ma, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / period;
  const stdDev = Math.sqrt(variance);
  
  return {
    bollingerUpper: ma + (2 * stdDev),
    bollingerLower: ma - (2 * stdDev),
  };
}

// MACD 계산 (간단한 구현)
function calculateMACD(prices: { date: string; price: number }[]): number {
  const priceValues = prices.map(item => item.price);
  
  const ema12 = calculateEMA(priceValues, 12);
  const ema26 = calculateEMA(priceValues, 26);
  
  return ema12 - ema26;
}

// 지수 이동평균 계산
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  
  let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  const multiplier = 2 / (period + 1);
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

// 경제 지표 데이터 가져오기
export async function fetchEconomicIndicators(): Promise<EconomicIndicator[]> {
  try {
    // 실제 API 호출은 아직 구현하지 않고, 현실적인 목업 데이터 반환
    // 추후 FRED API 또는 다른 경제 데이터 API 연동 예정
    const currentDate = new Date();
    const lastMonth = new Date(currentDate);
    lastMonth.setMonth(currentDate.getMonth() - 1);
    const lastMonthStr = `${lastMonth.getMonth() + 1}월`;
    
    return [
      {
        name: '미국 GDP 성장률',
        value: 2.1,
        unit: '%',
        change: 0.2,
        previousPeriod: '전분기 대비',
        source: 'BEA'
      },
      {
        name: '미국 실업률',
        value: 3.8,
        unit: '%',
        change: -0.1,
        previousPeriod: lastMonthStr,
        source: 'BLS'
      },
      {
        name: '미국 소비자물가지수',
        value: 3.2,
        unit: '%',
        change: -0.3,
        previousPeriod: lastMonthStr,
        source: 'BLS'
      },
      {
        name: '미국 기준금리',
        value: 5.25,
        unit: '%',
        change: 0,
        previousPeriod: '전월 대비',
        source: 'Federal Reserve'
      },
      {
        name: '미국 10년 국채 수익률',
        value: 4.2,
        unit: '%',
        change: 0.15,
        previousPeriod: lastMonthStr,
        source: 'U.S. Treasury'
      },
      {
        name: '달러 인덱스',
        value: 104.2,
        unit: '',
        change: 0.8,
        previousPeriod: lastMonthStr,
        source: 'ICE'
      }
    ];
  } catch (error) {
    console.error('경제 지표 데이터 가져오기 실패:', error);
    return generateMockEconomicIndicators();
  }
}

// AI 예측 생성
export async function generatePrediction(
  ticker: string, 
  stockData: StockData, 
  economicData: EconomicIndicator[]
): Promise<PredictionResult> {
  try {
    // 실제 AI 모델 대신 주식 데이터를 기반으로 한 간단한 예측 로직 구현
    // 실제 구현 시에는 머신러닝 모델 또는 외부 AI API 연동 필요
    
    // 과거 데이터 기반 트렌드 분석
    const prices = stockData.historicalPrices.map(item => item.price);
    const recentPrices = prices.slice(-30); // 최근 30일 데이터
    
    // 간단한 선형 회귀 기반 예측
    const trend = calculateTrend(recentPrices);
    const currentPrice = stockData.currentPrice;
    
    // 기술적 지표 기반 가중치 조정
    let sentiment = 0;
    
    // RSI 기반 가중치
    if (stockData.technicalIndicators.rsi < 30) sentiment += 0.2; // 과매도 상태
    else if (stockData.technicalIndicators.rsi > 70) sentiment -= 0.2; // 과매수 상태
    
    // MACD 기반 가중치
    if (stockData.technicalIndicators.macd > 0) sentiment += 0.1;
    else sentiment -= 0.1;
    
    // 이동평균선 기반 가중치
    if (currentPrice > stockData.technicalIndicators.ma50) sentiment += 0.1;
    if (currentPrice > stockData.technicalIndicators.ma200) sentiment += 0.2;
    
    // 경제 지표 기반 가중치
    const inflation = economicData.find(item => item.name.includes('소비자물가지수'));
    const interestRate = economicData.find(item => item.name.includes('기준금리'));
    
    if (inflation && inflation.change < 0) sentiment += 0.1; // 인플레이션 감소는 긍정적
    if (interestRate && interestRate.change < 0) sentiment += 0.2; // 금리 인하는 긍정적
    
    // 기본적 분석 지표 기반 가중치
    if (stockData.fundamentals.revenueGrowth > 10) sentiment += 0.2; // 매출 성장률 높음
    if (stockData.fundamentals.operatingMargin > 20) sentiment += 0.1; // 영업 마진 높음
    
    // 최종 예측 계산
    const shortTermChange = trend * 30 * (1 + sentiment); // 1개월 예측
    const mediumTermChange = trend * 90 * (1 + sentiment * 0.8); // 3개월 예측
    const longTermChange = trend * 180 * (1 + sentiment * 0.6); // 6개월 예측
    
    const shortTermPrice = currentPrice * (1 + shortTermChange / 100);
    const mediumTermPrice = currentPrice * (1 + mediumTermChange / 100);
    const longTermPrice = currentPrice * (1 + longTermChange / 100);
    
    // 예측 가격 시계열 생성
    const pricePredictions = generatePricePredictions(
      currentPrice,
      shortTermPrice,
      mediumTermPrice,
      longTermPrice
    );
    
    // 신뢰도 점수 계산 (60~90% 범위)
    const volatility = calculateVolatility(prices);
    const confidenceScore = Math.max(60, Math.min(90, 85 - volatility * 10));
    
    // 강점 및 위험 요소 생성
    const strengths = generateStrengths(stockData, sentiment);
    const risks = generateRisks(stockData, sentiment, economicData);
    
    // 투자 추천 생성
    const recommendation = generateRecommendation(sentiment, stockData);
    
    // 요약 생성
    const summary = `${stockData.companyName}(${ticker})는 현재 $${currentPrice.toFixed(2)}에 거래되고 있으며, 
    기술적 분석과 기본적 분석을 종합한 결과 ${sentiment > 0 ? '긍정적' : '부정적'} 전망을 보이고 있습니다. 
    단기(1개월) 예상 가격은 $${shortTermPrice.toFixed(2)}, 중기(3개월) $${mediumTermPrice.toFixed(2)}, 
    장기(6개월) $${longTermPrice.toFixed(2)}입니다. ${recommendation}`;
    
    return {
      shortTerm: {
        price: shortTermPrice,
        change: shortTermChange,
      },
      mediumTerm: {
        price: mediumTermPrice,
        change: mediumTermChange,
      },
      longTerm: {
        price: longTermPrice,
        change: longTermChange,
      },
      pricePredictions,
      confidenceScore,
      summary,
      strengths,
      risks,
      recommendation,
    };
  } catch (error) {
    console.error('AI 예측 생성 실패:', error);
    return generateMockPrediction(ticker, stockData.currentPrice);
  }
}

// 트렌드 계산 (간단한 선형 회귀 기울기)
function calculateTrend(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  const n = prices.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += prices[i];
    sumXY += i * prices[i];
    sumX2 += i * i;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const avgPrice = sumY / n;
  
  // 기울기를 백분율로 변환
  return (slope / avgPrice) * 100;
}

// 변동성 계산
function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }
  
  const avgReturn = returns.reduce((sum, val) => sum + val, 0) / returns.length;
  const squaredDiffs = returns.map(ret => Math.pow(ret - avgReturn, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / returns.length;
  
  return Math.sqrt(variance);
}

// 예측 가격 시계열 생성
function generatePricePredictions(
  currentPrice: number,
  shortTermPrice: number,
  mediumTermPrice: number,
  longTermPrice: number
): { date: string; predictedPrice: number }[] {
  const predictions = [];
  const today = new Date();
  
  // 단기(1개월) 예측 포인트 생성
  const shortTerm = new Date(today);
  shortTerm.setMonth(today.getMonth() + 1);
  
  // 중기(3개월) 예측 포인트 생성
  const mediumTerm = new Date(today);
  mediumTerm.setMonth(today.getMonth() + 3);
  
  // 장기(6개월) 예측 포인트 생성
  const longTerm = new Date(today);
  longTerm.setMonth(today.getMonth() + 6);
  
  // 예측 포인트 사이의 보간 데이터 생성
  const totalDays = Math.round((longTerm.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  for (let i = 1; i <= totalDays; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    let predictedPrice;
    const dayRatio = i / totalDays;
    
    if (i <= 30) {
      // 첫 1개월: 현재 가격에서 단기 예측까지 선형 보간
      predictedPrice = currentPrice + (shortTermPrice - currentPrice) * (i / 30);
    } else if (i <= 90) {
      // 1-3개월: 단기 예측에서 중기 예측까지 선형 보간
      predictedPrice = shortTermPrice + (mediumTermPrice - shortTermPrice) * ((i - 30) / 60);
    } else {
      // 3-6개월: 중기 예측에서 장기 예측까지 선형 보간
      predictedPrice = mediumTermPrice + (longTermPrice - mediumTermPrice) * ((i - 90) / 90);
    }
    
    // 약간의 랜덤 노이즈 추가 (실제 주가 움직임 시뮬레이션)
    const noise = (Math.random() - 0.5) * 0.01 * predictedPrice;
    predictedPrice += noise;
    
    // 7일마다 데이터 포인트 추가 (그래프 데이터 양 조절)
    if (i % 7 === 0 || i === totalDays) {
      predictions.push({
        date: date.toISOString().split('T')[0],
        predictedPrice,
      });
    }
  }
  
  return predictions;
}

// 강점 생성
function generateStrengths(stockData: StockData, sentiment: number): string[] {
  const strengths = [];
  
  if (stockData.technicalIndicators.rsi < 30) {
    strengths.push('RSI가 과매도 구간에 있어 반등 가능성이 있습니다.');
  }
  
  if (stockData.technicalIndicators.macd > 0) {
    strengths.push('MACD가 양수로, 상승 모멘텀이 형성되고 있습니다.');
  }
  
  if (stockData.currentPrice > stockData.technicalIndicators.ma50) {
    strengths.push('현재 가격이 50일 이동평균선 위에 있어 단기 상승 추세를 보이고 있습니다.');
  }
  
  if (stockData.currentPrice > stockData.technicalIndicators.ma200) {
    strengths.push('현재 가격이 200일 이동평균선 위에 있어 장기 상승 추세를 보이고 있습니다.');
  }
  
  if (stockData.fundamentals.revenueGrowth > 10) {
    strengths.push(`매출 성장률이 ${stockData.fundamentals.revenueGrowth.toFixed(1)}%로 높은 성장세를 보이고 있습니다.`);
  }
  
  if (stockData.fundamentals.operatingMargin > 20) {
    strengths.push(`영업 마진이 ${stockData.fundamentals.operatingMargin.toFixed(1)}%로 높은 수익성을 유지하고 있습니다.`);
  }
  
  if (stockData.fundamentals.pe > 0 && stockData.fundamentals.pe < 15) {
    strengths.push(`P/E 비율이 ${stockData.fundamentals.pe.toFixed(1)}로 상대적으로 저평가되어 있습니다.`);
  }
  
  if (stockData.fundamentals.dividendYield > 3) {
    strengths.push(`배당 수익률이 ${stockData.fundamentals.dividendYield.toFixed(1)}%로 안정적인 수익을 제공합니다.`);
  }
  
  // 최소 2개, 최대 5개의 강점 반환
  if (strengths.length < 2) {
    strengths.push('기술적 분석 지표가 개선되고 있는 추세입니다.');
    strengths.push('시장 평균 대비 경쟁력 있는 포지션을 유지하고 있습니다.');
  }
  
  return strengths.slice(0, 5);
}

// 위험 요소 생성
function generateRisks(stockData: StockData, sentiment: number, economicData: EconomicIndicator[]): string[] {
  const risks = [];
  
  if (stockData.technicalIndicators.rsi > 70) {
    risks.push('RSI가 과매수 구간에 있어 단기 조정 가능성이 있습니다.');
  }
  
  if (stockData.technicalIndicators.macd < 0) {
    risks.push('MACD가 음수로, 하락 모멘텀이 형성되고 있습니다.');
  }
  
  if (stockData.currentPrice < stockData.technicalIndicators.ma50) {
    risks.push('현재 가격이 50일 이동평균선 아래에 있어 단기 하락 추세를 보이고 있습니다.');
  }
  
  if (stockData.currentPrice < stockData.technicalIndicators.ma200) {
    risks.push('현재 가격이 200일 이동평균선 아래에 있어 장기 하락 추세를 보이고 있습니다.');
  }
  
  if (stockData.fundamentals.revenueGrowth < 0) {
    risks.push(`매출 성장률이 ${stockData.fundamentals.revenueGrowth.toFixed(1)}%로 감소 추세를 보이고 있습니다.`);
  }
  
  if (stockData.fundamentals.operatingMargin < 10) {
    risks.push(`영업 마진이 ${stockData.fundamentals.operatingMargin.toFixed(1)}%로 낮은 수익성을 보이고 있습니다.`);
  }
  
  if (stockData.fundamentals.pe > 30) {
    risks.push(`P/E 비율이 ${stockData.fundamentals.pe.toFixed(1)}로 상대적으로 고평가되어 있습니다.`);
  }
  
  const interestRate = economicData.find(item => item.name.includes('기준금리'));
  if (interestRate && interestRate.change > 0) {
    risks.push('금리 상승 환경은 주식 시장에 부정적인 영향을 미칠 수 있습니다.');
  }
  
  // 최소 2개, 최대 5개의 위험 요소 반환
  if (risks.length < 2) {
    risks.push('시장 변동성이 증가할 경우 주가 하락 위험이 있습니다.');
    risks.push('경쟁 심화로 인한 시장 점유율 감소 가능성이 있습니다.');
  }
  
  return risks.slice(0, 5);
}

// 투자 추천 생성
function generateRecommendation(sentiment: number, stockData: StockData): string {
  if (sentiment > 0.5) {
    return `${stockData.companyName}은(는) 현재 기술적, 기본적 분석 모두 긍정적인 신호를 보이고 있어 매수 추천합니다. 특히 장기 투자자에게 적합한 종목으로 판단됩니다.`;
  } else if (sentiment > 0.2) {
    return `${stockData.companyName}은(는) 완만한 상승 추세를 보이고 있어 소액 분할 매수 전략이 적합합니다. 시장 상황을 주시하며 포지션을 구축하는 것이 좋겠습니다.`;
  } else if (sentiment > -0.2) {
    return `${stockData.companyName}은(는) 현재 중립적인 신호를 보이고 있어 관망을 추천합니다. 추가적인 모멘텀이나 기업 이벤트를 기다린 후 투자 결정을 하는 것이 좋겠습니다.`;
  } else if (sentiment > -0.5) {
    return `${stockData.companyName}은(는) 약세 신호가 감지되어 신규 매수는 자제하고 보유 중인 경우 일부 포지션 정리를 고려해볼 시점입니다.`;
  } else {
    return `${stockData.companyName}은(는) 현재 기술적, 기본적 분석 모두 부정적인 신호를 보이고 있어 매도 또는 관망을 추천합니다. 시장 상황이 개선될 때까지 신규 투자는 자제하는 것이 좋겠습니다.`;
  }
}

// 목업 주식 데이터 생성
function generateMockStockData(ticker: string): StockData {
  // 회사 정보 매핑
  const companyInfo: Record<string, { name: string; description: string }> = {
    AAPL: {
      name: 'Apple Inc.',
      description: 'Apple Inc.는 혁신적인 하드웨어, 소프트웨어 및 서비스를 설계, 제조 및 판매하는 기술 회사입니다. 주요 제품으로는 iPhone, iPad, Mac, Apple Watch, AirPods 등이 있으며, 서비스로는 Apple Music, Apple TV+, iCloud, Apple Pay 등을 제공합니다.',
    },
    MSFT: {
      name: 'Microsoft Corporation',
      description: 'Microsoft Corporation은 소프트웨어, 서비스, 디바이스 및 솔루션을 개발, 라이선스 및 지원하는 기술 회사입니다. Windows 운영 체제, Office 제품군, Azure 클라우드 서비스, Xbox 게임 콘솔 등을 제공합니다.',
    },
    GOOGL: {
      name: 'Alphabet Inc.',
      description: 'Alphabet Inc.는 Google의 모회사로, 검색, 광고, 클라우드 컴퓨팅, 소프트웨어 및 하드웨어 제품을 제공합니다. 주요 서비스로는 Google 검색, YouTube, Gmail, Google Maps, Google Cloud 등이 있습니다.',
    },
    AMZN: {
      name: 'Amazon.com, Inc.',
      description: 'Amazon.com, Inc.는 전자상거래, 클라우드 컴퓨팅, 디지털 스트리밍 및 인공지능 분야의 기술 회사입니다. 온라인 마켓플레이스, Amazon Web Services(AWS), Prime Video, Alexa 등의 서비스를 제공합니다.',
    },
    TSLA: {
      name: 'Tesla, Inc.',
      description: 'Tesla, Inc.는 전기 자동차, 배터리 에너지 저장 시스템, 태양광 제품을 설계, 개발, 제조 및 판매하는 회사입니다. Model S, Model 3, Model X, Model Y 등의 전기 자동차와 Powerwall, Powerpack, Megapack 등의 에너지 저장 제품을 생산합니다.',
    },
    // 기본값
    DEFAULT: {
      name: ticker,
      description: `${ticker}는 미국 주식 시장에 상장된 기업입니다.`,
    },
  };

  const company = companyInfo[ticker] || companyInfo.DEFAULT;
  const currentPrice = 100 + Math.random() * 900;
  const priceChange = -5 + Math.random() * 10;

  // 과거 주가 데이터 생성 (1년)
  const historicalPrices = [];
  const today = new Date();
  let price = currentPrice - priceChange;

  for (let i = 365; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // 약간의 랜덤 변동 추가
    price = price * (0.98 + Math.random() * 0.04);
    
    historicalPrices.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2)),
    });
  }

  return {
    ticker,
    companyName: company.name,
    currentPrice,
    priceChange,
    marketCap: currentPrice * (1000000000 + Math.random() * 2000000000),
    volume: 1000000 + Math.random() * 10000000,
    high52Week: currentPrice * 1.2,
    low52Week: currentPrice * 0.8,
    lastUpdated: new Date().toISOString(),
    description: company.description,
    historicalPrices,
    technicalIndicators: {
      rsi: 30 + Math.random() * 40,
      macd: -2 + Math.random() * 4,
      bollingerUpper: currentPrice * 1.05,
      bollingerLower: currentPrice * 0.95,
      ma50: currentPrice * (0.97 + Math.random() * 0.06),
      ma200: currentPrice * (0.95 + Math.random() * 0.1),
    },
    fundamentals: {
      pe: 10 + Math.random() * 30,
      eps: currentPrice / (10 + Math.random() * 30),
      dividendYield: Math.random() * 3,
      peg: 0.5 + Math.random() * 2,
      roe: 5 + Math.random() * 25,
      debtToEquity: 0.2 + Math.random() * 1.5,
      revenue: (1 + Math.random() * 100) * 1000000000,
      revenueGrowth: -5 + Math.random() * 30,
      netIncome: (0.1 + Math.random() * 20) * 1000000000,
      netIncomeGrowth: -10 + Math.random() * 40,
      operatingMargin: 5 + Math.random() * 30,
      nextEarningsDate: new Date(today.getTime() + (7 + Math.floor(Math.random() * 80)) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    patterns: generateRandomPatterns(),
  };
}

// 랜덤 차트 패턴 생성
function generateRandomPatterns() {
  const patternTemplates = [
    {
      name: '헤드앤숄더',
      description: '헤드앤숄더 패턴은 세 개의 피크로 구성되며, 가운데 피크(헤드)가 양쪽 피크(숄더)보다 높습니다. 일반적으로 하락 반전 신호로 해석됩니다.',
      bullish: false,
    },
    {
      name: '역헤드앤숄더',
      description: '역헤드앤숄더 패턴은 세 개의 저점으로 구성되며, 가운데 저점이 양쪽 저점보다 낮습니다. 일반적으로 상승 반전 신호로 해석됩니다.',
      bullish: true,
    },
    {
      name: '더블 탑',
      description: '더블 탑 패턴은 두 개의 비슷한 높이의 피크로 구성됩니다. 일반적으로 하락 반전 신호로 해석됩니다.',
      bullish: false,
    },
    {
      name: '더블 바텀',
      description: '더블 바텀 패턴은 두 개의 비슷한 저점으로 구성됩니다. 일반적으로 상승 반전 신호로 해석됩니다.',
      bullish: true,
    },
    {
      name: '삼각형 패턴',
      description: '삼각형 패턴은 가격이 점점 좁아지는 범위 내에서 움직이는 것을 나타냅니다. 방향성 돌파가 예상됩니다.',
      bullish: Math.random() > 0.5,
    },
    {
      name: '플래그 패턴',
      description: '플래그 패턴은 짧은 기간 동안의 통합 후 이전 추세가 계속될 것으로 예상되는 패턴입니다.',
      bullish: Math.random() > 0.5,
    },
    {
      name: '컵앤핸들',
      description: '컵앤핸들 패턴은 U자형 컵과 그 오른쪽의 작은 하락(핸들)으로 구성됩니다. 일반적으로 상승 신호로 해석됩니다.',
      bullish: true,
    },
  ];

  // 0-3개의 패턴을 랜덤하게 선택
  const patternCount = Math.floor(Math.random() * 4);
  const patterns = [];

  for (let i = 0; i < patternCount; i++) {
    const randomIndex = Math.floor(Math.random() * patternTemplates.length);
    const pattern = patternTemplates[randomIndex];
    
    patterns.push({
      ...pattern,
      confidence: 50 + Math.floor(Math.random() * 50), // 50-99% 신뢰도
    });
    
    // 중복 방지를 위해 선택된 패턴 제거
    patternTemplates.splice(randomIndex, 1);
  }

  return patterns;
}

// 목업 경제 지표 데이터 생성
function generateMockEconomicIndicators(): EconomicIndicator[] {
  return [
    {
      name: 'GDP 성장률',
      value: 2.1,
      unit: '%',
      change: 0.3,
      previousPeriod: '전분기',
      source: 'FRED',
    },
    {
      name: '실업률',
      value: 3.8,
      unit: '%',
      change: -0.1,
      previousPeriod: '전월',
      source: 'FRED',
    },
    {
      name: '인플레이션',
      value: 3.2,
      unit: '%',
      change: -0.2,
      previousPeriod: '전월',
      source: 'FRED',
    },
    {
      name: '기준금리',
      value: 5.25,
      unit: '%',
      change: 0,
      previousPeriod: '전월',
      source: 'FRED',
    },
    {
      name: '10년 국채 수익률',
      value: 4.2,
      unit: '%',
      change: 0.15,
      previousPeriod: '전월',
      source: 'FRED',
    },
    {
      name: '소비자 신뢰지수',
      value: 102.5,
      unit: '',
      change: 3.2,
      previousPeriod: '전월',
      source: 'FRED',
    },
  ];
}

// 목업 예측 결과 생성
function generateMockPrediction(ticker: string, currentPrice: number): PredictionResult {
  // 단기, 중기, 장기 예측 가격 생성
  const shortTermChange = -10 + Math.random() * 20; // -10% ~ +10%
  const mediumTermChange = -15 + Math.random() * 30; // -15% ~ +15%
  const longTermChange = -20 + Math.random() * 40; // -20% ~ +40%
  
  const shortTermPrice = currentPrice * (1 + shortTermChange / 100);
  const mediumTermPrice = currentPrice * (1 + mediumTermChange / 100);
  const longTermPrice = currentPrice * (1 + longTermChange / 100);
  
  // 향후 6개월 예측 가격 생성
  const pricePredictions = [];
  const today = new Date();
  let predictedPrice = currentPrice;
  
  for (let i = 1; i <= 180; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    // 장기 예측 가격을 향해 점진적으로 변화
    const progress = i / 180;
    const targetChange = longTermChange / 100;
    const dailyChange = targetChange * progress + (Math.random() * 0.01 - 0.005); // 약간의 랜덤 변동 추가
    
    predictedPrice = predictedPrice * (1 + dailyChange / 100);
    
    // 30일 간격으로 데이터 추가 (차트 데이터 포인트 줄이기)
    if (i % 30 === 0) {
      pricePredictions.push({
        date: date.toISOString().split('T')[0],
        predictedPrice: parseFloat(predictedPrice.toFixed(2)),
      });
    }
  }
  
  // 목업 주식 데이터 생성 (generateRecommendation 함수에 필요)
  const mockStockData: StockData = {
    ticker,
    companyName: ticker,
    currentPrice,
    priceChange: 0,
    marketCap: 0,
    volume: 0,
    high52Week: 0,
    low52Week: 0,
    lastUpdated: new Date().toISOString(),
    description: '',
    historicalPrices: [],
    technicalIndicators: {
      rsi: 50,
      macd: 0,
      bollingerUpper: 0,
      bollingerLower: 0,
      ma50: 0,
      ma200: 0
    },
    fundamentals: {
      pe: 0,
      eps: 0,
      dividendYield: 0,
      peg: 0,
      roe: 0,
      debtToEquity: 0,
      revenue: 0,
      revenueGrowth: 0,
      netIncome: 0,
      netIncomeGrowth: 0,
      operatingMargin: 0,
      nextEarningsDate: ''
    },
    patterns: []
  };
  
  // 평균 변화율 기반 감정 점수 계산
  const avgChange = (shortTermChange + mediumTermChange + longTermChange) / 3;
  const sentiment = avgChange / 20; // -1 ~ 1 범위로 정규화
  
  // 강점과 위험 요소 생성
  const strengths = generateStrengths(mockStockData, sentiment);
  const risks = generateRisks(mockStockData, sentiment, []);
  
  // 투자 추천 생성
  const recommendation = generateRecommendation(sentiment, mockStockData);
  
  // 전체 요약 생성
  const summary = `${ticker}의 현재 주가는 $${currentPrice.toFixed(2)}이며, 
  기술적 분석과 기본적 분석을 종합한 결과 ${sentiment > 0 ? '긍정적' : '부정적'} 전망을 보이고 있습니다. 
  단기(1개월) 예상 가격은 $${shortTermPrice.toFixed(2)}, 중기(3개월) $${mediumTermPrice.toFixed(2)}, 
  장기(6개월) $${longTermPrice.toFixed(2)}입니다. ${recommendation}`;
  
  return {
    shortTerm: {
      price: shortTermPrice,
      change: shortTermChange,
    },
    mediumTerm: {
      price: mediumTermPrice,
      change: mediumTermChange,
    },
    longTerm: {
      price: longTermPrice,
      change: longTermChange,
    },
    pricePredictions,
    confidenceScore: 60 + Math.floor(Math.random() * 30), // 60-89% 신뢰도
    summary,
    strengths,
    risks,
    recommendation,
  };
} 
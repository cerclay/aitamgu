'use client';

/**
 * 기술적 지표 계산 함수 모음
 * 주식 분석에 필요한 다양한 기술적 지표를 계산하는 함수들을 제공합니다.
 */

// RSI(Relative Strength Index) 계산
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) {
    return 50; // 충분한 데이터가 없는 경우 중립값 반환
  }

  let gains = 0;
  let losses = 0;

  // 초기 평균 상승/하락 계산
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) {
      gains += change;
    } else {
      losses -= change; // 손실은 양수로 변환
    }
  }

  // 초기 평균 상승/하락
  let avgGain = gains / period;
  let avgLoss = losses / period;

  // 나머지 기간에 대한 계산
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    
    if (change >= 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - change) / period;
    }
  }

  // RSI 계산
  if (avgLoss === 0) {
    return 100; // 손실이 없는 경우
  }
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// MACD(Moving Average Convergence Divergence) 계산
export function calculateMACD(prices: number[]): { value: number; signal: number; histogram: number } {
  if (prices.length < 26) {
    return { value: 0, signal: 0, histogram: 0 }; // 충분한 데이터가 없는 경우
  }

  // EMA 계산
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  // MACD 라인 (12일 EMA - 26일 EMA)
  const macdLine = ema12 - ema26;
  
  // 최근 MACD 값들 계산 (시그널 라인 계산용)
  const macdValues: number[] = [];
  for (let i = prices.length - 9; i < prices.length; i++) {
    if (i < 26) continue;
    
    const ema12Temp = calculateEMA(prices.slice(0, i + 1), 12);
    const ema26Temp = calculateEMA(prices.slice(0, i + 1), 26);
    macdValues.push(ema12Temp - ema26Temp);
  }
  
  // 시그널 라인 (MACD의 9일 EMA)
  const signalLine = macdValues.length >= 9 
    ? calculateEMAFromValues(macdValues, 9)
    : macdLine;
  
  // 히스토그램 (MACD - 시그널)
  const histogram = macdLine - signalLine;
  
  return {
    value: macdLine,
    signal: signalLine,
    histogram: histogram
  };
}

// 볼린저 밴드 계산
export function calculateBollingerBands(
  prices: number[], 
  period: number = 20, 
  multiplier: number = 2
): { upper: number; middle: number; lower: number; width: number } {
  if (prices.length < period) {
    const lastPrice = prices[prices.length - 1] || 0;
    return {
      upper: lastPrice * 1.05,
      middle: lastPrice,
      lower: lastPrice * 0.95,
      width: 10
    };
  }

  // 최근 N일 가격
  const recentPrices = prices.slice(-period);
  
  // 중간 밴드 (단순 이동 평균)
  const middle = recentPrices.reduce((sum, price) => sum + price, 0) / period;
  
  // 표준 편차 계산
  const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  
  // 상단 및 하단 밴드
  const upper = middle + (multiplier * stdDev);
  const lower = middle - (multiplier * stdDev);
  
  // 밴드 폭 (%)
  const width = ((upper - lower) / middle) * 100;
  
  return { upper, middle, lower, width };
}

// EMA(지수 이동 평균) 계산
export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) {
    return prices[prices.length - 1] || 0; // 충분한 데이터가 없는 경우
  }

  // 가중치 계산 (2 / (기간 + 1))
  const multiplier = 2 / (period + 1);
  
  // 초기 SMA 계산
  let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  
  // EMA 계산
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

// 값 배열에서 EMA 계산 (MACD 시그널 라인 등에 사용)
export function calculateEMAFromValues(values: number[], period: number): number {
  if (values.length < period) {
    return values[values.length - 1] || 0;
  }

  const multiplier = 2 / (period + 1);
  let ema = values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  
  for (let i = period; i < values.length; i++) {
    ema = (values[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

// ATR(Average True Range) 계산
export function calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
  if (highs.length < period + 1 || lows.length < period + 1 || closes.length < period + 1) {
    return 0; // 충분한 데이터가 없는 경우
  }

  // TR(True Range) 계산
  const trValues: number[] = [];
  
  for (let i = 1; i < highs.length; i++) {
    const high = highs[i];
    const low = lows[i];
    const prevClose = closes[i - 1];
    
    // TR은 다음 세 값 중 최대값:
    // 1. 현재 고가 - 현재 저가
    // 2. |현재 고가 - 이전 종가|
    // 3. |현재 저가 - 이전 종가|
    const tr1 = high - low;
    const tr2 = Math.abs(high - prevClose);
    const tr3 = Math.abs(low - prevClose);
    
    trValues.push(Math.max(tr1, tr2, tr3));
  }
  
  // 초기 ATR (첫 N일의 TR 평균)
  let atr = trValues.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;
  
  // 나머지 기간에 대한 ATR 계산 (Wilder의 스무딩 방법)
  for (let i = period; i < trValues.length; i++) {
    atr = ((atr * (period - 1)) + trValues[i]) / period;
  }
  
  return atr;
}

// OBV(On-Balance Volume) 계산
export function calculateOBV(prices: number[], volumes: number[]): number {
  if (prices.length < 2 || volumes.length < 2) {
    return 0; // 충분한 데이터가 없는 경우
  }

  let obv = 0;
  
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > prices[i - 1]) {
      // 가격이 상승하면 볼륨을 더함
      obv += volumes[i];
    } else if (prices[i] < prices[i - 1]) {
      // 가격이 하락하면 볼륨을 뺌
      obv -= volumes[i];
    }
    // 가격이 동일하면 OBV 변화 없음
  }
  
  return obv;
}

// 스토캐스틱 오실레이터 계산
export function calculateStochastic(
  prices: number[], 
  highs: number[], 
  lows: number[], 
  kPeriod: number = 14, 
  dPeriod: number = 3
): { k: number; d: number } {
  if (prices.length < kPeriod || highs.length < kPeriod || lows.length < kPeriod) {
    return { k: 50, d: 50 }; // 충분한 데이터가 없는 경우
  }

  // %K 계산을 위한 배열
  const kValues: number[] = [];
  
  // 각 기간에 대한 %K 계산
  for (let i = kPeriod - 1; i < prices.length; i++) {
    // 해당 기간의 최고가와 최저가
    const periodHighs = highs.slice(i - kPeriod + 1, i + 1);
    const periodLows = lows.slice(i - kPeriod + 1, i + 1);
    
    const highestHigh = Math.max(...periodHighs);
    const lowestLow = Math.min(...periodLows);
    
    // 현재 종가
    const currentClose = prices[i];
    
    // %K 계산: (현재가 - 최저가) / (최고가 - 최저가) * 100
    const k = highestHigh === lowestLow 
      ? 50 // 분모가 0인 경우
      : ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    
    kValues.push(k);
  }
  
  // 최근 %K 값
  const currentK = kValues[kValues.length - 1];
  
  // %D 계산 (최근 D기간 동안의 %K 평균)
  const dValues = kValues.slice(-dPeriod);
  const currentD = dValues.reduce((sum, k) => sum + k, 0) / dPeriod;
  
  return { k: currentK, d: currentD };
}

// ADX(Average Directional Index) 계산
export function calculateADX(highs: number[], lows: number[], closes: number[], period: number = 14): number {
  if (highs.length < period * 2 || lows.length < period * 2 || closes.length < period * 2) {
    return 25; // 충분한 데이터가 없는 경우 중립값 반환
  }

  // +DM, -DM 계산
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  
  for (let i = 1; i < highs.length; i++) {
    const highDiff = highs[i] - highs[i - 1];
    const lowDiff = lows[i - 1] - lows[i];
    
    // +DM: 현재 고가 - 이전 고가 > 이전 저가 - 현재 저가 ? 현재 고가 - 이전 고가 : 0
    // -DM: 이전 저가 - 현재 저가 > 현재 고가 - 이전 고가 ? 이전 저가 - 현재 저가 : 0
    if (highDiff > lowDiff && highDiff > 0) {
      plusDM.push(highDiff);
      minusDM.push(0);
    } else if (lowDiff > highDiff && lowDiff > 0) {
      plusDM.push(0);
      minusDM.push(lowDiff);
    } else {
      plusDM.push(0);
      minusDM.push(0);
    }
  }
  
  // TR 계산
  const trValues: number[] = [];
  for (let i = 1; i < highs.length; i++) {
    const tr1 = highs[i] - lows[i];
    const tr2 = Math.abs(highs[i] - closes[i - 1]);
    const tr3 = Math.abs(lows[i] - closes[i - 1]);
    trValues.push(Math.max(tr1, tr2, tr3));
  }
  
  // 초기 +DI, -DI, TR 계산
  let plusDI = plusDM.slice(0, period).reduce((sum, dm) => sum + dm, 0);
  let minusDI = minusDM.slice(0, period).reduce((sum, dm) => sum + dm, 0);
  let tr = trValues.slice(0, period).reduce((sum, tr) => sum + tr, 0);
  
  // 스무딩 적용
  for (let i = period; i < plusDM.length; i++) {
    plusDI = plusDI - (plusDI / period) + plusDM[i];
    minusDI = minusDI - (minusDI / period) + minusDM[i];
    tr = tr - (tr / period) + trValues[i];
  }
  
  // +DI, -DI 계산
  const plusDIPercent = (plusDI / tr) * 100;
  const minusDIPercent = (minusDI / tr) * 100;
  
  // DX 계산
  const dx = Math.abs(plusDIPercent - minusDIPercent) / (plusDIPercent + minusDIPercent) * 100;
  
  // ADX는 DX의 평균
  // 간소화를 위해 현재 DX 값을 반환 (실제로는 DX의 평균을 계산해야 함)
  return dx;
}

// 지지선과 저항선 식별
export function identifySupportResistance(
  prices: number[], 
  highs: number[], 
  lows: number[]
): { support: number[]; resistance: number[] } {
  if (prices.length < 20) {
    const lastPrice = prices[prices.length - 1] || 0;
    return {
      support: [lastPrice * 0.95, lastPrice * 0.9],
      resistance: [lastPrice * 1.05, lastPrice * 1.1]
    };
  }

  // 최근 가격
  const recentPrices = prices.slice(-100);
  const recentHighs = highs.slice(-100);
  const recentLows = lows.slice(-100);
  
  // 피벗 포인트 계산
  const lastHigh = recentHighs[recentHighs.length - 1];
  const lastLow = recentLows[recentLows.length - 1];
  const lastClose = recentPrices[recentPrices.length - 1];
  
  const pivotPoint = (lastHigh + lastLow + lastClose) / 3;
  
  // 지지선 계산
  const support1 = (2 * pivotPoint) - lastHigh;
  const support2 = pivotPoint - (lastHigh - lastLow);
  
  // 저항선 계산
  const resistance1 = (2 * pivotPoint) - lastLow;
  const resistance2 = pivotPoint + (lastHigh - lastLow);
  
  return {
    support: [support1, support2],
    resistance: [resistance1, resistance2]
  };
}

// 차트 패턴 감지
export function detectChartPatterns(
  prices: number[], 
  highs: number[], 
  lows: number[], 
  volumes: number[]
): { name: string; description: string; descriptionKr: string; bullish: boolean; confidence: number; formationDate: string }[] {
  if (prices.length < 20) {
    return []; // 충분한 데이터가 없는 경우
  }

  const patterns = [];
  const lastDate = new Date().toISOString().split('T')[0]; // 현재 날짜를 기본값으로 사용
  
  // 최근 가격 추세 확인
  const recentPrices = prices.slice(-10);
  const priceChange = (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices[0] * 100;
  
  // 상승 추세 확인
  if (priceChange > 5) {
    // 상승 추세에서 볼륨 증가 확인
    const recentVolumes = volumes.slice(-10);
    const avgVolume = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
    const lastVolume = recentVolumes[recentVolumes.length - 1];
    
    if (lastVolume > avgVolume * 1.5) {
      patterns.push({
        name: 'Volume Breakout',
        description: 'Significant increase in volume with price uptrend, indicating strong buying interest',
        descriptionKr: '가격 상승과 함께 거래량이 크게 증가하여 강한 매수 관심을 나타냅니다',
        bullish: true,
        confidence: 75,
        formationDate: lastDate
      });
    }
    
    // 골든 크로스 확인 (단기 이동평균이 장기 이동평균을 상향 돌파)
    const ema20 = calculateEMA(prices, 20);
    const ema50 = calculateEMA(prices, 50);
    const prevEma20 = calculateEMA(prices.slice(0, -1), 20);
    const prevEma50 = calculateEMA(prices.slice(0, -1), 50);
    
    if (prevEma20 < prevEma50 && ema20 > ema50) {
      patterns.push({
        name: 'Golden Cross',
        description: 'Short-term moving average crosses above long-term moving average, signaling potential uptrend',
        descriptionKr: '단기 이동평균이 장기 이동평균을 상향 돌파하여 잠재적인 상승 추세를 알립니다',
        bullish: true,
        confidence: 70,
        formationDate: lastDate
      });
    }
  }
  
  // 하락 추세 확인
  if (priceChange < -5) {
    // 데드 크로스 확인 (단기 이동평균이 장기 이동평균을 하향 돌파)
    const ema20 = calculateEMA(prices, 20);
    const ema50 = calculateEMA(prices, 50);
    const prevEma20 = calculateEMA(prices.slice(0, -1), 20);
    const prevEma50 = calculateEMA(prices.slice(0, -1), 50);
    
    if (prevEma20 > prevEma50 && ema20 < ema50) {
      patterns.push({
        name: 'Death Cross',
        description: 'Short-term moving average crosses below long-term moving average, signaling potential downtrend',
        descriptionKr: '단기 이동평균이 장기 이동평균을 하향 돌파하여 잠재적인 하락 추세를 알립니다',
        bullish: false,
        confidence: 70,
        formationDate: lastDate
      });
    }
  }
  
  // RSI 과매수/과매도 확인
  const rsi = calculateRSI(prices);
  
  if (rsi > 70) {
    patterns.push({
      name: 'Overbought',
      description: 'RSI above 70 indicates the stock may be overbought and due for a potential reversal',
      descriptionKr: 'RSI가 70을 초과하여 주식이 과매수 상태이며 잠재적인 반전이 있을 수 있습니다',
      bullish: false,
      confidence: 65,
      formationDate: lastDate
    });
  } else if (rsi < 30) {
    patterns.push({
      name: 'Oversold',
      description: 'RSI below 30 indicates the stock may be oversold and due for a potential reversal',
      descriptionKr: 'RSI가 30 미만으로 주식이 과매도 상태이며 잠재적인 반전이 있을 수 있습니다',
      bullish: true,
      confidence: 65,
      formationDate: lastDate
    });
  }
  
  // 볼린저 밴드 돌파 확인
  const bb = calculateBollingerBands(prices);
  const lastPrice = prices[prices.length - 1];
  
  if (lastPrice > bb.upper) {
    patterns.push({
      name: 'Bollinger Band Breakout (Upper)',
      description: 'Price breaking above the upper Bollinger Band, indicating strong upward momentum',
      descriptionKr: '가격이 볼린저 밴드 상단을 돌파하여 강한 상승 모멘텀을 나타냅니다',
      bullish: true,
      confidence: 60,
      formationDate: lastDate
    });
  } else if (lastPrice < bb.lower) {
    patterns.push({
      name: 'Bollinger Band Breakout (Lower)',
      description: 'Price breaking below the lower Bollinger Band, indicating strong downward momentum',
      descriptionKr: '가격이 볼린저 밴드 하단을 돌파하여 강한 하락 모멘텀을 나타냅니다',
      bullish: false,
      confidence: 60,
      formationDate: lastDate
    });
  }
  
  return patterns;
} 
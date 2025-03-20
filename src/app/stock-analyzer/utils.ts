// 차트 패턴 설명 함수
export function getPatternDescription(pattern: string): string {
  const patternDescriptions: { [key: string]: string } = {
    "상승 추세": "최근 주가가 지속적으로 상승하고 있는 추세를 보이고 있습니다. 매수 기회를 고려해볼 수 있습니다.",
    "하락 추세": "최근 주가가 지속적으로 하락하고 있는 추세를 보이고 있습니다. 추가 하락 가능성에 주의하세요.",
    "골든 크로스 형성됨": "단기 이동평균선(MA50)이 장기 이동평균선(MA200)을 상향 돌파했습니다. 이는 강한 상승 신호로 간주됩니다.",
    "데드 크로스 형성됨": "단기 이동평균선(MA50)이 장기 이동평균선(MA200)을 하향 돌파했습니다. 이는 강한 하락 신호로 간주됩니다.",
    "높은 변동성": "최근 주가의 변동성이 매우 높습니다. 투자시 위험 관리에 특별히 주의하세요.",
    "낮은 변동성": "최근 주가의 변동성이 낮습니다. 큰 가격 변동 없이 안정적으로 움직이고 있습니다.",
    "거래량 급증": "최근 거래량이 평소보다 크게 증가했습니다. 이는 중요한 가격 움직임의 신호일 수 있습니다.",
    "지지선 근처에서 거래 중": "현재 주가가 주요 지지선 근처에서 거래되고 있습니다. 바닥을 형성하고 반등할 가능성이 있습니다.",
    "저항선 근처에서 거래 중": "현재 주가가 주요 저항선 근처에서 거래되고 있습니다. 돌파 실패 시 하락할 수 있으니 주의하세요.",
    "이중 바닥 패턴": "주가 차트에서 W자 형태의 이중 바닥 패턴이 관찰됩니다. 상승 반전의 신호일 수 있습니다.",
    "이중 천정 패턴": "주가 차트에서 M자 형태의 이중 천정 패턴이 관찰됩니다. 하락 반전의 신호일 수 있습니다.",
    "헤드앤숄더 패턴": "주가 차트에서 헤드앤숄더 패턴이 형성되고 있습니다. 이는 상승 추세의 반전을 의미하는 약세 신호입니다.",
    "역헤드앤숄더 패턴": "주가 차트에서 역헤드앤숄더 패턴이 형성되고 있습니다. 이는 하락 추세의 반전을 의미하는 강세 신호입니다.",
    "삼각수렴 패턴": "주가 움직임이 점점 좁아지는 삼각형 형태로 수렴하고 있습니다. 곧 큰 움직임이 있을 수 있습니다.",
    "상승 플래그": "짧은 하락 조정 후 상승 추세가 계속될 가능성이 높습니다. 기술적으로 강세 신호입니다.",
    "하락 플래그": "짧은 상승 조정 후 하락 추세가 계속될 가능성이 높습니다. 기술적으로 약세 신호입니다.",
    "갭업": "주가가 전일 종가보다 높은 가격에서 개장했습니다. 강한 상승 모멘텀을 나타냅니다.",
    "갭다운": "주가가 전일 종가보다 낮은 가격에서 개장했습니다. 강한 하락 모멘텀을 나타냅니다.",
    "볼린저밴드 상단 돌파": "주가가 볼린저 밴드 상단을 돌파했습니다. 과매수 상태일 수 있으니 주의하세요.",
    "볼린저밴드 하단 돌파": "주가가 볼린저 밴드 하단을 돌파했습니다. 과매도 상태로 반등 가능성이 있습니다.",
    "컵앤핸들 패턴": "주가 차트에서 컵과 손잡이 모양의 패턴이 형성되고 있습니다. 이는 상승세 지속의 신호입니다.",
    "RSI 과매수": "RSI 지표가 70을 넘어 과매수 구간에 진입했습니다. 조정 가능성에 주의하세요.",
    "RSI 과매도": "RSI 지표가 30 미만으로 과매도 구간에 진입했습니다. 반등 가능성이 높아지고 있습니다.",
    "데이터 부족": "충분한 가격 데이터가 없어 차트 패턴 분석이 제한적입니다. 더 많은 데이터가 필요합니다.",
  };

  return patternDescriptions[pattern] || 
    "이 패턴은 주가의 특정 움직임을 나타내며, 향후 가격 방향 예측에 참고할 수 있습니다.";
}

// 패턴 신뢰도 계산 함수
export function patternConfidence(pattern: string): number {
  // 패턴별 기본 신뢰도 정의
  const patternConfidences: { [key: string]: number } = {
    "상승 추세": 75,
    "하락 추세": 75,
    "골든 크로스 형성됨": 85,
    "데드 크로스 형성됨": 85,
    "높은 변동성": 60,
    "낮은 변동성": 60,
    "거래량 급증": 80,
    "지지선 근처에서 거래 중": 70,
    "저항선 근처에서 거래 중": 70,
    "이중 바닥 패턴": 75,
    "이중 천정 패턴": 75,
    "헤드앤숄더 패턴": 80,
    "역헤드앤숄더 패턴": 80,
    "삼각수렴 패턴": 65,
    "상승 플래그": 70,
    "하락 플래그": 70,
    "갭업": 75,
    "갭다운": 75,
    "볼린저밴드 상단 돌파": 65,
    "볼린저밴드 하단 돌파": 65,
    "컵앤핸들 패턴": 70,
    "RSI 과매수": 75,
    "RSI 과매도": 75,
    "데이터 부족": 30,
  };

  // 정의된 패턴이 없으면 기본값 60% 리턴
  return patternConfidences[pattern] || 60;
}

// RSI 색상 결정 함수
export function getRSIColor(rsi: number): string {
  if (rsi > 70) return "text-red-600";
  if (rsi < 30) return "text-green-600";
  return "text-gray-900";
}

// RSI 상태 설명 함수
export function getRSIStatus(rsi: number): string {
  if (rsi > 70) return "과매수";
  if (rsi > 60) return "매수세 강함";
  if (rsi < 30) return "과매도";
  if (rsi < 40) return "매도세 강함";
  return "중립";
}

// 한글 AI 요약 생성 함수 추가
export function generateKoreanSummary(stockData: any, prediction: any): string {
  const ticker = stockData.ticker;
  const companyName = stockData.companyNameKr || stockData.companyName;
  const currentPrice = stockData.currentPrice;
  const priceChange = stockData.priceChange;
  const recommendation = prediction?.recommendation || '';
  
  // 기본 정보 설정
  const priceDirection = priceChange >= 0 ? '상승' : '하락';
  const pricePercentage = Math.abs(priceChange).toFixed(2);
  
  // 기술적 지표 분석
  const rsi = stockData.technicalIndicators?.rsi || 50;
  const macdValue = stockData.technicalIndicators?.macd?.value || 0;
  const ma50 = stockData.technicalIndicators?.ma50 || 0;
  const ma200 = stockData.technicalIndicators?.ma200 || 0;
  
  let techAnalysis = '';
  if (rsi > 70) {
    techAnalysis = '현재 RSI 지표는 과매수 상태로, 단기적인 조정 가능성이 있습니다.';
  } else if (rsi < 30) {
    techAnalysis = '현재 RSI 지표는 과매도 상태로, 반등 가능성이 높아 보입니다.';
  } else {
    techAnalysis = 'RSI 지표는 중립적인 범위 내에 있습니다.';
  }
  
  if (macdValue > 0 && ma50 > ma200) {
    techAnalysis += ' MACD와 이동평균선은 상승 추세를 지지하고 있습니다.';
  } else if (macdValue < 0 && ma50 < ma200) {
    techAnalysis += ' MACD와 이동평균선은 하락 추세를 나타내고 있습니다.';
  } else {
    techAnalysis += ' 다른 기술적 지표들은 혼합된 신호를 보내고 있습니다.';
  }
  
  // 기본적 분석
  const pe = stockData.fundamentals?.pe || 0;
  const industry = stockData.industry || '해당 산업';
  const dividendYield = stockData.fundamentals?.dividendYield || 0;
  
  let fundamentalAnalysis = '';
  if (pe > 0) {
    fundamentalAnalysis = `P/E 비율은 ${pe.toFixed(2)}로 `;
    if (pe > 25) {
      fundamentalAnalysis += '다소 높은 편이나, ';
    } else if (pe < 15) {
      fundamentalAnalysis += '상대적으로 저평가되어 있으며, ';
    } else {
      fundamentalAnalysis += '적정 수준이며, ';
    }
  }
  
  fundamentalAnalysis += `${industry} 산업에서 경쟁력 있는 위치를 점하고 있습니다.`;
  
  if (dividendYield > 0) {
    fundamentalAnalysis += ` 또한 ${dividendYield.toFixed(2)}%의 배당 수익률을 제공하고 있어 안정적인 수익을 추구하는 투자자에게 매력적일 수 있습니다.`;
  }
  
  // 예측 분석
  const shortTermChange = prediction?.shortTerm?.change || 0;
  const mediumTermChange = prediction?.mediumTerm?.change || 0;
  const longTermChange = prediction?.longTerm?.change || 0;
  
  let predictionAnalysis = '';
  predictionAnalysis += `AI 분석에 따르면, ${companyName}(${ticker})의 주가는 단기적으로(1개월) ${shortTermChange >= 0 ? '약 ' + shortTermChange.toFixed(2) + '% 상승' : '약 ' + Math.abs(shortTermChange).toFixed(2) + '% 하락'}할 것으로 예상됩니다.`;
  predictionAnalysis += ` 중기적으로(3개월)는 ${mediumTermChange >= 0 ? '약 ' + mediumTermChange.toFixed(2) + '% 상승' : '약 ' + Math.abs(mediumTermChange).toFixed(2) + '% 하락'}, 장기적으로(6개월)는 ${longTermChange >= 0 ? '약 ' + longTermChange.toFixed(2) + '% 상승' : '약 ' + Math.abs(longTermChange).toFixed(2) + '% 하락'}할 것으로 예측됩니다.`;
  
  // 강점 및 위험 요소
  let strengths = '';
  if (prediction?.strengths && prediction.strengths.length > 0) {
    strengths = ' 주요 강점으로는 ';
    prediction.strengths.slice(0, 2).forEach((strength, index) => {
      if (index > 0) strengths += '와(과) ';
      strengths += `${strength}`;
    });
    strengths += '이(가) 있습니다.';
  }
  
  let risks = '';
  if (prediction?.risks && prediction.risks.length > 0) {
    risks = ' 주의해야 할 위험 요소로는 ';
    prediction.risks.slice(0, 2).forEach((risk, index) => {
      if (index > 0) risks += '와(과) ';
      risks += `${risk}`;
    });
    risks += '이(가) 있습니다.';
  }
  
  // 추천 근거
  let recommendationReason = '';
  switch(recommendation.toUpperCase()) {
    case 'BUY':
      recommendationReason = ` 현재 주가와 성장 가능성을 고려할 때, ${companyName}은(는) 매수 추천됩니다. 단기적인 시장 변동성에도 불구하고, 중장기적인 성장 잠재력이 있습니다.`;
      break;
    case 'SELL':
      recommendationReason = ` 현재 주가와 시장 환경을 고려할 때, ${companyName}은(는) 매도 추천됩니다. 당분간 가격 하락 압력이 지속될 가능성이 높습니다.`;
      break;
    case 'HOLD':
      recommendationReason = ` 현재 주가와 시장 상황을 고려할 때, ${companyName}은(는) 보유 추천됩니다. 큰 가격 변동 없이 안정적인 흐름을 보일 것으로 예상됩니다.`;
      break;
    default:
      recommendationReason = ' 현재 시장 상황에서는 추가 정보 수집 후 투자 결정을 내리는 것이 좋습니다.';
  }
  
  // 최종 요약문 조합
  const summary = `${companyName}(${ticker})의 현재 주가는 $${currentPrice.toFixed(2)}로, 최근 ${priceDirection}세를 보이며 ${pricePercentage}% ${priceDirection}했습니다. ${techAnalysis} ${fundamentalAnalysis}\n\n${predictionAnalysis}${strengths}${risks}${recommendationReason}`;
  
  return summary;
} 
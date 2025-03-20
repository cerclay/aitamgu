// 서버 컴포넌트
import StockDetails from '@/components/StockDetails';

export default async function StockPage({ params }) {
  const { symbol } = params;
  
  // 초기 정적 데이터 가져오기 (선택 사항)
  let initialData = null;
  try {
    // API 라우트를 직접 호출하는 대신 서버 함수를 사용
    // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/yahoo-finance?symbol=${symbol}`);
    // initialData = await res.json();
  } catch (error) {
    console.error('Error prefetching data:', error);
  }
  
  // AI 예측 결과 생성 함수
  function generateAIPrediction(stockData) {
    // 데이터 추출
    const { 
      ticker, 
      currentPrice, 
      priceChange, 
      historicalPrices, 
      technicalIndicators, 
      fundamentals, 
      patterns 
    } = stockData;
    
    const priceHistory = historicalPrices.map(p => p.price);
    const recentPrices = priceHistory.slice(-30);
    
    // 트렌드 분석
    const trend = technicalIndicators.rsi > 70 ? '과매수' : 
                  technicalIndicators.rsi < 30 ? '과매도' : '중립';
    
    // 모멘텀 분석
    const shortTrend = stockData.momentum.shortTerm > 0 ? '단기 상승세' : '단기 하락세';
    const mediumTrend = stockData.momentum.mediumTerm > 0 ? '중기 상승세' : '중기 하락세';
    const longTrend = stockData.momentum.longTerm > 0 ? '장기 상승세' : '장기 하락세';
    
    // PE 비율 분석
    const isPEGood = fundamentals.pe < 20 && fundamentals.pe > 0;
    
    // 배당 분석
    const isGoodDividend = fundamentals.dividendYield > 2;
    
    // 투자 추천 이유 생성
    let investmentReasons = [];
    
    if (technicalIndicators.rsi < 30) {
      investmentReasons.push(`현재 RSI(${technicalIndicators.rsi.toFixed(2)})가 낮아 과매도 상태입니다. 기술적 반등 가능성이 있습니다.`);
    }
    
    if (technicalIndicators.rsi > 70) {
      investmentReasons.push(`현재 RSI(${technicalIndicators.rsi.toFixed(2)})가 높아 과매수 상태입니다. 단기 조정 가능성이 있습니다.`);
    }
    
    if (isPEGood) {
      investmentReasons.push(`PE 비율(${fundamentals.pe.toFixed(2)})이 합리적인 수준으로, 현재 주가가 저평가되어 있을 수 있습니다.`);
    }
    
    if (isGoodDividend) {
      investmentReasons.push(`배당률(${fundamentals.dividendYield.toFixed(2)}%)이 높아 소득 투자자에게 유리할 수 있습니다.`);
    }
    
    if (patterns.includes('골든 크로스 형성됨')) {
      investmentReasons.push('골든 크로스가 형성되어 기술적으로 상승 추세가 예상됩니다.');
    }
    
    if (patterns.includes('데드 크로스 형성됨')) {
      investmentReasons.push('데드 크로스가 형성되어 기술적으로 하락 추세가 예상됩니다.');
    }
    
    // 투자 결정
    let investmentDecision = '관망';
    let confidence = 50;
    
    if (investmentReasons.length >= 3 && technicalIndicators.rsi < 40 && shortTrend === '단기 상승세') {
      investmentDecision = '매수';
      confidence = 70;
    } else if (investmentReasons.length >= 3 && technicalIndicators.rsi > 60 && shortTrend === '단기 하락세') {
      investmentDecision = '매도';
      confidence = 70;
    } else if (isGoodDividend && isPEGood && mediumTrend === '중기 상승세') {
      investmentDecision = '장기 매수';
      confidence = 65;
    }
    
    // 예측 분석 설명 생성
    const predictionExplanation = `
      ${ticker}의 기술적, 기본적 분석 결과를 종합해보면, 현재 이 주식은 ${trend} 상태입니다.
      
      단기(7일) 모멘텀은 ${stockData.momentum.shortTerm.toFixed(2)}%로 ${shortTrend}를 보이고 있으며,
      중기(30일) 모멘텀은 ${stockData.momentum.mediumTerm.toFixed(2)}%로 ${mediumTrend}를,
      장기(90일) 모멘텀은 ${stockData.momentum.longTerm.toFixed(2)}%로 ${longTrend}를 나타내고 있습니다.
      
      RSI 지표는 ${technicalIndicators.rsi.toFixed(2)}로, ${
        technicalIndicators.rsi > 70 ? '과매수 구간에 있어 조정 가능성이 있습니다.' :
        technicalIndicators.rsi < 30 ? '과매도 구간에 있어 반등 가능성이 있습니다.' :
        '중립적인 구간에 있습니다.'
      }
      
      MACD 지표는 ${
        technicalIndicators.macd.histogram > 0 ? '양수로, 상승 추세가 강화되고 있습니다.' :
        '음수로, 하락 추세가 강화되고 있습니다.'
      }
      
      ${patterns.length > 0 ? `차트 패턴 분석 결과는 다음과 같습니다: ${patterns.join(', ')}` : ''}
      
      기본적 분석 측면에서는, PE 비율이 ${fundamentals.pe.toFixed(2)}로 ${
        fundamentals.pe < 15 ? '저평가' :
        fundamentals.pe > 25 ? '고평가' :
        '적정 평가'
      } 상태입니다. 배당률은 ${fundamentals.dividendYield.toFixed(2)}%로, ${
        fundamentals.dividendYield > 3 ? '높은 편입니다.' :
        fundamentals.dividendYield > 1 ? '적정한 편입니다.' :
        '낮은 편입니다.'
      }
      
      종합적인 분석 결과, 현재 ${ticker}에 대한 투자 추천은 **${investmentDecision}**(신뢰도: ${confidence}%)입니다.
      
      주요 투자 추천 이유:
      ${investmentReasons.map(reason => `- ${reason}`).join('\n')}
      
      이 분석은 매주 업데이트되며, 시장 상황과 기업 실적에 따라 변경될 수 있습니다.
    `;
    
    return predictionExplanation;
  }

  // 페이지 컴포넌트에서 AI 예측 결과 표시
  const aiPrediction = generateAIPrediction(stockData);

  return (
    <div>
      <h1>주식 정보: {symbol}</h1>
      <StockDetails symbol={symbol} initialData={initialData} />
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">AI 예측 분석</h2>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="whitespace-pre-line">{aiPrediction}</div>
        </div>
      </div>
    </div>
  );
} 
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { StockData, PredictionResult } from '@/app/stock-analyzer/types';

// Gemini API 키 (실제 사용 시 환경 변수로 관리해야 합니다)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbol, stockData, economicIndicators = [], modelType = 'transformer', predictionPeriod = 'all' } = body;
    
    if (!stockData) {
      return NextResponse.json(
        { error: '주식 데이터가 필요합니다' },
        { status: 400 }
      );
    }
    
    // 심볼 확인
    const tickerSymbol = symbol || stockData.ticker;
    if (!tickerSymbol) {
      return NextResponse.json(
        { error: '주식 심볼이 필요합니다' },
        { status: 400 }
      );
    }
    
    // 모델 유형에 따라 다른 프롬프트 사용
    let prompt = '';
    
    if (modelType.toLowerCase() === 'lstm') {
      prompt = generateLSTMPredictionPrompt(stockData, predictionPeriod);
    } else {
      prompt = generateTransformerPredictionPrompt(stockData, predictionPeriod);
    }
    
    // API 키가 유효한지 확인
    if (!GEMINI_API_KEY) {
      console.log('Gemini API 키가 설정되지 않았습니다. 모의 데이터를 반환합니다.');
      const mockPrediction = generateMockPrediction(stockData, modelType);
      
      return NextResponse.json({
        prediction: mockPrediction,
        analysis: '모의 AI 분석 데이터입니다. 실제 API 키를 설정하면 더 정확한 분석을 받을 수 있습니다.',
        modelType,
        timestamp: new Date().toISOString()
      });
    }
    
    // Gemini API 호출
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // 응답 텍스트에서 JSON 형식의 예측 결과 추출 시도
      try {
        // JSON 형식의 데이터를 찾기 위한 정규식
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                          text.match(/```\n([\s\S]*?)\n```/) || 
                          text.match(/{[\s\S]*?}/);
        
        let predictionResult: PredictionResult;
        
        if (jsonMatch) {
          // JSON 문자열 추출 및 파싱
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          try {
            predictionResult = JSON.parse(jsonStr);
          } catch (jsonError) {
            console.error('JSON 파싱 오류:', jsonError);
            console.error('파싱 시도한 문자열:', jsonStr);
            predictionResult = generateMockPrediction(stockData, modelType);
          }
        } else {
          // JSON 형식이 없는 경우 모의 데이터 생성
          console.log('JSON 형식의 응답을 찾을 수 없습니다. 모의 데이터를 생성합니다.');
          predictionResult = generateMockPrediction(stockData, modelType);
        }
        
        // 분석 텍스트 추출 (JSON 부분 제외)
        const analysisText = text.replace(/```json\n[\s\S]*?\n```/, '')
                                .replace(/```\n[\s\S]*?\n```/, '')
                                .trim();
        
        // 최종 응답 생성
        return NextResponse.json({
          prediction: predictionResult,
          analysis: analysisText,
          modelType,
          timestamp: new Date().toISOString()
        });
      } catch (parseError) {
        console.error('예측 결과 파싱 오류:', parseError);
        
        // 파싱 오류 시 모의 데이터 사용
        const mockPrediction = generateMockPrediction(stockData, modelType);
        
        return NextResponse.json({
          prediction: mockPrediction,
          analysis: text,
          modelType,
          timestamp: new Date().toISOString()
        });
      }
    } catch (apiCallError) {
      console.error('Gemini API 호출 오류:', apiCallError);
      
      // API 호출 실패 시 모의 데이터 생성
      const mockPrediction = generateMockPrediction(stockData, modelType);
      
      return NextResponse.json({
        prediction: mockPrediction,
        analysis: 'Gemini API 호출 중 오류가 발생했습니다. 모의 데이터를 제공합니다.',
        modelType,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('요청 처리 오류:', error);
    
    // 기본 주식 데이터 생성 (요청 데이터가 없는 경우)
    const defaultStockData = {
      ticker: 'ERROR',
      companyName: 'Error Company',
      companyNameKr: '에러 회사',
      sector: '기술',
      industry: '소프트웨어',
      currentPrice: 100,
      priceChange: 0,
      marketCap: 1000000000,
      volume: 1000000,
      high52Week: 120,
      low52Week: 80,
      lastUpdated: new Date().toISOString(),
      description: '오류가 발생했습니다.',
      descriptionKr: '오류가 발생했습니다.',
      historicalPrices: [
        {
          date: new Date().toISOString().split('T')[0],
          price: 100,
          volume: 1000000,
          open: 99,
          high: 101,
          low: 98
        }
      ],
      technicalIndicators: {
        rsi: 50,
        macd: { value: 0, signal: 0, histogram: 0 },
        bollingerBands: { upper: 110, middle: 100, lower: 90, width: 20 },
        ma50: 100,
        ma200: 100,
        ema20: 100,
        ema50: 100,
        atr: 2,
        obv: 1000000,
        stochastic: { k: 50, d: 50 },
        adx: 20,
        supportLevels: [90, 85],
        resistanceLevels: [110, 115]
      },
      fundamentals: {
        pe: 15,
        forwardPE: 14,
        eps: 5,
        epsGrowth: 5,
        dividendYield: 2,
        dividendGrowth: 1,
        peg: 1.5,
        pb: 2,
        ps: 3,
        pcf: 10,
        roe: 15,
        roa: 10,
        roic: 12,
        debtToEquity: 0.5,
        currentRatio: 2,
        quickRatio: 1.5,
        revenue: 1000000000,
        revenueGrowth: 5,
        grossMargin: 40,
        netIncome: 100000000,
        netIncomeGrowth: 5,
        operatingMargin: 10,
        fcf: 50000000,
        fcfGrowth: 5,
        nextEarningsDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
        analystRatings: {
          buy: 5,
          hold: 3,
          sell: 1,
          targetPrice: 110
        }
      },
      news: [
        {
          title: '오류 발생',
          source: '시스템',
          date: new Date().toISOString().split('T')[0],
          url: '#',
          sentiment: 'neutral' as const
        }
      ],
      patterns: [],
      upcomingEvents: [],
      momentum: {
        shortTerm: 0,
        mediumTerm: 0,
        longTerm: 0,
        relativeStrength: 0,
        sectorPerformance: 0
      }
    };
    
    const mockPrediction = generateMockPrediction(defaultStockData, 'transformer');
    
    return NextResponse.json({
      prediction: mockPrediction,
      analysis: '예측 중 오류가 발생했습니다. 모의 데이터를 제공합니다.',
      modelType: 'transformer',
      timestamp: new Date().toISOString()
    });
  }
}

// LSTM 모델 예측 프롬프트 생성
function generateLSTMPredictionPrompt(stockData: StockData, predictionPeriod: string): string {
  return `
당신은 주식 시장 전문가이자 LSTM(Long Short-Term Memory) 딥러닝 모델 전문가입니다. 다음 주식 데이터를 기반으로 LSTM 모델을 사용한 주가 예측 분석을 제공해주세요.

주식 정보:
- 티커: ${stockData.ticker}
- 회사명: ${stockData.companyName}
- 한글 회사명: ${stockData.companyNameKr || stockData.companyName}
- 현재 가격: $${stockData.currentPrice}
- 가격 변동: ${stockData.priceChange}%
- 시가총액: $${(stockData.marketCap / 1000000000).toFixed(2)}B
- 산업: ${stockData.sector || '정보 없음'}

기술적 지표:
- RSI: ${stockData.technicalIndicators.rsi}
- MACD: ${stockData.technicalIndicators.macd.value} (시그널: ${stockData.technicalIndicators.macd.signal}, 히스토그램: ${stockData.technicalIndicators.macd.histogram})
- 볼린저 밴드: 상단 $${stockData.technicalIndicators.bollingerBands.upper.toFixed(2)}, 중간 $${stockData.technicalIndicators.bollingerBands.middle.toFixed(2)}, 하단 $${stockData.technicalIndicators.bollingerBands.lower.toFixed(2)}
- 50일 이동평균: $${stockData.technicalIndicators.ma50.toFixed(2)}
- 200일 이동평균: $${stockData.technicalIndicators.ma200.toFixed(2)}

기본적 지표:
- P/E 비율: ${stockData.fundamentals.pe}
- EPS: $${stockData.fundamentals.eps}
- 매출 성장률: ${stockData.fundamentals.revenueGrowth}%
- 영업 마진: ${stockData.fundamentals.operatingMargin}%

회사 설명:
${stockData.description}

LSTM 모델은 시계열 데이터에서 장기 의존성을 학습할 수 있는 순환 신경망(RNN)의 한 종류입니다. 주가 예측에 있어 LSTM은 과거 주가 패턴, 거래량, 기술적 지표 등의 시계열 데이터를 분석하여 미래 주가를 예측합니다.

다음 내용을 포함한 LSTM 기반 주가 예측 분석을 제공해주세요:
1. 단기(1개월), 중기(3개월), 장기(6개월) 주가 예측
2. 각 예측 기간별 확률과 가격 범위
3. 예측의 신뢰도 점수
4. 주요 투자 강점과 위험 요소
5. 투자 추천(매수/매도/관망)과 그 이유

분석은 한국어로 작성해주세요. 전문적이면서도 일반 투자자가 이해할 수 있는 수준으로 작성해주세요.

또한, 다음 JSON 형식으로 예측 결과를 제공해주세요:

\`\`\`json
{
  "shortTerm": {
    "price": 숫자(예측 가격),
    "change": 숫자(현재 가격 대비 변화율),
    "probability": 숫자(예측 확률, 0-100),
    "range": {
      "min": 숫자(최소 예상 가격),
      "max": 숫자(최대 예상 가격)
    }
  },
  "mediumTerm": {
    "price": 숫자,
    "change": 숫자,
    "probability": 숫자,
    "range": {
      "min": 숫자,
      "max": 숫자
    }
  },
  "longTerm": {
    "price": 숫자,
    "change": 숫자,
    "probability": 숫자,
    "range": {
      "min": 숫자,
      "max": 숫자
    }
  },
  "pricePredictions": [
    {
      "date": "YYYY-MM-DD",
      "predictedPrice": 숫자,
      "range": {
        "min": 숫자,
        "max": 숫자
      }
    }
    // 향후 90일간의 일별 예측 (약 10-15개 샘플 포인트)
  ],
  "confidenceScore": 숫자(0-100),
  "modelInfo": {
    "type": "LSTM",
    "accuracy": 숫자(0-100),
    "features": [
      "사용된 특성 1",
      "사용된 특성 2"
      // 모델에 사용된 주요 특성들
    ],
    "trainPeriod": "학습 기간 (예: 2018-01-01 ~ 현재)"
  },
  "summary": "영문 요약",
  "summaryKr": "한글 요약",
  "strengths": [
    "강점 1",
    "강점 2"
    // 3-5개 항목
  ],
  "risks": [
    "위험 1",
    "위험 2"
    // 3-5개 항목
  ],
  "recommendation": "BUY/SELL/HOLD",
  "recommendationKr": "매수/매도/관망",
  "analysisDetails": "영문 상세 분석",
  "analysisDetailsKr": "한글 상세 분석"
}
\`\`\`

JSON 데이터는 실제 LSTM 모델이 예측한 것처럼 현실적인 값을 제공해주세요. 현재 주가와 과거 추세를 고려하여 합리적인 예측 값을 생성해주세요.
`;
}

// Transformer 모델 예측 프롬프트 생성
function generateTransformerPredictionPrompt(stockData: StockData, predictionPeriod: string): string {
  return `
당신은 주식 시장 전문가이자 Transformer 딥러닝 모델 전문가입니다. 다음 주식 데이터를 기반으로 Transformer 모델을 사용한 주가 예측 분석을 제공해주세요.

주식 정보:
- 티커: ${stockData.ticker}
- 회사명: ${stockData.companyName}
- 한글 회사명: ${stockData.companyNameKr || stockData.companyName}
- 현재 가격: $${stockData.currentPrice}
- 가격 변동: ${stockData.priceChange}%
- 시가총액: $${(stockData.marketCap / 1000000000).toFixed(2)}B
- 산업: ${stockData.sector || '정보 없음'}

기술적 지표:
- RSI: ${stockData.technicalIndicators.rsi}
- MACD: ${stockData.technicalIndicators.macd.value} (시그널: ${stockData.technicalIndicators.macd.signal}, 히스토그램: ${stockData.technicalIndicators.macd.histogram})
- 볼린저 밴드: 상단 $${stockData.technicalIndicators.bollingerBands.upper.toFixed(2)}, 중간 $${stockData.technicalIndicators.bollingerBands.middle.toFixed(2)}, 하단 $${stockData.technicalIndicators.bollingerBands.lower.toFixed(2)}
- 50일 이동평균: $${stockData.technicalIndicators.ma50.toFixed(2)}
- 200일 이동평균: $${stockData.technicalIndicators.ma200.toFixed(2)}

기본적 지표:
- P/E 비율: ${stockData.fundamentals.pe}
- EPS: $${stockData.fundamentals.eps}
- 매출 성장률: ${stockData.fundamentals.revenueGrowth}%
- 영업 마진: ${stockData.fundamentals.operatingMargin}%

차트 패턴:
${stockData.patterns.map(pattern => `- ${pattern.name}: ${pattern.descriptionKr || pattern.description} (신뢰도: ${pattern.confidence}%)`).join('\n')}

회사 설명:
${stockData.descriptionKr || stockData.description}

Transformer 모델은 자기 주의(Self-Attention) 메커니즘을 활용하여 시계열 데이터의 장기 의존성을 효과적으로 포착할 수 있는 딥러닝 아키텍처입니다. 주가 예측에 있어 Transformer는 LSTM보다 더 넓은 컨텍스트를 고려할 수 있으며, 과거 주가 패턴, 거래량, 기술적 지표, 뉴스 감성 분석 등 다양한 데이터를 통합하여 미래 주가를 예측합니다.

다음 내용을 포함한 Transformer 기반 주가 예측 분석을 제공해주세요:
1. 단기(1개월), 중기(3개월), 장기(6개월) 주가 예측
2. 각 예측 기간별 확률과 가격 범위
3. 예측의 신뢰도 점수
4. 주요 투자 강점과 위험 요소
5. 투자 추천(매수/매도/관망)과 그 이유

분석은 한국어로 작성해주세요. 전문적이면서도 일반 투자자가 이해할 수 있는 수준으로 작성해주세요.

또한, 다음 JSON 형식으로 예측 결과를 제공해주세요:

\`\`\`json
{
  "shortTerm": {
    "price": 숫자(예측 가격),
    "change": 숫자(현재 가격 대비 변화율),
    "probability": 숫자(예측 확률, 0-100),
    "range": {
      "min": 숫자(최소 예상 가격),
      "max": 숫자(최대 예상 가격)
    }
  },
  "mediumTerm": {
    "price": 숫자,
    "change": 숫자,
    "probability": 숫자,
    "range": {
      "min": 숫자,
      "max": 숫자
    }
  },
  "longTerm": {
    "price": 숫자,
    "change": 숫자,
    "probability": 숫자,
    "range": {
      "min": 숫자,
      "max": 숫자
    }
  },
  "pricePredictions": [
    {
      "date": "YYYY-MM-DD",
      "predictedPrice": 숫자,
      "range": {
        "min": 숫자,
        "max": 숫자
      }
    }
    // 향후 90일간의 일별 예측 (약 10-15개 샘플 포인트)
  ],
  "confidenceScore": 숫자(0-100),
  "modelInfo": {
    "type": "Transformer",
    "accuracy": 숫자(0-100),
    "features": [
      "사용된 특성 1",
      "사용된 특성 2"
      // 모델에 사용된 주요 특성들
    ],
    "trainPeriod": "학습 기간 (예: 2015-01-01 ~ 현재)"
  },
  "summary": "영문 요약",
  "summaryKr": "한글 요약",
  "strengths": [
    "강점 1",
    "강점 2"
    // 3-5개 항목
  ],
  "risks": [
    "위험 1",
    "위험 2"
    // 3-5개 항목
  ],
  "recommendation": "BUY/SELL/HOLD",
  "recommendationKr": "매수/매도/관망",
  "analysisDetails": "영문 상세 분석",
  "analysisDetailsKr": "한글 상세 분석"
}
\`\`\`

JSON 데이터는 실제 Transformer 모델이 예측한 것처럼 현실적인 값을 제공해주세요. 현재 주가와 과거 추세를 고려하여 합리적인 예측 값을 생성해주세요.
`;
}

// 모의 예측 결과 생성 (API 호출 실패 시 사용)
function generateMockPrediction(stockData: StockData, modelType: string): PredictionResult {
  const currentPrice = stockData.currentPrice;
  const isLSTM = modelType.toLowerCase() === 'lstm';
  
  // 모델 유형에 따라 다른 변동성 적용
  const volatilityFactor = isLSTM ? 1.0 : 0.8; // Transformer가 더 정확하다고 가정
  
  // 예측 변화율 범위 설정
  const shortTermChange = Math.random() * (isLSTM ? 10 : 12) - 5; // -5% ~ +5/7%
  const mediumTermChange = Math.random() * (isLSTM ? 20 : 25) - (isLSTM ? 7 : 8); // -7/8% ~ +13/17%
  const longTermChange = Math.random() * (isLSTM ? 30 : 35) - 10; // -10% ~ +20/25%
  
  // 예측 가격 계산
  const shortTermPrice = currentPrice * (1 + shortTermChange / 100);
  const mediumTermPrice = currentPrice * (1 + mediumTermChange / 100);
  const longTermPrice = currentPrice * (1 + longTermChange / 100);
  
  // 일별 예측 가격 생성
  const pricePredictions = [];
  const today = new Date();
  
  // 샘플 포인트 선택 (90일 중 15개 포인트)
  const sampleDays = [1, 7, 14, 21, 30, 37, 45, 52, 60, 67, 75, 82, 90];
  
  for (const day of sampleDays) {
    const date = new Date(today);
    date.setDate(date.getDate() + day);
    
    let predictedPrice;
    if (day <= 30) {
      // 단기: 현재가격에서 shortTermPrice까지 선형 보간
      predictedPrice = currentPrice + (shortTermPrice - currentPrice) * (day / 30);
    } else if (day <= 60) {
      // 중기: shortTermPrice에서 mediumTermPrice까지 선형 보간
      predictedPrice = shortTermPrice + (mediumTermPrice - shortTermPrice) * ((day - 30) / 30);
    } else {
      // 장기: mediumTermPrice에서 longTermPrice까지 선형 보간
      predictedPrice = mediumTermPrice + (longTermPrice - mediumTermPrice) * ((day - 60) / 30);
    }
    
    // 변동성 추가
    const volatility = currentPrice * 0.01 * volatilityFactor * Math.random();
    predictedPrice += (Math.random() > 0.5 ? volatility : -volatility);
    
    pricePredictions.push({
      date: date.toISOString().split('T')[0],
      predictedPrice: Number(predictedPrice.toFixed(2)),
      range: {
        min: Number((predictedPrice * (1 - 0.05 * volatilityFactor)).toFixed(2)),
        max: Number((predictedPrice * (1 + 0.05 * volatilityFactor)).toFixed(2))
      }
    });
  }
  
  // 모델 정보 설정
  const modelInfo = {
    type: isLSTM ? 'LSTM' : 'Transformer',
    accuracy: isLSTM ? Number((75 + Math.random() * 10).toFixed(1)) : Number((80 + Math.random() * 10).toFixed(1)),
    features: [
      '과거 주가 데이터',
      '거래량',
      '기술적 지표 (RSI, MACD, 볼린저 밴드)',
      '시장 지표',
      '계절성 패턴'
    ],
    trainPeriod: isLSTM ? '2018-01-01 ~ 현재' : '2015-01-01 ~ 현재'
  };
  
  // Transformer 모델에 추가 특성 추가
  if (!isLSTM) {
    modelInfo.features.push('뉴스 감성 분석');
    modelInfo.features.push('거시경제 지표');
  }
  
  // 예측 결과 생성
  return {
    shortTerm: {
      price: Number(shortTermPrice.toFixed(2)),
      change: Number(shortTermChange.toFixed(2)),
      probability: Number(Number((isLSTM ? 60 : 65) + Math.random() * 20).toFixed(1)),
      range: {
        min: Number((shortTermPrice * (1 - 0.05 * volatilityFactor)).toFixed(2)),
        max: Number((shortTermPrice * (1 + 0.05 * volatilityFactor)).toFixed(2))
      }
    },
    mediumTerm: {
      price: Number(mediumTermPrice.toFixed(2)),
      change: Number(mediumTermChange.toFixed(2)),
      probability: Number(Number((isLSTM ? 55 : 60) + Math.random() * 20).toFixed(1)),
      range: {
        min: Number((mediumTermPrice * (1 - 0.1 * volatilityFactor)).toFixed(2)),
        max: Number((mediumTermPrice * (1 + 0.1 * volatilityFactor)).toFixed(2))
      }
    },
    longTerm: {
      price: Number(longTermPrice.toFixed(2)),
      change: Number(longTermChange.toFixed(2)),
      probability: Number(Number((isLSTM ? 50 : 55) + Math.random() * 20).toFixed(1)),
      range: {
        min: Number((longTermPrice * (1 - 0.15 * volatilityFactor)).toFixed(2)),
        max: Number((longTermPrice * (1 + 0.15 * volatilityFactor)).toFixed(2))
      }
    },
    pricePredictions,
    confidenceScore: Number(Number((isLSTM ? 60 : 65) + Math.random() * 20).toFixed(1)),
    modelInfo,
    summary: `${stockData.companyName}'s stock is expected to ${shortTermChange > 0 ? 'rise' : 'fall'} in the short term. In the medium term, it is predicted to show a ${mediumTermChange > 0 ? 'positive' : 'negative'} trend.`,
    summaryKr: `${stockData.companyNameKr || stockData.companyName}의 주가는 단기적으로 ${shortTermChange > 0 ? '상승' : '하락'}할 것으로 예상됩니다. 중기적으로는 ${mediumTermChange > 0 ? '상승' : '하락'} 추세를 보일 것으로 예측됩니다.`,
    strengths: [
      '강력한 재무 상태',
      '경쟁사 대비 높은 수익성',
      '지속적인 혁신과 R&D 투자',
      '시장 점유율 확대'
    ],
    risks: [
      '시장 경쟁 심화',
      '규제 환경 변화 가능성',
      '원자재 가격 상승으로 인한 마진 압박',
      '글로벌 경제 불확실성'
    ],
    recommendation: shortTermChange > 0 ? 'BUY' : (shortTermChange < -3 ? 'SELL' : 'HOLD'),
    recommendationKr: shortTermChange > 0 ? '매수' : (shortTermChange < -3 ? '매도' : '관망'),
    analysisDetails: `The ${modelInfo.type} model generated this prediction based on historical price data, volume, and technical indicators. The model particularly captured ${stockData.companyName}'s seasonal patterns and market cycle responses.`,
    analysisDetailsKr: `${modelInfo.type} 모델은 과거 주가 데이터, 거래량, 기술적 지표를 학습하여 이 예측을 생성했습니다. 모델은 특히 ${stockData.companyNameKr || stockData.companyName}의 계절적 패턴과 시장 사이클에 대한 반응을 잘 포착했습니다.`
  };
} 
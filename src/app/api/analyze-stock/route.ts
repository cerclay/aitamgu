import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stockData, economicData, analysisType = 'comprehensive' } = body;
    
    if (!stockData) {
      return NextResponse.json(
        { error: '주식 데이터가 필요합니다' },
        { status: 400 }
      );
    }
    
    if (!economicData) {
      return NextResponse.json(
        { error: '경제 데이터가 필요합니다' },
        { status: 400 }
      );
    }
    
    // Gemini API 키 가져오기 - 환경 변수 이름 확인
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('Gemini API 키가 설정되지 않았습니다.');
      // 환경 변수 목록 확인
      const envVars = Object.keys(process.env).filter(key => 
        key.includes('API') || 
        key.includes('KEY') || 
        key.includes('GEMINI') || 
        key.includes('GOOGLE')
      );
      
      return NextResponse.json({ 
        error: 'Google Gemini API 키가 설정되지 않았습니다. 환경변수를 확인하세요.',
        message: '환경 변수 GEMINI_API_KEY 또는 GOOGLE_GEMINI_API_KEY를 설정해주세요.',
        availableEnvVars: envVars,
        setupInstructions: 'Vercel 대시보드에서 환경 변수를 설정하거나 .env.local 파일에 GEMINI_API_KEY=your_api_key를 추가하세요.'
      }, { status: 500 });
    }
    
    // 분석 유형에 따른 프롬프트 생성
    let prompt = '';
    if (analysisType === 'technical') {
      prompt = generateTechnicalAnalysisPrompt(stockData);
    } else if (analysisType === 'fundamental') {
      prompt = generateFundamentalAnalysisPrompt(stockData);
    } else if (analysisType === 'economic') {
      prompt = generateEconomicAnalysisPrompt(stockData, economicData);
    } else {
      prompt = generateComprehensiveAnalysisPrompt(stockData, economicData);
    }
    
    // Gemini API 호출
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    console.log('Gemini API 호출 중...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log('Gemini API 응답 받음');
    
    return NextResponse.json({
      analysis: text,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('주식 분석 오류:', error);
    return NextResponse.json({ 
      error: '주식 분석 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// 기술적 분석 프롬프트 생성
function generateTechnicalAnalysisPrompt(stockData: any): string {
  return `
당신은 주식 시장 전문가입니다. 다음 주식 데이터를 기반으로 기술적 분석을 제공해주세요.

주식 정보:
- 티커: ${stockData.ticker}
- 회사명: ${stockData.companyName}
- 현재 가격: $${stockData.currentPrice}
- 가격 변동: ${stockData.priceChange}%

기술적 지표:
- RSI: ${stockData.technicalIndicators.rsi}
- MACD: ${stockData.technicalIndicators.macd}
- 볼린저 밴드 상단: $${stockData.technicalIndicators.bollingerBands.upper}
- 볼린저 밴드 하단: $${stockData.technicalIndicators.bollingerBands.lower}
- 50일 이동평균: $${stockData.technicalIndicators.ma50}
- 200일 이동평균: $${stockData.technicalIndicators.ma200}

차트 패턴:
${stockData.patterns.map(pattern => `- ${pattern.name}: ${pattern.description} (신뢰도: ${pattern.confidence}%)`).join('\n')}

다음 내용을 포함한 분석을 제공해주세요:
1. 현재 주가의 기술적 상태 평가
2. 주요 지지선과 저항선 식별
3. 단기(1-2주), 중기(1-3개월) 기술적 전망
4. 매수/매도/관망 추천과 그 이유
5. 투자자가 주시해야 할 주요 기술적 지표와 신호

분석은 한국어로 작성해주세요. 전문적이면서도 일반 투자자가 이해할 수 있는 수준으로 작성해주세요.
`;
}

// 기본적 분석 프롬프트 생성
function generateFundamentalAnalysisPrompt(stockData: any): string {
  return `
당신은 주식 시장 전문가입니다. 다음 주식 데이터를 기반으로 기본적 분석을 제공해주세요.

주식 정보:
- 티커: ${stockData.ticker}
- 회사명: ${stockData.companyName}
- 현재 가격: $${stockData.currentPrice}
- 시가총액: $${(stockData.marketCap / 1000000000).toFixed(2)}B
- 거래량: ${(stockData.volume / 1000000).toFixed(2)}M

기본적 지표:
- P/E 비율: ${stockData.fundamentals.pe}
- EPS: $${stockData.fundamentals.eps}
- 배당 수익률: ${stockData.fundamentals.dividendYield}%
- PEG 비율: ${stockData.fundamentals.peg}
- ROE: ${stockData.fundamentals.roe}%
- 부채비율: ${stockData.fundamentals.debtToEquity}
- 매출: $${(stockData.fundamentals.revenue / 1000000000).toFixed(2)}B
- 매출 성장률: ${stockData.fundamentals.revenueGrowth}%
- 순이익: $${(stockData.fundamentals.netIncome / 1000000000).toFixed(2)}B
- 순이익 성장률: ${stockData.fundamentals.netIncomeGrowth}%
- 영업 마진: ${stockData.fundamentals.operatingMargin}%
- 다음 실적 발표일: ${stockData.fundamentals.nextEarningsDate}

회사 설명:
${stockData.description}

다음 내용을 포함한 분석을 제공해주세요:
1. 회사의 재무 상태 평가
2. 성장성 및 수익성 분석
3. 동종 업계 내 경쟁사 대비 상대적 가치 평가
4. 장기 투자 관점에서의 전망
5. 투자자가 주시해야 할 주요 기본적 지표와 이벤트

분석은 한국어로 작성해주세요. 전문적이면서도 일반 투자자가 이해할 수 있는 수준으로 작성해주세요.
`;
}

// 경제 분석 프롬프트 생성
function generateEconomicAnalysisPrompt(stockData: any, economicData: any): string {
  return `
당신은 주식 시장 전문가입니다. 다음 주식 데이터와 경제 지표를 기반으로 경제적 분석을 제공해주세요.

주식 정보:
- 티커: ${stockData.ticker}
- 회사명: ${stockData.companyName}
- 현재 가격: $${stockData.currentPrice}
- 산업: ${stockData.sector || '정보 없음'}

경제 지표:
${economicData.map(indicator => 
  `- ${indicator.name}: ${indicator.value}${indicator.unit} (변화: ${indicator.change > 0 ? '+' : ''}${indicator.change}${indicator.unit}, 기준: ${indicator.previousPeriod})`
).join('\n')}

다음 내용을 포함한 분석을 제공해주세요:
1. 현재 거시경제 환경이 해당 기업에 미치는 영향
2. 금리, 인플레이션, GDP 성장률 등 주요 경제 지표와 주가의 상관관계
3. 경제 사이클 내에서 해당 기업의 위치
4. 향후 6-12개월 경제 전망과 주가에 미칠 영향
5. 경제 환경 변화에 따른 투자 전략 제안

분석은 한국어로 작성해주세요. 전문적이면서도 일반 투자자가 이해할 수 있는 수준으로 작성해주세요.
`;
}

// 종합 분석 프롬프트 생성
function generateComprehensiveAnalysisPrompt(stockData: any, economicData: any): string {
  return `
당신은 주식 시장 전문가입니다. 다음 주식 데이터와 경제 지표를 기반으로 종합적인 투자 분석을 제공해주세요.

주식 정보:
- 티커: ${stockData.ticker}
- 회사명: ${stockData.companyName}
- 현재 가격: $${stockData.currentPrice}
- 가격 변동: ${stockData.priceChange}%
- 시가총액: $${(stockData.marketCap / 1000000000).toFixed(2)}B

기술적 지표:
- RSI: ${stockData.technicalIndicators.rsi}
- MACD: ${stockData.technicalIndicators.macd}
- 50일 이동평균: $${stockData.technicalIndicators.ma50}
- 200일 이동평균: $${stockData.technicalIndicators.ma200}

기본적 지표:
- P/E 비율: ${stockData.fundamentals.pe}
- EPS: $${stockData.fundamentals.eps}
- 매출 성장률: ${stockData.fundamentals.revenueGrowth}%
- 영업 마진: ${stockData.fundamentals.operatingMargin}%

경제 지표:
${economicData ? economicData.map(indicator => 
  `- ${indicator.name}: ${indicator.value}${indicator.unit} (변화: ${indicator.change > 0 ? '+' : ''}${indicator.change}${indicator.unit})`
).join('\n') : '경제 지표 데이터가 제공되지 않았습니다.'}

회사 설명:
${stockData.description}

다음 내용을 포함한 종합 분석을 제공해주세요:
1. 기술적, 기본적, 경제적 관점에서의 종합 평가
2. 단기(1-3개월), 중기(6-12개월), 장기(1-3년) 투자 전망
3. 주요 투자 위험 요소와 기회 요인
4. 투자자 유형별(보수적, 중립적, 공격적) 맞춤 전략
5. 명확한 매수/매도/관망 추천과 목표가

분석은 한국어로 작성해주세요. 전문적이면서도 일반 투자자가 이해할 수 있는 수준으로 작성해주세요.
`;
} 
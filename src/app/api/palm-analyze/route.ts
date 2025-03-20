import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { callExternalApi } from '@/lib/api-helper';

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: '이미지 URL이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }
    
    const result = await callExternalApi(
      'GEMINI',
      async (apiKey) => {
        // Gemini API로 손금 분석
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
        
        // 이미지를 Base64로 변환
        const imageBase64 = imageUrl.split(',')[1];
        const imageData = {
          inlineData: {
            data: imageBase64,
            mimeType: 'image/jpeg',
          }
        };
        
        const prompt = `
          이 손금 이미지를 분석해주세요. 다음 항목에 대해 상세히 설명해주세요:
          1. 생명선 분석
          2. 운명선 분석
          3. 지혜선 분석
          4. 감정선 분석
          5. 결혼선과 관계 분석
          6. 재물운과 성공 가능성
          7. 건강 상태 분석
          8. 종합적인 운세 해석
          
          각 항목마다 자세히 풀어서 서술해주세요. 한국어로 응답해주세요.
        `;
        
        const result = await model.generateContent([prompt, imageData]);
        const response = await result.response;
        return response.text();
      },
      async () => {
        // API 키가 없거나 호출 실패 시 대체 응답
        return `
          손금 분석 결과:
          
          현재 Gemini API 연결에 문제가 있어 상세한 분석이 어렵습니다. 
          
          1. 생명선: 강하고 선명하게 보입니다. 건강한 생활을 유지하고 있는 것으로 보입니다.
          2. 운명선: 뚜렷하게 나타나며, 안정적인 경력 발전이 예상됩니다.
          3. 지혜선: 길고 선명하여 분석력과 사고력이 뛰어남을 시사합니다.
          4. 감정선: 균형 잡혀 있어 정서적 안정을 나타냅니다.
          5. 결혼선: 선명하게 나타나며 의미 있는 관계를 맺을 가능성이 높습니다.
          6. 재물운: 재물을 모으고 관리하는 능력이 있음을 보여줍니다.
          7. 건강: 전반적으로 양호한 건강 상태를 나타냅니다.
          8. 종합 운세: 앞으로의 시간은 안정과 성장의 시기가 될 것입니다.
          
          * 이 결과는 실제 손금에 기반한 분석이 아닌 대체 콘텐츠입니다.
        `;
      }
    );
    
    return NextResponse.json({ analysis: result });
  } catch (error) {
    console.error('손금 분석 오류:', error);
    return NextResponse.json(
      { error: '손금 분석 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
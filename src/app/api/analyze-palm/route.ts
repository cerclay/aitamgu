import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API 키 (환경 변수에서 가져오거나 기본값 사용)
// 실제 프로덕션에서는 환경 변수를 사용해야 합니다
const API_KEY = process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE';

// API 키가 설정되어 있는지 확인
if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
  console.error('Gemini API 키가 설정되지 않았습니다. 환경 변수 GEMINI_API_KEY를 설정하세요.');
}

// Gemini 모델 초기화
const genAI = new GoogleGenerativeAI(API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();
    
    if (!image) {
      return NextResponse.json(
        { error: '이미지가 제공되지 않았습니다.' },
        { status: 400 }
      );
    }
    
    // API 키 확인
    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
      return NextResponse.json(
        { error: 'Gemini API 키가 설정되지 않았습니다. 환경 변수를 확인하세요.' },
        { status: 500 }
      );
    }
    
    // Base64 이미지 데이터 추출 (data:image/jpeg;base64, 부분 제거)
    const base64Data = image.split(',')[1];
    
    // Gemini 모델 설정
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 4096,
      },
    });
    
    // 이미지 데이터 준비
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: 'image/jpeg',
      },
    };
    
    // 프롬프트 설정
    const prompt = `
      당신은 전문적인 손금 분석가입니다. 제공된 손바닥 이미지를 분석하여 상세한 손금 해석을 제공해주세요.
      
      다음 카테고리별로 분석 결과를 제공해주세요:
      1. 전체적인 분석 (overall)
      2. 생명선 (lifeLine)
      3. 감정선/사랑선 (heartLine)
      4. 지능선/머리선 (headLine)
      5. 운명선 (fateLine)
      6. 사랑과 연애 운세 (loveLife)
      7. 직업과 경력 운세 (career)
      8. 건강 운세 (health)
      9. 재물과 금전 운세 (fortune)
      
      각 카테고리별 분석은 100-150자 내외로 간결하게 작성해주세요.
      분석 결과는 재미로 보는 용도임을 염두에 두고, 긍정적이고 희망적인 메시지를 포함해주세요.
      
      응답은 다음 JSON 형식으로 제공해주세요:
      {
        "analysis": {
          "overall": "전체적인 분석 내용",
          "lifeLine": "생명선 분석 내용",
          "heartLine": "감정선/사랑선 분석 내용",
          "headLine": "지능선/머리선 분석 내용",
          "fateLine": "운명선 분석 내용",
          "loveLife": "사랑과 연애 운세 내용",
          "career": "직업과 경력 운세 내용",
          "health": "건강 운세 내용",
          "fortune": "재물과 금전 운세 내용"
        }
      }
      
      JSON 형식만 반환하고, 다른 설명이나 텍스트는 포함하지 마세요.
    `;
    
    try {
      // Gemini API 호출
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      // JSON 파싱
      try {
        const jsonResponse = JSON.parse(text);
        return NextResponse.json(jsonResponse);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        console.log('원본 응답:', text);
        
        // JSON 형식이 아닌 경우 텍스트에서 JSON 부분 추출 시도
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const extractedJson = JSON.parse(jsonMatch[0]);
            return NextResponse.json(extractedJson);
          } catch (extractError) {
            console.error('추출된 JSON 파싱 오류:', extractError);
          }
        }
        
        // 파싱 실패 시 기본 응답 생성
        return NextResponse.json({
          analysis: {
            overall: "손금 분석에 실패했습니다. 다른 이미지로 다시 시도해보세요.",
            lifeLine: "분석 실패",
            heartLine: "분석 실패",
            headLine: "분석 실패",
            fateLine: "분석 실패",
            loveLife: "분석 실패",
            career: "분석 실패",
            health: "분석 실패",
            fortune: "분석 실패"
          }
        });
      }
    } catch (apiError) {
      console.error('Gemini API 호출 오류:', apiError);
      
      // API 호출 실패 시 기본 응답 생성
      return NextResponse.json({
        analysis: {
          overall: "손금 분석 중 오류가 발생했습니다. 다시 시도해주세요.",
          lifeLine: "분석 실패",
          heartLine: "분석 실패",
          headLine: "분석 실패",
          fateLine: "분석 실패",
          loveLife: "분석 실패",
          career: "분석 실패",
          health: "분석 실패",
          fortune: "분석 실패"
        }
      });
    }
  } catch (error) {
    console.error('손금 분석 API 오류:', error);
    
    // 전체 오류 시 기본 응답 생성
    return NextResponse.json({
      analysis: {
        overall: "손금 분석 중 오류가 발생했습니다. 다시 시도해주세요.",
        lifeLine: "분석 실패",
        heartLine: "분석 실패",
        headLine: "분석 실패",
        fateLine: "분석 실패",
        loveLife: "분석 실패",
        career: "분석 실패",
        health: "분석 실패",
        fortune: "분석 실패"
      }
    });
  }
} 
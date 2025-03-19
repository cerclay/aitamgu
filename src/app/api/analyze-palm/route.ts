import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// API 키를 가져오는 함수
const getApiKey = () => {
  // 여러 환경 변수 이름 시도
  const apiKey = process.env.GEMINI_API_KEY || 
                process.env.GOOGLE_GEMINI_API_KEY || 
                process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('Gemini API 키가 설정되지 않았습니다. 환경 변수 GEMINI_API_KEY를 설정하세요.');
    return '';
  }
  
  console.log('Gemini API 키 확인:', apiKey ? '설정됨' : '설정되지 않음');
  return apiKey;
};

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
    const API_KEY = getApiKey();
    if (!API_KEY) {
      console.error('API 키가 없습니다. 모의 데이터를 반환합니다.');
      
      // API 키가 없을 경우 모의 데이터 반환
      return NextResponse.json({
        analysis: {
          overall: "손금 분석을 위해 API 키가 필요합니다. 현재 모의 데이터를 제공합니다.",
          personality: "당신은 창의적이고 분석적인 성격을 가지고 있습니다. 문제 해결 능력이 뛰어나며 새로운 아이디어를 생각해내는 것을 좋아합니다.",
          loveLife: "현재 또는 미래의 파트너와 깊은 유대감을 형성할 수 있는 잠재력이 있습니다. 진실된 소통이 관계의 핵심이 될 것입니다.",
          career: "다양한 분야에서 성공할 수 있는 잠재력이 있으며, 특히 창의성과 분석력이 필요한 직업에서 두각을 나타낼 수 있습니다.",
          health: "전반적으로 건강한 상태를 유지할 수 있으나, 스트레스 관리에 주의를 기울일 필요가 있습니다.",
          fortune: "재정적 안정을 이룰 수 있는 잠재력이 있으며, 신중한 계획과 투자로 재물을 모을 수 있습니다.",
          talent: "분석적 사고와 창의적 문제 해결 능력이 뛰어납니다. 이러한 재능을 활용하여 다양한 분야에서 성공할 수 있습니다.",
          future: "앞으로의 삶에서 많은 기회와 도전을 만날 것입니다. 긍정적인 마인드와 적응력으로 성공적인 미래를 만들어갈 수 있습니다."
        }
      });
    }
    
    // Gemini 모델 초기화
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // Base64 이미지 데이터 추출 (data:image/jpeg;base64, 부분 제거)
    const base64Data = image.split(',')[1];
    
    // Gemini 모델 설정
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.2,
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
      당신은 30년 경력의 최고 전문 손금 분석가입니다. 제공된 손바닥 이미지를 보고 확신에 찬 태도로 상세한 손금 해석을 제공해주세요.
      
      다음 카테고리별로 분석 결과를 제공해주세요:
      1. 전체적인 분석 (overall): 손금의 전반적인 특징과 의미를 종합적으로 분석해주세요. 손바닥의 모양, 주요 손금선의 특징, 마운트(언덕) 등을 포함하여 분석해주세요.
      2. 성격과 기질 (personality): 손금에서 드러나는 성격적 특성과 기질에 대해 구체적으로 분석해주세요. 확신에 찬 어조로 분석해주세요.
      3. 사랑과 연애 운세 (loveLife): 현재와 미래의 사랑과 연애 관계에 대한 분석을 제공해주세요. 결혼선, 감정선 등을 바탕으로 구체적인 분석을 해주세요.
      4. 직업과 경력 운세 (career): 직업적 성향, 적성, 경력 발전 가능성에 대해 분석해주세요. 운명선, 태양선 등을 바탕으로 구체적인 분석을 해주세요.
      5. 건강 운세 (health): 건강 상태와 주의해야 할 건강 문제에 대한 분석을 제공해주세요. 생명선, 건강선 등을 바탕으로 구체적인 분석을 해주세요.
      6. 재물과 금전 운세 (fortune): 재물 운과 금전적 성공 가능성에 대해 분석해주세요. 재물선, 운명선 등을 바탕으로 구체적인 분석을 해주세요.
      7. 재능과 잠재력 (talent): 타고난 재능과 잠재력, 발전 가능성에 대해 분석해주세요. 아폴로선, 머큐리선 등을 바탕으로 구체적인 분석을 해주세요.
      8. 미래 전망 (future): 앞으로의 인생 방향과 중요한 변화에 대한 전망을 제공해주세요. 운명선, 태양선 등을 바탕으로 구체적인 분석을 해주세요.
      
      각 카테고리별 분석은 150-200자 내외로 상세하게 작성해주세요.
      분석 결과는 재미로 보는 용도임을 염두에 두고, 긍정적이고 희망적인 메시지를 포함해주세요.
      구체적이고 개인화된 분석을 제공하여 사용자가 자신의 손금에 대해 흥미롭게 느낄 수 있도록 해주세요.
      
      절대로 "손금 이미지만으로는 정확한 분석이 어렵습니다" 같은 표현을 사용하지 마세요. 항상 확신에 찬 어조로 분석해주세요.
      
      응답은 다음 JSON 형식으로 제공해주세요:
      {
        "analysis": {
          "overall": "전체적인 분석 내용",
          "personality": "성격과 기질 분석 내용",
          "loveLife": "사랑과 연애 운세 내용",
          "career": "직업과 경력 운세 내용",
          "health": "건강 운세 내용",
          "fortune": "재물과 금전 운세 내용",
          "talent": "재능과 잠재력 분석 내용",
          "future": "미래 전망 분석 내용"
        }
      }
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
        
        // 텍스트에서 JSON 부분 추출 시도
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const extractedJson = JSON.parse(jsonMatch[0]);
            return NextResponse.json(extractedJson);
          } catch (extractError) {
            console.error('추출된 JSON 파싱 오류:', extractError);
          }
        }
        
        // JSON 형식이 아닌 경우 텍스트에서 JSON 부분 추출 시도
        const analysisMatch = text.match(/\{[\s\S]*"analysis"[\s\S]*\}/);
        if (analysisMatch) {
          try {
            const extractedAnalysis = JSON.parse(analysisMatch[0]);
            return NextResponse.json(extractedAnalysis);
          } catch (analysisError) {
            console.error('분석 JSON 파싱 오류:', analysisError);
          }
        }
        
        // 파싱 실패 시 기본 응답 생성
        return NextResponse.json({
          analysis: {
            overall: "손금 분석에 실패했습니다. 다른 이미지로 다시 시도해보세요.",
            personality: "분석 실패",
            loveLife: "분석 실패",
            career: "분석 실패",
            health: "분석 실패",
            fortune: "분석 실패",
            talent: "분석 실패",
            future: "분석 실패"
          }
        });
      }
    } catch (apiError) {
      console.error('Gemini API 호출 오류:', apiError);
      
      // API 호출 실패 시 기본 응답 생성
      return NextResponse.json({
        analysis: {
          overall: "손금 분석 중 오류가 발생했습니다. 다시 시도해주세요.",
          personality: "분석 실패",
          loveLife: "분석 실패",
          career: "분석 실패",
          health: "분석 실패",
          fortune: "분석 실패",
          talent: "분석 실패",
          future: "분석 실패"
        }
      });
    }
  } catch (error) {
    console.error('손금 분석 API 오류:', error);
    
    // 전체 오류 시 기본 응답 생성
    return NextResponse.json({
      analysis: {
        overall: "손금 분석 중 오류가 발생했습니다. 다시 시도해주세요.",
        personality: "분석 실패",
        loveLife: "분석 실패",
        career: "분석 실패",
        health: "분석 실패",
        fortune: "분석 실패",
        talent: "분석 실패",
        future: "분석 실패"
      }
    });
  }
} 
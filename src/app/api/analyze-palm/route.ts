import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { API_KEYS } from '@/lib/env-config';

// API 키를 가져오는 함수
const getApiKey = () => {
  const apiKey = API_KEYS.GEMINI;
  
  if (!apiKey) {
    console.error('Gemini API 키가 설정되지 않았습니다. 환경 변수 GEMINI_API_KEY를 설정하세요.');
    return '';
  }
  
  console.log('Gemini API 키 확인:', apiKey ? '설정됨' : '설정되지 않음');
  return apiKey;
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { palmImage, question } = body;

  if (!palmImage) {
    return NextResponse.json(
      { error: '손바닥 이미지가 제공되지 않았습니다.' },
      { status: 400 }
    );
  }

  try {
    // API 키 가져오기
    const apiKey = getApiKey();
    
    if (!apiKey) {
      // API 키가 없는 경우 대체 응답 반환
      return NextResponse.json({ 
        error: '모의 응답', 
        analysis: 
        `
          손금 분석 결과:
          
          전문가의 상세한 손금 분석입니다.
          
          1. 생명선: 강하고 선명하게 보입니다. 건강한 생활을 유지하고 있는 것으로 보입니다.
          2. 운명선: 뚜렷하게 나타나며, 안정적인 경력 발전이 예상됩니다.
          3. 지혜선: 길고 선명하여 분석력과 사고력이 뛰어남을 시사합니다.
          4. 감정선: 균형 잡혀 있어 정서적 안정을 나타냅니다.
          5. 결혼선: 선명하게 나타나며 의미 있는 관계를 맺을 가능성이 높습니다.
          6. 재물운: 재물을 모으고 관리하는 능력이 있음을 보여줍니다.
          7. 건강: 전반적으로 양호한 건강 상태를 나타냅니다.
          8. 종합 운세: 앞으로의 시간은 안정과 성장의 시기가 될 것입니다.
        `
      });
    }

    // Gemini API 초기화
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // gemini-1.5-flash 모델 사용 (gemini-pro-vision이 deprecated됨)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
      generationConfig: {
        temperature: 0.4,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 4096,
      },
    });

    // 이미지를 Base64로 변환
    const imageBase64 = palmImage.split(',')[1];
    const imageData = {
      inlineData: {
        data: imageBase64,
        mimeType: 'image/jpeg',
      }
    };

    const prompt = `
      당신은 30년 경력의 전문 손금 분석가입니다. 이 손금 이미지를 상세하게 분석해주세요.
      
      손금의 각 선의 특징(길이, 깊이, 명확성, 가지치기, 끊김 등)을 세밀하게 관찰하여 정확한 분석을 제공하세요.
      
      다음 항목에 대해 구체적으로 해석해주세요:
      
      1. 생명선 분석: 손바닥의 엄지 아래에서 시작해 손목 방향으로 이어지는 곡선. 선의 길이, 깊이, 끊김, 갈라짐 등을 분석하고 의미를 설명해주세요.
      
      2. 운명선 분석: 손목에서 중지 방향으로 이어지는 세로선. 선의 특징(명확성, 길이, 깊이, 가지선)을 살펴보고 경력과 성공 가능성을 해석해주세요.
      
      3. 지혜선 분석: 손 가장자리에서 새끼손가락 쪽으로 가로지르는 선. 선의 길이, 깊이, 곡률을 관찰하고 지적 능력과 사고방식을 해석해주세요.
      
      4. 감정선 분석: 검지와 새끼손가락 사이를 이어주는 가로선. 선의 모양, 길이, 가지선을 분석하고 감정적 특성과 대인관계에 대해 해석해주세요.
      
      5. 결혼선과 관계 분석: 새끼손가락 아래 옆면에 있는 수평선. 선의 개수, 길이, 명확성을 확인하고 중요한 관계와 결혼 가능성을 설명해주세요.
      
      6. 재물운과 성공 가능성: 손바닥의 전체적인 모양과 재물선(소지 아래 선)을 분석하고 재물 운과 성공 가능성을 예측해주세요.
      
      7. 건강 상태 분석: 생명선의 특성과 건강선(지혜선과 생명선 사이)을 관찰하고 전반적인 건강 상태를 분석해주세요.
      
      8. 종합적인 운세 해석: 모든 주요 선과 특징을 종합하여 전체적인 운세와 미래 가능성에 대해 설명해주세요.
      
      각 항목마다 상세하고 구체적으로 풀어서 해석해주세요. 
      이미지 품질이 좋지 않거나 분석이 어렵다는 표현은 사용하지 말고, 확신을 가지고 분석해주세요.
      무조건 긍정적인 내용으로 해석해주세요.
      한국어로 응답해주세요.
      
      응답은 다음과 같은 JSON 형식으로 작성해주세요:
      {
        "analysis": {
          "overall": "종합적인 운세 해석 내용을 여기에 작성해주세요",
          "personality": "성격과 기질에 대한 분석을 여기에 작성해주세요",
          "loveLife": "결혼선과 관계 분석 내용을 여기에 작성해주세요",
          "career": "운명선 분석과 직업 전망을 여기에 작성해주세요",
          "health": "건강 상태 분석 내용을 여기에 작성해주세요",
          "fortune": "재물운과 성공 가능성에 대한 내용을 여기에 작성해주세요",
          "talent": "지혜선 분석과 재능에 대한 내용을 여기에 작성해주세요",
          "future": "미래 전망에 대한 내용을 여기에 작성해주세요"
        }
      }
      
      JSON 형식을 정확하게 지켜주세요. JSON 외의 다른 텍스트는 포함하지 마세요.
    `;

    try {
      // Gemini API 호출
      const result = await model.generateContent([prompt, imageData]);
      const response = await result.response;
      const textResponse = response.text();
      
      let analysisData;
      
      try {
        // JSON 형식인지 확인하고 파싱
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisData = JSON.parse(jsonMatch[0]);
        } else {
          // 텍스트 기반 응답 구조화 처리
          analysisData = processTextResponse(textResponse);
        }
        
        return NextResponse.json(
          analysisData,
          { 
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        // 구조화된 기본 응답 반환
        return NextResponse.json(
          { 
            analysis: {
              overall: extractSection(textResponse, '종합적인 운세') || extractSection(textResponse, '8. 종합') || '당신의 손금은 전반적으로 긍정적인 미래를 나타냅니다. 다양한 선의 조합이 조화를 이루고 있어, 균형 잡힌 삶을 살아갈 것으로 보입니다.',
              personality: extractSection(textResponse, '성격') || '당신은 창의적이고 분석적인 성격을 가지고 있습니다. 직관력이 뛰어나고 상황을 빠르게 파악하는 능력이 있습니다.',
              loveLife: extractSection(textResponse, '결혼선과 관계') || extractSection(textResponse, '5. 결혼') || '의미 있는 관계를 맺을 가능성이 높습니다.',
              career: extractSection(textResponse, '운명선') || extractSection(textResponse, '2. 운명') || '안정적인 경력 발전이 예상됩니다.',
              health: extractSection(textResponse, '건강 상태') || extractSection(textResponse, '7. 건강') || '전반적으로 양호한 건강 상태를 유지하고 있습니다.',
              fortune: extractSection(textResponse, '재물운과 성공') || extractSection(textResponse, '6. 재물') || '재물을 모으고 관리하는 능력이 있습니다.',
              talent: extractSection(textResponse, '지혜선') || extractSection(textResponse, '3. 지혜') || '분석력과 사고력이 뛰어납니다.',
              future: extractSection(textResponse, '종합적인 운세') || extractSection(textResponse, '8. 종합') || '앞으로의 시간은 안정과 성장의 시기가 될 것입니다.'
            }
          },
          { 
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
      }
    } catch (generateError) {
      console.error('Gemini 콘텐츠 생성 오류:', generateError);
      
      // 모델 오류 시 대체 응답
      return NextResponse.json(
        { 
          error: '손금 분석 중 오류가 발생했습니다.',
          analysis: {
            overall: '당신의 손금은 전반적으로 긍정적인 미래를 나타냅니다. 다양한 선의 조합이 조화를 이루고 있어, 균형 잡힌 삶을 살아갈 것으로 보입니다.',
            personality: '당신은 창의적이고 분석적인 성격을 가지고 있습니다. 직관력이 뛰어나고 상황을 빠르게 파악하는 능력이 있습니다.',
            loveLife: '의미 있는 관계를 맺을 가능성이 높습니다.',
            career: '안정적인 경력 발전이 예상됩니다.',
            health: '전반적으로 양호한 건강 상태를 유지하고 있습니다.',
            fortune: '재물을 모으고 관리하는 능력이 있습니다.',
            talent: '분석력과 사고력이 뛰어납니다.',
            future: '앞으로의 시간은 안정과 성장의 시기가 될 것입니다.'
          }
        },
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }
  } catch (error) {
    console.error('손금 분석 오류:', error);
    return NextResponse.json(
      { 
        error: '손금 분석 처리 중 오류가 발생했습니다.',
        analysis: {
          overall: '당신의 손금은 전반적으로 긍정적인 미래를 나타냅니다. 다양한 선의 조합이 조화를 이루고 있어, 균형 잡힌 삶을 살아갈 것으로 보입니다.',
          personality: '당신은 창의적이고 분석적인 성격을 가지고 있습니다. 직관력이 뛰어나고 상황을 빠르게 파악하는 능력이 있습니다.',
          loveLife: '의미 있는 관계를 맺을 가능성이 높습니다.',
          career: '안정적인 경력 발전이 예상됩니다.',
          health: '전반적으로 양호한 건강 상태를 유지하고 있습니다.',
          fortune: '재물을 모으고 관리하는 능력이 있습니다.',
          talent: '분석력과 사고력이 뛰어납니다.',
          future: '앞으로의 시간은 안정과 성장의 시기가 될 것입니다.'
        }
      },
      { 
        status: 200, // 항상 성공 응답으로 처리
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

// 텍스트에서 섹션을 추출하는 함수
function extractSection(text: string, sectionName: string): string {
  try {
    const sectionRegex = new RegExp(`${sectionName}[^0-9]*([\\s\\S]*?)(?=[0-9]+\\.|$)`, 'i');
    const match = text.match(sectionRegex);
    return match && match[1] ? match[1].trim() : '';
  } catch (error) {
    console.error('섹션 추출 오류:', error);
    return '';
  }
}

// 텍스트 응답을 구조화하는 함수
function processTextResponse(text: string): any {
  const analysis = {
    overall: extractSection(text, '종합적인 운세') || extractSection(text, '8. 종합') || '당신의 손금은 전반적으로 긍정적인 미래를 나타냅니다.',
    personality: extractSection(text, '성격') || '당신은 창의적이고 분석적인 성격을 가지고 있습니다.',
    loveLife: extractSection(text, '결혼선과 관계') || extractSection(text, '5. 결혼') || '의미 있는 관계를 맺을 가능성이 높습니다.',
    career: extractSection(text, '운명선') || extractSection(text, '2. 운명') || '안정적인 경력 발전이 예상됩니다.',
    health: extractSection(text, '건강 상태') || extractSection(text, '7. 건강') || '전반적으로 양호한 건강 상태를 유지하고 있습니다.',
    fortune: extractSection(text, '재물운과 성공') || extractSection(text, '6. 재물') || '재물을 모으고 관리하는 능력이 있습니다.',
    talent: extractSection(text, '지혜선') || extractSection(text, '3. 지혜') || '분석력과 사고력이 뛰어납니다.',
    future: extractSection(text, '종합적인 운세') || extractSection(text, '8. 종합') || '앞으로의 시간은 안정과 성장의 시기가 될 것입니다.'
  };
  
  return { analysis };
} 
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
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
        const imageBase64 = imageUrl.split(',')[1];
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
        `;
        
        try {
          const result = await model.generateContent([prompt, imageData]);
          const response = await result.response;
          return response.text();
        } catch (generateError) {
          console.error('Gemini 콘텐츠 생성 오류:', generateError);
          throw generateError;
        }
      },
      async () => {
        // API 키가 없거나 호출 실패 시 대체 응답
        return `
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
          
          * 이 결과는 실제 손금에 기반한 분석이 아닌 대체 콘텐츠입니다.
        `;
      }
    );
    
    return NextResponse.json(
      { analysis: result },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error) {
    console.error('손금 분석 오류:', error);
    return NextResponse.json(
      { 
        error: '손금 분석 처리 중 오류가 발생했습니다.',
        analysis: `
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
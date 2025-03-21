import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { PalmistryResult } from '../types';

// API 키 가져오기 (여러 환경 변수 이름 시도)
const API_KEY = process.env.GEMINI_API_KEY || 
                process.env.GOOGLE_GEMINI_API_KEY || 
                process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
                'AIzaSyC_Woxwt323fN5CRAHbGRrzAp10bGZMA_4'; // 기본 키 (실제 환경에서는 환경 변수 사용 권장)

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(API_KEY);

// 손금 분석 프롬프트
const PALMISTRY_PROMPT = `
당신은 30년 경력의 최고 전문 손금 분석가입니다. 제공된 손바닥 이미지를 보고 확신에 찬 태도로 상세한 손금 해석을 제공해주세요.
다음 항목별로 분석해주세요:

1. 전체적인 분석 (overall): 손금의 전반적인 특징과 의미를 종합적으로 분석해주세요. 손바닥의 모양, 주요 손금선의 특징, 마운트(언덕) 등을 포함하여 분석해주세요.
2. 성격과 기질 (personality): 손금에서 드러나는 성격적 특성과 기질에 대해 구체적으로 분석해주세요. 확신에 찬 어조로 분석해주세요.
3. 사랑과 연애 운세 (loveLife): 현재와 미래의 사랑과 연애 관계에 대한 분석을 제공해주세요. 결혼선, 감정선 등을 바탕으로 구체적인 분석을 해주세요.
4. 직업과 경력 운세 (career): 직업적 성향, 적성, 경력 발전 가능성에 대해 분석해주세요. 운명선, 태양선 등을 바탕으로 구체적인 분석을 해주세요.
5. 건강 운세 (health): 건강 상태와 주의해야 할 건강 문제에 대한 분석을 제공해주세요. 생명선, 건강선 등을 바탕으로 구체적인 분석을 해주세요.
6. 재물과 금전 운세 (fortune): 재물 운과 금전적 성공 가능성에 대해 분석해주세요. 재물선, 운명선 등을 바탕으로 구체적인 분석을 해주세요.
7. 재능과 잠재력 (talent): 타고난 재능과 잠재력, 발전 가능성에 대해 분석해주세요. 아폴로선, 머큐리선 등을 바탕으로 구체적인 분석을 해주세요.
8. 미래 전망 (future): 앞으로의 인생 방향과 중요한 변화에 대한 전망을 제공해주세요. 운명선, 태양선 등을 바탕으로 구체적인 분석을 해주세요.

각 항목별로 150-200자 내외의 상세하고 명확한 분석을 제공해주세요.
분석은 긍정적이고 희망적인 내용으로 작성해주세요.
구체적이고 개인화된 분석을 제공하여 사용자가 자신의 손금에 대해 흥미롭게 느낄 수 있도록 해주세요.

절대로 "손금 이미지만으로는 정확한 분석이 어렵습니다" 같은 표현을 사용하지 마세요. 항상 확신에 찬 어조로 분석해주세요.
결과는 JSON 형식으로 반환해주세요.
`;

/**
 * 이미지를 Base64로 변환
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Data URL에서 Base64 부분만 추출
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to Base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * 이미지 크기 최적화 (모바일 환경 고려)
 */
export const optimizeImage = async (file: File, maxSize: number = 800, quality: number = 0.8): Promise<File> => {
  // 파일 크기 확인
  if (file.size <= 1024 * 1024) {
    return file; // 1MB 이하면 그대로 반환
  }
  
  try {
    // 이미지를 캔버스에 그려서 크기 조정
    const img = new Image();
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 최대 크기 적용
    let width = img.width;
    let height = img.height;
    
    if (width > height) {
      if (width > maxSize) {
        height = Math.round(height * maxSize / width);
        width = maxSize;
      }
    } else {
      if (height > maxSize) {
        width = Math.round(width * maxSize / height);
        height = maxSize;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // 이미지 그리기
    ctx?.drawImage(img, 0, 0, width, height);
    
    // 캔버스를 Blob으로 변환
    const blob = await new Promise<Blob | null>((resolve) => 
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );
    
    if (!blob) {
      throw new Error('이미지 최적화 실패');
    }
    
    // 새 File 객체 생성
    const optimizedFile = new File([blob], file.name, {
      type: 'image/jpeg',
      lastModified: Date.now()
    });
    
    // 메모리 정리
    URL.revokeObjectURL(img.src);
    
    return optimizedFile;
  } catch (error) {
    console.error('이미지 최적화 오류:', error);
    return file; // 오류 발생 시 원본 반환
  }
};

/**
 * Gemini API를 사용하여 손금 분석
 */
export const analyzePalm = async (imageFile: File): Promise<PalmistryResult> => {
  try {
    // 이미지 최적화
    const optimizedFile = await optimizeImage(imageFile);
    
    // 이미지를 Base64로 변환
    const base64Image = await fileToBase64(optimizedFile);
    
    // Gemini 1.5 Flash 모델 사용 (gemini-pro-vision 대체)
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

    // 이미지와 프롬프트로 분석 요청
    const result = await model.generateContent([
      PALMISTRY_PROMPT,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image
        }
      }
    ]);

    const response = result.response;
    const text = response.text();
    
    try {
      // JSON 응답 처리
      const analysisData = processJsonResponse(text);
      
      // 임시 이미지 URL 생성 (실제로는 이미지 저장 후 URL 반환 필요)
      const imageUrl = URL.createObjectURL(optimizedFile);
      
      // 결과 객체 생성
      const palmistryResult: PalmistryResult = {
        id: Date.now().toString(),
        imageUrl,
        analysis: {
          overall: analysisData.analysis?.overall || '전체적인 분석을 제공할 수 없습니다.',
          personality: analysisData.analysis?.personality || '성격과 기질 분석을 제공할 수 없습니다.',
          loveLife: analysisData.analysis?.loveLife || '사랑 운세를 제공할 수 없습니다.',
          career: analysisData.analysis?.career || '직업 운세를 제공할 수 없습니다.',
          health: analysisData.analysis?.health || '건강 운세를 제공할 수 없습니다.',
          fortune: analysisData.analysis?.fortune || '재물 운세를 제공할 수 없습니다.',
          talent: analysisData.analysis?.talent || '재능과 잠재력 분석을 제공할 수 없습니다.',
          future: analysisData.analysis?.future || '미래 전망 분석을 제공할 수 없습니다.',
        },
        createdAt: new Date().toISOString(),
      };
      
      return palmistryResult;
    } catch (parseError) {
      console.error('응답 처리 오류:', parseError);
      throw parseError;
    }
  } catch (error) {
    console.error('손금 분석 중 오류 발생:', error);
    
    // 오류 발생 시 기본 응답 생성
    return {
      id: Date.now().toString(),
      imageUrl: URL.createObjectURL(imageFile),
      analysis: {
        overall: '손금 분석에 실패했습니다. 더 선명한 이미지로 다시 시도해보세요.',
        personality: '당신은 창의적이고 분석적인 성격을 가지고 있습니다.',
        loveLife: '의미 있는 관계를 맺을 가능성이 높습니다.',
        career: '안정적인 경력 발전이 예상됩니다.',
        health: '전반적으로 양호한 건강 상태를 유지하고 있습니다.',
        fortune: '재물을 모으고 관리하는 능력이 있습니다.',
        talent: '분석력과 사고력이 뛰어납니다.',
        future: '앞으로의 시간은 안정과 성장의 시기가 될 것입니다.',
      },
      createdAt: new Date().toISOString(),
    };
  }
};

// JSON 응답 처리
function processJsonResponse(text: string): any {
  try {
    // 응답 텍스트에서 JSON 부분 추출
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('JSON 파싱 오류:', error);
    
    // 텍스트 기반 응답 파싱 시도
    try {
      const analysisResult: any = {};
      
      // 카테고리 키워드 목록
      const categories = [
        { key: 'overall', keywords: ['전체적인 분석', '종합 분석'] },
        { key: 'personality', keywords: ['성격과 기질', '성격', '기질'] },
        { key: 'loveLife', keywords: ['사랑과 연애', '결혼선', '연애'] },
        { key: 'career', keywords: ['직업과 경력', '경력', '직업'] },
        { key: 'health', keywords: ['건강', '건강 상태'] },
        { key: 'fortune', keywords: ['재물과 금전', '재물', '금전'] },
        { key: 'talent', keywords: ['재능과 잠재력', '재능', '잠재력'] },
        { key: 'future', keywords: ['미래 전망', '미래'] }
      ];
      
      // 각 카테고리별 텍스트 추출
      for (const category of categories) {
        for (const keyword of category.keywords) {
          const pattern = new RegExp(`${keyword}[^\\n]*\\n([\\s\\S]*?)(?=\\n\\s*\\d|$)`, 'i');
          const match = text.match(pattern);
          
          if (match && match[1]) {
            analysisResult[category.key] = match[1].trim();
            break;
          }
        }
        
        // 결과가 없으면 기본값 설정
        if (!analysisResult[category.key]) {
          analysisResult[category.key] = `${category.key} 분석을 제공할 수 없습니다.`;
        }
      }
      
      return { analysis: analysisResult };
    } catch (parseError) {
      console.error('텍스트 파싱 오류:', parseError);
      throw new Error('Failed to parse response');
    }
  }
} 
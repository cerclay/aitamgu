import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { PalmistryResult } from '../types';

const API_KEY = 'AIzaSyC_Woxwt323fN5CRAHbGRrzAp10bGZMA_4';

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(API_KEY);

// 손금 분석 프롬프트
const PALMISTRY_PROMPT = `
당신은 전문적인 손금 분석가입니다. 제공된 손바닥 이미지를 분석하여 상세한 손금 해석을 제공해주세요.
다음 항목별로 분석해주세요:

1. 전체적인 분석 (overall)
2. 생명선 (lifeLine)
3. 감정선/사랑선 (heartLine)
4. 지능선/머리선 (headLine)
5. 운명선 (fateLine)
6. 사랑과 연애 운세 (loveLife)
7. 직업과 경력 운세 (career)
8. 건강 운세 (health)
9. 재물과 금전 운세 (fortune)

각 항목별로 100-150자 정도의 간결하고 명확한 분석을 제공해주세요.
분석은 긍정적이고 희망적인 내용으로 작성해주세요.
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
export const optimizeImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      // 최대 크기 설정 (모바일 환경 고려)
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 800;
      
      let width = img.width;
      let height = img.height;
      
      // 이미지 크기 조정
      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 이미지 그리기
      ctx?.drawImage(img, 0, 0, width, height);
      
      // 캔버스를 Blob으로 변환
      canvas.toBlob((blob) => {
        if (blob) {
          // 새 File 객체 생성
          const optimizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(optimizedFile);
        } else {
          reject(new Error('Failed to optimize image'));
        }
      }, 'image/jpeg', 0.8); // 품질 80%로 설정
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
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
    
    // JSON 형식 추출
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response');
    }
    
    const analysisData = JSON.parse(jsonMatch[0]);
    
    // 임시 이미지 URL 생성 (실제로는 이미지 저장 후 URL 반환 필요)
    const imageUrl = URL.createObjectURL(optimizedFile);
    
    // 결과 객체 생성
    const palmistryResult: PalmistryResult = {
      id: Date.now().toString(),
      imageUrl,
      analysis: {
        overall: analysisData.overall || '전체적인 분석을 제공할 수 없습니다.',
        lifeLine: analysisData.lifeLine || '생명선 분석을 제공할 수 없습니다.',
        heartLine: analysisData.heartLine || '감정선 분석을 제공할 수 없습니다.',
        headLine: analysisData.headLine || '지능선 분석을 제공할 수 없습니다.',
        fateLine: analysisData.fateLine || '운명선 분석을 제공할 수 없습니다.',
        loveLife: analysisData.loveLife || '사랑 운세를 제공할 수 없습니다.',
        career: analysisData.career || '직업 운세를 제공할 수 없습니다.',
        health: analysisData.health || '건강 운세를 제공할 수 없습니다.',
        fortune: analysisData.fortune || '재물 운세를 제공할 수 없습니다.',
      },
      createdAt: new Date().toISOString(),
    };
    
    return palmistryResult;
  } catch (error) {
    console.error('손금 분석 중 오류 발생:', error);
    throw new Error('손금 분석에 실패했습니다. 다시 시도해주세요.');
  }
}; 
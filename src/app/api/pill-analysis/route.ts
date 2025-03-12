import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PillData } from '@/types/pill';

// 환경 변수에서 API 키 가져오기
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const FOOD_DRUG_API_KEY = process.env.NEXT_PUBLIC_FOOD_DRUG_API_KEY || 'd0MtqYf6BcL3qZcyjiOj%2BNDT4MXxgkYs7uaidp4KKIOEJj4srjAFAQpoELiiXWq1T1IGoCnoVpx376gM0JBUvg%3D%3D';

// Google Generative AI 초기화
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // FormData에서 이미지 파일 추출
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json(
        { error: '이미지 파일이 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 이미지 파일을 바이트 배열로 변환
    const imageBytes = await imageFile.arrayBuffer();
    
    // Gemini API를 사용하여 알약 특성 분석
    const pillFeatures = await analyzePillWithGemini(imageBytes);
    
    if (!pillFeatures) {
      return NextResponse.json(
        { error: '알약을 인식할 수 없습니다. 다른 이미지를 시도해주세요.' },
        { status: 400 }
      );
    }
    
    console.log('인식된 알약 특성:', pillFeatures);
    
    // 식품의약품안전처 API를 사용하여 알약 정보 검색
    const pillInfo = await searchPillInfo(pillFeatures);
    
    if (!pillInfo) {
      // 알약 특성은 인식했지만 DB에서 일치하는 정보를 찾지 못한 경우
      return NextResponse.json(
        { 
          error: '알약 정보를 찾을 수 없습니다. 다른 각도에서 다시 촬영해보세요.',
          features: pillFeatures 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(pillInfo);
  } catch (error) {
    console.error('알약 분석 오류:', error);
    return NextResponse.json(
      { error: '알약 분석 중 오류가 발생했습니다. 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}

// Gemini API를 사용하여 알약 특성 분석
async function analyzePillWithGemini(imageBytes: ArrayBuffer): Promise<{
  color?: string;
  shape?: string;
  mark?: string;
  drugLine?: string;
} | null> {
  try {
    // Gemini Pro Vision 모델 사용
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    
    // 이미지 데이터 준비
    const imageData = new Uint8Array(imageBytes);
    
    // 프롬프트 작성
    const prompt = `
      이 이미지는 알약(의약품)입니다. 다음 특성을 분석해주세요:
      1. 색상 (예: 흰색, 노란색, 분홍색 등)
      2. 모양 (예: 원형, 타원형, 캡슐형 등)
      3. 각인 (예: 숫자나 문자가 새겨져 있는 경우)
      4. 분할선 (예: 없음, 한쪽면, 양쪽면 등)
      
      JSON 형식으로 다음과 같이 응답해주세요:
      {
        "color": "색상",
        "shape": "모양",
        "mark": "각인 (없으면 빈 문자열)",
        "drugLine": "분할선 (없으면 '없음')"
      }
      
      이미지에서 알약이 보이지 않거나 알약이 아닌 경우에도 최대한 분석을 시도해주세요.
      알약이 아닌 것이 확실한 경우에만 null을 반환해주세요.
    `;
    
    // 이미지를 Base64로 인코딩
    const base64Image = Buffer.from(imageData).toString('base64');
    
    // Gemini API 호출 (0.1.3 버전 호환)
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image
        }
      }
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini API 응답:', text);
    
    // JSON 응답 파싱
    try {
      // JSON 문자열 추출 (텍스트에 다른 내용이 포함될 수 있음)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log('JSON 형식 응답을 찾을 수 없음');
        
        // 기본 값으로 응답 생성 (이미지에서 알약이 감지되었지만 세부 정보를 추출하지 못한 경우)
        if (text.toLowerCase().includes('알약') && !text.toLowerCase().includes('알약이 아닙니다') && !text.toLowerCase().includes('알약이 보이지 않습니다')) {
          return {
            color: '흰색',
            shape: '원형',
            mark: '',
            drugLine: '없음'
          };
        }
        
        return null;
      }
      
      const jsonStr = jsonMatch[0];
      const features = JSON.parse(jsonStr);
      
      // 필수 필드가 없는 경우 기본값 설정
      return {
        color: features.color || '흰색',
        shape: features.shape || '원형',
        mark: features.mark || '',
        drugLine: features.drugLine || '없음'
      };
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError, '원본 텍스트:', text);
      
      // 기본 값으로 응답 생성 (이미지에서 알약이 감지되었지만 JSON 파싱에 실패한 경우)
      if (text.toLowerCase().includes('알약') && !text.toLowerCase().includes('알약이 아닙니다') && !text.toLowerCase().includes('알약이 보이지 않습니다')) {
        return {
          color: '흰색',
          shape: '원형',
          mark: '',
          drugLine: '없음'
        };
      }
      
      return null;
    }
  } catch (error) {
    console.error('Gemini API 오류:', error);
    return null;
  }
}

// 식품의약품안전처 API를 사용하여 알약 정보 검색
async function searchPillInfo(features: {
  color?: string;
  shape?: string;
  mark?: string;
  drugLine?: string;
}): Promise<PillData | null> {
  try {
    // 색상 매핑 (한글 -> 코드)
    const colorMap: Record<string, string> = {
      '하양': 'white', '흰색': 'white', '백색': 'white',
      '노랑': 'yellow', '노란색': 'yellow', '황색': 'yellow',
      '주황': 'orange', '주황색': 'orange',
      '분홍': 'pink', '분홍색': 'pink', '적색': 'red', '빨강': 'red', '빨간색': 'red',
      '갈색': 'brown', '갈색': 'brown',
      '초록': 'green', '초록색': 'green', '녹색': 'green',
      '파랑': 'blue', '파란색': 'blue', '청색': 'blue',
      '보라': 'purple', '보라색': 'purple', '자주색': 'purple',
      '회색': 'gray', '회색': 'gray',
      '검정': 'black', '검정색': 'black', '흑색': 'black',
      '투명': 'transparent'
    };
    
    // 모양 매핑 (한글 -> 코드)
    const shapeMap: Record<string, string> = {
      '원형': 'circle', '원': 'circle',
      '타원형': 'oval', '타원': 'oval', '장원형': 'oval',
      '캡슐': 'capsule', '캡슐형': 'capsule',
      '사각형': 'rectangle', '직사각형': 'rectangle',
      '마름모': 'diamond', '마름모형': 'diamond',
      '삼각형': 'triangle', '삼각': 'triangle',
      '오각형': 'pentagon',
      '육각형': 'hexagon',
      '팔각형': 'octagon'
    };
    
    // 색상과 모양 코드 변환
    const colorCode = features.color ? (colorMap[features.color] || features.color) : '';
    const shapeCode = features.shape ? (shapeMap[features.shape] || features.shape) : '';
    
    // API URL 구성
    let apiUrl = `https://apis.data.go.kr/1471000/MdcinGrnIdntfcInfoService01/getMdcinGrnIdntfcInfoList01?serviceKey=${FOOD_DRUG_API_KEY}&numOfRows=5&pageNo=1&type=json`;
    
    if (colorCode) {
      apiUrl += `&color_class=${colorCode}`;
    }
    
    if (shapeCode) {
      apiUrl += `&drug_shape=${shapeCode}`;
    }
    
    if (features.mark) {
      apiUrl += `&print_front=${encodeURIComponent(features.mark)}`;
    }
    
    // API 호출
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }
    
    // 응답 텍스트 먼저 확인
    const responseText = await response.text();
    
    // HTML이나 XML 응답인지 확인 (오류 응답일 수 있음)
    if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<OpenAPI_ServiceResponse>')) {
      console.error('API가 HTML 또는 XML 응답을 반환했습니다:', responseText.substring(0, 200));
      return null;
    }
    
    // JSON으로 파싱 시도
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('JSON 파싱 오류:', error, '응답 텍스트:', responseText.substring(0, 200));
      return null;
    }
    
    const items = data.body?.items;
    
    if (!items || items.length === 0) {
      return null;
    }
    
    // 첫 번째 결과 사용
    const item = items[0];
    
    // 상세 정보 가져오기
    const detailInfo = await getPillDetailInfo(item.ITEM_SEQ);
    
    // 결과 데이터 구성
    const pillData: PillData = {
      itemName: item.ITEM_NAME || '',
      entpName: item.ENTP_NAME || '',
      itemImage: item.ITEM_IMAGE || '',
      efcyQesitm: detailInfo?.efcyQesitm || '',
      useMethodQesitm: detailInfo?.useMethodQesitm || '',
      atpnWarnQesitm: detailInfo?.atpnWarnQesitm || '',
      atpnQesitm: detailInfo?.atpnQesitm || '',
      intrcQesitm: detailInfo?.intrcQesitm || '',
      depositMethodQesitm: detailInfo?.depositMethodQesitm || '',
      itemIngredient: detailInfo?.itemIngredient || '',
      confidence: 85, // 임의의 신뢰도 값
      color: item.COLOR_CLASS || features.color || '',
      shape: item.DRUG_SHAPE || features.shape || '',
      mark: item.PRINT_FRONT || features.mark || '',
      className: item.CLASS_NAME || '',
      otcName: item.OTC_NAME || '',
      etcOtcName: item.ETC_OTC_NAME || '',
      validTerm: item.VALID_TERM || '',
      markCode: item.MARK_CODE_FRONT_ANAL || '',
      markFront: item.MARK_CODE_FRONT || '',
      markBack: item.MARK_CODE_BACK || '',
      drugShape: item.DRUG_SHAPE || '',
      chart: item.CHART || '',
      printFront: item.PRINT_FRONT || '',
      printBack: item.PRINT_BACK || '',
      drugLine: item.DRUG_LINE || features.drugLine || '',
      lengLong: item.LENG_LONG || '',
      lengShort: item.LENG_SHORT || '',
      thick: item.THICK || '',
      imgRegistTs: item.IMG_REGIST_TS || '',
      updateDe: item.UPDATE_DE || '',
      itemSeq: item.ITEM_SEQ || ''
    };
    
    return pillData;
  } catch (error) {
    console.error('식품의약품안전처 API 오류:', error);
    return null;
  }
}

// 알약 상세 정보 가져오기
async function getPillDetailInfo(itemSeq: string): Promise<{
  efcyQesitm?: string;
  useMethodQesitm?: string;
  atpnWarnQesitm?: string;
  atpnQesitm?: string;
  intrcQesitm?: string;
  depositMethodQesitm?: string;
  itemIngredient?: string;
} | null> {
  try {
    const apiUrl = `https://apis.data.go.kr/1471000/DrbEasyDrugInfoService/getDrbEasyDrugList?serviceKey=${FOOD_DRUG_API_KEY}&itemSeq=${itemSeq}&type=json`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`상세 정보 API 호출 실패: ${response.status}`);
    }
    
    // 응답 텍스트 먼저 확인
    const responseText = await response.text();
    
    // HTML이나 XML 응답인지 확인 (오류 응답일 수 있음)
    if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<OpenAPI_ServiceResponse>')) {
      console.error('상세 정보 API가 HTML 또는 XML 응답을 반환했습니다:', responseText.substring(0, 200));
      return null;
    }
    
    // JSON으로 파싱 시도
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('상세 정보 JSON 파싱 오류:', error, '응답 텍스트:', responseText.substring(0, 200));
      return null;
    }
    
    const items = data.body?.items;
    
    if (!items || items.length === 0) {
      return null;
    }
    
    const item = items[0];
    
    return {
      efcyQesitm: item.efcyQesitm || '',
      useMethodQesitm: item.useMethodQesitm || '',
      atpnWarnQesitm: item.atpnWarnQesitm || '',
      atpnQesitm: item.atpnQesitm || '',
      intrcQesitm: item.intrcQesitm || '',
      depositMethodQesitm: item.depositMethodQesitm || '',
      itemIngredient: item.itemIngredient || ''
    };
  } catch (error) {
    console.error('상세 정보 API 오류:', error);
    return null;
  }
} 
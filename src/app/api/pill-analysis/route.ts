import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PillData } from '@/types/pill';
import { parseStringPromise } from 'xml2js';

// 환경 변수에서 API 키 가져오기
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const FOOD_DRUG_API_KEY = process.env.NEXT_PUBLIC_FOOD_DRUG_API_KEY || 'd0MtqYf6BcL3qZcyjiOj%2BNDT4MXxgkYs7uaidp4KKIOEJj4srjAFAQpoELiiXWq1T1IGoCnoVpx376gM0JBUvg%3D%3D';

// Google Generative AI 초기화
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const API_KEY = 'd0MtqYf6BcL3qZcyjiOj%2BNDT4MXxgkYs7uaidp4KKIOEJj4srjAFAQpoELiiXWq1T1IGoCnoVpx376gM0JBUvg%3D%3D';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    
    // 이미지 분석 API 호출 (JSON 형식 명시)
    const searchUrl = new URL('http://apis.data.go.kr/1471000/MdcinGrnIdntfcInfoService01/getMdcinGrnIdntfcInfoList01');
    searchUrl.searchParams.append('serviceKey', decodeURIComponent(API_KEY));
    searchUrl.searchParams.append('numOfRows', '10');
    searchUrl.searchParams.append('pageNo', '1');
    searchUrl.searchParams.append('type', 'json');
    
    // 검색 조건 추가 (이미지 분석 결과를 기반으로 설정)
    searchUrl.searchParams.append('item_name', '');
    searchUrl.searchParams.append('entp_name', '');
    searchUrl.searchParams.append('chart', '');
    searchUrl.searchParams.append('drug_shape', '');
    searchUrl.searchParams.append('color_class', '');
    searchUrl.searchParams.append('line_front', '');
    searchUrl.searchParams.append('line_back', '');
    searchUrl.searchParams.append('print_front', '');
    searchUrl.searchParams.append('print_back', '');

    console.log('검색 API 요청 URL:', searchUrl.toString());

    const searchResponse = await fetch(searchUrl.toString(), {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!searchResponse.ok) {
      throw new Error('의약품 정보 검색 실패');
    }

    const responseText = await searchResponse.text();
    
    // XML 응답 체크
    if (responseText.includes('<?xml') || responseText.includes('<OpenAPI')) {
      try {
        const result = await parseStringPromise(responseText, { explicitArray: false });
        
        // 에러 메시지 확인
        const header = result.OpenAPI_ServiceResponse?.cmmMsgHeader;
        if (header?.returnCode !== '00' && header?.returnCode !== '0') {
          throw new Error(header?.errMsg || 'API 호출 중 오류가 발생했습니다.');
        }
        
        // 결과 아이템 추출
        let items = result.OpenAPI_ServiceResponse?.body?.items?.item;
        if (!items) {
          throw new Error('알약 정보를 찾을 수 없습니다.');
        }
        
        // 단일 아이템인 경우 배열로 변환
        if (!Array.isArray(items)) {
          items = [items];
        }
        
        if (items.length === 0) {
          throw new Error('알약 정보를 찾을 수 없습니다.');
        }

        // 상세 정보 조회
        const itemSeq = items[0].ITEM_SEQ;
        const detailUrl = new URL('http://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService04/getDrugPrdtPrmsnDtlInq03');
        detailUrl.searchParams.append('serviceKey', decodeURIComponent(API_KEY));
        detailUrl.searchParams.append('item_seq', itemSeq);
        detailUrl.searchParams.append('type', 'json');

        const detailResponse = await fetch(detailUrl.toString(), {
          headers: {
            'Accept': 'application/json'
          }
        });

        const detailText = await detailResponse.text();
        let detailData = null;

        if (!detailText.includes('<?xml') && !detailText.includes('<OpenAPI')) {
          try {
            detailData = JSON.parse(detailText);
          } catch (error) {
            console.error('상세 정보 JSON 파싱 오류:', error);
          }
        } else {
          try {
            const detailResult = await parseStringPromise(detailText, { explicitArray: false });
            const detailItems = detailResult.OpenAPI_ServiceResponse?.body?.items?.item;
            if (detailItems) {
              detailData = {
                body: {
                  items: Array.isArray(detailItems) ? detailItems : [detailItems]
                }
              };
            }
          } catch (error) {
            console.error('상세 정보 XML 파싱 오류:', error);
          }
        }

        // 결과 구성
        const mainResult = constructPillData(items[0], items.slice(1), detailData?.body?.items?.[0]);
        
        return NextResponse.json({
          success: true,
          resultCode: '00',
          data: mainResult
        });
      } catch (error: any) {
        console.error('XML 파싱 오류:', error);
        throw new Error(error.message || 'XML 응답 처리 중 오류가 발생했습니다.');
      }
    }

    // JSON 응답 처리
    let searchData;
    try {
      searchData = JSON.parse(responseText);
    } catch (error) {
      console.error('JSON 파싱 오류:', error, '응답:', responseText.substring(0, 200));
      throw new Error('API 응답을 처리할 수 없습니다.');
    }

    if (!searchData.body?.items) {
      console.error('잘못된 응답 구조:', searchData);
      throw new Error('API 응답 구조가 올바르지 않습니다.');
    }

    const items = Array.isArray(searchData.body.items) 
      ? searchData.body.items 
      : [searchData.body.items];

    if (!items || items.length === 0) {
      throw new Error('알약 정보를 찾을 수 없습니다.');
    }

    // 상세 정보 조회
    const itemSeq = items[0].ITEM_SEQ;
    const detailUrl = new URL('http://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService04/getDrugPrdtPrmsnDtlInq03');
    detailUrl.searchParams.append('serviceKey', decodeURIComponent(API_KEY));
    detailUrl.searchParams.append('item_seq', itemSeq);
    detailUrl.searchParams.append('type', 'json');

    const detailResponse = await fetch(detailUrl.toString(), {
      headers: {
        'Accept': 'application/json'
      }
    });

    const detailText = await detailResponse.text();
    let detailData = null;

    if (!detailText.includes('<?xml') && !detailText.includes('<OpenAPI')) {
      try {
        detailData = JSON.parse(detailText);
      } catch (error) {
        console.error('상세 정보 JSON 파싱 오류:', error);
      }
    } else {
      try {
        const detailResult = await parseStringPromise(detailText, { explicitArray: false });
        const detailItems = detailResult.OpenAPI_ServiceResponse?.body?.items?.item;
        if (detailItems) {
          detailData = {
            body: {
              items: Array.isArray(detailItems) ? detailItems : [detailItems]
            }
          };
        }
      } catch (error) {
        console.error('상세 정보 XML 파싱 오류:', error);
      }
    }

    // 메인 결과 구성
    const mainResult = constructPillData(items[0], items.slice(1), detailData?.body?.items?.[0]);

    return NextResponse.json({
      success: true,
      resultCode: '00',
      data: mainResult
    });
  } catch (error: any) {
    console.error('알약 분석 API 오류:', error);
    
    return NextResponse.json(
      {
        success: false,
        resultCode: '99',
        error: error.message || '알약 분석 중 오류가 발생했습니다.',
      },
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
    
    // 프롬프트 작성 - 개선된 프롬프트로 더 정확한 분석 유도
    const prompt = `
      이 이미지는 알약(의약품)을 촬영한 사진입니다. 
      이미지에서 알약을 식별하고 다음 특성을 최대한 정확하게 분석해주세요:
      
      1. 색상 (예: 흰색, 노란색, 분홍색 등)
      2. 모양 (예: 원형, 타원형, 캡슐형 등)
      3. 각인 (숫자나 문자가 새겨져 있는 경우, 없으면 빈 문자열)
      4. 분할선 (없음, 한쪽면, 양쪽면 등)
      
      이미지가 흐릿하거나 조명이 좋지 않아도 최대한 분석해주세요.
      알약이 여러 개인 경우 가장 중앙이나 큰 알약을 분석해주세요.
      
      JSON 형식으로 다음과 같이 응답해주세요:
      {
        "color": "색상",
        "shape": "모양",
        "mark": "각인",
        "drugLine": "분할선"
      }
      
      이미지에서 알약을 식별할 수 없는 경우에도 가능한 추측해서 응답해주세요.
      단, 이미지에 알약이 전혀 없거나 알약이 아닌 것이 확실한 경우에만 "알약을 식별할 수 없습니다"라고 응답해주세요.
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
    
    // 알약이 없다고 명시적으로 언급된 경우
    if (
      text.includes('알약을 식별할 수 없습니다') || 
      text.includes('알약이 없습니다') || 
      text.includes('알약이 보이지 않습니다') ||
      text.includes('이미지에 알약이 없습니다')
    ) {
      console.log('알약 감지 실패: 이미지에 알약이 없음');
      return null;
    }
    
    // JSON 응답 파싱
    try {
      // JSON 문자열 추출 (텍스트에 다른 내용이 포함될 수 있음)
      const jsonMatch = text.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) {
        console.log('JSON 형식 응답을 찾을 수 없음');
        
        // 이미지에 알약이 있는 것으로 보이면 최소한의 정보 제공
        if (
          text.toLowerCase().includes('알약') || 
          text.toLowerCase().includes('의약품') ||
          text.toLowerCase().includes('정제') ||
          text.toLowerCase().includes('캡슐')
        ) {
          // 텍스트에서 색상, 모양 정보 추출 시도
          let color = '흰색';  // 기본값
          let shape = '원형';  // 기본값
          
          // 색상 추출 시도
          const colorMatch = text.match(/색상[은는\s:]*([\w가-힣]+)/);
          if (colorMatch && colorMatch[1]) {
            color = colorMatch[1].trim();
          }
          
          // 모양 추출 시도
          const shapeMatch = text.match(/모양[은는\s:]*([\w가-힣]+)/);
          if (shapeMatch && shapeMatch[1]) {
            shape = shapeMatch[1].trim();
          }
          
          return {
            color: color,
            shape: shape,
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
      
      // 알약 관련 키워드가 있는지 확인
      if (
        text.toLowerCase().includes('알약') || 
        text.toLowerCase().includes('의약품') ||
        text.toLowerCase().includes('정제') ||
        text.toLowerCase().includes('캡슐') ||
        text.toLowerCase().includes('색상') ||
        text.toLowerCase().includes('모양')
      ) {
        // 텍스트에서 색상, 모양 정보 추출 시도
        let color = '흰색';  // 기본값
        let shape = '원형';  // 기본값
        
        // 색상 추출 시도
        const colorMatch = text.match(/색상[은는\s:]*([\w가-힣]+)/);
        if (colorMatch && colorMatch[1]) {
          color = colorMatch[1].trim();
        }
        
        // 모양 추출 시도
        const shapeMatch = text.match(/모양[은는\s:]*([\w가-힣]+)/);
        if (shapeMatch && shapeMatch[1]) {
          shape = shapeMatch[1].trim();
        }
        
        return {
          color: color,
          shape: shape,
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
      '갈색': 'brown',
      '초록': 'green', '초록색': 'green', '녹색': 'green',
      '파랑': 'blue', '파란색': 'blue', '청색': 'blue',
      '보라': 'purple', '보라색': 'purple', '자주색': 'purple',
      '회색': 'gray',
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
    let apiUrl = `https://apis.data.go.kr/1471000/MdcinGrnIdntfcInfoService01/getMdcinGrnIdntfcInfoList01?serviceKey=${FOOD_DRUG_API_KEY}&numOfRows=10&pageNo=1&type=json`;
    
    // 검색 파라미터 추가
    const params = [];
    
    if (colorCode) {
      params.push(`color_class=${colorCode}`);
    }
    
    if (shapeCode) {
      params.push(`drug_shape=${shapeCode}`);
    }
    
    if (features.mark) {
      params.push(`print_front=${encodeURIComponent(features.mark)}`);
    }
    
    // 파라미터가 있을 경우 URL에 추가
    if (params.length > 0) {
      apiUrl += `&${params.join('&')}`;
    }
    
    console.log('API 요청 URL:', apiUrl);
    
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
      throw new Error('API 응답 형식 오류');
    }
    
    // JSON으로 파싱 시도
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('JSON 파싱 오류:', error, '응답 텍스트:', responseText.substring(0, 200));
      throw new Error('API 응답 파싱 오류');
    }
    
    const items = data?.body?.items;
    
    if (!items || items.length === 0) {
      console.log('검색 결과 없음. 더 일반적인 조건으로 재시도...');
      
      // 결과가 없으면 표시 문자(각인)를 제외하고 다시 시도
      apiUrl = `https://apis.data.go.kr/1471000/MdcinGrnIdntfcInfoService01/getMdcinGrnIdntfcInfoList01?serviceKey=${FOOD_DRUG_API_KEY}&numOfRows=10&pageNo=1&type=json`;
      
      if (colorCode) {
        apiUrl += `&color_class=${colorCode}`;
      }
      
      if (shapeCode) {
        apiUrl += `&drug_shape=${shapeCode}`;
      }
      
      console.log('재시도 API 요청 URL:', apiUrl);
      
      const retryResponse = await fetch(apiUrl);
      if (!retryResponse.ok) {
        throw new Error(`재시도 API 호출 실패: ${retryResponse.status}`);
      }
      
      const retryText = await retryResponse.text();
      if (retryText.includes('<!DOCTYPE html>') || retryText.includes('<OpenAPI_ServiceResponse>')) {
        console.error('재시도 API가 HTML 또는 XML 응답을 반환했습니다:', retryText.substring(0, 200));
        throw new Error('API 응답 형식 오류');
      }
      
      data = JSON.parse(retryText);
      const retryItems = data?.body?.items;
      
      if (!retryItems || retryItems.length === 0) {
        return null;
      }
      
      // 재시도 결과 사용
      const item = retryItems[0];
      return constructPillData(item, features);
    }
    
    // 첫 번째 결과 사용
    const item = items[0];
    return constructPillData(item, features);
  } catch (error) {
    console.error('식품의약품안전처 API 오류:', error);
    throw error;
  }
}

// PillData 객체 구성 함수
function constructPillData(mainItem: any, similarItems: any[] = [], detailItem: any = {}): PillData {
  // 색상 한글화
  const colorMap: { [key: string]: string } = {
    'white': '흰색',
    'yellow': '노란색',
    'orange': '주황색',
    'pink': '분홍색',
    'red': '빨간색',
    'brown': '갈색',
    'green': '초록색',
    'blue': '파란색',
    'purple': '보라색',
    'gray': '회색',
    'black': '검정색',
    'transparent': '투명'
  };

  // 모양 한글화
  const shapeMap: { [key: string]: string } = {
    'circle': '원형',
    'oval': '타원형',
    'capsule': '캡슐형',
    'rectangle': '사각형',
    'diamond': '마름모형',
    'triangle': '삼각형',
    'pentagon': '오각형',
    'hexagon': '육각형',
    'octagon': '팔각형'
  };

  // 분할선 한글화
  const lineMap: { [key: string]: string } = {
    '-': '없음',
    '+': '십자',
    '/': '사선',
    '|': '단선'
  };

  return {
    itemName: mainItem.ITEM_NAME || '',
    entpName: mainItem.ENTP_NAME || '',
    itemImage: mainItem.ITEM_IMAGE || '',
    className: mainItem.CLASS_NAME || '',
    etcOtcName: mainItem.ETC_OTC_NAME || '',
    
    // 물리적 특성 (한글화)
    color: colorMap[mainItem.COLOR_CLASS?.toLowerCase()] || mainItem.COLOR_CLASS || '',
    shape: shapeMap[mainItem.DRUG_SHAPE?.toLowerCase()] || mainItem.DRUG_SHAPE || '',
    mark: mainItem.PRINT_FRONT || '',
    markFront: mainItem.MARK_CODE_FRONT || mainItem.PRINT_FRONT || '',
    markBack: mainItem.MARK_CODE_BACK || mainItem.PRINT_BACK || '',
    drugLine: lineMap[mainItem.DRUG_LINE] || mainItem.DRUG_LINE || mainItem.LINE_FRONT || '',
    chart: mainItem.CHART || '',
    
    // 크기 정보
    lengLong: mainItem.LENG_LONG || '',
    lengShort: mainItem.LENG_SHORT || '',
    thick: mainItem.THICK || '',
    
    // 상세 정보
    itemIngredient: detailItem.MATERIAL_NAME || '',
    efficacy: detailItem.EE_DOC_DATA || '',
    useMethod: detailItem.UD_DOC_DATA || '',
    caution: detailItem.NB_DOC_DATA || '',
    interaction: detailItem.IA_DOC_DATA || '',
    sideEffect: detailItem.SE_DOC_DATA || '',
    
    // 유효기간 및 갱신일
    validTerm: mainItem.VALID_TERM || '',
    updateDe: mainItem.UPDATE_DE || '',
    
    // 분석 결과
    confidence: 95,
    similarItems: similarItems.map(item => ({
      itemName: item.ITEM_NAME || '',
      entpName: item.ENTP_NAME || '',
      itemImage: item.ITEM_IMAGE || '',
      className: item.CLASS_NAME || '',
      etcOtcName: item.ETC_OTC_NAME || '',
      color: colorMap[item.COLOR_CLASS?.toLowerCase()] || item.COLOR_CLASS || '',
      shape: shapeMap[item.DRUG_SHAPE?.toLowerCase()] || item.DRUG_SHAPE || '',
      chart: item.CHART || '',
      drugLine: lineMap[item.DRUG_LINE] || item.DRUG_LINE || item.LINE_FRONT || '',
      markFront: item.MARK_CODE_FRONT || item.PRINT_FRONT || '',
      markBack: item.MARK_CODE_BACK || item.PRINT_BACK || '',
      confidence: 85
    }))
  };
}
// API 호출 래퍼 함수
import { API_KEYS, SERVERLESS_TIMEOUT } from './env-config';

export async function callExternalApi(
  apiName: string,
  apiFunction: (apiKey: string) => Promise<any>,
  fallbackFunction: () => Promise<any>
) {
  try {
    console.log(`${apiName} API 호출 시작`);
    // API 키 가져오기
    let apiKey = API_KEYS[apiName] || '';
    
    // YouTube API의 경우 하드코딩된 키 사용
    if (apiName === 'YOUTUBE' && !apiKey) {
      apiKey = 'AIzaSyDtg7fx2MakWHIDLrDbfUFEgEOBUjWCwOQ';
      console.log(`${apiName} API 키가 환경 변수에 없어 하드코딩된 키를 사용합니다.`);
    }
    
    if (!apiKey) {
      console.error(`${apiName} API 키가 설정되지 않았습니다`);
      throw new Error(`API 키가 없습니다: ${apiName}`);
    }
    const result = await apiFunction(apiKey);
    console.log(`${apiName} API 호출 성공`);
    return result;
  } catch (error) {
    console.error(`${apiName} API 호출 실패:`, error);
    console.log(`${apiName} 모의 데이터 생성 시작`);
    const fallbackResult = await fallbackFunction();
    console.log(`${apiName} 모의 데이터 생성 완료`);
    return fallbackResult;
  }
} 
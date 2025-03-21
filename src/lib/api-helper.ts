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
    const apiKey = API_KEYS[apiName] || '';
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
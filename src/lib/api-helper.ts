// API 호출 래퍼 함수
import { API_KEYS, SERVERLESS_TIMEOUT } from './env-config';

export async function callExternalApi(
  apiName: string,
  apiFunction: () => Promise<any>,
  fallbackFunction: () => Promise<any>
) {
  try {
    console.log(`${apiName} API 호출 시작`);
    const result = await apiFunction();
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
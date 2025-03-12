import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const period1 = searchParams.get('period1'); // 시작 날짜 (Unix 타임스탬프)
    const period2 = searchParams.get('period2'); // 종료 날짜 (Unix 타임스탬프)
    const interval = searchParams.get('interval') || '1d'; // 기본값: 일별 데이터
    
    if (!symbol) {
      return NextResponse.json(
        { error: '주식 심볼이 필요합니다.' },
        { status: 400 }
      );
    }

    // 야후 파이넨스 API 호출
    let url = `https://query1.finance.yahoo.com/v7/finance/download/${symbol}?interval=${interval}`;
    
    if (period1) {
      url += `&period1=${period1}`;
    }
    
    if (period2) {
      url += `&period2=${period2}`;
    } else {
      // 현재 시간을 Unix 타임스탬프로 변환
      url += `&period2=${Math.floor(Date.now() / 1000)}`;
    }
    
    // 필요한 추가 파라미터
    url += '&events=history';
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: '야후 파이넨스 API 호출 실패' },
        { status: response.status }
      );
    }

    // CSV 데이터를 JSON으로 변환
    const csvText = await response.text();
    const jsonData = csvToJson(csvText);
    
    return NextResponse.json(jsonData);
  } catch (error) {
    console.error('야후 파이넨스 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// CSV 데이터를 JSON으로 변환하는 함수
function csvToJson(csv: string) {
  const lines = csv.split('\n');
  const headers = lines[0].split(',');
  
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const obj: Record<string, any> = {};
    const currentLine = lines[i].split(',');
    
    for (let j = 0; j < headers.length; j++) {
      const value = currentLine[j];
      // 숫자로 변환 가능한 값은 숫자로 변환
      obj[headers[j]] = isNaN(Number(value)) ? value : Number(value);
    }
    
    result.push(obj);
  }
  
  return result;
} 
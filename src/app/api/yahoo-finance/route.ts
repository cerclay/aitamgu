import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    
    if (!symbol) {
      return NextResponse.json(
        { error: '주식 심볼이 필요합니다.' },
        { status: 400 }
      );
    }

    // 야후 파이넨스 API 호출
    const quoteUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    const response = await fetch(quoteUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: '야후 파이넨스 API 호출 실패' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('야후 파이넨스 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 모듈 요약 데이터를 가져오는 엔드포인트
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbol, modules } = body;
    
    if (!symbol) {
      return NextResponse.json(
        { error: '주식 심볼이 필요합니다.' },
        { status: 400 }
      );
    }

    // 모듈 목록을 쿼리 파라미터로 변환
    const moduleParam = modules && modules.length > 0 
      ? `&modules=${modules.join(',')}`
      : '';

    // 야후 파이넨스 API 호출
    const summaryUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?formatted=true${moduleParam}`;
    const response = await fetch(summaryUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: '야후 파이넨스 API 호출 실패' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('야후 파이넨스 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
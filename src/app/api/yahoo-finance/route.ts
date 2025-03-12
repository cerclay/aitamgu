import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  
  if (!symbol) {
    return NextResponse.json({ error: '주식 심볼이 필요합니다' }, { status: 400 });
  }
  
  try {
    // Yahoo Finance API 호출
    const quote = await yahooFinance.quote(symbol);
    const quoteSummary = await yahooFinance.quoteSummary(symbol, {
      modules: ['price', 'summaryDetail', 'defaultKeyStatistics', 'financialData', 'summaryProfile']
    });
    
    // 과거 주가 데이터 가져오기 (1년)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    
    const historical = await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    });
    
    // 데이터 변환
    const historicalPrices = historical.map(item => ({
      date: item.date.toISOString().split('T')[0],
      price: Number(item.close)
    }));
    
    // 기본 정보 추출
    const price = Number(quote.regularMarketPrice || 0);
    const priceChange = Number(quote.regularMarketChangePercent || 0);
    const companyName = quote.longName || quote.shortName || symbol;
    const marketCap = Number(quote.marketCap || 0);
    const volume = Number(quote.regularMarketVolume || 0);
    const high52Week = Number(quote.fiftyTwoWeekHigh || 0);
    const low52Week = Number(quote.fiftyTwoWeekLow || 0);
    
    // 기술적 지표 계산
    const technicalIndicators = {
      rsi: 50, // 실제 계산 필요
      macd: 0, // 실제 계산 필요
      bollingerUpper: price * 1.05,
      bollingerLower: price * 0.95,
      ma50: price,
      ma200: price
    };
    
    // 기본적 지표 추출
    const fundamentals = {
      pe: Number(quoteSummary.summaryDetail?.trailingPE || 0),
      eps: Number(quoteSummary.defaultKeyStatistics?.trailingEps || 0),
      dividendYield: Number(quoteSummary.summaryDetail?.dividendYield || 0) * 100,
      peg: Number(quoteSummary.defaultKeyStatistics?.pegRatio || 0),
      roe: quoteSummary.financialData?.returnOnEquity ? Number(quoteSummary.financialData.returnOnEquity) * 100 : 0,
      debtToEquity: Number(quoteSummary.financialData?.debtToEquity || 0),
      revenue: Number(quoteSummary.financialData?.totalRevenue || 0),
      revenueGrowth: quoteSummary.financialData?.revenueGrowth ? Number(quoteSummary.financialData.revenueGrowth) * 100 : 0,
      netIncome: Number(quoteSummary.defaultKeyStatistics?.netIncomeToCommon || 0),
      netIncomeGrowth: 0,
      operatingMargin: quoteSummary.financialData?.operatingMargins ? Number(quoteSummary.financialData.operatingMargins) * 100 : 0,
      nextEarningsDate: quote.earningsTimestamp ? new Date(Number(quote.earningsTimestamp) * 1000).toISOString().split('T')[0] : '',
    };
    
    const stockData = {
      ticker: symbol,
      companyName,
      currentPrice: price,
      priceChange,
      marketCap,
      volume,
      high52Week,
      low52Week,
      lastUpdated: new Date().toISOString(),
      description: quoteSummary.summaryProfile?.longBusinessSummary || '',
      historicalPrices,
      technicalIndicators,
      fundamentals,
      patterns: [], // 차트 패턴은 서버에서 생성하지 않음
    };
    
    return NextResponse.json(stockData);
  } catch (error) {
    console.error('주식 데이터 가져오기 실패:', error);
    return NextResponse.json({ error: '데이터를 가져오는 중 오류가 발생했습니다' }, { status: 500 });
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
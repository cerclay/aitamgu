import { NextRequest, NextResponse } from 'next/server';
import Fred from 'fred-api';

// FRED API 키 (실제 사용 시 환경 변수로 관리해야 합니다)
const FRED_API_KEY = process.env.FRED_API_KEY || 'YOUR_FRED_API_KEY';
const fred = new Fred(FRED_API_KEY);

// 경제 지표 ID 매핑
const ECONOMIC_INDICATORS = {
  'gdp': 'GDP', // 실질 GDP
  'unemployment': 'UNRATE', // 실업률
  'inflation': 'CPIAUCSL', // 소비자물가지수
  'interest_rate': 'FEDFUNDS', // 연방기금금리
  'treasury_10y': 'DGS10', // 10년 국채 수익률
  'consumer_sentiment': 'UMCSENT', // 소비자 심리지수
  'industrial_production': 'INDPRO', // 산업생산지수
  'retail_sales': 'RSAFS', // 소매판매
  'housing_starts': 'HOUST', // 주택착공건수
  'ppi': 'PPIACO', // 생산자물가지수
};

// 단일 경제 지표 데이터 가져오기
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const indicator = searchParams.get('indicator');
  const startDate = searchParams.get('start_date') || getDefaultStartDate();
  const endDate = searchParams.get('end_date') || getCurrentDate();
  
  if (!indicator) {
    return NextResponse.json({ error: '경제 지표 ID가 필요합니다' }, { status: 400 });
  }
  
  const seriesId = ECONOMIC_INDICATORS[indicator] || indicator;
  
  try {
    const result = await fred.getSeries({
      series_id: seriesId,
      observation_start: startDate,
      observation_end: endDate,
      frequency: 'm', // 월간 데이터
      sort_order: 'desc', // 최신 데이터부터
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('FRED API 오류:', error);
    return NextResponse.json({ error: '데이터를 가져오는 중 오류가 발생했습니다' }, { status: 500 });
  }
}

// 여러 경제 지표 데이터 한 번에 가져오기
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { indicators, start_date, end_date } = body;
    
    if (!indicators || !Array.isArray(indicators) || indicators.length === 0) {
      return NextResponse.json(
        { error: '경제 지표 ID 배열이 필요합니다' },
        { status: 400 }
      );
    }
    
    const startDate = start_date || getDefaultStartDate();
    const endDate = end_date || getCurrentDate();
    
    const results = {};
    
    // 각 지표에 대해 병렬로 데이터 가져오기
    await Promise.all(
      indicators.map(async (indicator) => {
        const seriesId = ECONOMIC_INDICATORS[indicator] || indicator;
        
        try {
          const result = await fred.getSeries({
            series_id: seriesId,
            observation_start: startDate,
            observation_end: endDate,
            frequency: 'm', // 월간 데이터
            sort_order: 'desc', // 최신 데이터부터
          });
          
          results[indicator] = result;
        } catch (error) {
          console.error(`FRED API 오류 (${indicator}):`, error);
          results[indicator] = { error: '데이터를 가져오는 중 오류가 발생했습니다' };
        }
      })
    );
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('FRED API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 현재 날짜를 YYYY-MM-DD 형식으로 반환
function getCurrentDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// 기본 시작 날짜 (1년 전)
function getDefaultStartDate(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date.toISOString().split('T')[0];
} 
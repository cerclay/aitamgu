import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { EconomicIndicator } from '@/app/stock-analyzer/types';

// FRED API 키
const FRED_API_KEY = process.env.FRED_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    // API 키가 없는 경우 모의 데이터 반환
    if (!FRED_API_KEY) {
      console.log('FRED API 키가 없어 모의 데이터를 반환합니다.');
      return NextResponse.json(generateMockEconomicIndicators());
    }

    // FRED API 호출
    const indicators = [
      { id: 'GDP', name: 'GDP', category: 'output' },
      { id: 'UNRATE', name: 'Unemployment Rate', category: 'labor' },
      { id: 'CPIAUCSL', name: 'Consumer Price Index', category: 'prices' },
      { id: 'FEDFUNDS', name: 'Federal Funds Rate', category: 'interest_rates' },
      { id: 'INDPRO', name: 'Industrial Production', category: 'output' },
      { id: 'HOUST', name: 'Housing Starts', category: 'housing' },
      { id: 'RSAFS', name: 'Retail Sales', category: 'consumption' },
      { id: 'DEXUSEU', name: 'USD/EUR Exchange Rate', category: 'exchange_rates' },
      { id: 'T10Y2Y', name: 'Treasury Yield Spread', category: 'interest_rates' },
      { id: 'VIXCLS', name: 'VIX', category: 'volatility' }
    ];

    const results = await Promise.all(
      indicators.map(async (indicator) => {
        try {
          const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${indicator.id}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=30`;
          const response = await axios.get(url);
          
          if (response.data && response.data.observations) {
            const observations = response.data.observations;
            
            // 최신 데이터 추출
            const latestData = observations[0];
            
            // 이전 데이터 추출 (약 1개월 전)
            const previousData = observations.find(obs => {
              const obsDate = new Date(obs.date);
              const latestDate = new Date(latestData.date);
              const diffTime = Math.abs(latestDate.getTime() - obsDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays >= 30;
            }) || observations[observations.length - 1];
            
            // 1년 전 데이터 추출
            const yearAgoData = observations.find(obs => {
              const obsDate = new Date(obs.date);
              const latestDate = new Date(latestData.date);
              const diffTime = Math.abs(latestDate.getTime() - obsDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays >= 365;
            }) || observations[observations.length - 1];
            
            // 변화율 계산
            const currentValue = parseFloat(latestData.value) || 0;
            const previousValue = parseFloat(previousData.value) || 0;
            const yearAgoValue = parseFloat(yearAgoData.value) || 0;
            
            const monthlyChange = previousValue !== 0 
              ? ((currentValue - previousValue) / previousValue) * 100 
              : 0;
              
            const yearlyChange = yearAgoValue !== 0 
              ? ((currentValue - yearAgoValue) / yearAgoValue) * 100 
              : 0;
            
            // 추세 결정
            let trend: 'up' | 'down' | 'stable' = 'stable';
            if (monthlyChange > 1) trend = 'up';
            else if (monthlyChange < -1) trend = 'down';
            
            // 경제 지표 객체 생성
            return {
              id: indicator.id,
              name: indicator.name,
              nameKr: getKoreanName(indicator.id),
              category: indicator.category,
              value: currentValue,
              unit: getUnit(indicator.id),
              date: latestData.date,
              monthlyChange,
              yearlyChange,
              trend,
              impact: getImpact(indicator.id, currentValue, yearlyChange),
              description: getDescription(indicator.id),
              descriptionKr: getKoreanDescription(indicator.id),
              historicalData: observations.slice(0, 12).map(obs => ({
                date: obs.date,
                value: parseFloat(obs.value) || 0
              }))
            };
          }
          
          throw new Error(`${indicator.id}에 대한 데이터를 찾을 수 없습니다.`);
        } catch (error) {
          console.error(`${indicator.id} 데이터 가져오기 오류:`, error);
          
          // 오류 발생 시 모의 데이터 반환
          return generateMockIndicator(indicator.id, indicator.name, indicator.category);
        }
      })
    );
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('FRED API 오류:', error);
    return NextResponse.json(generateMockEconomicIndicators());
  }
}

export async function POST(request: Request) {
  try {
    // API 키가 없는 경우 모의 데이터 반환
    if (!FRED_API_KEY) {
      console.log('FRED API 키가 없어 모의 데이터를 반환합니다.');
      return NextResponse.json(generateMockEconomicIndicators());
    }
    
    const body = await request.json();
    const { indicators = [] } = body;
    
    if (!indicators || indicators.length === 0) {
      return NextResponse.json(generateMockEconomicIndicators());
    }
    
    const results = await Promise.all(
      indicators.map(async (indicator) => {
        try {
          const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${indicator.id}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=30`;
          const response = await axios.get(url);
          
          if (response.data && response.data.observations) {
            const observations = response.data.observations;
            
            // 최신 데이터 추출
            const latestData = observations[0];
            
            // 이전 데이터 추출 (약 1개월 전)
            const previousData = observations.find(obs => {
              const obsDate = new Date(obs.date);
              const latestDate = new Date(latestData.date);
              const diffTime = Math.abs(latestDate.getTime() - obsDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays >= 30;
            }) || observations[observations.length - 1];
            
            // 1년 전 데이터 추출
            const yearAgoData = observations.find(obs => {
              const obsDate = new Date(obs.date);
              const latestDate = new Date(latestData.date);
              const diffTime = Math.abs(latestDate.getTime() - obsDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays >= 365;
            }) || observations[observations.length - 1];
            
            // 변화율 계산
            const currentValue = parseFloat(latestData.value) || 0;
            const previousValue = parseFloat(previousData.value) || 0;
            const yearAgoValue = parseFloat(yearAgoData.value) || 0;
            
            const monthlyChange = previousValue !== 0 
              ? ((currentValue - previousValue) / previousValue) * 100 
              : 0;
              
            const yearlyChange = yearAgoValue !== 0 
              ? ((currentValue - yearAgoValue) / yearAgoValue) * 100 
              : 0;
            
            // 추세 결정
            let trend: 'up' | 'down' | 'stable' = 'stable';
            if (monthlyChange > 1) trend = 'up';
            else if (monthlyChange < -1) trend = 'down';
            
            // 경제 지표 객체 생성
            return {
              id: indicator.id,
              name: indicator.name || getIndicatorName(indicator.id),
              nameKr: indicator.nameKr || getKoreanName(indicator.id),
              category: indicator.category || getCategoryFromId(indicator.id),
              value: currentValue,
              unit: indicator.unit || getUnit(indicator.id),
              date: latestData.date,
              monthlyChange,
              yearlyChange,
              trend,
              impact: getImpact(indicator.id, currentValue, yearlyChange),
              description: indicator.description || getDescription(indicator.id),
              descriptionKr: indicator.descriptionKr || getKoreanDescription(indicator.id),
              historicalData: observations.slice(0, 12).map(obs => ({
                date: obs.date,
                value: parseFloat(obs.value) || 0
              }))
            };
          }
          
          throw new Error(`${indicator.id}에 대한 데이터를 찾을 수 없습니다.`);
        } catch (error) {
          console.error(`${indicator.id} 데이터 가져오기 오류:`, error);
          
          // 오류 발생 시 모의 데이터 반환
          return generateMockIndicator(
            indicator.id, 
            indicator.name || getIndicatorName(indicator.id), 
            indicator.category || getCategoryFromId(indicator.id)
          );
        }
      })
    );
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('FRED API 오류:', error);
    return NextResponse.json(generateMockEconomicIndicators());
  }
}

// 모의 경제 지표 생성
function generateMockEconomicIndicators(): EconomicIndicator[] {
  const indicators = [
    { id: 'GDP', name: 'GDP', category: 'output' },
    { id: 'UNRATE', name: 'Unemployment Rate', category: 'labor' },
    { id: 'CPIAUCSL', name: 'Consumer Price Index', category: 'prices' },
    { id: 'FEDFUNDS', name: 'Federal Funds Rate', category: 'interest_rates' },
    { id: 'INDPRO', name: 'Industrial Production', category: 'output' },
    { id: 'HOUST', name: 'Housing Starts', category: 'housing' },
    { id: 'RSAFS', name: 'Retail Sales', category: 'consumption' },
    { id: 'DEXUSEU', name: 'USD/EUR Exchange Rate', category: 'exchange_rates' },
    { id: 'T10Y2Y', name: 'Treasury Yield Spread', category: 'interest_rates' },
    { id: 'VIXCLS', name: 'VIX', category: 'volatility' }
  ];
  
  return indicators.map(indicator => 
    generateMockIndicator(indicator.id, indicator.name, indicator.category)
  );
}

// 개별 모의 경제 지표 생성
function generateMockIndicator(id: string, name: string, category: string): EconomicIndicator {
  // 현재 날짜
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().split('T')[0];
  
  // 지표별 기본값 설정
  let baseValue = 100;
  let unit = '%';
  
  switch (id) {
    case 'GDP':
      baseValue = 24000;
      unit = 'Billion $';
      break;
    case 'UNRATE':
      baseValue = 3.5 + Math.random() * 2;
      unit = '%';
      break;
    case 'CPIAUCSL':
      baseValue = 280 + Math.random() * 20;
      unit = 'Index';
      break;
    case 'FEDFUNDS':
      baseValue = 4 + Math.random() * 2;
      unit = '%';
      break;
    case 'INDPRO':
      baseValue = 100 + Math.random() * 10;
      unit = 'Index';
      break;
    case 'HOUST':
      baseValue = 1400 + Math.random() * 300;
      unit = 'Thousand';
      break;
    case 'RSAFS':
      baseValue = 600 + Math.random() * 100;
      unit = 'Billion $';
      break;
    case 'DEXUSEU':
      baseValue = 1 + Math.random() * 0.2;
      unit = 'Rate';
      break;
    case 'T10Y2Y':
      baseValue = Math.random() * 2 - 1;
      unit = '%';
      break;
    case 'VIXCLS':
      baseValue = 15 + Math.random() * 15;
      unit = 'Index';
      break;
    default:
      baseValue = 100 + Math.random() * 50;
      unit = '';
  }
  
  // 월간 및 연간 변화율
  const monthlyChange = (Math.random() * 6) - 3; // -3% ~ +3%
  const yearlyChange = (Math.random() * 10) - 5; // -5% ~ +5%
  
  // 추세 결정
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (monthlyChange > 1) trend = 'up';
  else if (monthlyChange < -1) trend = 'down';
  
  // 과거 데이터 생성
  const historicalData = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setMonth(currentDate.getMonth() - i);
    
    // 약간의 변동성 추가
    const randomFactor = 1 + ((Math.random() * 0.1) - 0.05); // ±5% 변동
    const value = baseValue * randomFactor * (1 - (i * 0.01)); // 시간에 따른 약간의 추세
    
    historicalData.push({
      date: date.toISOString().split('T')[0],
      value: parseFloat(value.toFixed(2))
    });
  }
  
  return {
    id,
    name,
    nameKr: getKoreanName(id),
    category,
    value: baseValue,
    unit,
    date: formattedDate,
    monthlyChange,
    yearlyChange,
    trend,
    impact: getImpact(id, baseValue, yearlyChange),
    description: getDescription(id),
    descriptionKr: getKoreanDescription(id),
    historicalData
  };
}

// 지표 ID로부터 카테고리 추출
function getCategoryFromId(id: string): string {
  const categories = {
    'GDP': 'output',
    'UNRATE': 'labor',
    'CPIAUCSL': 'prices',
    'FEDFUNDS': 'interest_rates',
    'INDPRO': 'output',
    'HOUST': 'housing',
    'RSAFS': 'consumption',
    'DEXUSEU': 'exchange_rates',
    'T10Y2Y': 'interest_rates',
    'VIXCLS': 'volatility'
  };
  
  return categories[id] || 'other';
}

// 지표 ID로부터 이름 추출
function getIndicatorName(id: string): string {
  const names = {
    'GDP': 'GDP',
    'UNRATE': 'Unemployment Rate',
    'CPIAUCSL': 'Consumer Price Index',
    'FEDFUNDS': 'Federal Funds Rate',
    'INDPRO': 'Industrial Production',
    'HOUST': 'Housing Starts',
    'RSAFS': 'Retail Sales',
    'DEXUSEU': 'USD/EUR Exchange Rate',
    'T10Y2Y': 'Treasury Yield Spread',
    'VIXCLS': 'VIX'
  };
  
  return names[id] || id;
}

// 지표 ID로부터 한글 이름 추출
function getKoreanName(id: string): string {
  const koreanNames = {
    'GDP': '국내총생산',
    'UNRATE': '실업률',
    'CPIAUCSL': '소비자물가지수',
    'FEDFUNDS': '기준금리',
    'INDPRO': '산업생산지수',
    'HOUST': '주택착공건수',
    'RSAFS': '소매판매',
    'DEXUSEU': '달러/유로 환율',
    'T10Y2Y': '국채 수익률 스프레드',
    'VIXCLS': 'VIX 변동성 지수'
  };
  
  return koreanNames[id] || id;
}

// 지표 ID로부터 단위 추출
function getUnit(id: string): string {
  const units = {
    'GDP': 'Billion $',
    'UNRATE': '%',
    'CPIAUCSL': 'Index',
    'FEDFUNDS': '%',
    'INDPRO': 'Index',
    'HOUST': 'Thousand',
    'RSAFS': 'Billion $',
    'DEXUSEU': 'Rate',
    'T10Y2Y': '%',
    'VIXCLS': 'Index'
  };
  
  return units[id] || '';
}

// 지표 ID로부터 설명 추출
function getDescription(id: string): string {
  const descriptions = {
    'GDP': 'Gross Domestic Product is the total monetary value of all goods and services produced within a country\'s borders in a specific time period.',
    'UNRATE': 'The unemployment rate represents the number of unemployed as a percentage of the labor force.',
    'CPIAUCSL': 'The Consumer Price Index measures the average change in prices over time that consumers pay for a basket of goods and services.',
    'FEDFUNDS': 'The federal funds rate is the interest rate at which depository institutions lend reserve balances to other depository institutions overnight.',
    'INDPRO': 'The Industrial Production Index measures real output for all facilities located in the United States manufacturing, mining, and electric, and gas utilities.',
    'HOUST': 'Housing Starts refers to the number of new residential construction projects that have begun during a specific period.',
    'RSAFS': 'Retail Sales measures the total receipts at stores that sell merchandise and related services to final consumers.',
    'DEXUSEU': 'The USD/EUR exchange rate represents the value of the US dollar against the Euro.',
    'T10Y2Y': 'The Treasury Yield Spread is the difference between the 10-year and 2-year Treasury yields, often used as a recession indicator.',
    'VIXCLS': 'The VIX is a real-time market index representing the market\'s expectations for volatility over the coming 30 days.'
  };
  
  return descriptions[id] || 'Economic indicator data';
}

// 지표 ID로부터 한글 설명 추출
function getKoreanDescription(id: string): string {
  const koreanDescriptions = {
    'GDP': '국내총생산(GDP)은 특정 기간 동안 한 국가의 국경 내에서 생산된 모든 재화와 서비스의 총 화폐 가치입니다.',
    'UNRATE': '실업률은 노동력 대비 실업자 수의 비율을 나타냅니다.',
    'CPIAUCSL': '소비자물가지수는 소비자가 재화와 서비스 바구니에 대해 지불하는 가격의 시간에 따른 평균 변화를 측정합니다.',
    'FEDFUNDS': '기준금리는 예금 기관이 다른 예금 기관에 하룻밤 동안 지급준비금을 대출하는 이자율입니다.',
    'INDPRO': '산업생산지수는 미국 내 모든 제조업, 광업, 전기 및 가스 유틸리티 시설의 실제 생산량을 측정합니다.',
    'HOUST': '주택착공건수는 특정 기간 동안 시작된 새로운 주거용 건설 프로젝트의 수를 나타냅니다.',
    'RSAFS': '소매판매는 최종 소비자에게 상품과 관련 서비스를 판매하는 상점의 총 수입을 측정합니다.',
    'DEXUSEU': '달러/유로 환율은 유로화에 대한 미국 달러의 가치를 나타냅니다.',
    'T10Y2Y': '국채 수익률 스프레드는 10년물과 2년물 국채 수익률의 차이로, 종종 경기 침체 지표로 사용됩니다.',
    'VIXCLS': 'VIX는 향후 30일 동안의 변동성에 대한 시장의 기대치를 나타내는 실시간 시장 지수입니다.'
  };
  
  return koreanDescriptions[id] || '경제 지표 데이터';
}

// 지표의 영향 평가
function getImpact(id: string, value: number, yearlyChange: number): 'positive' | 'negative' | 'neutral' {
  // 지표별 영향 평가 로직
  switch (id) {
    case 'GDP':
      return yearlyChange > 2 ? 'positive' : (yearlyChange < 0 ? 'negative' : 'neutral');
    case 'UNRATE':
      return value < 4 ? 'positive' : (value > 6 ? 'negative' : 'neutral');
    case 'CPIAUCSL':
      return yearlyChange < 2 ? 'positive' : (yearlyChange > 4 ? 'negative' : 'neutral');
    case 'FEDFUNDS':
      return value < 3 ? 'positive' : (value > 5 ? 'negative' : 'neutral');
    case 'INDPRO':
      return yearlyChange > 1 ? 'positive' : (yearlyChange < -1 ? 'negative' : 'neutral');
    case 'HOUST':
      return yearlyChange > 5 ? 'positive' : (yearlyChange < -5 ? 'negative' : 'neutral');
    case 'RSAFS':
      return yearlyChange > 3 ? 'positive' : (yearlyChange < 0 ? 'negative' : 'neutral');
    case 'DEXUSEU':
      // 달러 강세는 수출에 부정적, 수입에 긍정적 (복합적 영향)
      return 'neutral';
    case 'T10Y2Y':
      return value > 0.5 ? 'positive' : (value < 0 ? 'negative' : 'neutral');
    case 'VIXCLS':
      return value < 20 ? 'positive' : (value > 30 ? 'negative' : 'neutral');
    default:
      return 'neutral';
  }
} 
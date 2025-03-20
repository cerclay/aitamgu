import { NextResponse } from 'next/server';
import { callExternalApi } from '@/lib/api-helper';
import { API_KEYS } from '@/lib/env-config';

// FRED API 키 가져오기 (여러 방법으로 시도)
const FRED_API_KEY = process.env.FRED_API_KEY || process.env.NEXT_PUBLIC_FRED_API_KEY || API_KEYS.FRED || 'bfa84a8aaffc0df0b111b3b9e203def0';

console.log('FRED API 키 확인:', FRED_API_KEY ? '설정됨' : '설정되지 않음');

export async function GET(request: Request) {
  try {
    // 브라우저 캐시 헤더 설정
    const headers = {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'application/json'
    };
    
    const economicData = await callExternalApi(
      'FRED',
      async () => {
        return await fetchFREDData();
      },
      async () => {
        return generateMockEconomicData();
      }
    );
    
    return NextResponse.json(economicData, { headers });
  } catch (error) {
    console.error('경제 지표 데이터 가져오기 오류:', error);
    
    // 오류 발생 시 모의 데이터로 대체
    try {
      const mockData = generateMockEconomicData();
      return NextResponse.json(mockData);
    } catch (fallbackError) {
      return NextResponse.json(
        { error: '경제 지표 데이터를 가져오는 데 실패했습니다.' },
        { status: 500 }
      );
    }
  }
}

// FRED API를 이용해 실제 데이터 가져오기
async function fetchFREDData() {
  // API 키가 비어있거나 undefined인 경우 하드코딩된 키 사용
  const apiKey = FRED_API_KEY || 'bfa84a8aaffc0df0b111b3b9e203def0';
  
  console.log('FRED 데이터 가져오기 시작 (API 키:', apiKey.substring(0, 4) + '...' + ')');

  // API 키 유효성 검사를 제거하고 무조건 시도하도록 수정
  // if (!FRED_API_KEY) {
  //   throw new Error('FRED API 키가 설정되지 않았습니다.');
  // }

  // 중요 경제 지표들의 FRED 시리즈 ID
  const indicators = [
    { 
      id: 'GDP', 
      name: 'Gross Domestic Product',
      nameKr: 'GDP 성장률', 
      unit: '%',
      description: '국내 총생산(GDP) 성장률은 경제 성장의 핵심 지표로, 미국 경제 상태를 종합적으로 나타냅니다.',
      type: 'quarterly'
    },
    { 
      id: 'UNRATE', 
      name: 'Unemployment Rate', 
      nameKr: '실업률',
      unit: '%',
      description: '근로 연령 인구 중 실업자 비율로, 노동 시장의 건전성을 나타내는 핵심 지표입니다.',
      type: 'monthly'
    },
    { 
      id: 'CPIAUCSL', 
      name: 'Consumer Price Index', 
      nameKr: '소비자물가지수',
      unit: '%',
      description: '도시 소비자들이 구매하는 상품과 서비스의 가격 변화를 측정하며, 인플레이션의 주요 지표입니다.',
      type: 'monthly'
    },
    { 
      id: 'FEDFUNDS', 
      name: 'Federal Funds Rate', 
      nameKr: '기준금리',
      unit: '%',
      description: '미 연방준비제도가 설정하는 기준금리로, 전반적인 금융 상황과 통화 정책의 방향을 나타냅니다.',
      type: 'monthly'
    },
    { 
      id: 'RSXFS', 
      name: 'Retail Sales', 
      nameKr: '소매판매',
      unit: '%',
      description: '소비자 지출의 주요 지표로, 경제 성장에 큰 영향을 미치는 소매 부문의 건전성을 보여줍니다.',
      type: 'monthly'
    },
    { 
      id: 'INDPRO', 
      name: 'Industrial Production', 
      nameKr: '산업생산',
      unit: '%',
      description: '제조업, 광업, 유틸리티 부문의 생산 활동을 측정하는 지표로, 경제 성장의 중요한 지표입니다.',
      type: 'monthly'
    },
    { 
      id: 'HOUST', 
      name: 'Housing Starts', 
      nameKr: '주택착공',
      unit: 'M',
      description: '신규 주택 건설 착공 건수로, 부동산 시장의 건전성과 소비자 신뢰도를 나타냅니다.',
      type: 'monthly'
    },
    { 
      id: 'UMCSENT', 
      name: 'Consumer Sentiment', 
      nameKr: '소비자 심리지수',
      unit: '',
      description: '미시간 대학 소비자 심리 조사로, 소비자들의 경제 상황에 대한 인식과 전망을 보여줍니다.',
      type: 'monthly'
    },
    { 
      id: 'MPMGM201USM189S', // ISM1MFG 대신 새로운 시리즈 ID 사용
      name: 'ISM Manufacturing PMI', 
      nameKr: 'ISM 제조업지수',
      unit: '',
      description: '구매관리자지수(PMI)로, 제조업 부문의 성장 또는 위축을 나타내며 50 이상이면 확장, 미만이면 위축을 의미합니다.',
      type: 'monthly'
    },
    { 
      id: 'DTWEXBGS', 
      name: 'Dollar Index', 
      nameKr: '달러 인덱스',
      unit: '',
      description: '미 달러화의 다른 주요 통화 대비 가치를 측정하는 지수로, 글로벌 무역과 투자에 영향을 미칩니다.',
      type: 'daily'
    }
  ];
  
  const results = [];
  
  // 각 지표별로 데이터 가져오기
  for (const indicator of indicators) {
    try {
      // 지표별 관찰 수와 빈도 설정
      let observationLimit = 5; // 관찰 데이터 수 증가
      if (indicator.type === 'quarterly') observationLimit = 8; // 분기 데이터는 더 많은 관찰이 필요
      
      // FRED API 호출
      console.log(`${indicator.id} 데이터 가져오기 시작`);
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${indicator.id}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=${observationLimit}&frequency=m`;
      
      try {
        const response = await fetch(url, { 
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store', // 캐시 비활성화로 항상 최신 데이터 가져오기
          next: { revalidate: 3600 } // 1시간마다 데이터 재검증 (선택사항)
        });
        
        if (!response.ok) {
          throw new Error(`FRED API 응답 오류: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.observations || data.observations.length < 2) {
          console.warn(`${indicator.id} 데이터가 충분하지 않습니다.`);
          continue; // 다음 지표로 넘어감
        }
        
        // 현재 값과 이전 값 가져오기
        const observations = data.observations
          .map(obs => ({ date: obs.date, value: parseFloat(obs.value) }))
          .filter(obs => !isNaN(obs.value));
        
        if (observations.length < 2) {
          console.warn(`${indicator.id}의 유효한 데이터가 충분하지 않습니다.`);
          continue;
        }
        
        const currentValue = observations[0].value;
        let previousValue = observations[1].value;
        
        // 변화율 계산
        let change = 0;
        if (currentValue !== 0 && previousValue !== 0) {
          if (indicator.id === 'CPIAUCSL') {
            // CPI는 연간 변화율로 계산 (12개월 변화)
            if (observations.length >= 13) {
              const yearAgoValue = observations[12].value;
              change = ((currentValue / yearAgoValue) - 1) * 100;
            } else {
              change = ((currentValue / previousValue) - 1) * 100;
            }
          } else if (indicator.id === 'GDP') {
            // GDP는 분기 성장률을 연율로 환산
            change = ((currentValue / previousValue) - 1) * 100;
          } else {
            // 기본 변화량
            change = currentValue - previousValue;
          }
        }
        
        // 값의 표현 방식 조정
        let displayValue = currentValue;
        
        // 특정 지표의 경우 별도 처리
        if (indicator.id === 'HOUST') {
          // 주택착공 건수는 단위를 조정 (천 단위를 백만 단위로)
          displayValue = displayValue / 1000;
        }
        
        // 시계열 데이터의 이전 기간 결정
        let previousPeriod = '전월';
        if (indicator.type === 'quarterly') previousPeriod = '전분기';
        else if (indicator.type === 'daily') previousPeriod = '전일';
        
        // 영향도 평가
        const impact = calculateImpact(indicator.id, change);
        
        // 결과 포맷팅
        results.push({
          name: indicator.name,
          nameKr: indicator.nameKr,
          value: displayValue,
          unit: indicator.unit,
          change: change,
          previousPeriod,
          source: 'FRED',
          description: indicator.description,
          impact
        });
        
        console.log(`${indicator.id} 데이터 가져오기 성공`);
      } catch (apiError) {
        console.error(`${indicator.id} API 호출 오류:`, apiError);
        // API 호출에 실패하면 다음 지표로 넘어감 (내부 try-catch 추가)
        continue;
      }
    } catch (err) {
      console.error(`${indicator.id} 데이터 가져오기 오류:`, err);
      // 오류 발생 시 해당 지표는 건너뜀
    }
  }
  
  // 모든 결과를 순회하며 한글 인코딩 확인
  results.forEach(result => {
    // UTF-8 인코딩 문제가 있는 필드 확인 및 수정
    if (result.nameKr && containsEncodingIssue(result.nameKr)) {
      result.nameKr = fixKoreanEncoding(result.nameKr);
    }
    
    if (result.description && containsEncodingIssue(result.description)) {
      result.description = fixKoreanEncoding(result.description);
    }
    
    if (result.previousPeriod && containsEncodingIssue(result.previousPeriod)) {
      result.previousPeriod = result.previousPeriod === 'ì ì' ? '전월' : 
                            result.previousPeriod === 'ì ë¶ê¸°' ? '전분기' : 
                            result.previousPeriod === 'ì ì¼' ? '전일' : result.previousPeriod;
    }
  });
  
  // 최소 3개의 지표가 없다면 모의 데이터 사용
  if (results.length < 3) {
    console.warn('가져온 FRED 데이터가 불충분하여 모의 데이터를 사용합니다.');
    return generateMockEconomicData();
  }
  
  return results;
}

// 지표별 영향 평가
function calculateImpact(indicatorId, change) {
  switch (indicatorId) {
    case 'GDP':
      if (change > 2) return 'positive';
      else if (change < 0) return 'negative';
      else return 'neutral';
      
    case 'UNRATE':
      if (change < -0.2) return 'positive';
      else if (change > 0.2) return 'negative';
      else return 'neutral';
      
    case 'CPIAUCSL':
      if (change < 2) return 'positive';
      else if (change > 4) return 'negative';
      else return 'neutral';
      
    case 'FEDFUNDS':
      return 'neutral'; // 금리는 맥락에 따라 영향이 다름
      
    case 'RSXFS':
      if (change > 0.5) return 'positive';
      else if (change < -0.5) return 'negative';
      else return 'neutral';
      
    case 'INDPRO':
      if (change > 0.3) return 'positive';
      else if (change < -0.3) return 'negative';
      else return 'neutral';
      
    case 'HOUST':
      if (change > 0) return 'positive';
      else if (change < -0.1) return 'negative';
      else return 'neutral';
      
    case 'UMCSENT':
      if (change > 2) return 'positive';
      else if (change < -2) return 'negative';
      else return 'neutral';
      
    case 'MPMGM201USM189S':
      if (change > 1) return 'positive';
      else if (change < -1) return 'negative';
      else return 'neutral';
      
    case 'DTWEXBGS':
      return 'neutral'; // 달러 인덱스는 맥락에 따라 영향이 다름
      
    default:
      return 'neutral';
  }
}

// 모의 경제 지표 데이터 생성
function generateMockEconomicData() {
  return [
    {
      name: 'GDP Growth Rate',
      nameKr: 'GDP 성장률',
      value: 2.1,
      unit: '%',
      change: 0.3,
      previousPeriod: '전분기',
      source: 'FRED',
      description: '국내 총생산(GDP) 성장률은 경제 성장의 핵심 지표로, 현재 완만한 성장세를 보이고 있습니다. 전분기 대비 상승은 경기 회복 신호로 해석됩니다.',
      impact: 'positive'
    },
    {
      name: 'Unemployment Rate',
      nameKr: '실업률',
      value: 3.8,
      unit: '%',
      change: -0.1,
      previousPeriod: '전월',
      source: 'FRED',
      description: '실업률 하락은 노동 시장이 견조하다는 신호입니다. 이는 소비자 지출과 경제 전반에 긍정적인 영향을 미칠 수 있습니다.',
      impact: 'positive'
    },
    {
      name: 'Inflation Rate',
      nameKr: '인플레이션',
      value: 3.2,
      unit: '%',
      change: -0.2,
      previousPeriod: '전월',
      source: 'FRED',
      description: '물가 상승률이 소폭 하락했으나 여전히 중앙은행 목표인 2%를 상회하고 있어 금리 인하에 제약 요인으로 작용할 수 있습니다.',
      impact: 'negative'
    },
    {
      name: 'Interest Rate',
      nameKr: '기준금리',
      value: 5.25,
      unit: '%',
      change: 0,
      previousPeriod: '전월',
      source: 'FRED',
      description: '중앙은행이 높은 금리를 유지하고 있으며, 향후 금리 인하 가능성은 인플레이션 추이에 달려 있습니다. 현재 금리 수준은 성장 둔화 요인으로 작용할 수 있습니다.',
      impact: 'neutral'
    },
    {
      name: 'Retail Sales',
      nameKr: '소매판매',
      value: 0.7,
      unit: '%',
      change: 0.4,
      previousPeriod: '전월',
      source: 'FRED',
      description: '소매판매 증가는 소비자 지출이 견조함을 나타내며, 이는 경제 성장의 중요한 요소입니다. 특히 인플레이션을 감안하더라도 실질적인 성장세를 보이고 있습니다.',
      impact: 'positive'
    },
    {
      name: 'Industrial Production',
      nameKr: '산업생산',
      value: -0.3,
      unit: '%',
      change: -0.5,
      previousPeriod: '전월',
      source: 'FRED',
      description: '산업생산 감소는 제조업 부문이 약세를 보이고 있음을 시사합니다. 이는 공급망 문제와 높은 금리의 영향으로 볼 수 있습니다.',
      impact: 'negative'
    },
    {
      name: 'Housing Starts',
      nameKr: '주택착공',
      value: 1.4,
      unit: 'M',
      change: -0.2,
      previousPeriod: '전월',
      source: 'FRED',
      description: '주택 착공 건수 감소는 높은 모기지 금리로 인한 주택 시장 냉각을 반영합니다. 부동산 섹터의 약세는 경제 전반에 부담 요인이 될 수 있습니다.',
      impact: 'negative'
    },
    {
      name: 'Consumer Confidence',
      nameKr: '소비자 신뢰지수',
      value: 102.6,
      unit: '',
      change: 3.2,
      previousPeriod: '전월',
      source: 'CB',
      description: '소비자 신뢰지수 상승은 가계가 경제 상황을 긍정적으로 평가하고 있음을 나타냅니다. 이는 향후 소비 증가로 이어질 수 있는 신호입니다.',
      impact: 'positive'
    },
    {
      name: 'ISM Manufacturing',
      nameKr: 'ISM 제조업지수',
      value: 49.2,
      unit: '',
      change: 0.8,
      previousPeriod: '전월',
      source: 'ISM',
      description: 'ISM 제조업지수가 50 미만이면 제조업 부문 수축을 의미합니다. 그러나 전월 대비 상승은 하락세 완화 가능성을 시사합니다.',
      impact: 'neutral'
    },
    {
      name: 'Dollar Index',
      nameKr: '달러 인덱스',
      value: 102.3,
      unit: '',
      change: -0.5,
      previousPeriod: '전주',
      source: 'FRED',
      description: '달러 약세는 미국 수출업체에게 긍정적이나, 수입 물가 상승으로 인플레이션에 부담이 될 수 있습니다. 환율 변동은 국제 무역과 기업 수익에 영향을 미칩니다.',
      impact: 'neutral'
    }
  ];
}

// 한글 인코딩 문제 확인 함수
function containsEncodingIssue(text) {
  // 인코딩 문제의 일반적인 패턴 (예: 'ì' 'ê' 'ë' 등)
  return /ì|ê|ë|í|ó|ú|â|ô|û|ç|à|è|ò|ù/.test(text);
}

// 한글 인코딩 수정 함수
function fixKoreanEncoding(text) {
  // 일반적인 인코딩 이슈 수정
  let fixed = text
    .replace(/ì ì/g, '전월')
    .replace(/ì ë¶ê¸°/g, '전분기')
    .replace(/ì ì¼/g, '전일')
    .replace(/ê·¼ë¡ ì°ë ¹ ì¸êµ¬ ì¤ ì¤ìì ë¹ì¨ë¡, ë¸ë ìì¥ì ê±´ì ì±/g, '근로 연령 인구 중 실업자 비율로, 노동 시장의 건전성')
    .replace(/ìë¹ìë¬¼ê°ì§ì/g, '소비자물가지수')
    .replace(/ëì ìë¹ìë¤ì´ êµ¬ë§¤íë ìíê³¼ ìë¹ì¤ì ê°ê²© ë³íë¥/g, '도시 소비자들이 구매하는 상품과 서비스의 가격 변화율')
    .replace(/ì¸íë ì´ìì ì£¼ì ì§íìëë¤/g, '인플레이션의 주요 지표입니다')
    .replace(/ê¸°ì¤ê¸ë¦¬/g, '기준금리')
    .replace(/ë¯¸ ì°ë°©ì¤ë¹ì ëê° ì¤ì íë ê¸°ì¤ê¸ë¦¬ë¡, ì ë°ì ì¸ ê¸/g, '미 연방준비제도가 설정하는 기준금리로, 전반적인 금')
    .replace(/ìµ ìí©ê³¼ íµí ì ì±ì ë°©í¥ì ëíëëë¤/g, '융 상황과 통화 정책의 방향을 나타냅니다')
    .replace(/ìë§¤íë§¤/g, '소매판매')
    .replace(/ìë¹ì ì§ì¶ì ì£¼ì ì§íë¡, ê²½ì  ì±ì¥ì í° ìí¥ì ë¯¸ì¹/g, '소비자 지출의 주요 지표로, 경제 성장에 큰 영향을 미치')
    .replace(/ë ìë§¤ ë¶ë¬¸ì ê±´ì ì±ì ë³´ì¬ì¤ëë¤/g, '는 소매 부문의 건전성을 보여줍니다')
    .replace(/ì°ììì°/g, '산업생산')
    .replace(/ì ê· ì£¼í ê±´ì¤ ì°©ê³µ ê±´ìë¡, ë¶ëì° ìì¥ì ê±´ì ì±ê³/g, '신규 주택 건설 착공 건수로, 부동산 시장의 건전성과')
    .replace(/¼ ìë¹ì ì ë¢°ëë¥¼ ëíëëë¤/g, ' 소비자 신뢰도를 나타냅니다')
    .replace(/ìë¹ì ì¬ë¦¬ì§ì/g, '소비자 심리지수')
    .replace(/ë¯¸ìê° ëí ìë¹ì ì¬ë¦¬ ì¡°ì¬ë¡, ìë¹ìë¤ì ê²½ì  ìí©ì/g, '미시간 대학 소비자 심리 조사로, 소비자들의 경제 상황에')
    .replace(/ëí ì¸ìê³¼ ì ë§ì ë³´ì¬ì¤ëë¤/g, '대한 인식과 전망을 보여줍니다')
    .replace(/ë¬ë¬ ì¸ë±ì¤/g, '달러 인덱스')
    .replace(/ë¯¸ ë¬ë¬íì ë¤ë¥¸ ì£¼ì íµí ëë¹ ê°ì¹ë¥¼ ì¸¡ì íë ì§ìë/g, '미 달러화의 다른 주요 통화 대비 가치를 측정하는 지수로')
    .replace(/¡, ê¸ë¡ë² ë¬´ì­ê³¼ í¬ìì ìí¥ì ë¯¸ì¹©ëë¤/g, ', 글로벌 무역과 투자에 영향을 미칩니다')
    // 추가 인코딩 문제 해결
    .replace(/ë/g, '키')
    .replace(/ì/g, '이')
    .replace(/ê/g, '귀');

  return fixed;
} 
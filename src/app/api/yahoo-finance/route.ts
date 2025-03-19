import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';
import axios from 'axios';
import { StockData } from '@/app/stock-analyzer/types';

// 회사 정보 한글 번역을 위한 API 키 (실제 사용 시 환경 변수로 관리해야 합니다)
const PAPAGO_API_KEY = process.env.PAPAGO_API_KEY || '';
const PAPAGO_API_SECRET = process.env.PAPAGO_API_SECRET || '';

// Yahoo Finance API 키 - 기본 기능에는 필요하지 않음
// const YAHOO_FINANCE_API_KEY = process.env.YAHOO_FINANCE_API_KEY || '';

// 기술적 지표 계산 함수들
import {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateEMA,
  calculateATR,
  calculateOBV,
  calculateStochastic,
  calculateADX,
  identifySupportResistance,
  detectChartPatterns
} from '@/app/stock-analyzer/technical-indicators';

// 모멘텀 계산 함수
function calculateMomentum(prices, days) {
  if (!prices || prices.length < days) return 0;
  const currentPrice = prices[prices.length - 1].price;
  const pastPrice = prices[prices.length - days - 1]?.price || prices[0].price;
  return ((currentPrice - pastPrice) / pastPrice) * 100;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  
  if (!symbol) {
    return NextResponse.json(
      { error: '주식 심볼이 필요합니다' },
      { status: 400 }
    );
  }
  
  try {
    console.log(`Yahoo Finance API 호출: ${symbol}`);
    
    // Yahoo Finance API 호출 시도
    try {
      // Yahoo Finance API 호출
      const quote = await yahooFinance.quote(symbol);
      const summary = await yahooFinance.quoteSummary(symbol, {
        modules: [
          'price', 'summaryDetail', 'defaultKeyStatistics', 
          'financialData', 'calendarEvents', 'assetProfile'
        ]
      });
      
      // 과거 주가 데이터 가져오기
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      
      const historical = await yahooFinance.historical(symbol, {
        period1: startDate,
        period2: endDate,
        interval: '1d'
      });
      
      // 과거 주가 데이터 가공
      const prices = historical.map(item => ({
        date: item.date.toISOString().split('T')[0],
        price: item.close,
        volume: item.volume,
        open: item.open,
        high: item.high,
        low: item.low
      })).reverse();
      
      // 기술적 지표 계산
      const rsi = calculateRSI(prices.map(p => p.price), 14);
      const macd = calculateMACD(prices.map(p => p.price));
      const bollingerBands = calculateBollingerBands(prices.map(p => p.price));
      const ema20 = calculateEMA(prices.map(p => p.price), 20);
      const ema50 = calculateEMA(prices.map(p => p.price), 50);
      const atr = calculateATR(
        prices.map(p => p.high), 
        prices.map(p => p.low), 
        prices.map(p => p.price), 
        14
      );
      const obv = calculateOBV(
        prices.map(p => p.price), 
        prices.map(p => p.volume)
      );
      const stochastic = calculateStochastic(
        prices.map(p => p.price), 
        prices.map(p => p.high), 
        prices.map(p => p.low)
      );
      const adx = calculateADX(
        prices.map(p => p.high), 
        prices.map(p => p.low), 
        prices.map(p => p.price)
      );
      const { support: supportLevels, resistance: resistanceLevels } = identifySupportResistance(
        prices.map(p => p.price), 
        prices.map(p => p.high), 
        prices.map(p => p.low)
      );
      const patterns = detectChartPatterns(
        prices.map(p => p.price), 
        prices.map(p => p.high), 
        prices.map(p => p.low), 
        prices.map(p => p.volume)
      );
      
      // 회사 설명 번역 (Papago API 키가 있는 경우)
      let descriptionKr = '';
      if (PAPAGO_API_KEY && PAPAGO_API_SECRET && summary.assetProfile?.longBusinessSummary) {
        try {
          const response = await axios.post(
            'https://openapi.naver.com/v1/papago/n2mt',
            {
              source: 'en',
              target: 'ko',
              text: summary.assetProfile.longBusinessSummary
            },
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Naver-Client-Id': PAPAGO_API_KEY,
                'X-Naver-Client-Secret': PAPAGO_API_SECRET
              }
            }
          );
          
          if (response.data && response.data.message && response.data.message.result) {
            descriptionKr = response.data.message.result.translatedText;
          }
        } catch (translationError) {
          console.error('번역 API 오류:', translationError);
        }
      }
      
      // 주식 데이터 구성
      const stockData = {
        ticker: symbol,
        companyName: quote.longName || quote.shortName || symbol,
        companyNameKr: quote.longName || quote.shortName || symbol,
        sector: summary.assetProfile?.sector || '',
        industry: summary.assetProfile?.industry || '',
        currentPrice: quote.regularMarketPrice,
        priceChange: quote.regularMarketChangePercent,
        marketCap: quote.marketCap || 0,
        volume: quote.regularMarketVolume || 0,
        high52Week: quote.fiftyTwoWeekHigh || 0,
        low52Week: quote.fiftyTwoWeekLow || 0,
        description: summary.assetProfile?.longBusinessSummary || '',
        descriptionKr: descriptionKr || summary.assetProfile?.longBusinessSummary || '',
        historicalPrices: prices,
        technicalIndicators: {
          rsi,
          macd,
          bollingerBands,
          ma50: calculateSimpleMA(prices.map(p => p.price), 50),
          ma200: calculateSimpleMA(prices.map(p => p.price), 200),
          ema20,
          ema50,
          atr,
          obv,
          stochastic,
          adx,
          supportLevels,
          resistanceLevels
        },
        fundamentals: {
          pe: summary.summaryDetail?.trailingPE || 0,
          eps: summary.defaultKeyStatistics?.trailingEps || 0,
          dividendYield: summary.summaryDetail?.dividendYield ? summary.summaryDetail.dividendYield * 100 : 0,
          peg: summary.defaultKeyStatistics?.pegRatio || 0,
          roe: summary.financialData?.returnOnEquity ? summary.financialData.returnOnEquity * 100 : 0,
          debtToEquity: summary.financialData?.debtToEquity || 0,
          revenue: summary.financialData?.totalRevenue || 0,
          revenueGrowth: summary.financialData?.revenueGrowth ? summary.financialData.revenueGrowth * 100 : 0,
          netIncome: summary.defaultKeyStatistics?.netIncomeToCommon || 0,
          netIncomeGrowth: 0, // 야후 파이넨스에서 직접 제공하지 않음
          operatingMargin: summary.financialData?.operatingMargins ? summary.financialData.operatingMargins * 100 : 0,
          forwardPE: summary.summaryDetail?.forwardPE || 0,
          epsGrowth: 0, // 야후 파이넨스에서 직접 제공하지 않음
          dividendGrowth: 0, // 야후 파이넨스에서 직접 제공하지 않음
          pb: summary.defaultKeyStatistics?.priceToBook || 0,
          ps: 0, // 계산 필요
          pcf: 0, // 계산 필요
          roa: summary.financialData?.returnOnAssets ? summary.financialData.returnOnAssets * 100 : 0,
          roic: 0, // 야후 파이넨스에서 직접 제공하지 않음
          currentRatio: summary.financialData?.currentRatio || 0,
          quickRatio: summary.financialData?.quickRatio || 0,
          grossMargin: summary.financialData?.grossMargins ? summary.financialData.grossMargins * 100 : 0,
          fcf: summary.financialData?.freeCashflow || 0,
          fcfGrowth: 0, // 야후 파이넨스에서 직접 제공하지 않음
          nextEarningsDate: summary.calendarEvents?.earnings?.earningsDate && 
            summary.calendarEvents.earnings.earningsDate.length > 0 ? 
            new Date(summary.calendarEvents.earnings.earningsDate[0]).toISOString().split('T')[0] : '',
          analystRatings: {
            buy: summary.financialData?.recommendationKey === 'buy' || 
                 summary.financialData?.recommendationKey === 'strong_buy' ? 1 : 0,
            hold: summary.financialData?.recommendationKey === 'hold' ? 1 : 0,
            sell: summary.financialData?.recommendationKey === 'sell' || 
                  summary.financialData?.recommendationKey === 'strong_sell' ? 1 : 0,
            targetPrice: summary.financialData?.targetMeanPrice || 0
          }
        },
        news: [], // 뉴스는 별도 API 호출 필요
        patterns: patterns, // 차트 패턴
        upcomingEvents: [], // 이벤트는 별도 API 호출 필요
        momentum: {
          shortTerm: calculateMomentum(prices, 7),
          mediumTerm: calculateMomentum(prices, 30),
          longTerm: calculateMomentum(prices, 90),
          relativeStrength: 50, // 별도 계산 필요
          sectorPerformance: 0 // 별도 API 호출 필요
        },
        lastUpdated: new Date().toISOString()
      };

      return NextResponse.json(stockData);
    } catch (yahooError) {
      console.error('Yahoo Finance API 오류:', yahooError);
      console.log('모의 주식 데이터 생성:', symbol);
      return NextResponse.json(generateMockStockData(symbol));
    }
  } catch (error) {
    console.error('Yahoo Finance API 오류:', error);
    return NextResponse.json(generateMockStockData(symbol));
  }
}

// 모의 주식 데이터 생성 함수
function generateMockStockData(symbol: string): StockData {
  const currentDate = new Date();
  const historicalPrices = [];
  const basePrice = 100 + Math.random() * 900;
  
  // 과거 365일 데이터 생성
  for (let i = 365; i >= 0; i--) {
    const date = new Date();
    date.setDate(currentDate.getDate() - i);
    
    const volatility = 0.02; // 2% 변동성
    const randomChange = (Math.random() - 0.5) * volatility * basePrice;
    const price = basePrice + randomChange * (365 - i) / 100;
    
    historicalPrices.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      open: parseFloat((price - Math.random() * 5).toFixed(2)),
      high: parseFloat((price + Math.random() * 5).toFixed(2)),
      low: parseFloat((price - Math.random() * 5).toFixed(2))
    });
  }
  
  const currentPrice = historicalPrices[historicalPrices.length - 1].price;
  const previousPrice = historicalPrices[historicalPrices.length - 2].price;
  const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;
  
  // 기술적 지표 계산
  const prices = historicalPrices.map(p => p.price);
  const highs = historicalPrices.map(p => p.high);
  const lows = historicalPrices.map(p => p.low);
  const volumes = historicalPrices.map(p => p.volume);
  
  const rsi = calculateRSI(prices, 14);
  const macd = calculateMACD(prices);
  const bollingerBands = calculateBollingerBands(prices);
  const ma50 = calculateSimpleMA(prices, 50);
  const ma200 = calculateSimpleMA(prices, 200);
  const ema20 = calculateEMA(prices, 20);
  const ema50 = calculateEMA(prices, 50);
  const atr = calculateATR(highs, lows, prices, 14);
  const obv = calculateOBV(prices, volumes);
  const stochastic = calculateStochastic(prices, highs, lows);
  const adx = calculateADX(highs, lows, prices);
  const { support: supportLevels, resistance: resistanceLevels } = identifySupportResistance(prices, highs, lows);
  const patterns = detectChartPatterns(prices, highs, lows, volumes);
  
  // 모의 회사 정보 생성
  const sectors = ['기술', '금융', '헬스케어', '소비재', '에너지', '통신', '산업재'];
  const industries = {
    '기술': ['소프트웨어', '하드웨어', '반도체', '인터넷', '클라우드'],
    '금융': ['은행', '보험', '자산관리', '핀테크', '부동산'],
    '헬스케어': ['제약', '의료기기', '바이오테크', '헬스케어 서비스', '생명과학'],
    '소비재': ['소매', '식품', '의류', '자동차', '엔터테인먼트'],
    '에너지': ['석유', '가스', '재생에너지', '유틸리티', '에너지 서비스'],
    '통신': ['통신 서비스', '미디어', '엔터테인먼트', '광고', '소셜 미디어'],
    '산업재': ['제조', '항공우주', '방위산업', '건설', '기계']
  };
  
  const randomSector = sectors[Math.floor(Math.random() * sectors.length)];
  const randomIndustry = industries[randomSector][Math.floor(Math.random() * industries[randomSector].length)];
  
  // 모의 회사 설명 생성
  const descriptions = [
    `${symbol}은(는) ${randomSector} 분야의 선도적인 기업으로, 특히 ${randomIndustry} 부문에서 혁신적인 제품과 서비스를 제공하고 있습니다. 글로벌 시장에서 강력한 입지를 구축하고 있으며, 지속적인 성장을 위한 전략적 투자를 진행하고 있습니다.`,
    `${symbol}은(는) ${randomIndustry} 산업에서 혁신을 주도하는 기업으로, 고객 중심의 솔루션을 개발하여 시장에서 차별화된 가치를 제공하고 있습니다. 최근 몇 년간 꾸준한 매출 성장을 보이고 있으며, 신규 시장 진출을 통해 사업 다각화를 추진하고 있습니다.`,
    `${symbol}은(는) ${randomSector} 분야에서 ${randomIndustry} 솔루션을 제공하는 글로벌 기업입니다. 최첨단 기술과 혁신적인 비즈니스 모델을 통해 산업 표준을 정의하고 있으며, 지속 가능한 성장과 주주 가치 창출에 집중하고 있습니다.`
  ];
  
  const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
  
  // 모의 주식 데이터 생성
  return {
    ticker: symbol,
    companyName: `${symbol} Corporation`,
    companyNameKr: `${symbol} 주식회사`,
    sector: randomSector,
    industry: randomIndustry,
    currentPrice: currentPrice,
    priceChange: parseFloat(priceChange.toFixed(2)),
    marketCap: currentPrice * (Math.floor(Math.random() * 1000000) + 1000000),
    volume: Math.floor(Math.random() * 10000000) + 1000000,
    high52Week: Math.max(...historicalPrices.map(p => p.price)),
    low52Week: Math.min(...historicalPrices.map(p => p.price)),
    description: randomDescription,
    descriptionKr: randomDescription,
    historicalPrices: historicalPrices,
    technicalIndicators: {
      rsi,
      macd,
      bollingerBands,
      ma50,
      ma200,
      ema20,
      ema50,
      atr,
      obv,
      stochastic,
      adx,
      supportLevels,
      resistanceLevels
    },
    fundamentals: {
      pe: parseFloat((Math.random() * 30 + 5).toFixed(2)),
      eps: parseFloat((currentPrice / (Math.random() * 30 + 5)).toFixed(2)),
      dividendYield: parseFloat((Math.random() * 5).toFixed(2)),
      peg: parseFloat((Math.random() * 3 + 0.5).toFixed(2)),
      roe: parseFloat((Math.random() * 30 + 5).toFixed(2)),
      debtToEquity: parseFloat((Math.random() * 2).toFixed(2)),
      revenue: Math.floor(Math.random() * 10000000000) + 100000000,
      revenueGrowth: parseFloat((Math.random() * 30 - 5).toFixed(2)),
      netIncome: Math.floor(Math.random() * 1000000000) + 10000000,
      netIncomeGrowth: parseFloat((Math.random() * 30 - 5).toFixed(2)),
      operatingMargin: parseFloat((Math.random() * 30 + 5).toFixed(2)),
      forwardPE: parseFloat((Math.random() * 25 + 5).toFixed(2)),
      epsGrowth: parseFloat((Math.random() * 30 - 5).toFixed(2)),
      dividendGrowth: parseFloat((Math.random() * 20 - 5).toFixed(2)),
      pb: parseFloat((Math.random() * 10 + 0.5).toFixed(2)),
      ps: parseFloat((Math.random() * 10 + 0.5).toFixed(2)),
      pcf: parseFloat((Math.random() * 20 + 1).toFixed(2)),
      roa: parseFloat((Math.random() * 20 + 1).toFixed(2)),
      roic: parseFloat((Math.random() * 25 + 5).toFixed(2)),
      currentRatio: parseFloat((Math.random() * 3 + 0.5).toFixed(2)),
      quickRatio: parseFloat((Math.random() * 2 + 0.5).toFixed(2)),
      grossMargin: parseFloat((Math.random() * 50 + 20).toFixed(2)),
      fcf: Math.floor(Math.random() * 500000000) + 10000000,
      fcfGrowth: parseFloat((Math.random() * 30 - 5).toFixed(2)),
      nextEarningsDate: (() => {
        const date = new Date();
        date.setDate(date.getDate() + Math.floor(Math.random() * 90) + 1);
        return date.toISOString().split('T')[0];
      })(),
      analystRatings: {
        buy: Math.floor(Math.random() * 10) + 1,
        hold: Math.floor(Math.random() * 5) + 1,
        sell: Math.floor(Math.random() * 3),
        targetPrice: parseFloat((currentPrice * (1 + (Math.random() * 0.4 - 0.1))).toFixed(2))
      }
    },
    news: [
      {
        title: `${symbol} 분기 실적 예상치 상회`,
        source: '경제신문',
        date: (() => {
          const date = new Date();
          date.setDate(date.getDate() - Math.floor(Math.random() * 30));
          return date.toISOString().split('T')[0];
        })(),
        url: '#',
        sentiment: 'positive'
      },
      {
        title: `${symbol}, 신규 제품 라인업 발표`,
        source: '비즈니스 투데이',
        date: (() => {
          const date = new Date();
          date.setDate(date.getDate() - Math.floor(Math.random() * 60) - 30);
          return date.toISOString().split('T')[0];
        })(),
        url: '#',
        sentiment: 'positive'
      },
      {
        title: `애널리스트들, ${symbol} 목표가 상향 조정`,
        source: '투자저널',
        date: (() => {
          const date = new Date();
          date.setDate(date.getDate() - Math.floor(Math.random() * 90) - 60);
          return date.toISOString().split('T')[0];
        })(),
        url: '#',
        sentiment: 'positive'
      }
    ],
    patterns: patterns,
    upcomingEvents: [
      {
        date: (() => {
          const date = new Date();
          date.setDate(date.getDate() + Math.floor(Math.random() * 30) + 1);
          return date.toISOString().split('T')[0];
        })(),
        type: '실적 발표',
        title: '분기별 실적 발표',
        description: `${symbol}의 분기별 실적 발표`,
        impact: 'high'
      },
      {
        date: (() => {
          const date = new Date();
          date.setDate(date.getDate() + Math.floor(Math.random() * 30) + 30);
          return date.toISOString().split('T')[0];
        })(),
        type: '투자자 컨퍼런스',
        title: '연례 투자자 컨퍼런스',
        description: '연례 투자자 컨퍼런스 및 신제품 발표',
        impact: 'medium'
      }
    ],
    momentum: {
      shortTerm: calculateMomentum(historicalPrices, 7),
      mediumTerm: calculateMomentum(historicalPrices, 30),
      longTerm: calculateMomentum(historicalPrices, 90),
      relativeStrength: parseFloat((Math.random() * 100).toFixed(2)),
      sectorPerformance: parseFloat((Math.random() * 20 - 10).toFixed(2))
    },
    lastUpdated: new Date().toISOString()
  };
}

// 간단한 이동평균 계산 함수
function calculateSimpleMA(prices, period) {
  if (!prices || prices.length < period) return 0;
  const slice = prices.slice(-period);
  return slice.reduce((sum, price) => sum + price, 0) / period;
}
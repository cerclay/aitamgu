import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { WinningNumber } from '@/app/lotto-generator/types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';

// 백업 데이터
const BACKUP_WINNING_NUMBERS: WinningNumber[] = [
  {
    round: 1162,
    numbers: [20, 21, 22, 25, 28, 29],
    date: '2024-03-08',
    totalPrize: 823931021
  },
  {
    round: 1161,
    numbers: [2, 12, 20, 24, 34, 42],
    date: '2024-03-01',
    totalPrize: 1792657969
  },
  {
    round: 1160,
    numbers: [7, 13, 18, 36, 39, 45],
    date: '2024-02-23',
    totalPrize: 2509359875
  },
  {
    round: 1159,
    numbers: [12, 14, 15, 24, 27, 45],
    date: '2024-02-16',
    totalPrize: 2756421500
  },
  {
    round: 1158,
    numbers: [3, 8, 15, 27, 29, 35],
    date: '2024-02-09',
    totalPrize: 2945632100
  }
];

// 동행복권 웹사이트에서 최신 로또 당첨 번호 가져오기
async function getLottoNumbersFromDhlottery(): Promise<WinningNumber[]> {
  try {
    // 최신 회차 번호 가져오기
    const mainResponse = await axios.get('https://www.dhlottery.co.kr/common.do?method=main');
    const mainHtml = mainResponse.data;
    const $ = cheerio.load(mainHtml);
    
    // 메인 페이지에서 최신 회차 번호 추출
    const latestRoundText = $('.win_result h4').text().trim();
    const latestRound = parseInt(latestRoundText.match(/\d+/)?.[0] || '0');
    
    if (!latestRound) {
      console.error('최신 회차 번호를 찾을 수 없습니다.');
      return BACKUP_WINNING_NUMBERS;
    }
    
    const results: WinningNumber[] = [];
    
    // 최근 5회차의 당첨 번호 가져오기
    for (let i = 0; i < 5; i++) {
      const round = latestRound - i;
      if (round <= 0) break;
      
      try {
        const response = await axios.get(`https://www.dhlottery.co.kr/gameResult.do?method=byWin&drwNo=${round}`);
        const html = response.data;
        const $ = cheerio.load(html);
        
        // 당첨 번호 추출
        const winNumbers: number[] = [];
        $('.win_result .ball_645').each((index, element) => {
          if (index < 6) { // 보너스 번호 제외
            const num = parseInt($(element).text().trim());
            winNumbers.push(num);
          }
        });
        
        // 당첨일자 추출
        const dateText = $('.win_result .desc').text().trim();
        const dateMatch = dateText.match(/\d{4}년\s+\d{1,2}월\s+\d{1,2}일/);
        let dateStr = '';
        
        if (dateMatch) {
          const dateParts = dateMatch[0].match(/(\d{4})년\s+(\d{1,2})월\s+(\d{1,2})일/);
          if (dateParts) {
            const year = dateParts[1];
            const month = dateParts[2].padStart(2, '0');
            const day = dateParts[3].padStart(2, '0');
            dateStr = `${year}-${month}-${day}`;
          }
        }
        
        // 1등 당첨금액 추출
        let totalPrize = 0;
        $('.tbl_data tbody tr').each((index, element) => {
          if (index === 0) { // 1등 정보
            const prizeText = $(element).find('td:nth-child(4)').text().trim();
            const prizeMatch = prizeText.match(/[\d,]+/);
            if (prizeMatch) {
              totalPrize = parseInt(prizeMatch[0].replace(/,/g, ''));
            }
          }
        });
        
        if (winNumbers.length === 6 && dateStr) {
          results.push({
            round,
            numbers: winNumbers,
            date: dateStr,
            totalPrize
          });
        }
      } catch (error) {
        console.error(`${round}회차 정보 가져오기 실패:`, error);
      }
      
      // 요청 간 간격 두기
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results.length > 0 ? results : BACKUP_WINNING_NUMBERS;
  } catch (error) {
    console.error('동행복권 웹사이트에서 정보 가져오기 실패:', error);
    return BACKUP_WINNING_NUMBERS;
  }
}

const getApiKey = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API 키가 설정되지 않았습니다.');
  }
  return apiKey;
};

export async function POST(request: NextRequest) {
  try {
    const { category } = await request.json();
    
    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    let prompt = '';
    switch (category) {
      case 'frequency':
        prompt = '최근 로또 당첨 번호에서 자주 등장하는 번호들을 분석하여 6개의 번호를 추천해주세요. 1부터 45까지의 숫자 중에서 선택하되, 중복되지 않게 해주세요.';
        break;
      case 'pattern':
        prompt = '최근 로또 당첨 번호들의 패턴(홀짝 비율, 번호 간격 등)을 분석하여 비슷한 패턴의 6개 번호를 추천해주세요. 1부터 45까지의 숫자 중에서 선택하되, 중복되지 않게 해주세요.';
        break;
      case 'cold':
        prompt = '최근 로또 당첨 번호에서 오랫동안 등장하지 않은 번호들을 중심으로 6개의 번호를 추천해주세요. 1부터 45까지의 숫자 중에서 선택하되, 중복되지 않게 해주세요.';
        break;
      case 'prediction':
        prompt = '로또 당첨 번호의 통계와 패턴을 분석하여 다음 회차에 나올 것 같은 6개의 번호를 예측해주세요. 1부터 45까지의 숫자 중에서 선택하되, 중복되지 않게 해주세요.';
        break;
      case 'all':
        prompt = '모든 분석 방법(출현 빈도, 패턴, 미출현 기간, 예측)을 종합적으로 고려하여 가장 균형 잡힌 6개의 번호를 추천해주세요. 1부터 45까지의 숫자 중에서 선택하되, 중복되지 않게 해주세요.';
        break;
      default:
        prompt = '로또 번호 6개를 추천해주세요. 1부터 45까지의 숫자 중에서 선택하되, 중복되지 않게 해주세요.';
    }

    prompt = prompt + " " + "Please provide the result in the following JSON format: " + 
      '{"numbers": [1, 2, 3, 4, 5, 6], "explanation": "번호 선택 이유에 대한 설명"}';

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch (error) {
      console.error('JSON 파싱 에러:', error);
      return NextResponse.json({
        numbers: [1, 2, 3, 4, 5, 6],
        explanation: '번호 생성 중 오류가 발생했습니다.'
      });
    }
  } catch (error) {
    console.error('API 에러:', error);
    return NextResponse.json({
      numbers: [1, 2, 3, 4, 5, 6],
      explanation: '서버 오류가 발생했습니다.'
    });
  }
}

export async function GET() {
  try {
    // 동행복권 웹사이트에서 최신 로또 당첨 번호 가져오기
    const numbers = await getLottoNumbersFromDhlottery();
    return NextResponse.json(numbers);
  } catch (error) {
    console.error('로또 당첨번호 가져오기 실패:', error);
    return NextResponse.json(BACKUP_WINNING_NUMBERS);
  }
} 
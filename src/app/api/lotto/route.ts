import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { WinningNumber } from '@/app/lotto-generator/types';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

const PERPLEXITY_API_KEY = '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';

async function getLottoNumbersFromPerplexity(): Promise<WinningNumber[]> {
  try {
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'pplx-7b-chat',
        messages: [
          {
            role: 'system',
            content: '당신은 로또 당첨번호 정보를 제공하는 도우미입니다. 최근 5회차의 로또 당첨번호, 당첨일자, 1등 당첨금액을 JSON 형식으로 제공해주세요.'
          },
          {
            role: 'user',
            content: '최근 5회차의 로또 당첨번호 정보를 알려주세요. 회차, 당첨번호 6개, 당첨일자, 1등 당첨금액을 포함해주세요.'
          }
        ],
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // AI 응답에서 JSON 데이터 추출
    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const jsonData = JSON.parse(jsonMatch[0]);
      return jsonData.results || BACKUP_WINNING_NUMBERS;
    }

    return BACKUP_WINNING_NUMBERS;
  } catch (error) {
    console.error('Perplexity API 호출 실패:', error);
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

    prompt += '\n\n결과는 다음과 같은 JSON 형식으로 제공해주세요:\n{
      "numbers": [1, 2, 3, 4, 5, 6],
      "explanation": "번호 선택 이유에 대한 설명"
    }';

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
    const numbers = await getLottoNumbersFromPerplexity();
    return NextResponse.json(numbers);
  } catch (error) {
    console.error('로또 당첨번호 가져오기 실패:', error);
    return NextResponse.json(BACKUP_WINNING_NUMBERS);
  }
} 
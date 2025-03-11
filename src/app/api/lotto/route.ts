import { NextResponse } from 'next/server';
import axios from 'axios';
import { WinningNumber } from '@/app/lotto-generator/types';

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

export async function GET() {
  try {
    const numbers = await getLottoNumbersFromPerplexity();
    return NextResponse.json(numbers);
  } catch (error) {
    console.error('로또 당첨번호 가져오기 실패:', error);
    return NextResponse.json(BACKUP_WINNING_NUMBERS);
  }
} 
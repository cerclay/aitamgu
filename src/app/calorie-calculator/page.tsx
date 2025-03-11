'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default function CalorieCalculator() {
  const [foodInput, setFoodInput] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeCalories = async () => {
    if (!foodInput.trim()) {
      setError('음식을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const genAI = new GoogleGenerativeAI('AIzaSyC_Woxwt323fN5CRAHbGRrzAp10bGZMA_4');
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `다음 음식의 칼로리와 영양 정보를 분석해주세요. 결과는 다음 형식으로 제공해주세요:
      
음식: [음식 이름]
1회 제공량: [그램 또는 ml]
칼로리: [kcal]
탄수화물: [g]
단백질: [g]
지방: [g]
나트륨: [mg]

추가 정보:
- 건강 관련 팁
- 대체 가능한 저칼로리 옵션

분석할 음식: ${foodInput}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      setResult(text);
    } catch (err) {
      setError('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-teal-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 홈으로 돌아가기 버튼 */}
        <div className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center text-teal-600 hover:text-teal-700 transition-colors font-medium"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            <span>홈으로 돌아가기</span>
          </Link>
        </div>

        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-teal-800 mb-4">
            AI 칼로리 계산기
          </h1>
          <p className="text-lg text-gray-600">
            당신의 건강한 삶을 위한 맞춤형 칼로리 계산
          </p>
        </div>

        {/* 입력 폼 */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <label htmlFor="food-input" className="block text-gray-700 text-sm font-medium mb-2">
              분석할 음식을 입력하세요
            </label>
            <div className="flex gap-4">
              <input
                id="food-input"
                type="text"
                value={foodInput}
                onChange={(e) => setFoodInput(e.target.value)}
                placeholder="예: 김치찌개, 불고기, 샐러드..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <button
                onClick={analyzeCalories}
                disabled={loading}
                className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700'
                }`}
              >
                {loading ? '분석 중...' : '분석하기'}
              </button>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          {/* 결과 표시 */}
          {result && (
            <div className="mt-8 p-6 bg-teal-50 border border-teal-100 rounded-lg">
              <pre className="whitespace-pre-wrap font-sans text-gray-700">
                {result}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CalorieCalculator() {
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

        {/* 개발 중 메시지 */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🚧 개발 진행 중 🚧
          </h2>
          <p className="text-gray-600 mb-6">
            더 나은 서비스를 위해 준비 중입니다.<br />
            조금만 기다려주세요!
          </p>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 
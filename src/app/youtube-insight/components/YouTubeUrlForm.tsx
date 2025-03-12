'use client';

import { useState } from 'react';
import { Search, Youtube } from 'lucide-react';

interface YouTubeUrlFormProps {
  onSubmit: (url: string) => void;
  summaryLength: 'short' | 'medium' | 'long';
  onSummaryLengthChange: (length: 'short' | 'medium' | 'long') => void;
  language: string;
  onLanguageChange: (language: string) => void;
}

export default function YouTubeUrlForm({
  onSubmit,
  summaryLength,
  onSummaryLengthChange,
  language,
  onLanguageChange
}: YouTubeUrlFormProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(url);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Youtube className="w-5 h-5 text-red-500" />
        </div>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="YouTube 영상 URL을 입력하세요"
          className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">요약 길이</label>
          <div className="flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => onSummaryLengthChange('short')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                summaryLength === 'short'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              간략하게
            </button>
            <button
              type="button"
              onClick={() => onSummaryLengthChange('medium')}
              className={`px-4 py-2 text-sm font-medium ${
                summaryLength === 'medium'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              보통
            </button>
            <button
              type="button"
              onClick={() => onSummaryLengthChange('long')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                summaryLength === 'long'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              상세하게
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">요약 언어</label>
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
          >
            <option value="한국어">한국어</option>
            <option value="English">English</option>
            <option value="日本語">日本語</option>
            <option value="中文">中文</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
      >
        <Search className="w-5 h-5 mr-2" />
        영상 요약하기
      </button>
    </form>
  );
} 
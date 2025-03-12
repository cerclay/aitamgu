'use client';

import { Youtube } from 'lucide-react';

export default function LoadingState() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative">
          <Youtube className="w-12 h-12 text-red-500 animate-pulse" />
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">영상 분석 중...</h3>
        <p className="mt-2 text-sm text-gray-500 text-center max-w-md">
          AI가 YouTube 영상을 분석하고 있습니다. 영상 길이에 따라 최대 1분 정도 소요될 수 있습니다.
        </p>
        
        <div className="mt-6 w-full max-w-md">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full animate-progress"></div>
          </div>
          
          <div className="mt-6 space-y-3">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-3 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
            
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-3 py-1">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
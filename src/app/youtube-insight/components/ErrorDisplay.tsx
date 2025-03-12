'use client';

import { AlertTriangle } from 'lucide-react';

interface ErrorDisplayProps {
  message: string;
}

export default function ErrorDisplay({ message }: ErrorDisplayProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-red-100">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-medium text-red-800">오류가 발생했습니다</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
          </div>
          <div className="mt-4">
            <div className="text-sm">
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>올바른 YouTube URL인지 확인해주세요.</li>
                <li>영상이 비공개 또는 제한된 영상이 아닌지 확인해주세요.</li>
                <li>인터넷 연결 상태를 확인해주세요.</li>
                <li>잠시 후 다시 시도해주세요.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
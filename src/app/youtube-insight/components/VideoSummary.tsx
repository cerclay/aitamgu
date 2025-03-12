'use client';

import { useState } from 'react';
import { Share2, Download, Bookmark, Copy, ExternalLink, Clock, ListChecks, Calendar, Eye } from 'lucide-react';

interface SummaryResult {
  title: string;
  channelName: string;
  uploadDate: string;
  viewCount: string;
  summary: string;
  keyPoints: string[];
  timestamps: {
    time: string;
    content: string;
  }[];
}

interface VideoSummaryProps {
  result: SummaryResult;
  videoUrl: string;
}

export default function VideoSummary({ result, videoUrl }: VideoSummaryProps) {
  const [copied, setCopied] = useState(false);
  
  // YouTube 영상 ID 추출
  let videoId = '';
  try {
    if (videoUrl.includes('youtube.com/watch?v=')) {
      const urlParams = new URLSearchParams(new URL(videoUrl).search);
      videoId = urlParams.get('v') || '';
    } else if (videoUrl.includes('youtu.be/')) {
      videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
    }
  } catch (error) {
    console.error('URL 파싱 오류:', error);
  }

  const handleCopyToClipboard = () => {
    const summaryText = `
${result.title}
채널: ${result.channelName}
업로드: ${result.uploadDate}
조회수: ${result.viewCount}

요약:
${result.summary}

주요 포인트:
${result.keyPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

영상 링크: ${videoUrl}
    `;

    navigator.clipboard.writeText(summaryText.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: result.title,
          text: `${result.title} - ${result.summary.substring(0, 100)}...`,
          url: videoUrl
        });
      } catch (error) {
        console.error('공유 오류:', error);
      }
    } else {
      handleCopyToClipboard();
    }
  };

  const getTimestampUrl = (timestamp: string) => {
    if (!videoId) return videoUrl;
    
    // 타임스탬프를 초로 변환
    const parts = timestamp.split(':');
    let seconds = 0;
    
    if (parts.length === 3) { // HH:MM:SS
      seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    } else if (parts.length === 2) { // MM:SS
      seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    
    return `https://www.youtube.com/watch?v=${videoId}&t=${seconds}s`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
      {/* 비디오 정보 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 line-clamp-2">{result.title}</h2>
            <p className="text-gray-600 mt-1">{result.channelName}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-gray-500">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {result.uploadDate}
              </span>
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {result.viewCount}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              원본 영상
            </a>
            <button
              onClick={handleCopyToClipboard}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 relative"
            >
              <Copy className="w-4 h-4 mr-2" />
              복사
              {copied && (
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded">
                  복사됨!
                </span>
              )}
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Share2 className="w-4 h-4 mr-2" />
              공유
            </button>
          </div>
        </div>
      </div>

      {/* 요약 내용 */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-3">
          <Clock className="w-5 h-5 mr-2 text-red-500" />
          요약
        </h3>
        <p className="text-gray-700 whitespace-pre-line">{result.summary}</p>
      </div>

      {/* 주요 포인트 */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-3">
          <ListChecks className="w-5 h-5 mr-2 text-red-500" />
          주요 포인트
        </h3>
        <ul className="space-y-2">
          {result.keyPoints.map((point, index) => (
            <li key={index} className="flex">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-2 text-sm font-medium">
                {index + 1}
              </span>
              <span className="text-gray-700">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 타임스탬프 */}
      {result.timestamps && result.timestamps.length > 0 && (
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-3">
            <Clock className="w-5 h-5 mr-2 text-red-500" />
            타임스탬프
          </h3>
          <div className="space-y-3">
            {result.timestamps.map((timestamp, index) => (
              <a
                key={index}
                href={getTimestampUrl(timestamp.time)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="flex-shrink-0 px-2 py-1 bg-red-100 text-red-600 rounded font-mono text-sm mr-3">
                  {timestamp.time}
                </span>
                <span className="text-gray-700">{timestamp.content}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 
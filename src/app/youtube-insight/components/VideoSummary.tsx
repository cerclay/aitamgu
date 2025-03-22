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
    <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-6 border border-gray-100">
      {/* YouTube 썸네일 추가 */}
      {videoId && (
        <div className="relative">
          <div className="w-full aspect-video bg-black">
            <img 
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} 
              alt={result.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // maxresdefault가 없는 경우 hqdefault로 대체
                (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
              }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
            <div className="p-4 md:p-6 w-full">
              <a 
                href={videoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-red-200 transition-colors"
              >
                <h2 className="text-xl md:text-2xl font-bold line-clamp-2 drop-shadow-md">{result.title}</h2>
                <p className="text-gray-200 mt-1 flex items-center">
                  <span className="mr-2">🎬</span>
                  {result.channelName}
                </p>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 비디오 정보 헤더 */}
      <div className="p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-white flex flex-wrap justify-between items-center gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
          <span className="flex items-center bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
            <Calendar className="w-4 h-4 mr-2 text-red-500" />
            {result.uploadDate}
          </span>
          <span className="flex items-center bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
            <Eye className="w-4 h-4 mr-2 text-red-500" />
            {result.viewCount}
          </span>
        </div>
        
        <div className="flex space-x-2">
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            원본 영상
          </a>
          <button
            onClick={handleCopyToClipboard}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 relative transition-colors"
          >
            <Copy className="w-4 h-4 mr-2 text-red-500" />
            복사
            {copied && (
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded">
                복사됨!
              </span>
            )}
          </button>
          <button
            onClick={handleShare}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <Share2 className="w-4 h-4 mr-2 text-red-500" />
            공유
          </button>
        </div>
      </div>

      {/* 요약 내용 */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-3">
          <Clock className="w-5 h-5 mr-2 text-red-600" />
          요약
        </h3>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">{result.summary}</p>
        </div>
      </div>

      {/* 주요 포인트 */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-3">
          <ListChecks className="w-5 h-5 mr-2 text-red-600" />
          주요 포인트
        </h3>
        <ul className="space-y-3">
          {result.keyPoints.map((point, index) => (
            <li key={index} className="flex items-start bg-white p-3 rounded-lg shadow-sm">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-3 text-sm font-medium">
                {index + 1}
              </span>
              <span className="text-gray-700">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 타임스탬프 */}
      {result.timestamps && result.timestamps.length > 0 && (
        <div className="p-6 bg-red-50">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
            <Clock className="w-5 h-5 mr-2 text-red-600" />
            중요 타임스탬프
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.timestamps.map((timestamp, index) => (
              <a
                key={index}
                href={getTimestampUrl(timestamp.time)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start p-4 rounded-lg bg-white shadow-sm hover:bg-red-100 hover:shadow-md transition-all border border-red-100 relative"
              >
                <div className="absolute top-2 right-2 text-xs text-gray-400 group-hover:text-red-500">유튜브로 이동 ↗</div>
                <div className="flex-shrink-0 flex flex-col items-center mr-4">
                  <span className="px-3 py-2 bg-red-100 text-red-600 rounded-lg font-mono text-sm font-bold border border-red-200 group-hover:bg-red-600 group-hover:text-white group-hover:shadow-md transition-colors">
                    {timestamp.time}
                  </span>
                  <div className="w-0.5 h-full bg-red-200 my-1"></div>
                </div>
                <div>
                  <span className="text-gray-700 font-medium group-hover:text-red-900 transition-colors">{timestamp.content}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 
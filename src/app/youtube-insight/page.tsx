'use client';

import { useState } from 'react';
import { ArrowLeft, Clock, Share2, Download, Bookmark, Copy } from 'lucide-react';
import Link from 'next/link';
import { GoogleGenerativeAI } from '@google/generative-ai';
import YouTubeUrlForm from './components/YouTubeUrlForm';
import VideoSummary from './components/VideoSummary';
import LoadingState from './components/LoadingState';
import ErrorDisplay from './components/ErrorDisplay';

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

// YouTube API 키
const YOUTUBE_API_KEY = 'AIzaSyDiyeeFnh1ewkDcSg_7jceQ23JHxBOaxhs'; // 실제 프로젝트에서는 환경 변수로 관리해야 합니다

export default function YouTubeInsight() {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [language, setLanguage] = useState<string>('한국어');

  // YouTube 영상 ID 추출 함수
  const extractVideoId = (youtubeUrl: string): string | null => {
    let videoId = null;
    
    try {
      // youtube.com/watch?v=VIDEO_ID 형식
      if (youtubeUrl.includes('youtube.com/watch')) {
        const urlObj = new URL(youtubeUrl);
        videoId = urlObj.searchParams.get('v');
      } 
      // youtu.be/VIDEO_ID 형식
      else if (youtubeUrl.includes('youtu.be')) {
        const urlParts = youtubeUrl.split('/');
        videoId = urlParts[urlParts.length - 1].split('?')[0];
      }
    } catch (error) {
      console.error('URL 파싱 오류:', error);
    }
    
    return videoId;
  };

  // YouTube API를 통해 영상 정보 가져오기
  const fetchVideoInfo = async (videoId: string) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('YouTube API 요청 실패');
      }
      
      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        throw new Error('영상 정보를 찾을 수 없습니다');
      }
      
      const videoInfo = data.items[0];
      const snippet = videoInfo.snippet;
      const statistics = videoInfo.statistics;
      
      return {
        title: snippet.title,
        channelName: snippet.channelTitle,
        uploadDate: new Date(snippet.publishedAt).toLocaleDateString(),
        viewCount: parseInt(statistics.viewCount).toLocaleString() + '회',
        description: snippet.description
      };
    } catch (error) {
      console.error('YouTube API 오류:', error);
      throw error;
    }
  };

  // 자막 가져오기 (실제로는 YouTube API의 captions 엔드포인트를 사용해야 함)
  // 현재는 Gemini API로 대체
  const fetchTranscript = async (videoId: string) => {
    // 실제 구현에서는 YouTube API의 captions 엔드포인트를 사용
    // 현재는 더미 데이터 반환
    return "영상의 자막을 가져올 수 없습니다. Gemini API를 통해 영상을 분석합니다.";
  };

  const handleUrlSubmit = async (youtubeUrl: string) => {
    if (!youtubeUrl) {
      setError('YouTube URL을 입력해주세요.');
      return;
    }

    // YouTube URL 유효성 검사
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    if (!youtubeRegex.test(youtubeUrl)) {
      setError('유효한 YouTube URL이 아닙니다.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setUrl(youtubeUrl);

    try {
      // YouTube 영상 ID 추출
      const videoId = extractVideoId(youtubeUrl);
      
      if (!videoId) {
        throw new Error('YouTube 영상 ID를 추출할 수 없습니다.');
      }

      // YouTube API를 통해 영상 정보 가져오기
      const videoInfo = await fetchVideoInfo(videoId);
      
      // 자막 가져오기 (실제로는 YouTube API의 captions 엔드포인트를 사용해야 함)
      const transcript = await fetchTranscript(videoId);

      // Gemini API를 사용하여 영상 요약
      const genAI = new GoogleGenerativeAI('AIzaSyDiyeeFnh1ewkDcSg_7jceQ23JHxBOaxhs');
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const summaryLengthText = 
        summaryLength === 'short' ? '간략하게 (3-4문장)' : 
        summaryLength === 'medium' ? '보통 길이로 (5-7문장)' : 
        '상세하게 (8-10문장)';

      const prompt = `다음 YouTube 영상을 요약해주세요: ${youtubeUrl}
      
영상 제목: ${videoInfo.title}
채널명: ${videoInfo.channelName}
업로드 날짜: ${videoInfo.uploadDate}
조회수: ${videoInfo.viewCount}
영상 설명: ${videoInfo.description}

위 정보를 바탕으로 ${language}로 다음 정보를 JSON 형식으로 제공해주세요:

1. 영상 내용 요약 (${summaryLengthText})
2. 주요 포인트 (5-7개의 중요 내용)
3. 타임스탬프 (주요 내용이 언급된 시간과 해당 내용)

응답은 다음 JSON 형식으로 제공해주세요:
{
  "summary": "영상 내용 요약",
  "keyPoints": ["주요 포인트 1", "주요 포인트 2", "주요 포인트 3", ...],
  "timestamps": [
    {"time": "00:00", "content": "내용 설명"},
    {"time": "01:23", "content": "내용 설명"},
    ...
  ]
}

영상을 직접 볼 수 없는 경우, 제공된 정보를 바탕으로 최대한 정확하게 요약해주세요.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        // JSON 추출 시도
        let jsonData;
        
        // 정규식으로 JSON 추출
        const jsonMatch = text.match(/{[\s\S]*}/);
        if (jsonMatch) {
          jsonData = JSON.parse(jsonMatch[0]);
        }
        
        // JSON이 추출되지 않은 경우
        if (!jsonData) {
          throw new Error('응답에서 JSON 데이터를 추출할 수 없습니다.');
        }
        
        // 최종 결과 생성
        const finalResult: SummaryResult = {
          title: videoInfo.title,
          channelName: videoInfo.channelName,
          uploadDate: videoInfo.uploadDate,
          viewCount: videoInfo.viewCount,
          summary: jsonData.summary,
          keyPoints: jsonData.keyPoints || [],
          timestamps: jsonData.timestamps || []
        };
        
        setResult(finalResult);
      } catch (parseError) {
        console.error('JSON 파싱 에러:', parseError);
        setError(parseError instanceof Error ? parseError.message : '응답 데이터를 처리하는 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('요약 생성 오류:', err);
      setError(err instanceof Error ? err.message : '영상 요약 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span>홈으로</span>
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
            유튜브 인사이트
          </h1>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-red-500" />
            YouTube 영상 요약
          </h2>
          
          <p className="text-gray-600 mb-6">
            YouTube 영상 URL을 입력하면 AI가 영상의 주요 내용을 요약해드립니다. 
            긴 영상도 핵심만 빠르게 파악하세요!
          </p>
          
          <YouTubeUrlForm 
            onSubmit={handleUrlSubmit} 
            summaryLength={summaryLength}
            onSummaryLengthChange={setSummaryLength}
            language={language}
            onLanguageChange={setLanguage}
          />
        </div>

        {/* 로딩 상태 */}
        {loading && <LoadingState />}

        {/* 에러 메시지 */}
        {error && <ErrorDisplay message={error} />}

        {/* 결과 표시 */}
        {result && !loading && <VideoSummary result={result} videoUrl={url} />}
      </div>
    </div>
  );
} 
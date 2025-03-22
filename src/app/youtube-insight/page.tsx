'use client';

import { useState } from 'react';
import { ArrowLeft, Clock, Share2, Download, Bookmark, Copy } from 'lucide-react';
import Link from 'next/link';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractVideoId, fetchVideoInfo, formatDuration, formatViewCount, formatPublishedDate } from './api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

// Gemini API 키 설정
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyC_Woxwt323fN5CRAHbGRrzAp10bGZMA_4';

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

export default function YouTubeInsight() {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [language, setLanguage] = useState<string>('한국어');
  const { toast } = useToast();

  const handleUrlSubmit = async () => {
    if (!url) {
      setError('YouTube URL을 입력해주세요.');
      return;
    }

    // YouTube URL 유효성 검사
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    if (!youtubeRegex.test(url)) {
      setError('유효한 YouTube URL이 아닙니다.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // YouTube 영상 ID 추출
      const videoId = extractVideoId(url);
      
      if (!videoId) {
        throw new Error('YouTube 영상 ID를 추출할 수 없습니다.');
      }

      // YouTube API를 통해 영상 정보 가져오기
      const videoInfo = await fetchVideoInfo(videoId);
      
      // API 키가 없거나 기본값인 경우 모의 데이터 생성
      if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('YOUR_') || GEMINI_API_KEY.trim() === '') {
        console.error('Gemini API 키가 올바르게 설정되지 않았습니다.');
        
        // 모의 데이터 생성 및 반환
        const mockResult: SummaryResult = {
          title: videoInfo.snippet.title,
          channelName: videoInfo.snippet.channelTitle,
          uploadDate: formatPublishedDate(videoInfo.snippet.publishedAt),
          viewCount: formatViewCount(videoInfo.statistics.viewCount) + '회',
          summary: `이 영상은 "${videoInfo.snippet.title}"에 관한 내용을 다루고 있습니다. 현재 Gemini API 키가 설정되지 않아 상세 요약을 제공할 수 없습니다. 실제 요약을 보려면 Gemini API 키를 설정해주세요.\n\n설정 방법:\n1. Google AI Studio(https://makersuite.google.com/)에서 API 키를 생성하세요.\n2. 생성한 API 키를 환경변수(NEXT_PUBLIC_GEMINI_API_KEY)에 설정하세요.\n3. 앱을 재시작한 후 다시 시도해주세요.`,
          keyPoints: [
            "Gemini API 키가 설정되지 않아 상세 요약을 제공할 수 없습니다.",
            "실제 요약을 보려면 Gemini API 키를 설정해주세요.",
            "Google AI Studio에서 무료로 API 키를 생성할 수 있습니다.",
            "영상 제목: " + videoInfo.snippet.title,
            "채널명: " + videoInfo.snippet.channelTitle,
            "업로드 날짜: " + formatPublishedDate(videoInfo.snippet.publishedAt),
            "조회수: " + formatViewCount(videoInfo.statistics.viewCount) + '회'
          ],
          timestamps: [
            { time: "00:00", content: "영상 시작" },
            { time: "00:30", content: "주요 내용 소개" },
            { time: "01:00", content: "세부 내용 설명" }
          ]
        };
        
        setResult(mockResult);
        setLoading(false);
        toast({
          title: '모의 요약 생성',
          description: 'Gemini API 키가 설정되지 않아 모의 요약 데이터를 생성했습니다.',
        });
        return;
      }

      console.log('API 키 상태: 유효함');
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const summaryLengthText = 
        summaryLength === 'short' ? '간략하게 (3-4문장)' : 
        summaryLength === 'medium' ? '보통 길이로 (5-7문장)' : 
        '상세하게 (8-10문장)';

      const prompt = `다음 YouTube 영상을 요약해주세요: ${url}
      
영상 제목: ${videoInfo.snippet.title}
채널명: ${videoInfo.snippet.channelTitle}
업로드 날짜: ${formatPublishedDate(videoInfo.snippet.publishedAt)}
조회수: ${formatViewCount(videoInfo.statistics.viewCount)}회
영상 설명: ${videoInfo.snippet.description}

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
          title: videoInfo.snippet.title,
          channelName: videoInfo.snippet.channelTitle,
          uploadDate: formatPublishedDate(videoInfo.snippet.publishedAt),
          viewCount: formatViewCount(videoInfo.statistics.viewCount) + '회',
          summary: jsonData.summary,
          keyPoints: jsonData.keyPoints || [],
          timestamps: jsonData.timestamps || []
        };
        
        setResult(finalResult);
        toast({
          title: '요약 완료',
          description: '영상 요약이 완료되었습니다.',
        });
      } catch (parseError) {
        console.error('JSON 파싱 에러:', parseError);
        setError(parseError instanceof Error ? parseError.message : '응답 데이터를 처리하는 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('요약 생성 오류:', err);
      setError(err instanceof Error ? err.message : '영상 요약 중 오류가 발생했습니다. 다시 시도해주세요.');
      toast({
        title: '오류 발생',
        description: '영상 요약 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
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
          
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label htmlFor="youtube-url" className="text-sm font-medium text-gray-700">
                YouTube URL
              </label>
              <div className="flex gap-2">
                <Input
                  id="youtube-url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleUrlSubmit}
                  disabled={loading}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {loading ? '요약 중...' : '요약하기'}
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-700">요약 길이</label>
                <div className="flex gap-2">
                  <Button
                    variant={summaryLength === 'short' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSummaryLength('short')}
                  >
                    짧게
                  </Button>
                  <Button
                    variant={summaryLength === 'medium' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSummaryLength('medium')}
                  >
                    보통
                  </Button>
                  <Button
                    variant={summaryLength === 'long' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSummaryLength('long')}
                  >
                    길게
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-700">언어</label>
                <div className="flex gap-2">
                  <Button
                    variant={language === '한국어' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLanguage('한국어')}
                  >
                    한국어
                  </Button>
                  <Button
                    variant={language === '영어' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLanguage('영어')}
                  >
                    영어
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">영상을 분석하고 요약하는 중입니다...</p>
              <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요.</p>
            </div>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">오류가 발생했습니다</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 결과 표시 */}
        {result && !loading && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{result.title}</CardTitle>
                    <CardDescription>{result.channelName} • {result.uploadDate} • {result.viewCount}</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="icon" title="공유하기">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" title="저장하기">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" title="복사하기">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">요약</h3>
                  <p className="text-gray-700">{result.summary}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">주요 포인트</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {result.keyPoints.map((point, index) => (
                      <li key={index} className="text-gray-700">{point}</li>
                    ))}
                  </ul>
                </div>
                
                {result.timestamps.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">타임스탬프</h3>
                    <div className="space-y-2">
                      {result.timestamps.map((timestamp, index) => (
                        <div key={index} className="flex">
                          <div className="bg-gray-100 text-gray-700 font-mono px-2 py-1 rounded mr-3 w-16 text-center">
                            {timestamp.time}
                          </div>
                          <div className="text-gray-700">{timestamp.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-red-500 hover:bg-red-600"
                  onClick={() => window.open(url, '_blank')}
                >
                  YouTube에서 영상 보기
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 
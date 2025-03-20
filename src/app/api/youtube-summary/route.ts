import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { callExternalApi } from '@/lib/api-helper';
import { getSubtitles } from 'youtube-captions-scraper';
import { OpenAI } from 'openai';

const youtube = google.youtube('v3');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');
  
  if (!videoId) {
    return NextResponse.json(
      { error: '비디오 ID가 제공되지 않았습니다.' },
      { status: 400 }
    );
  }
  
  try {
    const videoData = await callExternalApi(
      'YOUTUBE',
      async (apiKey) => {
        // YouTube API를 사용하여 비디오 정보 가져오기
        const videoResponse = await youtube.videos.list({
          key: apiKey,
          part: ['snippet', 'contentDetails', 'statistics'],
          id: [videoId]
        });
        
        if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
          throw new Error('비디오를 찾을 수 없습니다.');
        }
        
        const video = videoResponse.data.items[0];
        const title = video.snippet?.title || '';
        const description = video.snippet?.description || '';
        const channelTitle = video.snippet?.channelTitle || '';
        const publishedAt = video.snippet?.publishedAt || '';
        const viewCount = video.statistics?.viewCount || '0';
        const likeCount = video.statistics?.likeCount || '0';
        
        // 자막 가져오기
        let subtitles = [];
        try {
          subtitles = await getSubtitles({ videoID: videoId });
        } catch (error) {
          console.warn('자막을 가져오는 데 실패했습니다:', error);
        }
        
        // 자막 텍스트 추출
        const transcriptText = subtitles
          .map(item => item.text)
          .join(' ')
          .substring(0, 15000); // 길이 제한
        
        // OpenAI API를 사용하여 요약
        let summary = '';
        if (transcriptText) {
          const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: '당신은 유튜브 영상 내용을 간결하고 정확하게 요약하는 도우미입니다. 한국어로 응답해주세요.'
              },
              {
                role: 'user',
                content: `다음 유튜브 영상의 자막 내용을 3~5개의 주요 포인트로 요약해주세요. 제목: ${title}\n\n자막: ${transcriptText}`
              }
            ],
            max_tokens: 500
          });
          
          summary = completion.choices[0].message.content || '';
        } else {
          summary = '이 영상에 대한 자막이 없어 요약할 수 없습니다.';
        }
        
        return {
          videoId,
          title,
          description,
          channelTitle,
          publishedAt,
          viewCount,
          likeCount,
          summary
        };
      },
      async () => {
        // API 키가 없거나 호출 실패 시 대체 함수
        // OpenAI를 사용하여 제목만 가지고 가상 요약 생성
        try {
          // 비디오 제목 가져오기 (API 키 없이)
          const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
          const data = await response.json();
          const title = data.title || 'Unknown Title';
          
          // 제목으로 가상의 요약 생성
          const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: '당신은 유튜브 영상 제목만 보고 가능한 내용을 추측하여 요약하는 도우미입니다. 한국어로 응답해주세요.'
              },
              {
                role: 'user',
                content: `다음 유튜브 영상의 제목만 보고 가능한 내용을 추측하여 가상의 요약을 작성해주세요. 이는 실제 내용이 아닌 추측임을 명시해주세요. 제목: ${title}`
              }
            ],
            max_tokens: 500
          });
          
          const summary = completion.choices[0].message.content || '';
          
          return {
            videoId,
            title,
            description: '설명을 가져올 수 없습니다.',
            channelTitle: data.author_name || 'Unknown Channel',
            publishedAt: '날짜 정보를 가져올 수 없습니다.',
            viewCount: '조회수 정보를 가져올 수 없습니다.',
            likeCount: '좋아요 정보를 가져올 수 없습니다.',
            summary: `*주의: 이 요약은 YouTube API 키가 없어 실제 영상 내용 분석이 아닌 제목 기반 추측입니다.*\n\n${summary}`
          };
        } catch (error) {
          console.error('대체 요약 생성 오류:', error);
          return {
            videoId,
            title: 'YouTube 영상 정보를 가져올 수 없습니다',
            description: '',
            channelTitle: '',
            publishedAt: '',
            viewCount: '',
            likeCount: '',
            summary: 'YouTube API 키가 설정되지 않아 실제 영상 내용을 확인할 수 없습니다. API 키를 설정하고 다시 시도해주세요.'
          };
        }
      }
    );
    
    return NextResponse.json(videoData);
  } catch (error) {
    console.error('YouTube 요약 오류:', error);
    return NextResponse.json(
      { error: '영상 요약 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
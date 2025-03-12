'use client';

// YouTube 영상 ID 추출 함수
export function extractVideoId(url: string): string | null {
  // 정규식 패턴
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/watch\?.*&v=)([^#&?]*).*/,
    /(?:youtube\.com\/shorts\/)([^#&?]*).*/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// YouTube 영상 정보 가져오기
export async function fetchVideoInfo(videoId: string) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    
    if (!apiKey) {
      throw new Error('YouTube API 키가 설정되지 않았습니다.');
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails,statistics`
    );

    if (!response.ok) {
      throw new Error('YouTube API 요청 실패');
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      throw new Error('영상을 찾을 수 없습니다.');
    }

    return data.items[0];
  } catch (error) {
    console.error('YouTube 영상 정보 가져오기 실패:', error);
    throw error;
  }
}

// 영상 길이(PT형식)를 초 단위로 변환
export function convertDurationToSeconds(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

// 초 단위를 시:분:초 형식으로 변환
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

// 조회수 포맷팅
export function formatViewCount(viewCount: string): string {
  const count = parseInt(viewCount, 10);
  
  if (count >= 1000000000) {
    return `${(count / 1000000000).toFixed(1)}B`;
  } else if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  } else {
    return count.toString();
  }
}

// 날짜 포맷팅
export function formatPublishedDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// 영상 요약 생성
export async function generateVideoSummary(videoInfo: any) {
  try {
    // 실제 구현에서는 AI 모델 API를 호출하여 요약 생성
    // 현재는 목업 데이터 반환
    const title = videoInfo.snippet.title;
    const description = videoInfo.snippet.description;
    
    // 요약 생성 지연 시간 (실제 API 호출 시뮬레이션)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      summary: `이 영상은 "${title}"에 관한 내용을 다루고 있습니다. 주요 내용으로는 ${description.slice(0, 100)}... 등이 포함되어 있습니다.`,
      keyPoints: [
        "영상의 첫 번째 핵심 포인트",
        "영상의 두 번째 핵심 포인트",
        "영상의 세 번째 핵심 포인트",
        "영상의 네 번째 핵심 포인트"
      ],
      topics: [
        "주제 1",
        "주제 2",
        "주제 3"
      ],
      sentiment: "긍정적",
      recommendedVideos: [
        {
          id: "dQw4w9WgXcQ",
          title: "관련 영상 1",
          thumbnail: "https://picsum.photos/200/112"
        },
        {
          id: "dQw4w9WgXcQ",
          title: "관련 영상 2",
          thumbnail: "https://picsum.photos/200/112"
        }
      ]
    };
  } catch (error) {
    console.error('영상 요약 생성 실패:', error);
    throw error;
  }
} 
export async function analyzePalm(imageUrl: string) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('Gemini API 키가 설정되지 않았습니다.');
      throw new Error('API 키가 없습니다');
    }
    
    const response = await fetch('/api/analyze-palm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        imageUrl,
        apiKey
      }),
    });
    
    if (!response.ok) {
      throw new Error('손금 분석 API 호출 실패');
    }
    
    return await response.json();
  } catch (error) {
    console.error('손금 분석 오류:', error);
    throw error;
  }
} 
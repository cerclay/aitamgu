// 서버 컴포넌트
import StockDetails from '@/components/StockDetails';

export default async function StockPage({ params }) {
  const { symbol } = params;
  
  // 초기 정적 데이터 가져오기 (선택 사항)
  let initialData = null;
  try {
    // API 라우트를 직접 호출하는 대신 서버 함수를 사용
    // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/yahoo-finance?symbol=${symbol}`);
    // initialData = await res.json();
  } catch (error) {
    console.error('Error prefetching data:', error);
  }
  
  return (
    <div>
      <h1>주식 정보: {symbol}</h1>
      <StockDetails symbol={symbol} initialData={initialData} />
    </div>
  );
} 
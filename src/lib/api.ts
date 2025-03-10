const WEATHER_API_KEY = 'd0MtqYf6BcL3qZcyjiOj%2BNDT4MXxgkYs7uaidp4KKIOEJj4srjAFAQpoELiiXWq1T1IGoCnoVpx376gM0JBUvg%3D%3D';
const WEATHER_API_BASE_URL = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';
const KAKAO_REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;

// 위경도를 기상청 좌표로 변환
function convertToGrid(lat: number, lon: number) {
  const RE = 6371.00877; // 지구 반경(km)
  const GRID = 5.0; // 격자 간격(km)
  const SLAT1 = 30.0; // 투영 위도1(degree)
  const SLAT2 = 60.0; // 투영 위도2(degree)
  const OLON = 126.0; // 기준점 경도(degree)
  const OLAT = 38.0; // 기준점 위도(degree)
  const XO = 43; // 기준점 X좌표(GRID)
  const YO = 136; // 기준점 Y좌표(GRID)

  const DEGRAD = Math.PI / 180.0;
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = re * sf / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + (lat) * DEGRAD * 0.5);
  ra = re * sf / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  let x = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  let y = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

  return { x, y };
}

// 현재 시간 기준으로 가장 가까운 예보 시간 구하기
function getBaseTime() {
  const now = new Date();
  const hour = now.getHours();
  const minutes = now.getMinutes();

  // 매 시간 45분에 다음 시간의 날씨 예보가 발표됨
  if (minutes < 45) {
    // 이전 시간의 예보를 사용
    const baseHour = (hour - 1 + 24) % 24;
    return `${String(baseHour).padStart(2, '0')}00`;
  } else {
    return `${String(hour).padStart(2, '0')}00`;
  }
}

// 날씨 정보 가져오기
export async function getWeatherInfo(lat: number, lon: number) {
  try {
    const grid = convertToGrid(lat, lon);
    const today = new Date();
    const baseDate = today.toISOString().slice(0, 10).replace(/-/g, '');
    const baseTime = getBaseTime();

    const url = `${WEATHER_API_BASE_URL}/getVilageFcst?serviceKey=${WEATHER_API_KEY}&numOfRows=10&pageNo=1&base_date=${baseDate}&base_time=${baseTime}&nx=${grid.x}&ny=${grid.y}&dataType=JSON`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.response.header.resultCode !== '00') {
      throw new Error(data.response.header.resultMsg);
    }

    const items = data.response.body.items.item;
    const weatherItem = items.find((item: any) => item.category === 'PTY' || item.category === 'SKY');

    // PTY(강수형태): 없음(0), 비(1), 비/눈(2), 눈(3), 소나기(4)
    // SKY(하늘상태): 맑음(1), 구름많음(3), 흐림(4)
    let weather = '맑음';
    if (weatherItem) {
      if (weatherItem.category === 'PTY') {
        switch (weatherItem.fcstValue) {
          case '1':
          case '4':
            weather = '비';
            break;
          case '2':
            weather = '비/눈';
            break;
          case '3':
            weather = '눈';
            break;
        }
      } else if (weatherItem.category === 'SKY' && weather === '맑음') {
        switch (weatherItem.fcstValue) {
          case '3':
            weather = '구름많음';
            break;
          case '4':
            weather = '흐림';
            break;
        }
      }
    }

    return weather;
  } catch (error) {
    console.error('날씨 정보 조회 실패:', error);
    return '맑음'; // 기본값
  }
}

// 주소로 위경도 변환
export async function getCoordinates(address: string) {
  try {
    const response = await fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`, {
      headers: {
        'Authorization': `KakaoAK ${KAKAO_REST_API_KEY}`
      }
    });
    const data = await response.json();
    
    if (data.documents && data.documents.length > 0) {
      const { x, y } = data.documents[0];
      return { longitude: parseFloat(x), latitude: parseFloat(y) };
    }
    throw new Error('주소를 찾을 수 없습니다.');
  } catch (error) {
    console.error('좌표 변환 실패:', error);
    return null;
  }
}

// 주변 식당 검색
export async function searchNearbyRestaurants(latitude: number, longitude: number, category: string, radius: number = 1000) {
  try {
    const query = `${category} 맛집`;
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&x=${longitude}&y=${latitude}&radius=${radius}&category_group_code=FD6&sort=distance`,
      {
        headers: {
          'Authorization': `KakaoAK ${KAKAO_REST_API_KEY}`
        }
      }
    );
    
    const data = await response.json();
    return data.documents.map((doc: any) => ({
      name: doc.place_name,
      address: doc.road_address_name || doc.address_name,
      distance: `${Math.round(doc.distance)}m`,
      rating: '★'.repeat(Math.floor(Math.random() * 2) + 4) + '☆'.repeat(5 - (Math.floor(Math.random() * 2) + 4)), // 임시 별점
      url: doc.place_url
    }));
  } catch (error) {
    console.error('식당 검색 실패:', error);
    return [];
  }
} 
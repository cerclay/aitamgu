'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, MapPin, CloudRain, Sun, ThermometerSun, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useToast } from "@/components/ui/use-toast";
import { getWeatherInfo, getCoordinates, searchNearbyRestaurants } from '@/lib/api';
import RouletteWheel from '@/components/RouletteWheel';

// Google Gemini API 키
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

export default function LunchRecommendation() {
  const { toast } = useToast();
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const copyEmail = () => {
    navigator.clipboard.writeText('cerclay92@gmail.com');
    toast({
      description: "이메일 주소가 복사되었습니다.",
      duration: 2000,
    });
  };

  // 음식 스타일 옵션
  const foodStyleOptions = [
    { value: '한식', label: '한식 🍚', description: '정성이 담긴 한국 전통 음식' },
    { value: '중식', label: '중식 🥢', description: '다양한 맛과 향의 중국 요리' },
    { value: '양식', label: '양식 🍝', description: '풍부한 맛의 서양 요리' },
    { value: '동남아', label: '동남아 🌶️', description: '이국적인 향신료의 매력' },
    { value: '상관없음', label: '상관없음 🍴', description: '어떤 스타일이든 좋아요' }
  ];
  
  // 상태 관리
  const [step, setStep] = useState<'options' | 'loading' | 'result'>('options');
  const [mood, setMood] = useState<string>('');
  const [priceRange, setPriceRange] = useState<string>('');
  const [foodStyle, setFoodStyle] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [weather, setWeather] = useState<string>('');
  const [recommendation, setRecommendation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // 룰렛 관련 상태 추가
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [selectedMenuIndex, setSelectedMenuIndex] = useState<number>(0);
  
  // 위치 정보 가져오기
  useEffect(() => {
    const getLocationAndWeather = async () => {
      if (!navigator.geolocation) {
        toast({
          description: "위치 정보를 지원하지 않는 브라우저입니다.",
          variant: "destructive",
        });
        setLocation('서울 강남구');
        setWeather('맑음');
        setUserCoords({ latitude: 37.498095, longitude: 127.027610 });
        return;
      }

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });

        const { latitude, longitude } = position.coords;
        setUserCoords({ latitude, longitude });
        
        // 날씨 정보 가져오기
        try {
          const weatherInfo = await getWeatherInfo(latitude, longitude);
          setWeather(weatherInfo);
        } catch (error) {
          console.error('날씨 정보 조회 실패:', error);
          setWeather('맑음');
        }

        // HTML5 Geolocation API로 받은 좌표로 주소 변환
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'ko'
              }
            }
          );
          
          if (!response.ok) {
            throw new Error('주소 변환 실패');
          }
          
          const data = await response.json();
          let district = '';
          
          if (data.address) {
            const city = data.address.city || data.address.province || '서울';
            const town = data.address.town || data.address.suburb || data.address.district || '강남구';
            district = `${city} ${town}`;
          } else {
            district = '서울 강남구';
          }
          
          setLocation(district);
        } catch (error) {
          console.error('주소 변환 실패:', error);
          setLocation('서울 강남구');
        }
      } catch (error) {
        console.error('위치 정보 처리 오류:', error);
        toast({
          description: "위치 정보를 가져오는데 실패했습니다. 기본 위치로 설정합니다.",
          variant: "destructive",
        });
        setLocation('서울 강남구');
        setWeather('맑음');
        setUserCoords({ latitude: 37.498095, longitude: 127.027610 });
      }
    };

    getLocationAndWeather();
  }, [toast]);
  
  // 기분 옵션
  const moodOptions = [
    { value: '행복함', label: '행복함 😊', description: '기분 좋은 날엔 특별한 음식으로!' },
    { value: '피곤함', label: '피곤함 😴', description: '에너지가 필요한 날엔 든든한 음식을!' },
    { value: '스트레스높음', label: '스트레스 😫', description: '스트레스 해소에 좋은 음식을 추천해 드려요.' },
    { value: '우울함', label: '우울함 😔', description: '기분 전환에 도움이 되는 음식을 찾아보세요.' },
    { value: '활력필요', label: '활력 💪', description: '활력을 되찾는데 도움이 되는 음식을 추천해 드려요.' },
    { value: '보통', label: '보통 🤔', description: '기분에 상관없이 맛있는 음식을 추천해 드려요.' }
  ];
  
  // 가격대 옵션
  const priceOptions = [
    { value: '저렴한', label: '저렴한 💰' },
    { value: '보통', label: '보통 💰' },
    { value: '비싼', label: '비싼 💰' },
    { value: '상관없음', label: '상관없음 💰' }
  ];
  
  // 음식 옵션 (기본 데이터)
  const foodOptions = [
    // 한식
    { name: '비빔밥', image: '🍚', category: '한식', calories: 600, price: '8,000원' },
    { name: '김치찌개', image: '🍲', category: '한식', calories: 500, price: '7,000원' },
    { name: '된장찌개', image: '🥘', category: '한식', calories: 450, price: '7,000원' },
    { name: '삼겹살', image: '🥓', category: '한식', calories: 800, price: '15,000원' },
    { name: '불고기', image: '🥩', category: '한식', calories: 650, price: '12,000원' },
    { name: '갈비탕', image: '🍖', category: '한식', calories: 550, price: '10,000원' },
    { name: '냉면', image: '🍜', category: '한식', calories: 480, price: '9,000원' },
    { name: '떡볶이', image: '🍢', category: '한식', calories: 500, price: '5,000원' },
    { name: '순대국', image: '🥣', category: '한식', calories: 600, price: '8,000원' },
    { name: '제육볶음', image: '🥘', category: '한식', calories: 700, price: '9,000원' },
    
    // 중식
    { name: '짜장면', image: '🍜', category: '중식', calories: 650, price: '7,000원' },
    { name: '짬뽕', image: '🍜', category: '중식', calories: 550, price: '8,000원' },
    { name: '탕수육', image: '🍖', category: '중식', calories: 800, price: '15,000원' },
    { name: '마파두부', image: '🍲', category: '중식', calories: 450, price: '10,000원' },
    { name: '양장피', image: '🥗', category: '중식', calories: 500, price: '18,000원' },
    { name: '깐풍기', image: '🍗', category: '중식', calories: 700, price: '16,000원' },
    
    // 양식
    { name: '치킨', image: '🍗', category: '양식', calories: 900, price: '18,000원' },
    { name: '피자', image: '🍕', category: '양식', calories: 1000, price: '20,000원' },
    { name: '햄버거', image: '🍔', category: '양식', calories: 700, price: '8,000원' },
    { name: '파스타', image: '🍝', category: '양식', calories: 650, price: '12,000원' },
    { name: '스테이크', image: '🥩', category: '양식', calories: 800, price: '25,000원' },
    { name: '리조또', image: '🍚', category: '양식', calories: 600, price: '14,000원' },
    { name: '샌드위치', image: '🥪', category: '양식', calories: 450, price: '6,000원' },
    
    // 일식
    { name: '초밥', image: '🍣', category: '일식', calories: 500, price: '15,000원' },
    { name: '라멘', image: '🍜', category: '일식', calories: 550, price: '9,000원' },
    { name: '돈카츠', image: '🍖', category: '일식', calories: 700, price: '12,000원' },
    { name: '우동', image: '🍜', category: '일식', calories: 450, price: '8,000원' },
    
    // 동남아
    { name: '쌀국수', image: '🍜', category: '동남아', calories: 500, price: '9,000원' },
    { name: '팟타이', image: '🍝', category: '동남아', calories: 550, price: '10,000원' },
    { name: '나시고랭', image: '🍚', category: '동남아', calories: 600, price: '11,000원' },
    { name: '똠양꿍', image: '🍲', category: '동남아', calories: 450, price: '12,000원' },
    { name: '분짜', image: '🥗', category: '동남아', calories: 480, price: '11,000원' },
    
    // 기타
    { name: '샐러드', image: '🥗', category: '다이어트', calories: 300, price: '10,000원' }
  ];

  // 점심 메뉴 20가지 옵션
  const lunchOptions = [
    { name: '김치찌개', category: '한식', calories: 500, price: '8,000원' },
    { name: '된장찌개', category: '한식', calories: 450, price: '8,000원' },
    { name: '비빔밥', category: '한식', calories: 600, price: '9,000원' },
    { name: '삼겹살', category: '한식', calories: 800, price: '15,000원' },
    { name: '짜장면', category: '중식', calories: 650, price: '7,000원' },
    { name: '짬뽕', category: '중식', calories: 550, price: '8,000원' },
    { name: '마라탕', category: '중식', calories: 700, price: '12,000원' },
    { name: '탕수육', category: '중식', calories: 800, price: '15,000원' },
    { name: '파스타', category: '양식', calories: 650, price: '12,000원' },
    { name: '피자', category: '양식', calories: 900, price: '18,000원' },
    { name: '햄버거', category: '양식', calories: 700, price: '8,000원' },
    { name: '스테이크', category: '양식', calories: 800, price: '25,000원' },
    { name: '초밥', category: '일식', calories: 500, price: '15,000원' },
    { name: '라멘', category: '일식', calories: 550, price: '9,000원' },
    { name: '우동', category: '일식', calories: 450, price: '8,000원' },
    { name: '돈카츠', category: '일식', calories: 700, price: '12,000원' },
    { name: '쌀국수', category: '동남아', calories: 500, price: '9,000원' },
    { name: '팟타이', category: '동남아', calories: 550, price: '10,000원' },
    { name: '나시고랭', category: '동남아', calories: 600, price: '11,000원' },
    { name: '똠양꿍', category: '동남아', calories: 450, price: '12,000원' }
  ];

  // 실제 식당 데이터 (카테고리별)
  const realRestaurants = {
    한식: [
      { name: '봉피양 여의도점', rating: '★★★★☆', address: '서울 영등포구 여의도동' },
      { name: '원조 서울 갈비', rating: '★★★★★', address: '서울 강남구 역삼동' },
      { name: '토속촌 삼계탕', rating: '★★★★☆', address: '서울 종로구 체부동' },
      { name: '명동 교자', rating: '★★★★☆', address: '서울 중구 명동' },
      { name: '을지면옥', rating: '★★★★★', address: '서울 중구 을지로' },
      { name: '평양면옥', rating: '★★★★☆', address: '서울 중구 주교동' },
      { name: '진미 평양냉면', rating: '★★★★☆', address: '서울 강남구 신사동' },
      { name: '강남 명전', rating: '★★★★☆', address: '서울 강남구 역삼동' },
      { name: '한일관', rating: '★★★★★', address: '서울 강남구 신사동' },
      { name: '대감집', rating: '★★★★☆', address: '서울 종로구 관훈동' }
    ],
    중식: [
      { name: '하이디라오', rating: '★★★★★', address: '서울 강남구 역삼동' },
      { name: '진진', rating: '★★★★☆', address: '서울 마포구 서교동' },
      { name: '홍보각', rating: '★★★★☆', address: '서울 중구 을지로' },
      { name: '차이나팩토리', rating: '★★★★☆', address: '서울 강남구 청담동' },
      { name: '금장', rating: '★★★★★', address: '서울 중구 소공동' },
      { name: '동보성', rating: '★★★★☆', address: '서울 중구 명동' },
      { name: '만리장성', rating: '★★★★☆', address: '서울 종로구 종로' },
      { name: '도원', rating: '★★★★★', address: '서울 중구 소공동' }
    ],
    양식: [
      { name: '빌라드샬롯', rating: '★★★★★', address: '서울 강남구 청담동' },
      { name: '테이블 34', rating: '★★★★☆', address: '서울 용산구 이태원동' },
      { name: '보르고 한남', rating: '★★★★★', address: '서울 용산구 한남동' },
      { name: '세스타', rating: '★★★★☆', address: '서울 강남구 신사동' },
      { name: '더그릴', rating: '★★★★★', address: '서울 중구 소공동' },
      { name: '라미띠에', rating: '★★★★☆', address: '서울 강남구 신사동' },
      { name: '비스트로 드 욘트빌', rating: '★★★★☆', address: '서울 용산구 이태원동' },
      { name: '피에르 가니에르 서울', rating: '★★★★★', address: '서울 중구 소공동' }
    ],
    일식: [
      { name: '스시소라', rating: '★★★★★', address: '서울 강남구 청담동' },
      { name: '스시코우지', rating: '★★★★★', address: '서울 강남구 신사동' },
      { name: '스시야', rating: '★★★★☆', address: '서울 강남구 논현동' },
      { name: '기쿠', rating: '★★★★★', address: '서울 강남구 청담동' },
      { name: '스시카나에', rating: '★★★★☆', address: '서울 강남구 청담동' },
      { name: '하쿠', rating: '★★★★☆', address: '서울 강남구 신사동' },
      { name: '이치에', rating: '★★★★★', address: '서울 강남구 청담동' }
    ],
    동남아: [
      { name: '쌀국수 분짜라', rating: '★★★★☆', address: '서울 마포구 서교동' },
      { name: '포보', rating: '★★★★☆', address: '서울 강남구 역삼동' },
      { name: '발리인', rating: '★★★★☆', address: '서울 용산구 이태원동' },
      { name: '롱침', rating: '★★★★☆', address: '서울 마포구 연남동' },
      { name: '싸와디', rating: '★★★★☆', address: '서울 마포구 서교동' },
      { name: '생어거스틴', rating: '★★★★☆', address: '서울 용산구 이태원동' },
      { name: '방콕익스프레스', rating: '★★★★☆', address: '서울 마포구 서교동' }
    ],
    다이어트: [
      { name: '베지그린', rating: '★★★★☆', address: '서울 강남구 역삼동' },
      { name: '샐러디', rating: '★★★★☆', address: '서울 강남구 역삼동' },
      { name: '프레시코드', rating: '★★★★☆', address: '서울 강남구 삼성동' },
      { name: '그리팅', rating: '★★★★☆', address: '서울 강남구 논현동' },
      { name: '슬로우캘리', rating: '★★★★☆', address: '서울 강남구 청담동' }
    ]
  };

  // 실제 식당 정보 가져오기
  const getRestaurantsForFood = async (foodCategory: string) => {
    try {
      if (!userCoords) {
        throw new Error('위치 정보가 없습니다.');
      }

      // 실제 식당 데이터에서 해당 카테고리의 식당 3개를 랜덤하게 선택
      const categoryRestaurants = realRestaurants[foodCategory as keyof typeof realRestaurants] || [];
      const selectedRestaurants = categoryRestaurants
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      // 네이버 플레이스 URL 생성
      const placeUrl = `https://map.naver.com/p/search/${encodeURIComponent(`${location} ${foodCategory} 맛집`)}?c=${userCoords.longitude},${userCoords.latitude},15,0,0,0,dh`;

      // 선택된 식당들에 거리 정보 추가
      const restaurantsWithDistance = selectedRestaurants.map(restaurant => ({
        ...restaurant,
        distance: '1km 이내',
        placeUrl: placeUrl,
        category: foodCategory,
        reviews: Math.floor(Math.random() * 900) + 100
      }));

      return {
        restaurants: restaurantsWithDistance.length > 0 ? restaurantsWithDistance : [{
          name: `${location}의 ${foodCategory} 맛집`,
          rating: '★★★★☆',
          address: location,
          distance: '1km 이내',
          category: foodCategory,
          reviews: 100,
          placeUrl: placeUrl
        }],
        nearbyUrl: placeUrl
      };
    } catch (error) {
      console.error('식당 검색 오류:', error);
      const defaultPlaceUrl = `https://map.naver.com/p/search/${encodeURIComponent(`${location} ${foodCategory} 맛집`)}?c=${userCoords?.longitude || '127.027610'},${userCoords?.latitude || '37.498095'},15,0,0,0,dh`;
      
      return {
        restaurants: [{
          name: `${location}의 ${foodCategory} 맛집`,
          rating: '★★★★☆',
          address: location,
          distance: '1km 이내',
          category: foodCategory,
          reviews: 100,
          placeUrl: defaultPlaceUrl
        }],
        nearbyUrl: defaultPlaceUrl
      };
    }
  };

  // AI 기반 메뉴 추천
  const getAiRecommendation = async () => {
    try {
      if (!mood) {
        setError('기분을 선택해주세요.');
        return;
      }
      
      setIsLoading(true);
      setStep('loading');
      setError('');
      
      // 사용자 선택에 맞는 음식 필터링
      let filteredFoods = [...foodOptions];
      
      if (foodStyle && foodStyle !== '상관없음') {
        filteredFoods = filteredFoods.filter(food => food.category === foodStyle);
        if (filteredFoods.length === 0) filteredFoods = [...foodOptions];
      }
      
      if (priceRange && priceRange !== '상관없음') {
        const priceRanges = {
          '저렴한': [0, 8000],
          '보통': [8000, 15000],
          '비싼': [15000, 100000]
        };
        
        if (priceRanges[priceRange as keyof typeof priceRanges]) {
          const [min, max] = priceRanges[priceRange as keyof typeof priceRanges];
          filteredFoods = filteredFoods.filter(food => {
            const price = parseInt(food.price.replace(/[^0-9]/g, ''));
            return price >= min && price <= max;
          });
          if (filteredFoods.length === 0) filteredFoods = [...foodOptions];
        }
      }
      
      const selectedFood = filteredFoods[Math.floor(Math.random() * filteredFoods.length)];
      
      try {
        const prompt = `
당신은 전문 음식 추천 AI입니다. 다음 상황에 맞는 음식 추천 이유와 건강 팁을 제공해주세요.

현재 상황:
- 현재 기분: ${mood}
- 현재 날씨: ${weather}
- 현재 위치: ${location}
- 선택된 음식: ${selectedFood.name}
- 음식 종류: ${selectedFood.category}
- 칼로리: ${selectedFood.calories}kcal
- 가격: ${selectedFood.price}

위 정보를 바탕으로 다음 형식의 JSON으로 응답해주세요:
{
  "reasonForRecommendation": "현재 기분, 날씨, 위치를 고려한 자세하고 설득력 있는 추천 이유 (200-300자)",
  "healthTip": "해당 음식과 관련된 전문적이고 실용적인 건강 팁 (100-150자)"
}`;

        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': API_KEY,
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 1,
              topP: 1,
              maxOutputTokens: 1000,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          })
        });

        if (!response.ok) {
          throw new Error('Gemini API 호출 실패');
        }

        const data = await response.json();
        let aiResponse;
        
        try {
          const responseText = data.candidates[0].content.parts[0].text.trim();
          console.log('Gemini API 응답:', responseText);
          
          // JSON 부분만 추출하고 파싱
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('JSON 형식이 아닙니다.');
          }
          
          aiResponse = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error('JSON 파싱 오류:', parseError);
          // 파싱 실패 시 기본 응답 사용
          aiResponse = {
            reasonForRecommendation: `${location}의 현재 날씨는 ${weather}이며, 이런 날씨에는 ${selectedFood.name}이(가) 특히 잘 어울립니다.`,
            healthTip: `${selectedFood.name}은(는) ${selectedFood.calories}kcal로, 점심 식사로 적당한 칼로리입니다. 천천히 즐겨보세요!`
          };
        }
        
        // 실제 식당 정보 가져오기
        const result = await getRestaurantsForFood(selectedFood.category);
        
        const recommendationData = {
          mainDish: {
            ...selectedFood,
            description: `${selectedFood.name}은(는) ${selectedFood.category}의 대표적인 메뉴입니다.`
          },
          restaurants: result.restaurants || [],
          nearbyUrl: result.nearbyUrl || '',
          reasonForRecommendation: aiResponse?.reasonForRecommendation || `${location}의 현재 날씨는 ${weather}이며, 이런 날씨에는 ${selectedFood.name}이(가) 특히 잘 어울립니다.`,
          healthTip: aiResponse?.healthTip || `${selectedFood.name}은(는) ${selectedFood.calories}kcal로, 점심 식사로 적당한 칼로리입니다. 천천히 즐겨보세요!`
        };
        
        setRecommendation(recommendationData);
        setStep('result');
      } catch (apiError) {
        console.error('Gemini API 호출 오류:', apiError);
        // API 호출 실패 시 대체 데이터 사용
        const fallbackRecommendation = generateFallbackRecommendation(selectedFood, mood, weather, location);
        setRecommendation({
          ...fallbackRecommendation,
          restaurants: (await getRestaurantsForFood(selectedFood.category)).restaurants || []
        });
        setStep('result');
      }
    } catch (error) {
      console.error('AI 추천 오류:', error);
      setError('AI 추천을 가져오는데 실패했습니다. 다시 시도해주세요.');
      setStep('options');
    } finally {
      setIsLoading(false);
    }
  };

  // 대체 추천 데이터 생성
  const generateFallbackRecommendation = (selectedFood: any, mood: string, weather: string, location: string) => {
    const moodReasons: { [key: string]: string } = {
      '행복함': '행복한 기분을 더욱 업시켜줄 수 있는 즐거운 맛의 음식입니다.',
      '피곤함': '피로를 풀어주고 에너지를 채워줄 수 있는 영양가 높은 음식입니다.',
      '스트레스높음': '스트레스를 해소하는데 도움이 되는 편안한 맛의 음식입니다.',
      '우울함': '기분을 전환시켜주고 즐거움을 줄 수 있는 특별한 음식입니다.',
      '활력필요': '활력을 되찾는데 도움이 되는 영양소가 풍부한 건강한 음식입니다.',
      '보통': '누구나 좋아하는 대중적인 맛으로 안정적인 선택이 될 것입니다.'
    };

    const weatherReasons: { [key: string]: string } = {
      '맑음': '맑은 날씨에 어울리는 상큼하고 깔끔한 맛입니다.',
      '흐림': '흐린 날씨에 기분을 밝게 해줄 수 있는 특별한 맛입니다.',
      '비': '비 오는 날 생각나는 따뜻하고 포근한 맛입니다.',
      '눈': '추운 날씨에 몸을 따뜻하게 해줄 수 있는 든든한 음식입니다.',
      '안개': '안개 낀 날씨에 기분을 전환해줄 수 있는 특별한 맛입니다.'
    };

    return {
      mainDish: {
        ...selectedFood,
        description: `${selectedFood.name}은(는) ${selectedFood.category}의 대표적인 메뉴입니다.`
      },
      reasonForRecommendation: `${location}에서 즐기기 좋은 ${selectedFood.name}을(를) 추천드립니다. ${moodReasons[mood] || moodReasons['보통']} ${weatherReasons[weather] || weatherReasons['맑음']} ${selectedFood.calories}kcal의 적절한 열량으로 점심 식사로 매우 적합합니다.`,
      healthTip: `${selectedFood.name}은(를) 드실 때는 천천히 씹어 먹으면서 맛을 음미하시면 좋습니다. 식사 후 10-15분 정도의 가벼운 산책은 소화를 돕고 오후 컨디션을 개선하는데 도움이 됩니다.`
    };
  };

  // 룰렛 돌리기
  const spinRoulette = async () => {
    try {
      setIsLoading(true);
      setStep('loading');
      
      // 룰렛 애니메이션 시작
      const randomIndex = Math.floor(Math.random() * lunchOptions.length);
      setSelectedMenuIndex(randomIndex);
      setIsSpinning(true);
      
    } catch (error) {
      console.error('룰렛 돌리기 오류:', error);
      setError('추천을 가져오는데 실패했습니다. 다시 시도해주세요.');
      setStep('options');
      setIsLoading(false);
    }
  };

  // 룰렛 애니메이션 종료 후 처리
  const handleSpinEnd = async () => {
    try {
      const selectedFood = lunchOptions[selectedMenuIndex];
      
      // 선택된 음식에 맞는 실제 식당 정보 가져오기
      const result = await getRestaurantsForFood(selectedFood.category);
      
      setRecommendation({
        mainDish: {
          ...selectedFood,
          description: `${selectedFood.name}은(는) ${selectedFood.category} 중에서도 인기 있는 메뉴입니다.`
        },
        restaurants: result.restaurants,
        nearbyUrl: result.nearbyUrl,
        reasonForRecommendation: `오늘의 랜덤 메뉴로 ${selectedFood.name}이(가) 선택되었습니다! ${selectedFood.calories}kcal의 적절한 열량으로 점심 식사로 매우 적합합니다.`,
        healthTip: `${selectedFood.name}은(는) 천천히 씹어 먹으면서 맛을 음미하시면 좋습니다. 식사 후 10-15분 정도의 가벼운 산책은 소화를 돕고 오후 컨디션을 개선하는데 도움이 됩니다.`
      });
      
      setStep('result');
    } catch (error) {
      console.error('결과 처리 오류:', error);
      setError('추천을 가져오는데 실패했습니다. 다시 시도해주세요.');
      setStep('options');
    } finally {
      setIsSpinning(false);
      setIsLoading(false);
    }
  };

  // 결과 화면 컴포넌트
  const ResultView = ({ recommendation }: { recommendation: any }) => (
    <div className="space-y-6">
      {/* 추천 음식 정보 */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-orange-100 mb-6">
        <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-6 text-white">
          <h2 className="text-2xl font-bold text-center">
            오늘의 추천 메뉴
          </h2>
        </div>
        <div className="p-6">
          {/* 메인 음식 정보 */}
          <div className="flex items-center justify-between mb-6 bg-orange-50 p-4 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center shadow-md">
                <span className="text-4xl">{recommendation?.mainDish?.image || '🍽️'}</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{recommendation?.mainDish?.name || '추천 메뉴'}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded-full shadow-sm">
                    {recommendation?.mainDish?.calories || '0'}kcal
                  </span>
                  <span className="text-sm font-semibold text-orange-600 bg-white px-2 py-1 rounded-full shadow-sm">
                    {recommendation?.mainDish?.price || '가격 정보 없음'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 현재 상황 */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <span className="text-2xl mb-1 block">{moodOptions.find(m => m.value === mood)?.label.split(' ')[1] || '😊'}</span>
              <span className="text-sm text-blue-800 font-medium">{mood || '기분 정보 없음'}</span>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg text-center">
              <span className="text-2xl mb-1 block">
                {weather === '맑음' ? '☀️' : weather === '흐림' ? '☁️' : weather === '비' ? '🌧️' : '🌤️'}
              </span>
              <span className="text-sm text-yellow-800 font-medium">{weather || '날씨 정보 없음'}</span>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <span className="text-2xl mb-1 block">📍</span>
              <span className="text-sm text-green-800 font-medium truncate">{location || '위치 정보 없음'}</span>
            </div>
          </div>
          
          {/* 추천 이유 */}
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-5">
              <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <span>추천 이유</span>
              </h4>
              <div className="space-y-2">
                <p className="text-gray-700 leading-relaxed">
                  {recommendation?.reasonForRecommendation || '추천 이유를 불러오는 중입니다...'}
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-5">
              <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <span className="text-lg">💪</span>
                <span>건강 팁</span>
              </h4>
              <p className="text-gray-700 leading-relaxed">
                {recommendation?.healthTip || '건강 팁을 불러오는 중입니다...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 추천 식당 */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-orange-100">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
          <h2 className="text-2xl font-bold text-center">
            추천 맛집
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {(recommendation?.restaurants || []).map((restaurant: any, index: number) => (
              <a 
                key={index} 
                href={restaurant.placeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl flex flex-col gap-2 shadow-sm border border-green-100 hover:shadow-md hover:border-green-300 transition-all duration-300 cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-base text-gray-800">{restaurant.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                        {restaurant.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{restaurant.address} ({restaurant.distance})</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-yellow-500 text-sm font-bold">{restaurant.rating}</span>
                    <span className="text-xs text-gray-500">리뷰 {restaurant.reviews.toLocaleString()}개</span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* 더 많은 식당 보기 버튼 */}
          {recommendation?.nearbyUrl && (
            <div className="mt-6">
              <a
                href={recommendation.nearbyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <MapPin className="h-5 w-5" />
                <span className="font-medium">근처 더 많은 식당 보러가기</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 추천 버튼 */}
      <div className="grid grid-cols-2 gap-4 mt-8">
        <Button 
          className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-lg rounded-xl py-6 flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-105 text-lg"
          onClick={getAiRecommendation}
          disabled={isLoading}
        >
          <span className="font-bold">AI 추천받기</span>
        </Button>
        
        <Button 
          variant="outline"
          className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 shadow-lg rounded-xl py-6 flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-105 text-lg"
          onClick={spinRoulette}
          disabled={isLoading}
        >
          <RefreshCw className="h-5 w-5" />
          <span className="font-bold">룰렛 돌리기</span>
        </Button>
      </div>
    </div>
  );

  // 로딩 화면 수정
  const LoadingView = () => (
    <div className="space-y-6 text-center">
      <p className="text-lg text-gray-600 mb-6">
        오늘의 메뉴를 정하고 있어요...
      </p>
      
      <div className="relative flex justify-center mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-full blur-xl"></div>
        <div className="relative w-full max-w-md mx-auto">
          {isSpinning ? (
            <RouletteWheel
              items={lunchOptions}
              spinning={isSpinning}
              selectedIndex={selectedMenuIndex}
              onSpinEnd={handleSpinEnd}
            />
          ) : (
            <div className="flex justify-center">
              <RefreshCw className="h-20 w-20 text-orange-600 animate-spin" />
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-xl shadow-sm border border-orange-100">
        <p className="text-orange-600 text-base font-medium animate-pulse">
          {isSpinning ? '룰렛이 돌아가는 중이에요...' : '맛있는 점심 메뉴를 찾고 있어요...'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* 홈으로 돌아가기 버튼 */}
          <div className="mb-6">
            <Link 
              href="/" 
              className="inline-flex items-center text-orange-600 hover:text-orange-700 transition-colors font-medium"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              <span>홈으로 돌아가기</span>
            </Link>
          </div>

          {/* 헤더 */}
          <div className="mb-8 text-center">
            <div className="inline-block bg-gradient-to-r from-orange-600 to-orange-500 text-white px-4 py-2 rounded-full shadow-md mb-4">
              <h1 className="text-xl font-bold">점심 메뉴 추천</h1>
            </div>
            <p className="text-gray-600">
              AI가 당신의 상황에 맞는 최적의 점심 메뉴를 추천해 드립니다.
            </p>
          </div>
          
          {/* 기존 컨텐츠 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-orange-100">
            {/* 옵션 선택 화면 */}
            {step === 'options' && (
              <div className="space-y-6">
                <p className="text-gray-600 mb-6 text-center">
                  오늘 점심 뭐 먹을지 고민이신가요? AI가 당신의 상황에 맞는 최적의 점심 메뉴를 추천해 드립니다.
                </p>
                
                {/* 위치 및 날씨 정보 */}
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-5 rounded-xl shadow-sm border border-orange-100 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                        <MapPin className="h-5 w-5 text-orange-500" />
                      </div>
                      <span className="text-base font-medium text-gray-700">현재 위치</span>
                    </div>
                    <span className="text-sm font-medium text-orange-600 bg-white px-3 py-1.5 rounded-full shadow-sm">
                      {location || '위치 확인 중...'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                        {weather === '맑음' && <Sun className="h-5 w-5 text-yellow-500" />}
                        {weather === '흐림' && <CloudRain className="h-5 w-5 text-gray-500" />}
                        {weather === '비' && <CloudRain className="h-5 w-5 text-blue-500" />}
                        {(weather !== '맑음' && weather !== '흐림' && weather !== '비') && 
                          <ThermometerSun className="h-5 w-5 text-orange-500" />}
                      </div>
                      <span className="text-base font-medium text-gray-700">현재 날씨</span>
                    </div>
                    <span className="text-sm font-medium text-orange-600 bg-white px-3 py-1.5 rounded-full shadow-sm">
                      {weather || '날씨 확인 중...'}
                    </span>
                  </div>
                </div>
                
                {/* 기분 선택 */}
                <div className="space-y-4">
                  <div className="flex items-center mb-3">
                    <div className="w-3 h-8 bg-orange-500 rounded-full mr-3"></div>
                    <label className="text-lg font-semibold text-gray-800">
                      현재 기분을 선택해주세요
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {moodOptions.map((option) => (
                      <button
                        key={option.value}
                        className={`p-4 rounded-xl text-left transition-all duration-300 ${
                          mood === option.value 
                            ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-lg transform scale-105 border-2 border-orange-300' 
                            : 'bg-white border border-gray-200 hover:border-orange-300 hover:bg-orange-50 shadow-sm'
                        }`}
                        onClick={() => setMood(option.value)}
                      >
                        <div className="font-medium mb-1 flex items-center">
                          <span className="text-2xl mr-3">{option.label.split(' ')[1]}</span>
                          <span className="text-lg">{option.label.split(' ')[0]}</span>
                        </div>
                        <div className={`text-sm ${mood === option.value ? 'text-white/90' : 'text-gray-500'}`}>
                          {option.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* 가격대 선택 */}
                <div className="space-y-4">
                  <div className="flex items-center mb-3">
                    <div className="w-3 h-8 bg-green-500 rounded-full mr-3"></div>
                    <label className="text-lg font-semibold text-gray-800">
                      원하는 가격대를 선택해주세요
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {priceOptions.map((option) => (
                      <button
                        key={option.value}
                        className={`p-3 rounded-xl text-center transition-all duration-300 ${
                          priceRange === option.value 
                            ? 'bg-gradient-to-r from-green-500 to-green-400 text-white shadow-lg transform scale-105 border-2 border-green-300' 
                            : 'bg-white border border-gray-200 hover:border-green-300 hover:bg-green-50 shadow-sm'
                        }`}
                        onClick={() => setPriceRange(option.value)}
                      >
                        <div className="font-medium text-lg">{option.label.split(' ')[0]}</div>
                        <div className="text-2xl mt-1">{option.label.split(' ')[1]}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* 음식 스타일 선택 */}
                <div className="space-y-4">
                  <div className="flex items-center mb-3">
                    <div className="w-3 h-8 bg-purple-500 rounded-full mr-3"></div>
                    <label className="text-lg font-semibold text-gray-800">
                      원하는 음식 스타일을 선택해주세요
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {foodStyleOptions.map((option) => (
                      <button
                        key={option.value}
                        className={`p-3 rounded-xl text-center transition-all duration-300 ${
                          foodStyle === option.value 
                            ? 'bg-gradient-to-r from-purple-500 to-purple-400 text-white shadow-lg transform scale-105 border-2 border-purple-300' 
                            : 'bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50 shadow-sm'
                        }`}
                        onClick={() => setFoodStyle(option.value)}
                      >
                        <div className="text-2xl mb-1">{option.label.split(' ')[1]}</div>
                        <div className="font-medium text-sm">{option.label.split(' ')[0]}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* 추천 버튼 */}
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <Button 
                    className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-lg rounded-xl py-6 flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-105 text-lg"
                    onClick={getAiRecommendation}
                    disabled={isLoading}
                  >
                    <span className="font-bold">AI 추천받기</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 shadow-lg rounded-xl py-6 flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-105 text-lg"
                    onClick={spinRoulette}
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-5 w-5" />
                    <span className="font-bold">룰렛 돌리기</span>
                  </Button>
                </div>
                
                {error && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 mt-4">
                    {error}
                  </div>
                )}
              </div>
            )}
            
            {/* 로딩 화면 */}
            {step === 'loading' && (
              <LoadingView />
            )}
            
            {/* 결과 화면 */}
            {step === 'result' && recommendation && (
              <ResultView recommendation={recommendation} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 
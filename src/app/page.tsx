'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Flame, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

interface CardData {
  title: string;
  description: string;
  href: string;
  icon: string;
  isExternal: boolean;
  badge?: string;
}

export default function Home() {
  // AI 서비스 카테고리 카드
  const aiServiceCards = [
    {
      title: '유튜브 영상 요약',
      description: '유튜브 영상의 내용을 AI가 요약해 핵심만 빠르게 파악하세요.',
      href: '/youtube-insight',
      icon: '📺',
      isExternal: false,
      badge: '신규'
    },
    {
      title: '음식 칼로리 측정기',
      description: '음식 사진을 업로드하면 AI가 칼로리를 측정해 드립니다.',
      href: '/calorie-calculator',
      icon: '🍔',
      isExternal: false,
      badge: '인기'
    },
    {
      title: '타로 운세보기',
      description: '타로 카드로 당신의 운세를 확인해보세요.',
      href: '/tarot',
      icon: '🔮',
      isExternal: false
    },
    {
      title: '점심 메뉴 추천',
      description: '위치, 날씨, 기분에 맞는 점심 메뉴를 추천해 드립니다.',
      href: '/lunch-recommendation',
      icon: '🍲',
      isExternal: false
    },
    {
      title: '손금 분석기',
      description: 'AI가 당신의 손금을 분석하여 운세를 알려드립니다.',
      href: '/palmistry',
      icon: '✋',
      isExternal: false,
      badge: '인기'
    },
    {
      title: '로또 번호 생성기',
      description: '당신의 운세에 맞는 로또 번호를 AI가 추천해 드립니다.',
      href: '/lotto-generator',
      icon: '🎱',
      isExternal: false,
      badge: '신규'
    },
    {
      title: '주식 분석기',
      description: '관심 있는 주식의 미래 전망을 AI가 분석해 드립니다.',
      href: '/stock-analyzer',
      icon: '📈',
      isExternal: false,
      badge: '인기'
    },
    {
      title: '웹툰 생성기',
      description: 'AI가 당신의 아이디어를 웹툰으로 변환해 드립니다.',
      href: '/webtoon-generator',
      icon: '🎨',
      isExternal: false,
      badge: '개발중'
    },
    {
      title: '알약 카메라',
      description: '알약 이미지로 약품 정보 확인',
      href: '/pill-camera',
      icon: '💊',
      isExternal: false,
      badge: '신규'
    }
  ];

  // GPTS 카테고리 카드
  const gptsCards = [
    {
      title: '블로그 HTML 작성',
      description: '전문적인 블로그 HTML 코드를 손쉽게 작성할 수 있습니다.',
      href: 'https://chatgpt.com/g/g-67b2b40b04448191b37578a1108f8b7d-beulrogeu-peurimieom-kweolriti-geuljagseong-html',
      icon: '📝',
      isExternal: true
    },
    {
      title: '네이버 블로그 작성',
      description: '네이버 블로그에 최적화된 글을 작성해 드립니다.',
      href: 'https://chatgpt.com/g/g-67b4304f986c81919610c2cac0f7fe0d-neibeo-geulsseugi-wanjeonpan',
      icon: '📘',
      isExternal: true
    },
    {
      title: '카드뉴스 (이미지 4장)',
      description: '4장의 이미지로 구성된 카드뉴스를 생성합니다.',
      href: 'https://chatgpt.com/g/g-67b6b0c763d88191a7a658ee334fc89e-kadeunyuseu-saengseonggi-imiji4jang',
      icon: '🖼️',
      isExternal: true
    },
    {
      title: '카드뉴스 (글씨 5장)',
      description: '5장의 글씨 중심 카드뉴스를 생성합니다.',
      href: 'https://chatgpt.com/g/g-67b736c11800819189d57e1bb31e5530-kadeunyuseu-saengseonggi-geulssi-beojeon-5jang',
      icon: '📊',
      isExternal: true
    },
    {
      title: 'Threads(스레드) 글쓰기',
      description: 'Threads 플랫폼에 최적화된 글을 작성해 드립니다.',
      href: 'https://chatgpt.com/g/g-67ba68007ed08191953012d83740f2b9-threads-seuredeu-jeonmun-geulsseugi',
      icon: '🧵',
      isExternal: true
    },
    {
      title: '유튜브 채널 생성 비서',
      description: '유튜브 채널 생성 및 운영에 도움을 드립니다.',
      href: 'https://chatgpt.com/g/g-67bfe332e30081919d0e23eff795e975-yutyub-caeneol-saengseong-doumi',
      icon: '📹',
      isExternal: true
    }
  ];

  // 카드 렌더링 함수
  const renderCards = (cards: CardData, index: number) => (
    <motion.div
      key={cards.title + index}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ scale: 1.03 }}
      className="h-full"
    >
      {cards.isExternal ? (
        <a href={cards.href} target="_blank" rel="noopener noreferrer" className="block h-full">
          <Card className="h-full border-2 border-gray-100 hover:border-orange-500 transition-all duration-300 shadow-sm hover:shadow-md">
            <CardHeader>
              <div className="text-4xl mb-4">{cards.icon}</div>
              <CardTitle className="text-xl font-bold text-orange-600 flex items-center gap-2">
                {cards.title}
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </CardTitle>
              <CardDescription className="text-gray-600">{cards.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <div className="text-orange-600 font-medium flex items-center">
                바로가기
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </CardFooter>
          </Card>
        </a>
      ) : (
        <Link href={cards.href} className="block h-full">
          <Card className="h-full border-2 border-gray-100 hover:border-orange-500 transition-all duration-300 shadow-sm hover:shadow-md">
            <CardHeader className="relative">
              {cards.badge && (
                <div className="absolute top-4 right-4">
                  {cards.badge === '인기' ? (
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg px-3 py-1.5 rounded-full">
                      <Flame className="h-4 w-4 mr-1 animate-pulse" />
                      인기
                    </Badge>
                  ) : cards.badge === '신규' ? (
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold shadow-lg px-3 py-1.5 rounded-full">
                      <Sparkles className="h-4 w-4 mr-1 animate-pulse" />
                      신규
                    </Badge>
                  ) : cards.badge === '개발중' ? (
                    <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold shadow-lg px-3 py-1.5 rounded-full">
                      <Star className="h-4 w-4 mr-1 animate-pulse" />
                      개발중
                    </Badge>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {cards.badge}
                    </span>
                  )}
                </div>
              )}
              <div className="text-4xl mb-4">{cards.icon}</div>
              <CardTitle className="text-xl font-bold text-orange-600">{cards.title}</CardTitle>
              <CardDescription className="text-gray-600">{cards.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <div className="text-orange-600 font-medium flex items-center">
                자세히 보기
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </CardFooter>
          </Card>
        </Link>
      )}
    </motion.div>
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between text-sm">
        <section className="mb-16">
          <h1 className="text-4xl font-bold mb-4">AI 탐구생활</h1>
          <p className="text-xl text-gray-600 mb-8">
            AI로 더 나은 삶을 만들어가는 공간
          </p>
        </section>

        <section id="ai-services" className="mb-16">
          <h2 className="text-2xl font-bold mb-6">AI 서비스</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiServiceCards.map((card, index) => renderCards(card, index))}
          </div>
        </section>

        <section id="gpts" className="mb-16">
          <h2 className="text-2xl font-bold mb-6">GPTs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gptsCards.map((card, index) => renderCards(card, index))}
          </div>
        </section>
      </div>
    </main>
  );
}

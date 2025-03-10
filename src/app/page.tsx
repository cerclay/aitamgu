'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

export default function Home() {
  // AI 서비스 카테고리 카드
  const aiServiceCards = [
    {
      title: '음식 칼로리 측정기',
      description: '음식 사진을 업로드하면 AI가 칼로리를 측정해 드립니다.',
      href: '/calorie-calculator',
      icon: '🍔',
      isExternal: false
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
      description: '손바닥 사진을 업로드하면 AI가 당신의 운세를 분석합니다.',
      href: '/palm-reading',
      icon: '✋',
      isExternal: false
    },
    {
      title: '로또 번호 생성기',
      description: '당신의 운세에 맞는 로또 번호를 AI가 추천해 드립니다.',
      href: '/lotto-generator',
      icon: '🎱',
      isExternal: false
    },
    {
      title: '주식 분석기',
      description: '관심 있는 주식의 미래 전망을 AI가 분석해 드립니다.',
      href: '/stock-analyzer',
      icon: '📈',
      isExternal: false
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
  const renderCards = (cards, index) => (
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
            <CardHeader>
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
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-orange-600">
            Ai 탐구생활
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            인공지능으로 일상의 다양한 문제를 해결하고 새로운 경험을 만들어보세요.
          </p>
        </header>

        {/* AI 서비스 카테고리 */}
        <div className="mb-16">
          <div className="flex items-center mb-6">
            <div className="h-10 w-2 bg-orange-600 rounded-full mr-3"></div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">AI 서비스</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiServiceCards.map((card, index) => renderCards(card, index))}
          </div>
        </div>

        {/* GPTS 카테고리 */}
        <div>
          <div className="flex items-center mb-6">
            <div className="h-10 w-2 bg-blue-600 rounded-full mr-3"></div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">GPTS</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gptsCards.map((card, index) => renderCards(card, index))}
          </div>
        </div>
      </div>
    </div>
  );
}

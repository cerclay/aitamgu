'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Flame, Star, Book, Lightbulb, ArrowDown } from 'lucide-react';
import { motion, useScroll, useSpring, useInView } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { LatestBlogPosts } from '@/features/blog/components/LatestBlogPosts';
import { useRef, useState } from 'react';

interface CardData {
  title: string;
  description: string;
  href: string;
  icon: string;
  isExternal: boolean;
  badge?: string;
}

// 컨테이너 애니메이션 설정 (간소화)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

// 카드 애니메이션 설정 (최적화)
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 15
    }
  },
  hover: {
    y: -5,
    scale: 1.02,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15
    }
  }
};

export default function Home() {
  // 스크롤 진행률 추적
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  
  // 호버 상태 관리
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // 섹션 참조 및 뷰포트 내 여부 확인
  const servicesRef = useRef<HTMLDivElement>(null);
  const blogRef = useRef<HTMLDivElement>(null);
  const gptsRef = useRef<HTMLDivElement>(null);
  
  const servicesInView = useInView(servicesRef, { once: false, amount: 0.1 });
  const blogInView = useInView(blogRef, { once: false, amount: 0.1 });
  const gptsInView = useInView(gptsRef, { once: false, amount: 0.1 });
  
  // AI 서비스 카테고리 카드
  const aiServiceCards = [
    {
      title: '주식 분석기',
      description: '관심 있는 주식의 미래 전망을 AI가 분석해 드립니다.',
      href: '/stock-analyzer',
      icon: '📈',
      isExternal: false,
      badge: '인기'
    },
    {
      title: '기업용챗봇',
      description: '기업 맞춤형 AI 챗봇을 구축하고 관리할 수 있습니다.',
      href: '/business-chatbot',
      icon: '🤖',
      isExternal: false,
      badge: '신규'
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
      title: '유튜브 영상 요약',
      description: '유튜브 영상의 내용을 AI가 요약해 핵심만 빠르게 파악하세요.',
      href: '/youtube-insight',
      icon: '📺',
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
      title: '알약 카메라',
      description: '알약 이미지로 약품 정보 확인',
      href: '/pill-camera',
      icon: '💊',
      isExternal: false
    },
    {
      title: '유명인 책 추천기',
      description: '유명인들이 읽은 책과 유사한 책을 AI가 추천해 드립니다.',
      href: '/celebrity-books',
      icon: '📚',
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
      title: '점심 메뉴 추천',
      description: '위치, 날씨, 기분에 맞는 점심 메뉴를 추천해 드립니다.',
      href: '/lunch-recommendation',
      icon: '🍲',
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
      title: '웹툰 생성기',
      description: 'AI가 당신의 아이디어를 웹툰으로 변환해 드립니다.',
      href: '/webtoon-generator',
      icon: '🎨',
      isExternal: false,
      badge: '개발중'
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

  // 카드 렌더링 함수 (간소화)
  const renderCards = (cards: CardData, index: number) => (
    <motion.div
      key={cards.title + index}
      variants={cardVariants}
      className="h-full"
      whileHover="hover"
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {cards.isExternal ? (
        <a href={cards.href} target="_blank" rel="noopener noreferrer" className="block h-full">
          <Card className="h-full border border-gray-200 hover:border-orange-500 transition-all duration-300 shadow-sm hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="text-3xl mb-3">{cards.icon}</div>
              <CardTitle className="text-lg font-bold text-orange-600 flex items-center gap-2">
                {cards.title}
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </CardTitle>
              <CardDescription className="text-gray-600 line-clamp-2">{cards.description}</CardDescription>
            </CardHeader>
            <CardFooter className="pt-2">
              <div className="text-orange-600 font-medium flex items-center text-sm">
                바로가기
                <ArrowRight className="ml-1 h-3 w-3" />
              </div>
            </CardFooter>
          </Card>
        </a>
      ) : (
        <Link href={cards.href} className="block h-full">
          <Card className="h-full border border-gray-200 hover:border-orange-500 transition-all duration-300 shadow-sm hover:shadow-md relative">
            <CardHeader className="relative pb-2">
              {cards.badge && (
                <div className="absolute top-2 right-2">
                  {cards.badge === '인기' ? (
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-2 py-1 text-xs rounded-full">
                      <Flame className="h-3 w-3 mr-1" />
                      인기
                    </Badge>
                  ) : cards.badge === '신규' ? (
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-2 py-1 text-xs rounded-full">
                      <Sparkles className="h-3 w-3 mr-1" />
                      신규
                    </Badge>
                  ) : cards.badge === '개발중' ? (
                    <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2 py-1 text-xs rounded-full">
                      <Star className="h-3 w-3 mr-1" />
                      개발중
                    </Badge>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {cards.badge}
                    </span>
                  )}
                </div>
              )}
              <div className="text-3xl mb-3">{cards.icon}</div>
              <CardTitle className="text-lg font-bold text-orange-600">{cards.title}</CardTitle>
              <CardDescription className="text-gray-600 line-clamp-2">{cards.description}</CardDescription>
            </CardHeader>
            <CardFooter className="pt-2">
              <div className="text-orange-600 font-medium flex items-center text-sm">
                자세히 보기
                <ArrowRight className="ml-1 h-3 w-3" />
              </div>
            </CardFooter>
          </Card>
        </Link>
      )}
    </motion.div>
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 sm:p-6 md:p-10 lg:p-16 bg-white overflow-hidden">
      {/* 스크롤 진행률 표시 */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-orange-500 z-50 origin-left"
        style={{ scaleX }}
      />
      
      <div className="z-10 max-w-6xl w-full items-center justify-between">
        {/* 히어로 섹션 - 단순화 */}
        <section className="mb-16 py-8 md:py-16 relative">
          <div className="max-w-3xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <motion.div 
                className="flex justify-center mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center justify-center p-3 bg-orange-500 rounded-full shadow-md">
                  <Lightbulb className="text-white" size={32} />
                </div>
              </motion.div>
              
              <motion.h1 
                className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-orange-600"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                AI 탐구생활
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl mx-auto"
              >
                AI로 더 나은 삶을 만들어가는 공간
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-wrap justify-center gap-3 mt-8"
              >
                <a href="#ai-services">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-5 rounded-md shadow-sm">
                    AI 서비스 둘러보기
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
                
                <a href="#blog">
                  <Button variant="outline" className="border border-orange-500 text-orange-600 hover:bg-orange-50 py-2 px-5 rounded-md shadow-sm">
                    블로그
                    <Book className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </motion.div>
            </motion.div>
            
            <motion.div
              className="absolute bottom-[-30px] left-1/2 transform -translate-x-1/2 text-orange-500"
              animate={{ 
                y: [0, 6, 0],
              }}
              transition={{
                repeat: Infinity,
                repeatType: "reverse",
                duration: 1.5,
                ease: "easeInOut"
              }}
            >
              <ArrowDown size={24} />
            </motion.div>
          </div>
        </section>

        {/* AI 서비스 섹션 */}
        <section id="ai-services" className="mb-16 px-4" ref={servicesRef}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={servicesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">AI 서비스</h2>
            <div className="w-16 h-1 bg-orange-500 rounded-full mb-4"></div>
            <p className="text-gray-600 max-w-2xl">
              다양한 일상 속 문제를 AI의 도움으로 해결해보세요.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate={servicesInView ? "visible" : "hidden"}
          >
            {aiServiceCards.map((card, index) => renderCards(card, index))}
          </motion.div>
        </section>

        {/* 블로그 섹션 */}
        <section id="blog" className="mb-16 px-4" ref={blogRef}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={blogInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">블로그</h2>
            <div className="w-16 h-1 bg-orange-500 rounded-full mb-4"></div>
            <p className="text-gray-600 max-w-2xl">
              AI에 관한 유용한 정보와 인사이트를 공유합니다.
            </p>
          </motion.div>
          
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={blogInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <LatestBlogPosts />
          </motion.div>
          
          <motion.div 
            className="flex justify-center mt-6"
            initial={{ opacity: 0 }}
            animate={blogInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Link href="/blog">
              <Button variant="outline" className="border border-orange-500 text-orange-600 hover:bg-orange-50 py-2 px-4 rounded-md shadow-sm">
                블로그 더 보기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* GPTs 섹션 */}
        <section id="gpts" className="mb-16 px-4" ref={gptsRef}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={gptsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">GPTs</h2>
            <div className="w-16 h-1 bg-orange-500 rounded-full mb-4"></div>
            <p className="text-gray-600 max-w-2xl">
              특별한 목적에 맞게 개발된 GPT 모델을 활용해보세요.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate={gptsInView ? "visible" : "hidden"}
          >
            {gptsCards.map((card, index) => renderCards(card, index))}
          </motion.div>
        </section>
        
        {/* 푸터 */}
        <footer className="border-t border-gray-200 py-6 mt-8 text-center text-gray-500 px-4">
          <p>© 2024 AI 탐구생활. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}

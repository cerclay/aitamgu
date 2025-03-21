'use client';

import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Trash2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// 규정 데이터
const RULES_DATA = {
  '복리 후생': {
    description: '회사의 복리 후생 제도에 대한 안내입니다.',
    items: {
      '식대 지원': '매월 20만원의 식대가 지원됩니다.',
      '교통비 지원': '대중교통 이용 시 월 10만원까지 지원됩니다.',
      '건강검진': '연 1회 종합건강검진을 제공합니다.',
      '휴가비 지원': '연차 휴가 사용 시 1일 5만원의 휴가비가 지원됩니다.',
      '자기계발비': '월 20만원 한도 내 도서구입, 강의수강 등을 지원합니다.'
    }
  },
  '보안 규정': {
    description: '회사의 정보 보안 규정입니다.',
    items: {
      '비밀번호 관리': '비밀번호는 최소 8자 이상, 특수문자 포함하여 3개월마다 변경해야 합니다.',
      '문서 보안': '기밀문서는 승인 없이 외부 반출이 금지됩니다.',
      '장비 보안': '업무용 노트북은 반드시 디스크 암호화를 해야 합니다.',
      'USB 사용': 'USB 사용은 보안팀 승인 후 가능합니다.',
      '화면 잠금': '자리 이석 시 반드시 화면 잠금을 해야 합니다.'
    }
  },
  '업무 규정': {
    description: '업무 수행에 관한 기본 규정입니다.',
    items: {
      '근무 시간': '기본 근무시간은 09:00-18:00입니다.',
      '유연 근무': '코어타임(10:00-16:00)을 제외한 시간은 자유롭게 조정 가능합니다.',
      '원격 근무': '주 3일까지 재택근무가 가능합니다.',
      '회의 규칙': '회의는 시작 시간 정각에 시작하여 1시간을 넘기지 않습니다.',
      '업무 보고': '주간 업무 보고서는 금요일 오후 5시까지 제출합니다.'
    }
  },
  '인사 규정': {
    description: '인사 관리에 관한 규정입니다.',
    items: {
      '수습 기간': '신규 입사자는 3개월의 수습기간을 거칩니다.',
      '평가 제도': '분기별 성과 평가가 진행됩니다.',
      '승진 제도': '연 1회 승진 심사가 진행됩니다.',
      '이직 절차': '퇴사 의향이 있을 경우 최소 1개월 전에 통보해야 합니다.',
      '징계 절차': '중대 위반 사항 발생 시 인사위원회 회부됩니다.'
    }
  },
  '휴가 신청': {
    description: '휴가 신청 및 사용에 관한 안내입니다.',
    items: {
      '연차 휴가': '1년 근속 시 15일의 연차가 부여됩니다.',
      '반차 사용': '연차는 반일 단위로 분할 사용이 가능합니다.',
      '휴가 신청': '휴가는 최소 3일 전에 신청해야 합니다.',
      '특별 휴가': '결혼, 출산 등 경조사 시 특별 휴가가 부여됩니다.',
      '병가': '연 60일 이내 병가 사용이 가능합니다.'
    }
  },
  'HR 상담 예약': {
    description: 'HR 팀과의 1:1 상담 예약 방법입니다.',
    items: {
      '상담 시간': '상담은 평일 10:00-17:00 사이에 가능합니다.',
      '예약 방법': '인트라넷 HR 상담 게시판에서 예약이 가능합니다.',
      '상담 주제': '급여, 복지, 경력 개발 등 모든 HR 관련 주제 상담이 가능합니다.',
      '긴급 상담': '긴급한 경우 HR팀 내선(1234)으로 연락 주세요.',
      '비밀 보장': '상담 내용은 철저히 비밀이 보장됩니다.'
    }
  }
};

const MENU_OPTIONS = [
  '복리 후생',
  '보안 규정',
  '업무 규정',
  '인사 규정',
  '휴가 신청',
  'HR 상담 예약'
];

export default function BusinessChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 초기 메시지 설정
  useEffect(() => {
    const savedMessages = localStorage.getItem('businessChatbotMessages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      const initialMessages: Message[] = [
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: '안녕하세요! 기업 규정 조회 챗봇입니다. 어떤 규정을 찾으시나요?',
          timestamp: Date.now(),
        },
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '다음 중 하나를 선택해주세요.\n\n' + MENU_OPTIONS.map((opt, i) => `${i + 1}. ${opt}`).join('\n'),
          timestamp: Date.now() + 1,
        }
      ];
      setMessages(initialMessages);
    }
  }, []);

  // 메시지 저장 및 스크롤
  useEffect(() => {
    localStorage.setItem('businessChatbotMessages', JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // 응답 생성 로직
    setTimeout(() => {
      let response = '';
      const userInput = input.toLowerCase().trim();

      // 메뉴 번호로 입력한 경우 처리
      const menuNumber = parseInt(userInput);
      if (!isNaN(menuNumber) && menuNumber >= 1 && menuNumber <= MENU_OPTIONS.length) {
        const selectedOption = MENU_OPTIONS[menuNumber - 1];
        const ruleData = RULES_DATA[selectedOption];
        response = `${selectedOption}\n${ruleData.description}\n\n`;
        response += Object.entries(ruleData.items)
          .map(([title, content]) => `▶ ${title}\n${content}`)
          .join('\n\n');
        response += '\n\n다른 규정을 조회하시려면 메뉴 번호나 규정 이름을 입력해주세요.';
      } else {
        // 규정 이름으로 검색
        const matchedRule = MENU_OPTIONS.find(
          option => userInput.includes(option.toLowerCase())
        );

        if (matchedRule) {
          const ruleData = RULES_DATA[matchedRule];
          response = `${matchedRule}\n${ruleData.description}\n\n`;
          response += Object.entries(ruleData.items)
            .map(([title, content]) => `▶ ${title}\n${content}`)
            .join('\n\n');
          response += '\n\n다른 규정을 조회하시려면 메뉴 번호나 규정 이름을 입력해주세요.';
        } else {
          // 매칭되는 규정이 없는 경우
          response = '죄송합니다. 원하시는 정보를 찾을 수 없습니다.\n다음 중 하나를 선택해주세요.\n\n' +
            MENU_OPTIONS.map((opt, i) => `${i + 1}. ${opt}`).join('\n');
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleReset = () => {
    const initialMessages: Message[] = [
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: '안녕하세요! 기업 규정 조회 챗봇입니다. 어떤 규정을 찾으시나요?',
        timestamp: Date.now(),
      },
      {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '다음 중 하나를 선택해주세요.\n\n' + MENU_OPTIONS.map((opt, i) => `${i + 1}. ${opt}`).join('\n'),
        timestamp: Date.now() + 1,
      }
    ];
    setMessages(initialMessages);
    localStorage.removeItem('businessChatbotMessages');
  };

  return (
    <main className="container mx-auto py-4 px-4 min-h-screen flex flex-col bg-gradient-to-b from-sky-50 to-white">
      <motion.div 
        className="max-w-2xl w-full mx-auto flex-1 flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div 
          className="flex justify-between items-center mb-4 bg-white p-4 rounded-2xl shadow-lg backdrop-blur-lg bg-opacity-80 border border-sky-100"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <MessageCircle className="w-6 h-6 text-sky-500" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">기업 규정 도우미</h1>
              <p className="text-xs text-sky-600">실시간 응답 가능</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="hover:bg-red-50 transition-colors duration-200"
            title="대화 내용 지우기"
          >
            <Trash2 className="h-5 w-5 text-red-500" />
          </Button>
        </motion.div>

        <Card className="flex-1 flex flex-col shadow-xl bg-white/80 backdrop-blur-lg rounded-2xl border border-sky-100">
          <ScrollArea 
            className="flex-1 p-4 border-b border-sky-100"
            ref={scrollRef}
          >
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: message.role === 'user' ? 20 : -20 }}
                  transition={{ 
                    duration: 0.3,
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                  }}
                  className={`mb-4 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className={`inline-block p-3 rounded-2xl max-w-[85%] shadow-md ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-br-none'
                        : 'bg-white text-gray-900 rounded-bl-none border border-sky-100'
                    }`}
                  >
                    {message.content.split('\n').map((line, i) => (
                      <div key={i} className="mb-1 last:mb-0 whitespace-pre-wrap">
                        {line}
                      </div>
                    ))}
                  </motion.div>
                  <div className={`text-xs text-gray-400 mt-1 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div 
                className="text-left"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="inline-block p-3 rounded-2xl bg-white border border-sky-100 shadow-md">
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-sky-400 rounded-full"
                        animate={{ 
                          y: [0, -6, 0],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ 
                          duration: 0.8, 
                          repeat: Infinity, 
                          delay: i * 0.15,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </ScrollArea>
          <motion.div 
            className="p-4 bg-white/80 backdrop-blur-sm border-t border-sky-100 rounded-b-2xl"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="flex gap-2 items-end max-w-2xl mx-auto">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="메시지를 입력하세요..."
                className="resize-none min-h-[50px] max-h-[150px] rounded-2xl bg-sky-50/50 border-sky-200 focus:border-sky-400 focus:ring-sky-400 transition-all duration-200 placeholder:text-sky-400/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-sky-500 hover:bg-sky-600 transition-all duration-200 rounded-full p-3 h-auto disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-sky-200 active:scale-95"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        </Card>
      </motion.div>
    </main>
  );
} 
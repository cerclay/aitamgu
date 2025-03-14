import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Brain, Activity, Star, Info, Hand, Camera, AlertCircle } from 'lucide-react';

// 손금 정보 데이터
const palmLines = [
  {
    id: 'lifeLine',
    name: '생명선',
    description: '엄지와 검지 사이에서 시작하여 손목 방향으로 내려가는 선입니다. 생명력, 건강, 활력, 삶의 질을 나타냅니다.',
    details: '길고 깊은 생명선은 강한 체력과 활력을 의미합니다. 끊어진 생명선은 건강상의 변화나 큰 사건을 의미할 수 있습니다. 가지가 많은 생명선은 다양한 관심사와 활동을 나타냅니다.',
    color: '#e74c3c',
    icon: <Activity size={20} className="text-red-500" />
  },
  {
    id: 'heartLine',
    name: '감정선/사랑선',
    description: '새끼손가락 아래에서 시작하여 손바닥을 가로지르는 선입니다. 감정 상태, 사랑, 관계에 대한 태도를 나타냅니다.',
    details: '곡선이 부드러운 감정선은 따뜻하고 감성적인 성격을 의미합니다. 직선적인 감정선은 현실적이고 논리적인 성향을 나타냅니다. 가지가 많은 감정선은 풍부한 감정 표현과 다양한 관계를 의미합니다.',
    color: '#e84393',
    icon: <Heart size={20} className="text-pink-500" />
  },
  {
    id: 'headLine',
    name: '지능선/머리선',
    description: '검지와 엄지 사이에서 시작하여 손바닥을 가로지르는 선입니다. 사고방식, 지적 능력, 창의성을 나타냅니다.',
    details: '길고 깊은 지능선은 명확한 사고와 집중력을 의미합니다. 곡선이 있는 지능선은 창의적인 사고를 나타냅니다. 갈라진 지능선은 다양한 관점에서 생각하는 능력을 의미합니다.',
    color: '#3498db',
    icon: <Brain size={20} className="text-blue-500" />
  },
  {
    id: 'fateLine',
    name: '운명선',
    description: '손목에서 시작하여 중지 방향으로 올라가는 세로선입니다. 경력, 성공, 인생의 방향을 나타냅니다.',
    details: '뚜렷한 운명선은 목표 지향적이고 성공 가능성이 높음을 의미합니다. 끊어진 운명선은 경력이나 인생의 방향 변화를 나타냅니다. 여러 갈래로 나뉜 운명선은 다양한 재능과 가능성을 의미합니다.',
    color: '#9b59b6',
    icon: <Star size={20} className="text-purple-500" />
  }
];

export default function PalmistryGuide() {
  const [activeLine, setActiveLine] = useState<string | null>(null);
  
  return (
    <div className="bg-white rounded-xl overflow-hidden">
      <div className="p-4 space-y-6">
        {/* 좋은 손금 사진 찍기 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100"
        >
          <div className="flex items-start">
            <div className="bg-indigo-100 rounded-full p-2 mr-3 flex-shrink-0">
              <Camera className="text-indigo-600" size={20} />
            </div>
            <div>
              <h4 className="text-base font-semibold text-indigo-800 mb-2">좋은 손금 사진 찍기</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <span>밝은 자연광 아래에서 촬영하여 그림자 없이 손금이 선명하게 보이도록 하세요.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <span>손바닥을 완전히 펴고 손가락을 약간 벌려 손금이 잘 보이게 하세요.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <span>왼손 손바닥을 촬영하는 것이 좋습니다(타고난 운명을 나타냄).</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <span>카메라와 손바닥 사이의 거리를 약 20-30cm로 유지하세요.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <span>손바닥이 프레임의 대부분을 차지하도록 하되, 손목부터 손가락 끝까지 모두 포함되게 하세요.</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
        
        {/* 주요 손금 알아보기 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
            <Info className="mr-2 text-indigo-600" size={20} />
            주요 손금 알아보기
          </h4>
          
          <div className="relative h-64 w-full mb-4 bg-gray-50 rounded-lg overflow-hidden p-2">
            {/* 손바닥 SVG 이미지 */}
            <svg
              viewBox="0 0 300 300"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              {/* 손바닥 배경 */}
              <defs>
                <radialGradient id="palmGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                  <stop offset="0%" stopColor="#ffecd2" />
                  <stop offset="100%" stopColor="#f9e3d2" />
                </radialGradient>
              </defs>
              
              <path
                d="M150,20 C80,20 50,100 50,180 C50,240 90,280 150,280 C210,280 250,240 250,180 C250,100 220,20 150,20 Z"
                fill="url(#palmGradient)"
                stroke="#e0c3b0"
                strokeWidth="2"
              />
              
              {/* 생명선 */}
              <path
                d="M100,80 C90,120 85,160 85,200"
                fill="none"
                stroke={activeLine === 'lifeLine' || !activeLine ? '#e74c3c' : '#e74c3c80'}
                strokeWidth={activeLine === 'lifeLine' ? '4' : '3'}
                strokeLinecap="round"
                strokeDasharray={activeLine === 'lifeLine' ? '0' : '0'}
                className="transition-all duration-300"
              />
              <text 
                x="70" 
                y="220" 
                fill={activeLine === 'lifeLine' || !activeLine ? '#e74c3c' : '#e74c3c80'} 
                fontSize="12" 
                fontWeight="bold"
                className="transition-all duration-300"
              >
                생명선
              </text>
              
              {/* 감정선/사랑선 */}
              <path
                d="M80,100 C120,90 160,90 200,100"
                fill="none"
                stroke={activeLine === 'heartLine' || !activeLine ? '#e84393' : '#e8439380'}
                strokeWidth={activeLine === 'heartLine' ? '4' : '3'}
                strokeLinecap="round"
                strokeDasharray={activeLine === 'heartLine' ? '0' : '0'}
                className="transition-all duration-300"
              />
              <text 
                x="210" 
                y="100" 
                fill={activeLine === 'heartLine' || !activeLine ? '#e84393' : '#e8439380'} 
                fontSize="12" 
                fontWeight="bold"
                className="transition-all duration-300"
              >
                감정선
              </text>
              
              {/* 지능선/머리선 */}
              <path
                d="M80,130 C120,140 160,140 200,130"
                fill="none"
                stroke={activeLine === 'headLine' || !activeLine ? '#3498db' : '#3498db80'}
                strokeWidth={activeLine === 'headLine' ? '4' : '3'}
                strokeLinecap="round"
                strokeDasharray={activeLine === 'headLine' ? '0' : '0'}
                className="transition-all duration-300"
              />
              <text 
                x="210" 
                y="130" 
                fill={activeLine === 'headLine' || !activeLine ? '#3498db' : '#3498db80'} 
                fontSize="12" 
                fontWeight="bold"
                className="transition-all duration-300"
              >
                지능선
              </text>
              
              {/* 운명선 */}
              <path
                d="M150,180 C150,150 150,120 150,80"
                fill="none"
                stroke={activeLine === 'fateLine' || !activeLine ? '#9b59b6' : '#9b59b680'}
                strokeWidth={activeLine === 'fateLine' ? '4' : '3'}
                strokeLinecap="round"
                strokeDasharray={activeLine === 'fateLine' ? '0' : '0'}
                className="transition-all duration-300"
              />
              <text 
                x="155" 
                y="70" 
                fill={activeLine === 'fateLine' || !activeLine ? '#9b59b6' : '#9b59b680'} 
                fontSize="12" 
                fontWeight="bold"
                className="transition-all duration-300"
              >
                운명선
              </text>
              
              {/* 손가락 */}
              <path
                d="M100,30 C100,10 120,10 120,30 L120,60"
                fill="#f9e3d2"
                stroke="#e0c3b0"
                strokeWidth="2"
              />
              <path
                d="M130,20 C130,5 150,5 150,20 L150,50"
                fill="#f9e3d2"
                stroke="#e0c3b0"
                strokeWidth="2"
              />
              <path
                d="M160,20 C160,5 180,5 180,20 L180,55"
                fill="#f9e3d2"
                stroke="#e0c3b0"
                strokeWidth="2"
              />
              <path
                d="M190,30 C190,10 210,10 210,30 L210,65"
                fill="#f9e3d2"
                stroke="#e0c3b0"
                strokeWidth="2"
              />
              
              {/* 손금 위치 표시 */}
              {activeLine === 'lifeLine' && (
                <g>
                  <circle cx="100" cy="80" r="5" fill="#e74c3c" />
                  <text x="105" y="75" fill="#e74c3c" fontSize="10">시작점</text>
                  <circle cx="85" cy="200" r="5" fill="#e74c3c" />
                  <text x="90" y="205" fill="#e74c3c" fontSize="10">끝점</text>
                </g>
              )}
              
              {activeLine === 'heartLine' && (
                <g>
                  <circle cx="200" cy="100" r="5" fill="#e84393" />
                  <text x="205" y="95" fill="#e84393" fontSize="10">시작점</text>
                  <circle cx="80" cy="100" r="5" fill="#e84393" />
                  <text x="55" y="95" fill="#e84393" fontSize="10">끝점</text>
                </g>
              )}
              
              {activeLine === 'headLine' && (
                <g>
                  <circle cx="80" cy="130" r="5" fill="#3498db" />
                  <text x="55" y="125" fill="#3498db" fontSize="10">시작점</text>
                  <circle cx="200" cy="130" r="5" fill="#3498db" />
                  <text x="205" y="125" fill="#3498db" fontSize="10">끝점</text>
                </g>
              )}
              
              {activeLine === 'fateLine' && (
                <g>
                  <circle cx="150" cy="180" r="5" fill="#9b59b6" />
                  <text x="155" y="185" fill="#9b59b6" fontSize="10">시작점</text>
                  <circle cx="150" cy="80" r="5" fill="#9b59b6" />
                  <text x="155" y="75" fill="#9b59b6" fontSize="10">끝점</text>
                </g>
              )}
            </svg>
          </div>
          
          {/* 손금 선택 버튼 */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {palmLines.map((line) => (
              <motion.button
                key={line.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveLine(line.id === activeLine ? null : line.id)}
                className={`flex items-center p-2 rounded-lg transition-colors ${
                  line.id === activeLine 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <div className={`mr-2 ${line.id === activeLine ? 'text-white' : ''}`}>
                  {line.icon}
                </div>
                <span className="font-medium">{line.name}</span>
              </motion.button>
            ))}
          </div>
          
          {/* 선택된 손금 상세 정보 */}
          <motion.div 
            layout
            className="bg-gray-50 rounded-lg p-3 border border-gray-200"
          >
            {activeLine ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {palmLines.find(line => line.id === activeLine) && (
                  <>
                    <h5 className="font-semibold text-gray-800 mb-2 flex items-center">
                      {palmLines.find(line => line.id === activeLine)?.icon}
                      <span className="ml-2">{palmLines.find(line => line.id === activeLine)?.name}</span>
                    </h5>
                    <p className="text-sm text-gray-700 mb-2">
                      {palmLines.find(line => line.id === activeLine)?.description}
                    </p>
                    <p className="text-sm text-gray-600">
                      {palmLines.find(line => line.id === activeLine)?.details}
                    </p>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-sm text-gray-700">
                  위 버튼을 클릭하여 각 손금에 대한 상세 정보를 확인하세요.
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
        
        {/* 분석 팁 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-100"
        >
          <div className="flex items-start">
            <div className="bg-purple-100 rounded-full p-2 mr-3 flex-shrink-0">
              <Star className="text-purple-600" size={20} />
            </div>
            <div>
              <h4 className="text-base font-semibold text-purple-800 mb-2">손금 분석 팁</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span>왼손은 타고난 운명과 잠재력을, 오른손은 현재 만들어가는 운명을 나타냅니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span>주로 사용하는 손(오른손잡이는 오른손, 왼손잡이는 왼손)은 현재의 상태를 더 잘 반영합니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span>손금은 시간에 따라 변할 수 있으며, 이는 운명이 고정되어 있지 않고 변화할 수 있음을 의미합니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span>손금 분석은 자기 이해와 성찰의 도구로 활용하는 것이 좋습니다.</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
        
        {/* 주의사항 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-yellow-50 p-4 rounded-xl border border-yellow-100"
        >
          <div className="flex items-start">
            <div className="bg-yellow-100 rounded-full p-2 mr-3 flex-shrink-0">
              <AlertCircle className="text-yellow-600" size={20} />
            </div>
            <div>
              <h4 className="text-base font-semibold text-yellow-800 mb-2">AI 분석 안내</h4>
              <p className="text-sm text-gray-700 mb-2">
                AI는 제공된 이미지에서 손금 선을 자동으로 감지하여 분석합니다. 최상의 결과를 얻기 위해서는:
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span>선명하고 밝은 이미지를 제공하세요.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span>손금이 잘 보이도록 손바닥을 완전히 펴주세요.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span>이미지에 손바닥만 포함되도록 하세요.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span>분석 결과가 만족스럽지 않다면, 다른 각도나 조명에서 다시 시도해보세요.</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
      
      <div className="bg-gray-50 px-4 py-3 text-center border-t border-gray-100">
        <p className="text-xs text-gray-500">
          이 분석은 재미로만 봐주세요. 실제 운세나 미래를 예측하지 않습니다.
        </p>
      </div>
    </div>
  );
} 
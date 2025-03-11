import React from 'react';

export default function PalmistryGuide() {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="bg-indigo-600 px-4 py-3">
        <h3 className="text-white font-semibold text-sm flex items-center">
          <span className="mr-2">✋</span>
          손금 분석 가이드
        </h3>
      </div>
      
      <div className="p-4">
        <div className="flex items-start mb-4">
          <div className="bg-indigo-100 rounded-full p-2 mr-3 flex-shrink-0">
            <span className="text-indigo-600 text-lg">1</span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-1">좋은 손금 사진 찍기</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              밝은 곳에서 손바닥을 펴고 손금이 잘 보이도록 촬영하세요. 그림자가 생기지 않도록 주의하세요.
            </p>
          </div>
        </div>
        
        <div className="flex items-start mb-4">
          <div className="bg-indigo-100 rounded-full p-2 mr-3 flex-shrink-0">
            <span className="text-indigo-600 text-lg">2</span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-1">주요 손금 알아보기</h4>
            <div className="relative h-48 w-full mb-2 bg-gray-50 rounded-lg overflow-hidden p-2">
              {/* 손바닥 SVG 이미지 */}
              <svg
                viewBox="0 0 300 300"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                {/* 손바닥 배경 */}
                <path
                  d="M150,20 C80,20 50,100 50,180 C50,240 90,280 150,280 C210,280 250,240 250,180 C250,100 220,20 150,20 Z"
                  fill="#f9e3d2"
                  stroke="#e0c3b0"
                  strokeWidth="2"
                />
                
                {/* 생명선 */}
                <path
                  d="M100,80 C90,120 85,160 85,200"
                  fill="none"
                  stroke="#e74c3c"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <text x="70" y="220" fill="#e74c3c" fontSize="12" fontWeight="bold">생명선</text>
                
                {/* 감정선/사랑선 */}
                <path
                  d="M80,100 C120,90 160,90 200,100"
                  fill="none"
                  stroke="#e84393"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <text x="210" y="100" fill="#e84393" fontSize="12" fontWeight="bold">감정선</text>
                
                {/* 지능선/머리선 */}
                <path
                  d="M80,130 C120,140 160,140 200,130"
                  fill="none"
                  stroke="#3498db"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <text x="210" y="130" fill="#3498db" fontSize="12" fontWeight="bold">지능선</text>
                
                {/* 운명선 */}
                <path
                  d="M150,180 C150,150 150,120 150,80"
                  fill="none"
                  stroke="#9b59b6"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <text x="155" y="70" fill="#9b59b6" fontSize="12" fontWeight="bold">운명선</text>
                
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
              </svg>
            </div>
            <ul className="text-xs text-gray-600 space-y-1">
              <li className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                <span className="font-medium text-red-700">생명선</span>: 엄지와 검지 사이에서 시작하여 손목 방향으로 내려가는 선
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-pink-500 mr-1"></span>
                <span className="font-medium text-pink-700">감정선/사랑선</span>: 새끼손가락 아래에서 시작하여 손바닥을 가로지르는 선
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
                <span className="font-medium text-blue-700">지능선/머리선</span>: 검지와 엄지 사이에서 시작하여 손바닥을 가로지르는 선
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-purple-500 mr-1"></span>
                <span className="font-medium text-purple-700">운명선</span>: 손목에서 시작하여 중지 방향으로 올라가는 세로선
              </li>
            </ul>
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="bg-indigo-100 rounded-full p-2 mr-3 flex-shrink-0">
            <span className="text-indigo-600 text-lg">3</span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-1">분석 팁</h4>
            <ul className="text-xs text-gray-600 space-y-1.5">
              <li className="flex items-start">
                <span className="text-indigo-500 mr-1">•</span>
                <span>왼손은 타고난 운명, 오른손은 현재 만들어가는 운명을 나타냅니다.</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-500 mr-1">•</span>
                <span>주로 사용하는 손(오른손잡이는 오른손, 왼손잡이는 왼손)을 분석하는 것이 좋습니다.</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-500 mr-1">•</span>
                <span>손금은 시간에 따라 변할 수 있으며, 이는 운명이 고정되어 있지 않다는 것을 의미합니다.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 px-4 py-3 text-center">
        <p className="text-xs text-gray-500">
          이 분석은 재미로만 봐주세요. 실제 운세나 미래를 예측하지 않습니다.
        </p>
      </div>
    </div>
  );
} 
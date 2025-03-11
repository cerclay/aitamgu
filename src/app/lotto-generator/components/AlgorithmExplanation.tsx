'use client';

export default function AlgorithmExplanation() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">알고리즘 설명</h2>
      <div className="space-y-3 text-gray-600">
        <p>각 추천 방식은 과거 당첨 데이터와 통계적 분석을 기반으로 합니다:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <span className="font-medium">최근 미출현 번호</span>: 
            최근 50회차 동안 출현하지 않은 번호를 분석하여 당첨 확률이 높아질 수 있는 번호를 추천합니다.
          </li>
          <li>
            <span className="font-medium">최근 가장 자주 나온 번호</span>: 
            최근 50회차에서 가장 많이 출현한 번호를 분석하여 핫 넘버를 추천합니다.
          </li>
          <li>
            <span className="font-medium">번호 패턴 분석</span>: 
            연속된 번호, 동일한 끝자리, 특정 구간의 번호 분포 등 다양한 패턴을 분석하여 균형 잡힌 번호를 추천합니다.
          </li>
          <li>
            <span className="font-medium">나만의 행운의 번호</span>: 
            생년월일과 행운의 숫자를 기반으로 개인화된 번호를 추천합니다. 생년월일의 각 숫자와 행운의 숫자를 조합하여 의미 있는 번호를 생성합니다.
          </li>
          <li>
            <span className="font-medium">AI 기반 추천</span>: 
            인공지능이 과거의 모든 당첨 데이터를 분석하여 패턴을 찾고, 이를 기반으로 가장 확률이 높은 번호 조합을 추천합니다.
          </li>
        </ul>
        
        <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
          <h3 className="text-lg font-semibold text-indigo-800 mb-2">번호 선택 시 고려사항</h3>
          <ul className="list-disc pl-5 space-y-1 text-indigo-700">
            <li>홀짝 번호의 균형</li>
            <li>고저 번호의 분포</li>
            <li>연속된 번호의 개수</li>
            <li>끝자리 숫자의 다양성</li>
            <li>구간별 번호 분포</li>
          </ul>
        </div>
        
        <p className="italic mt-4 text-sm bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          ※ 모든 번호는 확률적으로 동일한 당첨 가능성을 가지며, 본 서비스는 참고용으로만 사용하시기 바랍니다.
          과도한 구매는 자제해 주시기 바랍니다.
        </p>
      </div>
    </div>
  );
} 
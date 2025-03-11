'use client';

interface PersonalLuckyNumberProps {
  birthdate: string;
  setBirthdate: (value: string) => void;
  luckyNumber: string;
  setLuckyNumber: (value: string) => void;
}

export default function PersonalLuckyNumber({
  birthdate,
  setBirthdate,
  luckyNumber,
  setLuckyNumber
}: PersonalLuckyNumberProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">나만의 행운의 숫자</h2>
      <p className="text-gray-600 mb-6">
        생년월일과 행운의 숫자를 입력하시면 더 정확한 번호를 추천해 드립니다.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-2">
            생년월일
          </label>
          <input
            type="date"
            id="birthdate"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
          <p className="mt-2 text-sm text-gray-500">
            생년월일을 기반으로 행운의 숫자를 분석합니다.
          </p>
        </div>
        
        <div>
          <label htmlFor="luckyNumber" className="block text-sm font-medium text-gray-700 mb-2">
            행운의 숫자 (1-45)
          </label>
          <input
            type="number"
            id="luckyNumber"
            min="1"
            max="45"
            value={luckyNumber}
            onChange={(e) => {
              const value = e.target.value;
              if (!value || (parseInt(value) >= 1 && parseInt(value) <= 45)) {
                setLuckyNumber(value);
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="1-45 사이의 숫자를 입력하세요"
          />
          <p className="mt-2 text-sm text-gray-500">
            당신이 생각하는 행운의 숫자를 입력하세요.
          </p>
        </div>
      </div>
    </div>
  );
} 
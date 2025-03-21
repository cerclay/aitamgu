export interface PillData {
  // 기본 정보
  itemName: string;           // 품목명
  entpName: string;          // 제조사명
  itemImage?: string;         // 이미지 URL
  className?: string;         // 분류명
  etcOtcName?: string;        // 전문/일반 구분

  // 외형 정보
  color?: string;             // 색상
  shape?: string;             // 모양
  mark?: string;             // 각인
  drugLine?: string;         // 분할선
  
  // 크기 정보
  lengLong?: string;         // 장축
  lengShort?: string;        // 단축
  thick?: string;           // 두께
  
  // 상세 정보
  itemIngredient?: string;   // 성분
  efficacy?: string;        // 효능
  useMethod?: string;       // 용법
  caution?: string;         // 주의사항
  interaction?: string;     // 상호작용
  sideEffect?: string;      // 부작용
  
  // 유효기간 및 갱신일
  validTerm?: string;        // 유효기간
  updateDe?: string;         // 수정일
  
  // 분석 결과
  confidence?: number;       // 인식 신뢰도 (0-100)
  similarItems?: PillData[];  // 유사한 알약 목록
  otcName?: string;          // 전문/일반 구분
  markCode?: string;         // 표시코드
  markFront?: string;        // 앞면 각인
  markBack?: string;         // 뒷면 각인
  drugShape?: string;        // 의약품 모양
  chart?: string;            // 성상
  printFront?: string;       // 앞면 표시
  printBack?: string;        // 뒷면 표시
  imgRegistTs?: string;      // 이미지 등록일
  itemSeq?: string;          // 품목일련번호
}

export interface PillAnalysisResponse {
  success: boolean;
  data?: PillData;
  error?: string;
  alternatives?: PillData[];  // 유사한 알약 목록
}

export interface PillSearchParams {
  itemName?: string;       // 약품명
  entpName?: string;       // 제조업체
  color?: string;          // 색상
  shape?: string;          // 모양
  mark?: string;           // 각인
  className?: string;      // 분류
  etcOtcName?: string;     // 전문/일반 구분
}

export interface PillAnalysisError {
  message: string;
  details?: string;
  suggestion?: string;
} 
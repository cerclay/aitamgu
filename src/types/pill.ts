export interface PillData {
  itemName: string;         // 약품명
  entpName: string;         // 제조업체
  itemImage: string;        // 약품 이미지 URL
  efcyQesitm: string;       // 효능
  useMethodQesitm: string;  // 사용법
  atpnWarnQesitm: string;   // 주의사항
  atpnQesitm: string;       // 부작용
  intrcQesitm: string;      // 상호작용
  depositMethodQesitm: string; // 보관법
  itemIngredient: string;   // 성분
  confidence: number;       // 인식 신뢰도 (0-100)
  color: string;            // 색상
  shape: string;            // 모양
  mark: string;             // 각인
  className: string;        // 분류
  otcName: string;          // 전문/일반 구분
  etcOtcName: string;       // 전문/일반 구분 상세
  validTerm: string;        // 유효기간
  markCode: string;         // 표시코드
  markFront: string;        // 앞면 각인
  markBack: string;         // 뒷면 각인
  drugShape: string;        // 의약품 모양
  chart: string;            // 성상
  printFront: string;       // 앞면 표시
  printBack: string;        // 뒷면 표시
  drugLine: string;         // 분할선
  lengLong: string;         // 장축
  lengShort: string;        // 단축
  thick: string;            // 두께
  imgRegistTs: string;      // 이미지 등록일
  updateDe: string;         // 수정일
  itemSeq: string;          // 품목일련번호
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
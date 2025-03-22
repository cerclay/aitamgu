'use client';

import { createClient } from '@/lib/supabase/client';
import { BLOG_ADMIN_PASSWORD_KEY } from '../constants';

const supabase = createClient();

// 비밀번호 해싱 함수 (실제 구현에서는 더 안전한 해싱 라이브러리 사용 권장)
const hashPassword = (password: string): string => {
  // 간단한 예시용 해싱 (실제로는 bcrypt 등 사용 권장)
  return btoa(password); // Base64 인코딩 (실제 구현에서는 절대 사용하지 마세요)
};

// 서버에서 비밀번호 검증
export const verifyAdminPasswordFromServer = async (password: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', BLOG_ADMIN_PASSWORD_KEY)
    .single();
  
  if (error || !data) {
    console.error('비밀번호 검증 오류:', error);
    return false;
  }
  
  // 비밀번호 비교 (실제로는 해시된 값을 비교해야 함)
  return data.value === password;
};

// 클라이언트 측 캐싱 (UX 개선용)
export const verifyAdminPassword = async (password: string): Promise<boolean> => {
  // 이전에 인증된 경우 로컬 캐싱 활용
  if (typeof window !== 'undefined') {
    const cachedAuth = localStorage.getItem('admin_auth_status');
    if (cachedAuth === 'true') {
      return true;
    }
  }
  
  // 서버에서 검증
  const isValid = await verifyAdminPasswordFromServer(password);
  
  // 성공 시 캐싱
  if (isValid && typeof window !== 'undefined') {
    localStorage.setItem('admin_auth_status', 'true');
    // 보안을 위해 세션 만료 시간 설정 (예: 1시간)
    setTimeout(() => {
      localStorage.removeItem('admin_auth_status');
    }, 60 * 60 * 1000);
  }
  
  return isValid;
};

// 관리자 인증 상태 확인
export const isAdminAuthenticated = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  return localStorage.getItem('admin_auth_status') === 'true';
};

// 로그아웃
export const adminLogout = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem('admin_auth_status');
};

// 관리자 비밀번호 변경
export const changeAdminPassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
  // 현재 비밀번호 검증
  const isValid = await verifyAdminPasswordFromServer(currentPassword);
  
  if (!isValid) {
    return false;
  }
  
  // 새 비밀번호 저장 (실제로는 해시 처리)
  const { error } = await supabase
    .from('system_settings')
    .update({ 
      value: newPassword,
      updated_at: new Date().toISOString() 
    })
    .eq('key', BLOG_ADMIN_PASSWORD_KEY);
  
  if (error) {
    console.error('비밀번호 변경 오류:', error);
    return false;
  }
  
  return true;
}; 
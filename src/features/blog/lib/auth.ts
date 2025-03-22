'use client';

import { createClient } from '@/lib/supabase/client';
import { BLOG_ADMIN_PASSWORD_KEY } from '../constants';

// Supabase 클라이언트는 클라이언트 측에서만 초기화
let supabase: ReturnType<typeof createClient> | null = null;

// 클라이언트 측에서만 Supabase 클라이언트 초기화
const getSupabaseClient = () => {
  if (typeof window !== 'undefined' && !supabase) {
    supabase = createClient();
  }
  return supabase;
};

// 비밀번호 해싱 함수 (실제 구현에서는 더 안전한 해싱 라이브러리 사용 권장)
const hashPassword = (password: string): string => {
  // 간단한 예시용 해싱 (실제로는 bcrypt 등 사용 권장)
  return btoa(password); // Base64 인코딩 (실제 구현에서는 절대 사용하지 마세요)
};

// 서버에서 비밀번호 검증
export const verifyAdminPasswordFromServer = async (password: string): Promise<boolean> => {
  const client = getSupabaseClient();
  
  if (!client) {
    // 클라이언트 사이드 스토리지에서 읽기
    if (typeof window !== 'undefined') {
      const savedHash = localStorage.getItem(BLOG_ADMIN_PASSWORD_KEY);
      if (!savedHash) return false;
      return savedHash === hashPassword(password);
    }
    return false;
  }
  
  const { data, error } = await client
    .from('system_settings')
    .select('value')
    .eq('key', BLOG_ADMIN_PASSWORD_KEY)
    .single();
  
  if (error || !data) {
    return false;
  }
  
  return data.value === hashPassword(password);
};

// 관리자 비밀번호 설정 
export const setAdminPassword = async (password: string): Promise<boolean> => {
  const client = getSupabaseClient();
  const hashedPassword = hashPassword(password);
  
  if (!client) {
    // 클라이언트 사이드 스토리지에 저장
    if (typeof window !== 'undefined') {
      localStorage.setItem(BLOG_ADMIN_PASSWORD_KEY, hashedPassword);
      return true;
    }
    return false;
  }
  
  // 기존 비밀번호 확인
  const { data, error } = await client
    .from('system_settings')
    .select('id')
    .eq('key', BLOG_ADMIN_PASSWORD_KEY)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('비밀번호 검사 오류:', error);
    return false;
  }
  
  if (data) {
    // 새 비밀번호 저장 (실제로는 해시 처리)
    const { error } = await client
      .from('system_settings')
      .update({ 
        value: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('key', BLOG_ADMIN_PASSWORD_KEY);
    
    if (error) {
      console.error('비밀번호 업데이트 오류:', error);
      return false;
    }
    
    return true;
  } else {
    // 비밀번호 신규 생성
    const { error } = await client
      .from('system_settings')
      .insert([
        { 
          key: BLOG_ADMIN_PASSWORD_KEY, 
          value: hashedPassword,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    
    if (error) {
      console.error('비밀번호 저장 오류:', error);
      return false;
    }
    
    return true;
  }
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
  const { error } = await getSupabaseClient()
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
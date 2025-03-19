'use client';

import { BLOG_ADMIN_PASSWORD_KEY } from '../constants';

// 관리자 비밀번호 설정
export const setAdminPassword = (password: string): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  // 실제 제품에서는 해시 처리를 해야 하지만, 간단한 구현을 위해 평문 저장
  localStorage.setItem(BLOG_ADMIN_PASSWORD_KEY, password);
};

// 관리자 비밀번호 검증
export const verifyAdminPassword = (password: string): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  const storedPassword = localStorage.getItem(BLOG_ADMIN_PASSWORD_KEY);
  
  // 초기 비밀번호가 설정되어 있지 않다면 첫 번째 사용자를 관리자로 설정
  if (!storedPassword) {
    setAdminPassword(password);
    return true;
  }
  
  return storedPassword === password;
};

// 관리자 비밀번호가 설정되어 있는지 확인
export const isAdminPasswordSet = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  return !!localStorage.getItem(BLOG_ADMIN_PASSWORD_KEY);
}; 
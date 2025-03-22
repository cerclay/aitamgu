'use client';

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // 브라우저에서만 실행되도록 합니다
  if (typeof window === 'undefined') {
    // 서버 측에서는 더미 클라이언트를 반환
    return {
      from: () => ({
        select: () => ({
          order: () => ({
            data: [],
            error: null
          }),
          eq: () => ({
            single: () => ({
              data: null,
              error: null
            }),
            data: [],
            error: null
          }),
        }),
        insert: () => ({
          select: () => ({
            single: () => ({
              data: { id: 'dummy-id' },
              error: null
            })
          })
        }),
        update: () => ({
          eq: () => ({
            data: null,
            error: null
          })
        }),
        delete: () => ({
          eq: () => ({
            data: null,
            error: null
          })
        })
      })
    } as any;
  }

  // 환경 변수가 없는 경우 빈 값으로 설정
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy-url.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

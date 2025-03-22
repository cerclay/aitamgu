-- 블로그 포스트 테이블 생성
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 블로그 관리자 비밀번호 저장을 위한 시스템 설정 테이블
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 비밀번호 초기값 설정 (실제 배포 시에는 변경하세요)
INSERT INTO system_settings (key, value) 
VALUES ('blog_admin_password', 'your-secure-password-here')
ON CONFLICT (key) DO NOTHING;
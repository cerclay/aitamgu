-- 기존 RLS 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS blog_posts_read_policy ON blog_posts;

-- 블로그 테이블에 summary, thumbnailUrl, published 필드가 없는 경우 추가
DO $$
BEGIN
  -- summary 필드 추가 (없는 경우)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'blog_posts' AND column_name = 'summary'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN summary TEXT;
  END IF;

  -- thumbnailUrl 필드 추가 (없는 경우)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'blog_posts' AND column_name = 'thumbnailUrl'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN thumbnailUrl TEXT;
  END IF;

  -- published 필드 추가 (없는 경우)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'blog_posts' AND column_name = 'published'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN published BOOLEAN DEFAULT true;
  END IF;
END
$$;

-- published가 true인 포스트는 누구나 읽을 수 있도록 정책 설정 (컬럼 추가 후)
CREATE POLICY blog_posts_read_policy ON blog_posts 
  FOR SELECT
  USING (published = true); 
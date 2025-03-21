-- 대분류 테이블 생성
CREATE TABLE IF NOT EXISTS public.rule_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 규정 테이블 생성
CREATE TABLE IF NOT EXISTS public.rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.rule_categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- updated_at 자동 업데이트를 위한 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
DROP TRIGGER IF EXISTS update_rule_categories_updated_at ON public.rule_categories;
CREATE TRIGGER update_rule_categories_updated_at
    BEFORE UPDATE ON public.rule_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rules_updated_at ON public.rules;
CREATE TRIGGER update_rules_updated_at
    BEFORE UPDATE ON public.rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 삽입
INSERT INTO public.rule_categories (name, description) VALUES
    ('인사규정', '직원 채용, 평가, 승진 등에 관한 규정'),
    ('보안규정', '회사 정보 보안 및 관리에 관한 규정'),
    ('복무규정', '근무시간, 휴가, 복리후생 등에 관한 규정')
ON CONFLICT DO NOTHING;

-- 샘플 규정 데이터
WITH category_ids AS (
    SELECT id, name FROM public.rule_categories
)
INSERT INTO public.rules (category_id, title, content, keywords) 
SELECT 
    c.id,
    CASE 
        WHEN c.name = '인사규정' THEN '신규 채용 절차'
        WHEN c.name = '보안규정' THEN '정보 보안 기본 수칙'
        ELSE '근무시간 및 휴게시간'
    END,
    CASE 
        WHEN c.name = '인사규정' THEN '1. 채용 공고 게시\n2. 서류 전형\n3. 면접 전형\n4. 최종 합격\n5. 입사 절차'
        WHEN c.name = '보안규정' THEN '1. 비밀번호 관리\n2. 문서 보안\n3. 시설 보안\n4. 정보 유출 방지'
        ELSE '1. 기본 근무시간: 09:00-18:00\n2. 휴게시간: 12:00-13:00\n3. 유연근무제 운영'
    END,
    CASE 
        WHEN c.name = '인사규정' THEN ARRAY['채용', '면접', '입사']
        WHEN c.name = '보안규정' THEN ARRAY['보안', '비밀번호', '정보보호']
        ELSE ARRAY['근무시간', '휴게', '유연근무']
    END
FROM category_ids c
ON CONFLICT DO NOTHING; 
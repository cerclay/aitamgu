This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
#   a i t a m g u  
 
## Google Analytics 사용법

이 프로젝트는 Google Analytics(GA4)가 설정되어 있습니다. 측정 ID: `G-F7BD5N159L`

### 페이지 추적
페이지 추적은 자동으로 설정되어 있습니다.

### 이벤트 추적
이벤트를 추적하려면 다음과 같이 사용하세요:

```javascript
import { event } from './app/gtag';

// 이벤트 추적
event({
  action: '버튼_클릭',
  category: '사용자_상호작용',
  label: '로그인_버튼',
  value: 1
});
```

## Microsoft Clarity 사용법

이 프로젝트는 Microsoft Clarity가 설정되어 있습니다. 프로젝트 ID: `qs1ggzx0h0`

Microsoft Clarity는 사용자 행동 분석 도구로, 별도의 코드 없이 자동으로 사용자 세션을 기록하고 히트맵, 세션 재생 등의 기능을 제공합니다.

Clarity 컴포넌트는 `src/third-parties/Clarity.tsx`에 위치하며, `layout.tsx`에 자동으로 추가되었습니다.

자세한 내용은 [Microsoft Clarity 공식 문서](https://docs.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup)를 참조하세요.

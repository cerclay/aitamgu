interface KakaoShare {
  sendDefault: (options: {
    objectType: string;
    content: {
      title: string;
      description: string;
      imageUrl?: string;
      link: {
        mobileWebUrl: string;
        webUrl: string;
      };
    };
    buttons?: Array<{
      title: string;
      link: {
        mobileWebUrl: string;
        webUrl: string;
      };
    }>;
  }) => void;
}

interface KakaoSDK {
  init: (key: string) => void;
  isInitialized: () => boolean;
  Link: KakaoShare;
  Share: KakaoShare;
}

declare global {
  interface Window {
    Kakao: KakaoSDK;
  }
} 
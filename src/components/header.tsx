'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

function Header() {
  const { toast } = useToast();

  const copyEmail = () => {
    navigator.clipboard.writeText('cerclay92@gmail.com');
    toast({
      description: "이메일 주소가 복사되었습니다.",
      duration: 2000,
    });
  };

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold">AI 탐구생활</span>
          </Link>
        </div>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <button
            onClick={() => scrollToSection('ai-services')}
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            AI 서비스
          </button>
          <button
            onClick={() => scrollToSection('gpts')}
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            GPTs
          </button>
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={copyEmail}
          >
            <Mail className="h-4 w-4" />
            <span>Contact</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Header; 
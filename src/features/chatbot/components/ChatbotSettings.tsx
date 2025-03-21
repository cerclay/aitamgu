'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';

interface ChatbotSettingsProps {
  onSave: (settings: ChatbotSettings) => void;
}

export interface ChatbotSettings {
  name: string;
  description: string;
  welcomeMessage: string;
  isActive: boolean;
}

export function ChatbotSettings({ onSave }: ChatbotSettingsProps) {
  const [settings, setSettings] = useState<ChatbotSettings>({
    name: '',
    description: '',
    welcomeMessage: '',
    isActive: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>챗봇 설정</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">챗봇 이름</Label>
            <Input
              id="name"
              value={settings.name}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="예: 고객 지원 봇"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={settings.description}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="챗봇의 목적과 기능을 설명해주세요"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcomeMessage">환영 메시지</Label>
            <Textarea
              id="welcomeMessage"
              value={settings.welcomeMessage}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  welcomeMessage: e.target.value,
                }))
              }
              placeholder="사용자에게 처음 보여질 메시지를 입력하세요"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">활성화 상태</Label>
            <Switch
              id="isActive"
              checked={settings.isActive}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, isActive: checked }))
              }
            />
          </div>

          <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
            설정 저장
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 
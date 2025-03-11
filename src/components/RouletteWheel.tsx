'use client';

import React, { useEffect, useRef } from 'react';

interface RouletteWheelProps {
  items: Array<{
    name: string;
    category: string;
  }>;
  spinning: boolean;
  selectedIndex: number;
  onSpinEnd: () => void;
}

const RouletteWheel: React.FC<RouletteWheelProps> = ({
  items,
  spinning,
  selectedIndex,
  onSpinEnd
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentRotation = useRef(0);
  const startTime = useRef<number | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawWheel = (rotation: number) => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 20;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 외부 그라데이션 원
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#f97316');
      gradient.addColorStop(1, '#fb923c');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 10, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // 내부 흰색 원
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 룰렛 섹션 그리기
      items.forEach((item, index) => {
        const angle = (2 * Math.PI) / items.length;
        const startAngle = index * angle + rotation;
        const endAngle = (index + 1) * angle + rotation;

        // 섹션 그리기
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();

        // 그라데이션 적용
        const sectionGradient = ctx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, radius
        );
        
        if (index % 2 === 0) {
          sectionGradient.addColorStop(0, '#f97316');
          sectionGradient.addColorStop(1, '#fb923c');
        } else {
          sectionGradient.addColorStop(0, '#fb923c');
          sectionGradient.addColorStop(1, '#fdba74');
        }

        ctx.fillStyle = sectionGradient;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 텍스트 그리기
        ctx.save();
        ctx.translate(
          centerX + (radius * 0.65) * Math.cos(startAngle + angle / 2),
          centerY + (radius * 0.65) * Math.sin(startAngle + angle / 2)
        );
        ctx.rotate(startAngle + angle / 2 + Math.PI / 2);
        
        // 텍스트 그림자
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.font = 'bold 14px Pretendard';
        ctx.textAlign = 'center';
        ctx.fillText(item.name, 1, 1);
        
        // 실제 텍스트
        ctx.fillStyle = 'white';
        ctx.fillText(item.name, 0, 0);
        ctx.restore();
      });

      // 중앙 원
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 화살표 그리기
      ctx.beginPath();
      ctx.moveTo(centerX + radius - 5, centerY);
      ctx.lineTo(centerX + radius + 25, centerY - 15);
      ctx.lineTo(centerX + radius + 25, centerY + 15);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 빛나는 효과
      if (spinning) {
        const glowGradient = ctx.createRadialGradient(
          centerX, centerY, radius - 20,
          centerX, centerY, radius + 20
        );
        glowGradient.addColorStop(0, 'rgba(249, 115, 22, 0)');
        glowGradient.addColorStop(0.5, 'rgba(249, 115, 22, 0.1)');
        glowGradient.addColorStop(1, 'rgba(249, 115, 22, 0)');
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 20, 0, 2 * Math.PI);
        ctx.fillStyle = glowGradient;
        ctx.fill();
      }
    };

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = timestamp - startTime.current;
      
      // 총 애니메이션 시간 (4초)
      const duration = 4000;
      
      if (progress < duration) {
        // 이징 함수 적용
        const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
        const t = progress / duration;
        
        // 최종 회전 각도 계산 (기본 4바퀴 + 선택된 메뉴 위치)
        const targetAngle = (2 * Math.PI * 4) + (selectedIndex * (2 * Math.PI / items.length));
        const currentAngle = targetAngle * easeOut(t);
        
        currentRotation.current = currentAngle;
        drawWheel(currentAngle);
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // 애니메이션 종료
        const finalAngle = (2 * Math.PI * 4) + (selectedIndex * (2 * Math.PI / items.length));
        currentRotation.current = finalAngle;
        drawWheel(finalAngle);
        onSpinEnd();
      }
    };

    // 초기 룰렛 그리기
    drawWheel(currentRotation.current);

    // 스핀 시작
    if (spinning) {
      startTime.current = null;
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [items, spinning, selectedIndex, onSpinEnd]);

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-full blur-2xl"></div>
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="relative z-10 max-w-full h-auto"
      />
    </div>
  );
};

export default RouletteWheel; 
'use client';

import { useRef, useEffect, useState } from 'react';
import { X, Camera } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageBlob: Blob) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError('카메라를 시작할 수 없습니다.');
        console.error('Camera error:', err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            onCapture(blob);
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {error ? (
        <div className="flex-1 flex items-center justify-center text-white">
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="relative flex-1">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="p-4 bg-black/50 flex justify-between items-center">
            <button
              onClick={onClose}
              className="p-2 text-white hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
            <button
              onClick={captureImage}
              className="p-4 bg-white rounded-full hover:bg-gray-100"
            >
              <Camera className="w-6 h-6" />
            </button>
            <div className="w-10" /> {/* 균형을 위한 빈 공간 */}
          </div>
        </>
      )}
    </div>
  );
} 
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Camera, Upload, Image, RefreshCw, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';

interface PillCameraCardProps {
  onPillAnalysis: (imageFile: File) => Promise<void>;
  isLoading: boolean;
}

export function PillCameraCard({ onPillAnalysis, isLoading }: PillCameraCardProps) {
  const [activeTab, setActiveTab] = useState('upload');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    // 이미지 파일 유효성 검사
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    // 이미지 품질 확인을 위한 추가 검사
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      // 이미지 크기가 너무 작은 경우
      if (img.width < 200 || img.height < 200) {
        setError('이미지 해상도가 너무 낮습니다. 더 선명한 이미지를 사용해주세요.');
        URL.revokeObjectURL(objectUrl);
        return;
      }
      
      setError(null);
      setPreviewUrl(objectUrl);
    };
    
    img.onerror = () => {
      setError('이미지를 로드할 수 없습니다. 다른 이미지를 시도해주세요.');
      URL.revokeObjectURL(objectUrl);
    };
    
    img.src = objectUrl;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = () => {
    if (!fileInputRef.current?.files?.[0]) {
      setError('이미지를 선택해주세요.');
      return;
    }
    
    try {
      onPillAnalysis(fileInputRef.current.files[0])
        .catch(err => {
          console.error('알약 분석 중 오류:', err);
          setError('알약 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
        });
    } catch (err) {
      console.error('알약 분석 중 오류:', err);
      setError('알약 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const startCamera = useCallback(async () => {
    try {
      if (videoRef.current) {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('카메라 접근 실패:', err);
      setCameraError('카메라에 접근할 수 없습니다. 카메라 권한을 확인해주세요.');
      setIsStreaming(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsStreaming(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, []);

  const switchCamera = useCallback(async () => {
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 300);
  }, [startCamera, stopCamera]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // 비디오 크기에 맞게 캔버스 설정
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // 비디오 프레임을 캔버스에 그리기
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 캔버스 이미지를 데이터 URL로 변환
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setPreviewUrl(dataUrl);
    
    // 데이터 URL을 Blob으로 변환하여 File 객체 생성
    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          const file = new File([blob], 'pill-image.jpg', { type: 'image/jpeg' });
          await onPillAnalysis(file);
        } catch (err) {
          console.error('알약 분석 중 오류:', err);
          setError('알약 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
      } else {
        setError('이미지 생성에 실패했습니다. 다시 시도해주세요.');
      }
    }, 'image/jpeg', 0.95);
    
    // 카메라 중지
    stopCamera();
  }, [isStreaming, onPillAnalysis, stopCamera]);

  // 탭 변경 시 카메라 시작/중지
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
  };

  // 컴포넌트 언마운트 시 카메라 중지
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <Card className="w-full overflow-hidden border-2 border-blue-100 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center text-blue-700">
          <Camera className="mr-2 h-5 w-5" />
          알약 이미지 분석
        </CardTitle>
        <CardDescription>
          알약 이미지를 업로드하거나 카메라로 촬영하여 분석해보세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none">
            <TabsTrigger value="upload" className="data-[state=active]:bg-blue-50 py-3">
              <Upload className="mr-2 h-4 w-4" />
              이미지 업로드
            </TabsTrigger>
            <TabsTrigger value="camera" className="data-[state=active]:bg-blue-50 py-3">
              <Camera className="mr-2 h-4 w-4" />
              카메라 촬영
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="p-6 space-y-4">
            <div 
              className={`border-2 border-dashed rounded-lg p-6 transition-all ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center text-center">
                <Image className="h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">이미지 업로드</h3>
                <p className="text-sm text-gray-500 mb-4">
                  이미지를 드래그하여 놓거나 파일을 선택하세요
                </p>
                <Input
                  id="pill-image"
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  disabled={isLoading}
                  className="hidden"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  variant="outline"
                  disabled={isLoading}
                >
                  파일 선택
                </Button>
              </div>
            </div>
            
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {previewUrl && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-4"
                >
                  <p className="text-sm text-gray-500 mb-2 flex items-center">
                    <Image className="h-4 w-4 mr-1" />
                    미리보기
                  </p>
                  <div className="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-md border shadow-sm">
                    <img
                      src={previewUrl}
                      alt="알약 미리보기"
                      className="h-full w-full object-contain"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
          
          <TabsContent value="camera" className="space-y-4 p-6">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-black shadow-sm">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {isStreaming && (
                <div className="absolute bottom-4 right-4">
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    onClick={switchCamera}
                    className="rounded-full bg-white/80 backdrop-blur-sm hover:bg-white"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {!isStreaming && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <div className="text-center text-white">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>카메라 연결 중...</p>
                  </div>
                </div>
              )}
            </div>
            
            <AnimatePresence>
              {cameraError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{cameraError}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {previewUrl && activeTab === 'camera' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-4"
                >
                  <p className="text-sm text-gray-500 mb-2 flex items-center">
                    <Image className="h-4 w-4 mr-1" />
                    촬영된 이미지
                  </p>
                  <div className="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-md border shadow-sm">
                    <img
                      src={previewUrl}
                      alt="알약 미리보기"
                      className="h-full w-full object-contain"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        {activeTab === 'upload' ? (
          <Button 
            onClick={handleUpload} 
            disabled={!previewUrl || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                알약 분석하기
              </>
            )}
          </Button>
        ) : (
          <Button 
            onClick={captureImage} 
            disabled={!isStreaming || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                사진 촬영하기
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 
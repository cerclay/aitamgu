'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Camera, FileUp, Upload, ImageIcon, RefreshCw, X, ZoomIn, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';

interface PillCameraCardProps {
  onPillAnalysis: (file: File) => Promise<void>;
  isLoading: boolean;
}

export function PillCameraCard({ onPillAnalysis, isLoading }: PillCameraCardProps) {
  const [activeTab, setActiveTab] = useState('upload');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // 파일 입력 필드 초기화
  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setPreviewUrl(null);
    setError(null);
  };
  
  // 파일 선택 시 미리보기 생성
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 업로드할 수 있습니다.');
        resetFileInput();
        return;
      }
      
      // 파일 크기 제한 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('파일 크기는 10MB 이하여야 합니다.');
        resetFileInput();
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = () => {
    if (!fileInputRef.current?.files?.[0]) {
      setError('이미지를 선택해주세요.');
      return;
    }
    
    onPillAnalysis(fileInputRef.current.files[0])
      .catch(err => {
        console.error('알약 분석 중 오류:', err);
        setError('알약 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
      });
  };

  const getAvailableDeviceCapabilities = async (stream: MediaStream) => {
    const videoTrack = stream.getVideoTracks()[0];
    
    // Flash 지원 여부 확인
    try {
      const capabilities = videoTrack.getCapabilities();
      setHasFlash(capabilities?.torch === true);
    } catch (e) {
      console.log('카메라 기능 확인 중 오류:', e);
      setHasFlash(false);
    }
  };

  const startCamera = useCallback(async () => {
    try {
      if (videoRef.current) {
        setCameraError(null);
        
        // 이전 스트림이 있다면 중지
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        const constraints: MediaStreamConstraints = {
          video: { 
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            // @ts-expect-error - 일부 브라우저에서만 작동하는 고급 기능
            zoom: zoomLevel
          }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
        
        // 사용 가능한 카메라 기능 확인
        await getAvailableDeviceCapabilities(stream);
      }
    } catch (err) {
      console.error('카메라 접근 실패:', err);
      setCameraError('카메라에 접근할 수 없습니다. 카메라 권한을 확인해주세요.');
      setIsStreaming(false);
    }
  }, [facingMode, zoomLevel]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsStreaming(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setFlashOn(false);
    }
  }, []);

  const toggleFlash = useCallback(async () => {
    if (!streamRef.current) return;
    
    try {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      
      // Flash 제어 (일부 기기만 지원)
      const newFlashState = !flashOn;
      
      // @ts-expect-error - applyConstraints는 표준이지만 일부 브라우저에서만 지원
      if (videoTrack.applyConstraints) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: newFlashState }]
        });
        setFlashOn(newFlashState);
      }
    } catch (e) {
      console.error('플래시 제어 오류:', e);
    }
  }, [flashOn]);

  const switchCamera = useCallback(async () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  }, []);

  const handleZoom = useCallback((zoom: number) => {
    setZoomLevel(zoom);
    
    // 현재 스트림이 있는 경우 즉시 zoom 적용 시도
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      try {
        // @ts-expect-error - 일부 기기에서만 지원
        if (videoTrack.applyConstraints) {
          videoTrack.applyConstraints({
            advanced: [{ zoom }]
          }).catch(e => console.log('줌 적용 실패:', e));
        }
      } catch (e) {
        console.log('줌 기능 지원하지 않음:', e);
      }
    }
  }, []);

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

  // 줌 수준 변경 효과 적용
  useEffect(() => {
    if (isStreaming) {
      const updateZoom = async () => {
        await startCamera();
      };
      updateZoom();
    }
  }, [zoomLevel, startCamera, isStreaming]);

  // 컴포넌트 언마운트 시 카메라 중지
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <Card className="w-full border border-blue-100 shadow-md overflow-hidden">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="upload" disabled={isLoading} className="data-[state=active]:bg-blue-50">
            <FileUp className="h-4 w-4 mr-2" />
            이미지 업로드
          </TabsTrigger>
          <TabsTrigger value="camera" disabled={isLoading} className="data-[state=active]:bg-blue-50">
            <Camera className="h-4 w-4 mr-2" />
            카메라 촬영
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="m-0">
          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isLoading}
                className="hidden"
              />
              
              <motion.div 
                className="relative w-full aspect-[4/3] bg-gray-50 rounded-lg overflow-hidden"
                initial={false}
                animate={{ 
                  scale: previewUrl ? 1 : 0.98,
                  opacity: previewUrl ? 1 : 0.9
                }}
                transition={{ duration: 0.2 }}
              >
                {previewUrl ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={previewUrl} 
                      alt="미리보기" 
                      className="w-full h-full object-contain"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white/90"
                      onClick={resetFileInput}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full h-full flex flex-col items-center justify-center gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      클릭하여 이미지 선택
                    </span>
                  </Button>
                )}
              </motion.div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <Button 
              className="w-full" 
              onClick={handleUpload}
              disabled={!previewUrl || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  이미지 분석하기
                </>
              )}
            </Button>
          </CardContent>
        </TabsContent>

        <TabsContent value="camera" className="m-0">
          <CardContent className="p-4 space-y-4">
            <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              
              <canvas ref={canvasRef} className="hidden" />
              
              <AnimatePresence>
                {isStreaming && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2"
                  >
                    {hasFlash && (
                      <Button
                        variant="secondary"
                        size="icon"
                        className="bg-white/80 hover:bg-white/90"
                        onClick={toggleFlash}
                      >
                        <motion.div
                          animate={{ scale: flashOn ? 1.1 : 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          {/* Flash icon */}
                        </motion.div>
                      </Button>
                    )}
                    
                    <Button
                      variant="secondary"
                      size="icon"
                      className="bg-white/80 hover:bg-white/90"
                      onClick={switchCamera}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="secondary"
                      size="icon"
                      className="bg-white/80 hover:bg-white/90"
                      onClick={() => handleZoom(zoomLevel === 1 ? 2 : 1)}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {cameraError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert variant="destructive">
                    <AlertDescription>{cameraError}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <Button 
              className="w-full" 
              onClick={captureImage}
              disabled={!isStreaming || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  사진 촬영하기
                </>
              )}
            </Button>
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
} 
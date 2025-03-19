'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertCircle, Camera, FileUp, Upload, ImageIcon, RefreshCw, X, ZoomIn, Loader2 } from 'lucide-react';
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
            // @ts-ignore - 일부 브라우저에서만 작동하는 고급 기능
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
      
      // @ts-ignore - applyConstraints는 표준이지만 일부 브라우저에서만 지원
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
        // @ts-ignore - 일부 기기에서만 지원
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
  }, [zoomLevel, isStreaming, startCamera]);

  // facingMode 변경 시 카메라 재시작
  useEffect(() => {
    if (activeTab === 'camera') {
      stopCamera();
      setTimeout(() => {
        startCamera();
      }, 300);
    }
  }, [facingMode, activeTab, stopCamera, startCamera]);

  // 컴포넌트 언마운트 시 카메라 중지
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <Card className="w-full overflow-hidden border border-blue-100 shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 py-3 px-4">
        <CardTitle className="flex items-center text-blue-700 text-lg">
          <Camera className="mr-2 h-4 w-4" />
          알약 촬영
        </CardTitle>
        <CardDescription className="text-xs">
          알약을 업로드하거나 촬영하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none">
            <TabsTrigger value="upload" className="data-[state=active]:bg-blue-50 py-2 text-sm">
              <Upload className="mr-1 h-3 w-3" />
              이미지 업로드
            </TabsTrigger>
            <TabsTrigger value="camera" className="data-[state=active]:bg-blue-50 py-2 text-sm">
              <Camera className="mr-1 h-3 w-3" />
              카메라 촬영
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4 p-4">
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="pill-image-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileUp className="w-6 h-6 text-gray-500 mb-2" />
                  <p className="text-xs text-gray-500">
                    <span className="font-semibold">클릭해서 이미지 업로드</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG</p>
                </div>
                <input
                  id="pill-image-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </label>
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
                  className="mt-2"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500 flex items-center">
                      <ImageIcon className="h-3 w-3 mr-1" />
                      미리보기
                    </p>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-5 w-5" 
                      onClick={resetFileInput}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="relative aspect-square w-full max-w-xs mx-auto overflow-hidden rounded-md border shadow-sm">
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
          
          <TabsContent value="camera" className="space-y-3 p-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-black shadow-sm">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {isStreaming && (
                <div className="absolute bottom-3 right-3 flex gap-2">
                  {hasFlash && (
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      onClick={toggleFlash}
                      className={`rounded-full backdrop-blur-sm ${flashOn ? 'bg-yellow-400 text-black' : 'bg-white/80 hover:bg-white'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border ${flashOn ? 'bg-yellow-400 border-yellow-600' : 'bg-white border-gray-400'}`} />
                    </Button>
                  )}
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
              
              {isStreaming && (
                <div className="absolute top-3 left-3 right-3 flex items-center">
                  <ZoomIn className="h-3 w-3 text-white mr-2" />
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    step="0.5" 
                    value={zoomLevel} 
                    onChange={(e) => handleZoom(parseFloat(e.target.value))} 
                    className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer" 
                  />
                  <span className="text-white text-xs ml-2">{zoomLevel}x</span>
                </div>
              )}
              
              {!isStreaming && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <div className="text-center text-white">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm">카메라 연결 중...</p>
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
                  className="mt-2"
                >
                  <p className="text-xs text-gray-500 mb-1 flex items-center">
                    <ImageIcon className="h-3 w-3 mr-1" />
                    촬영된 이미지
                  </p>
                  <div className="relative aspect-square w-full max-w-xs mx-auto overflow-hidden rounded-md border shadow-sm">
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
      
      <CardFooter className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
        {activeTab === 'upload' ? (
          <Button 
            onClick={handleUpload} 
            disabled={!previewUrl || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 h-10"
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
            className="w-full bg-blue-600 hover:bg-blue-700 h-10"
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
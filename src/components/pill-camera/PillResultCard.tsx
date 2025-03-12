'use client';

import { PillData } from '@/types/pill';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Info, Pill, ShieldAlert, ThumbsUp, Loader2, Search, CheckCircle2, Tablet } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface PillResultCardProps {
  pillData: PillData | null;
  isLoading: boolean;
  error: string | null;
}

export function PillResultCard({ pillData, isLoading, error }: PillResultCardProps) {
  if (isLoading) {
    return (
      <Card className="w-full border-2 border-blue-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-center">
            <div className="relative flex items-center justify-center w-32 h-32 bg-gray-100 rounded-md">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-blue-700 mb-2">알약 분석 중...</h3>
            <p className="text-sm text-gray-500">
              AI가 알약을 분석하고 있습니다. 잠시만 기다려주세요.
            </p>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full animate-pulse"
              style={{ width: '65%' }}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-2 border-red-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
          <CardTitle className="flex items-center text-red-600">
            <AlertCircle className="mr-2 h-5 w-5" />
            알약 분석 오류
          </CardTitle>
          <CardDescription>
            알약 분석 중 문제가 발생했습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>오류 발생</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          
          <div className="text-center mt-6">
            <Pill className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">
              다른 이미지로 다시 시도하거나, 더 선명한 사진을 촬영해보세요.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pillData) {
    return (
      <Card className="w-full border-2 border-blue-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center text-blue-700">
            <Search className="mr-2 h-5 w-5" />
            알약 분석 결과
          </CardTitle>
          <CardDescription>
            알약 이미지를 업로드하거나 촬영하면 결과가 여기에 표시됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-64 text-center text-gray-500"
          >
            <Tablet className="h-16 w-16 text-blue-200 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">알약 정보 확인</h3>
            <p className="text-sm max-w-md">
              알약 이미지를 분석하여 약품명, 효능, 용법, 주의사항 등 상세 정보를 확인해보세요.
            </p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-2 border-blue-100 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-blue-700">{pillData.itemName}</CardTitle>
            <CardDescription>{pillData.entpName}</CardDescription>
          </div>
          <Badge className="bg-green-100 text-green-700 flex items-center gap-1 px-2 py-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            분석 완료
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-center gap-6"
        >
          {pillData.itemImage ? (
            <div className="relative w-32 h-32 overflow-hidden rounded-md border shadow-md flex-shrink-0 mx-auto md:mx-0">
              <img
                src={pillData.itemImage}
                alt={pillData.itemName}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="w-32 h-32 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0 mx-auto md:mx-0">
              <Pill className="h-12 w-12 text-gray-300" />
            </div>
          )}

          <div className="flex-1 space-y-3 text-center md:text-left">
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {pillData.className && (
                <Badge variant="outline" className="bg-blue-50">
                  {pillData.className}
                </Badge>
              )}
              {pillData.etcOtcName && (
                <Badge variant="outline" className="bg-purple-50">
                  {pillData.etcOtcName}
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-gray-500 text-xs">색상</span>
                <p className="font-medium">{pillData.color || '정보 없음'}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-gray-500 text-xs">모양</span>
                <p className="font-medium">{pillData.shape || '정보 없음'}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-gray-500 text-xs">각인</span>
                <p className="font-medium">{pillData.mark || '정보 없음'}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-gray-500 text-xs">분할선</span>
                <p className="font-medium">{pillData.drugLine || '정보 없음'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info" className="data-[state=active]:bg-blue-50">
                <Info className="mr-2 h-4 w-4" />
                기본 정보
              </TabsTrigger>
              <TabsTrigger value="usage" className="data-[state=active]:bg-blue-50">
                <ThumbsUp className="mr-2 h-4 w-4" />
                효능/용법
              </TabsTrigger>
              <TabsTrigger value="caution" className="data-[state=active]:bg-blue-50">
                <ShieldAlert className="mr-2 h-4 w-4" />
                주의사항
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="mt-4 space-y-4 bg-white p-4 rounded-md border">
              <div>
                <h4 className="font-semibold mb-1 text-blue-700 flex items-center">
                  <Info className="h-4 w-4 mr-1" />
                  성분
                </h4>
                <p className="text-sm">{pillData.itemIngredient || '정보 없음'}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1 text-blue-700 flex items-center">
                  <Info className="h-4 w-4 mr-1" />
                  크기
                </h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-500 text-xs">장축</span>
                    <p className="font-medium">{pillData.lengLong || '정보 없음'}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-500 text-xs">단축</span>
                    <p className="font-medium">{pillData.lengShort || '정보 없음'}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-500 text-xs">두께</span>
                    <p className="font-medium">{pillData.thick || '정보 없음'}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="usage" className="mt-4 space-y-4 bg-white p-4 rounded-md border">
              <div>
                <h4 className="font-semibold mb-1 text-green-700 flex items-center">
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  효능
                </h4>
                <p className="text-sm">{pillData.efcyQesitm || '정보 없음'}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1 text-green-700 flex items-center">
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  용법
                </h4>
                <p className="text-sm">{pillData.useMethodQesitm || '정보 없음'}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1 text-green-700 flex items-center">
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  보관법
                </h4>
                <p className="text-sm">{pillData.depositMethodQesitm || '정보 없음'}</p>
              </div>
            </TabsContent>
            
            <TabsContent value="caution" className="mt-4 space-y-4 bg-white p-4 rounded-md border">
              <div>
                <h4 className="font-semibold mb-1 text-amber-700 flex items-center">
                  <ShieldAlert className="h-4 w-4 mr-1" />
                  주의사항
                </h4>
                <p className="text-sm">{pillData.atpnWarnQesitm || '정보 없음'}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1 text-amber-700 flex items-center">
                  <ShieldAlert className="h-4 w-4 mr-1" />
                  부작용
                </h4>
                <p className="text-sm">{pillData.atpnQesitm || '정보 없음'}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1 text-amber-700 flex items-center">
                  <ShieldAlert className="h-4 w-4 mr-1" />
                  상호작용
                </h4>
                <p className="text-sm">{pillData.intrcQesitm || '정보 없음'}</p>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
        
        {pillData.confidence && (
          <div className="mt-4 text-xs text-gray-500 flex items-center justify-end">
            <div className="flex items-center">
              <span className="mr-2">인식 신뢰도:</span>
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${pillData.confidence}%` }}
                />
              </div>
              <span className="ml-2">{pillData.confidence.toFixed(1)}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
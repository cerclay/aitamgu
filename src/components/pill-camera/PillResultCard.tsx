'use client';

import { PillData } from '@/types/pill';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Info, Pill, Ruler, Syringe, ShieldAlert, Stethoscope } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface PillResultCardProps {
  pillData: PillData | null;
  isLoading: boolean;
  error?: string;
}

// HTML 태그 제거 함수
function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '');
}

export function PillResultCard({ pillData, isLoading, error }: PillResultCardProps) {
  if (isLoading) {
    return (
      <Card className="w-full p-6 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-[200px] w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>분석 오류</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!pillData) {
    return (
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertTitle>알약을 촬영하거나 이미지를 업로드해주세요</AlertTitle>
        <AlertDescription>
          알약의 정면이 잘 보이도록 촬영하면 더 정확한 결과를 얻을 수 있습니다.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full overflow-hidden border-2 border-blue-100">
          {/* 기본 정보 섹션 */}
          <div className="p-6 bg-gradient-to-br from-blue-50 via-white to-blue-50">
            <div className="flex items-start gap-6">
              {pillData.itemImage && (
                <div className="relative flex-shrink-0">
                  <motion.img
                    src={pillData.itemImage}
                    alt={pillData.itemName}
                    className="w-40 h-40 object-contain rounded-xl shadow-lg border-2 border-blue-100 bg-white p-2"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                  <Badge className="absolute top-2 right-2 bg-blue-600 text-white font-bold px-3 py-1 rounded-full">
                    {pillData.confidence}% 일치
                  </Badge>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-blue-900 truncate mb-1">
                  {pillData.itemName}
                </h2>
                <p className="text-sm text-gray-600 mb-3">
                  {pillData.entpName}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="px-3 py-1 bg-blue-100 text-blue-800 font-medium">
                    {pillData.etcOtcName}
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 border-blue-200 text-blue-700">
                    {pillData.className}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* 물리적 특성 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-blue-50">
                <div className="flex items-center gap-2 mb-2 text-blue-700">
                  <div className="p-1.5 bg-blue-50 rounded-lg">
                    <Pill className="h-4 w-4" />
                  </div>
                  <span className="font-medium">색상</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{pillData.color || '정보 없음'}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-blue-50">
                <div className="flex items-center gap-2 mb-2 text-blue-700">
                  <div className="p-1.5 bg-blue-50 rounded-lg">
                    <Pill className="h-4 w-4" />
                  </div>
                  <span className="font-medium">모양</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{pillData.shape || '정보 없음'}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-blue-50">
                <div className="flex items-center gap-2 mb-2 text-blue-700">
                  <div className="p-1.5 bg-blue-50 rounded-lg">
                    <Ruler className="h-4 w-4" />
                  </div>
                  <span className="font-medium">분할선</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{pillData.drugLine || '없음'}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-blue-50">
                <div className="flex items-center gap-2 mb-2 text-blue-700">
                  <div className="p-1.5 bg-blue-50 rounded-lg">
                    <Pill className="h-4 w-4" />
                  </div>
                  <span className="font-medium">각인</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {pillData.markFront && pillData.markBack ? 
                    `앞면: ${pillData.markFront}, 뒷면: ${pillData.markBack}` : 
                    pillData.markFront || '없음'}
                </p>
              </div>
            </div>

            {/* 크기 정보 */}
            {(pillData.lengLong || pillData.lengShort || pillData.thick) && (
              <div className="mt-4 bg-white rounded-xl p-4 shadow-sm border-2 border-blue-50">
                <div className="flex items-center gap-2 mb-3 text-blue-700">
                  <div className="p-1.5 bg-blue-50 rounded-lg">
                    <Ruler className="h-4 w-4" />
                  </div>
                  <span className="font-medium">크기 정보</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {pillData.lengLong && (
                    <div>
                      <span className="text-sm text-gray-500">장축</span>
                      <p className="text-lg font-semibold text-gray-900">{pillData.lengLong}mm</p>
                    </div>
                  )}
                  {pillData.lengShort && (
                    <div>
                      <span className="text-sm text-gray-500">단축</span>
                      <p className="text-lg font-semibold text-gray-900">{pillData.lengShort}mm</p>
                    </div>
                  )}
                  {pillData.thick && (
                    <div>
                      <span className="text-sm text-gray-500">두께</span>
                      <p className="text-lg font-semibold text-gray-900">{pillData.thick}mm</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 상세 정보 탭 */}
          <Tabs defaultValue="similar" className="w-full">
            <TabsList className="w-full grid grid-cols-4 p-2 bg-blue-50">
              <TabsTrigger 
                value="similar" 
                className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
              >
                유사 알약
              </TabsTrigger>
              <TabsTrigger 
                value="info" 
                className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
              >
                상세정보
              </TabsTrigger>
              <TabsTrigger 
                value="usage" 
                className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
              >
                복용법
              </TabsTrigger>
              <TabsTrigger 
                value="caution" 
                className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
              >
                주의사항
              </TabsTrigger>
            </TabsList>

            <TabsContent value="similar" className="p-4">
              <ScrollArea className="h-[400px]">
                {pillData.similarItems && pillData.similarItems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {pillData.similarItems.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-xl p-4 shadow-sm border-2 border-blue-50"
                      >
                        <div className="flex items-center gap-4">
                          {item.itemImage && (
                            <img
                              src={item.itemImage}
                              alt={item.itemName}
                              className="w-20 h-20 object-contain rounded-lg border border-blue-100 bg-white p-1"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-blue-900 truncate">{item.itemName}</h3>
                            <p className="text-sm text-gray-500 truncate mt-1">
                              {item.entpName}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {item.color}
                              </Badge>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {item.shape}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    유사한 알약 정보가 없습니다.
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="info" className="p-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-blue-50">
                    <h3 className="font-medium text-blue-800 flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-blue-50 rounded-lg">
                        <Syringe className="h-4 w-4" />
                      </div>
                      성분 정보
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {stripHtml(pillData.itemIngredient) || '정보가 없습니다.'}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-blue-50">
                    <h3 className="font-medium text-blue-800 flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-blue-50 rounded-lg">
                        <Stethoscope className="h-4 w-4" />
                      </div>
                      효능・효과
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {stripHtml(pillData.efficacy) || '정보가 없습니다.'}
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="usage" className="p-4">
              <ScrollArea className="h-[400px]">
                <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-blue-50">
                  <h3 className="font-medium text-blue-800 flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-blue-50 rounded-lg">
                      <Pill className="h-4 w-4" />
                    </div>
                    용법・용량
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {stripHtml(pillData.useMethod) || '정보가 없습니다.'}
                  </p>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="caution" className="p-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-blue-50">
                    <h3 className="font-medium text-blue-800 flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-blue-50 rounded-lg">
                        <ShieldAlert className="h-4 w-4" />
                      </div>
                      주의사항
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {stripHtml(pillData.caution) || '정보가 없습니다.'}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-blue-50">
                    <h3 className="font-medium text-blue-800 flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-blue-50 rounded-lg">
                        <ShieldAlert className="h-4 w-4" />
                      </div>
                      상호작용
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {stripHtml(pillData.interaction) || '정보가 없습니다.'}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-blue-50">
                    <h3 className="font-medium text-blue-800 flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-blue-50 rounded-lg">
                        <ShieldAlert className="h-4 w-4" />
                      </div>
                      부작용
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {stripHtml(pillData.sideEffect) || '정보가 없습니다.'}
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
} 
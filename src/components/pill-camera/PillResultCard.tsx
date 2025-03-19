'use client';

import { PillData } from '@/types/pill';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Info, Pill, ShieldAlert, ThumbsUp, Loader2, Search, CheckCircle2, Tablet } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface PillResultCardProps {
  pillData: PillData | null;
  isLoading: boolean;
  error: string | null;
}

export function PillResultCard({ pillData, isLoading, error }: PillResultCardProps) {
  // HTML에서 태그 제거하는 함수
  const stripHtml = (html: string) => {
    return html.replace(/<\/?[^>]+(>|$)/g, '');
  };

  if (isLoading) {
    return (
      <Card className="w-full border border-blue-100 shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 py-3 px-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-3 w-full mt-2" />
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-center">
            <div className="relative flex items-center justify-center w-24 h-24 bg-gray-100 rounded-md">
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
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
      <Card className="w-full border border-red-100 shadow-md">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 py-3 px-4">
          <CardTitle className="flex items-center text-red-600 text-lg">
            <AlertCircle className="mr-2 h-4 w-4" />
            알약 분석 오류
          </CardTitle>
          <CardDescription className="text-xs">
            알약 분석 중 문제가 발생했습니다
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <Alert variant="destructive" className="mb-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          
          <div className="text-center mt-4">
            <Pill className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              다른 이미지로 다시 시도하거나, 더 선명한 사진을 촬영해보세요.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pillData) {
    return (
      <Card className="w-full border border-blue-100 shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 py-3 px-4">
          <CardTitle className="flex items-center text-blue-700 text-lg">
            <Search className="mr-2 h-4 w-4" />
            알약 분석 결과
          </CardTitle>
          <CardDescription className="text-xs">
            알약 이미지를 업로드하거나 촬영하면 결과가 여기에 표시됩니다
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-10 text-center text-gray-500"
          >
            <Tablet className="h-12 w-12 text-blue-200 mb-3" />
            <h3 className="text-base font-medium text-gray-700 mb-2">알약 정보 확인</h3>
            <p className="text-xs max-w-md">
              알약 이미지를 분석하여 약품명, 효능, 용법, 주의사항 등 상세 정보를 확인해보세요.
            </p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border border-blue-100 shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 py-3 px-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-blue-700 text-lg line-clamp-1">{pillData.itemName}</CardTitle>
            <CardDescription className="text-xs line-clamp-1">{pillData.entpName}</CardDescription>
          </div>
          <Badge className="bg-green-100 text-green-700 flex items-center gap-1 px-2 py-0.5 text-xs">
            <CheckCircle2 className="h-3 w-3" />
            분석 완료
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4"
        >
          {pillData.itemImage ? (
            <div className="relative w-28 h-28 overflow-hidden rounded-md border shadow-md flex-shrink-0 mx-auto">
              <img
                src={pillData.itemImage}
                alt={pillData.itemName}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="w-28 h-28 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0 mx-auto">
              <Pill className="h-10 w-10 text-gray-300" />
            </div>
          )}

          <div className="w-full space-y-2">
            <div className="flex flex-wrap gap-1.5 justify-center">
              {pillData.className && (
                <Badge variant="outline" className="bg-blue-50 text-xs py-0.5">
                  {pillData.className}
                </Badge>
              )}
              {pillData.etcOtcName && (
                <Badge variant="outline" className="bg-purple-50 text-xs py-0.5">
                  {pillData.etcOtcName}
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-gray-500 text-[10px]">색상</span>
                <p className="font-medium">{pillData.color || '정보 없음'}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-gray-500 text-[10px]">모양</span>
                <p className="font-medium">{pillData.shape || '정보 없음'}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-gray-500 text-[10px]">각인</span>
                <p className="font-medium">{pillData.mark || '정보 없음'}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-gray-500 text-[10px]">분할선</span>
                <p className="font-medium">{pillData.drugLine || '정보 없음'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-2"
        >
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="info" className="data-[state=active]:bg-blue-50 text-xs py-1.5">
                <Info className="mr-1 h-3 w-3" />
                기본 정보
              </TabsTrigger>
              <TabsTrigger value="usage" className="data-[state=active]:bg-blue-50 text-xs py-1.5">
                <ThumbsUp className="mr-1 h-3 w-3" />
                효능/용법
              </TabsTrigger>
              <TabsTrigger value="caution" className="data-[state=active]:bg-blue-50 text-xs py-1.5">
                <ShieldAlert className="mr-1 h-3 w-3" />
                주의사항
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="mt-3 space-y-3">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="ingredients" className="border rounded-md py-1">
                  <AccordionTrigger className="py-2 px-3 hover:no-underline hover:bg-gray-50">
                    <div className="font-medium text-xs text-blue-700 flex items-center">
                      <Info className="h-3.5 w-3.5 mr-1.5" />
                      성분
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-2">
                    <p className="text-xs whitespace-pre-wrap">{pillData.itemIngredient || '정보 없음'}</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="size" className="border rounded-md py-1 mt-2">
                  <AccordionTrigger className="py-2 px-3 hover:no-underline hover:bg-gray-50">
                    <div className="font-medium text-xs text-blue-700 flex items-center">
                      <Info className="h-3.5 w-3.5 mr-1.5" />
                      크기 정보
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-2">
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-500 text-[10px]">장축</span>
                        <p className="font-medium">{pillData.lengLong || '정보 없음'}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-500 text-[10px]">단축</span>
                        <p className="font-medium">{pillData.lengShort || '정보 없음'}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-500 text-[10px]">두께</span>
                        <p className="font-medium">{pillData.thick || '정보 없음'}</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            
            <TabsContent value="usage" className="mt-3 space-y-3">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="efficacy" className="border rounded-md py-1">
                  <AccordionTrigger className="py-2 px-3 hover:no-underline hover:bg-gray-50">
                    <div className="font-medium text-xs text-green-700 flex items-center">
                      <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
                      효능
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-2">
                    <p className="text-xs whitespace-pre-wrap">{stripHtml(pillData.efcyQesitm) || '정보 없음'}</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="usage" className="border rounded-md py-1 mt-2">
                  <AccordionTrigger className="py-2 px-3 hover:no-underline hover:bg-gray-50">
                    <div className="font-medium text-xs text-green-700 flex items-center">
                      <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
                      용법
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-2">
                    <p className="text-xs whitespace-pre-wrap">{stripHtml(pillData.useMethodQesitm) || '정보 없음'}</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="storage" className="border rounded-md py-1 mt-2">
                  <AccordionTrigger className="py-2 px-3 hover:no-underline hover:bg-gray-50">
                    <div className="font-medium text-xs text-green-700 flex items-center">
                      <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
                      보관법
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-2">
                    <p className="text-xs whitespace-pre-wrap">{stripHtml(pillData.depositMethodQesitm) || '정보 없음'}</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            
            <TabsContent value="caution" className="mt-3 space-y-3">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="warnings" className="border rounded-md py-1">
                  <AccordionTrigger className="py-2 px-3 hover:no-underline hover:bg-gray-50">
                    <div className="font-medium text-xs text-red-700 flex items-center">
                      <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
                      경고
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-2">
                    <p className="text-xs whitespace-pre-wrap">{stripHtml(pillData.atpnWarnQesitm) || '정보 없음'}</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="precautions" className="border rounded-md py-1 mt-2">
                  <AccordionTrigger className="py-2 px-3 hover:no-underline hover:bg-gray-50">
                    <div className="font-medium text-xs text-red-700 flex items-center">
                      <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
                      주의사항
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-2">
                    <p className="text-xs whitespace-pre-wrap">{stripHtml(pillData.atpnQesitm) || '정보 없음'}</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="interactions" className="border rounded-md py-1 mt-2">
                  <AccordionTrigger className="py-2 px-3 hover:no-underline hover:bg-gray-50">
                    <div className="font-medium text-xs text-red-700 flex items-center">
                      <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
                      상호작용
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-2">
                    <p className="text-xs whitespace-pre-wrap">{stripHtml(pillData.intrcQesitm) || '정보 없음'}</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
          </Tabs>
        </motion.div>
      </CardContent>
    </Card>
  );
} 
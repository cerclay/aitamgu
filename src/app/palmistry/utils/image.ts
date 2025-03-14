/**
 * 손금 분석을 위한 이미지 유틸리티 함수
 */

/**
 * 이미지 파일을 Base64 문자열로 변환
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * 이미지 최적화 함수
 * @param file 원본 이미지 파일
 * @param maxSize 최대 크기 (픽셀)
 * @param quality 이미지 품질 (0~1)
 * @returns 최적화된 이미지 파일 (Blob)
 */
export const optimizeImage = (
  file: File,
  maxSize: number = 800,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      // 이미지 URL 해제
      URL.revokeObjectURL(url);
      
      // 원본 이미지 크기
      const originalWidth = img.width;
      const originalHeight = img.height;
      
      // 새 크기 계산 (비율 유지)
      let newWidth = originalWidth;
      let newHeight = originalHeight;
      
      // 이미지가 최대 크기보다 큰 경우 리사이징
      if (originalWidth > maxSize || originalHeight > maxSize) {
        if (originalWidth > originalHeight) {
          newWidth = maxSize;
          newHeight = Math.floor(originalHeight * (maxSize / originalWidth));
        } else {
          newHeight = maxSize;
          newWidth = Math.floor(originalWidth * (maxSize / originalHeight));
        }
      }
      
      // 캔버스 생성 및 이미지 그리기
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('캔버스 컨텍스트를 생성할 수 없습니다.'));
        return;
      }
      
      // 이미지 그리기
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // 캔버스를 Blob으로 변환
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('이미지 최적화 중 오류가 발생했습니다.'));
          }
        },
        file.type,
        quality
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 로드할 수 없습니다.'));
    };
    
    img.src = url;
  });
};

/**
 * 이미지 밝기 조정 함수
 * @param file 원본 이미지 파일
 * @param brightness 밝기 조정값 (-100~100)
 * @returns 밝기가 조정된 이미지 파일 (Blob)
 */
export const adjustImageBrightness = (
  file: File,
  brightness: number = 0
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('캔버스 컨텍스트를 생성할 수 없습니다.'));
        return;
      }
      
      // 이미지 그리기
      ctx.drawImage(img, 0, 0);
      
      // 이미지 데이터 가져오기
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // 밝기 조정 (범위: -100 ~ 100)
      const factor = brightness / 100;
      
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, data[i] + 255 * factor));     // R
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + 255 * factor)); // G
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + 255 * factor)); // B
      }
      
      // 수정된 이미지 데이터 적용
      ctx.putImageData(imageData, 0, 0);
      
      // 캔버스를 Blob으로 변환
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('이미지 밝기 조정 중 오류가 발생했습니다.'));
          }
        },
        file.type,
        0.9
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 로드할 수 없습니다.'));
    };
    
    img.src = url;
  });
};

/**
 * 이미지 대비 조정 함수
 * @param file 원본 이미지 파일
 * @param contrast 대비 조정값 (-100~100)
 * @returns 대비가 조정된 이미지 파일 (Blob)
 */
export const adjustImageContrast = (
  file: File,
  contrast: number = 0
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('캔버스 컨텍스트를 생성할 수 없습니다.'));
        return;
      }
      
      // 이미지 그리기
      ctx.drawImage(img, 0, 0);
      
      // 이미지 데이터 가져오기
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // 대비 조정 (범위: -100 ~ 100)
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));     // R
        data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128)); // G
        data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128)); // B
      }
      
      // 수정된 이미지 데이터 적용
      ctx.putImageData(imageData, 0, 0);
      
      // 캔버스를 Blob으로 변환
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('이미지 대비 조정 중 오류가 발생했습니다.'));
          }
        },
        file.type,
        0.9
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 로드할 수 없습니다.'));
    };
    
    img.src = url;
  });
}; 
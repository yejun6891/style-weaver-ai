/**
 * 클라이언트 측 이미지 전처리 유틸리티
 * 업로드 전 브라우저에서 Canvas API를 사용해 이미지를 전처리합니다.
 */

const CANVAS_SIZE = 1024;
const JPEG_QUALITY = 0.85;
const MIN_DIMENSION = 150;

/**
 * File 또는 Blob을 HTMLImageElement로 로드
 */
async function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`이미지 로드 실패: ${e}`));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Canvas를 Blob으로 변환
 */
async function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas to Blob 변환 실패"));
        }
      },
      "image/jpeg",
      quality
    );
  });
}

/**
 * 상의 이미지 전처리
 * - 1024x1024 정사각형 캔버스에 중앙 배치
 * - 비율 유지하며 최대한 크게 리사이즈
 */
export async function preprocessTopGarment(file: File): Promise<File> {
  console.log(`[Preprocess Top] 원본: ${file.name}, ${(file.size / 1024).toFixed(1)}KB`);
  
  const img = await loadImage(file);
  const { width, height } = img;
  
  // 해상도가 너무 작으면 경고 (하지만 계속 진행)
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    console.warn(`[Preprocess Top] 해상도가 작음: ${width}x${height}`);
  }
  
  // 캔버스 생성 (흰색 배경)
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext("2d")!;
  
  // 흰색 배경 채우기
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  
  // 비율 유지하며 캔버스에 맞게 리사이즈
  const scale = Math.min(CANVAS_SIZE / width, CANVAS_SIZE / height);
  const newWidth = Math.round(width * scale);
  const newHeight = Math.round(height * scale);
  
  // 중앙 배치
  const x = Math.round((CANVAS_SIZE - newWidth) / 2);
  const y = Math.round((CANVAS_SIZE - newHeight) / 2);
  
  ctx.drawImage(img, x, y, newWidth, newHeight);
  
  // URL 해제
  URL.revokeObjectURL(img.src);
  
  // Blob으로 변환
  const blob = await canvasToBlob(canvas, JPEG_QUALITY);
  
  // 새 File 생성
  const processedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
    type: "image/jpeg",
  });
  
  console.log(`[Preprocess Top] 처리됨: ${CANVAS_SIZE}x${CANVAS_SIZE}, ${(processedFile.size / 1024).toFixed(1)}KB`);
  
  return processedFile;
}

/**
 * 하의 이미지 전처리
 * - 1024x1024 정사각형 캔버스에 하단 배치
 * - 캔버스의 90%를 차지하도록 리사이즈
 */
export async function preprocessBottomGarment(file: File): Promise<File> {
  console.log(`[Preprocess Bottom] 원본: ${file.name}, ${(file.size / 1024).toFixed(1)}KB`);
  
  const img = await loadImage(file);
  const { width, height } = img;
  
  // 해상도가 너무 작으면 경고
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    console.warn(`[Preprocess Bottom] 해상도가 작음: ${width}x${height}`);
  }
  
  // 캔버스 생성 (흰색 배경)
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext("2d")!;
  
  // 흰색 배경 채우기
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  
  // 캔버스의 90%를 차지하도록 리사이즈
  const targetSize = Math.floor(CANVAS_SIZE * 0.9);
  const scale = Math.min(targetSize / width, targetSize / height);
  const newWidth = Math.round(width * scale);
  const newHeight = Math.round(height * scale);
  
  // 좌우 중앙, 하단에서 5% 여백
  const x = Math.round((CANVAS_SIZE - newWidth) / 2);
  const bottomPadding = Math.floor(CANVAS_SIZE * 0.05);
  const y = CANVAS_SIZE - newHeight - bottomPadding;
  
  ctx.drawImage(img, x, y, newWidth, newHeight);
  
  // URL 해제
  URL.revokeObjectURL(img.src);
  
  // Blob으로 변환
  const blob = await canvasToBlob(canvas, JPEG_QUALITY);
  
  // 새 File 생성
  const processedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
    type: "image/jpeg",
  });
  
  console.log(`[Preprocess Bottom] 처리됨: ${CANVAS_SIZE}x${CANVAS_SIZE}, 하단배치(y=${y}), ${(processedFile.size / 1024).toFixed(1)}KB`);
  
  return processedFile;
}

/**
 * 인물 이미지 전처리
 * - EXIF 방향 정규화 (Canvas가 자동 처리)
 * - 긴 변이 2048px 초과시 리사이즈
 */
export async function preprocessPersonImage(file: File): Promise<File> {
  console.log(`[Preprocess Person] 원본: ${file.name}, ${(file.size / 1024).toFixed(1)}KB`);
  
  const img = await loadImage(file);
  const { width, height } = img;
  
  const MAX_DIMENSION = 2048;
  const longSide = Math.max(width, height);
  
  // 이미 작으면 그대로 JPEG로만 변환
  if (longSide <= MAX_DIMENSION) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    
    URL.revokeObjectURL(img.src);
    
    const blob = await canvasToBlob(canvas, 0.9);
    const processedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
      type: "image/jpeg",
    });
    
    console.log(`[Preprocess Person] 처리됨 (리사이즈 없음): ${width}x${height}, ${(processedFile.size / 1024).toFixed(1)}KB`);
    return processedFile;
  }
  
  // 리사이즈 필요
  const scale = MAX_DIMENSION / longSide;
  const newWidth = Math.round(width * scale);
  const newHeight = Math.round(height * scale);
  
  const canvas = document.createElement("canvas");
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, newWidth, newHeight);
  
  URL.revokeObjectURL(img.src);
  
  const blob = await canvasToBlob(canvas, 0.9);
  const processedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
    type: "image/jpeg",
  });
  
  console.log(`[Preprocess Person] 처리됨 (리사이즈): ${newWidth}x${newHeight}, ${(processedFile.size / 1024).toFixed(1)}KB`);
  return processedFile;
}

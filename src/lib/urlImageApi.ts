// src/lib/urlImageApi.ts
const BACKEND_BASE_URL =
  import.meta.env.VITE_TRYON_API_BASE ||
  "https://tyron-backend-8yaa.onrender.com";

/**
 * 상품 URL에서 이미지 후보 목록 가져오기
 */
export async function fetchImagesFromProductUrl(
  productUrl: string,
  type: "top" | "bottom" = "top"
) {
  const res = await fetch(`${BACKEND_BASE_URL}/api/url/images`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: productUrl, type }),
  });

  if (!res.ok) {
    throw new Error(`URL 이미지 요청 실패 (status: ${res.status})`);
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || "이미지 후보를 가져오지 못했습니다.");
  }

  return data.images as string[];
}

/**
 * 선택한 이미지 URL을 File 객체로 변환
 * → 기존 파일 업로드 로직에 그대로 넣기 위해 사용
 */
export async function downloadImageAsFile(
  imageUrl: string,
  role: "person" | "top" | "bottom"
): Promise<File> {
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error("이미지 다운로드에 실패했습니다.");
  }
  const blob = await res.blob();
  const ext = blob.type.split("/")[1] || "jpg";
  const filename = `${role}-from-url.${ext}`;

  return new File([blob], filename, { type: blob.type });
}

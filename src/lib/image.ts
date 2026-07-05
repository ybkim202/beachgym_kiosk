/**
 * 업로드 전 클라이언트에서 이미지 리사이즈·압축.
 * - Vercel 함수 본문 한도(≈4.5MB) 초과 방지 + 저장/전송량 절감
 * - 캔버스로 최대 변 maxDim 이내로 축소 후 JPEG 재인코딩
 * - 실패(HEIC 등 디코드 불가) 시 원본 반환
 */
export async function compressImage(
  file: File,
  maxDim = 1600,
  quality = 0.82,
): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) return file;
  try {
    const dataUrl: string = await new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
    const img: HTMLImageElement = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = dataUrl;
    });
    let { width, height } = img;
    const longest = Math.max(width, height);
    if (longest > maxDim) {
      const s = maxDim / longest;
      width = Math.round(width * s);
      height = Math.round(height * s);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);
    const blob: Blob | null = await new Promise((res) =>
      canvas.toBlob(res, "image/jpeg", quality),
    );
    if (!blob || blob.size === 0) return file;
    // 압축 결과가 원본보다 크면(작은 원본) 원본 유지
    if (blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

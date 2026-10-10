"use client";

import { useEffect, useState } from "react";

// 커버 이미지를 작게 그려서 픽셀을 평균 낸, 그 앨범을 대표하는 색("r g b" 문자열).
// CORS 때문에 캔버스를 못 읽으면(또는 이미지가 없으면) null — 그때는 각 화면이 알아서 기본 색으로 보여준다.
export function useAlbumColor(imageUrl: string | undefined): string | null {
  const [color, setColor] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setColor(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      try {
        const size = 24;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0;
        let g = 0;
        let b = 0;
        const pixelCount = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        setColor(`${Math.round(r / pixelCount)} ${Math.round(g / pixelCount)} ${Math.round(b / pixelCount)}`);
      } catch {
        setColor(null);
      }
    };
    img.onerror = () => setColor(null);
    img.src = imageUrl;
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return color;
}

// "r g b" 문자열을 지정한 비율만큼 어둡게 만든다.
export function darken(rgb: string, factor: number): string {
  const [r, g, b] = rgb.split(" ").map(Number);
  return `${Math.round(r * factor)} ${Math.round(g * factor)} ${Math.round(b * factor)}`;
}

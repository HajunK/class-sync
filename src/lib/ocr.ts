"use client";

import { averageConfidence, linesToText, shouldInvert } from "./ocr-text";

/** Photos are read as Korean and English together. */
const OCR_LANGUAGE = "kor+eng";
const MAX_SIDE = 2000;

/** Loads the photo and cleans it up for reading: grayscale, light text on dark flipped to dark on light, more contrast. */
async function preparePhoto(file: File): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`Couldn't open “${file.name}”. Please use a JPG or PNG photo.`));
      el.src = url;
    });
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.fillStyle = "#fff"; // transparent PNG → white paper
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = pixels.data;
    const gray = new Float32Array(d.length / 4);
    let sum = 0;
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      gray[p] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      sum += gray[p];
    }
    const invert = shouldInvert(sum / gray.length);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const g = invert ? 255 - gray[p] : gray[p];
      d[i] = d[i + 1] = d[i + 2] = Math.max(0, Math.min(255, (g - 128) * 1.4 + 128)); // contrast
    }
    ctx.putImageData(pixels, 0, 0);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Reads the text in a photo in the browser (Tesseract.js). Nothing is uploaded. The first read downloads the
 * language data once and keeps it. onProgress gets a short status like "Reading photo… 40%".
 */
export async function readPhotoText(file: File, onProgress?: (status: string) => void) {
  const canvas = await preparePhoto(file);
  const { recognize } = await import("tesseract.js");
  const { data } = await recognize(canvas, OCR_LANGUAGE, {
    logger: (m) => onProgress?.(m.status === "recognizing text" ? `Reading photo… ${Math.round(m.progress * 100)}%` : "Getting ready…"),
  });
  return { text: linesToText(data.lines), confidence: averageConfidence(data.words), words: data.words.length };
}

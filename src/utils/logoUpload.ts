/**
 * E-MUAVİN standart kurumsal logo referans ölçüleri (200x50 CSS / 400x100 Retina)
 */
export const MUAVIN_LOGO_DIMENSIONS = {
  width: 200,
  height: 50,
  retinaWidth: 400,
  retinaHeight: 100,
};

export function clampLogoScale(scale?: number): number {
  const num = Number(scale);
  if (!Number.isFinite(num) || num <= 0) return 1;
  return Math.min(3.0, Math.max(0.25, Number(num.toFixed(2))));
}

/**
 * Şeffaf veya beyaz kenar boşluklarını (padding) tespit edip gerçek logo alanını bulur.
 */
function findContentBounds(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): { sx: number; sy: number; sw: number; sh: number } {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let foundNonWhite = false;

    let alphaMinX = width;
    let alphaMinY = height;
    let alphaMaxX = 0;
    let alphaMaxY = 0;
    let foundAlpha = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const alpha = data[idx + 3];

        if (alpha > 15) {
          if (x < alphaMinX) alphaMinX = x;
          if (y < alphaMinY) alphaMinY = y;
          if (x > alphaMaxX) alphaMaxX = x;
          if (y > alphaMaxY) alphaMaxY = y;
          foundAlpha = true;

          const isNearWhite = r > 246 && g > 246 && b > 246;
          if (!isNearWhite) {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
            foundNonWhite = true;
          }
        }
      }
    }

    const useMinX = foundNonWhite ? minX : alphaMinX;
    const useMinY = foundNonWhite ? minY : alphaMinY;
    const useMaxX = foundNonWhite ? maxX : alphaMaxX;
    const useMaxY = foundNonWhite ? maxY : alphaMaxY;
    const found = foundNonWhite || foundAlpha;

    if (!found || useMaxX <= useMinX || useMaxY <= useMinY) {
      return { sx: 0, sy: 0, sw: width, sh: height };
    }

    const padX = Math.max(1, Math.round((useMaxX - useMinX) * 0.015));
    const padY = Math.max(1, Math.round((useMaxY - useMinY) * 0.015));
    const sx = Math.max(0, useMinX - padX);
    const sy = Math.max(0, useMinY - padY);
    const sw = Math.min(width - sx, useMaxX - useMinX + 1 + padX * 2);
    const sh = Math.min(height - sy, useMaxY - useMinY + 1 + padY * 2);
    return { sx, sy, sw, sh };
  } catch {
    return { sx: 0, sy: 0, sw: width, sh: height };
  }
}

const croppedLogoCache = new Map<string, string>();

/**
 * Mevcut yüklenmiş logo görselinin (Data URL) etrafındaki boş beyaz/şeffaf alanları
 * otomatik kırparak logonun beyaz alana tam oturmasını sağlar.
 */
export function autoCropLogoSource(src: string): Promise<string> {
  if (!src || !src.startsWith("data:image/") || src.startsWith("data:image/svg")) {
    return Promise.resolve(src);
  }
  const cached = croppedLogoCache.get(src);
  if (cached) {
    return Promise.resolve(cached);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const w = Math.max(1, img.naturalWidth || img.width);
        const h = Math.max(1, img.naturalHeight || img.height);
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) {
          resolve(src);
          return;
        }
        tempCtx.drawImage(img, 0, 0, w, h);
        const { sx, sy, sw, sh } = findContentBounds(tempCtx, w, h);

        if (sx <= 2 && sy <= 2 && sw >= w - 4 && sh >= h - 4) {
          croppedLogoCache.set(src, src);
          resolve(src);
          return;
        }

        const outCanvas = document.createElement("canvas");
        outCanvas.width = sw;
        outCanvas.height = sh;
        const outCtx = outCanvas.getContext("2d");
        if (!outCtx) {
          resolve(src);
          return;
        }
        outCtx.imageSmoothingEnabled = true;
        outCtx.imageSmoothingQuality = "high";
        outCtx.drawImage(tempCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
        const croppedUrl = outCanvas.toDataURL("image/png");
        croppedLogoCache.set(src, croppedUrl);
        resolve(croppedUrl);
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

/**
 * Bilgisayardan seçilen logo görsel dosyasını (PNG, JPG, JPEG, WEBP, SVG, GIF)
 * okuyup şeffaf kenar boşluklarını temizleyerek kendi doğal en-boy oranında
 * yüksek çözünürlüklü Base64 Data URL formatına dönüştürür.
 * Böylece kullanıcı e-Fatura & e-Arşiv Tasarım Ayarlarında logoyu istediği
 * genişlik ve yükseklikte (px) özgürce boyutlandırabilir.
 */
export async function readAndOptimizeLogoFile(file: File): Promise<string> {
  if (!file) {
    throw new Error("Lütfen bir görsel dosyası seçin.");
  }

  const validMimeTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/svg+xml",
    "image/gif",
  ];
  const isImage =
    validMimeTypes.includes(file.type) ||
    /\.(png|jpe?g|webp|svg|gif)$/i.test(file.name);

  if (!isImage) {
    throw new Error(
      "Geçersiz dosya formatı! Lütfen PNG, JPG, WEBP veya SVG formatında bir logo seçin."
    );
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Logo dosya boyutu en fazla 10 MB olabilir.");
  }

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Logo dosyası okunamadı."));
    reader.readAsDataURL(file);
  });

  if (
    file.type === "image/svg+xml" ||
    file.name.toLowerCase().endsWith(".svg")
  ) {
    return rawDataUrl;
  }

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const srcW = Math.max(1, img.naturalWidth || img.width || 200);
        const srcH = Math.max(1, img.naturalHeight || img.height || 200);

        const tempCanvas = document.createElement("canvas");
        const workW = Math.min(srcW, 1200);
        const workH = Math.min(srcH, 1200);
        tempCanvas.width = workW;
        tempCanvas.height = workH;
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) {
          resolve(rawDataUrl);
          return;
        }
        tempCtx.clearRect(0, 0, workW, workH);
        tempCtx.drawImage(img, 0, 0, workW, workH);

        const { sx, sy, sw, sh } = findContentBounds(tempCtx, workW, workH);

        // Doğal en-boy oranını koruyarak maksimum 480px çözünürlüğe optimize et (yapay boşluk ekleme)
        const maxDim = 480;
        const ratio = Math.min(1, maxDim / Math.max(1, sw, sh));
        const destW = Math.max(1, Math.round(sw * ratio));
        const destH = Math.max(1, Math.round(sh * ratio));

        const canvas = document.createElement("canvas");
        canvas.width = destW;
        canvas.height = destH;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.clearRect(0, 0, destW, destH);
        ctx.drawImage(tempCanvas, sx, sy, sw, sh, 0, 0, destW, destH);

        let optimized = canvas.toDataURL("image/png");
        if (optimized.length > 160000) {
          optimized = canvas.toDataURL("image/webp", 0.92);
        }
        resolve(optimized);
      } catch {
        resolve(rawDataUrl);
      }
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}

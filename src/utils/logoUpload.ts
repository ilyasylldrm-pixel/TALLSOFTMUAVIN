/**
 * Bilgisayardan seçilen logo görsel dosyasını (PNG, JPG, JPEG, WEBP, SVG, GIF)
 * okuyup fatura, kenar çubuğu ve bulut senkronizasyonu için optimize edilmiş
 * Base64 Data URL formatına dönüştürür.
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

  // SVG veya zaten küçük boyutlu (< 45KB) görselleri doğrudan döndür
  if (
    file.type === "image/svg+xml" ||
    file.name.toLowerCase().endsWith(".svg") ||
    rawDataUrl.length <= 45000
  ) {
    return rawDataUrl;
  }

  // Büyük raster görselleri (PNG/JPG/WEBP) şeffaflığı koruyarak ideal logo boyutuna (maks 420x160) ölçekle
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const maxWidth = 420;
        const maxHeight = 160;
        let width = img.naturalWidth || img.width || 300;
        let height = img.naturalHeight || img.height || 100;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Önce PNG (şeffaf arka plan korunur) dene, çok büyükse WEBP kullan
        let optimized = canvas.toDataURL("image/png");
        if (optimized.length > 120000) {
          optimized = canvas.toDataURL("image/webp", 0.9);
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

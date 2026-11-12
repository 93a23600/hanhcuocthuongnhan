/* MODULE 1: MÃ BĂM LÕI ẢNH 64-BIT & SO KHỚP (js/bam-anh.js) */

function computeImageHash(imgDataUrl) {
  return new Promise((resolve) => {
    if (!imgDataUrl) return resolve("");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const cvs = document.createElement("canvas");
        const ctx = cvs.getContext("2d");
        cvs.width = 9;
        cvs.height = 8;

        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;

        // Cắt lấy lõi trung tâm: bỏ 18% trái/phải, 14% trên, và bỏ 22% đáy (nơi chứa số x999)
        const srcX = w * 0.18;
        const srcY = h * 0.14;
        const srcW = w * 0.64;
        const srcH = h * 0.64;

        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, 9, 8);
        const data = ctx.getImageData(0, 0, 9, 8).data;
        let hash = "";
        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
            const idx1 = (y * 9 + x) * 4;
            const idx2 = (y * 9 + (x + 1)) * 4;
            const gray1 = data[idx1] * 0.299 + data[idx1 + 1] * 0.587 + data[idx1 + 2] * 0.114;
            const gray2 = data[idx2] * 0.299 + data[idx2 + 1] * 0.587 + data[idx2 + 2] * 0.114;
            hash += gray1 > gray2 ? "1" : "0";
          }
        }
        resolve(hash);
      } catch (e) {
        resolve("");
      }
    };
    img.onerror = () => resolve("");
    img.src = imgDataUrl;
  });
}

function getHammingDistance(h1, h2) {
  if (!h1 || !h2 || h1.length !== h2.length) return 999;
  let diff = 0;
  for (let i = 0; i < h1.length; i++) {
    if (h1[i] !== h2[i]) diff++;
  }
  return diff;
}

/* MODULE 2: NHẬN ẢNH, CĂN VIỀN & CẮT 35 Ô 5x7 SẮC NÉT 1:1 (js/can-khung-cat-anh.js) */

let pendingRawImg = null;
let currentCropRatios = { top: 0, bottom: 0, left: 0, right: 0 };
let pendingImage = null;
let pendingCrops = [];

function handleIncomingFile(file) {
  if (!file || !file.type || !file.type.startsWith("image/")) {
    alert("Vui lòng chọn hoặc dán đúng tệp hình ảnh!");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const img = new Image();
    img.onload = () => {
      pendingRawImg = img;

      // Ưu tiên nạp khung chuẩn đã train riêng cho đúng cỡ ảnh (WxH) nếu có, sau đó mới tới learnedGridCrop
      let initialRatios = appState.learnedGridCrop || { top: 0, bottom: 0, left: 0, right: 0 };
      try {
        const trainRaw = localStorage.getItem("HKTN_AI_CROP_TRAIN_BRAIN");
        if (trainRaw) {
          const brain = JSON.parse(trainRaw);
          const sizeKey = `${img.naturalWidth}x${img.naturalHeight}`;
          if (brain?.profiles?.[sizeKey]) {
            const p = brain.profiles[sizeKey];
            initialRatios = { top: p.top, bottom: p.bottom, left: p.left, right: p.right };
          }
        }
      } catch (err) {}

      currentCropRatios = Object.assign({}, initialRatios);
      openCalibrateModal();
    };
    img.onerror = () => alert("Không thể đọc định dạng ảnh này!");
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

function openCalibrateModal() {
  const modal = document.getElementById("cropCalibrateModal");
  if (!modal || !pendingRawImg) return;

  const rTop = document.getElementById("rangeCropTop");
  const rBottom = document.getElementById("rangeCropBottom");
  const rLeft = document.getElementById("rangeCropLeft");
  const rRight = document.getElementById("rangeCropRight");

  [
    [rTop, currentCropRatios.top],
    [rBottom, currentCropRatios.bottom],
    [rLeft, currentCropRatios.left],
    [rRight, currentCropRatios.right]
  ].forEach(([el, val]) => {
    if (!el) return;
    if (val > parseFloat(el.max || 30)) el.max = Math.ceil(val + 5);
    el.value = val;
  });

  updateRangeLabels();
  drawCalibrateGrid();
  modal.classList.remove("hidden");
  if (window.lucide) lucide.createIcons();
}

function updateRangeLabels() {
  const elTop = document.getElementById("valCropTop");
  const elBottom = document.getElementById("valCropBottom");
  const elLeft = document.getElementById("valCropLeft");
  const elRight = document.getElementById("valCropRight");

  if (elTop) elTop.textContent = `${currentCropRatios.top}%`;
  if (elBottom) elBottom.textContent = `${currentCropRatios.bottom}%`;
  if (elLeft) elLeft.textContent = `${currentCropRatios.left}%`;
  if (elRight) elRight.textContent = `${currentCropRatios.right}%`;
}

function drawCalibrateGrid() {
  const canvas = document.getElementById("calibrateCanvas");
  if (!canvas || !pendingRawImg) return;
  const ctx = canvas.getContext("2d");

  canvas.width = pendingRawImg.naturalWidth;
  canvas.height = pendingRawImg.naturalHeight;

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(pendingRawImg, 0, 0);

  const x = (currentCropRatios.left / 100) * canvas.width;
  const y = (currentCropRatios.top / 100) * canvas.height;
  const w = Math.max(1, canvas.width - x - ((currentCropRatios.right / 100) * canvas.width));
  const h = Math.max(1, canvas.height - y - ((currentCropRatios.bottom / 100) * canvas.height));

  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.fillRect(0, 0, canvas.width, y);
  ctx.fillRect(0, y + h, canvas.width, canvas.height - (y + h));
  ctx.fillRect(0, y, x, h);
  ctx.fillRect(x + w, y, canvas.width - (x + w), h);

  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  ctx.strokeStyle = "rgba(52, 211, 153, 0.8)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);

  const stepX = w / 5;
  const stepY = h / 7;

  for (let c = 1; c < 5; c++) {
    ctx.beginPath();
    ctx.moveTo(x + c * stepX, y);
    ctx.lineTo(x + c * stepX, y + h);
    ctx.stroke();
  }
  for (let r = 1; r < 7; r++) {
    ctx.beginPath();
    ctx.moveTo(x, y + r * stepY);
    ctx.lineTo(x + w, y + r * stepY);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

// Cắt 35 ô (5 cột x 7 hàng) giữ nguyên 100% độ phân giải pixel gốc (không ép 90x90 gây mờ)
function sliceGridWithRatios(imgElement, ratios) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const totalW = imgElement.naturalWidth;
  const totalH = imgElement.naturalHeight;

  const startX = Math.round((ratios.left / 100) * totalW);
  const startY = Math.round((ratios.top / 100) * totalH);
  const activeW = Math.max(5, Math.round(totalW - startX - ((ratios.right / 100) * totalW)));
  const activeH = Math.max(7, Math.round(totalH - startY - ((ratios.bottom / 100) * totalH)));

  const stepX = activeW / 5;
  const stepY = activeH / 7;

  const crops = [];

  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 5; c++) {
      const srcX = Math.round(startX + c * stepX);
      const srcY = Math.round(startY + r * stepY);
      const cellW = Math.max(1, Math.round(startX + (c + 1) * stepX) - srcX);
      const cellH = Math.max(1, Math.round(startY + (r + 1) * stepY) - srcY);

      canvas.width = cellW;
      canvas.height = cellH;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, cellW, cellH);
      ctx.drawImage(imgElement, srcX, srcY, cellW, cellH, 0, 0, cellW, cellH);
      crops.push(canvas.toDataURL("image/png"));
    }
  }
  return crops;
}

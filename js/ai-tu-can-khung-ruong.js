/* MODULE: KHÓA KHUNG LƯỚI RƯƠNG 35 Ô (5×7), TỰ HỌC SỬA LỆCH & ĐÓNG GÓI DỮ LIỆU (js/ai-tu-can-khung-ruong.js) */

const STORAGE_CROP_TRAIN_KEY = "HKTN_AI_CROP_TRAIN_BRAIN";
window.aiVerifiedGridData = null;
window.lastAiSuggestedRatios = null;

/**
 * Nạp / Lưu bộ nhớ train cắt khung vĩnh viễn
 * Lưu lại:
 * - profiles: { "WxH": { top, bottom, left, right, count } } (khung chuẩn đã được người dùng xác nhận theo từng cỡ ảnh)
 * - corrections: [{ imgRatio, aiGuessed, userFixed, delta }] (các lần AI căn lệch và bị người dùng kéo sửa lại)
 */
function loadCropTrainBrain() {
  try {
    const raw = localStorage.getItem(STORAGE_CROP_TRAIN_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        profiles: parsed.profiles || {},
        corrections: Array.isArray(parsed.corrections) ? parsed.corrections : []
      };
    }
  } catch (e) {
    console.error("Lỗi đọc dữ liệu train khung:", e);
  }
  return { profiles: {}, corrections: [] };
}

function saveCropTrainBrain(brain) {
  try {
    localStorage.setItem(STORAGE_CROP_TRAIN_KEY, JSON.stringify(brain));
  } catch (e) {
    console.error("Lỗi lưu dữ liệu train khung:", e);
  }
}

/**
 * Dò đường kẻ lưới 5 cột x 7 hàng (35 ô) trực tiếp từ pixel của ảnh zin 100%
 */
function detectGrid5x7ByPixels(img) {
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  if (!W || !H) return null;

  const cvs = document.createElement("canvas");
  cvs.width = W;
  cvs.height = H;
  const ctx = cvs.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, W, H);

  const gray = new Float32Array(W * H);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  const colEdge = new Float32Array(W);
  const rowEdge = new Float32Array(H);

  const ySampleStart = Math.floor(H * 0.12);
  const ySampleEnd = Math.floor(H * 0.88);
  for (let x = 2; x < W - 2; x++) {
    let sum = 0;
    for (let y = ySampleStart; y < ySampleEnd; y++) {
      const idx = y * W + x;
      const valley = ((gray[idx - 2] + gray[idx + 2]) * 0.5) - gray[idx];
      if (valley > 0) sum += valley;
    }
    colEdge[x] = sum / Math.max(1, ySampleEnd - ySampleStart);
  }

  const xSampleStart = Math.floor(W * 0.12);
  const xSampleEnd = Math.floor(W * 0.88);
  for (let y = 2; y < H - 2; y++) {
    let sum = 0;
    for (let x = xSampleStart; x < xSampleEnd; x++) {
      const idx = y * W + x;
      const valley = ((gray[idx - 2 * W] + gray[idx + 2 * W]) * 0.5) - gray[idx];
      if (valley > 0) sum += valley;
    }
    rowEdge[y] = sum / Math.max(1, xSampleEnd - xSampleStart);
  }

  const peakAt = (arr, pos) => {
    const p = Math.round(pos);
    let best = 0;
    for (let d = -2; d <= 2; d++) {
      const k = p + d;
      if (k >= 0 && k < arr.length && arr[k] > best) best = arr[k];
    }
    return best;
  };

  let bestScore = -1;
  let bestBox = null;

  const minCell = Math.max(18, Math.floor(Math.min(W / 7.5, H / 9.5)));
  const maxCell = Math.floor(Math.min(W / 4.8, H / 6.8));

  for (let cellW = minCell; cellW <= maxCell; cellW += 0.5) {
    const gridW = cellW * 5;
    if (gridW > W) continue;

    let bestXScore = -1;
    let bestX0 = 0;
    const maxX0 = Math.floor(W - gridW);
    for (let x0 = 0; x0 <= maxX0; x0 += 1) {
      let s = 0;
      for (let c = 0; c <= 5; c++) {
        const wFactor = (c === 0 || c === 5) ? 0.85 : 1.25;
        s += peakAt(colEdge, x0 + c * cellW) * wFactor;
      }
      if (s > bestXScore) {
        bestXScore = s;
        bestX0 = x0;
      }
    }

    const minH = Math.max(18, cellW * 0.94);
    const maxH = Math.min(H / 6.8, cellW * 1.08);

    for (let cellH = minH; cellH <= maxH; cellH += 0.5) {
      const gridH = cellH * 7;
      if (gridH > H) continue;

      let bestYScore = -1;
      let bestY0 = 0;
      const maxY0 = Math.floor(H - gridH);
      for (let y0 = 0; y0 <= maxY0; y0 += 1) {
        let s = 0;
        for (let r = 0; r <= 7; r++) {
          const wFactor = (r === 0 || r === 7) ? 0.85 : 1.25;
          s += peakAt(rowEdge, y0 + r * cellH) * wFactor;
        }
        if (s > bestYScore) {
          bestYScore = s;
          bestY0 = y0;
        }
      }

      const totalScore = (bestXScore / 6) + (bestYScore / 8);
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestBox = {
          x0: bestX0,
          y0: bestY0,
          x1: Math.round(bestX0 + gridW),
          y1: Math.round(bestY0 + gridH)
        };
      }
    }
  }

  if (!bestBox || bestScore < 1.8) return null;

  const toHalfPercent = (val) => {
    const clamped = Math.max(0, Math.min(45, val));
    return Math.round(clamped * 2) / 2;
  };

  return {
    top: toHalfPercent((bestBox.y0 / H) * 100),
    bottom: toHalfPercent(((H - bestBox.y1) / H) * 100),
    left: toHalfPercent((bestBox.x0 / W) * 100),
    right: toHalfPercent(((W - bestBox.x1) / W) * 100)
  };
}

/**
 * Ghi nhận bài học khi người dùng chỉnh sửa khung AI và bấm Tiếp Tục
 */
window.trainAiGridCorrection = function(rawImg, finalRatios) {
  if (!rawImg || !finalRatios) return;
  const W = rawImg.naturalWidth;
  const H = rawImg.naturalHeight;
  const brain = loadCropTrainBrain();

  // 1. Lưu cấu hình chuẩn theo đúng độ phân giải ảnh (WxH)
  const sizeKey = `${W}x${H}`;
  const prevProfile = brain.profiles[sizeKey];
  brain.profiles[sizeKey] = {
    top: finalRatios.top,
    bottom: finalRatios.bottom,
    left: finalRatios.left,
    right: finalRatios.right,
    count: (prevProfile?.count || 0) + 1,
    updatedAt: Date.now()
  };

  // 2. Nếu lần này AI từng đoán lệch và bạn đã kéo chỉnh lại -> ghi nhận sai số để AI học
  if (window.lastAiSuggestedRatios) {
    const g = window.lastAiSuggestedRatios;
    const dTop = Math.round((finalRatios.top - g.top) * 2) / 2;
    const dBottom = Math.round((finalRatios.bottom - g.bottom) * 2) / 2;
    const dLeft = Math.round((finalRatios.left - g.left) * 2) / 2;
    const dRight = Math.round((finalRatios.right - g.right) * 2) / 2;

    if (dTop !== 0 || dBottom !== 0 || dLeft !== 0 || dRight !== 0) {
      brain.corrections.push({
        sizeKey,
        aspect: +(W / Math.max(1, H)).toFixed(3),
        aiGuessed: { ...g },
        userFixed: { ...finalRatios },
        delta: { top: dTop, bottom: dBottom, left: dLeft, right: dRight },
        at: Date.now()
      });
      if (brain.corrections.length > 30) {
        brain.corrections = brain.corrections.slice(-30);
      }
    }
  }

  saveCropTrainBrain(brain);
  window.lastAiSuggestedRatios = null;
};

/**
 * Tạo gói dữ liệu khung chuẩn 100% từ ảnh zin + tỷ lệ đã chốt để truyền sang AI bước tiếp theo
 */
window.buildVerifiedGridPayload = function(rawImg, ratios) {
  const totalW = rawImg.naturalWidth;
  const totalH = rawImg.naturalHeight;

  const startX = (ratios.left / 100) * totalW;
  const startY = (ratios.top / 100) * totalH;
  const activeW = Math.max(5, totalW - startX - ((ratios.right / 100) * totalW));
  const activeH = Math.max(7, totalH - startY - ((ratios.bottom / 100) * totalH));

  const stepX = activeW / 5;
  const stepY = activeH / 7;

  // Cắt 35 ô kích thước thật sắc nét nguyên bản (không mờ)
  const slotW = Math.max(64, Math.round(stepX));
  const slotH = Math.max(64, Math.round(stepY));
  const cellCvs = document.createElement("canvas");
  cellCvs.width = slotW;
  cellCvs.height = slotH;
  const cellCtx = cellCvs.getContext("2d");
  cellCtx.imageSmoothingEnabled = false;

  const crops = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 5; c++) {
      cellCtx.clearRect(0, 0, slotW, slotH);
      cellCtx.drawImage(
        rawImg,
        startX + c * stepX,
        startY + r * stepY,
        stepX,
        stepY,
        0,
        0,
        slotW,
        slotH
      );
      crops.push(cellCvs.toDataURL("image/png"));
    }
  }

  // Tạo ảnh lưới 2x sắc nét có kẻ khung đỏ + đánh số #1 -> #35 ở góc trên trái từng ô
  const scale = 2;
  const gridCvs = document.createElement("canvas");
  gridCvs.width = Math.round(activeW * scale);
  gridCvs.height = Math.round(activeH * scale);
  const gCtx = gridCvs.getContext("2d");
  gCtx.imageSmoothingEnabled = false;

  gCtx.drawImage(rawImg, startX, startY, activeW, activeH, 0, 0, gridCvs.width, gridCvs.height);

  const scaledStepX = gridCvs.width / 5;
  const scaledStepY = gridCvs.height / 7;

  gCtx.strokeStyle = "rgba(255, 60, 60, 0.85)";
  gCtx.lineWidth = 2;
  for (let c = 0; c <= 5; c++) {
    gCtx.beginPath();
    gCtx.moveTo(c * scaledStepX, 0);
    gCtx.lineTo(c * scaledStepX, gridCvs.height);
    gCtx.stroke();
  }
  for (let r = 0; r <= 7; r++) {
    gCtx.beginPath();
    gCtx.moveTo(0, r * scaledStepY);
    gCtx.lineTo(gridCvs.width, r * scaledStepY);
    gCtx.stroke();
  }

  gCtx.font = "bold 13px monospace";
  gCtx.textBaseline = "top";
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 5; c++) {
      const idx = r * 5 + c + 1;
      const bx = c * scaledStepX + 2;
      const by = r * scaledStepY + 2;
      const label = `#${idx}`;
      const tw = gCtx.measureText(label).width;
      gCtx.fillStyle = "rgba(0, 0, 0, 0.78)";
      gCtx.fillRect(bx, by, tw + 4, 15);
      gCtx.fillStyle = "#fde047";
      gCtx.fillText(label, bx + 2, by + 1);
    }
  }

  const cleanCroppedCvs = document.createElement("canvas");
  cleanCroppedCvs.width = Math.round(activeW);
  cleanCroppedCvs.height = Math.round(activeH);
  cleanCroppedCvs.getContext("2d").drawImage(rawImg, startX, startY, activeW, activeH, 0, 0, cleanCroppedCvs.width, cleanCroppedCvs.height);

  const payload = {
    verified: true,
    gridSpec: "5x7 (35 ô cố định)",
    ratios: Object.assign({}, ratios),
    crops35: crops,
    cleanDataUrl: cleanCroppedCvs.toDataURL("image/png"),
    annotatedBase64: gridCvs.toDataURL("image/png").split(",")[1]
  };

  window.aiVerifiedGridData = payload;
  return payload;
};

// Tự động móc vào nút "Khung Đã Chuẩn -> Tiếp Tục" để vừa train học khung vừa đóng gói dữ liệu chuẩn gửi AI sau
document.addEventListener("click", (e) => {
  const btnConfirm = e.target.closest("#btnConfirmCalibrate");
  if (!btnConfirm) return;
  if (typeof pendingRawImg !== "undefined" && pendingRawImg && typeof currentCropRatios !== "undefined") {
    window.trainAiGridCorrection(pendingRawImg, currentCropRatios);
    const payload = window.buildVerifiedGridPayload(pendingRawImg, currentCropRatios);
    // Cập nhật ngay pendingCrops & pendingImage chuẩn nét trước khi handler gốc chạy tiếp
    if (typeof pendingCrops !== "undefined") pendingCrops = payload.crops35;
    setTimeout(() => {
      if (typeof pendingImage !== "undefined" && pendingImage) {
        pendingImage.base64 = payload.annotatedBase64;
        pendingImage.dataUrl = payload.cleanDataUrl;
        pendingImage.isVerifiedGrid = true;
      }
    }, 0);
  }
}, true);

window.runAiAutoCalibrateGrid = async function() {
  if (typeof pendingRawImg === "undefined" || !pendingRawImg) {
    showToast("Chưa có ảnh rương để AI căn khung!", "error");
    return;
  }

  const btnAi = document.getElementById("btnAiAutoCalibrate");
  const originalHtml = btnAi ? btnAi.innerHTML : "";
  if (btnAi) {
    btnAi.disabled = true;
    btnAi.classList.add("opacity-60", "cursor-wait");
    btnAi.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>AI đang căn 35 ô...</span>`;
    if (window.lucide) lucide.createIcons();
  }

  try {
    const W = pendingRawImg.naturalWidth;
    const H = pendingRawImg.naturalHeight;
    const sizeKey = `${W}x${H}`;
    const brain = loadCropTrainBrain();

    let detected = null;
    let sourceNote = "";

    // BƯỚC 1: Ưu tiên dùng khung chuẩn đã được bạn train & xác nhận cho đúng cỡ ảnh này
    if (brain.profiles[sizeKey]) {
      const p = brain.profiles[sizeKey];
      detected = { top: p.top, bottom: p.bottom, left: p.left, right: p.right };
      sourceNote = ` (Đã học ${p.count} lần)`;
    }

    // BƯỚC 2: Dò đường kẻ lưới 5x7 trực tiếp theo từng pixel trên ảnh zin 100%
    if (!detected) {
      detected = detectGrid5x7ByPixels(pendingRawImg);
      if (detected && brain.corrections.length > 0) {
        // Bù trừ độ lệch trung bình từ các lần bạn từng sửa cho AI
        const recent = brain.corrections.slice(-5);
        const avg = (key) => Math.round((recent.reduce((s, item) => s + (item.delta[key] || 0), 0) / recent.length) * 2) / 2;
        const clamp = (v) => Math.round(Math.max(0, Math.min(45, v)) * 2) / 2;
        detected = {
          top: clamp(detected.top + avg("top")),
          bottom: clamp(detected.bottom + avg("bottom")),
          left: clamp(detected.left + avg("left")),
          right: clamp(detected.right + avg("right"))
        };
        sourceNote = " (Đã áp dụng kinh nghiệm sửa lệch)";
      }
    }

    // BƯỚC 3: Dự phòng bằng Gemini Vision kèm lịch sử các lần từng bị sửa lệch
    if (!detected && appState && appState.apiKey) {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = W;
      tempCanvas.height = H;
      tempCanvas.getContext("2d").drawImage(pendingRawImg, 0, 0);
      const base64Data = tempCanvas.toDataURL("image/png").split(",")[1];

      const modelName = appState.geminiModel || "gemini-2.5-flash";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(appState.apiKey)}`;

      let learnedHistoryNote = "";
      if (brain.corrections.length > 0) {
        const samples = brain.corrections.slice(-3).map(c =>
          `- Ảnh (${c.sizeKey}): AI từng đoán ${JSON.stringify(c.aiGuessed)} bị lệch, khung chuẩn người dùng sửa là ${JSON.stringify(c.userFixed)}.`
        ).join("\n");
        learnedHistoryNote = `\nBÀI HỌC TỪ CÁC LẦN CẮT LỆCH TRƯỚC ĐÓ:\n${samples}\n`;
      }

      const prompt = `Locate the exact 5 columns x 7 rows (35 square item slots) inventory grid in this screenshot.
Exclude any left button column ("Sắp xếp", "Tách", "Khóa"), top title bar ("Rương chứa đồ"), and bottom page bar (< 1 >).${learnedHistoryNote}
Return ONLY JSON: {"box_2d": [ymin, xmin, ymax, xmax]} in 0..1000 scale.`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/png", data: base64Data } }
            ]
          }],
          generationConfig: { temperature: 0.0, responseMimeType: "application/json" }
        })
      });

      if (response.ok) {
        const result = await response.json();
        const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const parsed = JSON.parse(rawText.replace(/```json|```/gi, "").trim());
        const box = Array.isArray(parsed) ? parsed[0]?.box_2d : parsed?.box_2d;
        if (Array.isArray(box) && box.length === 4) {
          const [ymin, xmin, ymax, xmax] = box.map(Number);
          const toHalf = (v) => Math.round(Math.max(0, Math.min(45, v)) * 2) / 2;
          detected = {
            top: toHalf(ymin / 10),
            left: toHalf(xmin / 10),
            bottom: toHalf((1000 - ymax) / 10),
            right: toHalf((1000 - xmax) / 10)
          };
        }
      }
    }

    if (!detected) {
      throw new Error("Không tìm thấy rãnh lưới 5×7 rõ ràng trên ảnh. Hãy kéo 4 thanh trượt rồi bấm Tiếp Tục để AI học khung này!");
    }

    // Lưu lại thông số AI vừa gợi ý để đối chiếu xem bạn có kéo sửa lại không
    window.lastAiSuggestedRatios = { ...detected };

    if (typeof currentCropRatios !== "undefined") {
      currentCropRatios.top = detected.top;
      currentCropRatios.bottom = detected.bottom;
      currentCropRatios.left = detected.left;
      currentCropRatios.right = detected.right;
    }

    // Cập nhật 4 thanh trượt & vẽ khung đè lên ảnh zin 100%
    const sideMap = { Top: detected.top, Bottom: detected.bottom, Left: detected.left, Right: detected.right };
    Object.entries(sideMap).forEach(([side, val]) => {
      const slider = document.getElementById(`rangeCrop${side}`);
      if (slider) {
        if (val > parseFloat(slider.max || 30)) slider.max = Math.ceil(val + 5);
        slider.value = val;
      }
    });

    if (typeof updateRangeLabels === "function") updateRangeLabels();
    if (typeof drawCalibrateGrid === "function") drawCalibrateGrid();

    showToast(`AI đặt khung 35 ô${sourceNote}: Trên ${detected.top}% • Dưới ${detected.bottom}% • Trái ${detected.left}% • Phải ${detected.right}%`, "success");
  } catch (err) {
    console.error("Lỗi tự căn khung:", err);
    showToast(err.message, "error");
  } finally {
    if (btnAi) {
      btnAi.disabled = false;
      btnAi.classList.remove("opacity-60", "cursor-wait");
      btnAi.innerHTML = originalHtml;
      if (window.lucide) lucide.createIcons();
    }
  }
};

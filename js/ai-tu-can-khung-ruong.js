/* MODULE: TỰ ĐỘNG DÒ ĐƯỜNG KẺ LƯỚI RƯƠNG 35 Ô (5×7) CHÍNH XÁC PIXEL (js/ai-tu-can-khung-ruong.js) */

/**
 * Quét phân tích độ tương phản đường kẻ lưới 5 cột x 7 hàng trực tiếp từ pixel của ảnh rương.
 * Trả về { top, bottom, left, right } tính theo % kích thước ảnh (làm tròn 0.5%).
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

  // Chuyển sang độ sáng xám (luminance)
  const gray = new Float32Array(W * H);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  // Tính tín hiệu biên dọc (để tìm 6 đường kẻ dọc của 5 cột) và biên ngang (để tìm 8 đường kẻ ngang của 7 hàng)
  const colEdge = new Float32Array(W);
  const rowEdge = new Float32Array(H);

  // Chỉ lấy mẫu vùng giữa theo chiều ngược lại để tránh dính viền ngoài
  const ySampleStart = Math.floor(H * 0.15);
  const ySampleEnd = Math.floor(H * 0.85);
  for (let x = 2; x < W - 2; x++) {
    let sum = 0;
    for (let y = ySampleStart; y < ySampleEnd; y++) {
      const idx = y * W + x;
      // Đường kẻ rãnh giữa các ô tối hơn 2 bên (thung lũng độ sáng)
      const valley = ((gray[idx - 2] + gray[idx + 2]) * 0.5) - gray[idx];
      if (valley > 0) sum += valley;
    }
    colEdge[x] = sum / Math.max(1, ySampleEnd - ySampleStart);
  }

  const xSampleStart = Math.floor(W * 0.15);
  const xSampleEnd = Math.floor(W * 0.85);
  for (let y = 2; y < H - 2; y++) {
    let sum = 0;
    for (let x = xSampleStart; x < xSampleEnd; x++) {
      const idx = y * W + x;
      const valley = ((gray[idx - 2 * W] + gray[idx + 2 * W]) * 0.5) - gray[idx];
      if (valley > 0) sum += valley;
    }
    rowEdge[y] = sum / Math.max(1, xSampleEnd - xSampleStart);
  }

  // Lấy cực đại cục bộ trong bán kính +-2px
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

  // Thử các kích thước ô vuông (ô rương trong game luôn gần như vuông: cellW ≈ cellH, tỷ lệ 0.90 -> 1.12)
  const minCell = Math.max(18, Math.floor(Math.min(W / 7.5, H / 9.5)));
  const maxCell = Math.floor(Math.min(W / 4.8, H / 6.8));

  for (let cellW = minCell; cellW <= maxCell; cellW += 1) {
    const gridW = cellW * 5;
    if (gridW > W) continue;

    // Tìm vị trí X0 tốt nhất cho 6 đường kẻ dọc (c = 0..5)
    let bestXScore = -1;
    let bestX0 = 0;
    const maxX0 = W - gridW;
    for (let x0 = 0; x0 <= maxX0; x0 += 1) {
      let s = 0;
      for (let c = 0; c <= 5; c++) {
        // 4 đường kẻ trong (c=1..4) có trọng số cao hơn
        const wFactor = (c === 0 || c === 5) ? 0.8 : 1.2;
        s += peakAt(colEdge, x0 + c * cellW) * wFactor;
      }
      if (s > bestXScore) {
        bestXScore = s;
        bestX0 = x0;
      }
    }

    // Quét cellH quanh cellW (từ 0.92*cellW đến 1.10*cellW)
    const minH = Math.max(18, Math.floor(cellW * 0.92));
    const maxH = Math.min(Math.floor(H / 6.8), Math.ceil(cellW * 1.10));

    for (let cellH = minH; cellH <= maxH; cellH += 1) {
      const gridH = cellH * 7;
      if (gridH > H) continue;

      let bestYScore = -1;
      let bestY0 = 0;
      const maxY0 = H - gridH;
      for (let y0 = 0; y0 <= maxY0; y0 += 1) {
        let s = 0;
        for (let r = 0; r <= 7; r++) {
          const wFactor = (r === 0 || r === 7) ? 0.8 : 1.2;
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
          x1: bestX0 + gridW,
          y1: bestY0 + gridH
        };
      }
    }
  }

  if (!bestBox || bestScore < 2.0) return null;

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
    btnAi.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>Đang dò lưới 5×7...</span>`;
    if (window.lucide) lucide.createIcons();
  }

  try {
    // BƯỚC 1: Dò đường kẻ lưới 5x7 trực tiếp theo từng pixel trên ảnh
    let detected = detectGrid5x7ByPixels(pendingRawImg);

    // BƯỚC 2: Dự phòng bằng Gemini Vision nếu ảnh mờ không bắt được rãnh lưới
    if (!detected && appState && appState.apiKey) {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = pendingRawImg.naturalWidth;
      tempCanvas.height = pendingRawImg.naturalHeight;
      tempCanvas.getContext("2d").drawImage(pendingRawImg, 0, 0);
      const base64Data = tempCanvas.toDataURL("image/png").split(",")[1];

      const modelName = appState.geminiModel || "gemini-2.5-flash";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(appState.apiKey)}`;

      const prompt = `Locate the exact 5 columns x 7 rows (35 square item slots) inventory grid in this screenshot.
NOTE: If there is a vertical column of text buttons on the far left (like "Sắp xếp", "Tách", "Khóa"), exclude those text buttons and start xmin at column 1 of the square item icons!
Exclude the top title bar ("Rương chứa đồ") and bottom page bar (< 1 >).
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
      throw new Error("Không tìm thấy rãnh lưới 5×7 rõ ràng trên ảnh.");
    }

    if (typeof currentCropRatios !== "undefined") {
      currentCropRatios.top = detected.top;
      currentCropRatios.bottom = detected.bottom;
      currentCropRatios.left = detected.left;
      currentCropRatios.right = detected.right;
    }

    // Cập nhật 4 thanh trượt & vẽ lại lưới xanh lên Canvas
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

    showToast(`Đã bắt khớp lưới 5×7: Trên ${detected.top}% • Dưới ${detected.bottom}% • Trái ${detected.left}% • Phải ${detected.right}%`, "success");
  } catch (err) {
    console.error("Lỗi tự căn khung:", err);
    showToast(`Tự căn khung thất bại: ${err.message}`, "error");
  } finally {
    if (btnAi) {
      btnAi.disabled = false;
      btnAi.classList.remove("opacity-60", "cursor-wait");
      btnAi.innerHTML = originalHtml;
      if (window.lucide) lucide.createIcons();
    }
  }
};

/* MODULE: AI TỰ ĐỘNG ĐO VÀ VẼ KHUNG LƯỚI RƯƠNG 35 Ô (5×7) (js/ai-tu-can-khung-ruong.js) */

window.runAiAutoCalibrateGrid = async function() {
  if (typeof pendingRawImg === "undefined" || !pendingRawImg) {
    showToast("Chưa có ảnh rương để AI căn khung!", "error");
    return;
  }

  if (!appState || !appState.apiKey) {
    showToast("Vui lòng nhập Gemini API Key trước khi dùng AI căn khung!", "error");
    return;
  }

  const btnAi = document.getElementById("btnAiAutoCalibrate");
  const originalHtml = btnAi ? btnAi.innerHTML : "";
  if (btnAi) {
    btnAi.disabled = true;
    btnAi.classList.add("opacity-60", "cursor-wait");
    btnAi.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>AI đang soi khung...</span>`;
    if (window.lucide) lucide.createIcons();
  }

  try {
    // Chuyển ảnh gốc hiện tại sang base64 chuẩn để gửi Vision
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = pendingRawImg.naturalWidth;
    tempCanvas.height = pendingRawImg.naturalHeight;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(pendingRawImg, 0, 0);
    const base64Data = tempCanvas.toDataURL("image/png").split(",")[1];

    const modelName = appState.geminiModel || "gemini-2.5-flash";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(appState.apiKey)}`;

    // Dùng chuẩn bounding box [ymin, xmin, ymax, xmax] thang 0..1000 để AI định vị chính xác từng mép ô
    const prompt = `Detect the exact bounding box of the 5x7 inventory item slots grid (35 square item slots total: 5 columns wide by 7 rows tall) inside this game screenshot.

CRITICAL VISUAL LANDMARKS TO INCLUDE & EXCLUDE:
- INCLUDE tightly all 35 square item cells from the top-left corner of cell (row 1, col 1) to the bottom-right corner of cell (row 7, col 5).
- INCLUDE the bottom-right quantity text (like x999, x400) inside row 7 (the bottom row of items). Do NOT cut off the numbers at the bottom of row 7!
- EXCLUDE the top title bar ("Rương chứa đồ" / "ng chứa đồ") and the close button (X) above row 1.
- EXCLUDE the page navigation bar (< 1 >) below row 7.
- EXCLUDE the thin left/right window border strips outside the 5 columns.

Return ONLY a JSON object with "box_2d" as [ymin, xmin, ymax, xmax] normalized to 0..1000:
{"box_2d": [ymin, xmin, ymax, xmax]}`;

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
        generationConfig: {
          temperature: 0.0,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Lỗi HTTP ${response.status}`);
    }

    const result = await response.json();
    const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleanedJson = rawText.replace(/```json|```/gi, "").trim();
    const parsed = JSON.parse(cleanedJson);

    const box = Array.isArray(parsed) ? parsed[0]?.box_2d : parsed?.box_2d;
    if (!Array.isArray(box) || box.length !== 4) {
      throw new Error("AI không trả về tọa độ box_2d hợp lệ.");
    }

    const [ymin, xmin, ymax, xmax] = box.map(Number);
    if ([ymin, xmin, ymax, xmax].some(v => isNaN(v)) || ymax <= ymin || xmax <= xmin) {
      throw new Error("Tọa độ khung AI trả về không hợp lệ.");
    }

    // Quy đổi tọa độ [0..1000] sang % cắt 4 lề (làm tròn 0.5%)
    const toHalfPercent = (val) => {
      const clamped = Math.max(0, Math.min(45, val));
      return Math.round(clamped * 2) / 2;
    };

    const newRatios = {
      top: toHalfPercent(ymin / 10),
      left: toHalfPercent(xmin / 10),
      bottom: toHalfPercent((1000 - ymax) / 10),
      right: toHalfPercent((1000 - xmax) / 10)
    };

    if (typeof currentCropRatios !== "undefined") {
      currentCropRatios.top = newRatios.top;
      currentCropRatios.bottom = newRatios.bottom;
      currentCropRatios.left = newRatios.left;
      currentCropRatios.right = newRatios.right;
    }

    // Đồng bộ lại 4 thanh trượt (tự mở rộng max nếu AI đo > 30%)
    const sideMap = { Top: newRatios.top, Bottom: newRatios.bottom, Left: newRatios.left, Right: newRatios.right };
    Object.entries(sideMap).forEach(([side, val]) => {
      const slider = document.getElementById(`rangeCrop${side}`);
      if (slider) {
        if (val > parseFloat(slider.max || 30)) slider.max = Math.ceil(val + 5);
        slider.value = val;
      }
    });

    if (typeof updateRangeLabels === "function") updateRangeLabels();
    if (typeof drawCalibrateGrid === "function") drawCalibrateGrid();

    showToast(`AI đã đặt khung: Trên ${newRatios.top}% • Dưới ${newRatios.bottom}% • Trái ${newRatios.left}% • Phải ${newRatios.right}%`, "success");
  } catch (err) {
    console.error("Lỗi AI tự căn khung:", err);
    showToast(`AI căn khung thất bại: ${err.message}`, "error");
  } finally {
    if (btnAi) {
      btnAi.disabled = false;
      btnAi.classList.remove("opacity-60", "cursor-wait");
      btnAi.innerHTML = originalHtml;
      if (window.lucide) lucide.createIcons();
    }
  }
};

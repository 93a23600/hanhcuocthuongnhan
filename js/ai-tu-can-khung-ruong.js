/* MODULE: AI TỰ ĐỘNG ĐO VÀ VẼ KHUNG LƯỚI RƯƠNG 35 Ô (5×7) (js/ai-tu-can-khung-ruong.js) */

window.runAiAutoCalibrateGrid = async function() {
  if (typeof pendingRawImg === "undefined" || !pendingRawImg) {
    showToast("Chưa có ảnh rương để AI căn khung!", "error");
    return;
  }

  if (!appState || !appState.apiKey) {
    showToast("Vui lòng cài đặt Gemini API Key trước khi dùng AI căn khung!", "error");
    return;
  }

  const btnAi = document.getElementById("btnAiAutoCalibrate");
  const originalHtml = btnAi ? btnAi.innerHTML : "";
  if (btnAi) {
    btnAi.disabled = true;
    btnAi.classList.add("opacity-60", "cursor-wait");
    btnAi.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>AI đang đo khung...</span>`;
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

    const prompt = `Bạn là chuyên gia thị giác máy tính phân tích giao diện rương chứa đồ trong game kiếm hiệp (lưới 5 cột ngang × 7 hàng dọc = 35 ô vuông vật phẩm).
Hãy xác định chính xác vùng chữ nhật bao trọn 35 ô chứa đồ bên trong (KHÔNG bao gồm thanh tiêu đề "Rương chứa đồ", nút đóng X ở trên, thanh chuyển trang < 1 > ở dưới, hay viền cửa sổ bên ngoài).

Hãy trả về tỷ lệ phần trăm (%) cần cắt bỏ từ 4 mép của bức ảnh gốc để khớp khít đường viền ngoài cùng của lưới 5×7 ô:
- "top": % chiều cao cắt từ mép trên ảnh xuống tới mép trên của hàng ô đầu tiên (hàng 1).
- "bottom": % chiều cao cắt từ mép dưới ảnh lên tới mép dưới của hàng ô cuối cùng (hàng 7).
- "left": % chiều rộng cắt từ mép trái ảnh vào tới mép trái của cột ô đầu tiên (cột 1).
- "right": % chiều rộng cắt từ mép phải ảnh vào tới mép phải của cột ô cuối cùng (cột 5).

Quy tắc bắt buộc:
- Giá trị nằm trong khoảng 0 đến 45, làm tròn đến 0.5 (ví dụ: 1.5, 4.0, 12.5).
- Chỉ trả về duy nhất một đối tượng JSON hợp lệ, không giải thích thêm:
{"top": 0, "bottom": 0, "left": 0, "right": 0}`;

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
          temperature: 0.1,
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

    const clampStepHalf = (val) => {
      const num = parseFloat(val);
      if (isNaN(num)) return 0;
      const clamped = Math.max(0, Math.min(45, num));
      return Math.round(clamped * 2) / 2;
    };

    const newRatios = {
      top: clampStepHalf(parsed.top),
      bottom: clampStepHalf(parsed.bottom),
      left: clampStepHalf(parsed.left),
      right: clampStepHalf(parsed.right)
    };

    if (typeof currentCropRatios !== "undefined") {
      currentCropRatios.top = newRatios.top;
      currentCropRatios.bottom = newRatios.bottom;
      currentCropRatios.left = newRatios.left;
      currentCropRatios.right = newRatios.right;
    }

    // Đồng bộ lại 4 thanh trượt (mở rộng max nếu AI đo > 30%)
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

/* MODULE 3: GỌI API GEMINI VISION ĐỌC 35 Ô ĐÃ KHÓA KHUNG & DỮ LIỆU TRAIN DẦN (js/gemini-vision.js) */

async function analyzeChestWithGemini(base64Image) {
  // 1. Gom danh sách tên hợp lệ từ toàn bộ dữ liệu hệ thống & bộ não đã train dần (loại bỏ tên đã xóa)
  const deletedSet = new Set(
    (appState.deletedKnownItems || []).map(n => (n || "").trim().toLowerCase())
  );

  const validNameMap = new Map();
  const addValidName = (raw) => {
    const clean = (raw || "").trim();
    if (!clean) return;
    const lower = clean.toLowerCase();
    if (deletedSet.has(lower)) return;
    if (!validNameMap.has(lower)) validNameMap.set(lower, clean);
  };

  if (typeof KNOWN_ITEMS !== "undefined" && Array.isArray(KNOWN_ITEMS)) {
    KNOWN_ITEMS.forEach(addValidName);
  }
  if (Array.isArray(appState.customKnownItems)) {
    appState.customKnownItems.forEach(addValidName);
  }
  if (appState.learnedIcons) {
    Object.keys(appState.learnedIcons).forEach(addValidName);
  }
  const validItemNames = Array.from(validNameMap.values());

  // 2. Nạp kinh nghiệm đọc số đã được người dùng train dần
  let trainingPromptNotes = "";
  if (appState.trainedNumberErrors && appState.trainedNumberErrors.length > 0) {
    const errorExamples = appState.trainedNumberErrors.slice(-8).map(e =>
      `- Font số game này hay bị nhầm: nếu số nhìn giống "${e.wrongQty}" thì số đúng là "${e.correctQty}".`
    ).join("\n");
    trainingPromptNotes = `\nCÁC KINH NGHIỆM ĐỌC SỐ ĐÃ ĐƯỢC NGƯỜI DÙNG TRAIN:\n${errorExamples}\nHãy đối chiếu kỹ font số ở góc dưới bên phải từng ô.\n`;
  }

  // 3. Kiểm tra xem ảnh đã được khóa khung chuẩn 5x7 & gắn nhãn #1..#35 từ bước trước chưa
  const isVerifiedGrid = Boolean(
    (typeof pendingImage !== "undefined" && pendingImage && pendingImage.isVerifiedGrid) ||
    (window.aiVerifiedGridData && window.aiVerifiedGridData.verified)
  );

  const gridInstruction = isVerifiedGrid
    ? `Bức ảnh này ĐÃ ĐƯỢC NGƯỜI DÙNG KHÓA KHUNG CHUẨN 100% THEO LƯỚI 5 CỘT × 7 HÀNG (35 Ô) và đã kẻ viền đỏ + gắn nhãn số thứ tự màu vàng #1 đến #35 ở góc trên bên trái mỗi ô.
Hãy đọc chính xác từng ô theo đúng thứ tự nhãn từ #1 đến #35 (tương ứng phần tử index 0 đến 34 của mảng JSON). Tuyệt đối không tự chia lại khung, không nhảy cột, không lệch hàng.`
    : `Trích xuất tất cả đúng 35 ô theo thứ tự từ trái qua phải, từ trên xuống dưới của lưới rương 5 cột × 7 hàng.`;

  const prompt = `${gridInstruction}

DANH SÁCH TÊN VẬT PHẨM DUY NHẤT ĐƯỢC PHÉP DÙNG: ${JSON.stringify(validItemNames)}.${trainingPromptNotes}

QUY TẮC BẮT BUỘC (TUYỆT ĐỐI TUÂN THỦ):
1. CHỈ ĐỌC TÊN CÓ TRONG DANH SÁCH TRÊN: Bạn CHỈ được phép điền trường "name" bằng một tên có sẵn y hệt trong "DANH SÁCH TÊN VẬT PHẨM DUY NHẤT ĐƯỢC PHÉP DÙNG".
2. CẤM BỊA TÊN & CẤM ĐOÁN MÒ: Tuyệt đối KHÔNG tự nghĩ ra tên vật phẩm từ kiến thức bên ngoài, KHÔNG ghi "Vật phẩm lạ" hay "Trang bị lạ". Nếu ô đó trống, hoặc chứa vật phẩm/trang bị chưa có mẫu trong danh sách trên, BẮT BUỘC ghi "name": null để người dùng tự train thêm.
3. SỐ LƯỢNG & ĐỒ KHÔNG XẾP CHỒNG: Chỉ đọc con số màu trắng ở góc dưới bên phải từng ô (bỏ qua nhãn #1..#35 màu vàng ở góc trên trái nếu có). Nếu ô có hình đồ nhưng góc dưới bên phải KHÔNG có chữ số nào, ghi "qty": 1 và "hasStackNum": false. Nếu có chữ số (ví dụ 999, 120, 2...), ghi đúng số đó và "hasStackNum": true. Nếu "name" là null nhưng ô vẫn có hình đồ thì vẫn đọc đúng số lượng ở góc dưới phải (không có số thì qty: 1, hasStackNum: false); nếu ô trống hoàn toàn không có hình đồ thì ghi "qty": 0, "hasStackNum": false.

Trả về đúng mảng JSON 35 phần tử tương ứng với 35 ô (#1 -> #35):
[
  {"name": "Tên vật phẩm khớp trong danh sách", "qty": 999, "hasStackNum": true},
  {"name": null, "qty": 775, "hasStackNum": true},
  {"name": null, "qty": 0, "hasStackNum": false}
]`;

  const selectedModel = appState.geminiModel || "gemini-2.5-flash";

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${appState.apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: "image/png", data: base64Image } }
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
    const errMsg = errData?.error?.message || `HTTP ${response.status}`;
    throw new Error(`Lỗi gọi model [${selectedModel}]: ${errMsg}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  const rawSlots = JSON.parse(rawText.replace(/```json|```/gi, "").trim());

  // 4. Lớp khóa cứng đầu ra: Bất kỳ tên nào không nằm trong validNameMap đều trả về null để người dùng train
  return Array.from({ length: 35 }, (_, idx) => {
    const slot = rawSlots[idx] || {};
    const rawName = typeof slot.name === "string" ? slot.name.trim() : "";
    const matchedStandardName = rawName ? (validNameMap.get(rawName.toLowerCase()) || null) : null;

    return {
      name: matchedStandardName,
      qty: parseInt(slot.qty) || 0,
      hasStackNum: Boolean(slot.hasStackNum)
    };
  });
}

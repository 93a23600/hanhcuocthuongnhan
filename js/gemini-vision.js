/* MODULE 3: GỌI API GEMINI VISION ĐỌC 35 Ô (js/gemini-vision.js) */

async function analyzeChestWithGemini(base64Image) {
  // 1. Gom toàn bộ danh sách tên vật phẩm hợp lệ đang có trong dữ liệu hệ thống
  const validNameMap = new Map();
  if (typeof KNOWN_ITEMS !== "undefined" && Array.isArray(KNOWN_ITEMS)) {
    KNOWN_ITEMS.forEach(n => { if (n && n.trim()) validNameMap.set(n.trim().toLowerCase(), n.trim()); });
  }
  if (Array.isArray(appState.customKnownItems)) {
    appState.customKnownItems.forEach(n => { if (n && n.trim()) validNameMap.set(n.trim().toLowerCase(), n.trim()); });
  }
  if (appState.learnedIcons) {
    Object.keys(appState.learnedIcons).forEach(n => { if (n && n.trim()) validNameMap.set(n.trim().toLowerCase(), n.trim()); });
  }
  const validItemNames = Array.from(validNameMap.values());

  let trainingPromptNotes = "";
  if (appState.trainedNumberErrors && appState.trainedNumberErrors.length > 0) {
    const errorExamples = appState.trainedNumberErrors.slice(-5).map(e => 
      `- Font số game này hay bị nhầm: nếu số nhìn giống "${e.wrongQty}" thì số đúng là "${e.correctQty}".`
    ).join("\n");
    trainingPromptNotes = `\nCÁC KINH NGHIỆM ĐỌC SỐ ĐÃ HỌC:\n${errorExamples}\nHãy đọc thật kỹ số lượng góc dưới bên phải.\n`;
  }

  const prompt = `Trích xuất tất cả đúng 35 ô theo thứ tự từ trái qua phải, từ trên xuống dưới của lưới rương 5 cột x 7 hàng.
DANH SÁCH TÊN VẬT PHẨM DUY NHẤT ĐƯỢC PHÉP DÙNG: ${JSON.stringify(validItemNames)}.${trainingPromptNotes}

QUY TẮC BẮT BUỘC (TUYỆT ĐỐI TUÂN THỦ):
1. CHỈ ĐỌC TÊN CÓ TRONG DANH SÁCH TRÊN: Bạn CHỈ được phép điền trường "name" bằng một tên có sẵn y hệt trong "DANH SÁCH TÊN VẬT PHẨM DUY NHẤT ĐƯỢC PHÉP DÙNG".
2. CẤM BỊA TÊN & CẤM ĐOÁN MÒ: Tuyệt đối KHÔNG tự nghĩ ra tên vật phẩm từ kiến thức bên ngoài, KHÔNG ghi "Vật phẩm lạ" hay "Trang bị lạ". Nếu ô đó trống, hoặc chứa vật phẩm/trang bị không giống chính xác món nào trong danh sách trên, BẮT BUỘC ghi "name": null.
3. SỐ LƯỢNG & ĐỒ KHÔNG XẾP CHỒNG: Chỉ đọc con số ở góc dưới bên phải ô. Nếu ô có hình đồ nhưng góc dưới bên phải KHÔNG có chữ số nào, ghi "qty": 1 và "hasStackNum": false. Nếu có chữ số (ví dụ 999, 120, 2...), ghi đúng số đó và "hasStackNum": true. Nếu "name" là null nhưng ô vẫn có hình đồ chưa nhận diện được thì vẫn đọc đúng số lượng ở góc (nếu không có số thì qty: 1, hasStackNum: false); nếu ô trống không có hình đồ thì ghi "qty": 0, "hasStackNum": false.

Trả về đúng mảng JSON 35 phần tử tương ứng với 35 ô:
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
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData?.error?.message || `HTTP ${response.status}`;
    throw new Error(`Lỗi gọi model [${selectedModel}]: ${errMsg}`);
  }

  const data = await response.json();
  const rawSlots = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || "[]");

  // 2. Lớp khóa cứng đầu ra: Bất kỳ tên nào không nằm trong validNameMap đều bị xóa về null (để trống)
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

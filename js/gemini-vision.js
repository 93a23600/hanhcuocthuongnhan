/* MODULE 3: GỌI API GEMINI VISION ĐỌC 35 Ô (js/gemini-vision.js) */

async function analyzeChestWithGemini(base64Image) {
  let trainingPromptNotes = "";
  if (appState.trainedNumberErrors && appState.trainedNumberErrors.length > 0) {
    const errorExamples = appState.trainedNumberErrors.slice(-5).map(e => 
      `- Font số game này hay bị nhầm: nếu số nhìn giống "${e.wrongQty}" thì số đúng là "${e.correctQty}".`
    ).join("\n");
    trainingPromptNotes = `\nCÁC KINH NGHIỆM ĐỌC SỐ ĐÃ HỌC:\n${errorExamples}\nHãy đọc thật kỹ số lượng góc dưới bên phải.\n`;
  }

  const prompt = `Trích xuất tất cả đúng 35 ô theo thứ tự từ trái qua phải, từ trên xuống dưới của lưới rương 5 cột x 7 hàng.
Danh mục tên vật phẩm chuẩn đã biết: ${JSON.stringify(KNOWN_ITEMS)}.${trainingPromptNotes}

QUY TẮC BẮT BUỘC (TUYỆT ĐỐI KHÔNG SUY DIỄN SAI):
1. KHÔNG ÉP TÊN: Chỉ dùng tên trong "Danh mục tên vật phẩm chuẩn đã biết" khi icon thực sự khớp đúng vật phẩm đó. Nếu ô chứa TRANG BỊ (vũ khí, nón, áo, giày, nhẫn, ngọc bội...) hoặc vật phẩm lạ chưa có trong danh mục thì TUYỆT ĐỐI KHÔNG đoán mò hay gán bừa vào tên có sẵn — hãy ghi name là "Vật phẩm lạ" (hoặc "Trang bị lạ" nếu là trang bị).
2. SỐ LƯỢNG & ĐỒ KHÔNG XẾP CHỒNG: Chỉ đọc con số ở góc dưới bên phải ô. Nếu ô có vật phẩm/trang bị nhưng góc dưới bên phải KHÔNG có chữ số nào (đồ đơn lẻ không xếp chồng), ghi qty là 1 và hasStackNum là false. Nếu có chữ số (ví dụ 999, 120, 2...), ghi đúng số đó và hasStackNum là true. Nếu ô trống hoàn toàn, ghi name là null, qty là 0, hasStackNum là false.

Trả về đúng mảng JSON 35 phần tử tương ứng với 35 ô:
[
  {"name": "Tên vật phẩm", "qty": 999, "hasStackNum": true},
  {"name": "Trang bị lạ", "qty": 1, "hasStackNum": false},
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
  return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
}

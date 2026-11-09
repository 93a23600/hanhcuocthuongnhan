let pendingImage = null;
let pendingCrops = []; // Chứa 30 ảnh nhỏ đã cắt sẵn từ Canvas

/* Tự động chia lưới ảnh thành 5 cột x 6 hàng = 30 ô nhỏ */
function sliceGrid30Slots(imgElement) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const COLS = 5;
  const ROWS = 6;
  const cellW = imgElement.naturalWidth / COLS;
  const cellH = imgElement.naturalHeight / ROWS;

  canvas.width = cellW;
  canvas.height = cellH;

  const crops = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      ctx.clearRect(0, 0, cellW, cellH);
      ctx.drawImage(
        imgElement,
        c * cellW, r * cellH, cellW, cellH,
        0, 0, cellW, cellH
      );
      crops.push(canvas.toDataURL("image/png"));
    }
  }
  return crops;
}

/* Gửi ảnh lên Gemini để nhận diện danh sách 30 ô */
async function analyzeChestWithGemini(base64Image) {
  const prompt = `Trích xuất tất cả 30 ô theo thứ tự từ trái qua phải, từ trên xuống dưới của lưới rương 5 cột x 6 hàng.
Danh mục tên vật phẩm chuẩn: ${JSON.stringify(KNOWN_ITEMS)}.
Trả về đúng mảng JSON 30 phần tử tương ứng với 30 ô (nếu ô trống thì ghi name là null, qty là 0):
[
  {"name": "Tên vật phẩm", "qty": 999},
  {"name": null, "qty": 0}
]`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${appState.apiKey}`, {
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
  if (!response.ok) throw new Error("Lỗi gọi Gemini Vision");
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(text);
}

function handleIncomingFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const base64 = dataUrl.split(",")[1];

    // Tạo ảnh tạm để cắt 30 ô
    const img = new Image();
    img.onload = () => {
      pendingCrops = sliceGrid30Slots(img);
      pendingImage = { base64, dataUrl };
      document.getElementById("uploadPreviewImg").src = dataUrl;
      openUploadModal();
    };
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

async function executeUpload(accountName, chestTitle) {
  if (!pendingImage) return;
  const badge = document.getElementById("readingBadge");
  badge.classList.remove("hidden");
  showToast(`Đang phân tích và cắt icon nạp vào [${accountName} - ${chestTitle}]...`, "info");

  try {
    let detectedArray = [];
    if (appState.apiKey) {
      detectedArray = await analyzeChestWithGemini(pendingImage.base64);
    } else {
      // Demo giả lập nếu chưa có API Key
      await new Promise(r => setTimeout(r, 600));
      detectedArray = Array.from({ length: 30 }, (_, i) => {
        if (i < 8) return { name: KNOWN_ITEMS[i % KNOWN_ITEMS.length], qty: 999 };
        return { name: null, qty: 0 };
      });
    }

    // Ghép kết quả AI với 30 ảnh vừa cắt
    const finalSlots = Array.from({ length: 30 }, (_, idx) => {
      const aiSlot = detectedArray[idx] || { name: null, qty: 0 };
      const crop = pendingCrops[idx] || null;

      // Lưu icon vào kho từ điển nếu ô có đồ
      if (aiSlot.name && crop) {
        appState.itemIcons[aiSlot.name] = crop;
      }

      return {
        name: aiSlot.name,
        qty: aiSlot.qty || 0,
        cropImg: crop
      };
    });

    if (!appState.accounts.includes(accountName)) {
      appState.accounts.push(accountName);
    }

    let chest = appState.chests.find(c => c.account === accountName && c.title === chestTitle);
    if (chest) {
      chest.slots = finalSlots;
      chest.createdAt = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else {
      appState.chests.push({
        id: "chest-" + Date.now(),
        account: accountName,
        title: chestTitle,
        createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        slots: finalSlots
      });
    }

    // Chuyển góc nhìn ngay về Acc & Rương vừa nạp
    appState.viewingAcc = accountName;
    appState.viewingChest = chestTitle;

    saveState();
    showToast(`Đã nạp thành công [${accountName} - ${chestTitle}]! Bấm vào các ô để kiểm tra.`, "success");
  } catch (err) {
    showToast("Lỗi phân tích: " + err.message, "error");
  } finally {
    badge.classList.add("hidden");
    pendingImage = null;
    pendingCrops = [];
  }
}

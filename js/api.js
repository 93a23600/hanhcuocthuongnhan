let pendingImage = null;
let pendingCrops = [];

// Hàm tính mã băm hình ảnh 64-bit đơn giản (DHash)
function computeImageHash(imgDataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const cvs = document.createElement("canvas");
      const ctx = cvs.getContext("2d");
      cvs.width = 9;
      cvs.height = 8;
      ctx.drawImage(img, 0, 0, 9, 8);
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

// Cắt 30 ô rương an toàn bằng Canvas
function sliceGrid30Slots(imgElement) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const cellW = Math.floor(imgElement.naturalWidth / 5);
  const cellH = Math.floor(imgElement.naturalHeight / 6);
  canvas.width = cellW;
  canvas.height = cellH;

  const crops = [];
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 5; c++) {
      ctx.clearRect(0, 0, cellW, cellH);
      ctx.drawImage(imgElement, c * cellW, r * cellH, cellW, cellH, 0, 0, cellW, cellH);
      crops.push(canvas.toDataURL("image/png"));
    }
  }
  return crops;
}

// Gọi Gemini Vision
async function analyzeChestWithGemini(base64Image) {
  let trainingPromptNotes = "";
  if (appState.trainedNumberErrors && appState.trainedNumberErrors.length > 0) {
    const errorExamples = appState.trainedNumberErrors.slice(-5).map(e => 
      `- Font số game này hay bị nhầm: nếu số nhìn giống "${e.wrongQty}" thì lưu ý kiểm tra kỹ lại, số đúng là "${e.correctQty}".`
    ).join("\n");
    trainingPromptNotes = `\nCÁC KINH NGHIỆM ĐỌC SỐ ĐÃ HỌC:\n${errorExamples}\nHãy đọc thật kỹ số lượng góc dưới bên phải.\n`;
  }

  const prompt = `Trích xuất tất cả 30 ô theo thứ tự từ trái qua phải, từ trên xuống dưới của lưới rương 5 cột x 6 hàng.
Danh mục tên vật phẩm chuẩn: ${JSON.stringify(KNOWN_ITEMS)}.${trainingPromptNotes}
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
  return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
}

// Nhận diện file từ Paste hoặc File Input
function handleIncomingFile(file) {
  if (!file || !file.type || !file.type.startsWith("image/")) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const base64 = dataUrl.split(",")[1];

    const img = new Image();
    img.onload = () => {
      try {
        pendingCrops = sliceGrid30Slots(img);
      } catch (err) {
        console.error("Lỗi cắt ảnh:", err);
        pendingCrops = Array(30).fill(dataUrl);
      }
      pendingImage = { base64, dataUrl };
      
      const previewEl = document.getElementById("uploadPreviewImg");
      if (previewEl) previewEl.src = dataUrl;
      
      openUploadModal();
    };
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

// Thực thi nạp rương
async function executeUpload(accountName, chestTitle) {
  if (!pendingImage) return;
  const badge = document.getElementById("readingBadge");
  if (badge) badge.classList.remove("hidden");
  showToast(`Đang phân tích rương [${accountName} - ${chestTitle}]...`, "info");

  try {
    let aiSlots = [];
    if (appState.apiKey) {
      aiSlots = await analyzeChestWithGemini(pendingImage.base64);
    } else {
      await new Promise(r => setTimeout(r, 600));
      aiSlots = Array.from({ length: 30 }, (_, i) => ({
        name: i < 10 ? (KNOWN_ITEMS[i] || "Vật phẩm") : null,
        qty: i < 10 ? 999 : 0
      }));
    }

    const finalSlots = [];
    for (let i = 0; i < 30; i++) {
      const crop = pendingCrops[i] || null;
      let assignedName = aiSlots[i]?.name || null;
      let assignedQty = aiSlots[i]?.qty || 0;

      if (crop && appState.learnedIcons) {
        const cropHash = await computeImageHash(crop);
        let bestMatchName = null;
        let lowestDist = 999;

        for (const [learnedName, val] of Object.entries(appState.learnedIcons)) {
          if (!val || !val.hash) continue;
          const dist = getHammingDistance(cropHash, val.hash);
          if (dist < lowestDist && dist <= 6) {
            lowestDist = dist;
            bestMatchName = learnedName;
          }
        }
        if (bestMatchName) assignedName = bestMatchName;
      }

      finalSlots.push({
        name: assignedName,
        qty: assignedName ? assignedQty : 0,
        cropImg: crop,
        aiOriginalQty: assignedQty
      });
    }

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

    appState.viewingAcc = accountName;
    appState.viewingChest = chestTitle;
    appState.selectedSlotIndex = 0;

    saveState();
    showToast(`Đã nạp xong rương [${accountName} - ${chestTitle}]!`, "success");
  } catch (err) {
    showToast("Lỗi phân tích: " + err.message, "error");
  } finally {
    if (badge) badge.classList.add("hidden");
    pendingImage = null;
    pendingCrops = [];
  }
}

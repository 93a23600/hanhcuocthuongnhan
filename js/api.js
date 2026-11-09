let pendingImage = null;
let pendingCrops = [];

// Hàm tính mã băm hình ảnh 64-bit đơn giản (Perceptual DHash) để so khớp độ trùng icon
function computeImageHash(imgDataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const cvs = document.createElement("canvas");
      const ctx = cvs.getContext("2d");
      cvs.width = 9;
      cvs.height = 8;
      // Thu nhỏ và chuyển về ảnh xám (Grayscale)
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
    img.src = imgDataUrl;
  });
}

// Tính khoảng cách sai khác Hamming (càng nhỏ càng giống nhau)
function getHammingDistance(h1, h2) {
  if (!h1 || !h2 || h1.length !== h2.length) return 999;
  let diff = 0;
  for (let i = 0; i < h1.length; i++) {
    if (h1[i] !== h2[i]) diff++;
  }
  return diff;
}

// Cắt 30 ô rương
function sliceGrid30Slots(imgElement) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const cellW = imgElement.naturalWidth / 5;
  const cellH = imgElement.naturalHeight / 6;
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

// Gọi Gemini kèm bộ nhớ học lỗi số lượng
async function analyzeChestWithGemini(base64Image) {
  // Chuẩn bị danh sách lỗi số lượng người dùng đã từng dạy
  let trainingPromptNotes = "";
  if (appState.trainedNumberErrors && appState.trainedNumberErrors.length > 0) {
    const errorExamples = appState.trainedNumberErrors.slice(-5).map(e => 
      `- Font số trong game này hay bị nhầm: nếu số nhìn giống "${e.wrongQty}" thì lưu ý kiểm tra kỹ lại, trước đó số thực tế đúng là "${e.correctQty}".`
    ).join("\n");
    trainingPromptNotes = `\nCÁC KINH NGHIỆM ĐỌC SỐ ĐÃ HỌC TỪ NGƯỜI DÙNG:\n${errorExamples}\nHãy đọc thật kỹ số lượng góc dưới bên phải, tránh các lỗi trên.\n`;
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

function handleIncomingFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const base64 = dataUrl.split(",")[1];
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
  showToast(`Đang phân tích và so khớp hình ảnh [${accountName} - ${chestTitle}]...`, "info");

  try {
    let aiSlots = [];
    if (appState.apiKey) {
      aiSlots = await analyzeChestWithGemini(pendingImage.base64);
    } else {
      await new Promise(r => setTimeout(r, 600));
      aiSlots = Array.from({ length: 30 }, (_, i) => ({ name: i < 10 ? KNOWN_ITEMS[i] : null, qty: i < 10 ? 999 : 0 }));
    }

    // Tự động so khớp với kho icon đã học
    const finalSlots = [];
    for (let i = 0; i < 30; i++) {
      const crop = pendingCrops[i];
      let assignedName = aiSlots[i]?.name || null;
      let assignedQty = aiSlots[i]?.qty || 0;

      // Nếu ô có hình ảnh, kiểm tra trong kho icon đã học
      if (crop) {
        const cropHash = await computeImageHash(crop);
        let bestMatchName = null;
        let lowestDist = 999;

        // So sánh với tất cả icon bạn từng sửa
        for (const [learnedName, val] of Object.entries(appState.learnedIcons)) {
          const dist = getHammingDistance(cropHash, val.hash);
          if (dist < lowestDist && dist <= 6) { // Ngưỡng giống nhau >= 90%
            lowestDist = dist;
            bestMatchName = learnedName;
          }
        }

        // Nếu trùng icon bạn từng sửa, ưu tiên lấy tên bạn đã dạy
        if (bestMatchName) {
          assignedName = bestMatchName;
        }
      }

      finalSlots.push({
        name: assignedName,
        qty: assignedName ? assignedQty : 0,
        cropImg: crop,
        aiOriginalQty: assignedQty // Lưu lại số lượng gốc AI từng đoán để đối chiếu
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
    showToast(`Đã nạp xong rương! Thông tin ô 1 đã mở ở bảng bên phải.`, "success");
  } catch (err) {
    showToast("Lỗi phân tích: " + err.message, "error");
  } finally {
    badge.classList.add("hidden");
    pendingImage = null;
    pendingCrops = [];
  }
}

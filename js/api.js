let pendingRawImg = null;
let currentCropRatios = { top: 0, bottom: 0, left: 0, right: 0 };
let pendingImage = null;
let pendingCrops = [];

// 1. Tính mã băm hình ảnh 64-bit (DHash)
function computeImageHash(imgDataUrl) {
  return new Promise((resolve) => {
    if (!imgDataUrl) return resolve("");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
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
      } catch (e) {
        resolve("");
      }
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

// 2. Nhận file ảnh
function handleIncomingFile(file) {
  if (!file || !file.type || !file.type.startsWith("image/")) {
    alert("Vui lòng chọn hoặc dán đúng tệp hình ảnh!");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const img = new Image();
    img.onload = () => {
      pendingRawImg = img;
      currentCropRatios = Object.assign({}, appState.learnedGridCrop || { top: 0, bottom: 0, left: 0, right: 0 });
      openCalibrateModal();
    };
    img.onerror = () => alert("Không thể đọc định dạng ảnh này!");
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

// 3. Mở Modal Căn Chỉnh Khung (5x7)
function openCalibrateModal() {
  const modal = document.getElementById("cropCalibrateModal");
  if (!modal || !pendingRawImg) return;

  const rTop = document.getElementById("rangeCropTop");
  const rBottom = document.getElementById("rangeCropBottom");
  const rLeft = document.getElementById("rangeCropLeft");
  const rRight = document.getElementById("rangeCropRight");

  if (rTop) rTop.value = currentCropRatios.top;
  if (rBottom) rBottom.value = currentCropRatios.bottom;
  if (rLeft) rLeft.value = currentCropRatios.left;
  if (rRight) rRight.value = currentCropRatios.right;

  updateRangeLabels();
  drawCalibrateGrid();
  modal.classList.remove("hidden");
  if (window.lucide) lucide.createIcons();
}

function updateRangeLabels() {
  const elTop = document.getElementById("valCropTop");
  const elBottom = document.getElementById("valCropBottom");
  const elLeft = document.getElementById("valCropLeft");
  const elRight = document.getElementById("valCropRight");

  if (elTop) elTop.textContent = `${currentCropRatios.top}%`;
  if (elBottom) elBottom.textContent = `${currentCropRatios.bottom}%`;
  if (elLeft) elLeft.textContent = `${currentCropRatios.left}%`;
  if (elRight) elRight.textContent = `${currentCropRatios.right}%`;
}

// 4. Vẽ lưới 5 CỘT x 7 HÀNG (35 Ô)
function drawCalibrateGrid() {
  const canvas = document.getElementById("calibrateCanvas");
  if (!canvas || !pendingRawImg) return;
  const ctx = canvas.getContext("2d");

  canvas.width = pendingRawImg.naturalWidth;
  canvas.height = pendingRawImg.naturalHeight;

  ctx.drawImage(pendingRawImg, 0, 0);

  const x = (currentCropRatios.left / 100) * canvas.width;
  const y = (currentCropRatios.top / 100) * canvas.height;
  const w = Math.max(1, canvas.width - x - ((currentCropRatios.right / 100) * canvas.width));
  const h = Math.max(1, canvas.height - y - ((currentCropRatios.bottom / 100) * canvas.height));

  // Vùng tối che viền ngoài
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.fillRect(0, 0, canvas.width, y);
  ctx.fillRect(0, y + h, canvas.width, canvas.height - (y + h));
  ctx.fillRect(0, y, x, h);
  ctx.fillRect(x + w, y, canvas.width - (x + w), h);

  // Khung viền ngoài
  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  // Kẻ lưới chuẩn 5 CỘT x 7 HÀNG
  ctx.strokeStyle = "rgba(52, 211, 153, 0.8)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);

  const stepX = w / 5;
  const stepY = h / 7; // Chia cho 7 hàng

  for (let c = 1; c < 5; c++) {
    ctx.beginPath();
    ctx.moveTo(x + c * stepX, y);
    ctx.lineTo(x + c * stepX, y + h);
    ctx.stroke();
  }
  for (let r = 1; r < 7; r++) { // 7 hàng kẻ 6 đường ngang
    ctx.beginPath();
    ctx.moveTo(x, y + r * stepY);
    ctx.lineTo(x + w, y + r * stepY);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

// 5. Cắt chính xác đúng 35 Ô (5 cột x 7 hàng)
function sliceGridWithRatios(imgElement, ratios) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const totalW = imgElement.naturalWidth;
  const totalH = imgElement.naturalHeight;

  const startX = (ratios.left / 100) * totalW;
  const startY = (ratios.top / 100) * totalH;
  const activeW = totalW - startX - ((ratios.right / 100) * totalW);
  const activeH = totalH - startY - ((ratios.bottom / 100) * totalH);

  const stepX = activeW / 5;
  const stepY = activeH / 7; // Chia 7 hàng

  const crops = [];
  canvas.width = 90;
  canvas.height = 90;

  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 5; c++) {
      ctx.clearRect(0, 0, 90, 90);
      const srcX = startX + c * stepX;
      const srcY = startY + r * stepY;

      ctx.drawImage(imgElement, srcX, srcY, stepX, stepY, 0, 0, 90, 90);
      crops.push(canvas.toDataURL("image/png"));
    }
  }
  return crops;
}

// 6. Gửi Gemini Vision trích xuất đúng 35 Ô
async function analyzeChestWithGemini(base64Image) {
  let trainingPromptNotes = "";
  if (appState.trainedNumberErrors && appState.trainedNumberErrors.length > 0) {
    const errorExamples = appState.trainedNumberErrors.slice(-5).map(e => 
      `- Font số game này hay bị nhầm: nếu số nhìn giống "${e.wrongQty}" thì số đúng là "${e.correctQty}".`
    ).join("\n");
    trainingPromptNotes = `\nCÁC KINH NGHIỆM ĐỌC SỐ ĐÃ HỌC:\n${errorExamples}\nHãy đọc thật kỹ số lượng góc dưới bên phải.\n`;
  }

  const prompt = `Trích xuất tất cả đúng 35 ô theo thứ tự từ trái qua phải, từ trên xuống dưới của lưới rương 5 cột x 7 hàng.
Danh mục tên vật phẩm chuẩn: ${JSON.stringify(KNOWN_ITEMS)}.${trainingPromptNotes}
Trả về đúng mảng JSON 35 phần tử tương ứng với 35 ô (nếu ô trống thì ghi name là null, qty là 0):
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

// 7. Thực thi nạp rương 35 ô
async function executeUpload(accountName, chestTitle) {
  if (!pendingImage) return;
  const badge = document.getElementById("readingBadge");
  if (badge) badge.classList.remove("hidden");
  showToast(`Đang phân tích rương 35 ô [${accountName} - ${chestTitle}]...`, "info");

  try {
    let aiSlots = [];
    if (appState.apiKey) {
      aiSlots = await analyzeChestWithGemini(pendingImage.base64);
    } else {
      await new Promise(r => setTimeout(r, 600));
      aiSlots = Array.from({ length: 35 }, (_, i) => ({
        name: i < 15 ? (KNOWN_ITEMS[i] || "Vật phẩm") : null,
        qty: i < 15 ? 999 : 0
      }));
    }

    const finalSlots = [];
    for (let i = 0; i < 35; i++) {
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

    saveChestsState();
    showToast(`Đã nạp xong rương [${accountName} - ${chestTitle}] (35 ô)!`, "success");
  } catch (err) {
    showToast("Lỗi phân tích: " + err.message, "error");
  } finally {
    if (badge) badge.classList.add("hidden");
    pendingImage = null;
    pendingCrops = [];
  }
}

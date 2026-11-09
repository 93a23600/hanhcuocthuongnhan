let pendingImage = null;

async function analyzeChestWithGemini(base64Image) {
  const prompt = `Trích xuất tất cả các ô vật phẩm trong rương đồ game này.
Danh mục tên vật phẩm chuẩn: ${JSON.stringify(KNOWN_ITEMS)}.
Chỉ trả về JSON Array: [{"name": "Tên", "qty": 999}]`;

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
  if (!response.ok) throw new Error("Lỗi API Gemini");
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
    pendingImage = { base64, dataUrl };

    document.getElementById("uploadPreviewImg").src = dataUrl;
    openUploadModal();
  };
  reader.readAsDataURL(file);
}

async function executeUpload(accountName, chestTitle) {
  if (!pendingImage) return;
  const badge = document.getElementById("readingBadge");
  badge.classList.remove("hidden");
  showToast(`Đang quét ảnh nạp vào [${accountName} - ${chestTitle}]...`, "info");

  try {
    let slots = [];
    if (appState.apiKey) {
      slots = await analyzeChestWithGemini(pendingImage.base64);
    } else {
      await new Promise(r => setTimeout(r, 600));
      slots = [
        { name: "Võ sĩ yêu đái", qty: 999 },
        { name: "Linh Cầm", qty: 999 },
        { name: "Quỷ Hồn", qty: 999 }
      ];
    }

    if (!appState.accounts.includes(accountName)) {
      appState.accounts.push(accountName);
    }

    let chest = appState.chests.find(c => c.account === accountName && c.title === chestTitle);
    if (chest) {
      chest.slots = slots;
      chest.createdAt = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else {
      appState.chests.push({
        id: "chest-" + Date.now(),
        account: accountName,
        title: chestTitle,
        createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        slots: slots
      });
    }

    saveState();
    showToast(`Đã cập nhật xong [${accountName} - ${chestTitle}]!`, "success");
  } catch (err) {
    showToast("Lỗi: " + err.message, "error");
  } finally {
    badge.classList.add("hidden");
    pendingImage = null;
  }
}

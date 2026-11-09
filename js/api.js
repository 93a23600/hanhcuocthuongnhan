let pendingImage = null; // Lưu ảnh tạm thời chờ xác nhận Acc & Rương

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve({ base64, dataUrl: reader.result });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function analyzeChestWithGemini(base64Image) {
  const systemPrompt = `Bạn là trợ lý chuyên bóc tách dữ liệu rương đồ game võ hiệp dạng lưới.
Hãy nhìn vào ảnh rương đồ và trích xuất danh sách các ô có chứa vật phẩm và số lượng tương ứng.
Danh mục tên vật phẩm chuẩn của game bao gồm:
[${KNOWN_ITEMS.join(", ")}].

QUY TẮC QUAN TRỌNG:
1. Trả về đúng định dạng JSON Array chứa các object { "name": string, "qty": number }.
2. Không thêm markdown, không thêm chữ giải thích bên ngoài.
3. Số lượng thường có tiền tố 'x' góc dưới (ví dụ x999, x508, x116). Chỉ lấy số nguyên dương.
4. Ô nào trống thì bỏ qua.`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: "Hãy nhận diện tất cả các ô vật phẩm trong rương đồ này và số lượng tương ứng theo định dạng JSON:" },
          {
            inlineData: {
              mimeType: "image/png",
              data: base64Image
            }
          }
        ]
      }
    ],
    generationConfig: { responseMimeType: "application/json" },
    systemInstruction: { parts: [{ text: systemPrompt }] }
  };

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${appState.apiKey}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Lỗi API (${res.status})`);
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error("AI không thể trích xuất vật phẩm từ ảnh này.");

  const parsed = JSON.parse(rawText);
  if (!Array.isArray(parsed)) throw new Error("Định dạng dữ liệu trả về từ AI không hợp lệ.");
  return parsed;
}

// Khi người dùng dán hoặc thả ảnh -> MỞ POPUP XÁC NHẬN
async function handleIncomingImages(files) {
  if (!files || files.length === 0) return;
  const file = files[0];
  if (!file.type.startsWith("image/")) return;

  const { base64, dataUrl } = await fileToBase64(file);
  pendingImage = { base64, dataUrl };

  // Mở Popup
  document.getElementById("uploadPreviewImg").src = dataUrl;
  openConfirmUploadModal();
}

// Bấm nút "Cập Nhật Rương" trên Modal
async function executeUploadToChest(accountName, chestTitle) {
  if (!pendingImage) return;
  const readingBadge = document.getElementById("readingBadge");
  readingBadge.classList.remove("hidden");
  showToast(`Đang phân tích và nạp vào [${accountName} - ${chestTitle}]...`, "info");

  try {
    let detectedSlots = [];
    if (appState.apiKey && appState.apiKey.trim().length > 0) {
      detectedSlots = await analyzeChestWithGemini(pendingImage.base64);
    } else {
      await new Promise(r => setTimeout(r, 600));
      detectedSlots = JSON.parse(JSON.stringify(MOCK_CHESTS_DATA[0].slots));
    }

    // Tìm xem rương này của Acc này đã có chưa
    let targetChest = appState.chests.find(c => c.account === accountName && c.title === chestTitle);
    if (targetChest) {
      // Có rồi -> Cập nhật đè
      targetChest.slots = detectedSlots;
      targetChest.imageUrl = pendingImage.dataUrl;
      targetChest.createdAt = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
    } else {
      // Chưa có -> Tạo rương mới cho Acc này
      appState.chests.push({
        id: "chest-" + Date.now(),
        account: accountName,
        title: chestTitle,
        imageUrl: pendingImage.dataUrl,
        createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
        slots: detectedSlots
      });
    }

    showToast(`Đã cập nhật thành công [${accountName} - ${chestTitle}] (${detectedSlots.length} ô)!`, "success");
    savePersistedState();
  } catch (err) {
    console.error(err);
    showToast(`Lỗi phân tích: ${err.message}`, "error");
  } finally {
    readingBadge.classList.add("hidden");
    pendingImage = null;
  }
}

/* MODULE: NẠP & LƯU TRỮ LOCALSTORAGE (js/luu-tai-du-lieu.js) */

function compressSlotCropDataUrl(dataUrl, size = 52, quality = 0.72) {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image")) {
      return resolve(dataUrl || null);
    }
    const img = new Image();
    img.onload = () => {
      const cvs = document.createElement("canvas");
      cvs.width = size;
      cvs.height = size;
      const ctx = cvs.getContext("2d");
      ctx.drawImage(img, 0, 0, size, size);
      resolve(cvs.toDataURL("image/webp", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function loadState() {
  const brainSaved = localStorage.getItem(STORAGE_BRAIN_KEY);
  if (brainSaved) {
    try {
      const parsedBrain = JSON.parse(brainSaved);
      appState.learnedGridCrop = parsedBrain.learnedGridCrop || { top: 0, bottom: 0, left: 0, right: 0 };
      appState.deletedKnownItems = parsedBrain.deletedKnownItems || [];
      const deletedSet = new Set(appState.deletedKnownItems.map(s => s.trim().toLowerCase()));
      
      const rawIcons = parsedBrain.learnedIcons || {};
      const normalizedIcons = {};
      for (const [name, val] of Object.entries(rawIcons)) {
        if (deletedSet.has(name.trim().toLowerCase())) continue;
        if (Array.isArray(val)) {
          normalizedIcons[name] = val;
        } else if (val && typeof val === "object" && (val.img || val.hash)) {
          normalizedIcons[name] = [val];
        }
      }
      appState.learnedIcons = normalizedIcons;

      appState.trainedNumberErrors = parsedBrain.trainedNumberErrors || [];
      appState.customKnownItems = (parsedBrain.customKnownItems || []).filter(
        name => !deletedSet.has(name.trim().toLowerCase())
      );
      appState.noAdkAccounts = parsedBrain.noAdkAccounts || [];
      appState.reportIncludedAccounts = Array.isArray(parsedBrain.reportIncludedAccounts) ? parsedBrain.reportIncludedAccounts : null;
      appState.filterReportAccs = !!parsedBrain.filterReportAccs;
      appState.equipmentItems = parsedBrain.equipmentItems || [];
      appState.hideEquipment = !!parsedBrain.hideEquipment;
      
      if (typeof KNOWN_ITEMS !== "undefined" && Array.isArray(KNOWN_ITEMS)) {
        KNOWN_ITEMS = KNOWN_ITEMS.filter(name => !deletedSet.has(name.trim().toLowerCase()));
        appState.customKnownItems.forEach(name => {
          if (!KNOWN_ITEMS.some(k => k.trim().toLowerCase() === name.trim().toLowerCase())) {
            KNOWN_ITEMS.push(name);
          }
        });
      }
    } catch (e) {
      console.error("Lỗi nạp bộ não AI:", e);
    }
  }

  const chestsSaved = localStorage.getItem(STORAGE_CHESTS_KEY);
  if (chestsSaved) {
    try {
      const parsedChests = JSON.parse(chestsSaved);
      appState.accounts = parsedChests.accounts || [];
      appState.chests = parsedChests.chests || [];
      appState.ignoredItems = parsedChests.ignoredItems || [];
      appState.snapshot = parsedChests.snapshot || null;
      appState.snapshotAt = parsedChests.snapshotAt || (parsedChests.snapshot ? Date.now() : null);
      
      if (appState.accounts.length > 0 && !appState.viewingAcc) {
        appState.viewingAcc = appState.accounts[0];
      }
    } catch (e) {
      console.error("Lỗi nạp rương:", e);
    }
  }
}

async function saveChestsState() {
  // Khóa cứng ảnh từng ô: đối chiếu với bản đã lưu trước đó để chống mất cropImg ngoài ý muốn
  let prevChestsMap = new Map();
  try {
    const prevRaw = localStorage.getItem(STORAGE_CHESTS_KEY);
    if (prevRaw) {
      const prevParsed = JSON.parse(prevRaw);
      (prevParsed.chests || []).forEach(c => {
        prevChestsMap.set(`${c.account}__${c.title}`, c.slots || []);
      });
    }
  } catch (e) {}

  (appState.chests || []).forEach(c => {
    const prevSlots = prevChestsMap.get(`${c.account}__${c.title}`) || [];
    if (!Array.isArray(c.slots)) return;
    c.slots.forEach((s, idx) => {
      if (!s) return;
      // Nếu ô chưa có ảnh mới nạp (isNewUpload !== true) mà bị mất cropImg -> phục hồi lại ảnh cũ đang khóa
      if (!s.cropImg && !c._isNewImageUpload && prevSlots[idx]?.cropImg) {
        s.cropImg = prevSlots[idx].cropImg;
      }
    });
    delete c._isNewImageUpload;
  });

  const buildPayload = (chestsData) => ({
    accounts: appState.accounts,
    chests: chestsData,
    ignoredItems: appState.ignoredItems,
    snapshot: appState.snapshot,
    snapshotAt: appState.snapshotAt
  });

  try {
    localStorage.setItem(STORAGE_CHESTS_KEY, JSON.stringify(buildPayload(appState.chests)));
  } catch (err) {
    console.warn("Đang tối ưu dung lượng WebP cho từng ảnh ô để khóa cứng toàn bộ ảnh gốc...", err);
    try {
      // Nén nhẹ từng cropImg riêng biệt (52x52 WebP), tuyệt đối không xóa cropImg
      for (const c of (appState.chests || [])) {
        if (!Array.isArray(c.slots)) continue;
        for (let i = 0; i < c.slots.length; i++) {
          const s = c.slots[i];
          if (s && s.cropImg) {
            s.cropImg = await compressSlotCropDataUrl(s.cropImg, 52, 0.72);
          }
        }
      }
      localStorage.setItem(STORAGE_CHESTS_KEY, JSON.stringify(buildPayload(appState.chests)));
    } catch (e) {
      try {
        // Mức nén sâu hơn (44x44 WebP) vẫn giữ nguyên 100% ảnh gốc của từng ô
        for (const c of (appState.chests || [])) {
          if (!Array.isArray(c.slots)) continue;
          for (let i = 0; i < c.slots.length; i++) {
            const s = c.slots[i];
            if (s && s.cropImg) {
              s.cropImg = await compressSlotCropDataUrl(s.cropImg, 44, 0.62);
            }
          }
        }
        localStorage.setItem(STORAGE_CHESTS_KEY, JSON.stringify(buildPayload(appState.chests)));
      } catch (e2) {
        alert("Bộ nhớ trình duyệt đã chạm giới hạn 5MB! Hãy bấm 'Xuất Não AI' hoặc xóa bớt tài khoản cũ để giải phóng dung lượng.");
      }
    }
  }

  if (typeof renderAll === "function") {
    renderAll();
  }
}

function saveBrainState() {
  try {
    localStorage.setItem(STORAGE_BRAIN_KEY, JSON.stringify({
      learnedGridCrop: appState.learnedGridCrop,
      learnedIcons: appState.learnedIcons,
      trainedNumberErrors: appState.trainedNumberErrors,
      customKnownItems: appState.customKnownItems,
      deletedKnownItems: appState.deletedKnownItems || [],
      noAdkAccounts: appState.noAdkAccounts,
      reportIncludedAccounts: appState.reportIncludedAccounts,
      filterReportAccs: appState.filterReportAccs,
      equipmentItems: appState.equipmentItems,
      hideEquipment: appState.hideEquipment
    }));
  } catch (e) {
    console.error("Lỗi lưu não bộ (có thể đầy dung lượng):", e);
    alert("Bộ nhớ não AI đã rất lớn! Bạn nên bấm 'Xuất Não AI' tải file về máy tính để lưu trữ.");
  }
}

function saveState() {
  saveBrainState();
  saveChestsState();
}

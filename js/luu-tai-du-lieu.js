/* MODULE: NẠP & LƯU TRỮ LOCALSTORAGE (js/luu-tai-du-lieu.js) */

function compressSlotCropDataUrl(dataUrl, maxSide = null, quality = 0.92) {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image")) {
      return resolve(dataUrl || null);
    }
    const img = new Image();
    img.onload = () => {
      // Giữ nguyên kích thước thật 1:1 của ô cắt (không ép nhỏ về 52x52 gây mờ/vỡ chữ)
      const targetW = maxSide ? Math.min(img.naturalWidth || maxSide, maxSide) : (img.naturalWidth || 64);
      const targetH = maxSide ? Math.min(img.naturalHeight || maxSide, maxSide) : (img.naturalHeight || 64);

      const cvs = document.createElement("canvas");
      cvs.width = Math.max(1, targetW);
      cvs.height = Math.max(1, targetH);
      const ctx = cvs.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
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
    console.warn("Đang chuyển sang WebP nét cao giữ nguyên kích thước 1:1 để tiết kiệm bộ nhớ...", err);
    try {
      // Mức 1: Giữ nguyên kích thước thật 1:1 (maxSide = null), chất lượng 0.92 sắc nét
      for (const c of (appState.chests || [])) {
        if (!Array.isArray(c.slots)) continue;
        for (let i = 0; i < c.slots.length; i++) {
          const s = c.slots[i];
          if (s && s.cropImg) {
            s.cropImg = await compressSlotCropDataUrl(s.cropImg, null, 0.92);
          }
        }
      }
      localStorage.setItem(STORAGE_CHESTS_KEY, JSON.stringify(buildPayload(appState.chests)));
    } catch (e) {
      try {
        // Mức 2: Vẫn giữ kích thước thật 1:1 (maxSide = null), chất lượng 0.80
        for (const c of (appState.chests || [])) {
          if (!Array.isArray(c.slots)) continue;
          for (let i = 0; i < c.slots.length; i++) {
            const s = c.slots[i];
            if (s && s.cropImg) {
              s.cropImg = await compressSlotCropDataUrl(s.cropImg, null, 0.80);
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

/* MODULE: NẠP & LƯU TRỮ LOCALSTORAGE (js/luu-tai-du-lieu.js) */

function compressSlotCropDataUrl(dataUrl, size = 56, quality = 0.72) {
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
      
      const rawIcons = parsedBrain.learnedIcons || {};
      const normalizedIcons = {};
      for (const [name, val] of Object.entries(rawIcons)) {
        if (Array.isArray(val)) {
          normalizedIcons[name] = val;
        } else if (val && typeof val === "object" && (val.img || val.hash)) {
          normalizedIcons[name] = [val];
        }
      }
      appState.learnedIcons = normalizedIcons;

      appState.trainedNumberErrors = parsedBrain.trainedNumberErrors || [];
      appState.customKnownItems = parsedBrain.customKnownItems || [];
      appState.noAdkAccounts = parsedBrain.noAdkAccounts || [];
      appState.reportIncludedAccounts = Array.isArray(parsedBrain.reportIncludedAccounts) ? parsedBrain.reportIncludedAccounts : null;
      appState.filterReportAccs = !!parsedBrain.filterReportAccs;
      appState.equipmentItems = parsedBrain.equipmentItems || [];
      appState.hideEquipment = !!parsedBrain.hideEquipment;
      
      if (typeof KNOWN_ITEMS !== "undefined" && Array.isArray(KNOWN_ITEMS)) {
        appState.customKnownItems.forEach(name => {
          if (!KNOWN_ITEMS.includes(name)) KNOWN_ITEMS.push(name);
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
  const payload = {
    accounts: appState.accounts,
    chests: appState.chests,
    ignoredItems: appState.ignoredItems,
    snapshot: appState.snapshot,
    snapshotAt: appState.snapshotAt
  };

  try {
    localStorage.setItem(STORAGE_CHESTS_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("Bộ nhớ gần đầy, đang nén nhẹ từng ảnh cắt riêng biệt để giữ nguyên toàn bộ ảnh thực tế của từng ô...", err);
    try {
      // Nén nhẹ từng cropImg riêng biệt về WebP 56x56 thay vì xóa cropImg = null
      const compressedChests = await Promise.all(
        (appState.chests || []).map(async (c) => ({
          ...c,
          slots: await Promise.all(
            (c.slots || []).map(async (s) => {
              if (!s) return null;
              const smallCrop = s.cropImg ? await compressSlotCropDataUrl(s.cropImg, 56, 0.72) : null;
              if (smallCrop) s.cropImg = smallCrop;
              return {
                name: s.name,
                qty: s.qty,
                hasStackNum: s.hasStackNum,
                cropImg: smallCrop,
                aiOriginalQty: s.aiOriginalQty
              };
            })
          )
        }))
      );

      localStorage.setItem(STORAGE_CHESTS_KEY, JSON.stringify({
        accounts: appState.accounts,
        chests: compressedChests,
        ignoredItems: appState.ignoredItems,
        snapshot: appState.snapshot,
        snapshotAt: appState.snapshotAt
      }));
    } catch (e) {
      alert("Bộ nhớ trình duyệt đã đầy! Hãy bấm 'Xuất Não AI' hoặc xóa bớt rương cũ để giải phóng dung lượng.");
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

/* MODULE: NẠP & LƯU TRỮ LOCALSTORAGE (js/luu-tai-du-lieu.js) */

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

function saveChestsState() {
  try {
    localStorage.setItem(STORAGE_CHESTS_KEY, JSON.stringify({
      accounts: appState.accounts,
      chests: appState.chests,
      ignoredItems: appState.ignoredItems,
      snapshot: appState.snapshot,
      snapshotAt: appState.snapshotAt
    }));
  } catch (err) {
    console.warn("Cảnh báo: Bộ nhớ rương bị đầy, đang tối ưu lược bớt ảnh cũ...", err);
    try {
      const slimChests = appState.chests.map(c => ({
        ...c,
        slots: (c.slots || []).map(s => ({ 
          name: s.name, 
          qty: s.qty, 
          cropImg: null, 
          aiOriginalQty: s.aiOriginalQty 
        }))
      }));
      localStorage.setItem(STORAGE_CHESTS_KEY, JSON.stringify({
        accounts: appState.accounts,
        chests: slimChests,
        ignoredItems: appState.ignoredItems,
        snapshot: appState.snapshot,
        snapshotAt: appState.snapshotAt
      }));
    } catch (e) {
      alert("Bộ nhớ trình duyệt đã đầy! Hãy bấm 'Xuất Não AI' để sao lưu.");
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

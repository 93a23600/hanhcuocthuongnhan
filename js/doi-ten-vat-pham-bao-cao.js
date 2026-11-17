/* MODULE 1: ĐỔI TÊN VẬT PHẨM TRỰC TIẾP TRÊN BẢNG BÁO CÁO (js/doi-ten-vat-pham-bao-cao.js) */

window.inlineRenameReportItem = function(oldName) {
  const cleanOld = (oldName || "").trim();
  if (!cleanOld) return;

  const newNameInput = prompt(`Đổi tên vật phẩm [${cleanOld}] thành:`, cleanOld);
  if (!newNameInput || !newNameInput.trim()) return;
  const cleanNew = newNameInput.trim();
  if (cleanOld === cleanNew) return;

  const lowerOld = cleanOld.toLowerCase();

  // 1. Cập nhật từ điển tên KNOWN_ITEMS & customKnownItems
  if (typeof KNOWN_ITEMS !== "undefined" && Array.isArray(KNOWN_ITEMS)) {
    KNOWN_ITEMS = KNOWN_ITEMS.filter(n => n.trim().toLowerCase() !== lowerOld);
    if (!KNOWN_ITEMS.some(n => n.trim().toLowerCase() === cleanNew.toLowerCase())) {
      KNOWN_ITEMS.push(cleanNew);
    }
  }
  appState.customKnownItems = (appState.customKnownItems || []).filter(n => n.trim().toLowerCase() !== lowerOld);
  if (!appState.customKnownItems.some(n => n.trim().toLowerCase() === cleanNew.toLowerCase())) {
    appState.customKnownItems.push(cleanNew);
  }

  // 2. Gộp/chuyển mẫu icon trong learnedIcons
  if (!appState.learnedIcons) appState.learnedIcons = {};
  let samples = [];
  Object.keys(appState.learnedIcons).forEach(k => {
    if (k.trim().toLowerCase() === lowerOld) {
      const val = appState.learnedIcons[k];
      samples = samples.concat(Array.isArray(val) ? val : (val ? [val] : []));
      delete appState.learnedIcons[k];
    }
  });
  if (samples.length > 0) {
    if (!Array.isArray(appState.learnedIcons[cleanNew])) {
      const cur = appState.learnedIcons[cleanNew];
      appState.learnedIcons[cleanNew] = cur ? [cur] : [];
    }
    appState.learnedIcons[cleanNew] = appState.learnedIcons[cleanNew].concat(samples);
  }

  // 3. Chuyển quy tắc số, trang bị, bỏ qua & snapshot
  (appState.trainedNumberErrors || []).forEach(r => {
    if ((r.itemName || "").trim().toLowerCase() === lowerOld) r.itemName = cleanNew;
  });

  const wasEquip = (appState.equipmentItems || []).some(n => n.trim().toLowerCase() === lowerOld);
  appState.equipmentItems = (appState.equipmentItems || []).filter(n => n.trim().toLowerCase() !== lowerOld);
  if (wasEquip && !appState.equipmentItems.some(n => n.trim().toLowerCase() === cleanNew.toLowerCase())) {
    appState.equipmentItems.push(cleanNew);
  }

  const wasIgnored = (appState.ignoredItems || []).some(n => n.trim().toLowerCase() === lowerOld);
  appState.ignoredItems = (appState.ignoredItems || []).filter(n => n.trim().toLowerCase() !== lowerOld);
  if (wasIgnored && !appState.ignoredItems.some(n => n.trim().toLowerCase() === cleanNew.toLowerCase())) {
    appState.ignoredItems.push(cleanNew);
  }

  if (appState.snapshot) {
    let snapQty = 0;
    Object.keys(appState.snapshot).forEach(k => {
      if (k.trim().toLowerCase() === lowerOld) {
        snapQty += (parseInt(appState.snapshot[k]) || 0);
        delete appState.snapshot[k];
      }
    });
    if (snapQty > 0) {
      appState.snapshot[cleanNew] = (appState.snapshot[cleanNew] || 0) + snapQty;
    }
  }

  // 4. Đổi tên toàn bộ các ô trong tất cả rương
  (appState.chests || []).forEach(chest => {
    (chest.slots || []).forEach(slot => {
      if (slot && slot.name && slot.name.trim().toLowerCase() === lowerOld) {
        slot.name = cleanNew;
      }
    });
  });

  saveBrainState();
  saveChestsState();
  showToast(`Đã cập nhật tên [${cleanOld}] → [${cleanNew}] vào dữ liệu!`, "success");
};

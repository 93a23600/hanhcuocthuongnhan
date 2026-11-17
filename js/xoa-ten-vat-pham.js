/* MODULE: XÓA TÊN VẬT PHẨM KHỎI HỆ THỐNG & GIỮ NGUYÊN ẢNH Ô (js/xoa-ten-vat-pham.js) */

window.deleteItemFromSystem = function(itemName) {
  const cleanName = (itemName || "").trim();
  if (!cleanName) return;
  const lowerTarget = cleanName.toLowerCase();

  if (!confirm(`Xóa tên [${cleanName}] khỏi từ điển, bộ não AI và gỡ tên khỏi các ô trong rương (vẫn giữ nguyên ảnh cắt thực tế của từng ô để đặt tên lại)?`)) {
    return;
  }

  if (typeof KNOWN_ITEMS !== "undefined" && Array.isArray(KNOWN_ITEMS)) {
    KNOWN_ITEMS = KNOWN_ITEMS.filter(n => n.trim().toLowerCase() !== lowerTarget);
  }
  appState.customKnownItems = (appState.customKnownItems || []).filter(n => n.trim().toLowerCase() !== lowerTarget);

  if (appState.learnedIcons) {
    Object.keys(appState.learnedIcons).forEach(k => {
      if (k.trim().toLowerCase() === lowerTarget) delete appState.learnedIcons[k];
    });
  }

  appState.trainedNumberErrors = (appState.trainedNumberErrors || []).filter(
    r => (r.itemName || "").trim().toLowerCase() !== lowerTarget
  );
  appState.equipmentItems = (appState.equipmentItems || []).filter(n => n.trim().toLowerCase() !== lowerTarget);
  appState.ignoredItems = (appState.ignoredItems || []).filter(n => n.trim().toLowerCase() !== lowerTarget);

  if (appState.snapshot) {
    Object.keys(appState.snapshot).forEach(k => {
      if (k.trim().toLowerCase() === lowerTarget) delete appState.snapshot[k];
    });
  }

  // CHỈ GỠ TÊN & SỐ LƯỢNG, GIỮ NGUYÊN ẢNH CẮT THỰC TẾ (cropImg) CỦA TỪNG Ô
  (appState.chests || []).forEach(chest => {
    (chest.slots || []).forEach((slot, idx) => {
      if (slot && slot.name && slot.name.trim().toLowerCase() === lowerTarget) {
        chest.slots[idx] = {
          ...slot,
          name: null,
          qty: 0,
          cropImg: slot.cropImg || null
        };
      }
    });
  });

  saveBrainState();
  saveChestsState();
  const searchInp = document.getElementById("settingsManageItemSearch");
  renderSettingsManageItemsTab(searchInp ? searchInp.value : "");
  showToast(`Đã xóa tên [${cleanName}] và giữ nguyên ảnh thực tế của các ô để đặt tên lại!`, "info");
};

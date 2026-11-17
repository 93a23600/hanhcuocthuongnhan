/* MODULE: LẤY TOÀN BỘ DANH SÁCH VẬT PHẨM HỆ THỐNG (js/lay-danh-sach-vat-pham-he-thong.js) */

function getAllSystemItemsForManage() {
  const map = new Map();

  const registerItem = (rawName) => {
    if (!rawName || !rawName.trim()) return;
    const clean = rawName.trim();
    const key = clean.toLowerCase();
    if (!map.has(key)) {
      const learnedArr = appState.learnedIcons?.[clean];
      const sampleCount = Array.isArray(learnedArr) ? learnedArr.length : (learnedArr ? 1 : 0);
      const lastImg = Array.isArray(learnedArr) && learnedArr.length > 0
        ? learnedArr[learnedArr.length - 1].img
        : (learnedArr?.img || "");

      map.set(key, {
        name: clean,
        sampleCount,
        img: lastImg,
        chestQty: 0,
        chestSlots: 0
      });
    }
  };

  if (typeof KNOWN_ITEMS !== "undefined" && Array.isArray(KNOWN_ITEMS)) {
    KNOWN_ITEMS.forEach(registerItem);
  }
  if (Array.isArray(appState.customKnownItems)) {
    appState.customKnownItems.forEach(registerItem);
  }
  if (appState.learnedIcons) {
    Object.keys(appState.learnedIcons).forEach(registerItem);
  }

  (appState.chests || []).forEach(chest => {
    (chest.slots || []).forEach(slot => {
      if (!slot || !slot.name) return;
      registerItem(slot.name);
      const item = map.get(slot.name.trim().toLowerCase());
      if (item) {
        item.chestQty += (parseInt(slot.qty) || 0);
        item.chestSlots += 1;
        if (!item.img && slot.cropImg) item.img = slot.cropImg;
      }
    });
  });

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

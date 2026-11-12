/* MODULE: TÍNH TOÁN, LỌC & SẮP XẾP TỔNG HỢP TOÀN KHO (js/tinh-toan-tong-kho.js) */

function calculateSummary() {
  const map = new Map();
  const isFilterAccActive = !!appState.filterReportAccs && Array.isArray(appState.reportIncludedAccounts);
  const allowedLower = isFilterAccActive 
    ? appState.reportIncludedAccounts.map(a => a.trim().toLowerCase()) 
    : [];

  appState.chests.forEach(chest => {
    // 1. Lọc theo dropdown tài khoản cụ thể trên thanh công cụ
    if (appState.selectedAccFilter !== "ALL" && chest.account !== appState.selectedAccFilter) return;

    // 2. Chỉ áp dụng lọc danh sách Acc Cài Đặt khi nút "Lọc Acc" đang BẬT
    if (appState.selectedAccFilter === "ALL" && isFilterAccActive) {
      const accLower = (chest.account || "").trim().toLowerCase();
      if (!allowedLower.includes(accLower)) return;
    }

    (chest.slots || []).forEach(slot => {
      if (!slot || !slot.name) return;
      const name = slot.name;
      const qty = parseInt(slot.qty) || 0;
      if (!map.has(name)) {
        const learnedArr = appState.learnedIcons[name];
        const latestLearnedImg = (Array.isArray(learnedArr) && learnedArr.length > 0) 
          ? learnedArr[learnedArr.length - 1].img 
          : (learnedArr?.img || null);

        const isEquip = (appState.equipmentItems || []).some(e => e.toLowerCase() === name.toLowerCase());

        map.set(name, {
          name,
          totalQty: 0,
          stacks: 0,
          foundIn: new Set(),
          icon: latestLearnedImg || slot.cropImg || null,
          isIgnored: appState.ignoredItems.includes(name),
          isEquipment: isEquip
        });
      }
      const item = map.get(name);
      item.totalQty += qty;
      item.stacks += 1;

      const shortChestTitle = chest.title.replace(/^rương\s*/i, "r");
      item.foundIn.add(`${chest.account} (${shortChestTitle})`);
    });
  });

  let res = Array.from(map.values());
  if (appState.searchQuery) {
    const q = appState.searchQuery.toLowerCase();
    res = res.filter(i => i.name.toLowerCase().includes(q));
  }
  if (!appState.showIgnored) {
    res = res.filter(i => !i.isIgnored);
  }
  if (appState.hideEquipment) {
    res = res.filter(i => !i.isEquipment);
  }

  if (appState.sortBy === "name") {
    res.sort((a, b) => appState.sortDesc ? b.name.localeCompare(a.name, 'vi') : a.name.localeCompare(b.name, 'vi'));
  } else {
    res.sort((a, b) => appState.sortDesc ? b.totalQty - a.totalQty : a.totalQty - b.totalQty);
  }
  return res;
}

/* MODULE: TÍNH TOÁN, LỌC & SẮP XẾP TỔNG HỢP TOÀN KHO (js/tinh-toan-tong-kho.js) */

function calculateSummary() {
  const map = new Map();
  const isFilterAccActive = !!appState.filterReportAccs && Array.isArray(appState.reportIncludedAccounts);
  const allowedLower = isFilterAccActive 
    ? appState.reportIncludedAccounts.map(a => a.trim().toLowerCase()) 
    : [];

  appState.chests.forEach(chest => {
    if (appState.selectedAccFilter !== "ALL" && chest.account !== appState.selectedAccFilter) return;

    if (appState.selectedAccFilter === "ALL" && isFilterAccActive) {
      const accLower = (chest.account || "").trim().toLowerCase();
      if (!allowedLower.includes(accLower)) return;
    }

    (chest.slots || []).forEach((slot, slotIdx) => {
      if (!slot || !slot.name) return;
      const rawName = slot.name.trim();
      const normKey = rawName.toLowerCase();
      const qty = parseInt(slot.qty) || 0;

      if (!map.has(normKey)) {
        const learnedArr = appState.learnedIcons[rawName];
        const latestLearnedImg = (Array.isArray(learnedArr) && learnedArr.length > 0) 
          ? learnedArr[learnedArr.length - 1].img 
          : (learnedArr?.img || null);

        const isEquip = (appState.equipmentItems || []).some(e => e.trim().toLowerCase() === normKey);

        map.set(normKey, {
          name: rawName,
          totalQty: 0,
          stacks: 0,
          locations: new Map(),
          icon: latestLearnedImg || slot.cropImg || null,
          isIgnored: appState.ignoredItems.some(ig => ig.trim().toLowerCase() === normKey),
          isEquipment: isEquip
        });
      }

      const item = map.get(normKey);
      item.totalQty += qty;
      item.stacks += 1;

      const locKey = `${chest.account}||${chest.title}`;
      if (!item.locations.has(locKey)) {
        const shortChestTitle = chest.title.replace(/^rương\s*/i, "r");
        item.locations.set(locKey, {
          account: chest.account,
          chestTitle: chest.title,
          shortLabel: `${chest.account} (${shortChestTitle})`,
          firstSlotIdx: slotIdx
        });
      }
    });
  });

  let res = Array.from(map.values()).map(item => ({
    ...item,
    locationList: Array.from(item.locations.values())
  }));

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

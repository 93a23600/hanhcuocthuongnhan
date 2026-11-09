const STORAGE_KEY = "HKTN_INVENTORY_DATA_V3_GRID";

let appState = {
  apiKey: localStorage.getItem("gemini_api_key") || "",
  accounts: [],
  chests: [], // Cấu trúc: { id, account, title, slots: Array(30) } -> slots: [{ name, qty, cropImg }]
  itemIcons: {}, // Từ điển lưu ảnh crop icon theo tên: { "Cánh sen": "data:image/png..." }
  ignoredItems: [],
  snapshot: null,
  searchQuery: "",
  selectedAccFilter: "ALL",
  showIgnored: false,
  sortBy: "qty",
  sortDesc: true,
  currentTab: "gameGrid",
  viewingAcc: "",
  viewingChest: "Rương 1"
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      appState.accounts = parsed.accounts || [];
      appState.chests = parsed.chests || [];
      appState.itemIcons = parsed.itemIcons || {};
      appState.ignoredItems = parsed.ignoredItems || [];
      appState.snapshot = parsed.snapshot || null;
    } catch (e) {
      console.error(e);
    }
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    accounts: appState.accounts,
    chests: appState.chests,
    itemIcons: appState.itemIcons,
    ignoredItems: appState.ignoredItems,
    snapshot: appState.snapshot
  }));
  renderAll();
}

function calculateSummary() {
  const map = new Map();
  appState.chests.forEach(chest => {
    if (appState.selectedAccFilter !== "ALL" && chest.account !== appState.selectedAccFilter) return;
    (chest.slots || []).forEach(slot => {
      if (!slot || !slot.name) return;
      const name = slot.name;
      const qty = parseInt(slot.qty) || 0;
      if (!map.has(name)) {
        map.set(name, {
          name,
          totalQty: 0,
          stacks: 0,
          foundIn: new Set(),
          icon: slot.cropImg || appState.itemIcons[name] || null,
          isIgnored: appState.ignoredItems.includes(name)
        });
      }
      const item = map.get(name);
      item.totalQty += qty;
      item.stacks += 1;
      item.foundIn.add(`${chest.account} (${chest.title})`);
    });
  });

  let res = Array.from(map.values());
  if (appState.searchQuery) {
    res = res.filter(i => i.name.toLowerCase().includes(appState.searchQuery.toLowerCase()));
  }
  if (!appState.showIgnored) {
    res = res.filter(i => !i.isIgnored);
  }
  res.sort((a, b) => appState.sortDesc ? b.totalQty - a.totalQty : a.totalQty - b.totalQty);
  return res;
}

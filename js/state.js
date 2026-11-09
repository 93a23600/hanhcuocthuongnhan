const STORAGE_KEY = "HKTN_INVENTORY_DATA_V4_SMART";

let appState = {
  apiKey: localStorage.getItem("gemini_api_key") || "",
  accounts: [],
  chests: [],
  // 1. Lưu icon theo tên vật phẩm: { "Cánh sen": { img: "data:...", hash: "11001010..." } }
  learnedIcons: {}, 
  // 2. Lưu các trường hợp số bị AI đọc sai để làm mẫu prompt (Few-shot learning):
  trainedNumberErrors: [], // [{ cropImg, wrongQty, correctQty }]
  ignoredItems: [],
  snapshot: null,
  searchQuery: "",
  selectedAccFilter: "ALL",
  showIgnored: false,
  sortBy: "qty",
  sortDesc: true,
  currentTab: "gameGrid",
  viewingAcc: "",
  viewingChest: "Rương 1",
  selectedSlotIndex: 0 // Ô đang click chọn xem bên khung phải
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      appState.accounts = parsed.accounts || [];
      appState.chests = parsed.chests || [];
      appState.learnedIcons = parsed.learnedIcons || {};
      appState.trainedNumberErrors = parsed.trainedNumberErrors || [];
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
    learnedIcons: appState.learnedIcons,
    trainedNumberErrors: appState.trainedNumberErrors,
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
          icon: slot.cropImg || (appState.learnedIcons[name]?.img) || null,
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

const STORAGE_KEY = "HKTN_INVENTORY_DATA_MULTI_ACC_V2";

let appState = {
  apiKey: localStorage.getItem("gemini_api_key") || "",
  accounts: [],
  chests: [],
  ignoredItems: [],
  snapshot: null,
  searchQuery: "",
  selectedAccFilter: "ALL",
  showIgnored: false,
  sortBy: "qty",
  sortDesc: true,
  currentTab: "summary"
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      appState.accounts = parsed.accounts || [];
      appState.chests = parsed.chests || [];
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
    ignoredItems: appState.ignoredItems,
    snapshot: appState.snapshot
  }));
  renderAll();
}

function calculateSummary() {
  const map = new Map();
  appState.chests.forEach(chest => {
    if (appState.selectedAccFilter !== "ALL" && chest.account !== appState.selectedAccFilter) return;
    chest.slots.forEach(slot => {
      const name = slot.name || "Khác";
      const qty = parseInt(slot.qty) || 0;
      if (!map.has(name)) {
        map.set(name, { name, totalQty: 0, stacks: 0, foundIn: new Set(), isIgnored: appState.ignoredItems.includes(name) });
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

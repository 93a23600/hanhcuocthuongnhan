const STORAGE_KEY = "HKTN_INVENTORY_DATA_FULL";

let appState = {
  apiKey: localStorage.getItem("gemini_api_key") || "",
  accounts: ["Acc Chính", "Acc Clone 1"], // Danh sách tài khoản
  chests: [], // Mỗi phần tử: { id, account, title: "Rương 1", slots: [] }
  ignoredItems: [],
  snapshot: null,
  searchQuery: "",
  selectedAccFilter: "ALL", // Lọc kho theo từng acc hoặc xem tất cả
  showIgnored: false,
  sortBy: "qty",
  sortDesc: true,
  currentTab: "summary",
  editingSlot: null
};

function loadPersistedState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      appState.accounts = parsed.accounts || ["Acc Chính", "Acc Clone 1"];
      appState.chests = parsed.chests || [];
      appState.ignoredItems = parsed.ignoredItems || [];
      appState.snapshot = parsed.snapshot || null;
    } catch (e) {
      console.error("Lỗi đọc LocalStorage:", e);
    }
  }

  // Khởi tạo mẫu nếu chưa có dữ liệu
  if (!appState.chests || appState.chests.length === 0) {
    appState.chests = [
      { id: "c1", account: "Acc Chính", title: "Rương 1", slots: MOCK_CHESTS_DATA[0].slots },
      { id: "c2", account: "Acc Chính", title: "Rương 2", slots: MOCK_CHESTS_DATA[1].slots },
      { id: "c3", account: "Acc Chính", title: "Rương 3", slots: MOCK_CHESTS_DATA[2].slots }
    ];
  }
}

function savePersistedState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    accounts: appState.accounts,
    chests: appState.chests,
    ignoredItems: appState.ignoredItems,
    snapshot: appState.snapshot
  }));
  renderAll();
}

function calculateInventorySummary() {
  const summaryMap = new Map();

  appState.chests.forEach((chest) => {
    // Nếu có chọn lọc xem riêng 1 Acc
    if (appState.selectedAccFilter !== "ALL" && chest.account !== appState.selectedAccFilter) {
      return;
    }

    chest.slots.forEach(slot => {
      const name = (slot.name || "Chưa đặt tên").trim();
      const qty = parseInt(slot.qty) || 0;
      if (!summaryMap.has(name)) {
        summaryMap.set(name, {
          name: name,
          totalQty: 0,
          stackCount: 0,
          foundChests: new Set(),
          isIgnored: appState.ignoredItems.includes(name)
        });
      }
      const itemStat = summaryMap.get(name);
      itemStat.totalQty += qty;
      itemStat.stackCount += 1;
      itemStat.foundChests.add(`${chest.account} - ${chest.title}`);
    });
  });

  let results = Array.from(summaryMap.values());

  if (appState.searchQuery) {
    const query = appState.searchQuery.toLowerCase();
    results = results.filter(i => i.name.toLowerCase().includes(query));
  }

  if (!appState.showIgnored) {
    results = results.filter(i => !i.isIgnored);
  }

  results.sort((a, b) => {
    if (appState.sortBy === "name") {
      return appState.sortDesc ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
    } else {
      return appState.sortDesc ? b.totalQty - a.totalQty : a.totalQty - b.totalQty;
    }
  });

  return results;
}

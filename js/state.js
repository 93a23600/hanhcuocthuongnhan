// Khóa lưu rương thông thường (có thể reset/thay đổi)
const STORAGE_CHESTS_KEY = "HKTN_CHESTS_DAILY_DATA";

// KHÓA LƯU BỘ NÃO HỌC MÁY (VĨNH VIỄN - KHÔNG BAO GIỜ BỊ XÓA KHI ĐỔI CODE)
const STORAGE_BRAIN_KEY = "HKTN_AI_BRAIN_PERMANENT";

let appState = {
  apiKey: localStorage.getItem("gemini_api_key") || "",
  accounts: [],
  chests: [],
  // Bộ não học máy vĩnh viễn:
  learnedIcons: {},        // { "phật kinh": { img: "data:...", hash: "..." } }
  trainedNumberErrors: [], // [{ wrongQty, correctQty, itemName }]
  customKnownItems: [],    // Danh sách tên bạn từng gõ thêm
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
  selectedSlotIndex: 0
};

// 1. Tải dữ liệu khi mở web
function loadState() {
  // A. Nạp bộ não học máy vĩnh viễn trước
  const brainSaved = localStorage.getItem(STORAGE_BRAIN_KEY);
  if (brainSaved) {
    try {
      const parsedBrain = JSON.parse(brainSaved);
      appState.learnedIcons = parsedBrain.learnedIcons || {};
      appState.trainedNumberErrors = parsedBrain.trainedNumberErrors || [];
      appState.customKnownItems = parsedBrain.customKnownItems || [];
      
      // Đồng bộ tên đã học vào danh mục chuẩn KNOWN_ITEMS
      if (typeof KNOWN_ITEMS !== "undefined") {
        appState.customKnownItems.forEach(name => {
          if (!KNOWN_ITEMS.includes(name)) KNOWN_ITEMS.push(name);
        });
      }
    } catch (e) {
      console.error("Lỗi nạp bộ não AI:", e);
    }
  }

  // B. Nạp rương thông thường
  const chestsSaved = localStorage.getItem(STORAGE_CHESTS_KEY);
  if (chestsSaved) {
    try {
      const parsedChests = JSON.parse(chestsSaved);
      appState.accounts = parsedChests.accounts || [];
      appState.chests = parsedChests.chests || [];
      appState.ignoredItems = parsedChests.ignoredItems || [];
      appState.snapshot = parsedChests.snapshot || null;
      
      // Đặt giá trị acc đang xem mặc định nếu có
      if (appState.accounts.length > 0 && !appState.viewingAcc) {
        appState.viewingAcc = appState.accounts[0];
      }
    } catch (e) {
      console.error("Lỗi nạp rương:", e);
    }
  }
}

// 2. Lưu dữ liệu rương hàng ngày (Có bắt lỗi chống tràn bộ nhớ 5MB của LocalStorage)
function saveChestsState() {
  try {
    localStorage.setItem(STORAGE_CHESTS_KEY, JSON.stringify({
      accounts: appState.accounts,
      chests: appState.chests,
      ignoredItems: appState.ignoredItems,
      snapshot: appState.snapshot
    }));
  } catch (err) {
    console.warn("Cảnh báo: Bộ nhớ rương bị đầy, đang tối ưu lược bớt ảnh cũ...", err);
    // Nếu đầy, lọc bớt cropImg trong các rương cũ, chỉ giữ tên và số lượng
    try {
      const slimChests = appState.chests.map(c => ({
        ...c,
        slots: (c.slots || []).map(s => ({ name: s.name, qty: s.qty, cropImg: s.cropImg }))
      }));
      localStorage.setItem(STORAGE_CHESTS_KEY, JSON.stringify({
        accounts: appState.accounts,
        chests: slimChests,
        ignoredItems: appState.ignoredItems,
        snapshot: appState.snapshot
      }));
    } catch (e) {
      alert("Bộ nhớ trình duyệt đã đầy! Hãy bấm 'Xuất Não AI' để sao lưu dữ liệu.");
    }
  }

  if (typeof renderAll === "function") {
    renderAll();
  }
}

// 3. LƯU BỘ NÃO HỌC MÁY (RIÊNG BIỆT - TUYỆT ĐỐI KHÔNG BỊ GHI ĐÈ KHI XÓA RƯƠNG)
function saveBrainState() {
  try {
    localStorage.setItem(STORAGE_BRAIN_KEY, JSON.stringify({
      learnedIcons: appState.learnedIcons,
      trainedNumberErrors: appState.trainedNumberErrors,
      customKnownItems: appState.customKnownItems
    }));
  } catch (e) {
    console.error("Lỗi lưu não bộ:", e);
  }
}

// Hàm lưu tổng hợp cả 2
function saveState() {
  saveBrainState();
  saveChestsState();
}

// 4. Tính toán tổng hợp toàn kho
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
    const q = appState.searchQuery.toLowerCase();
    res = res.filter(i => i.name.toLowerCase().includes(q));
  }
  if (!appState.showIgnored) {
    res = res.filter(i => !i.isIgnored);
  }
  res.sort((a, b) => appState.sortDesc ? b.totalQty - a.totalQty : a.totalQty - b.totalQty);
  return res;
}

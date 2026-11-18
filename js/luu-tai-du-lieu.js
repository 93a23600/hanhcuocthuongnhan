/* MODULE: NẠP & LƯU TRỮ INDEXEDDB + LOCALSTORAGE (js/luu-tai-du-lieu.js) */

const IDB_DB_NAME = "HKTN_INVENTORY_DB";
const IDB_DB_VERSION = 1;
const IDB_STORE_NAME = "kv_store";

let _idbPromise = null;
function openInventoryDB() {
  if (_idbPromise) return _idbPromise;
  _idbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      return reject(new Error("Trình duyệt không hỗ trợ IndexedDB"));
    }
    const req = indexedDB.open(IDB_DB_NAME, IDB_DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME);
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
  return _idbPromise;
}

async function idbGetItem(key) {
  try {
    const db = await openInventoryDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, "readonly");
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("IDB get fallback:", e);
    return null;
  }
}

async function idbSetItem(key, value) {
  const db = await openInventoryDB();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, "readwrite");
    const store = tx.objectStore(IDB_STORE_NAME);
    const req = store.put(value, key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

function compressSlotCropDataUrl(dataUrl, maxSide = 64, quality = 0.88) {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image")) {
      return resolve(dataUrl || null);
    }
    const img = new Image();
    img.onload = () => {
      const targetW = maxSide ? Math.min(img.naturalWidth || maxSide, maxSide) : (img.naturalWidth || 64);
      const targetH = maxSide ? Math.min(img.naturalHeight || maxSide, maxSide) : (img.naturalHeight || 64);

      const cvs = document.createElement("canvas");
      cvs.width = Math.max(1, targetW);
      cvs.height = Math.max(1, targetH);
      const ctx = cvs.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
      resolve(cvs.toDataURL("image/webp", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function _applyBrainObject(parsedBrain) {
  if (!parsedBrain || typeof parsedBrain !== "object") return;
  appState.learnedGridCrop = parsedBrain.learnedGridCrop || { top: 0, bottom: 0, left: 0, right: 0 };
  appState.deletedKnownItems = parsedBrain.deletedKnownItems || [];
  const deletedSet = new Set(appState.deletedKnownItems.map(s => s.trim().toLowerCase()));

  const rawIcons = parsedBrain.learnedIcons || {};
  const normalizedIcons = {};
  for (const [name, val] of Object.entries(rawIcons)) {
    if (deletedSet.has(name.trim().toLowerCase())) continue;
    if (Array.isArray(val)) {
      normalizedIcons[name] = val;
    } else if (val && typeof val === "object" && (val.img || val.hash)) {
      normalizedIcons[name] = [val];
    }
  }
  appState.learnedIcons = normalizedIcons;

  appState.trainedNumberErrors = parsedBrain.trainedNumberErrors || [];
  appState.customKnownItems = (parsedBrain.customKnownItems || []).filter(
    name => !deletedSet.has(name.trim().toLowerCase())
  );
  appState.noAdkAccounts = parsedBrain.noAdkAccounts || [];
  appState.reportIncludedAccounts = Array.isArray(parsedBrain.reportIncludedAccounts) ? parsedBrain.reportIncludedAccounts : null;
  appState.filterReportAccs = !!parsedBrain.filterReportAccs;
  appState.equipmentItems = parsedBrain.equipmentItems || [];
  appState.hideEquipment = !!parsedBrain.hideEquipment;

  if (typeof KNOWN_ITEMS !== "undefined" && Array.isArray(KNOWN_ITEMS)) {
    KNOWN_ITEMS = KNOWN_ITEMS.filter(name => !deletedSet.has(name.trim().toLowerCase()));
    appState.customKnownItems.forEach(name => {
      if (!KNOWN_ITEMS.some(k => k.trim().toLowerCase() === name.trim().toLowerCase())) {
        KNOWN_ITEMS.push(name);
      }
    });
  }
}

function _applyChestsObject(parsedChests) {
  if (!parsedChests || typeof parsedChests !== "object") return;
  appState.accounts = parsedChests.accounts || [];
  appState.chests = parsedChests.chests || [];
  appState.ignoredItems = parsedChests.ignoredItems || [];
  appState.snapshot = parsedChests.snapshot || null;
  appState.snapshotAt = parsedChests.snapshotAt || (parsedChests.snapshot ? Date.now() : null);

  if (appState.accounts.length > 0 && !appState.viewingAcc) {
    appState.viewingAcc = appState.accounts[0];
  }
}

// Lưu cache rương trong RAM để đối chiếu khóa cứng cropImg siêu nhanh (không phụ thuộc localStorage)
let _inMemoryChestsSnapshot = new Map();
function _syncMemoryChestsSnapshot(chestsList) {
  _inMemoryChestsSnapshot.clear();
  (chestsList || []).forEach(c => {
    _inMemoryChestsSnapshot.set(`${c.account}__${c.title}`, (c.slots || []).map(s => s ? s.cropImg : null));
  });
}

async function loadState() {
  // 1. Nạp đồng bộ ngay từ localStorage (nếu có) để giao diện lên tức thì
  const brainLocal = localStorage.getItem(STORAGE_BRAIN_KEY);
  if (brainLocal) {
    try {
      _applyBrainObject(JSON.parse(brainLocal));
    } catch (e) {
      console.error("Lỗi nạp não AI từ localStorage:", e);
    }
  }

  const chestsLocal = localStorage.getItem(STORAGE_CHESTS_KEY);
  if (chestsLocal) {
    try {
      _applyChestsObject(JSON.parse(chestsLocal));
      _syncMemoryChestsSnapshot(appState.chests);
    } catch (e) {
      console.error("Lỗi nạp rương từ localStorage:", e);
    }
  }

  // 2. Nạp từ IndexedDB (dung lượng lớn) và tự động di chuyển dữ liệu cũ sang IndexedDB
  try {
    const brainIDB = await idbGetItem(STORAGE_BRAIN_KEY);
    if (brainIDB) {
      _applyBrainObject(brainIDB);
    } else if (brainLocal) {
      await idbSetItem(STORAGE_BRAIN_KEY, JSON.parse(brainLocal));
    }

    const chestsIDB = await idbGetItem(STORAGE_CHESTS_KEY);
    if (chestsIDB) {
      _applyChestsObject(chestsIDB);
      _syncMemoryChestsSnapshot(appState.chests);
      // Giải phóng localStorage nếu dữ liệu rương đã nằm an toàn trong IndexedDB
      if (chestsLocal) {
        try { localStorage.removeItem(STORAGE_CHESTS_KEY); } catch (_) {}
      }
    } else if (chestsLocal) {
      await idbSetItem(STORAGE_CHESTS_KEY, JSON.parse(chestsLocal));
      try { localStorage.removeItem(STORAGE_CHESTS_KEY); } catch (_) {}
    }
  } catch (e) {
    console.warn("Không thể truy cập IndexedDB, tiếp tục dùng bộ nhớ tạm:", e);
  }

  if (typeof renderAll === "function") {
    renderAll();
  }
}

async function saveChestsState() {
  // Khóa cứng ảnh từng ô: đối chiếu với bản đã lưu trước đó trong RAM để chống mất cropImg ngoài ý muốn
  (appState.chests || []).forEach(c => {
    const prevCrops = _inMemoryChestsSnapshot.get(`${c.account}__${c.title}`) || [];
    if (!Array.isArray(c.slots)) return;
    c.slots.forEach((s, idx) => {
      if (!s) return;
      if (!s.cropImg && !c._isNewImageUpload && prevCrops[idx]) {
        s.cropImg = prevCrops[idx];
      }
    });
    delete c._isNewImageUpload;
  });

  const payload = {
    accounts: appState.accounts,
    chests: appState.chests,
    ignoredItems: appState.ignoredItems,
    snapshot: appState.snapshot,
    snapshotAt: appState.snapshotAt
  };

  try {
    // Lưu trực tiếp vào IndexedDB (hỗ trợ hàng trăm MB - hàng GB, giữ nguyên ảnh 1:1 sắc nét)
    await idbSetItem(STORAGE_CHESTS_KEY, payload);
    _syncMemoryChestsSnapshot(appState.chests);
    // Dọn key rương cũ ở localStorage để nhường toàn bộ 5MB cho cấu hình nhẹ
    try { localStorage.removeItem(STORAGE_CHESTS_KEY); } catch (_) {}
  } catch (err) {
    console.warn("Lỗi lưu IndexedDB, thử dự phòng localStorage...", err);
    try {
      for (const c of (appState.chests || [])) {
        if (!Array.isArray(c.slots)) continue;
        for (let i = 0; i < c.slots.length; i++) {
          const s = c.slots[i];
          if (s && s.cropImg) {
            s.cropImg = await compressSlotCropDataUrl(s.cropImg, 56, 0.78);
          }
        }
      }
      localStorage.setItem(STORAGE_CHESTS_KEY, JSON.stringify(payload));
      _syncMemoryChestsSnapshot(appState.chests);
    } catch (e2) {
      alert("Bộ nhớ trình duyệt đã đầy! Hãy bấm 'Xuất Não AI' để sao lưu dữ liệu.");
    }
  }

  if (typeof renderAll === "function") {
    renderAll();
  }
}

async function saveBrainState() {
  const brainPayload = {
    learnedGridCrop: appState.learnedGridCrop,
    learnedIcons: appState.learnedIcons,
    trainedNumberErrors: appState.trainedNumberErrors,
    customKnownItems: appState.customKnownItems,
    deletedKnownItems: appState.deletedKnownItems || [],
    noAdkAccounts: appState.noAdkAccounts,
    reportIncludedAccounts: appState.reportIncludedAccounts,
    filterReportAccs: appState.filterReportAccs,
    equipmentItems: appState.equipmentItems,
    hideEquipment: appState.hideEquipment
  };

  // Lưu song song vào IndexedDB (không giới hạn 5MB) và localStorage (nếu còn vừa)
  try {
    await idbSetItem(STORAGE_BRAIN_KEY, brainPayload);
  } catch (e) {
    console.error("Lỗi lưu não bộ vào IndexedDB:", e);
  }

  try {
    localStorage.setItem(STORAGE_BRAIN_KEY, JSON.stringify(brainPayload));
  } catch (e) {
    // Nếu não AI > 5MB (ví dụ học > 500 mẫu ảnh), xóa bản copy ở localStorage để không báo lỗi giả,
    // vì dữ liệu đã được lưu an toàn trong IndexedDB
    try { localStorage.removeItem(STORAGE_BRAIN_KEY); } catch (_) {}
    console.info("Não AI đã vượt 5MB và đang được lưu trữ an toàn trong IndexedDB.");
  }
}

function saveState() {
  saveBrainState();
  saveChestsState();
}

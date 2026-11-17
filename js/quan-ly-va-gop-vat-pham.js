/* MODULE CÀI ĐẶT TAB 4: QUẢN LÝ, XÓA & GỘP VẬT PHẨM / GOM XÃ (js/quan-ly-va-gop-vat-pham.js) */

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

  // Quét thêm các rương hiện tại để cộng tổng số lượng và lấy ảnh nếu chưa train
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

/* THAO TÁC 1: XÓA BỎ VẬT PHẨM KHỎI HỆ THỐNG */
window.deleteItemFromSystem = function(itemName) {
  const cleanName = (itemName || "").trim();
  if (!cleanName) return;
  const lowerTarget = cleanName.toLowerCase();

  if (!confirm(`Xóa hoàn toàn [${cleanName}] khỏi từ điển, bộ não AI và làm trống các ô đang chứa món này trong rương?`)) {
    return;
  }

  // 1. Xóa khỏi danh sách mặc định KNOWN_ITEMS & customKnownItems
  if (typeof KNOWN_ITEMS !== "undefined" && Array.isArray(KNOWN_ITEMS)) {
    KNOWN_ITEMS = KNOWN_ITEMS.filter(n => n.trim().toLowerCase() !== lowerTarget);
  }
  appState.customKnownItems = (appState.customKnownItems || []).filter(n => n.trim().toLowerCase() !== lowerTarget);

  // 2. Xóa mẫu icon đã học
  if (appState.learnedIcons) {
    Object.keys(appState.learnedIcons).forEach(k => {
      if (k.trim().toLowerCase() === lowerTarget) delete appState.learnedIcons[k];
    });
  }

  // 3. Xóa khỏi quy tắc số, trang bị, bỏ qua & snapshot
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

  // 4. Làm trống các ô đang chứa món này trong rương
  (appState.chests || []).forEach(chest => {
    (chest.slots || []).forEach((slot, idx) => {
      if (slot && slot.name && slot.name.trim().toLowerCase() === lowerTarget) {
        chest.slots[idx] = { name: null, qty: 0, cropImg: null };
      }
    });
  });

  saveBrainState();
  saveChestsState();
  const searchInp = document.getElementById("settingsManageItemSearch");
  renderSettingsManageItemsTab(searchInp ? searchInp.value : "");
  showToast(`Đã xóa bỏ [${cleanName}] khỏi toàn hệ thống!`, "info");
};

/* THAO TÁC 2: ĐỔI TÊN HOẶC GỘP (GOM XÃ) SANG VẬT PHẨM KHÁC */
window.promptRenameOrMergeItem = function(oldName) {
  const sourceName = (oldName || "").trim();
  if (!sourceName) return;

  const allItems = getAllSystemItemsForManage();
  const existingNames = allItems.map(i => i.name).filter(n => n.toLowerCase() !== sourceName.toLowerCase());

  const inputNew = prompt(
    `Đổi tên hoặc GỘP [${sourceName}] sang vật phẩm khác:\n` +
    `• Nhập tên MỚI để đổi tên.\n` +
    `• Nhập tên ĐÃ CÓ (ví dụ: Rác) để gộp toàn bộ mẫu ảnh & số lượng vào vật phẩm đó và xóa tên [${sourceName}].`,
    sourceName
  );

  if (!inputNew || !inputNew.trim()) return;
  const targetName = inputNew.trim();
  const lowerSource = sourceName.toLowerCase();
  const lowerTarget = targetName.toLowerCase();

  if (lowerSource === lowerTarget && sourceName === targetName) return;

  // Tìm tên chuẩn nếu trùng với 1 vật phẩm đã tồn tại (không phân biệt hoa/thường)
  const matchedExisting = existingNames.find(n => n.toLowerCase() === lowerTarget);
  const finalTargetName = matchedExisting || targetName;
  const isMerging = !!matchedExisting;

  const confirmMsg = isMerging
    ? `Xác nhận GỘP [${sourceName}] vào [${finalTargetName}]?\nToàn bộ mẫu icon AI, quy tắc số và số lượng trong rương sẽ dồn hết vào [${finalTargetName}] và xóa tên [${sourceName}].`
    : `Đổi tên [${sourceName}] thành [${finalTargetName}] trên toàn bộ hệ thống?`;

  if (!confirm(confirmMsg)) return;

  // 1. Gộp danh sách mẫu icon (learnedIcons)
  if (!appState.learnedIcons) appState.learnedIcons = {};
  let collectedSamples = [];
  Object.keys(appState.learnedIcons).forEach(k => {
    if (k.trim().toLowerCase() === lowerSource) {
      const val = appState.learnedIcons[k];
      collectedSamples = collectedSamples.concat(Array.isArray(val) ? val : (val ? [val] : []));
      delete appState.learnedIcons[k];
    }
  });

  if (collectedSamples.length > 0) {
    if (!Array.isArray(appState.learnedIcons[finalTargetName])) {
      const cur = appState.learnedIcons[finalTargetName];
      appState.learnedIcons[finalTargetName] = cur ? [cur] : [];
    }
    appState.learnedIcons[finalTargetName] = appState.learnedIcons[finalTargetName].concat(collectedSamples);
  }

  // 2. Cập nhật từ điển tên KNOWN_ITEMS & customKnownItems
  if (typeof KNOWN_ITEMS !== "undefined" && Array.isArray(KNOWN_ITEMS)) {
    KNOWN_ITEMS = KNOWN_ITEMS.filter(n => n.trim().toLowerCase() !== lowerSource);
    if (!KNOWN_ITEMS.some(n => n.trim().toLowerCase() === finalTargetName.toLowerCase())) {
      KNOWN_ITEMS.push(finalTargetName);
    }
  }
  appState.customKnownItems = (appState.customKnownItems || []).filter(n => n.trim().toLowerCase() !== lowerSource);
  if (!appState.customKnownItems.some(n => n.trim().toLowerCase() === finalTargetName.toLowerCase())) {
    appState.customKnownItems.push(finalTargetName);
  }

  // 3. Chuyển quy tắc số đã dạy
  (appState.trainedNumberErrors || []).forEach(r => {
    if ((r.itemName || "").trim().toLowerCase() === lowerSource) {
      r.itemName = finalTargetName;
    }
  });

  // 4. Chuyển trạng thái Trang bị & Đồ bỏ qua
  const wasEquip = (appState.equipmentItems || []).some(n => n.trim().toLowerCase() === lowerSource);
  appState.equipmentItems = (appState.equipmentItems || []).filter(n => n.trim().toLowerCase() !== lowerSource);
  if (wasEquip && !appState.equipmentItems.some(n => n.trim().toLowerCase() === finalTargetName.toLowerCase())) {
    appState.equipmentItems.push(finalTargetName);
  }

  const wasIgnored = (appState.ignoredItems || []).some(n => n.trim().toLowerCase() === lowerSource);
  appState.ignoredItems = (appState.ignoredItems || []).filter(n => n.trim().toLowerCase() !== lowerSource);
  if (wasIgnored && !appState.ignoredItems.some(n => n.trim().toLowerCase() === finalTargetName.toLowerCase())) {
    appState.ignoredItems.push(finalTargetName);
  }

  // 5. Gộp số liệu trong Snapshot (nếu có)
  if (appState.snapshot) {
    let snapQty = 0;
    Object.keys(appState.snapshot).forEach(k => {
      if (k.trim().toLowerCase() === lowerSource) {
        snapQty += (parseInt(appState.snapshot[k]) || 0);
        delete appState.snapshot[k];
      }
    });
    if (snapQty > 0) {
      appState.snapshot[finalTargetName] = (appState.snapshot[finalTargetName] || 0) + snapQty;
    }
  }

  // 6. Đổi tên toàn bộ các ô trong tất cả rương
  (appState.chests || []).forEach(chest => {
    (chest.slots || []).forEach(slot => {
      if (slot && slot.name && slot.name.trim().toLowerCase() === lowerSource) {
        slot.name = finalTargetName;
      }
    });
  });

  saveBrainState();
  saveChestsState();
  const searchInp = document.getElementById("settingsManageItemSearch");
  renderSettingsManageItemsTab(searchInp ? searchInp.value : "");
  showToast(
    isMerging
      ? `Đã gộp [${sourceName}] vào [${finalTargetName}] thành công!`
      : `Đã đổi tên [${sourceName}] → [${finalTargetName}]!`,
    "success"
  );
};

/* RENDER GIAO DIỆN TAB 4 TRONG MODAL CÀI ĐẶT */
function renderSettingsManageItemsTab(query = "") {
  const listEl = document.getElementById("settingsManageItemList");
  const countBadge = document.getElementById("settingsManageItemCount");
  if (!listEl) return;

  const allItems = getAllSystemItemsForManage();
  if (countBadge) countBadge.textContent = allItems.length;

  const q = query.trim().toLowerCase();
  const filtered = allItems.filter(i => i.name.toLowerCase().includes(q));

  if (filtered.length === 0) {
    listEl.innerHTML = `<p class="text-xs text-slate-500 italic text-center py-6">Không tìm thấy vật phẩm nào.</p>`;
    return;
  }

  listEl.innerHTML = filtered.map(item => {
    const safeName = item.name.replace(/'/g, "\\'");
    const thumbHtml = item.img
      ? `<img src="${item.img}" class="w-7 h-7 rounded object-cover border border-slate-700 bg-slate-900 shrink-0">`
      : `<div class="w-7 h-7 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] text-slate-600 shrink-0">✦</div>`;

    return `
      <div class="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-slate-700 transition">
        <div class="flex items-center gap-2.5 min-w-0">
          ${thumbHtml}
          <div class="min-w-0">
            <span class="text-xs font-bold text-white block truncate">${item.name}</span>
            <span class="text-[10px] text-slate-400 font-mono">
              ${item.sampleCount} mẫu AI &bull; Đang có: <b class="text-amber-400">${item.chestQty.toLocaleString("vi-VN")}</b> (${item.chestSlots} ô)
            </span>
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <button type="button" onclick="promptRenameOrMergeItem('${safeName}')" title="Đổi tên hoặc gộp vào vật phẩm khác" class="px-2.5 py-1 rounded-lg bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border border-sky-700/50 text-[11px] font-semibold flex items-center gap-1 transition">
            <i data-lucide="git-merge" class="w-3 h-3"></i>
            <span>Đổi / Gộp</span>
          </button>
          <button type="button" onclick="deleteItemFromSystem('${safeName}')" title="Xóa bỏ vật phẩm này" class="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 transition">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
  }).join("");

  if (window.lucide) lucide.createIcons();
}

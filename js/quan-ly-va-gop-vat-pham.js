/* MODULE CÀI ĐẶT TAB 4: QUẢN LÝ, XÓA & GỘP VẬT PHẨM / GOM XÃ (js/quan-ly-va-gop-vat-pham.js) */

let manageMergeSourceItem = null;
let manageMergeSelectedTarget = "";
let manageMergeSearchTarget = "";

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

/* THAO TÁC 1: XÓA BỎ TÊN VẬT PHẨM KHỎI HỆ THỐNG (GIỮ NGUYÊN ẢNH THỰC TẾ CỦA TỪNG Ô) */
window.deleteItemFromSystem = function(itemName) {
  const cleanName = (itemName || "").trim();
  if (!cleanName) return;
  const lowerTarget = cleanName.toLowerCase();

  if (!confirm(`Xóa tên [${cleanName}] khỏi từ điển, bộ não AI và gỡ tên khỏi các ô trong rương (vẫn giữ nguyên ảnh cắt thực tế của từng ô để đặt tên lại)?`)) {
    return;
  }

  if (typeof KNOWN_ITEMS !== "undefined" && Array.isArray(KNOWN_ITEMS)) {
    KNOWN_ITEMS = KNOWN_ITEMS.filter(n => n.trim().toLowerCase() !== lowerTarget);
  }
  appState.customKnownItems = (appState.customKnownItems || []).filter(n => n.trim().toLowerCase() !== lowerTarget);

  if (appState.learnedIcons) {
    Object.keys(appState.learnedIcons).forEach(k => {
      if (k.trim().toLowerCase() === lowerTarget) delete appState.learnedIcons[k];
    });
  }

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

  // CHỈ GỠ TÊN & SỐ LƯỢNG, TUYỆT ĐỐI GIỮ NGUYÊN ẢNH CẮT THỰC TẾ (cropImg) CỦA TỪNG Ô
  (appState.chests || []).forEach(chest => {
    (chest.slots || []).forEach((slot, idx) => {
      if (slot && slot.name && slot.name.trim().toLowerCase() === lowerTarget) {
        chest.slots[idx] = {
          ...slot,
          name: null,
          qty: 0,
          cropImg: slot.cropImg || null
        };
      }
    });
  });

  saveBrainState();
  saveChestsState();
  const searchInp = document.getElementById("settingsManageItemSearch");
  renderSettingsManageItemsTab(searchInp ? searchInp.value : "");
  showToast(`Đã xóa tên [${cleanName}] và giữ nguyên ảnh thực tế của các ô để đặt tên lại!`, "info");
};

/* MỞ BẢNG CHỌN VẬT PHẨM ĐÍCH ĐỂ ĐỔI / GỘP */
window.openMergePanelForItem = function(sourceName) {
  manageMergeSourceItem = sourceName;
  manageMergeSelectedTarget = "";
  manageMergeSearchTarget = "";
  renderSettingsManageItemsTab();
};

window.closeMergePanel = function() {
  manageMergeSourceItem = null;
  manageMergeSelectedTarget = "";
  manageMergeSearchTarget = "";
  const searchInp = document.getElementById("settingsManageItemSearch");
  renderSettingsManageItemsTab(searchInp ? searchInp.value : "");
};

window.selectMergeTargetRadio = function(targetName) {
  manageMergeSelectedTarget = targetName;
  const customInp = document.getElementById("mergeCustomNewNameInput");
  if (customInp) customInp.value = targetName;
  updateMergeConfirmButtonState();
};

window.onMergeCustomInput = function(val) {
  manageMergeSelectedTarget = val.trim();
  document.querySelectorAll(".radio-merge-target").forEach(r => {
    r.checked = (r.value.toLowerCase() === manageMergeSelectedTarget.toLowerCase());
  });
  updateMergeConfirmButtonState();
};

window.filterMergeTargetList = function(q) {
  manageMergeSearchTarget = q;
  renderMergeTargetOptionsList();
};

function updateMergeConfirmButtonState() {
  const btn = document.getElementById("btnConfirmExecuteMerge");
  if (!btn) return;
  const target = (manageMergeSelectedTarget || "").trim();
  const source = (manageMergeSourceItem || "").trim();

  if (!target || target.toLowerCase() === source.toLowerCase()) {
    btn.disabled = true;
    btn.className = "px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-500 cursor-not-allowed transition";
    btn.innerHTML = `<i data-lucide="git-merge" class="w-3.5 h-3.5 inline mr-1"></i> Chọn hoặc nhập tên đích`;
  } else {
    const allItems = getAllSystemItemsForManage();
    const isExisting = allItems.some(i => i.name.toLowerCase() === target.toLowerCase());
    btn.disabled = false;
    btn.className = "px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg cursor-pointer transition flex items-center gap-1.5";
    btn.innerHTML = isExisting
      ? `<i data-lucide="git-merge" class="w-3.5 h-3.5"></i><span>Gộp Vào "${target}"</span>`
      : `<i data-lucide="edit-3" class="w-3.5 h-3.5"></i><span>Đổi Tên Thành "${target}"</span>`;
  }
  if (window.lucide) lucide.createIcons();
}

function renderMergeTargetOptionsList() {
  const container = document.getElementById("mergeTargetOptionsContainer");
  if (!container || !manageMergeSourceItem) return;

  const allItems = getAllSystemItemsForManage().filter(
    i => i.name.toLowerCase() !== manageMergeSourceItem.trim().toLowerCase()
  );
  const q = (manageMergeSearchTarget || "").trim().toLowerCase();
  const filtered = allItems.filter(i => i.name.toLowerCase().includes(q));

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 italic text-center py-4">Không có vật phẩm trùng từ khóa. Bạn có thể bấm nút bên dưới để đổi thành tên mới này.</p>`;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const isChecked = manageMergeSelectedTarget.toLowerCase() === item.name.toLowerCase();
    const safeVal = item.name.replace(/"/g, "&quot;");
    const safeJs = item.name.replace(/'/g, "\\'");
    const thumbHtml = item.img
      ? `<img src="${item.img}" class="w-6 h-6 rounded object-cover border border-slate-700 bg-slate-900 shrink-0">`
      : `<div class="w-6 h-6 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] text-slate-600 shrink-0">✦</div>`;

    return `
      <label onclick="selectMergeTargetRadio('${safeJs}')" class="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950 border ${isChecked ? 'border-emerald-500 bg-emerald-950/20' : 'border-slate-800/90 hover:border-slate-700'} cursor-pointer transition">
        <div class="flex items-center gap-2.5 min-w-0">
          ${thumbHtml}
          <div class="min-w-0">
            <span class="text-xs font-bold ${isChecked ? 'text-emerald-300' : 'text-slate-200'} block truncate">${item.name}</span>
            <span class="text-[10px] text-slate-500 font-mono">${item.sampleCount} mẫu AI &bull; ${item.chestQty.toLocaleString("vi-VN")} cái</span>
          </div>
        </div>
        <input type="radio" name="mergeTargetRadio" value="${safeVal}" class="radio-merge-target w-4 h-4 accent-emerald-500 cursor-pointer" ${isChecked ? 'checked' : ''}>
      </label>
    `;
  }).join("");
}

/* THỰC THI GỘP / ĐỔI TÊN SAU KHI BẤM XÁC NHẬN (GIỮ NGUYÊN ẢNH GỐC TỪNG Ô) */
window.executeMergeOrRenameItem = function() {
  const sourceName = (manageMergeSourceItem || "").trim();
  const targetName = (manageMergeSelectedTarget || "").trim();
  if (!sourceName || !targetName) return;

  const lowerSource = sourceName.toLowerCase();
  const lowerTarget = targetName.toLowerCase();
  if (lowerSource === lowerTarget && sourceName === targetName) return;

  const allItems = getAllSystemItemsForManage();
  const matchedExisting = allItems.find(i => i.name.toLowerCase() === lowerTarget && i.name.toLowerCase() !== lowerSource);
  const finalTargetName = matchedExisting ? matchedExisting.name : targetName;
  const isMerging = !!matchedExisting;

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

  // 6. Chỉ đổi tên ở các ô trong rương, giữ nguyên ảnh cropImg riêng của từng ô
  (appState.chests || []).forEach(chest => {
    (chest.slots || []).forEach(slot => {
      if (slot && slot.name && slot.name.trim().toLowerCase() === lowerSource) {
        slot.name = finalTargetName;
      }
    });
  });

  saveBrainState();
  saveChestsState();
  manageMergeSourceItem = null;
  manageMergeSelectedTarget = "";
  manageMergeSearchTarget = "";

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
  const containerEl = document.getElementById("settingsViewManageItems");
  const countBadge = document.getElementById("settingsManageItemCount");
  if (!containerEl) return;

  const allItems = getAllSystemItemsForManage();
  if (countBadge) countBadge.textContent = allItems.length;

  // CHẾ ĐỘ 2: ĐANG MỞ PANEL CHỌN ĐÍCH ĐỂ ĐỔI / GỘP
  if (manageMergeSourceItem) {
    const sourceObj = allItems.find(i => i.name.toLowerCase() === manageMergeSourceItem.toLowerCase());
    const sourceThumb = sourceObj?.img
      ? `<img src="${sourceObj.img}" class="w-8 h-8 rounded object-cover border border-amber-500/50 bg-slate-900">`
      : `<div class="w-8 h-8 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-xs text-amber-400">✦</div>`;

    containerEl.innerHTML = `
      <div class="bg-slate-900/90 border border-sky-500/40 rounded-xl p-3.5 space-y-3">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div class="flex items-center gap-2.5">
            ${sourceThumb}
            <div>
              <span class="text-[10px] uppercase font-bold text-sky-400 block">Đang chọn nguồn để Đổi / Gộp:</span>
              <span class="text-sm font-black text-white">${manageMergeSourceItem}</span>
              <span class="text-[11px] text-slate-400 ml-1.5">(${sourceObj?.sampleCount \vert{}\vert{} 0} mẫu AI • ${sourceObj?.chestQty || 0} cái)</span>
            </div>
          </div>
          <button type="button" onclick="closeMergePanel()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1">
            <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i> Quay lại
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label class="text-[11px] font-bold text-slate-300 block mb-1">1. Tìm nhanh vật phẩm đích có sẵn:</label>
            <input type="text" oninput="filterMergeTargetList(this.value)" placeholder="Gõ lọc danh sách bên dưới..." class="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500">
          </div>
          <div>
            <label class="text-[11px] font-bold text-slate-300 block mb-1">2. Hoặc nhập tên mới hoàn toàn:</label>
            <input type="text" id="mergeCustomNewNameInput" oninput="onMergeCustomInput(this.value)" placeholder="Nhập tên mới nếu muốn đổi tên..." class="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-amber-300 font-semibold focus:outline-none focus:border-amber-500">
          </div>
        </div>

        <div>
          <span class="text-[11px] font-semibold text-slate-400 block mb-1.5">Tích chọn 1 vật phẩm bên dưới để gộp toàn bộ dữ liệu vào:</span>
          <div id="mergeTargetOptionsContainer" class="max-h-48 overflow-y-auto space-y-1.5 pr-1"></div>
        </div>

        <div class="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
          <button type="button" onclick="closeMergePanel()" class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300">Hủy</button>
          <button type="button" id="btnConfirmExecuteMerge" onclick="executeMergeOrRenameItem()" disabled class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-500 cursor-not-allowed">
            Chọn hoặc nhập tên đích
          </button>
        </div>
      </div>
    `;

    renderMergeTargetOptionsList();
    updateMergeConfirmButtonState();
    if (window.lucide) lucide.createIcons();
    return;
  }

  // CHẾ ĐỘ 1: DANH SÁCH TỔNG QUAN TOÀN BỘ VẬT PHẨM
  containerEl.innerHTML = `
    <div class="relative">
      <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-

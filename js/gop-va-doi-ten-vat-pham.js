/* MODULE 3: ĐỔI TÊN & GỘP VẬT PHẨM / GOM XÃ ĐỒNG BỘ (js/gop-va-doi-ten-vat-pham.js) */

let manageMergeSourceItem = null;
let manageMergeSelectedTarget = "";
let manageMergeSearchTarget = "";

window.openMergePanelForItem = function(sourceName) {
  manageMergeSourceItem = sourceName;
  manageMergeSelectedTarget = "";
  manageMergeSearchTarget = "";
  if (typeof renderSettingsManageItemsTab === "function") {
    renderSettingsManageItemsTab();
  }
};

window.closeMergePanel = function() {
  manageMergeSourceItem = null;
  manageMergeSelectedTarget = "";
  manageMergeSearchTarget = "";
  const searchInp = document.getElementById("settingsManageItemSearch");
  if (typeof renderSettingsManageItemsTab === "function") {
    renderSettingsManageItemsTab(searchInp ? searchInp.value : "");
  }
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

window.executeMergeOrRenameItem = function() {
  const sourceName = (manageMergeSourceItem || "").trim();
  const targetName = (manageMergeSelectedTarget || "").trim();
  if (!sourceName || !targetName) return;

  const lowerSource = sourceName.toLowerCase();
  const lowerTarget = targetName.toLowerCase();
  if (lowerSource === lowerTarget && sourceName === targetName) return;

  const allItems = getAllSystemItemsForManage();
  const matchedExisting = allItems.find(
    i => i.name.toLowerCase() === lowerTarget && i.name.toLowerCase() !== lowerSource
  );
  const finalTargetName = matchedExisting ? matchedExisting.name : targetName;
  const isMerging = !!matchedExisting;

  // 1. Khóa vĩnh viễn tên nguồn cũ vào deletedKnownItems (để F5 không hồi sinh) và mở khóa tên đích mới
  if (!Array.isArray(appState.deletedKnownItems)) {
    appState.deletedKnownItems = [];
  }
  if (lowerSource !== finalTargetName.toLowerCase() && !appState.deletedKnownItems.some(n => n.trim().toLowerCase() === lowerSource)) {
    appState.deletedKnownItems.push(sourceName);
  }
  appState.deletedKnownItems = appState.deletedKnownItems.filter(
    n => n.trim().toLowerCase() !== finalTargetName.toLowerCase()
  );

  // 2. Gộp danh sách mẫu icon (learnedIcons)
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

  // 3. Cập nhật từ điển tên KNOWN_ITEMS & customKnownItems
  if (typeof KNOWN_ITEMS !== "undefined" && Array.isArray(KNOWN_ITEMS)) {
    KNOWN_ITEMS = KNOWN_ITEMS.filter(n => n.trim().toLowerCase() !== lowerSource);
    if (!KNOWN_ITEMS.some(n => n.trim().toLowerCase() === finalTargetName.toLowerCase())) {
      KNOWN_ITEMS.push(finalTargetName);
    }
  }
  appState.customKnownItems = (appState.customKnownItems || []).filter(
    n => n.trim().toLowerCase() !== lowerSource
  );
  if (!appState.customKnownItems.some(n => n.trim().toLowerCase() === finalTargetName.toLowerCase())) {
    appState.customKnownItems.push(finalTargetName);
  }

  // 4. Chuyển quy tắc số đã dạy
  (appState.trainedNumberErrors || []).forEach(r => {
    if ((r.itemName || "").trim().toLowerCase() === lowerSource) {
      r.itemName = finalTargetName;
    }
  });

  // 5. Chuyển trạng thái Trang bị & Đồ bỏ qua
  const wasEquip = (appState.equipmentItems || []).some(n => n.trim().toLowerCase() === lowerSource);
  appState.equipmentItems = (appState.equipmentItems || []).filter(
    n => n.trim().toLowerCase() !== lowerSource
  );
  if (wasEquip && !appState.equipmentItems.some(n => n.trim().toLowerCase() === finalTargetName.toLowerCase())) {
    appState.equipmentItems.push(finalTargetName);
  }

  const wasIgnored = (appState.ignoredItems || []).some(n => n.trim().toLowerCase() === lowerSource);
  appState.ignoredItems = (appState.ignoredItems || []).filter(
    n => n.trim().toLowerCase() !== lowerSource
  );
  if (wasIgnored && !appState.ignoredItems.some(n => n.trim().toLowerCase() === finalTargetName.toLowerCase())) {
    appState.ignoredItems.push(finalTargetName);
  }

  // 6. Gộp số liệu trong Snapshot (nếu có)
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

  // 7. Chỉ đổi tên ở các ô trong rương, giữ nguyên ảnh cropImg riêng của từng ô
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
  if (typeof renderSettingsManageItemsTab === "function") {
    renderSettingsManageItemsTab(searchInp ? searchInp.value : "");
  }
  showToast(
    isMerging
      ? `Đã gộp [${sourceName}] vào [${finalTargetName}] và xóa vĩnh viễn [${sourceName}]!`
      : `Đã đổi tên [${sourceName}] → [${finalTargetName}]!`,
    "success"
  );
};

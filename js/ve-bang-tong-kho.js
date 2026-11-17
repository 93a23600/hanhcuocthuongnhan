/* MODULE: VẼ BẢNG TỔNG HỢP TOÀN KHO & CẬP NHẬT NÚT LỌC (js/ve-bang-tong-kho.js) */

window.inlineRenameReportItem = function(oldName) {
  const cleanOld = (oldName || "").trim();
  if (!cleanOld) return;

  const newNameInput = prompt(`Đổi tên vật phẩm [${cleanOld}] thành:`, cleanOld);
  if (!newNameInput || !newNameInput.trim()) return;
  const cleanNew = newNameInput.trim();
  if (cleanOld === cleanNew) return;

  const lowerOld = cleanOld.toLowerCase();

  // 1. Cập nhật từ điển tên KNOWN_ITEMS & customKnownItems
  if (typeof KNOWN_ITEMS !== "undefined" && Array.isArray(KNOWN_ITEMS)) {
    KNOWN_ITEMS = KNOWN_ITEMS.filter(n => n.trim().toLowerCase() !== lowerOld);
    if (!KNOWN_ITEMS.some(n => n.trim().toLowerCase() === cleanNew.toLowerCase())) {
      KNOWN_ITEMS.push(cleanNew);
    }
  }
  appState.customKnownItems = (appState.customKnownItems || []).filter(n => n.trim().toLowerCase() !== lowerOld);
  if (!appState.customKnownItems.some(n => n.trim().toLowerCase() === cleanNew.toLowerCase())) {
    appState.customKnownItems.push(cleanNew);
  }

  // 2. Gộp/chuyển mẫu icon trong learnedIcons
  if (!appState.learnedIcons) appState.learnedIcons = {};
  let samples = [];
  Object.keys(appState.learnedIcons).forEach(k => {
    if (k.trim().toLowerCase() === lowerOld) {
      const val = appState.learnedIcons[k];
      samples = samples.concat(Array.isArray(val) ? val : (val ? [val] : []));
      delete appState.learnedIcons[k];
    }
  });
  if (samples.length > 0) {
    if (!Array.isArray(appState.learnedIcons[cleanNew])) {
      const cur = appState.learnedIcons[cleanNew];
      appState.learnedIcons[cleanNew] = cur ? [cur] : [];
    }
    appState.learnedIcons[cleanNew] = appState.learnedIcons[cleanNew].concat(samples);
  }

  // 3. Chuyển quy tắc số, trang bị, bỏ qua & snapshot
  (appState.trainedNumberErrors || []).forEach(r => {
    if ((r.itemName || "").trim().toLowerCase() === lowerOld) r.itemName = cleanNew;
  });

  const wasEquip = (appState.equipmentItems || []).some(n => n.trim().toLowerCase() === lowerOld);
  appState.equipmentItems = (appState.equipmentItems || []).filter(n => n.trim().toLowerCase() !== lowerOld);
  if (wasEquip && !appState.equipmentItems.some(n => n.trim().toLowerCase() === cleanNew.toLowerCase())) {
    appState.equipmentItems.push(cleanNew);
  }

  const wasIgnored = (appState.ignoredItems || []).some(n => n.trim().toLowerCase() === lowerOld);
  appState.ignoredItems = (appState.ignoredItems || []).filter(n => n.trim().toLowerCase() !== lowerOld);
  if (wasIgnored && !appState.ignoredItems.some(n => n.trim().toLowerCase() === cleanNew.toLowerCase())) {
    appState.ignoredItems.push(cleanNew);
  }

  if (appState.snapshot) {
    let snapQty = 0;
    Object.keys(appState.snapshot).forEach(k => {
      if (k.trim().toLowerCase() === lowerOld) {
        snapQty += (parseInt(appState.snapshot[k]) || 0);
        delete appState.snapshot[k];
      }
    });
    if (snapQty > 0) {
      appState.snapshot[cleanNew] = (appState.snapshot[cleanNew] || 0) + snapQty;
    }
  }

  // 4. Đổi tên toàn bộ các ô trong tất cả rương
  (appState.chests || []).forEach(chest => {
    (chest.slots || []).forEach(slot => {
      if (slot && slot.name && slot.name.trim().toLowerCase() === lowerOld) {
        slot.name = cleanNew;
      }
    });
  });

  saveBrainState();
  saveChestsState();
  showToast(`Đã cập nhật tên [${cleanOld}] → [${cleanNew}] vào dữ liệu!`, "success");
};

function getChestBadgeStyle(chestTitle) {
  const t = (chestTitle || "").trim().toLowerCase();
  if (t.includes("1")) {
    return "bg-emerald-950/80 text-emerald-300 border-emerald-500/60 hover:bg-emerald-900 font-bold";
  }
  if (t.includes("2")) {
    return "bg-sky-950/80 text-sky-300 border-sky-500/60 hover:bg-sky-900 font-bold";
  }
  if (t.includes("3")) {
    return "bg-amber-950/80 text-amber-300 border-amber-500/60 hover:bg-amber-900 font-bold";
  }
  return "bg-purple-950/80 text-purple-300 border-purple-500/60 hover:bg-purple-900 font-bold";
}

function renderSummaryTable() {
  const summary = calculateSummary();
  let grandTotal = 0;
  summary.forEach(i => { if (!i.isIgnored) grandTotal += i.totalQty; });

  const statAcc = document.getElementById("statAccCount");
  const statChests = document.getElementById("statChestsCount");
  const statTotal = document.getElementById("statTotalItems");
  if (statAcc) statAcc.textContent = (appState.accounts || []).length;
  if (statChests) statChests.textContent = (appState.chests || []).length;
  if (statTotal) statTotal.textContent = grandTotal.toLocaleString('vi-VN');

  const filterSelect = document.getElementById("filterAccountSelect");
  if (filterSelect && appState.accounts) {
    filterSelect.innerHTML = `<option value="ALL">Tất Cả Tài Khoản</option>` + 
      appState.accounts.map(acc => `<option value="${acc}">${acc}</option>`).join("");
    filterSelect.value = appState.selectedAccFilter || "ALL";
  }

  // Cập nhật trạng thái nút Lọc Acc theo danh sách trong Cài Đặt
  const btnFilterReportAcc = document.getElementById("btnToggleFilterReportAcc");
  const lblFilterReportAcc = document.getElementById("lblToggleFilterReportAcc");
  if (btnFilterReportAcc && lblFilterReportAcc) {
    if (appState.filterReportAccs) {
      btnFilterReportAcc.className = "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-950/70 text-emerald-300 border border-emerald-500/60 transition";
      lblFilterReportAcc.textContent = "Lọc Acc: Bật";
    } else {
      btnFilterReportAcc.className = "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-slate-300 border border-slate-700 transition";
      lblFilterReportAcc.textContent = "Lọc Acc: Tắt";
    }
  }

  // Cập nhật trạng thái nút Ẩn Trang Bị
  const btnHideEquip = document.getElementById("btnToggleHideEquip");
  const lblHideEquip = document.getElementById("lblToggleHideEquip");
  if (btnHideEquip && lblHideEquip) {
    if (appState.hideEquipment) {
      btnHideEquip.className = "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-950/70 text-sky-300 border border-sky-500/60 transition";
      lblHideEquip.textContent = "Ẩn Trang Bị: Bật";
    } else {
      btnHideEquip.className = "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-slate-300 border border-slate-700 transition";
      lblHideEquip.textContent = "Ẩn Trang Bị: Tắt";
    }
  }

  // Cập nhật trạng thái nút Đồ Bỏ Qua
  const btnShowIgnored = document.getElementById("btnToggleShowIgnored");
  const lblShowIgnored = document.getElementById("lblToggleShowIgnored");
  if (btnShowIgnored && lblShowIgnored) {
    const ignoredCount = (appState.ignoredItems || []).length;
    lblShowIgnored.textContent = `Đồ Bỏ Qua (${ignoredCount})`;
    if (appState.showIgnored) {
      btnShowIgnored.className = "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-950/60 text-amber-300 border border-amber-500/60 transition";
    } else {
      btnShowIgnored.className = "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-slate-400 border border-slate-700 transition";
    }
  }

  const sortQtyTh = document.getElementById("sortByQty");
  if (sortQtyTh) {
    const arrowIcon = appState.sortDesc ? "arrow-down" : "arrow-up";
    const labelText = appState.sortDesc ? "Tổng Số Lượng (Nhiều → Ít)" : "Tổng Số Lượng (Ít → Nhiều)";
    sortQtyTh.innerHTML = `<div class="flex items-center justify-end gap-1 select-none">${labelText} <i data-lucide="${arrowIcon}" class="w-3.5 h-3.5 text-emerald-400"></i></div>`;
  }

  const tbody = document.getElementById("summaryTableBody");
  const emptyNotice = document.getElementById("emptySummaryNotice");
  if (tbody) {
    tbody.innerHTML = "";
    if (summary.length === 0) {
      if (emptyNotice) emptyNotice.classList.remove("hidden");
    } else {
      if (emptyNotice) emptyNotice.classList.add("hidden");
      summary.forEach((item) => {
        const tr = document.createElement("tr");
        tr.className = `hover:bg-slate-800/40 transition border-b border-slate-800/60 ${item.isIgnored ? 'opacity-45 bg-slate-950/40' : ''}`;
        
        const safeName = item.name.replace(/'/g, "\\'");

        const pills = (item.locationList || []).map(loc => {
          const badgeStyle = getChestBadgeStyle(loc.chestTitle);
          const safeAcc = loc.account.replace(/'/g, "\\'");
          const safeChest = loc.chestTitle.replace(/'/g, "\\'");
          return `
            <button type="button"
              onclick="jumpToAccountChest('${safeAcc}', '${safeChest}', ${loc.firstSlotIdx})"
              title="Mở ngay ${loc.account} - ${loc.chestTitle} (Ô ${loc.firstSlotIdx + 1})"
              class="${badgeStyle} inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] mr-1.5 mb-1 border cursor-pointer transition shadow-sm">
              <span>${loc.shortLabel}</span>
            </button>
          `;
        }).join("");
        
        const iconImg = item.icon 
          ? `<img src="${item.icon}" class="w-8 h-8 rounded border border-slate-700 object-cover bg-slate-950 mx-auto">` 
          : `<div class="w-8 h-8 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-xs text-slate-600 mx-auto">✦</div>`;

        const equipBadge = item.isEquipment 
          ? `<span class="ml-1.5 px-1.5 py-0.5 text-[10px] rounded bg-sky-950 text-sky-300 border border-sky-700/60 font-normal">Trang bị</span>` 
          : "";
        const ignoredBadge = item.isIgnored 
          ? `<span class="ml-1.5 px-1.5 py-0.5 text-[10px] rounded bg-rose-950 text-rose-300 border border-rose-700/60 font-normal">Đã ẩn</span>` 
          : "";

        tr.innerHTML = `
          <td class="py-2 px-3 text-center">${iconImg}</td>
          <td class="py-3 px-4 font-semibold text-white">
            <div class="flex items-center flex-wrap gap-1 group">
              <span onclick="inlineRenameReportItem('${safeName}')" title="Nhấp để đổi tên vật phẩm này" class="cursor-pointer hover:text-emerald-300 hover:underline transition">${item.name}</span>
              <button type="button" onclick="inlineRenameReportItem('${safeName}')" title="Đổi tên vật phẩm" class="opacity-60 group-hover:opacity-100 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition">
                <i data-lucide="pencil" class="w-3 h-3"></i>
              </button>
              ${equipBadge}${ignoredBadge}
            </div>
          </td>
          <td class="py-3 px-4 text-center whitespace-nowrap">
            <span class="inline-block bg-slate-900 border border-slate-800 px-3 py-1 rounded-md text-slate-200 font-mono font-bold whitespace-nowrap">${item.stacks} ô</span>
          </td>
          <td class="py-3 px-4 text-center">${pills}</td>
          <td class="py-3 px-4 text-right font-mono font-bold text-amber-400 text-sm whitespace-nowrap">${item.totalQty.toLocaleString('vi-VN')}</td>
          <td class="py-3 px-4 text-center whitespace-nowrap">
            <button onclick="toggleIgnoreItem('${safeName}')" title="${item.isIgnored ? 'Hiện lại trong Tổng Hợp Toàn Kho' : 'Bỏ qua (ẩn khỏi Tổng Hợp Toàn Kho)'}" class="p-1.5 rounded-lg transition ${item.isIgnored ? 'bg-amber-950/60 text-amber-400 hover:bg-amber-900' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'}">
              <i data-lucide="${item.isIgnored ? 'eye' : 'eye-off'}" class="w-3.5 h-3.5"></i>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  }
}

let currentEditingSlotIdx = null;

// Bảng 16 màu sắc phân tách rõ nét cho từng loại vật phẩm trong rương
const ITEM_GROUP_COLORS = [
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#38bdf8", // Sky
  "#f43f5e", // Rose
  "#a855f7", // Purple
  "#ec4899", // Pink
  "#eab308", // Yellow
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#6366f1", // Indigo
  "#84cc16", // Lime
  "#06b6d4", // Cyan
  "#d946ef", // Fuchsia
  "#fb7185", // Light Rose
  "#34d399", // Mint
  "#60a5fa"  // Blue
];

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `px-4 py-2.5 rounded-xl text-xs font-medium text-white shadow-xl flex items-center gap-2 border transition-all pointer-events-auto ${
    type === "success" ? "bg-emerald-950 border-emerald-500 text-emerald-200" :
    type === "error" ? "bg-red-950 border-red-500 text-red-200" :
    "bg-slate-900 border-slate-700 text-slate-200"
  }`;
  const icon = type === "success" ? "check-circle" : type === "error" ? "alert-circle" : "info";
  toast.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4"></i> <span>${message}</span>`;
  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();
  setTimeout(() => toast.remove(), 3500);
}

function updateApiKeyUI() {
  const modeBadge = document.getElementById("modeBadge");
  const modeDesc = document.getElementById("modeDesc");
  const apiKeyLabel = document.getElementById("apiKeyLabel");
  if (!modeBadge || !modeDesc || !apiKeyLabel) return;

  if (appState.apiKey) {
    modeBadge.className = "badge-emerald text-xs px-2 py-0.5 rounded-full font-semibold";
    modeBadge.textContent = "Gemini AI Online";
    modeDesc.textContent = "Đã kết nối API. Khi dán ảnh và xác nhận, AI sẽ quét tự động.";
    apiKeyLabel.textContent = "API: Sẵn Sàng";
  } else {
    modeBadge.className = "badge-amber text-xs px-2 py-0.5 rounded-full font-semibold";
    modeBadge.textContent = "Chế độ Demo";
    modeDesc.textContent = "Chưa cài API Key. Dán ảnh sẽ chạy chế độ demo.";
    apiKeyLabel.textContent = "Cài đặt API";
  }
}

function openUploadModal() {
  const dl = document.getElementById("accountSuggestions");
  if (dl && appState.accounts) {
    dl.innerHTML = appState.accounts.map(acc => `<option value="${acc}"></option>`).join("");
  }
  
  const accInput = document.getElementById("inputAccountName");
  if (accInput && !accInput.value.trim() && appState.accounts && appState.accounts.length > 0) {
    accInput.value = appState.accounts[appState.accounts.length - 1];
  }

  const modal = document.getElementById("confirmUploadModal");
  if (modal) {
    modal.classList.remove("hidden");
    if (accInput) accInput.focus();
  }
  if (window.lucide) lucide.createIcons();
}

/* Lấy danh sách tên chuẩn hóa duy nhất (không trùng lặp chữ hoa / thường) */
function getAllUniqueItemNames() {
  const set = new Set();
  
  if (typeof KNOWN_ITEMS !== "undefined" && Array.isArray(KNOWN_ITEMS)) {
    KNOWN_ITEMS.forEach(name => { if (name) set.add(name.trim()); });
  }
  if (appState.customKnownItems && Array.isArray(appState.customKnownItems)) {
    appState.customKnownItems.forEach(name => { if (name) set.add(name.trim()); });
  }
  if (appState.learnedIcons) {
    Object.keys(appState.learnedIcons).forEach(name => { if (name) set.add(name.trim()); });
  }

  const uniqueMap = new Map();
  Array.from(set).forEach(name => {
    const lower = name.toLowerCase();
    if (!uniqueMap.has(lower)) {
      uniqueMap.set(lower, name);
    }
  });

  return Array.from(uniqueMap.values());
}

/* RENDER BẢNG GỢI Ý TÊN KHI GÕ PHÍM */
function renderDropdownSuggestions(query = "") {
  const dropdown = document.getElementById("customAutocompleteList");
  const nameInput = document.getElementById("sidePanelItemName");
  if (!dropdown || !nameInput) return;

  const allItems = getAllUniqueItemNames();
  const q = query.trim().toLowerCase();
  const matched = allItems.filter(item => item.toLowerCase().includes(q));

  dropdown.innerHTML = "";

  matched.forEach(item => {
    const samples = appState.learnedIcons?.[item];
    const sampleCount = Array.isArray(samples) ? samples.length : (samples ? 1 : 0);
    const badgeHtml = sampleCount > 0 
      ? `<span class="text-[10px] text-emerald-400 font-mono">${sampleCount} mẫu</span>` 
      : `<span class="text-[10px] text-slate-500 font-mono">Có sẵn</span>`;

    const itemEl = document.createElement("div");
    itemEl.className = "px-3 py-2 hover:bg-emerald-950/60 hover:text-emerald-300 text-slate-200 cursor-pointer flex items-center justify-between transition text-xs";
    itemEl.innerHTML = `<span>${item}</span>${badgeHtml}`;
    
    itemEl.onmousedown = (e) => {
      e.preventDefault();
      nameInput.value = item;
      dropdown.classList.add("hidden");
    };
    dropdown.appendChild(itemEl);
  });

  const exactMatch = allItems.some(i => i.toLowerCase() === q);
  if (q && !exactMatch) {
    const newEl = document.createElement("div");
    newEl.className = "px-3 py-2 bg-slate-950 hover:bg-emerald-900/40 text-amber-300 hover:text-amber-200 cursor-pointer flex items-center gap-1.5 font-semibold border-t border-slate-700/80 text-xs";
    newEl.innerHTML = `
      <i data-lucide="plus-circle" class="w-3.5 h-3.5 text-emerald-400"></i>
      <span>Thêm mới: "<strong>${query.trim()}</strong>"</span>
    `;
    newEl.onmousedown = (e) => {
      e.preventDefault();
      nameInput.value = query.trim();
      dropdown.classList.add("hidden");
    };
    dropdown.appendChild(newEl);
    if (window.lucide) lucide.createIcons();
  }

  if (matched.length > 0 || (q && !exactMatch)) {
    dropdown.classList.remove("hidden");
  } else {
    dropdown.classList.add("hidden");
  }
}

/* RENDER TAB 1: RƯƠNG GAME MÔ PHỎNG 35 Ô (5x7) + ICON LINK GIỮA 2 Ô CÙNG TÊN */
function renderGameGridChest() {
  const selectAcc = document.getElementById("selectViewingAcc");
  if (selectAcc && appState.accounts && appState.accounts.length > 0) {
    if (!appState.viewingAcc) appState.viewingAcc = appState.accounts[0];
    selectAcc.innerHTML = appState.accounts.map(acc => `<option value="${acc}" ${acc === appState.viewingAcc ? 'selected' : ''}>${acc}</option>`).join("");
  }

  const chest = (appState.chests || []).find(c => c.account === appState.viewingAcc && c.title === appState.viewingChest);
  const container = document.getElementById("gameGridSlotsContainer");
  const countLabel = document.getElementById("currentChestSlotCount");
  const currentChestLabel = document.getElementById("currentChestLabel");
  
  if (currentChestLabel) {
    currentChestLabel.textContent = `${appState.viewingAcc || 'Chưa chọn'} - ${appState.viewingChest}`;
  }

  if (!container) return;

  // Cấp bảng màu riêng biệt cho từng tên vật phẩm có trong rương này
  const chestColorMap = new Map();
  let colorIdx = 0;
  const slots = (chest && chest.slots) ? chest.slots : [];

  for (let i = 0; i < 35; i++) {
    const itemName = slots[i]?.name;
    if (itemName) {
      const normKey = itemName.trim().toLowerCase();
      if (!chestColorMap.has(normKey)) {
        chestColorMap.set(normKey, ITEM_GROUP_COLORS[colorIdx % ITEM_GROUP_COLORS.length]);
        colorIdx++;
      }
    }
  }

  let filledCount = 0;
  container.innerHTML = "";

  // CHUẨN 35 Ô (5 cột x 7 hàng)
  for (let i = 0; i < 35; i++) {
    const slot = slots[i] || null;
    const hasItem = slot && slot.name;
    if (hasItem) filledCount++;

    const isSelected = (i === appState.selectedSlotIndex);
    const cell = document.createElement("div");
    cell.className = `game-slot-cell relative ${hasItem ? 'has-item' : 'is-empty'} ${isSelected ? 'ring-2 ring-white z-10' : ''}`;
    cell.title = hasItem ? `[Ô ${i + 1}] ${slot.name} (x${slot.qty})` : `Ô ${i + 1} (Trống)`;

    if (hasItem) {
      const normName = slot.name.trim().toLowerCase();
      const groupColor = chestColorMap.get(normName) || "#10b981";

      const isEndOfRow = ((i + 1) % 5 === 0);
      const nextName = (!isEndOfRow && i < 34 && slots[i + 1]?.name) ? slots[i + 1].name.trim().toLowerCase() : null;
      const hasLinkRight = (nextName === normName);

      if (!isSelected) {
        cell.style.borderColor = groupColor;
      }

      const learnedArr = appState.learnedIcons?.[slot.name];
      const latestImg = Array.isArray(learnedArr) && learnedArr.length > 0 ? learnedArr[learnedArr.length - 1].img : (learnedArr?.img || "");
      const displayImg = slot.cropImg || latestImg;

      const dotHtml = `<div class="absolute top-1 left-1 w-2 h-2 rounded-full pointer-events-none border border-slate-950 z-10" style="background:${groupColor}; box-shadow: 0 0 4px ${groupColor};"></div>`;

      let linkIconHtml = "";
      if (hasLinkRight) {
        linkIconHtml = `
          <div class="absolute top-1/2 -right-[11px] -translate-y-1/2 w-4 h-4 rounded-full bg-[#0c131a] border flex items-center justify-center z-20 pointer-events-none shadow-md"
               style="border-color: ${groupColor}; color: ${groupColor};">
            <i data-lucide="link-2" class="w-2.5 h-2.5"></i>
          </div>
        `;
      }

      cell.innerHTML = `
        ${dotHtml}
        ${linkIconHtml}
        <img src="${displayImg}" class="w-full h-full object-cover rounded-[inherit]">
        <span class="absolute bottom-0.5 right-1 text-[11px] font-mono font-black text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,1)]">x${slot.qty}</span>
      `;
    }

    cell.addEventListener("click", () => {
      appState.selectedSlotIndex = i;
      renderGameGridChest();
    });

    container.appendChild(cell);
  }

  if (countLabel) {
    countLabel.textContent = `${filledCount}/35 ô có đồ`;
  }
  
  const curSlot = slots[appState.selectedSlotIndex] || null;
  updateSidePanelInfo(appState.selectedSlotIndex, curSlot);
  
  // Đếm tổng số mẫu hình ảnh đã nạp vào bộ não AI
  const statLearned = document.getElementById("statLearnedIcons");
  const statTrained = document.getElementById("statTrainedSamples");
  if (statLearned) {
    let totalSamples = 0;
    Object.values(appState.learnedIcons || {}).forEach(val => {
      totalSamples += Array.isArray(val) ? val.length : (val ? 1 : 0);
    });
    statLearned.textContent = totalSamples;
  }
  if (statTrained) statTrained.textContent = (appState.trainedNumberErrors || []).length;

  if (window.lucide) lucide.createIcons();
}

/* CẬP NHẬT DỮ LIỆU VÀO PANEL BÊN PHẢI */
function updateSidePanelInfo(slotIdx, slotData) {
  const badge = document.getElementById("sidePanelSlotIndexBadge");
  if (badge) badge.textContent = `Ô ${slotIdx + 1}`;
  
  const img = document.getElementById("sidePanelCropImg");
  const emptyTxt = document.getElementById("sidePanelEmptyIcon");
  const nameInput = document.getElementById("sidePanelItemName");
  const qtyInput = document.getElementById("sidePanelItemQty");
  const notice = document.getElementById("sidePanelAiDetectedNotice");
  const dropdown = document.getElementById("customAutocompleteList");
  
  if (dropdown) dropdown.classList.add("hidden");

  if (img && emptyTxt) {
    const learnedArr = slotData?.name ? appState.learnedIcons?.[slotData.name] : null;
    const latestImg = Array.isArray(learnedArr) && learnedArr.length > 0 ? learnedArr[learnedArr.length - 1].img : (learnedArr?.img || "");
    const displayImg = slotData?.cropImg || latestImg;

    if (displayImg) {
      img.src = displayImg;
      img.classList.remove("hidden");
      emptyTxt.classList.add("hidden");
    } else {
      img.src = "";
      img.classList.add("hidden");
      emptyTxt.classList.remove("hidden");
    }
  }

  if (nameInput) nameInput.value = slotData?.name || "";
  if (qtyInput) qtyInput.value = slotData?.qty || 0;

  if (notice) {
    if (slotData?.aiOriginalQty && slotData.aiOriginalQty !== slotData.qty) {
      notice.textContent = `(AI từng đọc: ${slotData.aiOriginalQty})`;
    } else {
      notice.textContent = "";
    }
  }
}

function renderAll() {
  renderGameGridChest();

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

  // Cập nhật trạng thái nút Hiện / Ẩn Đồ Đã Bỏ Qua
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

  // Cập nhật mũi tên chỉ hướng sắp xếp trên tiêu đề cột Tổng Số Lượng
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
      summary.forEach((item, idx) => {
        const tr = document.createElement("tr");
        tr.className = `hover:bg-slate-800/40 transition border-b border-slate-800/60 ${item.isIgnored ? 'opacity-45 bg-slate-950/40' : ''}`;
        const pills = Array.from(item.foundIn).map(f => `<span class="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300 mr-1 border border-slate-700">${f}</span>`).join("");
        
        const iconImg = item.icon ? `<img src="${item.icon}" class="w-8 h-8 rounded border border-slate-700 object-cover bg-slate-950">` : `<div class="w-8 h-8 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-xs text-slate-600">✦</div>`;

        const equipBadge = item.isEquipment 
          ? `<span class="ml-1.5 px-1.5 py-0.5 text-[10px] rounded bg-sky-950 text-sky-300 border border-sky-700/60 font-normal">Trang bị</span>` 
          : "";
        const ignoredBadge = item.isIgnored 
          ? `<span class="ml-1.5 px-1.5 py-0.5 text-[10px] rounded bg-rose-950 text-rose-300 border border-rose-700/60 font-normal">Đã ẩn</span>` 
          : "";

        const safeName = item.name.replace(/'/g, "\\'");

        tr.innerHTML = `
          <td class="py-3 px-4 text-center font-mono text-slate-500">${idx + 1}</td>
          <td class="py-2 px-4">${iconImg}</td>
          <td class="py-3 px-4 font-semibold text-white">${item.name}${equipBadge}${ignoredBadge}</td>
          <td class="py-3 px-4 text-center"><span class="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">${item.stacks} ô</span></td>
          <td class="py-3 px-4 text-center">${pills}</td>
          <td class="py-3 px-4 text-right font-mono font-bold text-amber-400 text-sm">${item.totalQty.toLocaleString('vi-VN')}</td>
          <td class="py-3 px-4 text-center">
            <button onclick="toggleIgnoreItem('${safeName}')" title="${item.isIgnored ? 'Hiện lại trong Tổng Hợp Toàn Kho' : 'Bỏ qua (ẩn khỏi Tổng Hợp Toàn Kho)'}" class="p-1.5 rounded-lg transition ${item.isIgnored ? 'bg-amber-950/60 text-amber-400 hover:bg-amber-900' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'}">
              <i data-lucide="${item.isIgnored ? 'eye' : 'eye-off'}" class="w-3.5 h-3.5"></i>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  renderDiffView();
  if (window.lucide) lucide.createIcons();
}

function renderDiffView() {
  const incList = document.getElementById("diffIncreasedList");
  const decList = document.getElementById("diffDecreasedList");
  if (!incList || !decList) return;

  if (!appState.snapshot) {
    incList.innerHTML = `<p class="text-slate-600 italic py-3 text-center">Chưa có mốc so sánh.</p>`;
    decList.innerHTML = `<p class="text-slate-600 italic py-3 text-center">Chưa có mốc so sánh.</p>`;
    return;
  }
  const cur = {};
  (appState.chests || []).forEach(c => (c.slots || []).forEach(s => {
    if (s && s.name) cur[s.name] = (cur[s.name] || 0) + (parseInt(s.qty) || 0);
  }));
  const allNames = Array.from(new Set([...Object.keys(cur), ...Object.keys(appState.snapshot)]));
  const diffs = allNames.map(name => ({ name, diff: (cur[name] || 0) - (appState.snapshot[name] || 0) }));

  const inc = diffs.filter(d => d.diff > 0).sort((a,b) => b.diff - a.diff);
  const dec = diffs.filter(d => d.diff < 0).sort((a,b) => a.diff - b.diff);

  incList.innerHTML = inc.map(d => `<div class="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between"><span>${d.name}</span><b class="text-emerald-400 font-mono">+${d.diff.toLocaleString()}</b></div>`).join("") || '<p class="text-slate-600 italic">Không có</p>';
  decList.innerHTML = dec.map(d => `<div class="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between"><span>${d.name}</span><b class="text-rose-400 font-mono">${d.diff.toLocaleString()}</b></div>`).join("") || '<p class="text-slate-600 italic">Không có</p>';
}

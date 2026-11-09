let currentEditingSlotIdx = null;

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `px-4 py-2.5 rounded-xl text-xs font-medium text-white shadow-xl flex items-center gap-2 border transition-all pointer-events-auto ${
    type === "success" ? "bg-emerald-950 border-emerald-500 text-emerald-200" :
    type === "error" ? "bg-red-950 border-red-500 text-red-200" :
    "bg-slate-900 border-slate-700 text-slate-200"
  }`;
  const icon = type === "success" ? "check-circle" : type === "error" ? "alert-circle" : "info";
  toast.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4"></i> <span>${message}</span>`;
  container.appendChild(toast);
  lucide.createIcons();
  setTimeout(() => toast.remove(), 3500);
}

function updateApiKeyUI() {
  const modeBadge = document.getElementById("modeBadge");
  const modeDesc = document.getElementById("modeDesc");
  const apiKeyLabel = document.getElementById("apiKeyLabel");
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
  dl.innerHTML = appState.accounts.map(acc => `<option value="${acc}"></option>`).join("");
  
  const accInput = document.getElementById("inputAccountName");
  if (!accInput.value.trim() && appState.accounts.length > 0) {
    accInput.value = appState.accounts[appState.accounts.length - 1];
  }

  document.getElementById("confirmUploadModal").classList.remove("hidden");
  accInput.focus();
  lucide.createIcons();
}

/* RENDER TAB 1: RƯƠNG GAME MÔ PHỎNG 30 Ô */
function renderGameGridChest() {
  const selectAcc = document.getElementById("selectViewingAcc");
  if (!appState.viewingAcc && appState.accounts.length > 0) {
    appState.viewingAcc = appState.accounts[0];
  }

  selectAcc.innerHTML = appState.accounts.map(acc => `<option value="${acc}" ${acc === appState.viewingAcc ? 'selected' : ''}>${acc}</option>`).join("");

  const chest = appState.chests.find(c => c.account === appState.viewingAcc && c.title === appState.viewingChest);
  const container = document.getElementById("gameGridSlotsContainer");
  const label = document.getElementById("currentChestLabel");
  const countLabel = document.getElementById("currentChestSlotCount");

  label.textContent = `${appState.viewingAcc || 'Chưa chọn'} - ${appState.viewingChest}`;

  let filledCount = 0;
  container.innerHTML = "";

  for (let i = 0; i < 30; i++) {
    const slot = (chest && chest.slots) ? chest.slots[i] : null;
    const hasItem = slot && slot.name;
    if (hasItem) filledCount++;

    const cell = document.createElement("div");
    cell.className = `game-slot-cell ${hasItem ? 'has-item' : 'is-empty'}`;
    cell.title = hasItem ? `${slot.name} (x${slot.qty}) - Nhấp để sửa` : `Ô ${i + 1} (Trống) - Nhấp để thêm`;

    if (hasItem) {
      cell.innerHTML = `
        <img src="${slot.cropImg || appState.itemIcons[slot.name] || ''}" class="w-full h-full object-cover">
        <span class="absolute bottom-0.5 right-1 text-[11px] font-mono font-black text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,1)]">x${slot.qty}</span>
      `;
    }

    cell.addEventListener("click", () => openEditSlotModal(i, slot));
    container.appendChild(cell);
  }

  countLabel.textContent = `${filledCount}/30 ô có đồ`;
}

/* POPUP BẮT LỖI & SỬA Ô */
function openEditSlotModal(slotIndex, slotData) {
  const currentChest = appState.chests.find(c => c.account === appState.viewingAcc && c.title === appState.viewingChest);
  if (!currentChest) {
    alert("Vui lòng dán ảnh tạo rương trước khi chỉnh sửa!");
    return;
  }

  currentEditingSlotIdx = slotIndex;
  const modal = document.getElementById("editSlotModal");
  const img = document.getElementById("editSlotCropImg");
  const nameInput = document.getElementById("editSlotItemName");
  const qtyInput = document.getElementById("editSlotItemQty");

  // Datalist gợi ý vật phẩm
  const dl = document.getElementById("knownItemsDatalist");
  dl.innerHTML = KNOWN_ITEMS.map(it => `<option value="${it}"></option>`).join("");

  img.src = (slotData && slotData.cropImg) ? slotData.cropImg : '';
  nameInput.value = slotData ? (slotData.name || '') : '';
  qtyInput.value = slotData ? (slotData.qty || 0) : 0;

  modal.classList.remove("hidden");
  nameInput.focus();
  lucide.createIcons();
}

function renderAll() {
  renderGameGridChest();

  // Bảng Tổng Kho
  const summary = calculateSummary();
  let grandTotal = 0;
  summary.forEach(i => { if (!i.isIgnored) grandTotal += i.totalQty; });

  document.getElementById("statAccCount").textContent = appState.accounts.length;
  document.getElementById("statChestsCount").textContent = appState.chests.length;
  document.getElementById("statTotalItems").textContent = grandTotal.toLocaleString('vi-VN');

  const filterSelect = document.getElementById("filterAccountSelect");
  filterSelect.innerHTML = `<option value="ALL">Tất Cả Tài Khoản</option>` + 
    appState.accounts.map(acc => `<option value="${acc}">${acc}</option>`).join("");
  filterSelect.value = appState.selectedAccFilter;

  const tbody = document.getElementById("summaryTableBody");
  const emptyNotice = document.getElementById("emptySummaryNotice");
  tbody.innerHTML = "";

  if (summary.length === 0) {
    emptyNotice.classList.remove("hidden");
  } else {
    emptyNotice.classList.add("hidden");
    summary.forEach((item, idx) => {
      const tr = document.createElement("tr");
      tr.className = `hover:bg-slate-800/40 transition border-b border-slate-800/60 ${item.isIgnored ? 'opacity-40' : ''}`;
      const pills = Array.from(item.foundIn).map(f => `<span class="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300 mr-1 border border-slate-700">${f}</span>`).join("");
      
      const iconImg = item.icon ? `<img src="${item.icon}" class="w-8 h-8 rounded border border-slate-700 object-cover bg-slate-950">` : `<div class="w-8 h-8 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-xs text-slate-600">✦</div>`;

      tr.innerHTML = `
        <td class="py-3 px-4 text-center font-mono text-slate-500">${idx + 1}</td>
        <td class="py-2 px-4">${iconImg}</td>
        <td class="py-3 px-4 font-semibold text-white">${item.name}</td>
        <td class="py-3 px-4 text-center"><span class="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">${item.stacks} ô</span></td>
        <td class="py-3 px-4 text-center">${pills}</td>
        <td class="py-3 px-4 text-right font-mono font-bold text-amber-400 text-sm">${item.totalQty.toLocaleString('vi-VN')}</td>
        <td class="py-3 px-4 text-center">
          <button onclick="toggleIgnoreItem('${item.name}')" class="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400">
            <i data-lucide="${item.isIgnored ? 'eye' : 'eye-off'}" class="w-3.5 h-3.5"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  renderDiffView();
  lucide.createIcons();
}

function renderDiffView() {
  const incList = document.getElementById("diffIncreasedList");
  const decList = document.getElementById("diffDecreasedList");
  if (!appState.snapshot) {
    incList.innerHTML = `<p class="text-slate-600 italic py-3 text-center">Chưa có mốc so sánh.</p>`;
    decList.innerHTML = `<p class="text-slate-600 italic py-3 text-center">Chưa có mốc so sánh.</p>`;
    return;
  }
  const cur = {};
  appState.chests.forEach(c => (c.slots || []).forEach(s => {
    if (s && s.name) cur[s.name] = (cur[s.name] || 0) + (parseInt(s.qty) || 0);
  }));
  const allNames = Array.from(new Set([...Object.keys(cur), ...Object.keys(appState.snapshot)]));
  const diffs = allNames.map(name => ({ name, diff: (cur[name] || 0) - (appState.snapshot[name] || 0) }));

  const inc = diffs.filter(d => d.diff > 0).sort((a,b) => b.diff - a.diff);
  const dec = diffs.filter(d => d.diff < 0).sort((a,b) => a.diff - b.diff);

  incList.innerHTML = inc.map(d => `<div class="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between"><span>${d.name}</span><b class="text-emerald-400 font-mono">+${d.diff.toLocaleString()}</b></div>`).join("") || '<p class="text-slate-600 italic">Không có</p>';
  decList.innerHTML = dec.map(d => `<div class="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between"><span>${d.name}</span><b class="text-rose-400 font-mono">${d.diff.toLocaleString()}</b></div>`).join("") || '<p class="text-slate-600 italic">Không có</p>';
}

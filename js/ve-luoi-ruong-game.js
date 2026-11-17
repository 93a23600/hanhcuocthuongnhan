/* MODULE: VẼ LƯỚI RƯƠNG 35 Ô (5x7), CHẤM MÀU & MẮT XÍCH LIÊN KẾT (js/ve-luoi-ruong-game.js) */

const ITEM_GROUP_COLORS = [
  "#10b981", "#f59e0b", "#38bdf8", "#f43f5e",
  "#a855f7", "#ec4899", "#eab308", "#14b8a6",
  "#f97316", "#6366f1", "#84cc16", "#06b6d4",
  "#d946ef", "#fb7185", "#34d399", "#60a5fa"
];

window.toggleSlotQtyOverlay = function(isChecked) {
  appState.showSlotQtyOverlay = !!isChecked;
  localStorage.setItem("hktn_show_slot_qty", String(appState.showSlotQtyOverlay));
  renderGameGridChest();
};

window.selectViewingChestTab = function(title) {
  appState.viewingChest = title;
  appState.selectedSlotIndex = 0;
  renderGameGridChest();
};

window.promptAddNewChest = function() {
  const acc = appState.viewingAcc;
  if (!acc) {
    alert("Hãy chọn hoặc nạp ít nhất 1 tài khoản trước khi thêm rương!");
    return;
  }

  const existingChests = (appState.chests || []).filter(c => c.account === acc);
  const defaultTitle = `Rương ${existingChests.length + 1}`;
  const inputTitle = prompt(`Nhập tên rương mới cho tài khoản [${acc}]:`, defaultTitle);
  if (!inputTitle || !inputTitle.trim()) return;

  const cleanTitle = inputTitle.trim();
  const isDuplicate = existingChests.some(c => c.title.trim().toLowerCase() === cleanTitle.toLowerCase());
  if (isDuplicate) {
    appState.viewingChest = cleanTitle;
    renderGameGridChest();
    showToast(`Rương [${cleanTitle}] đã tồn tại, đã chuyển sang rương này!`, "info");
    return;
  }

  const emptySlots = Array.from({ length: 35 }, () => ({ name: null, qty: 0, cropImg: null }));
  appState.chests.push({
    account: acc,
    title: cleanTitle,
    slots: emptySlots
  });

  appState.viewingChest = cleanTitle;
  appState.selectedSlotIndex = 0;
  saveChestsState();
  showToast(`Đã tạo [${cleanTitle}] cho tài khoản [${acc}]!`, "success");
};

function renderChestSelectorButtons() {
  const btnContainer = document.getElementById("viewingChestBtns");
  if (!btnContainer) return;

  const baseTitles = ["Rương 1", "Rương 2", "Rương 3"];
  const accChests = (appState.chests || []).filter(c => c.account === appState.viewingAcc);
  const allTitles = [...baseTitles];

  accChests.forEach(c => {
    if (c.title && !allTitles.some(t => t.toLowerCase() === c.title.trim().toLowerCase())) {
      allTitles.push(c.title.trim());
    }
  });

  if (appState.viewingChest && !allTitles.some(t => t.toLowerCase() === appState.viewingChest.trim().toLowerCase())) {
    allTitles.push(appState.viewingChest.trim());
  }

  btnContainer.innerHTML = allTitles.map(title => {
    const isActive = (appState.viewingChest || "").trim().toLowerCase() === title.toLowerCase();
    const safeTitle = title.replace(/'/g, "\\'");
    const cls = isActive
      ? "btn-view-chest px-2.5 py-1 rounded-lg border border-emerald-500 bg-emerald-950/50 text-emerald-300 font-bold transition"
      : "btn-view-chest px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition";
    return `<button type="button" onclick="selectViewingChestTab('${safeTitle}')" class="${cls}">${title}</button>`;
  }).join("");
}

function renderGameGridChest() {
  const selectAcc = document.getElementById("selectViewingAcc");
  if (selectAcc && appState.accounts && appState.accounts.length > 0) {
    if (!appState.viewingAcc) appState.viewingAcc = appState.accounts[0];
    selectAcc.innerHTML = appState.accounts.map(acc => `<option value="${acc}" ${acc === appState.viewingAcc ? 'selected' : ''}>${acc}</option>`).join("");
  }

  renderChestSelectorButtons();

  const chest = (appState.chests || []).find(
    c => c.account === appState.viewingAcc && (c.title || "").trim().toLowerCase() === (appState.viewingChest || "").trim().toLowerCase()
  );
  const container = document.getElementById("gameGridSlotsContainer");
  const countLabel = document.getElementById("currentChestSlotCount");
  const currentChestLabel = document.getElementById("currentChestLabel");
  
  if (currentChestLabel) {
    currentChestLabel.textContent = `${appState.viewingAcc || 'Chưa chọn'} - ${appState.viewingChest}`;
  }

  if (!container) return;

  const showQtyOverlay = appState.showSlotQtyOverlay !== false;
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

  for (let i = 0; i < 35; i++) {
    const slot = slots[i] || null;
    const hasItem = !!(slot && slot.name);
    const hasCropImage = !!(slot && slot.cropImg);
    if (hasItem) filledCount++;

    const isSelected = (i === appState.selectedSlotIndex);
    const cell = document.createElement("div");
    cell.className = `game-slot-cell relative ${(hasItem || hasCropImage) ? 'has-item' : 'is-empty'} ${isSelected ? 'ring-2 ring-white z-10' : ''}`;
    cell.title = hasItem
      ? (slot.qty > 1 ? `[Ô ${i + 1}] ${slot.name} (x${slot.qty})` : `[Ô ${i + 1}] ${slot.name}`)
      : (hasCropImage ? `Ô ${i + 1} (Chưa đặt tên - Nhấn để đặt tên)` : `Ô ${i + 1} (Trống)`);

    // 1. LUÔN DÙNG DUY NHẤT ẢNH CẮT RIÊNG CỦA CHÍNH Ô ĐÓ (slot.cropImg), TUYỆT ĐỐI KHÔNG LẤY ẢNH KHÁC ĐÈ LÊN
    const displayImg = hasCropImage ? slot.cropImg : "";

    if (hasItem) {
      const normName = slot.name.trim().toLowerCase();
      const groupColor = chestColorMap.get(normName) || "#10b981";

      const isEndOfRow = ((i + 1) % 5 === 0);
      const nextName = (!isEndOfRow && i < 34 && slots[i + 1]?.name) ? slots[i + 1].name.trim().toLowerCase() : null;
      const hasLinkRight = (nextName === normName);

      if (!isSelected) cell.style.borderColor = groupColor;

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

      const visualHtml = displayImg
        ? `<img src="${displayImg}" class="w-full h-full object-contain bg-slate-950 rounded-[inherit]">`
        : `<div class="w-full h-full flex items-center justify-center p-1 text-center text-[9px] font-semibold text-slate-300 leading-tight bg-slate-900/90">${slot.name}</div>`;

      const isSingleEquip = (appState.equipmentItems || []).some(e => e.trim().toLowerCase() === normName);
      const shouldShowQtyBadge = showQtyOverlay && slot.qty > 1 && !isSingleEquip && slot.hasStackNum !== false;

      const qtyBadgeHtml = shouldShowQtyBadge
        ? `<span class="absolute bottom-0.5 right-0.5 px-1 rounded bg-slate-950/85 text-[11px] font-mono font-black text-amber-300 leading-none py-0.5 shadow pointer-events-none">x${slot.qty}</span>`
        : "";

      cell.innerHTML = `
        ${dotHtml}
        ${linkIconHtml}
        ${visualHtml}
        ${qtyBadgeHtml}
      `;
    } else if (hasCropImage) {
      // Ô đã bị xóa tên nhưng vẫn giữ nguyên ảnh gốc cắt riêng của ô đó để click vào đặt tên lại
      if (!isSelected) cell.style.borderColor = "#f59e0b";
      cell.innerHTML = `
        <img src="${displayImg}" class="w-full h-full object-contain bg-slate-950 rounded-[inherit] opacity-85">
        <span class="absolute bottom-0.5 left-0.5 right-0.5 text-center rounded bg-amber-950/90 text-[9px] font-bold text-amber-300 leading-none py-0.5 pointer-events-none">Chưa tên</span>
      `;
    }

    cell.addEventListener("click", () => {
      appState.selectedSlotIndex = i;
      renderGameGridChest();
    });

    container.appendChild(cell);
  }

  if (countLabel) countLabel.textContent = `${filledCount}/35 ô có đồ`;
  
  const curSlot = slots[appState.selectedSlotIndex] || null;
  if (typeof updateSidePanelInfo === "function") updateSidePanelInfo(appState.selectedSlotIndex, curSlot);
  
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

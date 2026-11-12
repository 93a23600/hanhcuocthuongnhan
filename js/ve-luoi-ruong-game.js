/* MODULE: VẼ LƯỚI RƯƠNG 35 Ô (5x7), CHẤM MÀU & MẮT XÍCH LIÊN KẾT (js/ve-luoi-ruong-game.js) */

const ITEM_GROUP_COLORS = [
  "#10b981", "#f59e0b", "#38bdf8", "#f43f5e",
  "#a855f7", "#ec4899", "#eab308", "#14b8a6",
  "#f97316", "#6366f1", "#84cc16", "#06b6d4",
  "#d946ef", "#fb7185", "#34d399", "#60a5fa"
];

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

      if (!isSelected) cell.style.borderColor = groupColor;

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

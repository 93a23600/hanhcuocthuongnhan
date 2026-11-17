/* MODULE CÀI ĐẶT - TAB 2: PHÂN LOẠI TRANG BỊ (js/settings-tab-equip.js) */

function renderSettingsEquipTab(query = "") {
  const listEl = document.getElementById("settingsEquipItemList");
  const countBadge = document.getElementById("settingsEquipCount");
  if (!listEl) return;

  if (!appState.equipmentItems) appState.equipmentItems = [];
  if (countBadge) countBadge.textContent = appState.equipmentItems.length;

  const allNames = typeof getAllUniqueItemNames === "function" ? getAllUniqueItemNames() : [];
  const q = query.trim().toLowerCase();
  const filtered = allNames.filter(n => n.toLowerCase().includes(q));

  if (filtered.length === 0) {
    listEl.innerHTML = `<p class="text-xs text-slate-500 italic text-center py-6">Không tìm thấy tên vật phẩm nào.</p>`;
    return;
  }

  listEl.innerHTML = filtered.map(name => {
    const isEquip = appState.equipmentItems.some(e => e.toLowerCase() === name.toLowerCase());
    const learnedArr = appState.learnedIcons?.[name];
    const lastImg = Array.isArray(learnedArr) && learnedArr.length > 0 
      ? learnedArr[learnedArr.length - 1].img 
      : (learnedArr?.img || "");

    const thumbHtml = lastImg 
      ? `<img src="${lastImg}" class="w-6 h-6 rounded object-cover border border-slate-700 bg-slate-900">`
      : `<div class="w-6 h-6 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] text-slate-600">✦</div>`;

    return `
      <label class="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950 border ${isEquip ? 'border-sky-500/50 bg-sky-950/10' : 'border-slate-800/80'} cursor-pointer hover:border-slate-700 transition">
        <div class="flex items-center gap-2">
          ${thumbHtml}
          <span class="text-xs font-semibold ${isEquip ? 'text-sky-300' : 'text-slate-300'}">${name}</span>
        </div>
        <input type="checkbox" data-item="${name}" class="chk-equip-item w-4 h-4 accent-sky-500 rounded cursor-pointer" ${isEquip ? 'checked' : ''}>
      </label>
    `;
  }).join("");

  listEl.querySelectorAll(".chk-equip-item").forEach(chk => {
    chk.onchange = (e) => {
      const itemName = e.target.dataset.item;
      if (e.target.checked) {
        if (!appState.equipmentItems.some(i => i.toLowerCase() === itemName.toLowerCase())) {
          appState.equipmentItems.push(itemName);
        }
      } else {
        appState.equipmentItems = appState.equipmentItems.filter(i => i.toLowerCase() !== itemName.toLowerCase());
      }
      saveBrainState();
      renderSettingsEquipTab(query);
    };
  });
}

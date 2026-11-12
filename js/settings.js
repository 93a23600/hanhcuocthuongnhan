/* MODULE CÀI ĐẶT NÂNG CAO (js/settings.js) */

function applyAdkTbqRuleToAllChests() {
  if (!appState.chests || !Array.isArray(appState.chests)) return;
  const tbqAccounts = (appState.noAdkAccounts || []).map(a => a.trim().toLowerCase());
  let changed = false;

  appState.chests.forEach(chest => {
    const isTbqAcc = tbqAccounts.includes((chest.account || "").trim().toLowerCase());
    (chest.slots || []).forEach(slot => {
      if (!slot || !slot.name) return;
      const lowerName = slot.name.trim().toLowerCase();
      if (lowerName === "âm dương kính" || lowerName === "thiết bát quái") {
        const targetName = isTbqAcc ? "Thiết Bát Quái" : "Âm Dương Kính";
        if (slot.name !== targetName) {
          slot.name = targetName;
          changed = true;
        }
      }
    });
  });

  if (changed && typeof saveChestsState === "function") {
    saveChestsState();
  }
}

function initSettingsModal() {
  const btnOpen = document.getElementById("btnOpenAppSettings");
  const btnClose = document.getElementById("btnCloseAppSettings");
  const btnDone = document.getElementById("btnDoneAppSettings");
  const modal = document.getElementById("appSettingsModal");

  const tabAdkBtn = document.getElementById("settingsTabAdkBtn");
  const tabEquipBtn = document.getElementById("settingsTabEquipBtn");
  const viewAdk = document.getElementById("settingsViewAdk");
  const viewEquip = document.getElementById("settingsViewEquip");
  const equipSearch = document.getElementById("settingsEquipSearch");

  if (btnOpen && modal) {
    btnOpen.onclick = () => {
      renderSettingsAdkTab();
      renderSettingsEquipTab();
      modal.classList.remove("hidden");
      if (window.lucide) lucide.createIcons();
    };
  }

  const closeModal = () => {
    if (modal) modal.classList.add("hidden");
    saveBrainState();
    applyAdkTbqRuleToAllChests();
    renderAll();
  };

  if (btnClose) btnClose.onclick = closeModal;
  if (btnDone) btnDone.onclick = closeModal;

  // Chuyển qua lại giữa 2 tab trong Cài Đặt
  if (tabAdkBtn && tabEquipBtn && viewAdk && viewEquip) {
    tabAdkBtn.onclick = () => {
      tabAdkBtn.className = "flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-emerald-600 text-white transition";
      tabEquipBtn.className = "flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition";
      viewAdk.classList.remove("hidden");
      viewEquip.classList.add("hidden");
    };

    tabEquipBtn.onclick = () => {
      tabEquipBtn.className = "flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-emerald-600 text-white transition";
      tabAdkBtn.className = "flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition";
      viewEquip.classList.remove("hidden");
      viewAdk.classList.add("hidden");
      renderSettingsEquipTab(equipSearch ? equipSearch.value : "");
    };
  }

  if (equipSearch) {
    equipSearch.oninput = (e) => renderSettingsEquipTab(e.target.value);
  }
}

/* TAB 1: PHÂN LOẠI TÀI KHOẢN CHỨA THIẾT BÁT QUÁI VS ÂM DƯƠNG KÍNH */
function renderSettingsAdkTab() {
  const listEl = document.getElementById("settingsAdkAccountList");
  if (!listEl) return;

  if (!appState.noAdkAccounts) appState.noAdkAccounts = [];
  const accounts = appState.accounts || [];

  if (accounts.length === 0) {
    listEl.innerHTML = `<p class="text-xs text-slate-500 italic text-center py-6">Chưa có tài khoản nào được nạp rương. Hãy nạp ít nhất 1 rương để cấu hình.</p>`;
    return;
  }

  listEl.innerHTML = accounts.map(acc => {
    const isChecked = appState.noAdkAccounts.includes(acc);
    return `
      <label class="flex items-center justify-between p-3 rounded-xl bg-slate-950 border ${isChecked ? 'border-amber-500/60 bg-amber-950/10' : 'border-emerald-500/30 bg-emerald-950/5'} cursor-pointer hover:border-slate-600 transition">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center ${isChecked ? 'text-amber-400' : 'text-emerald-400'} font-bold text-xs uppercase">${acc.slice(0, 2)}</div>
          <div>
            <span class="text-xs font-bold text-white block">${acc}</span>
            <span class="text-[10px] ${isChecked ? 'text-amber-400 font-semibold' : 'text-emerald-400'}">
              ${isChecked ? 'Đã tích: Chứa Thiết Bát Quái (ép tất cả → Thiết Bát Quái)' : 'Không tích: Mặc định là Âm Dương Kính (ép tất cả → Âm Dương Kính)'}
            </span>
          </div>
        </div>
        <input type="checkbox" data-acc="${acc}" class="chk-no-adk w-4 h-4 accent-amber-500 rounded cursor-pointer" ${isChecked ? 'checked' : ''}>
      </label>
    `;
  }).join("");

  listEl.querySelectorAll(".chk-no-adk").forEach(chk => {
    chk.onchange = (e) => {
      const acc = e.target.dataset.acc;
      if (e.target.checked) {
        if (!appState.noAdkAccounts.includes(acc)) appState.noAdkAccounts.push(acc);
      } else {
        appState.noAdkAccounts = appState.noAdkAccounts.filter(a => a !== acc);
      }
      saveBrainState();
      applyAdkTbqRuleToAllChests();
      renderSettingsAdkTab();
    };
  });
}

/* TAB 2: PHÂN LOẠI CÁC VẬT PHẨM LÀ TRANG BỊ */
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

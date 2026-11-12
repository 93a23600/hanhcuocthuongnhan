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

function getAllKnownAccounts() {
  const accSet = new Set(appState.accounts || []);
  (appState.chests || []).forEach(c => { if (c.account) accSet.add(c.account); });
  return Array.from(accSet);
}

function ensureSettingsModalDOM() {
  const modal = document.getElementById("appSettingsModal");
  if (!modal) return;

  const allAccs = getAllKnownAccounts();
  const includedCount = Array.isArray(appState.reportIncludedAccounts)
    ? appState.reportIncludedAccounts.length
    : allAccs.length;

  modal.innerHTML = `
    <div class="bg-[#121922] border border-slate-700 w-full max-w-xl rounded-2xl p-5 shadow-2xl flex flex-col max-h-[90vh] space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2">
          <i data-lucide="sliders-horizontal" class="w-4 h-4 text-amber-400"></i>
          <h3 class="text-sm font-bold text-white">Cài Đặt Quy Tắc Nhận Diện & Báo Cáo</h3>
        </div>
        <button type="button" id="btnCloseAppSettings" class="text-slate-400 hover:text-white"><i data-lucide="x" class="w-4 h-4"></i></button>
      </div>

      <!-- Thanh chọn 3 Tab -->
      <div class="flex p-1 bg-slate-900 border border-slate-800 rounded-xl gap-1">
        <button type="button" id="settingsTabAdkBtn" class="flex-1 py-2 px-2.5 rounded-lg text-xs font-bold bg-emerald-600 text-white transition">
          1. ADK / Thiết Bát Quái
        </button>
        <button type="button" id="settingsTabEquipBtn" class="flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition">
          2. Trang Bị (<span id="settingsEquipCount">0</span>)
        </button>
        <button type="button" id="settingsTabReportAccBtn" class="flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition">
          3. Acc Báo Cáo (<span id="settingsReportAccCount">${includedCount}/${allAccs.length}</span>)
        </button>
      </div>

      <!-- NỘI DUNG TAB 1: ADK / TBQ -->
      <div id="settingsViewAdk" class="flex-1 overflow-y-auto space-y-3 pr-1 max-h-80">
        <div class="p-3 rounded-xl bg-amber-950/20 border border-amber-700/40 text-xs text-amber-200/90 leading-relaxed">
          <b>Quy tắc phân loại 2 chiều:</b><br>
          &bull; <b>Tài khoản ĐƯỢC TÍCH:</b> Toàn bộ <i>Âm Dương Kính / Thiết Bát Quái</i> sẽ tính là <b>Thiết Bát Quái</b>.<br>
          &bull; <b>Tài khoản KHÔNG TÍCH:</b> Toàn bộ sẽ tự động chuyển hết thành <b>Âm Dương Kính</b>.
        </div>
        <div id="settingsAdkAccountList" class="space-y-2"></div>
      </div>

      <!-- NỘI DUNG TAB 2: DANH SÁCH TRANG BỊ -->
      <div id="settingsViewEquip" class="hidden flex-1 flex flex-col overflow-hidden space-y-3">
        <div class="relative">
          <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
          <input type="text" id="settingsEquipSearch" placeholder="Tìm tên vật phẩm để đánh dấu là Trang Bị..." class="w-full pl-8 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500">
        </div>
        <div id="settingsEquipItemList" class="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-72"></div>
      </div>

      <!-- NỘI DUNG TAB 3: CHỌN ACC HIỂN THỊ TRONG BÁO CÁO -->
      <div id="settingsViewReportAcc" class="hidden flex-1 overflow-y-auto space-y-3 pr-1 max-h-80">
        <div class="p-3 rounded-xl bg-emerald-950/20 border border-emerald-700/40 text-xs text-emerald-200/90 flex items-center justify-between gap-2">
          <span>Chỉ các tài khoản <b>được tích chọn</b> mới cộng dồn vật phẩm vào tab <b>Báo Cáo</b>.</span>
          <div class="flex gap-1.5 shrink-0">
            <button type="button" id="btnSelectAllReportAcc" class="px-2 py-1 rounded bg-emerald-800/60 hover:bg-emerald-700 text-[11px] font-semibold text-white">Chọn hết</button>
            <button type="button" id="btnClearAllReportAcc" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300">Bỏ hết</button>
          </div>
        </div>
        <div id="settingsReportAccountList" class="space-y-2"></div>
      </div>

      <div class="pt-3 border-t border-slate-800 flex justify-end">
        <button type="button" id="btnDoneAppSettings" class="px-5 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg">
          Xong & Lưu Cài Đặt
        </button>
      </div>
    </div>
  `;
}

function bindSettingsEvents() {
  const modal = document.getElementById("appSettingsModal");
  const btnClose = document.getElementById("btnCloseAppSettings");
  const btnDone = document.getElementById("btnDoneAppSettings");

  const tabAdkBtn = document.getElementById("settingsTabAdkBtn");
  const tabEquipBtn = document.getElementById("settingsTabEquipBtn");
  const tabReportAccBtn = document.getElementById("settingsTabReportAccBtn");

  const viewAdk = document.getElementById("settingsViewAdk");
  const viewEquip = document.getElementById("settingsViewEquip");
  const viewReportAcc = document.getElementById("settingsViewReportAcc");
  const equipSearch = document.getElementById("settingsEquipSearch");

  const closeModal = () => {
    if (modal) modal.classList.add("hidden");
    saveBrainState();
    applyAdkTbqRuleToAllChests();
    renderAll();
  };

  if (btnClose) btnClose.onclick = closeModal;
  if (btnDone) btnDone.onclick = closeModal;

  const setActiveSettingsTab = (activeTab) => {
    [tabAdkBtn, tabEquipBtn, tabReportAccBtn].forEach(btn => {
      if (btn) btn.className = "flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition";
    });
    [viewAdk, viewEquip, viewReportAcc].forEach(view => {
      if (view) view.classList.add("hidden");
    });

    if (activeTab === "adk") {
      if (tabAdkBtn) tabAdkBtn.className = "flex-1 py-2 px-2.5 rounded-lg text-xs font-bold bg-emerald-600 text-white transition";
      if (viewAdk) viewAdk.classList.remove("hidden");
      renderSettingsAdkTab();
    } else if (activeTab === "equip") {
      if (tabEquipBtn) tabEquipBtn.className = "flex-1 py-2 px-2.5 rounded-lg text-xs font-bold bg-emerald-600 text-white transition";
      if (viewEquip) viewEquip.classList.remove("hidden");
      renderSettingsEquipTab(equipSearch ? equipSearch.value : "");
    } else if (activeTab === "reportAcc") {
      if (tabReportAccBtn) tabReportAccBtn.className = "flex-1 py-2 px-2.5 rounded-lg text-xs font-bold bg-emerald-600 text-white transition";
      if (viewReportAcc) viewReportAcc.classList.remove("hidden");
      renderSettingsReportAccTab();
    }
  };

  if (tabAdkBtn) tabAdkBtn.onclick = () => setActiveSettingsTab("adk");
  if (tabEquipBtn) tabEquipBtn.onclick = () => setActiveSettingsTab("equip");
  if (tabReportAccBtn) tabReportAccBtn.onclick = () => setActiveSettingsTab("reportAcc");

  if (equipSearch) {
    equipSearch.oninput = (e) => renderSettingsEquipTab(e.target.value);
  }

  const btnSelectAll = document.getElementById("btnSelectAllReportAcc");
  if (btnSelectAll) {
    btnSelectAll.onclick = () => {
      appState.reportIncludedAccounts = [...getAllKnownAccounts()];
      saveBrainState();
      renderSettingsReportAccTab();
    };
  }

  const btnClearAll = document.getElementById("btnClearAllReportAcc");
  if (btnClearAll) {
    btnClearAll.onclick = () => {
      appState.reportIncludedAccounts = [];
      saveBrainState();
      renderSettingsReportAccTab();
    };
  }
}

function initSettingsModal() {
  const btnOpen = document.getElementById("btnOpenAppSettings");
  const modal = document.getElementById("appSettingsModal");

  if (btnOpen && modal) {
    btnOpen.onclick = () => {
      ensureSettingsModalDOM();
      bindSettingsEvents();
      renderSettingsAdkTab();
      renderSettingsEquipTab();
      renderSettingsReportAccTab();
      modal.classList.remove("hidden");
      if (window.lucide) lucide.createIcons();
    };
  }
}

/* TAB 1: PHÂN LOẠI TÀI KHOẢN CHỨA THIẾT BÁT QUÁI VS ÂM DƯƠNG KÍNH */
function renderSettingsAdkTab() {
  const listEl = document.getElementById("settingsAdkAccountList");
  if (!listEl) return;

  if (!appState.noAdkAccounts) appState.noAdkAccounts = [];
  const accounts = getAllKnownAccounts();

  if (accounts.length === 0) {
    listEl.innerHTML = `<p class="text-xs text-slate-500 italic text-center py-6">Chưa có tài khoản nào được nạp rương.</p>`;
    return;
  }

  listEl.innerHTML = accounts.map(acc => {
    const isChecked = appState.noAdkAccounts.some(a => a.trim().toLowerCase() === acc.trim().toLowerCase());
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
        appState.noAdkAccounts = appState.noAdkAccounts.filter(a => a.trim().toLowerCase() !== acc.trim().toLowerCase());
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

/* TAB 3: CHỌN CÁC TÀI KHOẢN ĐƯỢC TÍNH VÀO TAB BÁO CÁO */
function renderSettingsReportAccTab() {
  const listEl = document.getElementById("settingsReportAccountList");
  const countBadge = document.getElementById("settingsReportAccCount");
  if (!listEl) return;

  const accounts = getAllKnownAccounts();
  // Nếu chưa từng cấu hình (null), mặc định coi như tất cả đều được chọn
  if (!Array.isArray(appState.reportIncludedAccounts)) {
    appState.reportIncludedAccounts = [...accounts];
  }

  const activeCount = accounts.filter(acc =>
    appState.reportIncludedAccounts.some(a => a.trim().toLowerCase() === acc.trim().toLowerCase())
  ).length;
  if (countBadge) countBadge.textContent = `${activeCount}/${accounts.length}`;

  if (accounts.length === 0) {
    listEl.innerHTML = `<p class="text-xs text-slate-500 italic text-center py-6">Chưa có tài khoản nào được nạp rương.</p>`;
    return;
  }

  listEl.innerHTML = accounts.map(acc => {
    const isIncluded = appState.reportIncludedAccounts.some(a => a.trim().toLowerCase() === acc.trim().toLowerCase());
    return `
      <label class="flex items-center justify-between p-3 rounded-xl bg-slate-950 border ${isIncluded ? 'border-emerald-500/60 bg-emerald-950/10' : 'border-slate-800 opacity-60'} cursor-pointer hover:border-slate-600 transition">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center ${isIncluded ? 'text-emerald-400' : 'text-slate-500'} font-bold text-xs uppercase">${acc.slice(0, 2)}</div>
          <div>
            <span class="text-xs font-bold text-white block">${acc}</span>
            <span class="text-[10px] ${isIncluded ? 'text-emerald-400 font-semibold' : 'text-slate-500'}">
              ${isIncluded ? 'Đang hiển thị & cộng dồn trong Báo Cáo' : 'Đang ẩn (không tính vào Báo Cáo)'}
            </span>
          </div>
        </div>
        <input type="checkbox" data-acc="${acc}" class="chk-report-acc w-4 h-4 accent-emerald-500 rounded cursor-pointer" ${isIncluded ? 'checked' : ''}>
      </label>
    `;
  }).join("");

  listEl.querySelectorAll(".chk-report-acc").forEach(chk => {
    chk.onchange = (e) => {
      const acc = e.target.dataset.acc;
      if (e.target.checked) {
        if (!appState.reportIncludedAccounts.some(a => a.trim().toLowerCase() === acc.trim().toLowerCase())) {
          appState.reportIncludedAccounts.push(acc);
        }
      } else {
        appState.reportIncludedAccounts = appState.reportIncludedAccounts.filter(
          a => a.trim().toLowerCase() !== acc.trim().toLowerCase()
        );
      }
      saveBrainState();
      renderSettingsReportAccTab();
    };
  });
}

/* MODULE CÀI ĐẶT - TAB 1: QUY TẮC ADK / THIẾT BÁT QUÁI (js/settings-tab-adk.js) */

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

function renderSettingsAdkTab() {
  const listEl = document.getElementById("settingsAdkAccountList");
  if (!listEl) return;

  if (!appState.noAdkAccounts) appState.noAdkAccounts = [];
  const accounts = typeof getAllKnownAccounts === "function" ? getAllKnownAccounts() : [];

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

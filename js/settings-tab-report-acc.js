/* MODULE CÀI ĐẶT - TAB 3: CHỌN TÀI KHOẢN BÁO CÁO (js/settings-tab-report-acc.js) */

function renderSettingsReportAccTab() {
  const listEl = document.getElementById("settingsReportAccountList");
  const countBadge = document.getElementById("settingsReportAccCount");
  if (!listEl) return;

  const accounts = typeof getAllKnownAccounts === "function" ? getAllKnownAccounts() : [];
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

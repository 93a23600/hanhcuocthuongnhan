/* MODULE: VẼ TAB BIẾN ĐỘNG HAO / ĐẦY & THỐNG KÊ TIÊU HAO / TUẦN (js/ve-bien-dong-kho.js) */

window.toggleSortWeeklyOut = function() {
  appState.weeklyOutSortDesc = !appState.weeklyOutSortDesc;
  renderDiffView();
  if (window.lucide) lucide.createIcons();
};

function renderDiffView() {
  const incList = document.getElementById("diffIncreasedList");
  const decList = document.getElementById("diffDecreasedList");
  const tabDiffView = document.getElementById("tabDiffView");
  if (!incList || !decList || !tabDiffView) return;

  // Tạo khung chứa bảng tiêu hao/tuần nếu chưa có trong DOM
  let weeklySection = document.getElementById("weeklyConsumptionSection");
  if (!weeklySection) {
    weeklySection = document.createElement("div");
    weeklySection.id = "weeklyConsumptionSection";
    weeklySection.className = "bg-game-card border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg";
    tabDiffView.appendChild(weeklySection);
  }

  if (!appState.snapshot) {
    incList.innerHTML = `<p class="text-slate-600 italic py-3 text-center">Chưa có mốc so sánh.</p>`;
    decList.innerHTML = `<p class="text-slate-600 italic py-3 text-center">Chưa có mốc so sánh.</p>`;
    weeklySection.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
          <i data-lucide="calendar-clock" class="w-4 h-4"></i> Tốc Độ Tiêu Hao (Lấy Ra / Tuần)
        </span>
      </div>
      <p class="text-slate-600 italic py-4 text-center text-xs">Hãy bấm "Lưu Mốc So Sánh" để hệ thống bắt đầu đo lường lượng vật phẩm lấy ra theo tuần.</p>
    `;
    return;
  }

  const cur = {};
  (appState.chests || []).forEach(c => (c.slots || []).forEach(s => {
    if (s && s.name) cur[s.name] = (cur[s.name] || 0) + (parseInt(s.qty) || 0);
  }));

  const allNames = Array.from(new Set([...Object.keys(cur), ...Object.keys(appState.snapshot)]));
  const diffs = allNames.map(name => ({
    name,
    before: appState.snapshot[name] || 0,
    after: cur[name] || 0,
    diff: (cur[name] || 0) - (appState.snapshot[name] || 0)
  }));

  const inc = diffs.filter(d => d.diff > 0).sort((a, b) => b.diff - a.diff);
  const dec = diffs.filter(d => d.diff < 0).sort((a, b) => a.diff - b.diff);

  incList.innerHTML = inc.map(d => `<div class="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between"><span>${d.name}</span><b class="text-emerald-400 font-mono">+${d.diff.toLocaleString('vi-VN')}</b></div>`).join("") || '<p class="text-slate-600 italic">Không có</p>';
  decList.innerHTML = dec.map(d => `<div class="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between"><span>${d.name}</span><b class="text-rose-400 font-mono">${d.diff.toLocaleString('vi-VN')}</b></div>`).join("") || '<p class="text-slate-600 italic">Không có</p>';

  // Tính khoảng thời gian từ lúc lưu mốc đến hiện tại (quy đổi sang tuần = 7 ngày)
  const elapsedMs = Math.max(1, Date.now() - (appState.snapshotAt || Date.now()));
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  const weeks = Math.max(elapsedDays / 7, 1 / 7);
  const timeLabel = elapsedDays < 1 
    ? `${Math.max(1, Math.round(elapsedMs / 3600000))} giờ qua` 
    : `${elapsedDays.toFixed(1)} ngày qua`;

  // Danh sách các vật phẩm bị lấy ra (diff < 0)
  const consumedList = dec.map(d => {
    const takenOut = Math.abs(d.diff);
    const ratePerWeek = Math.round(takenOut / weeks);

    const learnedArr = appState.learnedIcons?.[d.name];
    const iconUrl = Array.isArray(learnedArr) && learnedArr.length > 0
      ? learnedArr[learnedArr.length - 1].img
      : (learnedArr?.img || "");

    return {
      name: d.name,
      takenOut,
      ratePerWeek,
      iconUrl
    };
  });

  // Sắp xếp theo nhiều -> ít hoặc ít -> nhiều
  const isDesc = appState.weeklyOutSortDesc !== false;
  consumedList.sort((a, b) => isDesc ? b.takenOut - a.takenOut : a.takenOut - b.takenOut);

  const sortBtnText = isDesc ? "Tiêu Hao: Nhiều → Ít" : "Tiêu Hao: Ít → Nhiều";
  const sortIcon = isDesc ? "arrow-down-wide-narrow" : "arrow-up-narrow-wide";

  const rowsHtml = consumedList.length > 0
    ? consumedList.map((item, idx) => {
        const iconHtml = item.iconUrl
          ? `<img src="${item.iconUrl}" class="w-6 h-6 rounded border border-slate-700 object-cover bg-slate-900">`
          : `<div class="w-6 h-6 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] text-slate-600">✦</div>`;

        return `
          <tr class="border-b border-slate-800/60 hover:bg-slate-800/40 transition">
            <td class="py-2.5 px-3 text-center font-mono text-slate-500">${idx + 1}</td>
            <td class="py-2.5 px-3">
              <div class="flex items-center gap-2">
                ${iconHtml}
                <span class="font-semibold text-white">${item.name}</span>
              </div>
            </td>
            <td class="py-2.5 px-3 text-right font-mono text-rose-400 font-bold">
              -${item.takenOut.toLocaleString('vi-VN')}
            </td>
            <td class="py-2.5 px-3 text-right font-mono font-black text-amber-400">
              ${item.ratePerWeek.toLocaleString('vi-VN')} <span class="text-[11px] font-normal text-slate-400">${item.name} / tuần</span>
            </td>
          </tr>
        `;
      }).join("")
    : `<tr><td colspan="4" class="py-6 text-center text-slate-500 italic">Chưa có vật phẩm nào bị lấy ra kể từ mốc so sánh.</td></tr>`;

  weeklySection.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
      <div>
        <h4 class="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
          <i data-lucide="calendar-clock" class="w-4 h-4"></i>
          <span>Thống Kê Vật Phẩm Lấy Ra / Tuần</span>
        </h4>
        <p class="text-[11px] text-slate-400 mt-0.5">Mốc đo lường từ <b>${timeLabel}</b> (${new Date(appState.snapshotAt || Date.now()).toLocaleString('vi-VN')})</p>
      </div>
      <button type="button" onclick="toggleSortWeeklyOut()" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-emerald-400 transition">
        <i data-lucide="${sortIcon}" class="w-3.5 h-3.5"></i>
        <span>${sortBtnText}</span>
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs border-collapse">
        <thead>
          <tr class="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px]">
            <th class="py-2 px-3 w-10 text-center">#</th>
            <th class="py-2 px-3">Vật Phẩm</th>
            <th class="py-2 px-3 text-right">Đã Lấy Ra (Thực tế)</th>
            <th class="py-2 px-3 text-right cursor-pointer hover:text-white" onclick="toggleSortWeeklyOut()">Tốc Độ Tiêu Hao / Tuần</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
}

/* MODULE: VẼ BẢNG TỔNG HỢP TOÀN KHO & CẬP NHẬT NÚT LỌC (js/ve-bang-tong-kho.js) */

function renderSummaryTable() {
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

  // Cập nhật trạng thái nút Lọc Acc theo danh sách trong Cài Đặt
  const btnFilterReportAcc = document.getElementById("btnToggleFilterReportAcc");
  const lblFilterReportAcc = document.getElementById("lblToggleFilterReportAcc");
  if (btnFilterReportAcc && lblFilterReportAcc) {
    if (appState.filterReportAccs) {
      btnFilterReportAcc.className = "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-950/70 text-emerald-300 border border-emerald-500/60 transition";
      lblFilterReportAcc.textContent = "Lọc Acc: Bật";
    } else {
      btnFilterReportAcc.className = "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-slate-300 border border-slate-700 transition";
      lblFilterReportAcc.textContent = "Lọc Acc: Tắt";
    }
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

  // Cập nhật trạng thái nút Đồ Bỏ Qua
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
}

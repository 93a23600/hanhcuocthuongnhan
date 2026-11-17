/* MODULE 2: CẬP NHẬT THỐNG KÊ, BỘ LỌC & MŨI TÊN SẮP XẾP (js/cap-nhat-nut-loc-bao-cao.js) */

function updateReportFiltersAndStats(grandTotal) {
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
}

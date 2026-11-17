/* MODULE 3: VẼ BẢNG TỔNG HỢP TOÀN KHO & ĐIỀU PHỐI (js/ve-bang-tong-kho.js) */

function getChestBadgeStyle(chestTitle) {
  const t = (chestTitle || "").trim().toLowerCase();
  if (t.includes("1")) {
    return "bg-emerald-950/80 text-emerald-300 border-emerald-500/60 hover:bg-emerald-900 font-bold";
  }
  if (t.includes("2")) {
    return "bg-sky-950/80 text-sky-300 border-sky-500/60 hover:bg-sky-900 font-bold";
  }
  if (t.includes("3")) {
    return "bg-amber-950/80 text-amber-300 border-amber-500/60 hover:bg-amber-900 font-bold";
  }
  return "bg-purple-950/80 text-purple-300 border-purple-500/60 hover:bg-purple-900 font-bold";
}

function renderSummaryTable() {
  const summary = calculateSummary();
  let grandTotal = 0;
  summary.forEach(i => { if (!i.isIgnored) grandTotal += i.totalQty; });

  // Gọi module cập nhật thống kê & trạng thái các nút lọc
  if (typeof updateReportFiltersAndStats === "function") {
    updateReportFiltersAndStats(grandTotal);
  }

  const tbody = document.getElementById("summaryTableBody");
  const emptyNotice = document.getElementById("emptySummaryNotice");
  if (tbody) {
    tbody.innerHTML = "";
    if (summary.length === 0) {
      if (emptyNotice) emptyNotice.classList.remove("hidden");
    } else {
      if (emptyNotice) emptyNotice.classList.add("hidden");
      summary.forEach((item) => {
        const tr = document.createElement("tr");
        tr.className = `hover:bg-slate-800/40 transition border-b border-slate-800/60 ${item.isIgnored ? 'opacity-45 bg-slate-950/40' : ''}`;
        
        const safeName = item.name.replace(/'/g, "\\'");

        const pills = (item.locationList || []).map(loc => {
          const badgeStyle = getChestBadgeStyle(loc.chestTitle);
          const safeAcc = loc.account.replace(/'/g, "\\'");
          const safeChest = loc.chestTitle.replace(/'/g, "\\'");
          return `
            <button type="button"
              onclick="jumpToAccountChest('${safeAcc}', '${safeChest}', ${loc.firstSlotIdx})"
              title="Mở ngay ${loc.account} - ${loc.chestTitle} (Ô ${loc.firstSlotIdx + 1})"
              class="${badgeStyle} inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-mono border cursor-pointer transition shadow-sm whitespace-nowrap">
              ${loc.shortLabel}
            </button>
          `;
        }).join("");
        
        const iconImg = item.icon 
          ? `<img src="${item.icon}" class="w-8 h-8 rounded border border-slate-700 object-cover bg-slate-950 mx-auto">` 
          : `<div class="w-8 h-8 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-xs text-slate-600 mx-auto">✦</div>`;

        const equipBadge = item.isEquipment 
          ? `<span class="ml-1.5 px-1.5 py-0.5 text-[10px] rounded bg-sky-950 text-sky-300 border border-sky-700/60 font-normal">Trang bị</span>` 
          : "";
        const ignoredBadge = item.isIgnored 
          ? `<span class="ml-1.5 px-1.5 py-0.5 text-[10px] rounded bg-rose-950 text-rose-300 border border-rose-700/60 font-normal">Đã ẩn</span>` 
          : "";

        tr.innerHTML = `
          <td class="py-2 px-2.5 text-center">${iconImg}</td>
          <td class="py-2.5 px-3 font-semibold text-white whitespace-nowrap">
            <div class="flex items-center gap-1 group">
              <span onclick="inlineRenameReportItem('${safeName}')" title="Nhấp để đổi tên vật phẩm này" class="cursor-pointer hover:text-emerald-300 hover:underline transition">${item.name}</span>
              <button type="button" onclick="inlineRenameReportItem('${safeName}')" title="Đổi tên vật phẩm" class="opacity-60 group-hover:opacity-100 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition">
                <i data-lucide="pencil" class="w-3 h-3"></i>
              </button>
              ${equipBadge}${ignoredBadge}
            </div>
          </td>
          <td class="py-2.5 px-2.5 text-center whitespace-nowrap">
            <span class="inline-block bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-md text-slate-200 font-mono font-bold whitespace-nowrap">${item.stacks} ô</span>
          </td>
          <td class="py-2.5 px-3 text-left">
            <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
              ${pills}
            </div>
          </td>
          <td class="py-2.5 px-3 text-right font-mono font-bold text-amber-400 text-sm whitespace-nowrap">${item.totalQty.toLocaleString('vi-VN')}</td>
          <td class="py-2.5 px-2.5 text-center whitespace-nowrap">
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

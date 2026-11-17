/* FILE TỔNG ĐIỀU PHỐI TAB 4: QUẢN LÝ, XÓA & GỘP VẬT PHẨM (js/quan-ly-va-gop-vat-pham.js) */

function renderSettingsManageItemsTab(query = "") {
  const containerEl = document.getElementById("settingsViewManageItems");
  const countBadge = document.getElementById("settingsManageItemCount");
  if (!containerEl) return;

  const allItems = typeof getAllSystemItemsForManage === "function"
    ? getAllSystemItemsForManage()
    : [];
  if (countBadge) countBadge.textContent = allItems.length;

  // CHẾ ĐỘ 2: ĐANG MỞ PANEL CHỌN ĐÍCH ĐỂ ĐỔI / GỘP
  if (typeof manageMergeSourceItem !== "undefined" && manageMergeSourceItem) {
    const sourceObj = allItems.find(i => i.name.toLowerCase() === manageMergeSourceItem.toLowerCase());
    const sourceThumb = sourceObj?.img
      ? `<img src="${sourceObj.img}" class="w-8 h-8 rounded object-cover border border-amber-500/50 bg-slate-900">`
      : `<div class="w-8 h-8 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-xs text-amber-400">✦</div>`;

    containerEl.innerHTML = `
      <div class="bg-slate-900/90 border border-sky-500/40 rounded-xl p-3.5 space-y-3">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div class="flex items-center gap-2.5">
            ${sourceThumb}
            <div>
              <span class="text-[10px] uppercase font-bold text-sky-400 block">Đang chọn nguồn để Đổi / Gộp:</span>
              <span class="text-sm font-black text-white">${manageMergeSourceItem}</span>
              <span class="text-[11px] text-slate-400 ml-1.5">(${sourceObj?.sampleCount || 0} mẫu AI • ${sourceObj?.chestQty || 0} cái)</span>
            </div>
          </div>
          <button type="button" onclick="closeMergePanel()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1">
            <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i> Quay lại
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label class="text-[11px] font-bold text-slate-300 block mb-1">1. Tìm nhanh vật phẩm đích có sẵn:</label>
            <input type="text" oninput="filterMergeTargetList(this.value)" placeholder="Gõ lọc danh sách bên dưới..." class="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500">
          </div>
          <div>
            <label class="text-[11px] font-bold text-slate-300 block mb-1">2. Hoặc nhập tên mới hoàn toàn:</label>
            <input type="text" id="mergeCustomNewNameInput" oninput="onMergeCustomInput(this.value)" placeholder="Nhập tên mới nếu muốn đổi tên..." class="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-amber-300 font-semibold focus:outline-none focus:border-amber-500">
          </div>
        </div>

        <div>
          <span class="text-[11px] font-semibold text-slate-400 block mb-1.5">Tích chọn 1 vật phẩm bên dưới để gộp toàn bộ dữ liệu vào:</span>
          <div id="mergeTargetOptionsContainer" class="max-h-48 overflow-y-auto space-y-1.5 pr-1"></div>
        </div>

        <div class="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
          <button type="button" onclick="closeMergePanel()" class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300">Hủy</button>
          <button type="button" id="btnConfirmExecuteMerge" onclick="executeMergeOrRenameItem()" disabled class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-500 cursor-not-allowed">
            Chọn hoặc nhập tên đích
          </button>
        </div>
      </div>
    `;

    if (typeof renderMergeTargetOptionsList === "function") renderMergeTargetOptionsList();
    if (typeof updateMergeConfirmButtonState === "function") updateMergeConfirmButtonState();
    if (window.lucide) lucide.createIcons();
    return;
  }

  // CHẾ ĐỘ 1: DANH SÁCH TỔNG QUAN TOÀN BỘ VẬT PHẨM
  containerEl.innerHTML = `
    <div class="relative">
      <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
      <input type="text" id="settingsManageItemSearch" value="${query.replace(/"/g, "&quot;")}" oninput="renderSettingsManageItemsTab(this.value)" placeholder="Tìm vật phẩm để đổi tên, gộp vào món khác hoặc xóa..." class="w-full pl-8 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500">
    </div>
    <div id="settingsManageItemList" class="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-72"></div>
  `;

  const listEl = document.getElementById("settingsManageItemList");
  const q = query.trim().toLowerCase();
  const filtered = allItems.filter(i => i.name.toLowerCase().includes(q));

  if (filtered.length === 0) {
    listEl.innerHTML = `<p class="text-xs text-slate-500 italic text-center py-6">Không tìm thấy vật phẩm nào.</p>`;
    return;
  }

  listEl.innerHTML = filtered.map(item => {
    const safeName = item.name.replace(/'/g, "\\'");
    const thumbHtml = item.img
      ? `<img src="${item.img}" class="w-7 h-7 rounded object-cover border border-slate-700 bg-slate-900 shrink-0">`
      : `<div class="w-7 h-7 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] text-slate-600 shrink-0">✦</div>`;

    return `
      <div class="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-slate-700 transition">
        <div class="flex items-center gap-2.5 min-w-0">
          ${thumbHtml}
          <div class="min-w-0">
            <span class="text-xs font-bold text-white block truncate">${item.name}</span>
            <span class="text-[10px] text-slate-400 font-mono">
              ${item.sampleCount} mẫu AI &bull; Đang có: <b class="text-amber-400">${item.chestQty.toLocaleString("vi-VN")}</b> (${item.chestSlots} ô)
            </span>
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <button type="button" onclick="openMergePanelForItem('${safeName}')" title="Đổi tên hoặc gộp vào vật phẩm khác" class="px-2.5 py-1 rounded-lg bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border border-sky-700/50 text-[11px] font-semibold flex items-center gap-1 transition">
            <i data-lucide="git-merge" class="w-3 h-3"></i>
            <span>Đổi / Gộp</span>
          </button>
          <button type="button" onclick="deleteItemFromSystem('${safeName}')" title="Xóa tên vật phẩm này (giữ nguyên ảnh ô)" class="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 transition">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
  }).join("");

  if (window.lucide) lucide.createIcons();
}

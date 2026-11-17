/* MODULE CÀI ĐẶT - DỰNG KHUNG HTML MODAL CÀI ĐẶT (js/settings-dom.js) */

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
  const totalItemsCount = typeof getAllSystemItemsForManage === "function"
    ? getAllSystemItemsForManage().length
    : 0;

  modal.innerHTML = `
    <div class="bg-[#121922] border border-slate-700 w-full max-w-2xl rounded-2xl p-5 shadow-2xl flex flex-col max-h-[90vh] space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2">
          <i data-lucide="sliders-horizontal" class="w-4 h-4 text-amber-400"></i>
          <h3 class="text-sm font-bold text-white">Cài Đặt Quy Tắc Nhận Diện & Báo Cáo</h3>
        </div>
        <button type="button" id="btnCloseAppSettings" class="text-slate-400 hover:text-white"><i data-lucide="x" class="w-4 h-4"></i></button>
      </div>

      <!-- Thanh chọn 4 Tab -->
      <div class="grid grid-cols-2 sm:grid-cols-4 p-1 bg-slate-900 border border-slate-800 rounded-xl gap-1">
        <button type="button" id="settingsTabAdkBtn" class="py-2 px-2 rounded-lg text-xs font-bold bg-emerald-600 text-white transition">
          1. ADK / TBQ
        </button>
        <button type="button" id="settingsTabEquipBtn" class="py-2 px-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition">
          2. Trang Bị (<span id="settingsEquipCount">0</span>)
        </button>
        <button type="button" id="settingsTabReportAccBtn" class="py-2 px-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition">
          3. Acc Báo Cáo (<span id="settingsReportAccCount">${includedCount}/${allAccs.length}</span>)
        </button>
        <button type="button" id="settingsTabManageItemsBtn" class="py-2 px-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition">
          4. Quản Lý Đồ (<span id="settingsManageItemCount">${totalItemsCount}</span>)
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
          <span>Chỉ các tài khoản <b>được tích chọn</b> mới tính khi bật nút <b>Lọc Acc</b>.</span>
          <div class="flex gap-1.5 shrink-0">
            <button type="button" id="btnSelectAllReportAcc" class="px-2 py-1 rounded bg-emerald-800/60 hover:bg-emerald-700 text-[11px] font-semibold text-white">Chọn hết</button>
            <button type="button" id="btnClearAllReportAcc" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300">Bỏ hết</button>
          </div>
        </div>
        <div id="settingsReportAccountList" class="space-y-2"></div>
      </div>

      <!-- NỘI DUNG TAB 4: QUẢN LÝ, XÓA & GỘP VẬT PHẨM -->
      <div id="settingsViewManageItems" class="hidden flex-1 flex flex-col overflow-hidden space-y-3">
        <div class="relative">
          <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
          <input type="text" id="settingsManageItemSearch" placeholder="Tìm vật phẩm để đổi tên, gộp vào món khác hoặc xóa..." class="w-full pl-8 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500">
        </div>
        <div id="settingsManageItemList" class="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-72"></div>
      </div>

      <div class="pt-3 border-t border-slate-800 flex justify-end">
        <button type="button" id="btnDoneAppSettings" class="px-5 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg">
          Xong & Lưu Cài Đặt
        </button>
      </div>
    </div>
  `;
}

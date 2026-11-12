/* GIAO DIỆN 3: THANH CHUYỂN TAB & BỘ LỌC CÔNG CỤ (js/thanh-dieu-huong.js) */

function renderNavigationBarHTML() {
  return `
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div id="mainTabBar" class="flex p-1 rounded-xl bg-slate-900 border border-slate-800 text-sm shrink-0">
        <button id="tabGameGridBtn" class="px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-2 bg-emerald-600 text-white shadow whitespace-nowrap">
          <i data-lucide="layout-grid" class="w-4 h-4 text-amber-300"></i>
          <span>Rương</span>
        </button>
        <button id="tabSummaryBtn" class="px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-2 text-slate-400 hover:text-white whitespace-nowrap">
          <i data-lucide="boxes" class="w-4 h-4"></i>
          <span>Báo Cáo</span>
        </button>
        <button id="tabDiffBtn" class="px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-2 text-slate-400 hover:text-white whitespace-nowrap">
          <i data-lucide="trending-up-down" class="w-4 h-4 text-amber-400"></i>
          <span>Biến Động</span>
        </button>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <select id="filterAccountSelect" class="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-lg text-emerald-400 font-semibold">
          <option value="ALL">Tất Cả Tài Khoản</option>
        </select>
        <button id="btnToggleFilterReportAcc" title="Bật/Tắt chỉ tính các tài khoản đã tích chọn trong Cài Đặt" class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-slate-300 border border-slate-700 transition">
          <i data-lucide="user-check" class="w-3.5 h-3.5 text-emerald-400"></i>
          <span id="lblToggleFilterReportAcc">Lọc Acc: Tắt</span>
        </button>
        <button id="btnToggleHideEquip" title="Bật/Tắt ẩn các món được đánh dấu là Trang Bị" class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-slate-300 border border-slate-700 transition">
          <i data-lucide="shield-off" class="w-3.5 h-3.5 text-sky-400"></i>
          <span id="lblToggleHideEquip">Ẩn Trang Bị: Tắt</span>
        </button>
        <button id="btnToggleShowIgnored" title="Xem hoặc ẩn các vật phẩm bạn đã bấm bỏ qua khỏi báo cáo" class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-slate-400 border border-slate-700 transition">
          <i data-lucide="eye-off" class="w-3.5 h-3.5"></i>
          <span id="lblToggleShowIgnored">Đồ Bỏ Qua (0)</span>
        </button>
        <div class="relative flex-1 sm:w-44 min-w-[140px]">
          <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
          <input type="text" id="searchInput" placeholder="Tìm vật phẩm..." class="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-lg text-slate-200">
        </div>
        <button id="btnCopyTable" class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">
          <i data-lucide="clipboard-copy" class="w-3.5 h-3.5 text-amber-400"></i>
          <span class="hidden sm:inline">Sao Chép</span>
        </button>
      </div>
    </div>
  `;
}

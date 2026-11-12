/* GIAO DIỆN 5: KHUNG TAB BÁO CÁO TỔNG HỢP TOÀN KHO (js/khung-tab-bao-cao.js) */

function renderReportTabHTML() {
  return `
    <div id="tabSummaryView" class="hidden space-y-4">
      <div class="bg-game-card border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm border-collapse">
            <thead>
              <tr class="bg-slate-900/90 border-b border-slate-800 text-slate-400 text-xs uppercase font-semibold">
                <th class="py-3 px-4 w-12 text-center">#</th>
                <th class="py-3 px-4">Icon</th>
                <th class="py-3 px-4 cursor-pointer hover:text-white" id="sortByName"><div class="flex items-center gap-1">Tên Vật Phẩm <i data-lucide="arrow-up-down" class="w-3 h-3"></i></div></th>
                <th class="py-3 px-4 text-center">Số Ô</th>
                <th class="py-3 px-4 text-center">Tài Khoản & Rương Chứa</th>
                <th class="py-3 px-4 text-right cursor-pointer hover:text-white" id="sortByQty"><div class="flex items-center justify-end gap-1">Tổng Số Lượng <i data-lucide="arrow-down" class="w-3 h-3 text-emerald-400"></i></div></th>
                <th class="py-3 px-4 text-center w-28">Ẩn / Hiện</th>
              </tr>
            </thead>
            <tbody id="summaryTableBody" class="divide-y divide-slate-800/60 text-xs sm:text-sm"></tbody>
          </table>
        </div>
        <div id="emptySummaryNotice" class="py-16 text-center text-slate-500 space-y-2">
          <i data-lucide="box" class="w-12 h-12 mx-auto text-slate-600 mb-2"></i>
          <p class="text-sm font-medium">Chưa có dữ liệu rương nào.</p>
        </div>
      </div>
    </div>
  `;
}

/* GIAO DIỆN 6: KHUNG TAB BIẾN ĐỘNG KHO (js/khung-tab-bien-dong.js) */

function renderDiffTabHTML() {
  return `
    <div id="tabDiffView" class="hidden space-y-4">
      <div class="bg-game-card border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-bold text-white flex items-center gap-2"><i data-lucide="git-compare" class="w-4 h-4 text-emerald-400"></i><span>So Sánh Biến Động Kho</span></h3>
          <p class="text-xs text-slate-400">Lưu mốc so sánh trước khi gom/trả đồ để theo dõi biến động.</p>
        </div>
        <div class="flex items-center gap-2">
          <button id="btnCreateSnapshot" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"><i data-lucide="camera" class="w-3.5 h-3.5"></i><span>Lưu Mốc So Sánh</span></button>
          <button id="btnClearSnapshot" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold">Xóa Mốc</button>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-game-card border border-slate-800 rounded-2xl p-4 space-y-3">
          <span class="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5"><i data-lucide="trending-up" class="w-4 h-4"></i> Đầy Lên (Nạp thêm)</span>
          <div id="diffIncreasedList" class="space-y-2 text-xs max-h-96 overflow-y-auto"></div>
        </div>
        <div class="bg-game-card border border-slate-800 rounded-2xl p-4 space-y-3">
          <span class="text-xs font-bold text-rose-400 uppercase flex items-center gap-1.5"><i data-lucide="trending-down" class="w-4 h-4"></i> Hao Đi (Bị lấy ra)</span>
          <div id="diffDecreasedList" class="space-y-2 text-xs max-h-96 overflow-y-auto"></div>
        </div>
      </div>
    </div>
  `;
}

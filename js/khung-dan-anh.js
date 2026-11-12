/* GIAO DIỆN 2: KHUNG DÁN ẢNH & THỐNG KÊ NHANH (js/khung-dan-anh.js) */

function renderUploadZoneHTML() {
  return `
    <section class="bg-game-card border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div class="flex flex-col md:flex-row gap-5 items-stretch">
        <div id="dropZone" tabindex="0" class="flex-1 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-game-slot/60 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-default transition focus:outline-none focus:border-emerald-500">
          <input type="file" id="fileInput" accept="image/*" class="hidden" />
          <div class="w-14 h-14 rounded-2xl bg-emerald-950/50 border border-emerald-800/40 flex items-center justify-center text-emerald-400 mb-3">
            <i data-lucide="image-plus" class="w-7 h-7"></i>
          </div>
          <h3 class="font-semibold text-white text-base">
            Click vào đây rồi bấm <kbd class="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700 text-xs font-mono font-bold">Ctrl + V</kbd> dán ảnh rương (hoặc <button type="button" id="btnBrowseFile" class="text-emerald-400 underline hover:text-emerald-300 font-bold cursor-pointer">chọn tệp</button>)
          </h3>
          <p class="text-xs text-slate-400 mt-1 max-w-md">Canvas sẽ căn chỉnh 35 ô (5×7), crop icon sắc nét và tạo giao diện rương chuẩn game.</p>
          <div class="flex items-center gap-2 mt-3 text-[11px] text-slate-400">
            <span class="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">Tự cắt Icon từng ô</span>
            <span id="readingBadge" class="hidden px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold flex items-center gap-1.5">
              <i data-lucide="loader-2" class="w-3 h-3 animate-spin"></i>
              <span id="progressStatusText">Đang xử lý...</span>
              <span id="progressPercentText" class="font-mono font-bold text-emerald-400">0%</span>
            </span>
          </div>
          <div id="scanProgressBarContainer" class="hidden w-full max-w-sm mt-3 bg-slate-900 rounded-full h-2 border border-slate-700/80 overflow-hidden shadow-inner">
            <div id="scanProgressBarFill" class="bg-gradient-to-r from-emerald-500 to-amber-400 h-full transition-all duration-300 ease-out" style="width: 0%"></div>
          </div>
        </div>

        <div class="w-full md:w-80 bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div>
            <div class="flex items-center justify-between text-xs mb-2">
              <span class="text-slate-400 font-medium">Chế độ phân tích:</span>
              <span id="modeBadge" class="badge-amber text-xs px-2 py-0.5 rounded-full font-semibold">Chế độ Demo</span>
            </div>
            <p id="modeDesc" class="text-xs text-slate-400 leading-relaxed">Chưa cài API Key.</p>
          </div>
          <div class="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
            <div class="flex justify-between text-slate-400"><span>Số tài khoản (Acc):</span><strong id="statAccCount" class="text-white">0</strong></div>
            <div class="flex justify-between text-slate-400"><span>Tổng rương đã nạp:</span><strong id="statChestsCount" class="text-white">0</strong></div>
            <div class="flex justify-between text-slate-400"><span>Tổng vật phẩm:</span><strong id="statTotalItems" class="text-amber-400 font-bold">0</strong></div>
          </div>
        </div>
      </div>
    </section>
  `;
}

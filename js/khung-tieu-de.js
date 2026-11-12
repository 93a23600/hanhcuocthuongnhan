/* GIAO DIỆN 1: THANH HEADER TRÊN CÙNG (js/khung-tieu-de.js) */

function renderHeaderHTML() {
  return `
    <header class="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg text-white font-black text-xl">
            <i data-lucide="package-search" class="w-6 h-6"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-lg font-bold text-white">Kiểm Kho Game AI</h1>
              <span class="text-xs px-2 py-0.5 rounded-full font-semibold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Lưới 35 Ô (5×7)</span>
            </div>
            <p class="text-xs text-slate-400 hidden sm:block">Chụp màn hình rương &bull; Bấm Ctrl+V &bull; Căn khung 35 ô &bull; Nhấp ô để sửa</p>
          </div>
        </div>

        <div id="headerActionButtons" class="flex items-center gap-2">
          <button id="btnOpenAppSettings" title="Cấu hình phân loại vật phẩm & tài khoản" class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-700/60 transition">
            <i data-lucide="sliders-horizontal" class="w-3.5 h-3.5"></i>
            <span class="hidden sm:inline">Cài Đặt</span>
          </button>
          <button id="btnExportBrain" title="Tải file dữ liệu icon đã học về máy tính" class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 transition">
            <i data-lucide="download" class="w-3.5 h-3.5"></i>
            <span class="hidden sm:inline">Xuất Não AI</span>
          </button>
          <label title="Nạp file não từ máy tính vào" class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition">
            <i data-lucide="upload" class="w-3.5 h-3.5 text-sky-400"></i>
            <span class="hidden sm:inline">Nạp Não AI</span>
            <input type="file" id="inputImportBrain" accept=".json" class="hidden" />
          </label>
          <button id="btnOpenConfig" class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">
            <i data-lucide="key-round" class="w-3.5 h-3.5 text-slate-400"></i>
            <span id="apiKeyLabel">Cài đặt API</span>
          </button>
          <button id="btnResetAll" title="Chỉ xóa dữ liệu rương tạm, giữ nguyên não bộ" class="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-700">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    </header>
  `;
}

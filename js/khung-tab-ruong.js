/* GIAO DIỆN 4: KHUNG TAB RƯƠNG GAME 5x7 & PANEL CHỈNH SỬA (js/khung-tab-ruong.js) */

function renderChestTabHTML() {
  return `
    <div id="tabGameGridView" class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl text-xs">
        <div class="flex items-center gap-2">
          <span class="text-slate-400 font-semibold">Tài khoản:</span>
          <select id="selectViewingAcc" class="bg-slate-950 border border-slate-700 px-2 py-1 rounded-lg text-emerald-400 font-bold focus:outline-none"></select>
          <div class="flex gap-1" id="viewingChestBtns">
            <button class="btn-view-chest px-2.5 py-1 rounded-lg border border-emerald-500 bg-emerald-950/40 text-emerald-400 font-bold" data-title="Rương 1">Rương 1</button>
            <button class="btn-view-chest px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 font-semibold" data-title="Rương 2">Rương 2</button>
            <button class="btn-view-chest px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 font-semibold" data-title="Rương 3">Rương 3</button>
          </div>
        </div>
        <span class="text-slate-400 text-[11px] italic hidden sm:inline">Nhấp ô để sửa. Đổi tên 1 ô sẽ tự đổi toàn bộ các ô cùng icon.</span>
      </div>

      <div class="flex flex-row items-start justify-center gap-3 overflow-x-auto pb-2">
        <div class="w-[300px] sm:w-[340px] shrink-0">
          <div class="game-chest-window p-2.5 rounded-xl border-2 border-[#1e2e3d] shadow-2xl bg-[#0c131a]">
            <div class="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#1f2d3a] px-1 text-xs">
              <span id="currentChestLabel" class="font-bold text-amber-400 tracking-wide text-[11px] sm:text-xs">Rương Chứa Đồ</span>
              <span id="currentChestSlotCount" class="text-slate-400 font-mono text-[10px] sm:text-[11px]">0/35 ô</span>
            </div>
            <div id="gameGridSlotsContainer" class="grid grid-cols-5 gap-1.5 p-1 bg-[#070b0e] rounded-lg border border-[#16222c]"></div>
          </div>
        </div>

        <div class="w-[280px] sm:w-[320px] shrink-0 bg-game-card border border-slate-800 rounded-xl p-3.5 space-y-3">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 class="text-xs font-bold text-white flex items-center gap-1.5">
              <i data-lucide="scan-eye" class="w-3.5 h-3.5 text-emerald-400"></i>
              <span>Ô Đang Chọn</span>
            </h3>
            <span id="sidePanelSlotIndexBadge" class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">Ô --</span>
          </div>

          <div class="flex items-center gap-2.5 p-2 bg-slate-950 rounded-lg border border-slate-800">
            <div class="w-12 h-12 bg-[#0a0f14] border border-slate-700 rounded-md flex items-center justify-center overflow-hidden shrink-0">
              <img id="sidePanelCropImg" src="" class="w-full h-full object-contain hidden">
              <span id="sidePanelEmptyIcon" class="text-slate-600 text-[10px] italic">Trống</span>
            </div>
            <div class="text-[11px] text-slate-400 leading-tight">
              <span class="text-slate-200 font-semibold block">Icon thực tế từ ô</span>
              <span>Hệ thống tự nhớ ảnh này để gán cho các acc khác.</span>
            </div>
          </div>

          <div class="space-y-2.5 text-xs">
            <div class="relative">
              <label class="text-slate-300 font-bold block mb-1 text-[11px]">Tên Vật Phẩm Chuẩn:</label>
              <input type="text" id="sidePanelItemName" autocomplete="off" placeholder="Gõ để tìm hoặc thêm tên mới..." class="w-full bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-lg text-emerald-300 focus:outline-none focus:border-emerald-500 font-semibold text-xs">
              <div id="customAutocompleteList" class="hidden absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 divide-y divide-slate-800 text-xs"></div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-slate-300 font-bold text-[11px]">Số Lượng:</label>
                <span id="sidePanelAiDetectedNotice" class="text-[10px] text-amber-400 font-mono"></span>
              </div>
              <input type="number" id="sidePanelItemQty" min="0" max="999999" class="w-full bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-lg text-amber-300 focus:outline-none focus:border-emerald-500 font-mono font-bold text-xs">
            </div>

            <div class="pt-1 flex flex-col gap-1.5">
              <button type="button" id="btnSaveSidePanel" class="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 transition text-xs shadow-md">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
                <span>Lưu & Cập Nhật Tất Cả Ô Trùng</span>
              </button>
              <div class="flex items-center gap-1.5">
                <button type="button" id="btnTrainAiWrongNumber" class="flex-1 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg font-semibold flex items-center justify-center gap-1 transition text-[10px]">
                  <i data-lucide="brain-circuit" class="w-3 h-3 text-amber-400"></i>
                  <span>Dạy AI Số Này</span>
                </button>
                <button type="button" id="btnSidePanelEmptySlot" class="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded-lg font-semibold text-[10px]">
                  Làm Rỗng
                </button>
              </div>
            </div>
          </div>

          <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
            <span>Đã nhớ: <b id="statLearnedIcons" class="text-emerald-400">0</b> mẫu</span>
            <span>Mẫu số: <b id="statTrainedSamples" class="text-amber-400">0</b></span>
          </div>
        </div>
      </div>
    </div>
  `;
}

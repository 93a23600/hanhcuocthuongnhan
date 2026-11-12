/* GIAO DIỆN CHÍNH (js/layout.js) - Tự bơm vào #appHeaderMount và #appMainMount */
(function renderMainLayout() {
  const headerMount = document.getElementById("appHeaderMount");
  const mainMount = document.getElementById("appMainMount");

  if (headerMount) {
    headerMount.innerHTML = `
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

  if (mainMount) {
    mainMount.innerHTML = `
      <!-- Khung dán ảnh -->
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

      <!-- Tabs Điều Hướng -->
      <section class="space-y-4">
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

        <!-- TAB 1: RƯƠNG MÔ PHỎNG GAME -->
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

        <!-- TAB 2: TỔNG HỢP TOÀN KHO -->
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

        <!-- TAB 3: BIẾN ĐỘNG HAO / ĐẦY -->
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
      </section>
    `;
  }
})();

/* GIAO DIỆN POPUP / MODAL (js/modals.js) - Tự bơm vào #appModalsMount */
(function renderAppModals() {
  const mount = document.getElementById("appModalsMount");
  if (!mount) return;

  mount.innerHTML = `
    <!-- MODAL 1: CÀI ĐẶT NÂNG CAO -->
    <div id="appSettingsModal" class="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden">
      <div class="bg-[#121922] border border-slate-700 w-full max-w-lg rounded-2xl p-5 shadow-2xl flex flex-col max-h-[90vh] space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2">
            <i data-lucide="sliders-horizontal" class="w-4 h-4 text-amber-400"></i>
            <h3 class="text-sm font-bold text-white">Cài Đặt Quy Tắc Nhận Diện & Kho</h3>
          </div>
          <button id="btnCloseAppSettings" class="text-slate-400 hover:text-white"><i data-lucide="x" class="w-4 h-4"></i></button>
        </div>

        <div class="flex p-1 bg-slate-900 border border-slate-800 rounded-xl gap-1">
          <button id="settingsTabAdkBtn" class="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-emerald-600 text-white transition">
            1. Âm Dương Kính / Thiết Bát Quái
          </button>
          <button id="settingsTabEquipBtn" class="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition">
            2. Danh Sách Trang Bị (<span id="settingsEquipCount">0</span>)
          </button>
        </div>

        <!-- TAB 1 -->
        <div id="settingsViewAdk" class="flex-1 overflow-y-auto space-y-3 pr-1">
          <div class="p-3 rounded-xl bg-amber-950/20 border border-amber-700/40 text-xs text-amber-200/90 leading-relaxed">
            <b>Quy tắc phân loại 2 chiều:</b><br>
            &bull; <b>Tài khoản ĐƯỢC TÍCH:</b> Toàn bộ <i>Âm Dương Kính / Thiết Bát Quái</i> sẽ tính là <b>Thiết Bát Quái</b>.<br>
            &bull; <b>Tài khoản KHÔNG TÍCH:</b> Toàn bộ sẽ tự động chuyển hết thành <b>Âm Dương Kính</b>.
          </div>
          <div id="settingsAdkAccountList" class="space-y-2"></div>
        </div>

        <!-- TAB 2 -->
        <div id="settingsViewEquip" class="hidden flex-1 flex flex-col overflow-hidden space-y-3">
          <div class="relative">
            <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
            <input type="text" id="settingsEquipSearch" placeholder="Tìm tên vật phẩm để đánh dấu là Trang Bị..." class="w-full pl-8 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500">
          </div>
          <div id="settingsEquipItemList" class="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-72"></div>
        </div>

        <div class="pt-3 border-t border-slate-800 flex justify-end">
          <button id="btnDoneAppSettings" class="px-5 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg">
            Xong & Lưu Cài Đặt
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 2: CĂN CHỈNH 4 CẠNH KHUNG LƯỚI 35 Ô (5×7) -->
    <div id="cropCalibrateModal" class="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 hidden">
      <div class="bg-[#121922] border border-slate-700 w-full max-w-xl rounded-2xl p-4 shadow-2xl flex flex-col max-h-[95vh]">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div class="flex items-center gap-2">
            <i data-lucide="scan" class="w-4 h-4 text-emerald-400"></i>
            <h3 class="text-sm font-bold text-white">Căn Chỉnh Khung Rương 35 Ô (5×7)</h3>
          </div>
          <span class="text-[11px] text-amber-400 font-semibold italic">Hệ thống sẽ tự nhớ khung này cho các lần sau</span>
        </div>

        <div class="flex-1 overflow-auto flex items-center justify-center bg-[#070b0e] rounded-xl border border-slate-800 p-2 min-h-[300px]">
          <canvas id="calibrateCanvas" class="max-w-full max-h-[55vh] object-contain cursor-crosshair rounded"></canvas>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs">
          <div class="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
            <div class="flex justify-between text-[11px] text-slate-400 mb-1"><span>Lề Trên:</span><b id="valCropTop" class="text-emerald-400 font-mono">0%</b></div>
            <input type="range" id="rangeCropTop" min="0" max="30" value="0" step="0.5" class="w-full accent-emerald-500 cursor-pointer">
          </div>
          <div class="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
            <div class="flex justify-between text-[11px] text-slate-400 mb-1"><span>Lề Dưới:</span><b id="valCropBottom" class="text-emerald-400 font-mono">0%</b></div>
            <input type="range" id="rangeCropBottom" min="0" max="30" value="0" step="0.5" class="w-full accent-emerald-500 cursor-pointer">
          </div>
          <div class="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
            <div class="flex justify-between text-[11px] text-slate-400 mb-1"><span>Lề Trái:</span><b id="valCropLeft" class="text-emerald-400 font-mono">0%</b></div>
            <input type="range" id="rangeCropLeft" min="0" max="30" value="0" step="0.5" class="w-full accent-emerald-500 cursor-pointer">
          </div>
          <div class="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
            <div class="flex justify-between text-[11px] text-slate-400 mb-1"><span>Lề Phải:</span><b id="valCropRight" class="text-emerald-400 font-mono">0%</b></div>
            <input type="range" id="rangeCropRight" min="0" max="30" value="0" step="0.5" class="w-full accent-emerald-500 cursor-pointer">
          </div>
        </div>

        <div class="pt-3 mt-2 border-t border-slate-800 flex justify-between items-center gap-2">
          <button id="btnResetCalibrate" class="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg">Đặt lại viền 0%</button>
          <div class="flex gap-2">
            <button id="btnCancelCalibrate" class="px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 rounded-lg">Hủy</button>
            <button id="btnConfirmCalibrate" class="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950">
              <i data-lucide="check" class="w-3.5 h-3.5"></i>
              <span>Khung Đã Chuẩn &rarr; Tiếp Tục</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL 3: XÁC NHẬN NẠP ẢNH RƯƠNG -->
    <div id="confirmUploadModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
      <div class="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-sm font-bold text-white flex items-center gap-2"><i data-lucide="scan-line" class="w-4 h-4 text-emerald-400"></i><span>Xác Nhận Nạp Ảnh Rương</span></h3>
          <button id="btnCancelUpload" class="text-slate-400 hover:text-white"><i data-lucide="x" class="w-4 h-4"></i></button>
        </div>
        <div class="flex items-center gap-3 p-2 bg-slate-950 rounded-xl border border-slate-800">
          <img id="uploadPreviewImg" src="" class="w-16 h-16 object-cover rounded-lg border border-slate-700 bg-slate-900">
          <div class="text-xs text-slate-400">
            <span class="text-slate-200 font-semibold block">Đã nhận ảnh rương đồ</span>
            <span>Hệ thống đã tự động cắt 35 ô. Chọn Acc & Rương để nạp.</span>
          </div>
        </div>
        <div class="space-y-3 text-xs">
          <div>
            <label class="text-slate-300 font-bold block mb-1">1. Tên Tài Khoản (Acc):</label>
            <input type="text" id="inputAccountName" list="accountSuggestions" placeholder="Gõ tên acc bất kỳ..." class="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl text-emerald-300 focus:outline-none focus:border-emerald-500 font-semibold">
            <datalist id="accountSuggestions"></datalist>
          </div>
          <div>
            <label class="text-slate-300 font-bold block mb-1">2. Chọn Rương Cần Nạp:</label>
            <div class="grid grid-cols-4 gap-2">
              <button type="button" class="btn-chest-num py-2 rounded-xl border border-emerald-500 bg-emerald-950/40 text-emerald-400 font-bold" data-num="Rương 1">Rương 1</button>
              <button type="button" class="btn-chest-num py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 font-bold" data-num="Rương 2">Rương 2</button>
              <button type="button" class="btn-chest-num py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 font-bold" data-num="Rương 3">Rương 3</button>
              <button type="button" id="btnCustomChestNum" class="py-2 rounded-xl border border-dashed border-slate-600 bg-slate-950 text-slate-400 font-semibold">+ Khác</button>
            </div>
            <input type="text" id="customChestInput" placeholder="Nhập tên rương khác..." class="hidden mt-2 w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200">
          </div>
        </div>
        <div class="pt-3 border-t border-slate-800 flex justify-end gap-2">
          <button id="btnDismissUpload" class="px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 rounded-xl">Hủy</button>
          <button id="btnConfirmUpload" class="px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/30">
            <i data-lucide="check" class="w-4 h-4"></i><span>Cập Nhật Rương</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 4: CÀI ĐẶT API KEY -->
    <div id="configModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
      <div class="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-bold text-white flex items-center gap-2"><i data-lucide="settings" class="w-5 h-5 text-emerald-400"></i> Cấu hình Gemini API</h2>
          <button id="btnCloseConfig" class="text-slate-400 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
        </div>
        <input type="password" id="inputApiKey" placeholder="Nhập khóa API Gemini..." class="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded-xl text-slate-200">
        <div class="pt-2 flex justify-end gap-2">
          <button id="btnClearApiKey" class="px-3 py-1.5 text-xs text-red-400 hover:bg-red-950/40 rounded-lg">Xóa Khóa</button>
          <button id="btnSaveApiKey" class="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold">Lưu Cấu Hình</button>
        </div>
      </div>
    </div>
  `;
})();

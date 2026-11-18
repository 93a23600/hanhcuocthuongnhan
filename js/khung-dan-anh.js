/* GIAO DIỆN 2: KHUNG DÁN ẢNH & THỐNG KÊ NHANH (js/khung-dan-anh.js) */

const GEMINI_MODEL_OPTIONS = [
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite (Siêu nhẹ / Nhanh)" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Tiêu chuẩn - Khuyên dùng)" },
  { id: "gemini-3.0-flash", label: "Gemini 3.0 Flash (Thế hệ 3 - Tốc độ cao)" },
  { id: "gemini-3.1-flash", label: "Gemini 3.1 Flash (Mới nhất - Chuẩn xác)" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro (Chuyên sâu / Đọc số khó)" },
  { id: "gemini-3.1-pro", label: "Gemini 3.1 Pro (Cao cấp nhất)" }
];

window.onSelectGeminiModel = function(modelId) {
  appState.geminiModel = modelId;
  localStorage.setItem("gemini_selected_model", modelId);
  if (typeof showToast === "function") {
    showToast(`Đã chuyển sang model: ${modelId}`, "info");
  }
};

window.syncCollapsedProgressBar = function() {
  const readingBadge = document.getElementById("readingBadge");
  const statusEl = document.getElementById("progressStatusText");
  const percentEl = document.getElementById("progressPercentText");
  const fillEl = document.getElementById("scanProgressBarFill");

  const miniWrap = document.getElementById("collapsedProgressWrap");
  const miniStatus = document.getElementById("collapsedProgressStatus");
  const miniPercent = document.getElementById("collapsedProgressPercent");
  const miniFill = document.getElementById("collapsedProgressFill");

  if (!miniWrap) return;

  // Ưu tiên lấy dữ liệu từ bộ điều phối đa luồng nếu có
  if (typeof window.getQueueProgressSummary === "function") {
    const qInfo = window.getQueueProgressSummary();
    if (qInfo && qInfo.activeCount > 0) {
      miniWrap.classList.remove("hidden");
      if (miniStatus) miniStatus.textContent = qInfo.shortText;
      if (miniPercent) miniPercent.textContent = `${qInfo.percent}%`;
      if (miniFill) miniFill.style.width = `${qInfo.percent}%`;
      return;
    } else {
      miniWrap.classList.add("hidden");
      return;
    }
  }

  if (!readingBadge) return;
  const isRunning = !readingBadge.classList.contains("hidden");
  if (isRunning) {
    miniWrap.classList.remove("hidden");
    if (miniStatus && statusEl) miniStatus.textContent = statusEl.textContent;
    if (miniPercent && percentEl) miniPercent.textContent = percentEl.textContent;
    if (miniFill && fillEl) miniFill.style.width = fillEl.style.width || "0%";
  } else {
    miniWrap.classList.add("hidden");
  }
};

window.toggleUploadZoneCollapse = function() {
  appState.isUploadZoneCollapsed = !appState.isUploadZoneCollapsed;
  localStorage.setItem("hktn_upload_collapsed", String(appState.isUploadZoneCollapsed));

  const headerEl = document.getElementById("uploadZoneHeader");
  const bodyEl = document.getElementById("uploadZoneBody");
  const iconEl = document.getElementById("iconToggleUploadZone");
  const labelEl = document.getElementById("lblToggleUploadZone");

  if (headerEl) {
    if (appState.isUploadZoneCollapsed) {
      headerEl.classList.remove("pb-3", "mb-4", "border-b", "border-slate-800/80");
    } else {
      headerEl.classList.add("pb-3", "mb-4", "border-b", "border-slate-800/80");
    }
  }
  if (bodyEl) {
    if (appState.isUploadZoneCollapsed) {
      bodyEl.classList.add("hidden");
    } else {
      bodyEl.classList.remove("hidden");
    }
  }
  if (iconEl) {
    iconEl.setAttribute("data-lucide", appState.isUploadZoneCollapsed ? "chevrons-down" : "chevrons-up");
  }
  if (labelEl) {
    labelEl.textContent = appState.isUploadZoneCollapsed ? "Mở rộng khung" : "Thu gọn";
  }

  window.syncCollapsedProgressBar();
  if (window.lucide) lucide.createIcons();
};

function setupCollapsedProgressObserver() {
  const readingBadge = document.getElementById("readingBadge");
  const statusEl = document.getElementById("progressStatusText");
  const percentEl = document.getElementById("progressPercentText");
  const fillEl = document.getElementById("scanProgressBarFill");
  if (!readingBadge || readingBadge.dataset.observed) return;

  readingBadge.dataset.observed = "true";
  const observer = new MutationObserver(() => window.syncCollapsedProgressBar());
  observer.observe(readingBadge, { attributes: true, attributeFilter: ["class"] });
  if (statusEl) observer.observe(statusEl, { childList: true, characterData: true, subtree: true });
  if (percentEl) observer.observe(percentEl, { childList: true, characterData: true, subtree: true });
  if (fillEl) observer.observe(fillEl, { attributes: true, attributeFilter: ["style"] });
}

function renderUploadZoneHTML() {
  const isCollapsed = !!appState.isUploadZoneCollapsed;
  const currentModel = appState.geminiModel || "gemini-2.5-flash";

  const modelOptionsHtml = GEMINI_MODEL_OPTIONS.map(m =>
    `<option value="${m.id}" ${m.id === currentModel ? "selected" : ""}>${m.label}</option>`
  ).join("");

  setTimeout(setupCollapsedProgressObserver, 0);

  return `
    <section class="bg-game-card border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl transition-all">
      <!-- Thanh tiêu đề 1 hàng duy nhất: Tiêu đề + Tiến trình gọn + Nút Thu gọn / Mở rộng -->
      <div id="uploadZoneHeader" class="flex items-center justify-between gap-2 min-w-0 ${isCollapsed ? '' : 'pb-3 mb-4 border-b border-slate-800/80'}">
        <div class="flex items-center gap-2 text-xs shrink-0">
          <span class="font-bold text-white flex items-center gap-1.5 whitespace-nowrap">
            <i data-lucide="scan-line" class="w-4 h-4 text-emerald-400 shrink-0"></i>
            <span>Khu Vực Nạp Ảnh Rương</span>
          </span>
        </div>

        <!-- Thanh tiến trình mini gọn nằm cùng hàng ngang, không đẩy rớt dòng -->
        <div id="collapsedProgressWrap" class="hidden flex-1 min-w-0 max-w-xs sm:max-w-sm mx-1 px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-500/40 flex items-center gap-2 text-[11px]">
          <i data-lucide="loader-2" class="w-3 h-3 text-amber-400 animate-spin shrink-0"></i>
          <span id="collapsedProgressStatus" class="text-amber-200 font-semibold truncate">Đang xử lý...</span>
          <div class="w-12 sm:w-20 shrink-0 bg-slate-900 rounded-full h-1.5 border border-slate-700/80 overflow-hidden">
            <div id="collapsedProgressFill" class="bg-gradient-to-r from-emerald-500 to-amber-400 h-full transition-all duration-300 ease-out" style="width: 0%"></div>
          </div>
          <span id="collapsedProgressPercent" class="font-mono font-bold text-emerald-400 shrink-0">0%</span>
        </div>

        <button type="button" onclick="toggleUploadZoneCollapse()" class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition shrink-0 whitespace-nowrap">
          <i id="iconToggleUploadZone" data-lucide="${isCollapsed ? 'chevrons-down' : 'chevrons-up'}" class="w-3.5 h-3.5 text-amber-400"></i>
          <span id="lblToggleUploadZone">${isCollapsed ? 'Mở rộng khung' : 'Thu gọn'}</span>
        </button>
      </div>

      <!-- Nội dung chính có thể thu gọn -->
      <div id="uploadZoneBody" class="${isCollapsed ? 'hidden' : ''} flex flex-col md:flex-row gap-5 items-stretch">
        <div id="dropZone" tabindex="0" class="flex-1 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-game-slot/60 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-default transition focus:outline-none focus:border-emerald-500">
          <input type="file" id="fileInput" accept="image/*" class="hidden" />
          <div class="w-14 h-14 rounded-2xl bg-emerald-950/50 border border-emerald-800/40 flex items-center justify-center text-emerald-400 mb-3">
            <i data-lucide="image-plus" class="w-7 h-7"></i>
          </div>
          <h3 class="font-semibold text-white text-base">
            Dán ảnh rương hoặc <button type="button" id="btnBrowseFile" class="text-emerald-400 underline hover:text-emerald-300 font-bold cursor-pointer">chọn tệp</button>
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
          <div class="space-y-2.5">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-400 font-medium">Chế độ phân tích:</span>
              <span id="modeBadge" class="badge-amber text-xs px-2 py-0.5 rounded-full font-semibold">Chế độ Demo</span>
            </div>
            <p id="modeDesc" class="text-xs text-slate-400 leading-relaxed">Chưa cài API Key.</p>

            <!-- Chọn phiên bản Gemini từ nhẹ đến Pro -->
            <div class="pt-1">
              <label for="selectGeminiModel" class="text-[11px] font-semibold text-slate-300 block mb-1">Phiên bản AI Gemini:</label>
              <select id="selectGeminiModel" onchange="onSelectGeminiModel(this.value)" class="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-emerald-300 font-semibold focus:outline-none focus:border-emerald-500">
                ${modelOptionsHtml}
              </select>
            </div>
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

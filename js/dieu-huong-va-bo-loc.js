/* MODULE: CHUYỂN TAB, CHỌN RƯƠNG, BỘ LỌC & SẮP XẾP (js/dieu-huong-va-bo-loc.js) */

window.toggleIgnoreItem = function(name) {
  if (appState.ignoredItems.includes(name)) {
    appState.ignoredItems = appState.ignoredItems.filter(i => i !== name);
    showToast(`Đã theo dõi lại [${name}]`, "info");
  } else {
    appState.ignoredItems.push(name);
    showToast(`Đã ẩn [${name}] khỏi Tổng Hợp Toàn Kho`, "info");
  }
  saveChestsState();
};

function initNavigationAndFilterEvents() {
  // 1. Chuyển Acc & Rương đang xem
  const selectAcc = document.getElementById("selectViewingAcc");
  if (selectAcc) {
    selectAcc.onchange = (e) => {
      appState.viewingAcc = e.target.value;
      appState.selectedSlotIndex = 0;
      renderAll();
    };
  }

  document.querySelectorAll(".btn-view-chest").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".btn-view-chest").forEach(b => {
        b.className = "btn-view-chest px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 font-semibold";
      });
      btn.className = "btn-view-chest px-2.5 py-1 rounded-lg border border-emerald-500 bg-emerald-950/40 text-emerald-400 font-bold";
      appState.viewingChest = btn.dataset.title;
      appState.selectedSlotIndex = 0;
      renderAll();
    };
  });

  // 2. Chuyển 3 Tab chính
  const tabGameGridBtn = document.getElementById("tabGameGridBtn");
  const tabSummaryBtn = document.getElementById("tabSummaryBtn");
  const tabDiffBtn = document.getElementById("tabDiffBtn");
  const tabGameGridView = document.getElementById("tabGameGridView");
  const tabSummaryView = document.getElementById("tabSummaryView");
  const tabDiffView = document.getElementById("tabDiffView");

  function setTab(tab) {
    [tabGameGridBtn, tabSummaryBtn, tabDiffBtn].forEach(b => {
      if (b) b.className = "px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-2 text-slate-400 hover:text-white whitespace-nowrap";
    });
    [tabGameGridView, tabSummaryView, tabDiffView].forEach(v => {
      if (v) v.classList.add("hidden");
    });

    if (tab === "gameGrid") {
      if (tabGameGridBtn) tabGameGridBtn.className = "px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-2 bg-emerald-600 text-white shadow whitespace-nowrap";
      if (tabGameGridView) tabGameGridView.classList.remove("hidden");
    } else if (tab === "summary") {
      if (tabSummaryBtn) tabSummaryBtn.className = "px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-2 bg-emerald-600 text-white shadow whitespace-nowrap";
      if (tabSummaryView) tabSummaryView.classList.remove("hidden");
    } else {
      if (tabDiffBtn) tabDiffBtn.className = "px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-2 bg-emerald-600 text-white shadow whitespace-nowrap";
      if (tabDiffView) tabDiffView.classList.remove("hidden");
    }
    appState.currentTab = tab;
    if (window.lucide) lucide.createIcons();
  }

  if (tabGameGridBtn) tabGameGridBtn.onclick = () => setTab("gameGrid");
  if (tabSummaryBtn) tabSummaryBtn.onclick = () => setTab("summary");
  if (tabDiffBtn) tabDiffBtn.onclick = () => setTab("diff");

  // 3. Bộ lọc Acc, Tìm kiếm, Lọc Acc Báo Cáo, Ẩn Trang Bị, Đồ Bỏ Qua & Sắp Xếp Cột
  const filterAcc = document.getElementById("filterAccountSelect");
  if (filterAcc) {
    filterAcc.onchange = (e) => {
      appState.selectedAccFilter = e.target.value;
      renderAll();
    };
  }

  const searchInp = document.getElementById("searchInput");
  if (searchInp) {
    searchInp.oninput = (e) => {
      appState.searchQuery = e.target.value.trim();
      renderAll();
    };
  }

  const btnToggleReportAcc = document.getElementById("btnToggleFilterReportAcc");
  if (btnToggleReportAcc) {
    btnToggleReportAcc.onclick = () => {
      appState.filterReportAccs = !appState.filterReportAccs;
      saveBrainState();
      renderAll();
    };
  }

  const btnToggleEquip = document.getElementById("btnToggleHideEquip");
  if (btnToggleEquip) {
    btnToggleEquip.onclick = () => {
      appState.hideEquipment = !appState.hideEquipment;
      saveBrainState();
      renderAll();
    };
  }

  const btnToggleIgnored = document.getElementById("btnToggleShowIgnored");
  if (btnToggleIgnored) {
    btnToggleIgnored.onclick = () => {
      appState.showIgnored = !appState.showIgnored;
      renderAll();
    };
  }

  const sortByQtyBtn = document.getElementById("sortByQty");
  if (sortByQtyBtn) {
    sortByQtyBtn.onclick = () => {
      if (appState.sortBy === "qty") {
        appState.sortDesc = !appState.sortDesc;
      } else {
        appState.sortBy = "qty";
        appState.sortDesc = false;
      }
      renderAll();
    };
  }

  const sortByNameBtn = document.getElementById("sortByName");
  if (sortByNameBtn) {
    sortByNameBtn.onclick = () => {
      if (appState.sortBy === "name") {
        appState.sortDesc = !appState.sortDesc;
      } else {
        appState.sortBy = "name";
        appState.sortDesc = false;
      }
      renderAll();
    };
  }
}

/* MODULE CÀI ĐẶT NÂNG CAO - ĐIỀU PHỐI CHÍNH (js/settings.js) */

function bindSettingsEvents() {
  const modal = document.getElementById("appSettingsModal");
  const btnClose = document.getElementById("btnCloseAppSettings");
  const btnDone = document.getElementById("btnDoneAppSettings");

  const tabAdkBtn = document.getElementById("settingsTabAdkBtn");
  const tabEquipBtn = document.getElementById("settingsTabEquipBtn");
  const tabReportAccBtn = document.getElementById("settingsTabReportAccBtn");
  const tabManageItemsBtn = document.getElementById("settingsTabManageItemsBtn");

  const viewAdk = document.getElementById("settingsViewAdk");
  const viewEquip = document.getElementById("settingsViewEquip");
  const viewReportAcc = document.getElementById("settingsViewReportAcc");
  const viewManageItems = document.getElementById("settingsViewManageItems");

  const equipSearch = document.getElementById("settingsEquipSearch");
  const manageSearch = document.getElementById("settingsManageItemSearch");

  const closeModal = () => {
    if (modal) modal.classList.add("hidden");
    saveBrainState();
    if (typeof applyAdkTbqRuleToAllChests === "function") applyAdkTbqRuleToAllChests();
    renderAll();
  };

  if (btnClose) btnClose.onclick = closeModal;
  if (btnDone) btnDone.onclick = closeModal;

  const setActiveSettingsTab = (activeTab) => {
    [tabAdkBtn, tabEquipBtn, tabReportAccBtn, tabManageItemsBtn].forEach(btn => {
      if (btn) btn.className = "py-2 px-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition";
    });
    [viewAdk, viewEquip, viewReportAcc, viewManageItems].forEach(view => {
      if (view) view.classList.add("hidden");
    });

    if (activeTab === "adk") {
      if (tabAdkBtn) tabAdkBtn.className = "py-2 px-2 rounded-lg text-xs font-bold bg-emerald-600 text-white transition";
      if (viewAdk) viewAdk.classList.remove("hidden");
      if (typeof renderSettingsAdkTab === "function") renderSettingsAdkTab();
    } else if (activeTab === "equip") {
      if (tabEquipBtn) tabEquipBtn.className = "py-2 px-2 rounded-lg text-xs font-bold bg-emerald-600 text-white transition";
      if (viewEquip) viewEquip.classList.remove("hidden");
      if (typeof renderSettingsEquipTab === "function") renderSettingsEquipTab(equipSearch ? equipSearch.value : "");
    } else if (activeTab === "reportAcc") {
      if (tabReportAccBtn) tabReportAccBtn.className = "py-2 px-2 rounded-lg text-xs font-bold bg-emerald-600 text-white transition";
      if (viewReportAcc) viewReportAcc.classList.remove("hidden");
      if (typeof renderSettingsReportAccTab === "function") renderSettingsReportAccTab();
    } else if (activeTab === "manageItems") {
      if (tabManageItemsBtn) tabManageItemsBtn.className = "py-2 px-2 rounded-lg text-xs font-bold bg-emerald-600 text-white transition";
      if (viewManageItems) viewManageItems.classList.remove("hidden");
      if (typeof renderSettingsManageItemsTab === "function") {
        renderSettingsManageItemsTab(manageSearch ? manageSearch.value : "");
      }
    }
  };

  if (tabAdkBtn) tabAdkBtn.onclick = () => setActiveSettingsTab("adk");
  if (tabEquipBtn) tabEquipBtn.onclick = () => setActiveSettingsTab("equip");
  if (tabReportAccBtn) tabReportAccBtn.onclick = () => setActiveSettingsTab("reportAcc");
  if (tabManageItemsBtn) tabManageItemsBtn.onclick = () => setActiveSettingsTab("manageItems");

  if (equipSearch) {
    equipSearch.oninput = (e) => {
      if (typeof renderSettingsEquipTab === "function") renderSettingsEquipTab(e.target.value);
    };
  }
  if (manageSearch) {
    manageSearch.oninput = (e) => {
      if (typeof renderSettingsManageItemsTab === "function") renderSettingsManageItemsTab(e.target.value);
    };
  }

  const btnSelectAll = document.getElementById("btnSelectAllReportAcc");
  if (btnSelectAll) {
    btnSelectAll.onclick = () => {
      appState.reportIncludedAccounts = typeof getAllKnownAccounts === "function" ? [...getAllKnownAccounts()] : [];
      saveBrainState();
      if (typeof renderSettingsReportAccTab === "function") renderSettingsReportAccTab();
    };
  }

  const btnClearAll = document.getElementById("btnClearAllReportAcc");
  if (btnClearAll) {
    btnClearAll.onclick = () => {
      appState.reportIncludedAccounts = [];
      saveBrainState();
      if (typeof renderSettingsReportAccTab === "function") renderSettingsReportAccTab();
    };
  }
}

function initSettingsModal() {
  const btnOpen = document.getElementById("btnOpenAppSettings");
  const modal = document.getElementById("appSettingsModal");

  if (btnOpen && modal) {
    btnOpen.onclick = () => {
      if (typeof ensureSettingsModalDOM === "function") ensureSettingsModalDOM();
      bindSettingsEvents();
      if (typeof renderSettingsAdkTab === "function") renderSettingsAdkTab();
      if (typeof renderSettingsEquipTab === "function") renderSettingsEquipTab();
      if (typeof renderSettingsReportAccTab === "function") renderSettingsReportAccTab();
      if (typeof renderSettingsManageItemsTab === "function") renderSettingsManageItemsTab();
      modal.classList.remove("hidden");
      if (window.lucide) lucide.createIcons();
    };
  }
}

let selectedChestNum = "Rương 1";

window.toggleIgnoreItem = function(name) {
  if (appState.ignoredItems.includes(name)) {
    appState.ignoredItems = appState.ignoredItems.filter(i => i !== name);
  } else {
    appState.ignoredItems.push(name);
  }
  saveState();
};

window.removeChest = function(id) {
  if (confirm("Xoá rương này?")) {
    appState.chests = appState.chests.filter(c => c.id !== id);
    saveState();
  }
};

window.addEventListener("DOMContentLoaded", () => {
  loadState();
  updateApiKeyUI();

  // Bắt phím Ctrl + V toàn trang
  window.addEventListener("paste", (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        handleIncomingFile(items[i].getAsFile());
        break;
      }
    }
  });

  const fileInput = document.getElementById("fileInput");
  const btnBrowse = document.getElementById("btnBrowseFile");
  const dropZone = document.getElementById("dropZone");

  // Chỉ mở cửa sổ file khi bấm chữ 'chọn tệp'
  btnBrowse.addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  // Click vào ô trống để focus sẵn sàng nhận Ctrl+V
  dropZone.addEventListener("click", () => dropZone.focus());

  fileInput.addEventListener("change", (e) => {
    if (e.target.files?.[0]) handleIncomingFile(e.target.files[0]);
    fileInput.value = "";
  });

  dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("drop-active"); });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drop-active"));
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drop-active");
    if (e.dataTransfer.files?.[0]) handleIncomingFile(e.dataTransfer.files[0]);
  });

  // Nút Rương 1 2 3
  document.querySelectorAll(".btn-chest-num").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn-chest-num").forEach(b => {
        b.classList.remove("border-emerald-500", "text-emerald-400", "bg-emerald-950/40");
        b.classList.add("bg-slate-800", "text-slate-300");
      });
      btn.classList.add("border-emerald-500", "text-emerald-400", "bg-emerald-950/40");
      btn.classList.remove("bg-slate-800", "text-slate-300");
      selectedChestNum = btn.dataset.num;
      document.getElementById("customChestInput").classList.add("hidden");
    });
  });

  document.getElementById("btnCustomChestNum").addEventListener("click", () => {
    const input = document.getElementById("customChestInput");
    input.classList.remove("hidden");
    input.focus();
  });

  // Nút Cập Nhật Rương trên Popup
  document.getElementById("btnConfirmUpload").addEventListener("click", () => {
    const accName = document.getElementById("inputAccountName").value.trim();
    if (!accName) {
      alert("Vui lòng điền tên tài khoản!");
      document.getElementById("inputAccountName").focus();
      return;
    }

    const customInput = document.getElementById("customChestInput");
    let chestTitle = selectedChestNum;
    if (!customInput.classList.contains("hidden") && customInput.value.trim()) {
      chestTitle = customInput.value.trim();
    }

    document.getElementById("confirmUploadModal").classList.add("hidden");
    executeUpload(accName, chestTitle);
  });

  const closePopup = () => {
    document.getElementById("confirmUploadModal").classList.add("hidden");
    pendingImage = null;
  };
  document.getElementById("btnCancelUpload").addEventListener("click", closePopup);
  document.getElementById("btnDismissUpload").addEventListener("click", closePopup);

  // Tabs điều hướng
  const tabSummaryBtn = document.getElementById("tabSummaryBtn");
  const tabChestsBtn = document.getElementById("tabChestsBtn");
  const tabDiffBtn = document.getElementById("tabDiffBtn");
  const tabSummaryView = document.getElementById("tabSummaryView");
  const tabChestsView = document.getElementById("tabChestsView");
  const tabDiffView = document.getElementById("tabDiffView");

  function setTab(tab) {
    [tabSummaryBtn, tabChestsBtn, tabDiffBtn].forEach(b => {
      b.className = "px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-2 text-slate-400 hover:text-white whitespace-nowrap";
    });
    [tabSummaryView, tabChestsView, tabDiffView].forEach(v => v.classList.add("hidden"));

    if (tab === "summary") {
      tabSummaryBtn.className = "px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-2 bg-emerald-600 text-white shadow whitespace-nowrap";
      tabSummaryView.classList.remove("hidden");
    } else if (tab === "chests") {
      tabChestsBtn.className = "px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-2 bg-emerald-600 text-white shadow whitespace-nowrap";
      tabChestsView.classList.remove("hidden");
    } else {
      tabDiffBtn.className = "px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-2 bg-emerald-600 text-white shadow whitespace-nowrap";
      tabDiffView.classList.remove("hidden");
    }
  }
  tabSummaryBtn.addEventListener("click", () => setTab("summary"));
  tabChestsBtn.addEventListener("click", () => setTab("chests"));
  tabDiffBtn.addEventListener("click", () => setTab("diff"));

  // Lọc Acc
  document.getElementById("filterAccountSelect").addEventListener("change", (e) => {
    appState.selectedAccFilter = e.target.value;
    renderAll();
  });

  // Tìm kiếm & Filter
  document.getElementById("searchInput").addEventListener("input", (e) => {
    appState.searchQuery = e.target.value.trim();
    renderAll();
  });
  document.getElementById("chkShowIgnored").addEventListener("change", (e) => {
    appState.showIgnored = e.target.checked;
    renderAll();
  });

  // Snapshot
  document.getElementById("btnCreateSnapshot").addEventListener("click", () => {
    const snap = {};
    appState.chests.forEach(c => c.slots.forEach(s => snap[s.name] = (snap[s.name] || 0) + (parseInt(s.qty) || 0)));
    appState.snapshot = snap;
    saveState();
    showToast("Đã lưu mốc so sánh!", "success");
  });
  document.getElementById("btnClearSnapshot").addEventListener("click", () => {
    appState.snapshot = null;
    saveState();
    showToast("Đã xóa mốc so sánh", "info");
  });

  // Copy bảng
  document.getElementById("btnCopyTable").addEventListener("click", () => {
    const summary = calculateSummary();
    let content = "Tên Vật Phẩm\tSố Ô\tTổng Số Lượng\n";
    summary.forEach(i => content += `${i.name}\t${i.stacks}\t${i.totalQty}\n`);
    navigator.clipboard.writeText(content);
    showToast("Đã sao chép bảng!", "success");
  });

  // Nạp mẫu test
  document.getElementById("btnLoadMock").addEventListener("click", () => {
    appState.accounts = ["Nick Chinh", "Nick Phu"];
    appState.chests = [
      { id: "c1", account: "Nick Chinh", title: "Rương 1", slots: [{ name: "Võ sĩ yêu đái", qty: 8500 }, { name: "Quỷ Hồn", qty: 3996 }] },
      { id: "c2", account: "Nick Chinh", title: "Rương 2", slots: [{ name: "Toái cốt", qty: 5827 }, { name: "Da hổ", qty: 5913 }] },
      { id: "c3", account: "Nick Phu", title: "Rương 1", slots: [{ name: "Linh Cầm", qty: 8146 }, { name: "Phù ấn", qty: 3865 }] }
    ];
    saveState();
    showToast("Đã nạp dữ liệu mẫu!", "success");
  });

  // Reset
  document.getElementById("btnResetAll").addEventListener("click", () => {
    if (confirm("Xóa toàn bộ dữ liệu?")) {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  });

  // Cấu hình API
  const configModal = document.getElementById("configModal");
  document.getElementById("btnOpenConfig").addEventListener("click", () => {
    document.getElementById("inputApiKey").value = appState.apiKey;
    configModal.classList.remove("hidden");
  });
  document.getElementById("btnCloseConfig").addEventListener("click", () => configModal.classList.add("hidden"));
  document.getElementById("btnSaveApiKey").addEventListener("click", () => {
    const key = document.getElementById("inputApiKey").value.trim();
    appState.apiKey = key;
    localStorage.setItem("gemini_api_key", key);
    configModal.classList.add("hidden");
    updateApiKeyUI();
    showToast("Đã lưu API Key!", "success");
  });
  document.getElementById("btnClearApiKey").addEventListener("click", () => {
    appState.apiKey = "";
    localStorage.removeItem("gemini_api_key");
    configModal.classList.add("hidden");
    updateApiKeyUI();
    showToast("Đã xóa API Key", "info");
  });

  renderAll();
  lucide.createIcons();
});

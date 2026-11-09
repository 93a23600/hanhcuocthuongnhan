let selectedChestNum = "Rương 1";

window.toggleIgnoreItem = function(name) {
  if (appState.ignoredItems.includes(name)) {
    appState.ignoredItems = appState.ignoredItems.filter(i => i !== name);
  } else {
    appState.ignoredItems.push(name);
  }
  saveState();
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

  btnBrowse.addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.click();
  });

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

  // Chọn nhanh Rương 1 2 3
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
    const accInput = document.getElementById("inputAccountName");
    const accName = accInput ? accInput.value.trim() : "";
    if (!accName) {
      alert("Vui lòng điền tên tài khoản!");
      if (accInput) accInput.focus();
      return;
    }

    const customInput = document.getElementById("customChestInput");
    let chestTitle = selectedChestNum;
    if (customInput && !customInput.classList.contains("hidden") && customInput.value.trim()) {
      chestTitle = customInput.value.trim();
    }

    document.getElementById("confirmUploadModal").classList.add("hidden");
    executeUpload(accName, chestTitle);
  });

  // Đóng Popup
  const closeUploadPopup = () => {
    document.getElementById("confirmUploadModal").classList.add("hidden");
    pendingImage = null;
    pendingCrops = [];
  };
  document.getElementById("btnCancelUpload").addEventListener("click", closeUploadPopup);
  document.getElementById("btnDismissUpload").addEventListener("click", closeUploadPopup);

  // Lưu Chỉnh Sửa Ô (Bắt lỗi)
  document.getElementById("btnSaveSlotChanges").addEventListener("click", () => {
    const currentChest = appState.chests.find(c => c.account === appState.viewingAcc && c.title === appState.viewingChest);
    if (!currentChest || currentEditingSlotIdx === null) return;

    const newName = document.getElementById("editSlotItemName").value.trim() || null;
    const newQty = parseInt(document.getElementById("editSlotItemQty").value) || 0;

    if (!currentChest.slots) currentChest.slots = Array(30).fill(null);
    const existingSlot = currentChest.slots[currentEditingSlotIdx] || {};

    currentChest.slots[currentEditingSlotIdx] = {
      name: newName,
      qty: newName ? newQty : 0,
      cropImg: existingSlot.cropImg || null
    };

    if (newName && existingSlot.cropImg) {
      appState.itemIcons[newName] = existingSlot.cropImg;
    }

    document.getElementById("editSlotModal").classList.add("hidden");
    saveState();
    showToast(`Đã sửa ô ${currentEditingSlotIdx + 1} thành công!`, "success");
  });

  // Làm rỗng ô
  document.getElementById("btnEmptySlot").addEventListener("click", () => {
    const currentChest = appState.chests.find(c => c.account === appState.viewingAcc && c.title === appState.viewingChest);
    if (!currentChest || currentEditingSlotIdx === null) return;

    if (currentChest.slots) {
      currentChest.slots[currentEditingSlotIdx] = { name: null, qty: 0, cropImg: null };
    }
    document.getElementById("editSlotModal").classList.add("hidden");
    saveState();
    showToast(`Đã xoá vật phẩm ô ${currentEditingSlotIdx + 1}`, "info");
  });

  document.getElementById("btnCloseEditSlot").addEventListener("click", () => {
    document.getElementById("editSlotModal").classList.add("hidden");
  });

  // Chuyển Acc & Rương trên Tab Game Grid
  document.getElementById("selectViewingAcc").addEventListener("change", (e) => {
    appState.viewingAcc = e.target.value;
    renderGameGridChest();
  });

  document.querySelectorAll(".btn-view-chest").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn-view-chest").forEach(b => {
        b.className = "btn-view-chest px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 font-semibold";
      });
      btn.className = "btn-view-chest px-3 py-1.5 rounded-lg border border-emerald-500 bg-emerald-950/40 text-emerald-400 font-bold";
      appState.viewingChest = btn.dataset.title;
      renderGameGridChest();
    });
  });

  // Tabs
  const tabGameGridBtn = document.getElementById("tabGameGridBtn");
  const tabSummaryBtn = document.getElementById("tabSummaryBtn");
  const tabDiffBtn = document.getElementById("tabDiffBtn");
  const tabGameGridView = document.getElementById("tabGameGridView");
  const tabSummaryView = document.getElementById("tabSummaryView");
  const tabDiffView = document.getElementById("tabDiffView");

  function setTab(tab) {
    [tabGameGridBtn, tabSummaryBtn, tabDiffBtn].forEach(b => {
      b.className = "px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-2 text-slate-400 hover:text-white whitespace-nowrap";
    });
    [tabGameGridView, tabSummaryView, tabDiffView].forEach(v => v.classList.add("hidden"));

    if (tab === "gameGrid") {
      tabGameGridBtn.className = "px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-2 bg-emerald-600 text-white shadow whitespace-nowrap";
      tabGameGridView.classList.remove("hidden");
    } else if (tab === "summary") {
      tabSummaryBtn.className = "px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-2 bg-emerald-600 text-white shadow whitespace-nowrap";
      tabSummaryView.classList.remove("hidden");
    } else {
      tabDiffBtn.className = "px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-2 bg-emerald-600 text-white shadow whitespace-nowrap";
      tabDiffView.classList.remove("hidden");
    }
    appState.currentTab = tab;
    lucide.createIcons();
  }

  tabGameGridBtn.addEventListener("click", () => setTab("gameGrid"));
  tabSummaryBtn.addEventListener("click", () => setTab("summary"));
  tabDiffBtn.addEventListener("click", () => setTab("diff"));

  // Lọc Acc tổng kho
  document.getElementById("filterAccountSelect").addEventListener("change", (e) => {
    appState.selectedAccFilter = e.target.value;
    renderAll();
  });

  document.getElementById("searchInput").addEventListener("input", (e) => {
    appState.searchQuery = e.target.value.trim();
    renderAll();
  });

  // Snapshot
  document.getElementById("btnCreateSnapshot").addEventListener("click", () => {
    const snap = {};
    appState.chests.forEach(c => (c.slots || []).forEach(s => {
      if (s && s.name) snap[s.name] = (snap[s.name] || 0) + (parseInt(s.qty) || 0);
    }));
    appState.snapshot = snap;
    saveState();
    showToast("Đã lưu mốc snapshot đối chiếu thành công!", "success");
  });

  document.getElementById("btnClearSnapshot").addEventListener("click", () => {
    appState.snapshot = null;
    saveState();
    showToast("Đã xoá mốc so sánh", "info");
  });

  // Copy Bảng
  document.getElementById("btnCopyTable").addEventListener("click", () => {
    const summary = calculateSummary();
    let content = "Tên Vật Phẩm\tSố Ô\tTổng Số Lượng\n";
    summary.forEach(i => content += `${i.name}\t${i.stacks}\t${i.totalQty}\n`);
    navigator.clipboard.writeText(content);
    showToast("Đã sao chép bảng ra bộ nhớ tạm!", "success");
  });

  // Reset
  document.getElementById("btnResetAll").addEventListener("click", () => {
    if (confirm("Cảnh báo: Thao tác này sẽ xoá sạch toàn bộ dữ liệu. Tiếp tục?")) {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  });

  // API Config Modal
  const configModal = document.getElementById("configModal");
  const inputApiKey = document.getElementById("inputApiKey");
  document.getElementById("btnOpenConfig").addEventListener("click", () => {
    inputApiKey.value = appState.apiKey;
    configModal.classList.remove("hidden");
  });
  document.getElementById("btnCloseConfig").addEventListener("click", () => configModal.classList.add("hidden"));
  document.getElementById("btnSaveApiKey").addEventListener("click", () => {
    const key = inputApiKey.value.trim();
    appState.apiKey = key;
    localStorage.setItem("gemini_api_key", key);
    configModal.classList.add("hidden");
    updateApiKeyUI();
    showToast("Đã lưu API Key thành công!", "success");
  });
  document.getElementById("btnClearApiKey").addEventListener("click", () => {
    inputApiKey.value = "";
    appState.apiKey = "";
    localStorage.removeItem("gemini_api_key");
    configModal.classList.add("hidden");
    updateApiKeyUI();
    showToast("Đã xoá API Key", "info");
  });

  renderAll();
  lucide.createIcons();
});

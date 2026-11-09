let selectedChestNum = "Rương 1";

window.toggleIgnoreItem = function(name) {
  if (appState.ignoredItems.includes(name)) {
    appState.ignoredItems = appState.ignoredItems.filter(i => i !== name);
    showToast(`Đã theo dõi lại [${name}]`, "info");
  } else {
    appState.ignoredItems.push(name);
    showToast(`Đã bỏ qua [${name}]`, "info");
  }
  saveState();
};

window.addEventListener("DOMContentLoaded", () => {
  loadState();
  updateApiKeyUI();

  // 1. Bắt phím Ctrl + V dán ảnh toàn trang
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

  // 2. Kéo thả & Chọn tệp
  const fileInput = document.getElementById("fileInput");
  const btnBrowse = document.getElementById("btnBrowseFile");
  const dropZone = document.getElementById("dropZone");

  if (btnBrowse && fileInput) {
    btnBrowse.addEventListener("click", (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  if (dropZone) {
    dropZone.addEventListener("click", () => dropZone.focus());
    dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("drop-active"); });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drop-active"));
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("drop-active");
      if (e.dataTransfer.files?.[0]) handleIncomingFile(e.dataTransfer.files[0]);
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      if (e.target.files?.[0]) handleIncomingFile(e.target.files[0]);
      fileInput.value = "";
    });
  }

  // 3. Chọn nhanh Rương 1 2 3 trên Popup nạp ảnh
  document.querySelectorAll(".btn-chest-num").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn-chest-num").forEach(b => {
        b.classList.remove("border-emerald-500", "text-emerald-400", "bg-emerald-950/40");
        b.classList.add("bg-slate-800", "text-slate-300");
      });
      btn.classList.add("border-emerald-500", "text-emerald-400", "bg-emerald-950/40");
      btn.classList.remove("bg-slate-800", "text-slate-300");
      selectedChestNum = btn.dataset.num;
      const customInput = document.getElementById("customChestInput");
      if (customInput) customInput.classList.add("hidden");
    });
  });

  const btnCustomChest = document.getElementById("btnCustomChestNum");
  if (btnCustomChest) {
    btnCustomChest.addEventListener("click", () => {
      const input = document.getElementById("customChestInput");
      if (input) {
        input.classList.remove("hidden");
        input.focus();
      }
    });
  }

  // 4. Nút Cập Nhật Rương trên Popup
  const btnConfirm = document.getElementById("btnConfirmUpload");
  if (btnConfirm) {
    btnConfirm.addEventListener("click", () => {
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

      const modal = document.getElementById("confirmUploadModal");
      if (modal) modal.classList.add("hidden");
      executeUpload(accName, chestTitle);
    });
  }

  // 5. Đóng Popup nạp ảnh
  const closeUploadPopup = () => {
    const modal = document.getElementById("confirmUploadModal");
    if (modal) modal.classList.add("hidden");
    pendingImage = null;
    pendingCrops = [];
  };
  const btnCancel = document.getElementById("btnCancelUpload");
  const btnDismiss = document.getElementById("btnDismissUpload");
  if (btnCancel) btnCancel.addEventListener("click", closeUploadPopup);
  if (btnDismiss) btnDismiss.addEventListener("click", closeUploadPopup);

  // 6. Lưu Thay Đổi Ô Trên Panel Bên Cạnh (Sidebar) & Tự Động Học Icon
  const btnSaveSide = document.getElementById("btnSaveSidePanel");
  if (btnSaveSide) {
    btnSaveSide.addEventListener("click", async () => {
      const chest = appState.chests.find(c => c.account === appState.viewingAcc && c.title === appState.viewingChest);
      if (!chest) return alert("Chưa có dữ liệu rương để lưu!");

      const idx = appState.selectedSlotIndex;
      const nameInput = document.getElementById("sidePanelItemName");
      const qtyInput = document.getElementById("sidePanelItemQty");

      const newName = nameInput ? nameInput.value.trim() : null;
      const newQty = qtyInput ? (parseInt(qtyInput.value) || 0) : 0;

      if (!chest.slots) chest.slots = Array(30).fill(null);
      const existing = chest.slots[idx] || {};

      chest.slots[idx] = {
        name: newName,
        qty: newName ? newQty : 0,
        cropImg: existing.cropImg || null,
        aiOriginalQty: existing.aiOriginalQty || newQty
      };

      // TỰ ĐỘNG LƯU ICON VÀO BỘ NHỚ: Nếu có ảnh cắt và có tên, băm hash để lần sau tự khớp
      if (newName && existing.cropImg) {
        const hash = await computeImageHash(existing.cropImg);
        appState.learnedIcons[newName] = { img: existing.cropImg, hash: hash };
        if (typeof KNOWN_ITEMS !== "undefined" && !KNOWN_ITEMS.includes(newName)) {
          KNOWN_ITEMS.push(newName);
        }
      }

      saveState();
      showToast(`Đã lưu ô ${idx + 1} và nạp icon [${newName}] vào bộ nhớ!`, "success");
    });
  }

  // 7. Báo AI Học Lại Số Này (Feedback Correction Loop)
  const btnTrain = document.getElementById("btnTrainAiWrongNumber");
  if (btnTrain) {
    btnTrain.addEventListener("click", () => {
      const chest = appState.chests.find(c => c.account === appState.viewingAcc && c.title === appState.viewingChest);
      if (!chest) return;
      const idx = appState.selectedSlotIndex;
      const slot = chest.slots ? chest.slots[idx] : null;
      if (!slot) return;

      const wrongQty = slot.qty;
      const correctInput = prompt(`AI đang nhận diện số này là [${wrongQty}]. Nhập con số CHÍNH XÁC trong game để dạy AI:`, wrongQty);

      if (correctInput !== null && correctInput.trim() !== "") {
        const correctVal = parseInt(correctInput.trim()) || 0;
        slot.qty = correctVal;

        if (!appState.trainedNumberErrors) appState.trainedNumberErrors = [];
        appState.trainedNumberErrors.push({
          wrongQty: wrongQty,
          correctQty: correctVal,
          itemName: slot.name || "Không rõ"
        });

        saveState();
        showToast(`Đã ghi nhớ mẫu [${wrongQty} -> ${correctVal}]. Lần sau AI sẽ đối chiếu để quét chuẩn hơn!`, "success");
      }
    });
  }

  // 8. Làm rỗng ô trên Panel
  const btnEmptySide = document.getElementById("btnSidePanelEmptySlot");
  if (btnEmptySide) {
    btnEmptySide.addEventListener("click", () => {
      const chest = appState.chests.find(c => c.account === appState.viewingAcc && c.title === appState.viewingChest);
      if (!chest) return;
      const idx = appState.selectedSlotIndex;
      if (chest.slots) {
        chest.slots[idx] = { name: null, qty: 0, cropImg: null };
      }
      saveState();
      showToast(`Đã làm rỗng ô ${idx + 1}`, "info");
    });
  }

  // 9. Chuyển Acc & Rương trên Tab Game Grid
  const selectAcc = document.getElementById("selectViewingAcc");
  if (selectAcc) {
    selectAcc.addEventListener("change", (e) => {
      appState.viewingAcc = e.target.value;
      appState.selectedSlotIndex = 0;
      renderAll();
    });
  }

  document.querySelectorAll(".btn-view-chest").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn-view-chest").forEach(b => {
        b.className = "btn-view-chest px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 font-semibold";
      });
      btn.className = "btn-view-chest px-3 py-1.5 rounded-lg border border-emerald-500 bg-emerald-950/40 text-emerald-400 font-bold";
      appState.viewingChest = btn.dataset.title;
      appState.selectedSlotIndex = 0;
      renderAll();
    });
  });

  // 10. Chuyển Tab (Rương Game / Tổng Kho / Biến Động)
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
    lucide.createIcons();
  }

  if (tabGameGridBtn) tabGameGridBtn.addEventListener("click", () => setTab("gameGrid"));
  if (tabSummaryBtn) tabSummaryBtn.addEventListener("click", () => setTab("summary"));
  if (tabDiffBtn) tabDiffBtn.addEventListener("click", () => setTab("diff"));

  // 11. Bộ lọc Acc & Tìm kiếm
  const filterAcc = document.getElementById("filterAccountSelect");
  if (filterAcc) {
    filterAcc.addEventListener("change", (e) => {
      appState.selectedAccFilter = e.target.value;
      renderAll();
    });
  }

  const searchInp = document.getElementById("searchInput");
  if (searchInp) {
    searchInp.addEventListener("input", (e) => {
      appState.searchQuery = e.target.value.trim();
      renderAll();
    });
  }

  // 12. Snapshot so sánh biến động
  const btnSnap = document.getElementById("btnCreateSnapshot");
  if (btnSnap) {
    btnSnap.addEventListener("click", () => {
      const snap = {};
      appState.chests.forEach(c => (c.slots || []).forEach(s => {
        if (s && s.name) snap[s.name] = (snap[s.name] || 0) + (parseInt(s.qty) || 0);
      }));
      appState.snapshot = snap;
      saveState();
      showToast("Đã lưu mốc snapshot đối chiếu thành công!", "success");
    });
  }

  const btnClearSnap = document.getElementById("btnClearSnapshot");
  if (btnClearSnap) {
    btnClearSnap.addEventListener("click", () => {
      if (confirm("Xoá mốc so sánh hiện tại?")) {
        appState.snapshot = null;
        saveState();
        showToast("Đã xoá mốc so sánh", "info");
      }
    });
  }

  // 13. Sao chép bảng ra Excel
  const btnCopy = document.getElementById("btnCopyTable");
  if (btnCopy) {
    btnCopy.addEventListener("click", () => {
      const summary = calculateSummary();
      let content = "Tên Vật Phẩm\tSố Ô\tTổng Số Lượng\n";
      summary.forEach(i => content += `${i.name}\t${i.stacks}\t${i.totalQty}\n`);
      navigator.clipboard.writeText(content).then(() => {
        showToast("Đã sao chép bảng ra bộ nhớ tạm!", "success");
      });
    });
  }

  // 14. Xoá sạch toàn bộ dữ liệu
  const btnReset = document.getElementById("btnResetAll");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      if (confirm("Cảnh báo: Toàn bộ dữ liệu rương và bộ nhớ icon sẽ bị xoá sạch. Tiếp tục?")) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
      }
    });
  }

  // 15. Cấu hình Gemini API Key Modal
  const configModal = document.getElementById("configModal");
  const inputApiKey = document.getElementById("inputApiKey");
  const btnOpenCfg = document.getElementById("btnOpenConfig");
  const btnCloseCfg = document.getElementById("btnCloseConfig");
  const btnSaveKey = document.getElementById("btnSaveApiKey");
  const btnClearKey = document.getElementById("btnClearApiKey");

  if (btnOpenCfg && configModal && inputApiKey) {
    btnOpenCfg.addEventListener("click", () => {
      inputApiKey.value = appState.apiKey;
      configModal.classList.remove("hidden");
    });
  }
  if (btnCloseCfg && configModal) {
    btnCloseCfg.addEventListener("click", () => configModal.classList.add("hidden"));
  }
  if (btnSaveKey && inputApiKey && configModal) {
    btnSaveKey.addEventListener("click", () => {
      const key = inputApiKey.value.trim();
      appState.apiKey = key;
      localStorage.setItem("gemini_api_key", key);
      configModal.classList.add("hidden");
      updateApiKeyUI();
      showToast(key ? "Đã lưu API Key!" : "Đã chuyển về Demo", "success");
    });
  }
  if (btnClearKey && inputApiKey && configModal) {
    btnClearKey.addEventListener("click", () => {
      inputApiKey.value = "";
      appState.apiKey = "";
      localStorage.removeItem("gemini_api_key");
      configModal.classList.add("hidden");
      updateApiKeyUI();
      showToast("Đã xoá API Key", "info");
    });
  }

  renderAll();
  lucide.createIcons();
});

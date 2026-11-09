let selectedChestNum = "Rương 1";

// Đưa hàm ra window để gọi từ các nút trong bảng HTML
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

window.removeChest = function(id) {
  if (confirm("Bạn có chắc chắn muốn xoá rương này?")) {
    appState.chests = appState.chests.filter(c => c.id !== id);
    showToast("Đã xoá rương thành công", "info");
    saveState();
  }
};

function copyTextFallback(text, successMsg) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg, "success");
    }).catch(() => fallbackOldWay(text, successMsg));
  } else {
    fallbackOldWay(text, successMsg);
  }

  function fallbackOldWay(t, msg) {
    const textarea = document.createElement("textarea");
    textarea.value = t;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      showToast(msg, "success");
    } catch (e) {
      showToast("Không thể sao chép vào bộ nhớ tạm", "error");
    }
    document.body.removeChild(textarea);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  loadState();
  updateApiKeyUI();

  // 1. Bắt phím Ctrl + V toàn trang
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

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("drop-active");
    });

    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("drop-active");
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("drop-active");
      if (e.dataTransfer.files?.[0]) {
        handleIncomingFile(e.dataTransfer.files[0]);
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      if (e.target.files?.[0]) handleIncomingFile(e.target.files[0]);
      fileInput.value = "";
    });
  }

  // 3. Chọn nhanh Rương 1, 2, 3 trên Popup
  const chestNumButtons = document.querySelectorAll(".btn-chest-num");
  const customChestInput = document.getElementById("customChestInput");
  const btnCustomChestNum = document.getElementById("btnCustomChestNum");

  chestNumButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      chestNumButtons.forEach(b => {
        b.classList.remove("border-emerald-500", "text-emerald-400", "bg-emerald-950/40");
        b.classList.add("bg-slate-800", "text-slate-300");
      });
      btn.classList.add("border-emerald-500", "text-emerald-400", "bg-emerald-950/40");
      btn.classList.remove("bg-slate-800", "text-slate-300");
      selectedChestNum = btn.dataset.num;
      if (customChestInput) customChestInput.classList.add("hidden");
    });
  });

  if (btnCustomChestNum && customChestInput) {
    btnCustomChestNum.addEventListener("click", () => {
      customChestInput.classList.remove("hidden");
      customChestInput.focus();
    });
  }

  // 4. Nút Cập Nhật Rương trên Popup
  const btnConfirmUpload = document.getElementById("btnConfirmUpload");
  if (btnConfirmUpload) {
    btnConfirmUpload.addEventListener("click", () => {
      const accInput = document.getElementById("inputAccountName");
      const accName = accInput ? accInput.value.trim() : "";

      if (!accName) {
        alert("Vui lòng điền tên tài khoản!");
        if (accInput) accInput.focus();
        return;
      }

      let chestTitle = selectedChestNum;
      if (customChestInput && !customChestInput.classList.contains("hidden") && customChestInput.value.trim()) {
        chestTitle = customChestInput.value.trim();
      }

      const modal = document.getElementById("confirmUploadModal");
      if (modal) modal.classList.add("hidden");

      executeUpload(accName, chestTitle);
    });
  }

  // 5. Đóng Popup nạp ảnh
  const closePopup = () => {
    const modal = document.getElementById("confirmUploadModal");
    if (modal) modal.classList.add("hidden");
    pendingImage = null;
  };

  const btnCancelUpload = document.getElementById("btnCancelUpload");
  const btnDismissUpload = document.getElementById("btnDismissUpload");
  if (btnCancelUpload) btnCancelUpload.addEventListener("click", closePopup);
  if (btnDismissUpload) btnDismissUpload.addEventListener("click", closePopup);

  // 6. Tabs điều hướng
  const tabSummaryBtn = document.getElementById("tabSummaryBtn");
  const tabChestsBtn = document.getElementById("tabChestsBtn");
  const tabDiffBtn = document.getElementById("tabDiffBtn");
  const tabSummaryView = document.getElementById("tabSummaryView");
  const tabChestsView = document.getElementById("tabChestsView");
  const tabDiffView = document.getElementById("tabDiffView");

  function setTab(tab) {
    [tabSummaryBtn, tabChestsBtn, tabDiffBtn].forEach(b => {
      if (!b) return;
      b.className = "px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-2 text-slate-400 hover:text-white whitespace-nowrap";
    });
    [tabSummaryView, tabChestsView, tabDiffView].forEach(v => {
      if (v) v.classList.add("hidden");
    });

    if (tab === "summary") {
      if (tabSummaryBtn) tabSummaryBtn.className = "px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-2 bg-emerald-600 text-white shadow whitespace-nowrap";
      if (tabSummaryView) tabSummaryView.classList.remove("hidden");
    } else if (tab === "chests") {
      if (tabChestsBtn) tabChestsBtn.className = "px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-2 bg-emerald-600 text-white shadow whitespace-nowrap";
      if (tabChestsView) tabChestsView.classList.remove("hidden");
    } else {
      if (tabDiffBtn) tabDiffBtn.className = "px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-2 bg-emerald-600 text-white shadow whitespace-nowrap";
      if (tabDiffView) tabDiffView.classList.remove("hidden");
    }
    appState.currentTab = tab;
    lucide.createIcons();
  }

  if (tabSummaryBtn) tabSummaryBtn.addEventListener("click", () => setTab("summary"));
  if (tabChestsBtn) tabChestsBtn.addEventListener("click", () => setTab("chests"));
  if (tabDiffBtn) tabDiffBtn.addEventListener("click", () => setTab("diff"));

  // 7. Lọc theo Acc
  const filterAccountSelect = document.getElementById("filterAccountSelect");
  if (filterAccountSelect) {
    filterAccountSelect.addEventListener("change", (e) => {
      appState.selectedAccFilter = e.target.value;
      renderAll();
    });
  }

  // 8. Tìm kiếm & Lọc item bỏ qua
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      appState.searchQuery = e.target.value.trim();
      renderAll();
    });
  }

  const chkShowIgnored = document.getElementById("chkShowIgnored");
  if (chkShowIgnored) {
    chkShowIgnored.addEventListener("change", (e) => {
      appState.showIgnored = e.target.checked;
      renderAll();
    });
  }

  // 9. Snapshot so sánh biến động
  const btnCreateSnapshot = document.getElementById("btnCreateSnapshot");
  if (btnCreateSnapshot) {
    btnCreateSnapshot.addEventListener("click", () => {
      const snap = {};
      appState.chests.forEach(c => {
        c.slots.forEach(s => {
          if (s.name) snap[s.name] = (snap[s.name] || 0) + (parseInt(s.qty) || 0);
        });
      });
      appState.snapshot = snap;
      saveState();
      showToast("Đã lưu mốc snapshot đối chiếu thành công!", "success");
    });
  }

  const btnClearSnapshot = document.getElementById("btnClearSnapshot");
  if (btnClearSnapshot) {
    btnClearSnapshot.addEventListener("click", () => {
      if (confirm("Bạn có muốn xoá mốc so sánh hiện tại?")) {
        appState.snapshot = null;
        saveState();
        showToast("Đã xoá mốc so sánh", "info");
      }
    });
  }

  // 10. Copy bảng ra clipboard (dán thẳng vào Excel/Sheets)
  const btnCopyTable = document.getElementById("btnCopyTable");
  if (btnCopyTable) {
    btnCopyTable.addEventListener("click", () => {
      const summary = calculateSummary();
      if (summary.length === 0) return showToast("Không có dữ liệu để sao chép", "error");

      let content = "Tên Vật Phẩm\tSố Ô (Stacks)\tTổng Số Lượng\n";
      summary.forEach(i => {
        content += `${i.name}\t${i.stacks}\t${i.totalQty}\n`;
      });
      copyTextFallback(content, "Đã sao chép bảng! Bạn có thể dán (Ctrl+V) vào Excel.");
    });
  }

  // 11. Nạp mẫu test (Dùng trực tiếp MOCK_CHESTS_DATA từ data.js)
  const btnLoadMock = document.getElementById("btnLoadMock");
  if (btnLoadMock) {
    btnLoadMock.addEventListener("click", () => {
      if (typeof MOCK_CHESTS_DATA !== "undefined" && Array.isArray(MOCK_CHESTS_DATA)) {
        appState.accounts = Array.from(new Set(MOCK_CHESTS_DATA.map(c => c.account || "Acc Chính")));
        appState.chests = JSON.parse(JSON.stringify(MOCK_CHESTS_DATA));
        saveState();
        showToast("Đã nạp đầy đủ 4 rương mẫu từ data.js!", "success");
      } else {
        showToast("Lỗi: Không tìm thấy MOCK_CHESTS_DATA trong data.js", "error");
      }
    });
  }

  // 12. Xoá sạch toàn bộ dữ liệu
  const btnResetAll = document.getElementById("btnResetAll");
  if (btnResetAll) {
    btnResetAll.addEventListener("click", () => {
      if (confirm("Cảnh báo: Hành động này sẽ xoá sạch toàn bộ dữ liệu rương đã lưu. Tiếp tục?")) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
      }
    });
  }

  // 13. Modal cấu hình API Key
  const configModal = document.getElementById("configModal");
  const inputApiKey = document.getElementById("inputApiKey");
  const btnOpenConfig = document.getElementById("btnOpenConfig");
  const btnCloseConfig = document.getElementById("btnCloseConfig");
  const btnSaveApiKey = document.getElementById("btnSaveApiKey");
  const btnClearApiKey = document.getElementById("btnClearApiKey");

  if (btnOpenConfig && configModal && inputApiKey) {
    btnOpenConfig.addEventListener("click", () => {
      inputApiKey.value = appState.apiKey;
      configModal.classList.remove("hidden");
    });
  }

  if (btnCloseConfig && configModal) {
    btnCloseConfig.addEventListener("click", () => {
      configModal.classList.add("hidden");
    });
  }

  if (btnSaveApiKey && inputApiKey && configModal) {
    btnSaveApiKey.addEventListener("click", () => {
      const key = inputApiKey.value.trim();
      appState.apiKey = key;
      localStorage.setItem("gemini_api_key", key);
      configModal.classList.add("hidden");
      updateApiKeyUI();
      showToast(key ? "Đã lưu API Key thành công!" : "Đã chuyển về chế độ Demo", "success");
    });
  }

  if (btnClearApiKey && inputApiKey && configModal) {
    btnClearApiKey.addEventListener("click", () => {
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

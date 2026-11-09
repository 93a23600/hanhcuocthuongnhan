// Các hàm tương tác gắn vào Window để gọi từ onclick HTML
window.toggleIgnoreItem = function(name) {
  if (appState.ignoredItems.includes(name)) {
    appState.ignoredItems = appState.ignoredItems.filter(i => i !== name);
    showToast(`Đã theo dõi lại [${name}]`, "info");
  } else {
    appState.ignoredItems.push(name);
    showToast(`Đã bỏ qua [${name}]`, "info");
  }
  savePersistedState();
};

window.updateChestTitle = function(id, newTitle) {
  const chest = appState.chests.find(c => c.id === id);
  if (chest && newTitle.trim()) {
    chest.title = newTitle.trim();
    showToast(`Đã đổi tên thành ${chest.title}`, "success");
    savePersistedState();
  }
};

window.renameChestPrompt = function(chestId) {
  const chest = appState.chests.find(c => c.id === chestId);
  if (!chest) return;
  const newTitle = prompt("Nhập tên mới cho rương:", chest.title);
  if (newTitle && newTitle.trim()) {
    chest.title = newTitle.trim();
    savePersistedState();
  }
};

function createNewChest(customName) {
  const defaultName = `Rương ${appState.chests.length + 1}`;
  const name = customName || prompt("Nhập tên rương mới (ví dụ: Rương Phụ, Kho Bang, Rương 5...):", defaultName);
  if (name && name.trim()) {
    const newId = "chest-" + Date.now();
    appState.chests.push({
      id: newId,
      title: name.trim(),
      createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
      slots: []
    });
    savePersistedState();
    document.getElementById("targetChestSelect").value = newId;
    showToast(`Đã tạo [${name.trim()}]`, "success");
  }
}

window.openEditSlotModal = function(chestId, slotIndex) {
  const chest = appState.chests.find(c => c.id === chestId);
  if (!chest || !chest.slots[slotIndex]) return;

  appState.editingSlot = { chestId, slotIndex };
  const slot = chest.slots[slotIndex];

  document.getElementById("editItemName").value = slot.name;
  document.getElementById("editItemQty").value = slot.qty;
  document.getElementById("editItemModal").classList.remove("hidden");
};

window.addSlotToChest = function(chestId) {
  const chest = appState.chests.find(c => c.id === chestId);
  if (!chest) return;
  chest.slots.push({ name: "Võ sĩ yêu đái", qty: 999 });
  showToast(`Đã thêm 1 ô mới vào ${chest.title}`, "success");
  savePersistedState();
};

window.removeChest = function(chestId) {
  if (confirm("Bạn có chắc chắn muốn xóa rương này?")) {
    appState.chests = appState.chests.filter(c => c.id !== chestId);
    showToast("Đã gỡ rương khỏi danh sách", "info");
    savePersistedState();
  }
};

window.copySingleItemSummary = function(name, qty) {
  copyTextToClipboard(`${name}\t${qty}`, `Đã sao chép: ${name} (${qty})`);
};

function copyTextToClipboard(text, successMsg) {
  const tempTextArea = document.createElement("textarea");
  tempTextArea.value = text;
  document.body.appendChild(tempTextArea);
  tempTextArea.select();
  try {
    document.execCommand('copy');
    showToast(successMsg, "success");
  } catch (err) {
    showToast("Không thể sao chép vào bộ nhớ đệm", "error");
  }
  document.body.removeChild(tempTextArea);
}

// Gắn sự kiện sau khi tài liệu HTML sẵn sàng
window.addEventListener("DOMContentLoaded", () => {
  loadPersistedState();
  updateApiKeyUI();

  // Khởi tạo Datalist gợi ý item
  const datalist = document.getElementById("knownItemsList");
  KNOWN_ITEMS.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item;
    datalist.appendChild(opt);
  });

  // Paste Listener (Ctrl+V)
  window.addEventListener("paste", (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    const imageFiles = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      handleIncomingImages(imageFiles);
    }
  });

  // Kéo & Thả ảnh
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");

  dropZone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => {
    handleIncomingImages(Array.from(e.target.files));
    fileInput.value = "";
  });

  ["dragenter", "dragover"].forEach(event => {
    dropZone.addEventListener(event, (e) => {
      e.preventDefault();
      dropZone.classList.add("drop-active");
    });
  });

  ["dragleave", "drop"].forEach(event => {
    dropZone.addEventListener(event, (e) => {
      e.preventDefault();
      dropZone.classList.remove("drop-active");
    });
  });

  dropZone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    handleIncomingImages(Array.from(dt.files));
  });

  // Nút Sao Chép & Xuất CSV
  document.getElementById("btnCopyTable").addEventListener("click", () => {
    const summary = calculateInventorySummary();
    if (summary.length === 0) return showToast("Không có dữ liệu để sao chép", "error");
    let content = "Tên Vật Phẩm\tSố Ô (Stacks)\tTổng Số Lượng\n";
    summary.forEach(item => content += `${item.name}\t${item.stackCount}\t${item.totalQty}\n`);
    copyTextToClipboard(content, "Đã sao chép bảng! Dán thẳng vào Excel hoặc Google Sheets.");
  });

  document.getElementById("btnExportCSV").addEventListener("click", () => {
    const summary = calculateInventorySummary();
    if (summary.length === 0) return showToast("Không có dữ liệu để xuất", "error");
    let csv = "\uFEFFTên Vật Phẩm,Số Ô Chiếm,Tổng Số Lượng\n";
    summary.forEach(item => csv += `"${item.name.replace(/"/g, '""')}",${item.stackCount},${item.totalQty}\n`);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kiem_kho_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Đã tải xuống file CSV!", "success");
  });

  // Chuyển Tab
  const tabSummaryBtn = document.getElementById("tabSummaryBtn");
  const tabChestsBtn = document.getElementById("tabChestsBtn");
  const tabDiffBtn = document.getElementById("tabDiffBtn");
  const tabSummaryView = document.getElementById("tabSummaryView");
  const tabChestsView = document.getElementById("tabChestsView");
  const tabDiffView = document.getElementById("tabDiffView");

  function setTab(tab) {
    const tabs = [
      { btn: tabSummaryBtn, view: tabSummaryView, id: "summary" },
      { btn: tabChestsBtn, view: tabChestsView, id: "chests" },
      { btn: tabDiffBtn, view: tabDiffView, id: "diff" }
    ];

    tabs.forEach(t => {
      if (t.id === tab) {
        t.btn.className = "px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-2 bg-emerald-600 text-white shadow whitespace-nowrap";
        t.view.classList.remove("hidden");
      } else {
        t.btn.className = "px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-2 text-slate-400 hover:text-white whitespace-nowrap";
        t.view.classList.add("hidden");
      }
    });
    appState.currentTab = tab;
    lucide.createIcons();
  }

  tabSummaryBtn.addEventListener("click", () => setTab("summary"));
  tabChestsBtn.addEventListener("click", () => setTab("chests"));
  tabDiffBtn.addEventListener("click", () => setTab("diff"));

  // Sắp xếp
  document.getElementById("sortByName").addEventListener("click", () => {
    appState.sortDesc = appState.sortBy === "name" ? !appState.sortDesc : false;
    appState.sortBy = "name";
    renderAll();
  });

  document.getElementById("sortByQty").addEventListener("click", () => {
    appState.sortDesc = appState.sortBy === "qty" ? !appState.sortDesc : true;
    appState.sortBy = "qty";
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

  // Tạo rương
  document.getElementById("btnQuickAddChest").addEventListener("click", () => createNewChest());
  document.getElementById("btnAddNewChestFromModal").addEventListener("click", () => createNewChest());

  // Snapshot
  document.getElementById("btnCreateSnapshot").addEventListener("click", () => {
    const snap = {};
    appState.chests.forEach(c => c.slots.forEach(s => {
      if (s.name) snap[s.name] = (snap[s.name] || 0) + (parseInt(s.qty) || 0);
    }));
    appState.snapshot = snap;
    savePersistedState();
    showToast("Đã lưu mốc snapshot kho thành công!", "success");
  });

  document.getElementById("btnClearSnapshot").addEventListener("click", () => {
    if (confirm("Bạn có muốn xóa mốc so sánh hiện tại?")) {
      appState.snapshot = null;
      savePersistedState();
      showToast("Đã xóa mốc so sánh", "info");
    }
  });

  // Mock demo & Reset all
  document.getElementById("btnLoadMock").addEventListener("click", () => {
    appState.chests = JSON.parse(JSON.stringify(MOCK_CHESTS_DATA));
    savePersistedState();
    showToast("Đã nạp đầy đủ 4 Rương Mẫu thực tế!", "success");
  });

  document.getElementById("btnResetAll").addEventListener("click", () => {
    if (confirm("Thao tác này sẽ xóa sạch toàn bộ rương và dữ liệu trong máy. Tiếp tục?")) {
      localStorage.removeItem(STORAGE_KEY);
      appState.chests = [];
      appState.ignoredItems = [];
      appState.snapshot = null;
      savePersistedState();
      showToast("Đã xóa sạch toàn bộ dữ liệu", "info");
    }
  });

  // Quản lý Modal Cài Đặt API
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
    showToast(key ? "Đã lưu khóa API thành công!" : "Đã chuyển về chế độ Demo", "success");
  });
  document.getElementById("btnClearApiKey").addEventListener("click", () => {
    inputApiKey.value = "";
    appState.apiKey = "";
    localStorage.removeItem("gemini_api_key");
    configModal.classList.add("hidden");
    updateApiKeyUI();
    showToast("Đã xóa khóa API", "info");
  });
  document.getElementById("toggleApiKeyVis").addEventListener("click", () => {
    inputApiKey.type = inputApiKey.type === "password" ? "text" : "password";
  });

  // Quản lý Modal Quản Lý Rương
  const chestManagerModal = document.getElementById("chestManagerModal");
  document.getElementById("btnOpenChestManager").addEventListener("click", () => {
    chestManagerModal.classList.remove("hidden");
    renderChestManagerModal();
    lucide.createIcons();
  });
  document.getElementById("btnCloseChestManager").addEventListener("click", () => chestManagerModal.classList.add("hidden"));

  // Quản lý Modal Sửa Ô Vật Phẩm
  const editItemModal = document.getElementById("editItemModal");
  document.getElementById("btnCloseEditModal").addEventListener("click", () => editItemModal.classList.add("hidden"));
  document.getElementById("btnSaveSlot").addEventListener("click", () => {
    if (!appState.editingSlot) return;
    const { chestId, slotIndex } = appState.editingSlot;
    const chest = appState.chests.find(c => c.id === chestId);
    if (!chest) return;

    const newName = document.getElementById("editItemName").value.trim() || "Vật phẩm lạ";
    const newQty = parseInt(document.getElementById("editItemQty").value) || 1;

    chest.slots[slotIndex] = { name: newName, qty: newQty };
    editItemModal.classList.add("hidden");
    showToast(`Đã cập nhật ô thành ${newName} x${newQty}`, "success");
    savePersistedState();
  });

  document.getElementById("btnDeleteSlot").addEventListener("click", () => {
    if (!appState.editingSlot) return;
    const { chestId, slotIndex } = appState.editingSlot;
    const chest = appState.chests.find(c => c.id === chestId);
    if (!chest) return;

    chest.slots.splice(slotIndex, 1);
    editItemModal.classList.add("hidden");
    showToast("Đã xóa ô vật phẩm", "info");
    savePersistedState();
  });

  renderAll();
  lucide.createIcons();
});

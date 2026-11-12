let selectedChestNum = "Rương 1";

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

window.addEventListener("DOMContentLoaded", () => {
  loadState();
  updateApiKeyUI();

  // 1. Phím Ctrl + V dán ảnh toàn trang
  window.addEventListener("paste", (e) => {
    const items = (e.clipboardData || window.clipboardData)?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleIncomingFile(file);
          break;
        }
      }
    }
  });

  // 2. Chọn tệp & Vùng Kéo thả
  const fileInput = document.getElementById("fileInput");
  const btnBrowse = document.getElementById("btnBrowseFile");
  const dropZone = document.getElementById("dropZone");

  if (btnBrowse && fileInput) {
    btnBrowse.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      fileInput.click();
    };
  }

  if (fileInput) {
    fileInput.onchange = function(e) {
      if (e.target.files && e.target.files[0]) {
        handleIncomingFile(e.target.files[0]);
      }
      fileInput.value = "";
    };
  }

  if (dropZone) {
    dropZone.addEventListener("click", () => dropZone.focus());
    dropZone.ondragover = function(e) {
      e.preventDefault();
      dropZone.classList.add("drop-active");
    };
    dropZone.ondragleave = function() {
      dropZone.classList.remove("drop-active");
    };
    dropZone.ondrop = function(e) {
      e.preventDefault();
      dropZone.classList.remove("drop-active");
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleIncomingFile(e.dataTransfer.files[0]);
      }
    };
  }

  // 3. ĐIỀU KHIỂN MODAL CĂN CHỈNH 4 CẠNH KHUNG LƯỚI 35 Ô (5x7)
  ["Top", "Bottom", "Left", "Right"].forEach(side => {
    const range = document.getElementById(`rangeCrop${side}`);
    if (range) {
      range.addEventListener("input", (e) => {
        if (typeof currentCropRatios !== "undefined") {
          currentCropRatios[side.toLowerCase()] = parseFloat(e.target.value);
        }
        if (typeof updateRangeLabels === "function") updateRangeLabels();
        if (typeof drawCalibrateGrid === "function") drawCalibrateGrid();
      });
    }
  });

  const btnResetCalib = document.getElementById("btnResetCalibrate");
  if (btnResetCalib) {
    btnResetCalib.onclick = () => {
      if (typeof currentCropRatios !== "undefined") {
        currentCropRatios = { top: 0, bottom: 0, left: 0, right: 0 };
      }
      ["Top", "Bottom", "Left", "Right"].forEach(s => {
        const el = document.getElementById(`rangeCrop${s}`);
        if (el) el.value = 0;
      });
      if (typeof updateRangeLabels === "function") updateRangeLabels();
      if (typeof drawCalibrateGrid === "function") drawCalibrateGrid();
    };
  }

  const btnCancelCalib = document.getElementById("btnCancelCalibrate");
  if (btnCancelCalib) {
    btnCancelCalib.onclick = () => {
      const modal = document.getElementById("cropCalibrateModal");
      if (modal) modal.classList.add("hidden");
      if (typeof pendingRawImg !== "undefined") pendingRawImg = null;
    };
  }

  // Bấm Xác Nhận Khung -> Tự học khung & Cắt 35 ô chuyển sang bước nạp
  const btnConfirmCalib = document.getElementById("btnConfirmCalibrate");
  if (btnConfirmCalib) {
    btnConfirmCalib.onclick = () => {
      const modal = document.getElementById("cropCalibrateModal");
      if (modal) modal.classList.add("hidden");

      if (typeof currentCropRatios !== "undefined" && typeof pendingRawImg !== "undefined" && pendingRawImg) {
        appState.learnedGridCrop = Object.assign({}, currentCropRatios);
        saveBrainState();

        pendingCrops = sliceGridWithRatios(pendingRawImg, currentCropRatios);

        const cvs = document.createElement("canvas");
        const ctx = cvs.getContext("2d");
        const startX = (currentCropRatios.left / 100) * pendingRawImg.naturalWidth;
        const startY = (currentCropRatios.top / 100) * pendingRawImg.naturalHeight;
        const cropW = pendingRawImg.naturalWidth - startX - ((currentCropRatios.right / 100) * pendingRawImg.naturalWidth);
        const cropH = pendingRawImg.naturalHeight - startY - ((currentCropRatios.bottom / 100) * pendingRawImg.naturalHeight);

        cvs.width = Math.max(1, cropW);
        cvs.height = Math.max(1, cropH);
        ctx.drawImage(pendingRawImg, startX, startY, cropW, cropH, 0, 0, cvs.width, cvs.height);

        const croppedDataUrl = cvs.toDataURL("image/png");
        pendingImage = {
          base64: croppedDataUrl.split(",")[1],
          dataUrl: croppedDataUrl
        };

        const previewImg = document.getElementById("uploadPreviewImg");
        if (previewImg) previewImg.src = croppedDataUrl;

        openUploadModal();
        showToast("Đã ghi nhớ tỷ lệ căn viền vào Bộ Não AI!", "success");
      }
    };
  }

  // 4. Chọn Rương 1 2 3 trên Popup nạp ảnh
  document.querySelectorAll(".btn-chest-num").forEach(btn => {
    btn.onclick = function() {
      document.querySelectorAll(".btn-chest-num").forEach(b => {
        b.classList.remove("border-emerald-500", "text-emerald-400", "bg-emerald-950/40");
        b.classList.add("bg-slate-800", "text-slate-300");
      });
      btn.classList.add("border-emerald-500", "text-emerald-400", "bg-emerald-950/40");
      btn.classList.remove("bg-slate-800", "text-slate-300");
      selectedChestNum = btn.dataset.num;
      const customInput = document.getElementById("customChestInput");
      if (customInput) customInput.classList.add("hidden");
    };
  });

  const btnCustomChest = document.getElementById("btnCustomChestNum");
  if (btnCustomChest) {
    btnCustomChest.onclick = function() {
      const input = document.getElementById("customChestInput");
      if (input) {
        input.classList.remove("hidden");
        input.focus();
      }
    };
  }

  // 5. Bấm "Cập Nhật Rương" trên Popup
  const btnConfirm = document.getElementById("btnConfirmUpload");
  if (btnConfirm) {
    btnConfirm.onclick = function() {
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
    };
  }

  const closeUploadPopup = () => {
    const modal = document.getElementById("confirmUploadModal");
    if (modal) modal.classList.add("hidden");
    pendingImage = null;
    pendingCrops = [];
  };
  const btnCancel = document.getElementById("btnCancelUpload");
  const btnDismiss = document.getElementById("btnDismissUpload");
  if (btnCancel) btnCancel.onclick = closeUploadPopup;
  if (btnDismiss) btnDismiss.onclick = closeUploadPopup;

  // 6. Gợi ý thông minh khi gõ tên vật phẩm (Custom Autocomplete)
  const nameInput = document.getElementById("sidePanelItemName");
  const dropdown = document.getElementById("customAutocompleteList");
  if (nameInput && dropdown) {
    nameInput.addEventListener("input", (e) => {
      if (typeof renderDropdownSuggestions === "function") {
        renderDropdownSuggestions(e.target.value);
      }
    });

    nameInput.addEventListener("focus", (e) => {
      if (typeof renderDropdownSuggestions === "function") {
        renderDropdownSuggestions(e.target.value);
      }
    });

    document.addEventListener("click", (e) => {
      if (!nameInput.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add("hidden");
      }
    });
  }

  // 7. LƯU & NẠP NỐI TIẾP VÔ HẠN MẪU HÌNH ẢNH VÀO BỘ NÃO AI
  const btnSaveSide = document.getElementById("btnSaveSidePanel");
  if (btnSaveSide) {
    btnSaveSide.onclick = async function() {
      const chest = appState.chests.find(c => c.account === appState.viewingAcc && c.title === appState.viewingChest);
      if (!chest) return alert("Chưa có dữ liệu rương để lưu!");

      const idx = appState.selectedSlotIndex;
      const nameInp = document.getElementById("sidePanelItemName");
      const qtyInput = document.getElementById("sidePanelItemQty");

      const newName = nameInp ? nameInp.value.trim() : null;
      const newQty = qtyInput ? (parseInt(qtyInput.value) || 0) : 0;

      if (!chest.slots) chest.slots = Array(35).fill(null);
      const targetSlot = chest.slots[idx] || {};

      chest.slots[idx] = {
        name: newName,
        qty: newName ? newQty : 0,
        cropImg: targetSlot.cropImg || null,
        aiOriginalQty: targetSlot.aiOriginalQty || newQty
      };

      if (newName && targetSlot.cropImg) {
        const hash = await computeImageHash(targetSlot.cropImg);
        
        if (!appState.learnedIcons) appState.learnedIcons = {};
        if (!Array.isArray(appState.learnedIcons[newName])) {
          const oldVal = appState.learnedIcons[newName];
          appState.learnedIcons[newName] = oldVal ? [oldVal] : [];
        }

        // Xóa mẫu cũ nếu bị trùng hệt (dist <= 2) và đẩy mẫu vừa cập nhật xuống CUỐI MẢNG để làm icon đại diện mới nhất
        appState.learnedIcons[newName] = appState.learnedIcons[newName].filter(
          sample => !(sample && sample.hash && getHammingDistance(hash, sample.hash) <= 2)
        );
        appState.learnedIcons[newName].push({
          img: targetSlot.cropImg,
          hash: hash,
          addedAt: Date.now()
        });
        
        if (!appState.customKnownItems) appState.customKnownItems = [];
        if (!appState.customKnownItems.includes(newName)) {
          appState.customKnownItems.push(newName);
        }
        if (typeof KNOWN_ITEMS !== "undefined" && !KNOWN_ITEMS.includes(newName)) {
          KNOWN_ITEMS.push(newName);
        }

        // Quét đồng bộ tất cả 35 ô khớp với BẤT KỲ mẫu nào trong danh sách của tên này
        const allSamplesForName = appState.learnedIcons[newName];
        let count = 1;
        for (let i = 0; i < 35; i++) {
          if (i === idx) continue;
          const other = chest.slots[i];
          if (other && other.cropImg) {
            const otherHash = await computeImageHash(other.cropImg);
            const matched = allSamplesForName.some(
              sample => sample && sample.hash && getHammingDistance(otherHash, sample.hash) <= 7
            );
            if (matched) {
              other.name = newName;
              count++;
            }
          }
        }

        saveBrainState();
        saveChestsState();
        const totalSamples = appState.learnedIcons[newName].length;
        showToast(`Đã train [${newName}] (${totalSamples} mẫu) & cập nhật icon đại diện mới nhất!`, "success");
      } else {
        saveChestsState();
        showToast(`Đã cập nhật ô ${idx + 1}!`, "success");
      }
    };
  }

  // 8. Dạy AI Số Đúng
  const btnTrain = document.getElementById("btnTrainAiWrongNumber");
  if (btnTrain) {
    btnTrain.onclick = function() {
      const chest = appState.chests.find(c => c.account === appState.viewingAcc && c.title === appState.viewingChest);
      if (!chest) return;
      const idx = appState.selectedSlotIndex;
      const slot = chest.slots ? chest.slots[idx] : null;
      if (!slot) return;

      const wrongQty = slot.qty;
      const correctInput = prompt(`AI nhận diện ô này là [${wrongQty}]. Nhập số CHÍNH XÁC trong game để dạy AI:`, wrongQty);

      if (correctInput !== null && correctInput.trim() !== "") {
        const correctVal = parseInt(correctInput.trim()) || 0;
        slot.qty = correctVal;

        if (!appState.trainedNumberErrors) appState.trainedNumberErrors = [];
        appState.trainedNumberErrors.push({
          wrongQty: wrongQty,
          correctQty: correctVal,
          itemName: slot.name || "Không rõ"
        });

        saveBrainState();
        saveChestsState();
        showToast(`Đã nạp quy tắc số [${wrongQty} -> ${correctVal}] vào bộ nhớ AI!`, "success");
      }
    };
  }

  // 9. Làm rỗng ô
  const btnEmptySide = document.getElementById("btnSidePanelEmptySlot");
  if (btnEmptySide) {
    btnEmptySide.onclick = function() {
      const chest = appState.chests.find(c => c.account === appState.viewingAcc && c.title === appState.viewingChest);
      if (!chest) return;
      const idx = appState.selectedSlotIndex;
      if (chest.slots && chest.slots[idx]) {
        chest.slots[idx] = { name: null, qty: 0, cropImg: null };
      }
      saveChestsState();
      showToast(`Đã làm rỗng ô ${idx + 1}`, "info");
    };
  }

  // 10. Chuyển Acc & Rương đang xem
  const selectAcc = document.getElementById("selectViewingAcc");
  if (selectAcc) {
    selectAcc.onchange = function(e) {
      appState.viewingAcc = e.target.value;
      appState.selectedSlotIndex = 0;
      renderAll();
    };
  }

  document.querySelectorAll(".btn-view-chest").forEach(btn => {
    btn.onclick = function() {
      document.querySelectorAll(".btn-view-chest").forEach(b => {
        b.className = "btn-view-chest px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 font-semibold";
      });
      btn.className = "btn-view-chest px-2.5 py-1 rounded-lg border border-emerald-500 bg-emerald-950/40 text-emerald-400 font-bold";
      appState.viewingChest = btn.dataset.title;
      appState.selectedSlotIndex = 0;
      renderAll();
    };
  });

  // 11. Chuyển Tab (Rương Game / Tổng Kho / Biến Động)
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

  // 12. Bộ lọc Acc, Tìm kiếm, Lọc Trang Bị / Đồ Bỏ Qua & Sắp Xếp Cột
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

  // Nút bật/tắt Ẩn Trang Bị ở Tổng Hợp Toàn Kho
  const btnToggleEquip = document.getElementById("btnToggleHideEquip");
  if (btnToggleEquip) {
    btnToggleEquip.onclick = () => {
      appState.hideEquipment = !appState.hideEquipment;
      saveBrainState();
      renderAll();
    };
  }

  // Nút bật/tắt Hiện Đồ Đã Bỏ Qua ở Tổng Hợp Toàn Kho
  const btnToggleIgnored = document.getElementById("btnToggleShowIgnored");
  if (btnToggleIgnored) {
    btnToggleIgnored.onclick = () => {
      appState.showIgnored = !appState.showIgnored;
      renderAll();
    };
  }

  // Sắp xếp bảng Tổng Hợp Toàn Kho khi click tiêu đề cột
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

  // 13. Snapshot
  const btnSnap = document.getElementById("btnCreateSnapshot");
  if (btnSnap) {
    btnSnap.onclick = () => {
      const snap = {};
      appState.chests.forEach(c => (c.slots || []).forEach(s => {
        if (s && s.name) snap[s.name] = (snap[s.name] || 0) + (parseInt(s.qty) || 0);
      }));
      appState.snapshot = snap;
      saveChestsState();
      showToast("Đã lưu mốc snapshot đối chiếu thành công!", "success");
    };
  }

  const btnClearSnap = document.getElementById("btnClearSnapshot");
  if (btnClearSnap) {
    btnClearSnap.onclick = () => {
      if (confirm("Xoá mốc so sánh hiện tại?")) {
        appState.snapshot = null;
        saveChestsState();
        showToast("Đã xoá mốc so sánh", "info");
      }
    };
  }

  // 14. Copy Bảng
  const btnCopy = document.getElementById("btnCopyTable");
  if (btnCopy) {
    btnCopy.onclick = () => {
      const summary = calculateSummary();
      let content = "Tên Vật Phẩm\tSố Ô\tTổng Số Lượng\n";
      summary.forEach(i => content += `${i.name}\t${i.stacks}\t${i.totalQty}\n`);
      navigator.clipboard.writeText(content).then(() => {
        showToast("Đã sao chép bảng ra bộ nhớ tạm!", "success");
      });
    };
  }

  // 15. NÚT RESET: CHỈ XÓA RƯƠNG HÀNG NGÀY, GIỮ BỘ NÃO AI HỌC MÁY
  const btnReset = document.getElementById("btnResetAll");
  if (btnReset) {
    btnReset.onclick = function() {
      if (confirm("Chỉ xóa dữ liệu ảnh các rương hiện có? (Toàn bộ mẫu ảnh đã train, cấu hình cài đặt, tỷ lệ căn viền và quy tắc số vẫn được GIỮ NGUYÊN TUYỆT ĐỐI). Tiếp tục?")) {
        localStorage.removeItem(STORAGE_CHESTS_KEY);
        appState.chests = [];
        appState.accounts = [];
        saveChestsState();
        location.reload();
      }
    };
  }

  // 16. XUẤT BỘ NÃO AI RA FILE JSON VỀ MÁY TÍNH
  const btnExportBrain = document.getElementById("btnExportBrain");
  if (btnExportBrain) {
    btnExportBrain.onclick = () => {
      const brainData = {
        learnedGridCrop: appState.learnedGridCrop,
        learnedIcons: appState.learnedIcons,
        trainedNumberErrors: appState.trainedNumberErrors,
        customKnownItems: appState.customKnownItems,
        noAdkAccounts: appState.noAdkAccounts,
        equipmentItems: appState.equipmentItems,
        hideEquipment: appState.hideEquipment,
        exportedAt: new Date().toLocaleString('vi-VN')
      };
      let totalSamples = 0;
      Object.values(appState.learnedIcons || {}).forEach(arr => {
        totalSamples += Array.isArray(arr) ? arr.length : 1;
      });
      const blob = new Blob([JSON.stringify(brainData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bo_nao_kiem_kho_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Đã xuất file não bộ (${totalSamples} mẫu ảnh & cấu hình cài đặt)!`, "success");
    };
  }

  // 17. NẠP BỘ NÃO AI TỪ FILE JSON VÀO TRÌNH DUYỆT
  const inputImportBrain = document.getElementById("inputImportBrain");
  if (inputImportBrain) {
    inputImportBrain.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (imported.learnedIcons) {
            appState.learnedGridCrop = imported.learnedGridCrop || appState.learnedGridCrop;
            
            for (const [name, val] of Object.entries(imported.learnedIcons)) {
              const incomingSamples = Array.isArray(val) ? val : (val ? [val] : []);
              if (!Array.isArray(appState.learnedIcons[name])) {
                const cur = appState.learnedIcons[name];
                appState.learnedIcons[name] = cur ? [cur] : [];
              }
              appState.learnedIcons[name] = appState.learnedIcons[name].concat(incomingSamples);
            }

            appState.trainedNumberErrors = (appState.trainedNumberErrors || []).concat(imported.trainedNumberErrors || []);
            appState.customKnownItems = Array.from(new Set([...(appState.customKnownItems || []), ...(imported.customKnownItems || [])]));
            appState.noAdkAccounts = Array.from(new Set([...(appState.noAdkAccounts || []), ...(imported.noAdkAccounts || [])]));
            appState.equipmentItems = Array.from(new Set([...(appState.equipmentItems || []), ...(imported.equipmentItems || [])]));
            if (typeof imported.hideEquipment === "boolean") appState.hideEquipment = imported.hideEquipment;
            
            saveBrainState();
            renderAll();
            showToast("Nạp & hợp nhất dữ liệu não bộ thành công!", "success");
          } else {
            alert("File không đúng định dạng não bộ của tool!");
          }
        } catch (err) {
          alert("Lỗi đọc file JSON: " + err.message);
        }
      };
      reader.readAsText(file);
      inputImportBrain.value = "";
    };
  }

  // 18. Modal API Key & Modal Cài Đặt Nâng Cao
  const configModal = document.getElementById("configModal");
  const inputApiKey = document.getElementById("inputApiKey");
  const btnOpenCfg = document.getElementById("btnOpenConfig");
  const btnCloseCfg = document.getElementById("btnCloseConfig");
  const btnSaveKey = document.getElementById("btnSaveApiKey");
  const btnClearKey = document.getElementById("btnClearApiKey");

  if (btnOpenCfg && configModal && inputApiKey) {
    btnOpenCfg.onclick = () => {
      inputApiKey.value = appState.apiKey;
      configModal.classList.remove("hidden");
    };
  }
  if (btnCloseCfg && configModal) {
    btnCloseCfg.onclick = () => configModal.classList.add("hidden");
  }
  if (btnSaveKey && inputApiKey && configModal) {
    btnSaveKey.onclick = () => {
      const key = inputApiKey.value.trim();
      appState.apiKey = key;
      localStorage.setItem("gemini_api_key", key);
      configModal.classList.add("hidden");
      updateApiKeyUI();
      showToast(key ? "Đã lưu API Key!" : "Đã chuyển về Demo", "success");
    };
  }
  if (btnClearKey && inputApiKey && configModal) {
    btnClearKey.onclick = () => {
      inputApiKey.value = "";
      appState.apiKey = "";
      localStorage.removeItem("gemini_api_key");
      configModal.classList.add("hidden");
      updateApiKeyUI();
      showToast("Đã xoá API Key", "info");
    };
  }

  // Khởi tạo module cài đặt riêng (js/settings.js)
  if (typeof initSettingsModal === "function") {
    initSettingsModal();
  }

  renderAll();
  if (window.lucide) lucide.createIcons();
});

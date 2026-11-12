/* MODULE: SNAPSHOT, COPY EXCEL, XUẤT/NHẬP NÃO AI & API KEY (js/sao-luu-va-moc-so-sanh.js) */

function initBackupAndUtilityEvents() {
  // 1. Lưu & Xóa mốc đối chiếu biến động (Snapshot)
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

  // 2. Copy Bảng ra Clipboard
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

  // 3. Reset rương hàng ngày (Giữ nguyên Bộ Não AI)
  const btnReset = document.getElementById("btnResetAll");
  if (btnReset) {
    btnReset.onclick = () => {
      if (confirm("Chỉ xóa dữ liệu ảnh các rương hiện có? (Toàn bộ mẫu ảnh đã train, cấu hình cài đặt, tỷ lệ căn viền và quy tắc số vẫn được GIỮ NGUYÊN TUYỆT ĐỐI). Tiếp tục?")) {
        localStorage.removeItem(STORAGE_CHESTS_KEY);
        appState.chests = [];
        appState.accounts = [];
        saveChestsState();
        location.reload();
      }
    };
  }

  // 4. Xuất file JSON Bộ Não AI
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

  // 5. Nạp & Hợp nhất Bộ Não AI từ file JSON
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

  // 6. Modal cấu hình Gemini API Key
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
  if (btnCloseCfg && configModal) btnCloseCfg.onclick = () => configModal.classList.add("hidden");
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
}

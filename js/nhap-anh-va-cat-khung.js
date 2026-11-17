/* MODULE: NHẬN ẢNH, CĂN VIỀN 4 CẠNH & POPUP NẠP RƯƠNG (js/nhap-anh-va-cat-khung.js) */

let selectedChestNum = "Rương 1";

window.renderUploadChestChoiceButtons = function(targetAcc) {
  const grid = document.getElementById("uploadChestButtonsGrid");
  if (!grid) return;

  const cleanAcc = (targetAcc || "").trim().toLowerCase();
  const baseTitles = ["Rương 1", "Rương 2", "Rương 3"];
  const allTitles = [...baseTitles];

  (appState.chests || []).forEach(c => {
    const cAcc = (c.account || "").trim().toLowerCase();
    const cTitle = (c.title || "").trim();
    if (!cTitle) return;
    if ((!cleanAcc || cAcc === cleanAcc) && !allTitles.some(t => t.toLowerCase() === cTitle.toLowerCase())) {
      allTitles.push(cTitle);
    }
  });

  if (appState.viewingChest && !allTitles.some(t => t.toLowerCase() === appState.viewingChest.trim().toLowerCase())) {
    allTitles.push(appState.viewingChest.trim());
  }

  if (cleanAcc && appState.viewingAcc && appState.viewingAcc.trim().toLowerCase() === cleanAcc && appState.viewingChest) {
    selectedChestNum = appState.viewingChest.trim();
  } else if (!allTitles.some(t => t.toLowerCase() === (selectedChestNum || "").toLowerCase())) {
    selectedChestNum = allTitles[0];
  }

  const btnsHtml = allTitles.map(title => {
    const isActive = (selectedChestNum || "").toLowerCase() === title.toLowerCase();
    const cls = isActive
      ? "btn-chest-num py-2 px-2 rounded-xl border border-emerald-500 bg-emerald-950/40 text-emerald-400 font-bold truncate"
      : "btn-chest-num py-2 px-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 font-bold truncate";
    return `<button type="button" class="${cls}" data-num="${title}">${title}</button>`;
  }).join("");

  grid.innerHTML = `${btnsHtml}<button type="button" id="btnCustomChestNum" class="py-2 px-2 rounded-xl border border-dashed border-slate-600 bg-slate-950 text-slate-400 font-semibold">+ Khác</button>`;

  grid.querySelectorAll(".btn-chest-num").forEach(btn => {
    btn.onclick = () => {
      grid.querySelectorAll(".btn-chest-num").forEach(b => {
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
    btnCustomChest.onclick = () => {
      const input = document.getElementById("customChestInput");
      if (input) { input.classList.remove("hidden"); input.focus(); }
    };
  }
};

function initUploadAndCalibrateEvents() {
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
    btnBrowse.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      fileInput.click();
    };
  }

  if (fileInput) {
    fileInput.onchange = (e) => {
      if (e.target.files && e.target.files[0]) handleIncomingFile(e.target.files[0]);
      fileInput.value = "";
    };
  }

  if (dropZone) {
    dropZone.addEventListener("click", () => dropZone.focus());
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add("drop-active"); };
    dropZone.ondragleave = () => dropZone.classList.remove("drop-active");
    dropZone.ondrop = (e) => {
      e.preventDefault();
      dropZone.classList.remove("drop-active");
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleIncomingFile(e.dataTransfer.files[0]);
      }
    };
  }

  // 3. Thanh trượt căn chỉnh 4 cạnh khung lưới 35 ô
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

  // Xác nhận khung -> Cắt 35 ô riêng biệt & mở Popup chọn Acc/Rương
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
        const accInp = document.getElementById("inputAccountName");
        window.renderUploadChestChoiceButtons(accInp ? accInp.value : appState.viewingAcc);
        if (accInp) {
          accInp.oninput = () => window.renderUploadChestChoiceButtons(accInp.value);
        }
        showToast("Đã ghi nhớ tỷ lệ căn viền vào Bộ Não AI!", "success");
      }
    };
  }

  // 4. Chọn Rương & Xác nhận nạp ảnh
  window.renderUploadChestChoiceButtons(appState.viewingAcc);

  const btnConfirm = document.getElementById("btnConfirmUpload");
  if (btnConfirm) {
    btnConfirm.onclick = () => {
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
}

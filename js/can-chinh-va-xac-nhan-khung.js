/* MODULE 4: CĂN CHỈNH 4 CẠNH KHUNG LƯỚI & XÁC NHẬN NẠP RƯƠNG (js/can-chinh-va-xac-nhan-khung.js) */

function bindCalibrateAndUploadEvents() {
  // 1. Thanh trượt căn chỉnh 4 cạnh khung lưới 35 ô
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

  // Nút AI Tự Căn Khung
  if (!window._aiAutoCalibClickBound) {
    window._aiAutoCalibClickBound = true;
    document.addEventListener("click", (e) => {
      const btnAi = e.target.closest("#btnAiAutoCalibrate");
      if (btnAi && typeof window.runAiAutoCalibrateGrid === "function") {
        window.runAiAutoCalibrateGrid();
      }
    });
  }

  const btnCancelCalib = document.getElementById("btnCancelCalibrate");
  if (btnCancelCalib) {
    btnCancelCalib.onclick = () => {
      const modal = document.getElementById("cropCalibrateModal");
      if (modal) modal.classList.add("hidden");
      if (typeof pendingRawImg !== "undefined") pendingRawImg = null;
    };
  }

  // 2. Xác nhận khung -> Cắt 35 ô riêng biệt & mở Popup chọn Acc/Rương
  const btnConfirmCalib = document.getElementById("btnConfirmCalibrate");
  if (btnConfirmCalib) {
    btnConfirmCalib.onclick = () => {
      const modal = document.getElementById("cropCalibrateModal");
      if (modal) modal.classList.add("hidden");

      if (typeof currentCropRatios !== "undefined" && typeof pendingRawImg !== "undefined" && pendingRawImg) {
        appState.learnedGridCrop = Object.assign({}, currentCropRatios);
        saveBrainState();

        if (typeof window.trainAiGridCorrection === "function") {
          window.trainAiGridCorrection(pendingRawImg, currentCropRatios);
        }

        if (typeof window.buildVerifiedGridPayload === "function") {
          const verifiedPayload = window.buildVerifiedGridPayload(pendingRawImg, currentCropRatios);
          pendingCrops = verifiedPayload.crops35;
          pendingImage = {
            base64: verifiedPayload.annotatedBase64,
            dataUrl: verifiedPayload.cleanDataUrl,
            isVerifiedGrid: true
          };
        } else {
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
        }

        pendingRawImg = null;

        const previewImg = document.getElementById("uploadPreviewImg");
        if (previewImg && pendingImage) previewImg.src = pendingImage.dataUrl;

        openUploadModal();
        if (typeof window.setupAccountPickerDropdown === "function") {
          window.setupAccountPickerDropdown();
        }

        const accInp = document.getElementById("inputAccountName");
        if (accInp && !accInp.value.trim()) {
          const allAccs = typeof getAllExistingAccounts === "function" ? getAllExistingAccounts() : [];
          accInp.value = appState.viewingAcc || (allAccs.length > 0 ? allAccs[0] : "");
        }
        if (typeof window.renderUploadChestChoiceButtons === "function") {
          window.renderUploadChestChoiceButtons(accInp ? accInp.value : appState.viewingAcc);
        }
      }
    };
  }

  // 3. Bấm "Cập Nhật Rương" -> Đẩy ngay vào hàng đợi đa luồng
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

      const taskSnapshot = {
        account: accName,
        title: chestTitle,
        image: pendingImage ? Object.assign({}, pendingImage) : null,
        crops: Array.isArray(pendingCrops) ? [...pendingCrops] : []
      };

      pendingImage = null;
      pendingCrops = [];

      if (typeof window.enqueueChestUploadTask === "function") {
        window.enqueueChestUploadTask(taskSnapshot);
      } else {
        pendingImage = taskSnapshot.image;
        pendingCrops = taskSnapshot.crops;
        executeUpload(accName, chestTitle);
      }
    };
  }

  const closeUploadPopup = () => {
    const modal = document.getElementById("confirmUploadModal");
    if (modal) modal.classList.add("hidden");
    const dd = document.getElementById("customAccountDropdownList");
    if (dd) dd.classList.add("hidden");
    pendingImage = null;
    pendingCrops = [];
  };
  const btnCancel = document.getElementById("btnCancelUpload");
  const btnDismiss = document.getElementById("btnDismissUpload");
  if (btnCancel) btnCancel.onclick = closeUploadPopup;
  if (btnDismiss) btnDismiss.onclick = closeUploadPopup;
}

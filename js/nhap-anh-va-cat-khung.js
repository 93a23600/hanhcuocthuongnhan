/* MODULE: NHẬN ẢNH, CĂN VIỀN 4 CẠNH & POPUP NẠP RƯƠNG (js/nhap-anh-va-cat-khung.js) */

let selectedChestNum = "Rương 1";

// Lấy toàn bộ danh sách tài khoản hiện có (gom từ cả accounts và chests)
function getAllExistingAccounts() {
  const accMap = new Map();
  (appState.accounts || []).forEach(a => {
    const clean = (a || "").trim();
    if (clean && !accMap.has(clean.toLowerCase())) {
      accMap.set(clean.toLowerCase(), clean);
    }
  });
  (appState.chests || []).forEach(c => {
    const clean = (c.account || "").trim();
    if (clean && !accMap.has(clean.toLowerCase())) {
      accMap.set(clean.toLowerCase(), clean);
    }
  });
  if (appState.viewingAcc) {
    const clean = appState.viewingAcc.trim();
    if (clean && !accMap.has(clean.toLowerCase())) {
      accMap.set(clean.toLowerCase(), clean);
    }
  }
  return Array.from(accMap.values());
}

// Khởi tạo & hiển thị Dropdown chọn Tài khoản đầy đủ
window.setupAccountPickerDropdown = function() {
  const accInput = document.getElementById("inputAccountName");
  if (!accInput) return;

  accInput.removeAttribute("list");
  accInput.setAttribute("autocomplete", "off");

  const parent = accInput.parentElement;
  if (!parent) return;
  parent.classList.add("relative");

  let dropdown = document.getElementById("customAccountDropdownList");
  if (!dropdown) {
    dropdown = document.createElement("div");
    dropdown.id = "customAccountDropdownList";
    dropdown.className = "hidden absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[70] max-h-48 overflow-y-auto py-1 divide-y divide-slate-800/80";
    parent.appendChild(dropdown);
  }

  const renderAccountOptions = () => {
    const allAccs = getAllExistingAccounts();
    const currentVal = accInput.value.trim().toLowerCase();

    if (allAccs.length === 0) {
      dropdown.innerHTML = `<div class="px-3 py-2 text-[11px] text-slate-400 italic">Chưa có tài khoản nào. Hãy nhập tên tài khoản mới ở trên.</div>`;
    } else {
      const itemsHtml = allAccs.map(acc => {
        const isSelected = acc.toLowerCase() === currentVal;
        const chestCount = (appState.chests || []).filter(c => (c.account || "").trim().toLowerCase() === acc.toLowerCase()).length;
        return `
          <button type="button" data-acc="${acc.replace(/"/g, '&quot;')}"
            class="acc-dropdown-item w-full text-left px-3 py-2 text-xs flex items-center justify-between transition ${
              isSelected
                ? "bg-emerald-950/70 text-emerald-300 font-bold"
                : "text-slate-200 hover:bg-slate-800 font-medium"
            }">
            <span class="truncate">${acc}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 shrink-0 ml-2">
              ${chestCount} rương ${isSelected ? "✓" : ""}
            </span>
          </button>
        `;
      }).join("");

      dropdown.innerHTML = `
        <div class="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-950/60">
          Danh sách tài khoản đang có (${allAccs.length})
        </div>
        ${itemsHtml}
        <button type="button" id="btnNewAccFromDropdown"
          class="w-full text-left px-3 py-2 text-xs text-sky-400 hover:bg-slate-800 font-semibold flex items-center gap-1.5">
          <span>+ Nhập tên tài khoản mới...</span>
        </button>
      `;
    }

    dropdown.querySelectorAll(".acc-dropdown-item").forEach(btn => {
      btn.onmousedown = (e) => {
        e.preventDefault();
        const chosen = btn.dataset.acc;
        accInput.value = chosen;
        dropdown.classList.add("hidden");
        window.renderUploadChestChoiceButtons(chosen);
      };
    });

    const btnNewAcc = document.getElementById("btnNewAccFromDropdown");
    if (btnNewAcc) {
      btnNewAcc.onmousedown = (e) => {
        e.preventDefault();
        accInput.value = "";
        dropdown.classList.add("hidden");
        accInput.focus();
        window.renderUploadChestChoiceButtons("");
      };
    }

    dropdown.classList.remove("hidden");
  };

  accInput.onfocus = () => renderAccountOptions();
  accInput.onclick = () => renderAccountOptions();

  accInput.oninput = () => {
    window.renderUploadChestChoiceButtons(accInput.value);
    if (!dropdown.classList.contains("hidden")) {
      renderAccountOptions();
    }
  };

  if (!window._accDropdownOutsideBound) {
    window._accDropdownOutsideBound = true;
    document.addEventListener("mousedown", (e) => {
      const inp = document.getElementById("inputAccountName");
      const dd = document.getElementById("customAccountDropdownList");
      if (!inp || !dd) return;
      if (!inp.contains(e.target) && !dd.contains(e.target)) {
        dd.classList.add("hidden");
      }
    });
  }
};

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
  // 1. Khóa dán toàn trang: chỉ nhận Ctrl + V khi bấm trực tiếp vào khung dán ảnh (#dropZone)
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
    dropZone.addEventListener("paste", (e) => {
      const items = (e.clipboardData || window.clipboardData)?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            e.stopPropagation();
            handleIncomingFile(file);
            break;
          }
        }
      }
    });
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

  // 2. Thanh trượt căn chỉnh 4 cạnh khung lưới 35 ô
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
  document.addEventListener("click", (e) => {
    const btnAi = e.target.closest("#btnAiAutoCalibrate");
    if (btnAi && typeof window.runAiAutoCalibrateGrid === "function") {
      window.runAiAutoCalibrateGrid();
    }
  });

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

        // Giải phóng ảnh thô ngay sau khi đã cắt xong 35 ô để sẵn sàng nhận ảnh tiếp theo
        pendingRawImg = null;

        const previewImg = document.getElementById("uploadPreviewImg");
        if (previewImg && pendingImage) previewImg.src = pendingImage.dataUrl;

        openUploadModal();
        window.setupAccountPickerDropdown();

        const accInp = document.getElementById("inputAccountName");
        if (accInp && !accInp.value.trim()) {
          const allAccs = getAllExistingAccounts();
          accInp.value = appState.viewingAcc || (allAccs.length > 0 ? allAccs[0] : "");
        }
        window.renderUploadChestChoiceButtons(accInp ? accInp.value : appState.viewingAcc);
      }
    };
  }

  // 3. Khởi tạo Dropdown Acc & Nút chọn Rương
  window.setupAccountPickerDropdown();
  window.renderUploadChestChoiceButtons(appState.viewingAcc);

  // 4. Bấm "Cập Nhật Rương" -> Đẩy ngay vào hàng đợi đa luồng & mở khóa nạp rương tiếp theo liền
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

      // Đóng gói snapshot dữ liệu của rương này trước khi giải phóng biến toàn cục
      const taskSnapshot = {
        account: accName,
        title: chestTitle,
        image: pendingImage ? Object.assign({}, pendingImage) : null,
        crops: Array.isArray(pendingCrops) ? [...pendingCrops] : []
      };

      // Reset ngay biến tạm để người dùng nạp & căn chỉnh ảnh rương tiếp theo mà không phải chờ
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

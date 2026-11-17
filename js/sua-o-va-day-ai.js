/* MODULE: SỬA THÔNG TIN Ô, TRAIN ICON & DẠY SỐ CHO AI (js/sua-o-va-day-ai.js) */

window.updateSidePanelInfo = function(slotIdx, slotData) {
  const badge = document.getElementById("sidePanelSlotIndexBadge");
  const cropImgEl = document.getElementById("sidePanelCropImg");
  const emptyIconEl = document.getElementById("sidePanelEmptyIcon");
  const nameInp = document.getElementById("sidePanelItemName");
  const qtyInp = document.getElementById("sidePanelItemQty");
  const aiNotice = document.getElementById("sidePanelAiDetectedNotice");

  if (badge) badge.textContent = `Ô ${slotIdx + 1}`;

  if (!slotData || (!slotData.name && !slotData.cropImg)) {
    if (cropImgEl) {
      cropImgEl.src = "";
      cropImgEl.classList.add("hidden");
    }
    if (emptyIconEl) emptyIconEl.classList.remove("hidden");
    if (nameInp) nameInp.value = "";
    if (qtyInp) qtyInp.value = 0;
    if (aiNotice) aiNotice.textContent = "";
    return;
  }

  // Luôn lấy duy nhất ảnh cắt thực tế của chính ô đang bấm (slotData.cropImg), không lấy ảnh item khác đè lên
  const exactImg = slotData.cropImg || "";

  if (cropImgEl && emptyIconEl) {
    if (exactImg) {
      cropImgEl.src = exactImg;
      cropImgEl.classList.remove("hidden");
      emptyIconEl.classList.add("hidden");
    } else {
      cropImgEl.src = "";
      cropImgEl.classList.add("hidden");
      emptyIconEl.classList.remove("hidden");
    }
  }

  if (nameInp) nameInp.value = slotData.name || "";
  if (qtyInp) qtyInp.value = slotData.qty || 0;
  if (aiNotice) {
    aiNotice.textContent = (slotData.aiOriginalQty !== undefined && slotData.aiOriginalQty !== slotData.qty)
      ? `(AI gốc: ${slotData.aiOriginalQty})`
      : "";
  }
};

function initSlotEditorAndTrainingEvents() {
  // 1. Gợi ý thông minh khi gõ tên vật phẩm
  const nameInput = document.getElementById("sidePanelItemName");
  const dropdown = document.getElementById("customAutocompleteList");
  if (nameInput && dropdown) {
    nameInput.addEventListener("input", (e) => {
      if (typeof renderDropdownSuggestions === "function") renderDropdownSuggestions(e.target.value);
    });
    nameInput.addEventListener("focus", (e) => {
      if (typeof renderDropdownSuggestions === "function") renderDropdownSuggestions(e.target.value);
    });
    document.addEventListener("click", (e) => {
      if (!nameInput.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add("hidden");
      }
    });
  }

  // 2. Lưu ô & Nạp mẫu hình ảnh mới nhất vào Bộ Não AI
  const btnSaveSide = document.getElementById("btnSaveSidePanel");
  if (btnSaveSide) {
    btnSaveSide.onclick = async () => {
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
        ...targetSlot,
        name: newName,
        qty: newName ? newQty : 0,
        cropImg: targetSlot.cropImg || null,
        aiOriginalQty: targetSlot.aiOriginalQty !== undefined ? targetSlot.aiOriginalQty : newQty
      };

      if (newName && targetSlot.cropImg) {
        const hash = await computeImageHash(targetSlot.cropImg);

        if (!appState.learnedIcons) appState.learnedIcons = {};
        if (!Array.isArray(appState.learnedIcons[newName])) {
          const oldVal = appState.learnedIcons[newName];
          appState.learnedIcons[newName] = oldVal ? [oldVal] : [];
        }

        appState.learnedIcons[newName] = appState.learnedIcons[newName].filter(
          sample => !(sample && sample.hash && getHammingDistance(hash, sample.hash) <= 2)
        );
        appState.learnedIcons[newName].push({
          img: targetSlot.cropImg,
          hash: hash,
          addedAt: Date.now()
        });

        if (!appState.customKnownItems) appState.customKnownItems = [];
        if (!appState.customKnownItems.includes(newName)) appState.customKnownItems.push(newName);
        if (typeof KNOWN_ITEMS !== "undefined" && !KNOWN_ITEMS.includes(newName)) KNOWN_ITEMS.push(newName);

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
        showToast(`Đã train [${newName}] (${totalSamples} mẫu) & đồng bộ ${count} ô!`, "success");
      } else {
        saveChestsState();
        showToast(`Đã cập nhật ô ${idx + 1}!`, "success");
      }
    };
  }

  // 3. Dạy AI đọc số chính xác -> HỌC LIỀN & ÁP DỤNG NGAY LẬP TỨC CHO TOÀN BỘ RƯƠNG
  const btnTrain = document.getElementById("btnTrainAiWrongNumber");
  if (btnTrain) {
    btnTrain.onclick = async () => {
      const chest = appState.chests.find(c => c.account === appState.viewingAcc && c.title === appState.viewingChest);
      if (!chest) return;
      const idx = appState.selectedSlotIndex;
      const slot = chest.slots ? chest.slots[idx] : null;
      if (!slot) return;

      const wrongQty = parseInt(slot.qty) || 0;
      const itemName = (slot.name || "").trim();
      const correctInput = prompt(
        `AI đang đọc ô này là [${wrongQty}]${itemName ? ` (${itemName})` : ""}. Nhập số CHÍNH XÁC trong game để AI học & sửa ngay toàn bộ ô bị sai tương tự:`,
        wrongQty
      );

      if (correctInput !== null && correctInput.trim() !== "") {
        const correctVal = parseInt(correctInput.trim()) || 0;
        if (slot.aiOriginalQty === undefined) slot.aiOriginalQty = wrongQty;
        slot.qty = correctVal;

        if (!appState.trainedNumberErrors) appState.trainedNumberErrors = [];
        // Cập nhật hoặc thêm mới quy tắc dạy số (không trùng lặp quy tắc cũ)
        const existingIdx = appState.trainedNumberErrors.findIndex(
          r => Number(r.wrongQty) === wrongQty && (r.itemName || "").trim().toLowerCase() === itemName.toLowerCase()
        );
        const newRule = {
          wrongQty: wrongQty,
          correctQty: correctVal,
          itemName: itemName || "Không rõ",
          updatedAt: Date.now()
        };
        if (existingIdx >= 0) {
          appState.trainedNumberErrors[existingIdx] = newRule;
        } else {
          appState.trainedNumberErrors.push(newRule);
        }

        // ÁP DỤNG NGAY LẬP TỨC (REAL-TIME) CHO TẤT CẢ CÁC Ô ĐANG BỊ ĐỌC SAI TƯƠNG TỰ TRONG TOÀN BỘ RƯƠNG
        let fixedSlotsCount = 1;
        const targetCropHash = slot.cropImg && typeof computeImageHash === "function"
          ? await computeImageHash(slot.cropImg)
          : null;

        for (const c of (appState.chests || [])) {
          if (!Array.isArray(c.slots)) continue;
          for (let sIdx = 0; sIdx < c.slots.length; sIdx++) {
            if (c === chest && sIdx === idx) continue;
            const other = c.slots[sIdx];
            if (!other || !other.name) continue;

            const otherQty = parseInt(other.qty) || 0;
            const otherOrigQty = other.aiOriginalQty !== undefined ? parseInt(other.aiOriginalQty) : otherQty;
            const isSameWrongNum = (otherQty === wrongQty || otherOrigQty === wrongQty);
            if (!isSameWrongNum) continue;

            const isSameItemName = itemName && other.name.trim().toLowerCase() === itemName.toLowerCase();
            let isSimilarCrop = false;
            if (targetCropHash && other.cropImg && typeof computeImageHash === "function" && typeof getHammingDistance === "function") {
              const otherHash = await computeImageHash(other.cropImg);
              if (getHammingDistance(targetCropHash, otherHash) <= 5) {
                isSimilarCrop = true;
              }
            }

            if (isSameItemName || isSimilarCrop) {
              if (other.aiOriginalQty === undefined) other.aiOriginalQty = otherQty;
              other.qty = correctVal;
              fixedSlotsCount++;
            }
          }
        }

        saveBrainState();
        saveChestsState();
        showToast(
          `AI đã học [${wrongQty} → ${correctVal}] và tự động sửa ngay ${fixedSlotsCount} ô trong kho!`,
          "success"
        );
      }
    };
  }

  // 4. Làm rỗng tên/số lượng ô (vẫn giữ ảnh gốc của ô để có thể đặt tên lại nếu cần)
  const btnEmptySide = document.getElementById("btnSidePanelEmptySlot");
  if (btnEmptySide) {
    btnEmptySide.onclick = () => {
      const chest = appState.chests.find(c => c.account === appState.viewingAcc && c.title === appState.viewingChest);
      if (!chest) return;
      const idx = appState.selectedSlotIndex;
      if (chest.slots && chest.slots[idx]) {
        chest.slots[idx] = {
          ...chest.slots[idx],
          name: null,
          qty: 0,
          cropImg: chest.slots[idx].cropImg || null
        };
      }
      saveChestsState();
      showToast(`Đã xóa tên ô ${idx + 1} (vẫn giữ ảnh cắt gốc của ô)`, "info");
    };
  }
}

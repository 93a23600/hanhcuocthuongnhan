/* MODULE: SỬA THÔNG TIN Ô, TRAIN ICON & DẠY SỐ CHO AI (js/sua-o-va-day-ai.js) */

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

        // Đẩy mẫu vừa cập nhật xuống cuối mảng để làm icon đại diện mới nhất
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

        // Đồng bộ tất cả 35 ô khớp mẫu
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
        showToast(`Đã train [${newName}] (${totalSamples} mẫu) & cập nhật icon mới nhất!`, "success");
      } else {
        saveChestsState();
        showToast(`Đã cập nhật ô ${idx + 1}!`, "success");
      }
    };
  }

  // 3. Dạy AI đọc số chính xác
  const btnTrain = document.getElementById("btnTrainAiWrongNumber");
  if (btnTrain) {
    btnTrain.onclick = () => {
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

  // 4. Làm rỗng ô
  const btnEmptySide = document.getElementById("btnSidePanelEmptySlot");
  if (btnEmptySide) {
    btnEmptySide.onclick = () => {
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
}

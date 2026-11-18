/* MODULE: LUỒNG XỬ LÝ QUÉT ĐỘC LẬP TỪNG RƯƠNG (js/luong-quet-mot-ruong.js) */

async function runSingleChestWorker(task) {
  const updateTaskProgress = (pct, fullMsg, shortMsg) => {
    task.percent = Math.min(100, Math.max(0, Math.round(pct)));
    if (fullMsg) task.statusText = fullMsg;
    if (shortMsg) task.shortStatus = shortMsg;
    if (typeof window.refreshMultiThreadProgressUI === "function") {
      window.refreshMultiThreadProgressUI();
    }
  };

  updateTaskProgress(4, "Đang gửi ảnh lên Gemini AI...", "Gửi ảnh AI...");

  // Đường cong tiệm cận mượt từ 4% -> 86% trong lúc chờ Gemini trả kết quả
  const startTime = Date.now();
  const smoothTimer = setInterval(() => {
    const elapsedSec = (Date.now() - startTime) / 1000;
    const smoothPct = Math.min(86, Math.round(4 + 82 * (1 - Math.exp(-elapsedSec / 4.2))));

    if (smoothPct > task.percent && task.percent < 86) {
      let msg = "AI đang phân tích lưới 5×7...";
      let shortMsg = "Quét lưới...";
      if (smoothPct >= 65) {
        msg = "AI đang đọc số lượng từng ô...";
        shortMsg = "Đọc số lượng...";
      } else if (smoothPct >= 38) {
        msg = "AI đang nhận diện vật phẩm...";
        shortMsg = "Đọc vật phẩm...";
      } else if (smoothPct >= 16) {
        msg = "AI đang quét 35 ô rương...";
        shortMsg = "Quét 35 ô...";
      }
      updateTaskProgress(smoothPct, msg, shortMsg);
    }
  }, 180);

  try {
    let aiSlots = [];
    if (appState.apiKey) {
      aiSlots = await analyzeChestWithGemini(task.image.base64);
    } else {
      await new Promise(r => setTimeout(r, 900));
      aiSlots = Array.from({ length: 35 }, (_, i) => ({
        name: i < 15 ? (KNOWN_ITEMS[i] || "Vật phẩm") : null,
        qty: i < 15 ? 999 : 0,
        hasStackNum: i < 15
      }));
    }

    clearInterval(smoothTimer);
    updateTaskProgress(87, "Đối chiếu kho icon đã học...", "Khớp icon...");

    const ignoreAdkForThisAcc = (appState.noAdkAccounts || []).some(
      acc => acc.trim().toLowerCase() === task.account.trim().toLowerCase()
    );

    const finalSlots = [];
    for (let i = 0; i < 35; i++) {
      // Băm nhỏ đoạn 87% -> 98% theo từng nhịp kiểm tra 35 ô
      if (i % 3 === 0 || i === 34) {
        const slotPct = 87 + Math.round(((i + 1) / 35) * 11);
        updateTaskProgress(slotPct, `Khớp icon ô ${i + 1}/35...`, `Ô ${i + 1}/35...`);
      }

      const crop = task.crops[i] || null;
      let assignedName = aiSlots[i]?.name || null;
      let assignedQty = aiSlots[i]?.qty || 0;
      const hasStackNum = aiSlots[i]?.hasStackNum !== undefined ? !!aiSlots[i].hasStackNum : (assignedQty > 1);

      if (crop && appState.learnedIcons) {
        const cropHash = await computeImageHash(crop);
        let bestMatchName = null;
        let lowestDist = 999;

        for (const [learnedName, sampleList] of Object.entries(appState.learnedIcons)) {
          const samples = Array.isArray(sampleList) ? sampleList : (sampleList ? [sampleList] : []);
          for (const sample of samples) {
            if (!sample || !sample.hash) continue;
            const dist = getHammingDistance(cropHash, sample.hash);
            if (dist < lowestDist && dist <= 3) {
              lowestDist = dist;
              bestMatchName = learnedName;
            }
          }
        }
        if (bestMatchName) assignedName = bestMatchName;
      }

      if (assignedName) {
        const lowerAssigned = assignedName.trim().toLowerCase();
        if (lowerAssigned === "âm dương kính" || lowerAssigned === "thiết bát quái") {
          assignedName = ignoreAdkForThisAcc ? "Thiết Bát Quái" : "Âm Dương Kính";
        }
      }

      finalSlots.push({
        name: assignedName,
        qty: assignedQty,
        hasStackNum: hasStackNum,
        cropImg: crop,
        aiOriginalQty: assignedQty
      });
    }

    updateTaskProgress(99, "Đang lưu dữ liệu rương...", "Đang lưu...");

    if (!appState.accounts.includes(task.account)) {
      appState.accounts.push(task.account);
    }

    let chest = appState.chests.find(c => c.account === task.account && c.title === task.title);
    if (chest) {
      chest.slots = finalSlots;
      chest.createdAt = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else {
      appState.chests.push({
        id: "chest-" + Date.now() + "-" + task.id,
        account: task.account,
        title: task.title,
        createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        slots: finalSlots
      });
    }

    appState.viewingAcc = task.account;
    appState.viewingChest = task.title;
    appState.selectedSlotIndex = 0;

    saveChestsState();
    updateTaskProgress(100, "Hoàn tất!", "Xong 100%");
    if (typeof showToast === "function") {
      showToast(`Đã nạp xong rương [${task.account} - ${task.title}] (35 ô)!`, "success");
    }
  } catch (err) {
    clearInterval(smoothTimer);
    if (typeof showToast === "function") {
      showToast(`Lỗi nạp [${task.account} - ${task.title}]: ${err.message}`, "error");
    }
  } finally {
    setTimeout(() => {
      activeScanTasks.delete(task.id);
      if (typeof window.refreshMultiThreadProgressUI === "function") {
        window.refreshMultiThreadProgressUI();
      }
      if (typeof pumpUploadQueue === "function") {
        pumpUploadQueue();
      }
    }, 350);
  }
}

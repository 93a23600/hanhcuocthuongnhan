/* MODULE 4: ĐIỀU PHỐI QUÉT RƯƠNG & ÁP DỤNG QUY TẮC (js/api.js) */

function setScanProgress(percent, statusText) {
  const p = Math.min(100, Math.max(0, Math.round(percent)));
  const statusEl = document.getElementById("progressStatusText");
  const percentEl = document.getElementById("progressPercentText");
  const barFill = document.getElementById("scanProgressBarFill");

  if (statusEl && statusText) statusEl.textContent = statusText;
  if (percentEl) percentEl.textContent = `${p}%`;
  if (barFill) barFill.style.width = `${p}%`;
}

async function executeUpload(accountName, chestTitle) {
  if (!pendingImage) return;

  const badge = document.getElementById("readingBadge");
  const barContainer = document.getElementById("scanProgressBarContainer");
  if (badge) badge.classList.remove("hidden");
  if (barContainer) barContainer.classList.remove("hidden");

  let currentPercent = 5;
  setScanProgress(currentPercent, "Đang gửi ảnh lên Gemini AI...");

  const fakeProgressTimer = setInterval(() => {
    if (currentPercent < 65) {
      currentPercent += Math.floor(Math.random() * 4) + 2;
      if (currentPercent > 65) currentPercent = 65;
      setScanProgress(currentPercent, "AI đang đọc vật phẩm & số lượng...");
    }
  }, 450);

  try {
    let aiSlots = [];
    if (appState.apiKey) {
      aiSlots = await analyzeChestWithGemini(pendingImage.base64);
    } else {
      await new Promise(r => setTimeout(r, 800));
      aiSlots = Array.from({ length: 35 }, (_, i) => ({
        name: i < 15 ? (KNOWN_ITEMS[i] || "Vật phẩm") : null,
        qty: i < 15 ? 999 : 0
      }));
    }

    clearInterval(fakeProgressTimer);
    setScanProgress(70, "AI xong! Đang đối chiếu kho icon đã học...");

    const ignoreAdkForThisAcc = (appState.noAdkAccounts || []).some(
      acc => acc.trim().toLowerCase() === accountName.trim().toLowerCase()
    );

    const finalSlots = [];
    for (let i = 0; i < 35; i++) {
      const slotPercent = 70 + Math.round(((i + 1) / 35) * 28);
      setScanProgress(slotPercent, `Đang kiểm tra ô ${i + 1}/35...`);

      const crop = pendingCrops[i] || null;
      let assignedName = aiSlots[i]?.name || null;
      let assignedQty = aiSlots[i]?.qty || 0;

      // So khớp với kho dữ liệu đa mẫu ảnh đã train (gọi từ js/bam-anh.js)
      if (crop && appState.learnedIcons) {
        const cropHash = await computeImageHash(crop);
        let bestMatchName = null;
        let lowestDist = 999;

        for (const [learnedName, sampleList] of Object.entries(appState.learnedIcons)) {
          const samples = Array.isArray(sampleList) ? sampleList : (sampleList ? [sampleList] : []);
          for (const sample of samples) {
            if (!sample || !sample.hash) continue;
            const dist = getHammingDistance(cropHash, sample.hash);
            if (dist < lowestDist && dist <= 7) {
              lowestDist = dist;
              bestMatchName = learnedName;
            }
          }
        }
        if (bestMatchName) assignedName = bestMatchName;
      }

      // Quy tắc 2 chiều ADK / TBQ theo cấu hình tài khoản
      if (assignedName) {
        const lowerAssigned = assignedName.trim().toLowerCase();
        if (lowerAssigned === "âm dương kính" || lowerAssigned === "thiết bát quái") {
          assignedName = ignoreAdkForThisAcc ? "Thiết Bát Quái" : "Âm Dương Kính";
        }
      }

      finalSlots.push({
        name: assignedName,
        qty: assignedName ? assignedQty : 0,
        cropImg: crop,
        aiOriginalQty: assignedQty
      });
    }

    setScanProgress(99, "Đang lưu dữ liệu rương...");

    if (!appState.accounts.includes(accountName)) {
      appState.accounts.push(accountName);
    }

    let chest = appState.chests.find(c => c.account === accountName && c.title === chestTitle);
    if (chest) {
      chest.slots = finalSlots;
      chest.createdAt = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else {
      appState.chests.push({
        id: "chest-" + Date.now(),
        account: accountName,
        title: chestTitle,
        createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        slots: finalSlots
      });
    }

    appState.viewingAcc = accountName;
    appState.viewingChest = chestTitle;
    appState.selectedSlotIndex = 0;

    saveChestsState();
    setScanProgress(100, "Hoàn tất!");
    showToast(`Đã nạp xong rương [${accountName} - ${chestTitle}] (35 ô)!`, "success");
  } catch (err) {
    clearInterval(fakeProgressTimer);
    showToast("Lỗi phân tích: " + err.message, "error");
  } finally {
    setTimeout(() => {
      if (badge) badge.classList.add("hidden");
      if (barContainer) barContainer.classList.add("hidden");
      setScanProgress(0, "");
    }, 800);
    pendingImage = null;
    pendingCrops = [];
  }
}

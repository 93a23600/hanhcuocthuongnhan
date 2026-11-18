/* MODULE: HÀNG ĐỢI NẠP RƯƠNG & XỬ LÝ ĐA LUỒNG SONG SONG (js/hang-doi-va-da-luong.js) */

const MAX_CONCURRENT_SCANS = 3; // Chạy song song tối đa 3 luồng AI cùng lúc
const uploadTaskQueue = [];
const activeScanTasks = new Map();
let taskAutoId = 1;

// Tổng hợp tiến trình của các luồng đang chạy để hiển thị lên giao diện
window.getQueueProgressSummary = function() {
  const runningList = Array.from(activeScanTasks.values());
  const activeCount = runningList.length;
  const waitingCount = uploadTaskQueue.length;
  const totalInFlight = activeCount + waitingCount;

  if (totalInFlight === 0) {
    return { activeCount: 0, waitingCount: 0, percent: 0, text: "", shortText: "" };
  }

  const sumPercent = runningList.reduce((acc, t) => acc + (t.percent || 0), 0);
  const avgPercent = Math.min(100, Math.max(1, Math.round(sumPercent / totalInFlight)));

  if (totalInFlight === 1 && activeCount === 1) {
    const single = runningList[0];
    return {
      activeCount,
      waitingCount,
      percent: single.percent,
      text: `[${single.account} - ${single.title}] ${single.statusText}`,
      shortText: `${single.title}: ${single.shortStatus}`
    };
  }

  return {
    activeCount,
    waitingCount,
    percent: avgPercent,
    text: `Đang chạy ${activeCount} luồng` + (waitingCount > 0 ? ` (+${waitingCount} chờ)` : "") + ` • ${runningList[0].statusText}`,
    shortText: `Đang xử lý ${totalInFlight} rương`
  };
};

// Đồng bộ thanh tiến trình ở cả khung mở rộng lẫn thanh tiêu đề thu gọn
window.refreshMultiThreadProgressUI = function() {
  const badge = document.getElementById("readingBadge");
  const barContainer = document.getElementById("scanProgressBarContainer");
  const statusEl = document.getElementById("progressStatusText");
  const percentEl = document.getElementById("progressPercentText");
  const barFill = document.getElementById("scanProgressBarFill");

  const summary = window.getQueueProgressSummary();
  const totalInFlight = summary.activeCount + summary.waitingCount;

  if (totalInFlight > 0) {
    if (badge) badge.classList.remove("hidden");
    if (barContainer) barContainer.classList.remove("hidden");
    if (statusEl) statusEl.textContent = summary.text;
    if (percentEl) percentEl.textContent = `${summary.percent}%`;
    if (barFill) barFill.style.width = `${summary.percent}%`;
  } else {
    if (badge) badge.classList.add("hidden");
    if (barContainer) barContainer.classList.add("hidden");
    if (statusEl) statusEl.textContent = "";
    if (percentEl) percentEl.textContent = "0%";
    if (barFill) barFill.style.width = "0%";
  }

  if (typeof window.syncCollapsedProgressBar === "function") {
    window.syncCollapsedProgressBar();
  }
};

// Đẩy 1 rương vào hàng đợi & mở khóa cho phép nạp tiếp rương khác ngay
window.enqueueChestUploadTask = function(snapshot) {
  if (!snapshot || !snapshot.image) return;

  const task = {
    id: taskAutoId++,
    account: snapshot.account,
    title: snapshot.title,
    image: snapshot.image,
    crops: snapshot.crops || [],
    percent: 2,
    statusText: "Đang xếp hàng...",
    shortStatus: "Chờ xử lý..."
  };

  uploadTaskQueue.push(task);
  window.refreshMultiThreadProgressUI();

  if (typeof showToast === "function") {
    const inFlight = activeScanTasks.size + uploadTaskQueue.length;
    showToast(
      inFlight > 1
        ? `Đã thêm [${task.account} - ${task.title}] vào luồng (${inFlight} rương đang chạy)...`
        : `Đang quét ngầm [${task.account} - ${task.title}], có thể nạp tiếp rương khác ngay!`,
      "info"
    );
  }

  pumpUploadQueue();
};

function pumpUploadQueue() {
  while (activeScanTasks.size < MAX_CONCURRENT_SCANS && uploadTaskQueue.length > 0) {
    const nextTask = uploadTaskQueue.shift();
    activeScanTasks.set(nextTask.id, nextTask);
    runSingleChestWorker(nextTask);
  }
  window.refreshMultiThreadProgressUI();
}

// Worker chạy độc lập từng rương với tiến trình băm nhỏ mượt 0% -> 100%
async function runSingleChestWorker(task) {
  const updateTaskProgress = (pct, fullMsg, shortMsg) => {
    task.percent = Math.min(100, Math.max(0, Math.round(pct)));
    if (fullMsg) task.statusText = fullMsg;
    if (shortMsg) task.shortStatus = shortMsg;
    window.refreshMultiThreadProgressUI();
  };

  updateTaskProgress(4, "Đang gửi ảnh lên Gemini AI...", "Gửi ảnh AI...");

  // Đường cong tiệm cận mượt từ 4% -> 86% trong lúc chờ Gemini trả kết quả (không khựng ở 65%)
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
      window.refreshMultiThreadProgressUI();
      pumpUploadQueue();
    }, 350);
  }
}

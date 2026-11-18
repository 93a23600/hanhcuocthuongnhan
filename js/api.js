/* MODULE 4: ĐIỀU PHỐI QUÉT RƯƠNG & ÁP DỤNG QUY TẮC (js/api.js) */

function setScanProgress(percent, statusText) {
  const p = Math.min(100, Math.max(0, Math.round(percent)));
  const statusEl = document.getElementById("progressStatusText");
  const percentEl = document.getElementById("progressPercentText");
  const barFill = document.getElementById("scanProgressBarFill");

  if (statusEl && statusText) statusEl.textContent = statusText;
  if (percentEl) percentEl.textContent = `${p}%`;
  if (barFill) barFill.style.width = `${p}%`;

  if (typeof syncCollapsedProgressBar === "function") {
    syncCollapsedProgressBar();
  }
}

async function executeUpload(accountName, chestTitle) {
  if (!pendingImage) return;

  const taskSnapshot = {
    account: accountName,
    title: chestTitle,
    image: Object.assign({}, pendingImage),
    crops: Array.isArray(pendingCrops) ? [...pendingCrops] : []
  };

  // Giải phóng ngay biến toàn cục để nạp liên tục ảnh rương tiếp theo
  pendingImage = null;
  pendingCrops = [];

  if (typeof window.enqueueChestUploadTask === "function") {
    window.enqueueChestUploadTask(taskSnapshot);
  }
}

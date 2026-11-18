/* MODULE ĐIỀU PHỐI: HÀNG ĐỢI NẠP RƯƠNG & XỬ LÝ ĐA LUỒNG SONG SONG (js/hang-doi-va-da-luong.js) */

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
  if (typeof window.refreshMultiThreadProgressUI === "function") {
    window.refreshMultiThreadProgressUI();
  }

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

// Điều phối lấy tác vụ từ hàng đợi đẩy vào các luồng xử lý đang rảnh
function pumpUploadQueue() {
  while (activeScanTasks.size < MAX_CONCURRENT_SCANS && uploadTaskQueue.length > 0) {
    const nextTask = uploadTaskQueue.shift();
    activeScanTasks.set(nextTask.id, nextTask);
    if (typeof runSingleChestWorker === "function") {
      runSingleChestWorker(nextTask);
    }
  }
  if (typeof window.refreshMultiThreadProgressUI === "function") {
    window.refreshMultiThreadProgressUI();
  }
}

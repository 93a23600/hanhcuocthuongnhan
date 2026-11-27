/* MODULE: BỘ ĐẾM HÀNG ĐỢI & TÍNH TIẾN TRÌNH TỔNG HỢP (js/bo-dem-hang-doi.js) */

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

  if (totalInFlight === 1 && activeCount === 1 && runningList[0]) {
    const single = runningList[0];
    return {
      activeCount,
      waitingCount,
      percent: single.percent || 0,
      text: `[${single.account || ""} - ${single.title || ""}] ${single.statusText || "Đang xử lý..."}`,
      shortText: `${single.title || "Rương"}: ${single.shortStatus || "Đang xử lý..."}`
    };
  }

  const leadStatus = runningList[0]?.statusText || "Đang chờ luồng...";
  return {
    activeCount,
    waitingCount,
    percent: avgPercent,
    text: `Đang chạy ${activeCount} luồng` + (waitingCount > 0 ? ` (+${waitingCount} chờ)` : "") + ` • ${leadStatus}`,
    shortText: `Đang xử lý ${totalInFlight} rương`
  };
};
```[cite: 7]

### Lưu ý thêm khi chạy
* **Kiểm tra `js/luong-quet-mot-ruong.js`:** Khi bấm **Cập Nhật Rương**, `pumpUploadQueue()` sẽ lấy tác vụ đẩy vào `activeScanTasks` rồi gọi `runSingleChestWorker(nextTask)`[cite: 5, 7]. Nếu file `js/luong-quet-mot-ruong.js` chưa có hàm `runSingleChestWorker` hoặc bị lỗi cú pháp, tác vụ sẽ nằm trong `activeScanTasks` nhưng không quét tiếp được[cite: 7].
* **Cảnh báo `reload.js` và `favicon.ico`:** Hai dòng này không ảnh hưởng đến luồng quét AI (một cái là extension trình duyệt, một cái là thiếu icon tab)[cite: 5].

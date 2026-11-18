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

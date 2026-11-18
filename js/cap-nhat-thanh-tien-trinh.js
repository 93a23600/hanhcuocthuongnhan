/* MODULE: CẬP NHẬT GIAO DIỆN THANH TIẾN TRÌNH ĐA LUỒNG (js/cap-nhat-thanh-tien-trinh.js) */

window.refreshMultiThreadProgressUI = function() {
  const badge = document.getElementById("readingBadge");
  const barContainer = document.getElementById("scanProgressBarContainer");
  const statusEl = document.getElementById("progressStatusText");
  const percentEl = document.getElementById("progressPercentText");
  const barFill = document.getElementById("scanProgressBarFill");

  const summary = typeof window.getQueueProgressSummary === "function"
    ? window.getQueueProgressSummary()
    : { activeCount: 0, waitingCount: 0, percent: 0, text: "" };

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

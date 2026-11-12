/* MODULE: ĐIỀU PHỐI RENDER TOÀN BỘ GIAO DIỆN (js/ui.js) */

function renderAll() {
  if (typeof renderGameGridChest === "function") renderGameGridChest();
  if (typeof renderSummaryTable === "function") renderSummaryTable();
  if (typeof renderDiffView === "function") renderDiffView();
  if (window.lucide) lucide.createIcons();
}

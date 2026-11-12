/* FILE KHỞI ĐỘNG TỔNG (js/app.js) */

window.addEventListener("DOMContentLoaded", () => {
  loadState();
  updateApiKeyUI();

  if (typeof initUploadAndCalibrateEvents === "function") initUploadAndCalibrateEvents();
  if (typeof initSlotEditorAndTrainingEvents === "function") initSlotEditorAndTrainingEvents();
  if (typeof initNavigationAndFilterEvents === "function") initNavigationAndFilterEvents();
  if (typeof initBackupAndUtilityEvents === "function") initBackupAndUtilityEvents();
  if (typeof initSettingsModal === "function") initSettingsModal();

  renderAll();
  if (window.lucide) lucide.createIcons();
});

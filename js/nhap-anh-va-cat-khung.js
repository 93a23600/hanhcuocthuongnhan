/* MODULE ĐIỀU PHỐI: NHẬN ẢNH, CĂN VIỀN 4 CẠNH & POPUP NẠP RƯƠNG (js/nhap-anh-va-cat-khung.js) */

function initUploadAndCalibrateEvents() {
  if (typeof bindPasteAndDropEvents === "function") {
    bindPasteAndDropEvents();
  }
  if (typeof bindCalibrateAndUploadEvents === "function") {
    bindCalibrateAndUploadEvents();
  }
  if (typeof window.setupAccountPickerDropdown === "function") {
    window.setupAccountPickerDropdown();
  }
  if (typeof window.renderUploadChestChoiceButtons === "function") {
    window.renderUploadChestChoiceButtons(appState.viewingAcc);
  }
}

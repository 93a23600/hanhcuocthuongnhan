/* MODULE: CẬP NHẬT BẢNG CHỈNH SỬA Ô BÊN PHẢI (js/bang-sua-o-ben-phai.js) */

function updateSidePanelInfo(slotIdx, slotData) {
  const badge = document.getElementById("sidePanelSlotIndexBadge");
  if (badge) badge.textContent = `Ô ${slotIdx + 1}`;
  
  const img = document.getElementById("sidePanelCropImg");
  const emptyTxt = document.getElementById("sidePanelEmptyIcon");
  const nameInput = document.getElementById("sidePanelItemName");
  const qtyInput = document.getElementById("sidePanelItemQty");
  const notice = document.getElementById("sidePanelAiDetectedNotice");
  const dropdown = document.getElementById("customAutocompleteList");
  
  if (dropdown) dropdown.classList.add("hidden");

  if (img && emptyTxt) {
    const learnedArr = slotData?.name ? appState.learnedIcons?.[slotData.name] : null;
    const latestImg = Array.isArray(learnedArr) && learnedArr.length > 0 ? learnedArr[learnedArr.length - 1].img : (learnedArr?.img || "");
    const displayImg = slotData?.cropImg || latestImg;

    if (displayImg) {
      img.src = displayImg;
      img.classList.remove("hidden");
      emptyTxt.classList.add("hidden");
    } else {
      img.src = "";
      img.classList.add("hidden");
      emptyTxt.classList.remove("hidden");
    }
  }

  if (nameInput) nameInput.value = slotData?.name || "";
  if (qtyInput) qtyInput.value = slotData?.qty || 0;

  if (notice) {
    if (slotData?.aiOriginalQty && slotData.aiOriginalQty !== slotData.qty) {
      notice.textContent = `(AI từng đọc: ${slotData.aiOriginalQty})`;
    } else {
      notice.textContent = "";
    }
  }
}

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
    // Luôn ưu tiên ảnh cắt thực tế của chính ô đang chọn
    const displayImg = slotData?.cropImg || "";

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

  // Tách biệt hoàn toàn việc đọc số lượng khỏi tên vật phẩm:
  // Nếu qty đang là 0 nhưng AI từng đọc được số gốc (aiOriginalQty > 0) thì lấy ngay số AI đã đọc
  const currentQty = parseInt(slotData?.qty) || 0;
  const originalAiQty = slotData?.aiOriginalQty !== undefined ? (parseInt(slotData.aiOriginalQty) || 0) : 0;
  const resolvedQty = currentQty > 0 ? currentQty : originalAiQty;

  if (qtyInput) qtyInput.value = resolvedQty;

  if (notice) {
    if (slotData?.aiOriginalQty !== undefined && originalAiQty !== resolvedQty) {
      notice.textContent = `(AI từng đọc: ${originalAiQty})`;
    } else if (originalAiQty > 0) {
      notice.textContent = `(AI gốc: ${originalAiQty})`;
    } else {
      notice.textContent = "";
    }
  }
}

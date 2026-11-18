/* MODULE 3: SỰ KIỆN DÁN ẢNH (CTRL+V), CHỌN TỆP & KÉO THẢ (js/su-kien-dan-va-keo-tha-anh.js) */

function bindPasteAndDropEvents() {
  // 1. Phím Ctrl + V dán ảnh mọi lúc trên toàn trang
  if (!window._globalPasteChestBound) {
    window._globalPasteChestBound = true;
    window.addEventListener("paste", (e) => {
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const items = (e.clipboardData || window.clipboardData)?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            handleIncomingFile(file);
            break;
          }
        }
      }
    });
  }

  // 2. Chọn tệp & Vùng Kéo thả
  const fileInput = document.getElementById("fileInput");
  const btnBrowse = document.getElementById("btnBrowseFile");
  const dropZone = document.getElementById("dropZone");

  if (btnBrowse && fileInput) {
    btnBrowse.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      fileInput.click();
    };
  }

  if (fileInput) {
    fileInput.onchange = (e) => {
      if (e.target.files && e.target.files[0]) handleIncomingFile(e.target.files[0]);
      fileInput.value = "";
    };
  }

  if (dropZone) {
    dropZone.addEventListener("click", () => dropZone.focus());
    dropZone.ondragover = (e) => {
      e.preventDefault();
      dropZone.classList.add("drop-active");
    };
    dropZone.ondragleave = () => dropZone.classList.remove("drop-active");
    dropZone.ondrop = (e) => {
      e.preventDefault();
      dropZone.classList.remove("drop-active");
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleIncomingFile(e.dataTransfer.files[0]);
      }
    };
  }
}

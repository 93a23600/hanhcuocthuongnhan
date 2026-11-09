let selectedChestNum = "Rương 1";

function openConfirmUploadModal() {
  const modal = document.getElementById("confirmUploadModal");
  const selectAcc = document.getElementById("selectAccount");

  // Render danh sách Acc hiện có
  selectAcc.innerHTML = appState.accounts.map(acc => `<option value="${acc}">${acc}</option>`).join("");

  modal.classList.remove("hidden");
  lucide.createIcons();
}

// Bấm nút Rương 1, 2, 3
document.querySelectorAll(".btn-chest-num").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".btn-chest-num").forEach(b => {
      b.classList.remove("border-emerald-500", "text-emerald-400", "bg-emerald-950/40");
      b.classList.add("bg-slate-800", "text-slate-300");
    });
    btn.classList.add("border-emerald-500", "text-emerald-400", "bg-emerald-950/40");
    btn.classList.remove("bg-slate-800", "text-slate-300");
    selectedChestNum = btn.dataset.num;
    document.getElementById("customChestInput").classList.add("hidden");
  });
});

// Nút chọn Rương khác (nếu không phải 1, 2, 3)
document.getElementById("btnCustomChestNum").addEventListener("click", () => {
  const customInput = document.getElementById("customChestInput");
  customInput.classList.remove("hidden");
  customInput.focus();
});

// Thêm Acc mới nhanh
document.getElementById("btnQuickNewAcc").addEventListener("click", () => {
  const name = prompt("Nhập tên Tài Khoản mới (ví dụ: Acc 3, clone_nga_my...):");
  if (name && name.trim()) {
    if (!appState.accounts.includes(name.trim())) {
      appState.accounts.push(name.trim());
      savePersistedState();
    }
    openConfirmUploadModal();
    document.getElementById("selectAccount").value = name.trim();
  }
});

// Bấm nút "Cập Nhật Rương"
document.getElementById("btnConfirmUpload").addEventListener("click", () => {
  const accName = document.getElementById("selectAccount").value;
  const customInput = document.getElementById("customChestInput");
  let chestTitle = selectedChestNum;

  if (!customInput.classList.contains("hidden") && customInput.value.trim()) {
    chestTitle = customInput.value.trim();
  }

  document.getElementById("confirmUploadModal").classList.add("hidden");
  executeUploadToChest(accName, chestTitle);
});

// Hủy bỏ
document.getElementById("btnCancelUpload").addEventListener("click", () => {
  document.getElementById("confirmUploadModal").classList.add("hidden");
  pendingImage = null;
});
document.getElementById("btnDismissUpload").addEventListener("click", () => {
  document.getElementById("confirmUploadModal").classList.add("hidden");
  pendingImage = null;
});

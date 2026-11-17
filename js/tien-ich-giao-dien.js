/* MODULE: THÔNG BÁO TOAST, TRẠNG THÁI API & MỞ POPUP NẠP ẢNH (js/tien-ich-giao-dien.js) */

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `px-4 py-2.5 rounded-xl text-xs font-medium text-white shadow-xl flex items-center gap-2 border transition-all pointer-events-auto ${
    type === "success" ? "bg-emerald-950 border-emerald-500 text-emerald-200" :
    type === "error" ? "bg-red-950 border-red-500 text-red-200" :
    "bg-slate-900 border-slate-700 text-slate-200"
  }`;
  const icon = type === "success" ? "check-circle" : type === "error" ? "alert-circle" : "info";
  toast.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4"></i> <span>${message}</span>`;
  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();
  setTimeout(() => toast.remove(), 3500);
}

function updateApiKeyUI() {
  const modeBadge = document.getElementById("modeBadge");
  const modeDesc = document.getElementById("modeDesc");
  const apiKeyLabel = document.getElementById("apiKeyLabel");
  if (!modeBadge || !modeDesc || !apiKeyLabel) return;

  const activeModel = appState.geminiModel || "gemini-2.5-flash";

  if (appState.apiKey) {
    modeBadge.className = "badge-emerald text-xs px-2 py-0.5 rounded-full font-semibold";
    modeBadge.textContent = "Gemini AI Online";
    modeDesc.textContent = `Đã kết nối API (${activeModel}). Dán ảnh và xác nhận để AI quét tự động.`;
    apiKeyLabel.textContent = "API: Sẵn Sàng";
  } else {
    modeBadge.className = "badge-amber text-xs px-2 py-0.5 rounded-full font-semibold";
    modeBadge.textContent = "Chế độ Demo";
    modeDesc.textContent = "Chưa cài API Key. Dán ảnh sẽ chạy chế độ demo.";
    apiKeyLabel.textContent = "Cài đặt API";
  }
}

window.syncUploadModalChestOptions = function(targetAcc) {
  const chestSelect = document.getElementById("selectChestTitle");
  if (!chestSelect) return;

  const cleanAcc = (targetAcc || "").trim().toLowerCase();
  const baseTitles = ["Rương 1", "Rương 2", "Rương 3"];
  const allTitles = [...baseTitles];

  // Lấy tất cả rương riêng của tài khoản đang nhập (bao gồm rương thêm mới & rương đổi tên)
  (appState.chests || []).forEach(c => {
    const cAcc = (c.account || "").trim().toLowerCase();
    const cTitle = (c.title || "").trim();
    if (!cTitle) return;
    if ((!cleanAcc || cAcc === cleanAcc) && !allTitles.some(t => t.toLowerCase() === cTitle.toLowerCase())) {
      allTitles.push(cTitle);
    }
  });

  // Nếu đang đứng xem rương nào bên tab Rương thì đảm bảo có luôn trong danh sách
  if (appState.viewingChest && !allTitles.some(t => t.toLowerCase() === appState.viewingChest.trim().toLowerCase())) {
    allTitles.push(appState.viewingChest.trim());
  }

  const prevSelected = chestSelect.value;
  chestSelect.innerHTML = allTitles.map(t => `<option value="${t}">${t}</option>`).join("");

  // Ưu tiên chọn đúng rương đang mở xem nếu cùng tài khoản, hoặc giữ lại lựa chọn trước đó
  if (cleanAcc && appState.viewingAcc && appState.viewingAcc.trim().toLowerCase() === cleanAcc && appState.viewingChest) {
    chestSelect.value = appState.viewingChest;
  } else if (prevSelected && allTitles.includes(prevSelected)) {
    chestSelect.value = prevSelected;
  }
};

function openUploadModal() {
  const dl = document.getElementById("accountSuggestions");
  if (dl && appState.accounts) {
    dl.innerHTML = appState.accounts.map(acc => `<option value="${acc}"></option>`).join("");
  }
  
  const accInput = document.getElementById("inputAccountName");
  if (accInput) {
    if (appState.viewingAcc) {
      accInput.value = appState.viewingAcc;
    } else if (!accInput.value.trim() && appState.accounts && appState.accounts.length > 0) {
      accInput.value = appState.accounts[appState.accounts.length - 1];
    }

    accInput.oninput = () => window.syncUploadModalChestOptions(accInput.value);
    window.syncUploadModalChestOptions(accInput.value);
  }

  const modal = document.getElementById("confirmUploadModal");
  if (modal) {
    modal.classList.remove("hidden");
    if (accInput) accInput.focus();
  }
  if (window.lucide) lucide.createIcons();
}

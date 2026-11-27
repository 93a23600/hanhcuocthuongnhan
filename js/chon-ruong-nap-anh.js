/* MODULE 2: CHỌN RƯƠNG ĐÍCH KHI NẠP ẢNH (js/chon-ruong-nap-anh.js) */

window.selectedChestNum = window.selectedChestNum || "Rương 1";

function syncCustomChestInput() {
  const input = document.getElementById("customChestInput");
  if (!input) return;
  const val = (input.value || "").trim();
  if (val) {
    window.selectedChestNum = val;
  }
}

window.renderUploadChestChoiceButtons = function(targetAcc) {
  const grid = document.getElementById("uploadChestButtonsGrid");
  if (!grid) return;

  const cleanAcc = (targetAcc || "").trim().toLowerCase();
  const baseTitles = ["Rương 1", "Rương 2", "Rương 3"];
  const allTitles = [...baseTitles];

  (appState.chests || []).forEach(c => {
    const cAcc = (c.account || "").trim().toLowerCase();
    const cTitle = (c.title || "").trim();
    if (!cTitle) return;
    if ((!cleanAcc || cAcc === cleanAcc) && !allTitles.some(t => t.toLowerCase() === cTitle.toLowerCase())) {
      allTitles.push(cTitle);
    }
  });

  if (appState.viewingChest && !allTitles.some(t => t.toLowerCase() === appState.viewingChest.trim().toLowerCase())) {
    allTitles.push(appState.viewingChest.trim());
  }

  const customInput = document.getElementById("customChestInput");
  const customVal = customInput && !customInput.classList.contains("hidden")
    ? (customInput.value || "").trim()
    : "";

  if (customVal) {
    window.selectedChestNum = customVal;
  } else if (!window.selectedChestNum) {
    if (cleanAcc && appState.viewingAcc && appState.viewingAcc.trim().toLowerCase() === cleanAcc && appState.viewingChest) {
      window.selectedChestNum = appState.viewingChest.trim();
    } else {
      window.selectedChestNum = allTitles[0] || "Rương 1";
    }
  }

  const btnsHtml = allTitles.map(title => {
    const isActive = !customVal && (window.selectedChestNum || "").toLowerCase() === title.toLowerCase();
    const cls = isActive
      ? "btn-chest-num py-2 px-2 rounded-xl border border-emerald-500 bg-emerald-950/40 text-emerald-400 font-bold truncate"
      : "btn-chest-num py-2 px-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 font-bold truncate";
    return `<button type="button" class="${cls}" data-num="${title}">${title}</button>`;
  }).join("");

  grid.innerHTML = `${btnsHtml}<button type="button" id="btnCustomChestNum" class="py-2 px-2 rounded-xl border border-dashed border-slate-600 bg-slate-950 text-slate-400 font-semibold">+ Khác</button>`;

  grid.querySelectorAll(".btn-chest-num").forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      grid.querySelectorAll(".btn-chest-num").forEach(b => {
        b.classList.remove("border-emerald-500", "text-emerald-400", "bg-emerald-950/40");
        b.classList.add("bg-slate-800", "text-slate-300");
      });
      btn.classList.add("border-emerald-500", "text-emerald-400", "bg-emerald-950/40");
      btn.classList.remove("bg-slate-800", "text-slate-300");

      window.selectedChestNum = (btn.dataset.num || "Rương 1").trim();
      if (customInput) {
        customInput.value = "";
        customInput.classList.add("hidden");
      }
    };
  });

  const btnCustomChest = document.getElementById("btnCustomChestNum");
  if (btnCustomChest) {
    btnCustomChest.onclick = (e) => {
      e.preventDefault();
      grid.querySelectorAll(".btn-chest-num").forEach(b => {
        b.classList.remove("border-emerald-500", "text-emerald-400", "bg-emerald-950/40");
        b.classList.add("bg-slate-800", "text-slate-300");
      });
      if (customInput) {
        customInput.classList.remove("hidden");
        customInput.focus();
        syncCustomChestInput();
      }
    };
  }

  if (customInput && !customInput.dataset.boundChestSync) {
    customInput.dataset.boundChestSync = "1";
    customInput.addEventListener("input", syncCustomChestInput);
    customInput.addEventListener("change", syncCustomChestInput);
  }
};

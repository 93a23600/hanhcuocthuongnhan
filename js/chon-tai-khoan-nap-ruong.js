/* MODULE 1: CHỌN TÀI KHOẢN KHI NẠP RƯƠNG (js/chon-tai-khoan-nap-ruong.js) */

function getAllExistingAccounts() {
  const accMap = new Map();
  (appState.accounts || []).forEach(a => {
    const clean = (a || "").trim();
    if (clean && !accMap.has(clean.toLowerCase())) {
      accMap.set(clean.toLowerCase(), clean);
    }
  });
  (appState.chests || []).forEach(c => {
    const clean = (c.account || "").trim();
    if (clean && !accMap.has(clean.toLowerCase())) {
      accMap.set(clean.toLowerCase(), clean);
    }
  });
  if (appState.viewingAcc) {
    const clean = appState.viewingAcc.trim();
    if (clean && !accMap.has(clean.toLowerCase())) {
      accMap.set(clean.toLowerCase(), clean);
    }
  }
  return Array.from(accMap.values());
}

window.setupAccountPickerDropdown = function() {
  const accInput = document.getElementById("inputAccountName");
  if (!accInput) return;

  accInput.removeAttribute("list");
  accInput.setAttribute("autocomplete", "off");

  const parent = accInput.parentElement;
  if (!parent) return;
  parent.classList.add("relative");

  let dropdown = document.getElementById("customAccountDropdownList");
  if (!dropdown) {
    dropdown = document.createElement("div");
    dropdown.id = "customAccountDropdownList";
    dropdown.className = "hidden absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[70] max-h-48 overflow-y-auto py-1 divide-y divide-slate-800/80";
    parent.appendChild(dropdown);
  }

  const renderAccountOptions = () => {
    const allAccs = getAllExistingAccounts();
    const currentVal = accInput.value.trim().toLowerCase();

    if (allAccs.length === 0) {
      dropdown.innerHTML = `<div class="px-3 py-2 text-[11px] text-slate-400 italic">Chưa có tài khoản nào. Hãy nhập tên tài khoản mới ở trên.</div>`;
    } else {
      const itemsHtml = allAccs.map(acc => {
        const isSelected = acc.toLowerCase() === currentVal;
        const chestCount = (appState.chests || []).filter(c => (c.account || "").trim().toLowerCase() === acc.toLowerCase()).length;
        return `
          <button type="button" data-acc="${acc.replace(/"/g, '&quot;')}"
            class="acc-dropdown-item w-full text-left px-3 py-2 text-xs flex items-center justify-between transition ${
              isSelected
                ? "bg-emerald-950/70 text-emerald-300 font-bold"
                : "text-slate-200 hover:bg-slate-800 font-medium"
            }">
            <span class="truncate">${acc}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 shrink-0 ml-2">
              ${chestCount} rương ${isSelected ? "✓" : ""}
            </span>
          </button>
        `;
      }).join("");

      dropdown.innerHTML = `
        <div class="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-950/60">
          Danh sách tài khoản đang có (${allAccs.length})
        </div>
        ${itemsHtml}
        <button type="button" id="btnNewAccFromDropdown"
          class="w-full text-left px-3 py-2 text-xs text-sky-400 hover:bg-slate-800 font-semibold flex items-center gap-1.5">
          <span>+ Nhập tên tài khoản mới...</span>
        </button>
      `;
    }

    dropdown.querySelectorAll(".acc-dropdown-item").forEach(btn => {
      btn.onmousedown = (e) => {
        e.preventDefault();
        const chosen = btn.dataset.acc;
        accInput.value = chosen;
        dropdown.classList.add("hidden");
        if (typeof window.renderUploadChestChoiceButtons === "function") {
          window.renderUploadChestChoiceButtons(chosen);
        }
      };
    });

    const btnNewAcc = document.getElementById("btnNewAccFromDropdown");
    if (btnNewAcc) {
      btnNewAcc.onmousedown = (e) => {
        e.preventDefault();
        accInput.value = "";
        dropdown.classList.add("hidden");
        accInput.focus();
        if (typeof window.renderUploadChestChoiceButtons === "function") {
          window.renderUploadChestChoiceButtons("");
        }
      };
    }

    dropdown.classList.remove("hidden");
  };

  accInput.onfocus = () => renderAccountOptions();
  accInput.onclick = () => renderAccountOptions();

  accInput.oninput = () => {
    if (typeof window.renderUploadChestChoiceButtons === "function") {
      window.renderUploadChestChoiceButtons(accInput.value);
    }
    if (!dropdown.classList.contains("hidden")) {
      renderAccountOptions();
    }
  };

  if (!window._accDropdownOutsideBound) {
    window._accDropdownOutsideBound = true;
    document.addEventListener("mousedown", (e) => {
      const inp = document.getElementById("inputAccountName");
      const dd = document.getElementById("customAccountDropdownList");
      if (!inp || !dd) return;
      if (!inp.contains(e.target) && !dd.contains(e.target)) {
        dd.classList.add("hidden");
      }
    });
  }
};

/* MODULE: CHUẨN HÓA DANH SÁCH & GỢI Ý TÊN VẬT PHẨM (js/goi-y-ten-vat-pham.js) */

function getAllUniqueItemNames() {
  const set = new Set();
  
  if (typeof KNOWN_ITEMS !== "undefined" && Array.isArray(KNOWN_ITEMS)) {
    KNOWN_ITEMS.forEach(name => { if (name) set.add(name.trim()); });
  }
  if (appState.customKnownItems && Array.isArray(appState.customKnownItems)) {
    appState.customKnownItems.forEach(name => { if (name) set.add(name.trim()); });
  }
  if (appState.learnedIcons) {
    Object.keys(appState.learnedIcons).forEach(name => { if (name) set.add(name.trim()); });
  }

  const uniqueMap = new Map();
  Array.from(set).forEach(name => {
    const lower = name.toLowerCase();
    if (!uniqueMap.has(lower)) {
      uniqueMap.set(lower, name);
    }
  });

  return Array.from(uniqueMap.values());
}

function renderDropdownSuggestions(query = "") {
  const dropdown = document.getElementById("customAutocompleteList");
  const nameInput = document.getElementById("sidePanelItemName");
  if (!dropdown || !nameInput) return;

  const allItems = getAllUniqueItemNames();
  const q = query.trim().toLowerCase();
  const matched = allItems.filter(item => item.toLowerCase().includes(q));

  dropdown.innerHTML = "";

  matched.forEach(item => {
    const samples = appState.learnedIcons?.[item];
    const sampleCount = Array.isArray(samples) ? samples.length : (samples ? 1 : 0);
    const badgeHtml = sampleCount > 0 
      ? `<span class="text-[10px] text-emerald-400 font-mono">${sampleCount} mẫu</span>` 
      : `<span class="text-[10px] text-slate-500 font-mono">Có sẵn</span>`;

    const itemEl = document.createElement("div");
    itemEl.className = "px-3 py-2 hover:bg-emerald-950/60 hover:text-emerald-300 text-slate-200 cursor-pointer flex items-center justify-between transition text-xs";
    itemEl.innerHTML = `<span>${item}</span>${badgeHtml}`;
    
    itemEl.onmousedown = (e) => {
      e.preventDefault();
      nameInput.value = item;
      dropdown.classList.add("hidden");
    };
    dropdown.appendChild(itemEl);
  });

  const exactMatch = allItems.some(i => i.toLowerCase() === q);
  if (q && !exactMatch) {
    const newEl = document.createElement("div");
    newEl.className = "px-3 py-2 bg-slate-950 hover:bg-emerald-900/40 text-amber-300 hover:text-amber-200 cursor-pointer flex items-center gap-1.5 font-semibold border-t border-slate-700/80 text-xs";
    newEl.innerHTML = `
      <i data-lucide="plus-circle" class="w-3.5 h-3.5 text-emerald-400"></i>
      <span>Thêm mới: "<strong>${query.trim()}</strong>"</span>
    `;
    newEl.onmousedown = (e) => {
      e.preventDefault();
      nameInput.value = query.trim();
      dropdown.classList.add("hidden");
    };
    dropdown.appendChild(newEl);
    if (window.lucide) lucide.createIcons();
  }

  if (matched.length > 0 || (q && !exactMatch)) {
    dropdown.classList.remove("hidden");
  } else {
    dropdown.classList.add("hidden");
  }
}

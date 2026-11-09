function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `px-4 py-2.5 rounded-xl text-xs font-medium text-white shadow-xl flex items-center gap-2 border transition-all pointer-events-auto ${
    type === "success" ? "bg-emerald-950 border-emerald-500 text-emerald-200" :
    type === "error" ? "bg-red-950 border-red-500 text-red-200" :
    "bg-slate-900 border-slate-700 text-slate-200"
  }`;
  const icon = type === "success" ? "check-circle" : type === "error" ? "alert-circle" : "info";
  toast.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4"></i> <span>${message}</span>`;
  container.appendChild(toast);
  lucide.createIcons();
  setTimeout(() => toast.remove(), 3500);
}

function updateApiKeyUI() {
  const modeBadge = document.getElementById("modeBadge");
  const modeDesc = document.getElementById("modeDesc");
  const apiKeyLabel = document.getElementById("apiKeyLabel");
  if (appState.apiKey) {
    modeBadge.className = "badge-emerald text-xs px-2 py-0.5 rounded-full font-semibold";
    modeBadge.textContent = "Gemini AI Online";
    modeDesc.textContent = "Đã kết nối API. Khi dán ảnh và xác nhận, AI sẽ quét tự động.";
    apiKeyLabel.textContent = "API: Sẵn Sàng";
  } else {
    modeBadge.className = "badge-amber text-xs px-2 py-0.5 rounded-full font-semibold";
    modeBadge.textContent = "Chế độ Demo";
    modeDesc.textContent = "Chưa cài API Key. Khi dán ảnh sẽ nạp dữ liệu mẫu.";
    apiKeyLabel.textContent = "Cài đặt API";
  }
}

function openUploadModal() {
  const dl = document.getElementById("accountSuggestions");
  dl.innerHTML = appState.accounts.map(acc => `<option value="${acc}"></option>`).join("");
  
  const accInput = document.getElementById("inputAccountName");
  if (!accInput.value.trim() && appState.accounts.length > 0) {
    accInput.value = appState.accounts[appState.accounts.length - 1];
  }

  document.getElementById("confirmUploadModal").classList.remove("hidden");
  accInput.focus();
  lucide.createIcons();
}

function renderAll() {
  const filterSelect = document.getElementById("filterAccountSelect");
  const curFilter = appState.selectedAccFilter;
  filterSelect.innerHTML = `<option value="ALL">Tất Cả Tài Khoản</option>` + 
    appState.accounts.map(acc => `<option value="${acc}">${acc}</option>`).join("");
  filterSelect.value = curFilter;

  const summary = calculateSummary();
  let grandTotal = 0;
  summary.forEach(i => { if (!i.isIgnored) grandTotal += i.totalQty; });
  document.getElementById("statAccCount").textContent = appState.accounts.length;
  document.getElementById("statChestsCount").textContent = appState.chests.length;
  document.getElementById("statTotalItems").textContent = grandTotal.toLocaleString('vi-VN');
  document.getElementById("chestTabCount").textContent = appState.chests.length;

  const tbody = document.getElementById("summaryTableBody");
  const emptyNotice = document.getElementById("emptySummaryNotice");
  tbody.innerHTML = "";

  if (summary.length === 0) {
    emptyNotice.classList.remove("hidden");
  } else {
    emptyNotice.classList.add("hidden");
    summary.forEach((item, idx) => {
      const tr = document.createElement("tr");
      tr.className = `hover:bg-slate-800/40 transition border-b border-slate-800/60 ${item.isIgnored ? 'opacity-40' : ''}`;
      const pills = Array.from(item.foundIn).map(f => `<span class="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300 mr-1 border border-slate-700">${f}</span>`).join("");
      tr.innerHTML = `
        <td class="py-3 px-4 text-center font-mono text-slate-500">${idx + 1}</td>
        <td class="py-3 px-4 font-semibold text-white flex items-center gap-2">
          <span class="w-2 h-2 rounded-full ${item.isIgnored ? 'bg-rose-500' : 'bg-emerald-500'}"></span>
          <span>${item.name}</span>
        </td>
        <td class="py-3 px-4 text-center"><span class="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">${item.stacks} ô</span></td>
        <td class="py-3 px-4 text-center">${pills}</td>
        <td class="py-3 px-4 text-right font-mono font-bold text-amber-400 text-sm">${item.totalQty.toLocaleString('vi-VN')}</td>
        <td class="py-3 px-4 text-center">
          <button onclick="toggleIgnoreItem('${item.name}')" title="Bỏ qua / Theo dõi lại" class="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400">
            <i data-lucide="${item.isIgnored ? 'eye' : 'eye-off'}" class="w-3.5 h-3.5"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  const container = document.getElementById("chestsContainer");
  const emptyChest = document.getElementById("emptyChestNotice");
  container.innerHTML = "";
  if (appState.chests.length === 0) {
    emptyChest.classList.remove("hidden");
  } else {
    emptyChest.classList.add("hidden");
    appState.chests.forEach(chest => {
      const card = document.createElement("div");
      card.className = "bg-game-card border border-slate-800 rounded-2xl p-4 space-y-3";
      const slotsHtml = chest.slots.map((s) => `
        <div class="bg-game-slot p-2 rounded-xl border border-slate-800 text-[11px] flex justify-between">
          <span class="text-slate-300 truncate">${s.name}</span>
          <span class="text-amber-400 font-mono font-bold">x${s.qty}</span>
        </div>
      `).join("");

      card.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <div>
            <span class="text-emerald-400 font-bold text-xs bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded mr-1">${chest.account}</span>
            <strong class="text-white text-sm">${chest.title}</strong>
          </div>
          <button onclick="removeChest('${chest.id}')" class="text-slate-500 hover:text-red-400 text-xs"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">${slotsHtml || '<p class="text-slate-600 text-xs italic">Trống</p>'}</div>
      `;
      container.appendChild(card);
    });
  }

  renderDiffView();
  lucide.createIcons();
}

function renderDiffView() {
  const incList = document.getElementById("diffIncreasedList");
  const decList = document.getElementById("diffDecreasedList");
  if (!appState.snapshot) {
    incList.innerHTML = `<p class="text-slate-600 italic py-3 text-center">Chưa có mốc so sánh.</p>`;
    decList.innerHTML = `<p class="text-slate-600 italic py-3 text-center">Chưa có mốc so sánh.</p>`;
    return;
  }
  const cur = {};
  appState.chests.forEach(c => c.slots.forEach(s => cur[s.name] = (cur[s.name] || 0) + (parseInt(s.qty) || 0)));
  const allNames = Array.from(new Set([...Object.keys(cur), ...Object.keys(appState.snapshot)]));
  const diffs = allNames.map(name => ({ name, diff: (cur[name] || 0) - (appState.snapshot[name] || 0) }));

  const inc = diffs.filter(d => d.diff > 0).sort((a,b) => b.diff - a.diff);
  const dec = diffs.filter(d => d.diff < 0).sort((a,b) => a.diff - b.diff);

  incList.innerHTML = inc.map(d => `<div class="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between"><span>${d.name}</span><b class="text-emerald-400 font-mono">+${d.diff.toLocaleString()}</b></div>`).join("") || '<p class="text-slate-600 italic">Không có</p>';
  decList.innerHTML = dec.map(d => `<div class="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between"><span>${d.name}</span><b class="text-rose-400 font-mono">${d.diff.toLocaleString()}</b></div>`).join("") || '<p class="text-slate-600 italic">Không có</p>';
}

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `px-4 py-2.5 rounded-xl text-xs font-medium text-white shadow-xl flex items-center gap-2 border transition-all duration-300 pointer-events-auto transform translate-y-2 opacity-0 ${
    type === "success" ? "bg-emerald-950 border-emerald-500 text-emerald-200" :
    type === "error" ? "bg-red-950 border-red-500 text-red-200" :
    "bg-slate-900 border-slate-700 text-slate-200"
  }`;
  
  const icon = type === "success" ? "check-circle" : type === "error" ? "alert-circle" : "info";
  toast.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4"></i> <span>${message}</span>`;
  container.appendChild(toast);
  lucide.createIcons();

  requestAnimationFrame(() => toast.classList.remove("translate-y-2", "opacity-0"));
  setTimeout(() => {
    toast.classList.add("translate-y-2", "opacity-0");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function updateApiKeyUI() {
  const modeBadge = document.getElementById("modeBadge");
  const modeDesc = document.getElementById("modeDesc");
  const apiKeyLabel = document.getElementById("apiKeyLabel");

  if (appState.apiKey && appState.apiKey.trim().length > 0) {
    modeBadge.className = "badge-emerald text-xs px-2 py-0.5 rounded-full font-semibold";
    modeBadge.textContent = "Gemini AI Online";
    modeDesc.innerHTML = `Đã kết nối Gemini API. Khi dán ảnh (<kbd class="px-1 py-0.5 rounded bg-slate-800 text-[10px]">Ctrl+V</kbd>), hệ thống sẽ trực tiếp gọi mô hình AI để nhận diện từng ô đồ.`;
    apiKeyLabel.textContent = "API: Sẵn Sàng";
  } else {
    modeBadge.className = "badge-amber text-xs px-2 py-0.5 rounded-full font-semibold";
    modeBadge.textContent = "Chế độ Demo";
    modeDesc.textContent = "Chưa cài API Key. Khi dán hoặc thả ảnh, hệ thống sẽ sử dụng bộ dữ liệu giả lập thông minh. Bạn có thể bấm 'Cài đặt API' để kích hoạt AI thực tế.";
    apiKeyLabel.textContent = "Cài đặt API";
  }
}

function renderTargetChestSelect() {
  const select = document.getElementById("targetChestSelect");
  const currentVal = select.value;
  select.innerHTML = appState.chests.map((c) => `
    <option value="${c.id}">${c.title} (${c.slots.length} ô có đồ)</option>
  `).join("");

  if (currentVal && appState.chests.some(c => c.id === currentVal)) {
    select.value = currentVal;
  }
}

function renderAll() {
  renderTargetChestSelect();
  const summaryData = calculateInventorySummary();
  const summaryTableBody = document.getElementById("summaryTableBody");
  const emptySummaryNotice = document.getElementById("emptySummaryNotice");

  let grandTotalQty = 0;
  summaryData.forEach(item => {
    if (!item.isIgnored) grandTotalQty += item.totalQty;
  });

  document.getElementById("statChestsCount").textContent = appState.chests.length;
  document.getElementById("statUniqueItems").textContent = summaryData.filter(i => !i.isIgnored).length;
  document.getElementById("statTotalItems").textContent = grandTotalQty.toLocaleString('vi-VN');
  document.getElementById("chestTabCount").textContent = appState.chests.length;

  summaryTableBody.innerHTML = "";
  if (summaryData.length === 0) {
    emptySummaryNotice.classList.remove("hidden");
  } else {
    emptySummaryNotice.classList.add("hidden");
    summaryData.forEach((item, index) => {
      const tr = document.createElement("tr");
      tr.className = `hover:bg-slate-800/40 transition group border-b border-slate-800/60 ${item.isIgnored ? 'opacity-40 bg-slate-900/30' : ''}`;

      const chestPills = Array.from(item.foundChests).map(c => 
        `<span class="inline-block px-2 py-0.5 text-[11px] rounded-md bg-slate-800 border border-slate-700/60 text-slate-300 mr-1">${c}</span>`
      ).join("");

      tr.innerHTML = `
        <td class="py-3 px-4 text-center font-mono text-slate-500">${index + 1}</td>
        <td class="py-3 px-4 font-semibold text-white flex items-center gap-2">
          <span class="w-2 h-2 rounded-full ${item.isIgnored ? 'bg-rose-500' : 'bg-emerald-500'}"></span>
          <span>${item.name}</span>
          ${item.isIgnored ? '<span class="text-[10px] text-rose-400 bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-800">Bỏ qua</span>' : ''}
        </td>
        <td class="py-3 px-4 text-center">
          <span class="font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300">${item.stackCount} ô</span>
        </td>
        <td class="py-3 px-4 text-center">${chestPills}</td>
        <td class="py-3 px-4 text-right font-mono font-bold text-amber-400 text-sm sm:text-base">
          ${item.totalQty.toLocaleString('vi-VN')}
        </td>
        <td class="py-3 px-4 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="toggleIgnoreItem('${item.name}')" title="${item.isIgnored ? 'Bật theo dõi lại' : 'Bỏ qua không kiểm'}" class="p-1.5 rounded-lg ${item.isIgnored ? 'bg-sky-900/60 text-sky-300 border border-sky-700' : 'bg-slate-800 text-slate-400 hover:text-amber-400'} transition">
              <i data-lucide="${item.isIgnored ? 'eye' : 'eye-off'}" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="copySingleItemSummary('${item.name}', ${item.totalQty})" title="Sao chép tên & số lượng" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      `;
      summaryTableBody.appendChild(tr);
    });
  }

  const chestsContainer = document.getElementById("chestsContainer");
  const emptyChestNotice = document.getElementById("emptyChestNotice");
  chestsContainer.innerHTML = "";

  if (appState.chests.length === 0) {
    emptyChestNotice.classList.remove("hidden");
  } else {
    emptyChestNotice.classList.add("hidden");
    appState.chests.forEach((chest, chestIdx) => {
      const chestCard = document.createElement("div");
      chestCard.className = "bg-game-card border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4";
      
      let chestTotalQty = 0;
      chest.slots.forEach(s => chestTotalQty += (parseInt(s.qty) || 0));

      const slotsHtml = chest.slots.map((slot, slotIdx) => `
        <div onclick="openEditSlotModal('${chest.id}', ${slotIdx})" class="group cursor-pointer bg-game-slot border border-slate-800 hover:border-emerald-500/80 rounded-xl p-2.5 flex flex-col justify-between transition relative hover:scale-105">
          <div class="text-[11px] font-medium text-slate-300 truncate" title="${slot.name}">
            ${slot.name}
          </div>
          <div class="mt-2 flex items-center justify-between">
            <span class="text-[10px] text-slate-500">Ô ${slotIdx + 1}</span>
            <span class="text-xs font-mono font-bold text-amber-400">x${slot.qty}</span>
          </div>
        </div>
      `).join("");

      chestCard.innerHTML = `
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400 font-bold text-sm">
              ${chestIdx + 1}
            </div>
            <div>
              <h3 class="font-bold text-white text-base">${chest.title}</h3>
              <p class="text-xs text-slate-400">Thời gian: ${chest.createdAt || 'N/A'} &bull; ${chest.slots.length} ô có đồ</p>
            </div>
          </div>
          <div class="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span class="text-xs text-slate-400">Tổng: <strong class="text-amber-400 font-mono text-sm">${chestTotalQty.toLocaleString('vi-VN')}</strong></span>
            <div class="flex items-center gap-1.5">
              <button onclick="addSlotToChest('${chest.id}')" class="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 transition flex items-center gap-1">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i> <span>Thêm Ô</span>
              </button>
              <button onclick="renameChestPrompt('${chest.id}')" title="Đổi tên rương" class="p-1 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition">
                <i data-lucide="edit-2" class="w-4 h-4"></i>
              </button>
              <button onclick="removeChest('${chest.id}')" title="Xoá rương" class="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition">
                <i data-lucide="trash" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
          ${slotsHtml || '<p class="col-span-full py-4 text-center text-slate-500 italic">Rương chưa có vật phẩm</p>'}
        </div>
      `;
      chestsContainer.appendChild(chestCard);
    });
  }

  renderDiffView();
  renderChestManagerModal();
  lucide.createIcons();
}

function renderDiffView() {
  const incList = document.getElementById("diffIncreasedList");
  const decList = document.getElementById("diffDecreasedList");

  if (!appState.snapshot) {
    incList.innerHTML = `<p class="text-slate-500 italic py-4 text-center">Chưa có mốc so sánh. Bấm "Lưu Mốc So Sánh" để ghi nhận trạng thái kho ban đầu.</p>`;
    decList.innerHTML = `<p class="text-slate-500 italic py-4 text-center">Chưa có mốc so sánh.</p>`;
    return;
  }

  const currentTotals = {};
  appState.chests.forEach(c => {
    c.slots.forEach(s => {
      if (!s.name) return;
      currentTotals[s.name] = (currentTotals[s.name] || 0) + (parseInt(s.qty) || 0);
    });
  });

  const snapTotals = appState.snapshot;
  const allNames = Array.from(new Set([...Object.keys(currentTotals), ...Object.keys(snapTotals)]));

  const diffs = allNames.map(name => {
    const cur = currentTotals[name] || 0;
    const old = snapTotals[name] || 0;
    return { name, diff: cur - old, cur, old };
  });

  const inc = diffs.filter(d => d.diff > 0).sort((a, b) => b.diff - a.diff);
  const dec = diffs.filter(d => d.diff < 0).sort((a, b) => a.diff - b.diff);

  incList.innerHTML = inc.length === 0 ? '<p class="text-slate-500 italic py-3 text-center">Không có vật phẩm nào tăng thêm.</p>' :
    inc.map(d => `
      <div class="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
        <span class="font-medium text-slate-200">${d.name}</span>
        <div class="text-right">
          <span class="text-emerald-400 font-bold font-mono text-sm">+${d.diff.toLocaleString('vi-VN')}</span>
          <span class="text-[10px] text-slate-500 block">(${d.old.toLocaleString()} &rarr; ${d.cur.toLocaleString()})</span>
        </div>
      </div>
    `).join("");

  decList.innerHTML = dec.length === 0 ? '<p class="text-slate-500 italic py-3 text-center">Không có vật phẩm nào hao hụt.</p>' :
    dec.map(d => `
      <div class="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
        <span class="font-medium text-slate-200">${d.name}</span>
        <div class="text-right">
          <span class="text-rose-400 font-bold font-mono text-sm">${d.diff.toLocaleString('vi-VN')}</span>
          <span class="text-[10px] text-slate-500 block">(${d.old.toLocaleString()} &rarr; ${d.cur.toLocaleString()})</span>
        </div>
      </div>
    `).join("");
}

function renderChestManagerModal() {
  const container = document.getElementById("modalChestListContainer");
  container.innerHTML = appState.chests.map(c => `
    <div class="flex items-center justify-between gap-2 p-2 bg-slate-950 border border-slate-800 rounded-xl">
      <input type="text" value="${c.title}" onchange="updateChestTitle('${c.id}', this.value)" class="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-slate-200 flex-1 text-xs focus:outline-none focus:border-sky-500 font-medium">
      <span class="text-[11px] text-slate-500">${c.slots.length} ô</span>
      <button onclick="removeChest('${c.id}')" title="Xóa rương" class="text-slate-400 hover:text-red-400 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
    </div>
  `).join("");

  const chips = document.getElementById("modalIgnoredChips");
  chips.innerHTML = appState.ignoredItems.length === 0 ? '<span class="text-slate-500 italic">Chưa bỏ qua vật phẩm nào</span>' :
    appState.ignoredItems.map(name => `
      <span class="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700 flex items-center gap-1.5 text-xs">
        ${name}
        <i data-lucide="x" class="w-3 h-3 cursor-pointer hover:text-red-400" onclick="toggleIgnoreItem('${name}')"></i>
      </span>
    `).join("");
}

/* GIAO DIỆN CHÍNH (js/layout.js) - Lắp ghép 6 module khung giao diện */
(function renderMainLayout() {
  const headerMount = document.getElementById("appHeaderMount");
  const mainMount = document.getElementById("appMainMount");

  if (headerMount && typeof renderHeaderHTML === "function") {
    headerMount.innerHTML = renderHeaderHTML();
  }

  if (mainMount) {
    mainMount.innerHTML = `
      ${typeof renderUploadZoneHTML === "function" ? renderUploadZoneHTML() : ""}
      <section class="space-y-4">
        ${typeof renderNavigationBarHTML === "function" ? renderNavigationBarHTML() : ""}
        ${typeof renderChestTabHTML === "function" ? renderChestTabHTML() : ""}
        ${typeof renderReportTabHTML === "function" ? renderReportTabHTML() : ""}
        ${typeof renderDiffTabHTML === "function" ? renderDiffTabHTML() : ""}
      </section>
    `;
  }
})();

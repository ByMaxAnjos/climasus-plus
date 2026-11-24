/* climasus+ Studio · Guia prático — comportamento de leitura */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var body = document.body;

    // Páginas com capa ou abertura de parte recebem tratamento full-bleed.
    if (document.querySelector(".hero")) body.classList.add("cover-page");
    if (document.querySelector(".part-opener")) body.classList.add("part-page");

    // Fallback para navegadores sem :has(): a capa de EPUB/PDF não aparece no HTML.
    var cover = document.querySelector(".quarto-cover-image");
    if (cover && cover.closest("p")) cover.closest("p").style.display = "none";

    // Barra de progresso de leitura.
    var bar = document.createElement("div");
    bar.id = "reading-progress";
    bar.setAttribute("aria-hidden", "true");
    body.appendChild(bar);

    function updateProgress() {
      var root = document.documentElement;
      var max = root.scrollHeight - root.clientHeight;
      bar.style.width = max > 0 ? (root.scrollTop / max) * 100 + "%" : "0%";
    }
    document.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();

    // Destaca as aberturas de parte na barra lateral.
    var links = document.querySelectorAll(
      "#quarto-sidebar .sidebar-link, #quarto-sidebar .sidebar-item-text, #quarto-sidebar a"
    );
    links.forEach(function (link) {
      var text = (link.textContent || "").trim();
      // Remove o link redundante com o título do livro no topo da navegação.
      if (text === "climasus+ Studio") {
        var duplicate = link.closest(".sidebar-item");
        if (duplicate) duplicate.style.display = "none";
      }
      if (/^\s*(?:\d+\s*)?Parte\s+[IVX]+\b/.test(text)) {
        link.classList.add("part-link");
        var item = link.closest(".sidebar-item");
        if (item) item.classList.add("sidebar-part-item");
      }
    });

    // Fotos de conteúdo carregam sob demanda, sem atrasar a primeira dobra.
    var figures = document.querySelectorAll("#quarto-document-content figure img");
    figures.forEach(function (img, i) {
      if (i > 1) img.setAttribute("loading", "lazy");
      img.setAttribute("decoding", "async");
    });

    // Tabelas largas ganham rolagem horizontal sem quebrar a coluna de texto.
    document.querySelectorAll("#quarto-document-content table").forEach(function (table) {
      if (table.parentElement && table.parentElement.classList.contains("table-scroll")) return;
      var wrap = document.createElement("div");
      wrap.className = "table-scroll";
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });

    // Links externos abrem em nova aba com rel seguro.
    document.querySelectorAll('#quarto-document-content a[href^="http"]').forEach(function (a) {
      if (a.hostname && a.hostname !== window.location.hostname) {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      }
    });

    // Mantém o foco visível ao navegar por âncoras.
    document.querySelectorAll('#quarto-document-content a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function () {
        var id = a.getAttribute("href").slice(1);
        var target = document.getElementById(id);
        if (target) {
          target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
        }
      });
    });
  });
})();

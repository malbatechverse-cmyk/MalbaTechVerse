/**
 * Malba TechVerse — Barra de navegação inferior
 * Injeta o HTML da nav e marca o item ativo conforme a página atual.
 */
(function () {
  const current = window.location.pathname.split("/").pop();

  const nav = document.createElement("nav");
  nav.className = "bottom-nav";
  nav.innerHTML = `
    <a class="nav-item ${current === "mapa.html" ? "active" : ""}" href="mapa.html">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 010 20 15 15 0 010-20z"/></svg>
      Mapa
    </a>
    <a class="nav-item ${current === "perfil.html" ? "active" : ""}" href="perfil.html">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>
      Perfil
    </a>
  `;
  const scannerLink = document.createElement("a");
  scannerLink.className = `nav-item scanner-btn ${current === "scanner.html" ? "active" : ""}`;
  scannerLink.href = "scanner.html";
  scannerLink.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M20 14v.01M14 20h3M20 17.99V20"/></svg>`;
  nav.insertBefore(scannerLink, nav.children[1]);

  document.addEventListener("DOMContentLoaded", () => document.body.appendChild(nav));
})();

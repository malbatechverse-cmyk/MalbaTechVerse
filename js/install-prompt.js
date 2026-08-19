/**
 * Malba TechVerse — Instalação do app
 * ------------------------------------
 * Android/Chrome: NÃO usa popup próprio. Guarda o evento
 *   `beforeinstallprompt` e abre a caixa NATIVA do Chrome ("Instalar app")
 *   já no primeiro toque da pessoa em qualquer lugar da tela.
 *   O Chrome obriga que esse toque exista — um site não pode abrir essa
 *   caixa sozinho, é uma trava de segurança do próprio navegador.
 * iOS/Safari: a Apple não oferece esse evento nem essa caixa, então aí
 *   mostramos nosso popup com o passo a passo manual
 *   (Compartilhar > Adicionar à Tela de Início).
 * Chrome sem instalação disponível: mostramos nosso popup explicando como
 *   instalar pelo menu ⋮ do navegador.
 * Já instalado (modo standalone): não mostra nada.
 */

(function () {
  const STORAGE_KEY = "techverse_install_dismissed_at";
  const DISMISS_DAYS = 1; // depois de fechar, só pergunta de novo no dia seguinte
  const WAIT_FOR_NATIVE_PROMPT_MS = 3000;

  function isStandalone() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true // iOS
    );
  }

  function wasRecentlyDismissed() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const elapsedDays = (Date.now() - Number(raw)) / (1000 * 60 * 60 * 24);
    return elapsedDays < DISMISS_DAYS;
  }

  function markDismissed() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  }

  function buildModal() {
    const overlay = document.createElement("div");
    overlay.className = "install-overlay";
    overlay.innerHTML = `
      <div class="install-modal" role="dialog" aria-modal="true" aria-label="Instalar Malba TechVerse">
        <img class="install-icon" src="icons/icon-popup.png" alt="Ícone Malba TechVerse" />
        <h2>Instalar Malba TechVerse</h2>
        <p class="android-copy">Adicione à tela inicial do seu celular para abrir o app rapidinho durante a feira, sem precisar do navegador.</p>

        <div class="install-steps ios-steps">
          <div class="step-row"><span class="step-num">1</span> Toque no ícone <strong>Compartilhar</strong>&nbsp;⬆️ na barra do Safari</div>
          <div class="step-row"><span class="step-num">2</span> Escolha <strong>"Adicionar à Tela de Início"</strong></div>
          <div class="step-row"><span class="step-num">3</span> Toque em <strong>"Adicionar"</strong> no canto superior</div>
        </div>

        <div class="install-steps android-steps" style="display:none;">
          <div class="step-row"><span class="step-num">1</span> Toque no menu <strong>⋮</strong> no canto do navegador</div>
          <div class="step-row"><span class="step-num">2</span> Escolha <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong></div>
        </div>

        <div class="install-actions">
          <button class="btn btn-primary btn-confirm">Instalar agora</button>
          <button class="dismiss-link">Agora não</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  function init() {
    if (isStandalone() || wasRecentlyDismissed()) return;

    let deferredPrompt = null;
    let nativoDisponivel = false;
    let shown = false;
    let overlay = null;
    let dismissBtn = null;
    let confirmBtn = null;
    let androidSteps = null;

    function garantirModal() {
      if (overlay) return;
      overlay = buildModal();
      dismissBtn = overlay.querySelector(".dismiss-link");
      confirmBtn = overlay.querySelector(".btn-confirm");
      androidSteps = overlay.querySelector(".android-steps");

      dismissBtn.addEventListener("click", () => {
        markDismissed();
        close();
      });

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          markDismissed();
          close();
        }
      });

      confirmBtn.addEventListener("click", async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          deferredPrompt = null;
          if (outcome !== "accepted") markDismissed();
          close();
          return;
        }
        close();
      });
    }

    function show() {
      if (shown) return;
      shown = true;
      garantirModal();
      requestAnimationFrame(() => overlay.classList.add("visible"));
    }

    function close() {
      if (!overlay) return;
      overlay.classList.remove("visible");
      const ref = overlay;
      setTimeout(() => ref.remove(), 350);
      overlay = null;
      shown = false;
    }

    if (isIOS()) {
      // Sem beforeinstallprompt no iOS: só resta o passo a passo manual.
      garantirModal();
      overlay.classList.add("ios");
      shown = true;
      requestAnimationFrame(() => overlay.classList.add("visible"));
      return;
    }

    // Android/Chrome/Edge: abre a caixa NATIVA do Chrome direto no primeiro
    // toque da pessoa na tela — sem passar pelo nosso popup. O Chrome exige
    // esse toque; não deixa o site abrir a caixa sozinho.
    function registrarNativo(event) {
      deferredPrompt = event;
      nativoDisponivel = true;

      // Se o popup manual já estava na tela, tira ele: agora temos o nativo.
      if (shown) close();

      const dispararNativo = async () => {
        if (!deferredPrompt) return;
        const prompt = deferredPrompt;
        deferredPrompt = null;
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome !== "accepted") markDismissed();
      };

      // { once: true } = dispara só no primeiro toque e se remove sozinho.
      document.addEventListener("pointerdown", dispararNativo, { once: true });
    }

    // Caso 1: o evento já foi capturado pelo script no <head>, antes deste
    // arquivo (que tem defer) rodar.
    if (window.__bipEvent) {
      registrarNativo(window.__bipEvent);
    }

    // Caso 2: o evento chega depois — o script do <head> avisa por "bip-ready".
    window.addEventListener("bip-ready", () => {
      if (window.__bipEvent) registrarNativo(window.__bipEvent);
    });

    // Se o Chrome não liberar a instalação (evento nunca chega), mostramos
    // nosso popup com o passo a passo pelo menu do navegador.
    setTimeout(() => {
      if (nativoDisponivel || shown) return;
      garantirModal();
      androidSteps.style.display = "flex";
      confirmBtn.textContent = "Entendi";
      overlay.classList.add("manual-fallback");
      shown = true;
      requestAnimationFrame(() => overlay.classList.add("visible"));
    }, WAIT_FOR_NATIVE_PROMPT_MS);

    window.addEventListener("appinstalled", close);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

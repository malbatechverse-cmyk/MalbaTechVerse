/**
 * Malba TechVerse — Popup "Instalar app"
 * ---------------------------------------
 * Android/Chrome: escuta `beforeinstallprompt` e, se ele disparar a tempo,
 *   mostra o popup com botão "Instalar" que aciona o prompt nativo.
 * IMPORTANTE: como o site é multi-página (cada troca de tela recarrega o
 *   JS do zero), esse evento é instável — o Chrome não garante disparar
 *   ele de novo em toda navegação. Por isso, se ele não chegar em ~2s,
 *   mostramos o popup mesmo assim com instrução manual (menu do navegador
 *   > "Instalar app" / "Adicionar à tela inicial"), do mesmo jeito que já
 *   fazemos no iOS (que nunca tem esse evento).
 * Já instalado (modo standalone): não mostra nada.
 */

(function () {
  const STORAGE_KEY = "techverse_install_dismissed_at";
  const DISMISS_DAYS = 7; // depois de fechar, só pergunta de novo em 7 dias
  const WAIT_FOR_NATIVE_PROMPT_MS = 2000;

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
        <img class="install-icon" src="icons/icon-192.png" alt="Ícone Malba TechVerse" />
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
    let shown = false;
    const overlay = buildModal();
    const dismissBtn = overlay.querySelector(".dismiss-link");
    const confirmBtn = overlay.querySelector(".btn-confirm");
    const androidSteps = overlay.querySelector(".android-steps");

    function show() {
      if (shown) return;
      shown = true;
      requestAnimationFrame(() => overlay.classList.add("visible"));
    }

    function close() {
      overlay.classList.remove("visible");
      setTimeout(() => overlay.remove(), 350);
    }

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

    if (isIOS()) {
      // Sem beforeinstallprompt no iOS: mostra o popup com instrução manual direto.
      overlay.classList.add("ios");
      show();
      return;
    }

    // Android/Chrome/Edge: se o navegador liberar o prompt nativo, usamos ele.
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredPrompt = event;
      show();
    });

    // Se o evento nativo não chegar a tempo (comum navegando entre páginas),
    // mostra o popup mesmo assim com instrução manual de menu.
    setTimeout(() => {
      if (!shown && !deferredPrompt) {
        androidSteps.style.display = "flex";
        confirmBtn.textContent = "Entendi";
        overlay.classList.add("manual-fallback");
      }
      show();
    }, WAIT_FOR_NATIVE_PROMPT_MS);

    confirmBtn.addEventListener("click", async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        if (outcome !== "accepted") markDismissed();
        close();
        return;
      }
      // Sem prompt nativo disponível: já estamos mostrando as instruções
      // manuais no corpo do popup, então só confirma e fecha.
      close();
    });

    window.addEventListener("appinstalled", close);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

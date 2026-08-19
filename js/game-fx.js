/**
 * Malba TechVerse — Efeitos de jogo (confete + popup de pontos)
 * Compartilhado entre scanner.js e admin.js pra celebrar ganhos.
 */
function popupPontos(texto) {
  const el = document.createElement("div");
  el.className = "points-popup";
  el.textContent = texto;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("fire"));
  setTimeout(() => el.remove(), 1200);
}

function dispararConfete(qtd = 24) {
  const cores = ["#f5a623", "#4fd6d2", "#ffffff", "#ffb84d"];
  for (let i = 0; i < qtd; i++) {
    const p = document.createElement("div");
    p.className = "confetti-piece";
    p.style.left = Math.random() * 100 + "vw";
    p.style.background = cores[i % cores.length];
    p.style.animationDuration = 1.4 + Math.random() * 1.2 + "s";
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 2800);
  }
}

if (navigator.vibrate) {
  window.vibrarSucesso = () => navigator.vibrate(40);
} else {
  window.vibrarSucesso = () => {};
}

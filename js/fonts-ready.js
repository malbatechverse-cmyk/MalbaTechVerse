/**
 * Malba TechVerse — Espera as fontes carregarem antes de liberar as
 * animações de entrada. Evita qualquer efeito de "fantasma"/franja no
 * texto que alguns navegadores mobile produzem quando uma animação roda
 * bem no momento em que a fonte web troca a fonte alternativa.
 */
(function () {
  function marcarPronto() {
    document.documentElement.classList.add("fonts-loaded");
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(marcarPronto).catch(marcarPronto);
    // Segurança: se por algum motivo nunca resolver, libera mesmo assim.
    setTimeout(marcarPronto, 1500);
  } else {
    marcarPronto();
  }
})();

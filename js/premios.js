/**
 * Malba TechVerse — Catálogo de prêmios
 * Convidado (login anônimo) não ganha pontos nem resgata prêmios,
 * então não vê o catálogo: só uma mensagem explicando.
 */

function mostrarAvisoConvidado() {
  const grid = document.getElementById("prem-grid");
  grid.innerHTML = "<p style='color:var(--color-muted)'>Convidado não ganha pontos nem resgata prêmios. Para participar, saia e entre com sua conta.</p>";
}

function carregarCatalogo() {
  db.collection("premios").orderBy("pontos").get().then((snap) => {
    const grid = document.getElementById("prem-grid");
    if (snap.empty) { grid.innerHTML = "<p style='color:var(--color-muted)'>Nenhum prêmio cadastrado ainda.</p>"; return; }
    snap.forEach((doc) => {
      const p = doc.data();
      const esgotado = (p.estoque || 0) <= 0;
      const el = document.createElement("div");
      el.className = "card-badge prem-card" + (esgotado ? " esgotado" : "");
      el.innerHTML = `
        <img src="${p.foto || 'img/malba.png'}" alt="${p.nome || ''}" />
        <div>
          <div class="prem-nome">${p.nome || ""}</div>
          <div class="prem-pts"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.2 21 12 17.77 5.8 21 7 14.14l-5-4.87 7.1-1.01L12 2z"/></svg>${p.pontos || 0} pontos</div>
          <div class="prem-estoque">${esgotado ? "Esgotado" : (p.estoque || 0) + " disponíveis"}</div>
        </div>`;
      grid.appendChild(el);
    });
  });
}

auth.onAuthStateChanged((user) => {
  if (!user) return; // exigirLogin() cuida do redirecionamento
  if (user.isAnonymous) mostrarAvisoConvidado();
  else carregarCatalogo();
});

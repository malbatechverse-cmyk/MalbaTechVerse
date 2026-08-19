/**
 * Malba TechVerse — Perfil do usuário
 * O QR Code gerado aqui é o "código pessoal" do usuário: pode ser usado,
 * por exemplo, para um staff escanear e confirmar presença/retirar prêmio.
 */

function animarContagem(el, valorFinal) {
  const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduzMovimento || valorFinal === 0) { el.textContent = valorFinal; return; }
  const duracao = 700;
  const inicio = performance.now();
  function passo(agora) {
    const t = Math.min(1, (agora - inicio) / duracao);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(ease * valorFinal);
    if (t < 1) requestAnimationFrame(passo);
  }
  requestAnimationFrame(passo);
}

auth.onAuthStateChanged(async (user) => {
  if (!user) return;

  const doc = await db.collection("usuarios").doc(user.uid).get();
  const dados = doc.data() || {};

  document.getElementById("nome-usuario").textContent = "Nome: " + (dados.nome || user.displayName || "");
  animarContagem(document.getElementById("pontos-usuario"), dados.pontos || 0);

  const total = (typeof BARRACA_IDS !== "undefined" && BARRACA_IDS.length) || 25;
  const coletadas = (dados.barracasColetadas || []).length;
  document.getElementById("barracas-count").textContent = `${coletadas}/${total}`;
  document.getElementById("barracas-fill").style.width = `${Math.min(100, (coletadas / total) * 100)}%`;

  if (dados.foto || user.photoURL) {
    document.getElementById("foto-usuario").src = dados.foto || user.photoURL;
  }

  new QRious({
    element: document.getElementById("qrcode-canvas"),
    value: `techverse-user:${user.uid}`,
    size: 220,
    background: "#ffffff",
    foreground: "#0e0c22",
    level: "H"
  });

  await carregarPremiosGanhos(dados.premiosResgatados || []);
});

async function carregarPremiosGanhos(ids) {
  const lista = document.getElementById("lista-premios-ganhos");
  const vazio = document.getElementById("premios-vazio");
  if (!lista) return;

  if (ids.length === 0) {
    vazio.style.display = "block";
    return;
  }
  vazio.style.display = "none";

  const docs = await Promise.all(ids.map((id) => db.collection("premios").doc(id).get()));

  docs.forEach((doc) => {
    if (!doc.exists) return;
    const premio = doc.data();
    const item = document.createElement("li");
    item.textContent = premio.nome || "Prêmio";
    lista.appendChild(item);
  });
}

document.getElementById("logout").addEventListener("click", async () => {
  await auth.signOut();
  window.location.href = "index.html";
});

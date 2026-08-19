/**
 * Malba TechVerse — Painel Admin
 * Acesso: só usuários com usuarios/{uid}.admin === true (defina manualmente
 * no Firestore Console).
 * Cadastro: coleção "premios" { nome, foto, pontos, estoque }.
 * Resgate: admin escaneia o QR pessoal do aluno (techverse-user:{uid}),
 * escolhe o prêmio; transação desconta pontos do usuário e 1 do estoque.
 */

auth.onAuthStateChanged(async (user) => {
  if (!user) return;
  const doc = await db.collection("usuarios").doc(user.uid).get();
  if (!(doc.data() || {}).admin) {
    document.body.innerHTML = "<p style='color:#fff;padding:40px;text-align:center;'>Acesso restrito ao admin.</p>";
    return;
  }
  carregarPremios();
});

// --- Tabs ---
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
  });
});

// --- Cadastro ---
document.getElementById("btn-salvar").addEventListener("click", async () => {
  const nome = document.getElementById("p-nome").value.trim();
  const foto = document.getElementById("p-foto").value.trim();
  const pontos = Number(document.getElementById("p-pontos").value);
  const estoque = Number(document.getElementById("p-estoque").value);
  const msg = document.getElementById("msg-cadastro");

  if (!nome || !pontos || !estoque) { msg.textContent = "Preencha nome, pontos e estoque."; return; }

  await db.collection("premios").add({ nome, foto, pontos, estoque });
  msg.textContent = "Prêmio salvo!";
  ["p-nome","p-foto","p-pontos","p-estoque"].forEach((id) => document.getElementById(id).value = "");
  carregarPremios();
});

async function carregarPremios() {
  const lista = document.getElementById("lista-premios");
  lista.innerHTML = "";
  const snap = await db.collection("premios").get();
  snap.forEach((doc) => {
    const p = doc.data();
    const el = document.createElement("div");
    el.className = "prem-item";
    el.innerHTML = `<img src="${p.foto || 'img/malba.png'}" />
      <div class="info">${p.nome}<br>${p.pontos} pts · estoque: ${p.estoque}</div>
      <button data-id="${doc.id}">Excluir</button>`;
    el.querySelector("button").addEventListener("click", async () => {
      await db.collection("premios").doc(doc.id).delete();
      carregarPremios();
    });
    lista.appendChild(el);
  });
}

// --- Resgate manual ---
let html5QrCode, alunoUid = null;

document.getElementById("btn-scan").addEventListener("click", async () => {
  html5QrCode = new Html5Qrcode("reader");
  await html5QrCode.start({ facingMode: "environment" }, { fps: 10 }, onScan, () => {});
});

async function onScan(texto) {
  if (!texto.startsWith("techverse-user:")) return;
  alunoUid = texto.replace("techverse-user:", "");
  await html5QrCode.stop(); await html5QrCode.clear();

  const doc = await db.collection("usuarios").doc(alunoUid).get();
  const u = doc.data() || {};
  document.getElementById("resgate-user").textContent = `${u.nome || "Aluno"} — ${u.pontos || 0} pontos`;

  const premSnap = await db.collection("premios").get();
  const lista = document.getElementById("lista-resgate");
  lista.innerHTML = "";
  premSnap.forEach((pd) => {
    const p = pd.data();
    const el = document.createElement("div");
    el.className = "prem-item";
    el.innerHTML = `<img src="${p.foto || 'img/malba.png'}" />
      <div class="info">${p.nome}<br>${p.pontos} pts · estoque: ${p.estoque}</div>
      <button ${p.estoque <= 0 ? "disabled" : ""} data-id="${pd.id}">Resgatar</button>`;
    el.querySelector("button").addEventListener("click", () => resgatar(pd.id));
    lista.appendChild(el);
  });
}

async function resgatar(premioId) {
  const msg = document.getElementById("msg-resgate");
  const userRef = db.collection("usuarios").doc(alunoUid);
  const premioRef = db.collection("premios").doc(premioId);

  try {
    await db.runTransaction(async (t) => {
      const uDoc = await t.get(userRef);
      const pDoc = await t.get(premioRef);
      const u = uDoc.data(), p = pDoc.data();
      if ((u.pontos || 0) < p.pontos) throw new Error("SEM_PONTOS");
      if ((p.estoque || 0) <= 0) throw new Error("SEM_ESTOQUE");
      t.update(userRef, { pontos: firebase.firestore.FieldValue.increment(-p.pontos) });
      t.update(premioRef, { estoque: firebase.firestore.FieldValue.increment(-1) });
    });
    msg.style.color = "#8f8";
    msg.textContent = "Resgate confirmado!";
    if (typeof dispararConfete === "function") dispararConfete(30);
    if (typeof vibrarSucesso === "function") vibrarSucesso();
    onScan("techverse-user:" + alunoUid); // atualiza tela
  } catch (err) {
    msg.style.color = "#f88";
    msg.textContent = err.message === "SEM_PONTOS" ? "Aluno não tem pontos suficientes." :
                       err.message === "SEM_ESTOQUE" ? "Prêmio esgotado." : "Erro ao resgatar.";
  }
}

/**
 * Malba TechVerse — Autenticação
 * --------------------------------
 * Login com Google via Firebase Auth. Ao entrar pela 1ª vez, cria o
 * documento do usuário em /usuarios/{uid} no Firestore, com 0 pontos.
 */

const DOMINIO_ESCOLA = "@escola.pr.gov.br";

document.getElementById("google-signin")?.addEventListener("click", async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ hd: DOMINIO_ESCOLA.slice(1) });

  try {
    const result = await auth.signInWithPopup(provider);
    const user = result.user;

    if (!user.email || !user.email.toLowerCase().endsWith(DOMINIO_ESCOLA)) {
      await user.delete().catch(() => auth.signOut());
      alert(`Use um e-mail ${DOMINIO_ESCOLA} para entrar com Google, ou faça login por telefone.`);
      return;
    }

    const userRef = db.collection("usuarios").doc(user.uid);
    const snap = await userRef.get();

    if (!snap.exists) {
      await userRef.set({
        nome: user.displayName || "",
        email: user.email || "",
        foto: user.photoURL || "",
        pontos: 0,
        atividadesConcluidas: [],
        criadoEm: firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    window.location.href = "mapa.html";
  } catch (err) {
    console.error("Erro no login com Google:", err);
    alert("Não foi possível entrar com o Google. Tente novamente.");
  }
});

document.getElementById("guest-signin")?.addEventListener("click", async () => {
  try {
    const result = await auth.signInAnonymously();
    const user = result.user;

    const userRef = db.collection("usuarios").doc(user.uid);
    const snap = await userRef.get();

    if (!snap.exists) {
      await userRef.set({
        nome: "Convidado",
        convidado: true,
        pontos: 0,
        atividadesConcluidas: [],
        premiosResgatados: [],
        criadoEm: firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    mostrarAvisoConvidado();
  } catch (err) {
    console.error("Erro no login de convidado:", err);
    alert("Não foi possível entrar como convidado. Tente novamente.");
  }
});

function mostrarAvisoConvidado() {
  const overlay = document.getElementById("convidado-overlay");
  const countdown = document.getElementById("convidado-countdown");
  if (!overlay) { window.location.href = "mapa.html"; return; }

  overlay.classList.add("visible");
  let restante = 5;
  countdown.textContent = `Continuando em ${restante}s...`;

  const intervalo = setInterval(() => {
    restante -= 1;
    if (restante > 0) {
      countdown.textContent = `Continuando em ${restante}s...`;
    } else {
      clearInterval(intervalo);
      window.location.href = "mapa.html";
    }
  }, 1000);
}

// Protege as páginas internas: se não estiver logado, manda pro login.
function exigirLogin() {
  auth.onAuthStateChanged((user) => {
    if (!user) window.location.href = "index.html";
  });
}

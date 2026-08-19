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

// Protege as páginas internas: se não estiver logado, manda pro login.
function exigirLogin() {
  auth.onAuthStateChanged((user) => {
    if (!user) window.location.href = "index.html";
  });
}

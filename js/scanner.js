/**
 * Malba TechVerse — Scanner de barraca
 * Cada um dos 25 QR Codes fixos (js/barracas-config.js) vale 20 pontos,
 * uso único por usuário (controlado em usuarios/{uid}.barracasColetadas).
 */

// A lib desenha sozinha uma faixa cinza "Scanner paused" ao pausar a câmera
// (sem estilo, destoa do resto do app). Como já temos nossa própria UI de
// resultado (confete + popup + card), desativamos esse banner nativo.
if (typeof Html5Qrcode !== "undefined") {
  Html5Qrcode.prototype.showPausedState = function () {};
}

const PONTOS_POR_BARRACA = 20;
const modal = document.getElementById("reader-modal");
const resultBox = document.getElementById("reader-result");
let html5QrCode;

document.getElementById("open-scanner").addEventListener("click", async () => {
  modal.classList.add("open");
  resultBox.classList.remove("show");
  html5QrCode = new Html5Qrcode("reader");
  try {
    await html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10 },
      onScanSuccess,
      () => {}
    );
  } catch (err) {
    resultBox.textContent = "Não foi possível acessar a câmera.";
    resultBox.classList.add("show");
  }
});

document.getElementById("close-scanner").addEventListener("click", fecharScanner);

function fecharScanner() {
  if (html5QrCode) html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
  modal.classList.remove("open");
}

async function onScanSuccess(qrId) {
  await html5QrCode.pause(true);
  const user = auth.currentUser;
  if (!user) return;

  if (!BARRACA_IDS.includes(qrId)) {
    mostrarResultado("QR Code não reconhecido.", false);
    return;
  }

  const userRef = db.collection("usuarios").doc(user.uid);
  try {
    await db.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      const coletadas = (doc.data() || {}).barracasColetadas || [];
      if (coletadas.includes(qrId)) throw new Error("JA_COLETADO");
      t.update(userRef, {
        pontos: firebase.firestore.FieldValue.increment(PONTOS_POR_BARRACA),
        barracasColetadas: firebase.firestore.FieldValue.arrayUnion(qrId)
      });
    });
    mostrarResultado(`+${PONTOS_POR_BARRACA} pontos!`, true);
    popupPontos(`+${PONTOS_POR_BARRACA}`);
    dispararConfete();
    vibrarSucesso();
  } catch (err) {
    mostrarResultado(err.message === "JA_COLETADO" ? "Você já coletou pontos dessa barraca." : "Erro ao registrar pontos.", false);
  }
}

function mostrarResultado(texto, sucesso) {
  resultBox.textContent = texto;
  resultBox.style.color = sucesso ? "#1a7a2e" : "#a11";
  resultBox.classList.add("show");
  setTimeout(fecharScanner, 1800);
}

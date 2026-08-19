/**
 * Malba TechVerse — Login por telefone
 * ----------------------------------------
 * Fluxo do Firebase Phone Auth:
 *   1. Precisa de um reCAPTCHA invisível (exigência do Firebase p/ evitar spam de SMS).
 *   2. signInWithPhoneNumber() dispara o SMS e devolve um "confirmationResult".
 *   3. confirmationResult.confirm(codigo) finaliza o login.
 *
 * IMPORTANTE: no Firebase Console, ative "Telefone" em
 * Authentication > Sign-in method antes de testar.
 * Números de teste (sem gastar SMS de verdade) podem ser cadastrados em
 * Authentication > Sign-in method > Telefone > Números de teste.
 */

let confirmationResult = null;
let recaptchaVerifier = null;

function formatarNumero(valor) {
  // Assume Brasil (+55). Remove tudo que não é dígito.
  const digitos = valor.replace(/\D/g, "");
  return `+55${digitos}`;
}

function initRecaptcha() {
  recaptchaVerifier = new firebase.auth.RecaptchaVerifier("recaptcha-container", {
    size: "invisible"
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initRecaptcha();

  const numeroInput = document.getElementById("numero");
  const erroNumero = document.getElementById("erro-numero");
  const erroCodigo = document.getElementById("erro-codigo");
  const codeInputs = Array.from(document.querySelectorAll(".code-inputs input"));

  // Máscara simples enquanto digita
  numeroInput.addEventListener("input", () => {
    let v = numeroInput.value.replace(/\D/g, "").slice(0, 11);
    if (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    numeroInput.value = v;
  });

  document.getElementById("enviar-codigo").addEventListener("click", async () => {
    erroNumero.textContent = "";
    const numero = formatarNumero(numeroInput.value);

    if (numeroInput.value.replace(/\D/g, "").length < 10) {
      erroNumero.textContent = "Digite um número válido com DDD.";
      return;
    }

    try {
      confirmationResult = await auth.signInWithPhoneNumber(numero, recaptchaVerifier);
      document.getElementById("step-phone").classList.remove("active");
      document.getElementById("step-codigo").classList.add("active");
      codeInputs[0].focus();
    } catch (err) {
      console.error(err);
      erroNumero.textContent = "Não foi possível enviar o código. Tente novamente.";
      recaptchaVerifier.render().then((widgetId) => grecaptcha.reset(widgetId));
    }
  });

  // Navegação automática entre as caixinhas do código
  codeInputs.forEach((input, i) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "");
      if (input.value && i < codeInputs.length - 1) codeInputs[i + 1].focus();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && i > 0) codeInputs[i - 1].focus();
    });
  });

  document.getElementById("confirmar-codigo").addEventListener("click", async () => {
    erroCodigo.textContent = "";
    const codigo = codeInputs.map((i) => i.value).join("");

    if (codigo.length < 6) {
      erroCodigo.textContent = "Digite os 6 dígitos do código.";
      return;
    }
    if (!confirmationResult) {
      erroCodigo.textContent = "Sessão expirada. Volte e reenvie o código.";
      return;
    }

    try {
      const result = await confirmationResult.confirm(codigo);
      const user = result.user;

      const userRef = db.collection("usuarios").doc(user.uid);
      const snap = await userRef.get();
      if (!snap.exists) {
        await userRef.set({
          nome: "",
          telefone: user.phoneNumber || "",
          pontos: 0,
          atividadesConcluidas: [],
          criadoEm: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      window.location.href = "mapa.html";
    } catch (err) {
      console.error(err);
      erroCodigo.textContent = "Código incorreto. Tente novamente.";
    }
  });

  document.getElementById("reenviar-codigo").addEventListener("click", () => {
    document.getElementById("step-codigo").classList.remove("active");
    document.getElementById("step-phone").classList.add("active");
    codeInputs.forEach((i) => (i.value = ""));
  });
});

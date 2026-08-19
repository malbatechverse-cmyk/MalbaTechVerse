/**
 * Malba TechVerse — Configuração do Firebase
 * -------------------------------------------
 * 1. Crie um projeto em https://console.firebase.google.com
 * 2. No projeto, adicione um "App da Web" (ícone </>)
 * 3. Copie o objeto de configuração que o Firebase te dá e cole abaixo,
 *    substituindo os valores "SEU_..._AQUI".
 * 4. Ative no console: Authentication > Sign-in method > Google
 *    (e também "Telefone" se for usar o login por número).
 * 5. Crie o Firestore Database (modo produção) em Build > Firestore Database.
 */

const firebaseConfig = {
  apiKey: "AIzaSyD9bOwiJILWAJgabLttI--o92vzVLi7VBo",
  authDomain: "malbatechverse-37248.firebaseapp.com",
  projectId: "malbatechverse-37248",
  storageBucket: "malbatechverse-37248.firebasestorage.app",
  messagingSenderId: "759167855781",
  appId: "1:759167855781:web:45db60b7bdd7c994adb14c"
};

// SDKs carregados via <script> no HTML (compat, mais simples pra começar)
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

/**
 * Malba TechVerse — Mapa da feira (imagem estática)
 * ----------------------------------------------------
 * O mapa agora é uma imagem estática (img/mapa.png), sem depender da
 * API do Google Maps. Basta substituir esse arquivo por um mapa/planta
 * real da feira que o zoom/scroll continuam funcionando (a imagem fica
 * dentro de um contêiner com scroll para o usuário arrastar/dar zoom).
 *
 * Para trocar a imagem: coloque o arquivo em img/mapa.png (mesmo nome)
 * ou ajuste o atributo src do <img id="map-img"> em mapa.html.
 */

document.addEventListener("DOMContentLoaded", () => {
  const img = document.getElementById("map-img");
  const loading = document.getElementById("map-loading");

  if (!img) return;

  const esconderLoading = () => {
    loading?.remove();
    img.style.display = "block";
  };

  if (img.complete && img.naturalWidth > 0) {
    esconderLoading();
  } else {
    img.addEventListener("load", esconderLoading);
    img.addEventListener("error", () => {
      if (loading) {
        loading.textContent = "Não foi possível carregar o mapa. Verifique se img/mapa.png existe.";
      }
    });
  }
});

// Klick & Klar — Hero-Video
// Waehlt die Videogroesse (klein auf Handy/Datensparmodus), startet es stumm
// und haelt es bei "Bewegung reduzieren" an (dann bleibt das Standbild).

(() => {
  const video = document.getElementById("hero-video");
  if (!video) return;

  const saveData = navigator.connection && navigator.connection.saveData;
  const small = window.matchMedia("(max-width: 719px)").matches || saveData;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced) return; // Poster bleibt stehen, kein Video wird geladen.

  const big = video.dataset.src || "/assets/hero-banner-v2-1280.mp4";
  const lite = video.dataset.srcSmall || "/assets/hero-banner-v2-640.mp4";
  video.src = small ? lite : big;
  const play = video.play();
  if (play && play.catch) play.catch(() => { /* Autoplay blockiert: Poster bleibt */ });
})();

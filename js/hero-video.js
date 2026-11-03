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

  video.src = small ? "/assets/hero-eye-640.mp4" : "/assets/hero-eye-1280.mp4";
  const play = video.play();
  if (play && play.catch) play.catch(() => { /* Autoplay blockiert: Poster bleibt */ });
})();

// Klick & Klar — Hero-Video
// Waehlt die Videogroesse (klein auf Handy/Datensparmodus), startet es stumm
// und haelt es bei "Bewegung reduzieren" an (dann bleibt das Standbild).

(() => {
  const video = document.getElementById("hero-video");
  if (!video) return;

  const saveData = navigator.connection && navigator.connection.saveData;
  const small = window.matchMedia("(max-width: 719px)").matches || saveData;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const once = video.hasAttribute("data-once"); // einmal abspielen, letztes Bild bleibt stehen
  if (once) video.loop = false;

  if (reduced) {
    if (once) {
      // Bewegung reduzieren: direkt das letzte Bild zeigen, nichts abspielen.
      video.preload = "auto";
      video.src = small ? (video.dataset.srcSmall || "") : (video.dataset.src || "");
      video.addEventListener("loadedmetadata", () => { video.currentTime = Math.max(0, video.duration - 0.05); }, { once: true });
    }
    return; // sonst bleibt das Standbild (Poster) stehen
  }

  const big = video.dataset.src || "/assets/hero-banner-v2-1280.mp4";
  const lite = video.dataset.srcSmall || "/assets/hero-banner-v2-640.mp4";
  video.src = small ? lite : big;
  const play = video.play();
  if (play && play.catch) play.catch(() => { /* Autoplay blockiert: Poster bleibt */ });
})();

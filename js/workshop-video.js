// Klick & Klar — Workshop-Video: bei "Bewegung reduzieren" nur das Standbild zeigen.
(() => {
  const v = document.getElementById("workshop-video");
  if (!v) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    v.removeAttribute("autoplay");
    v.pause();
    return;
  }
  const p = v.play();
  if (p && p.catch) p.catch(() => { /* Autoplay blockiert: Standbild bleibt */ });
})();

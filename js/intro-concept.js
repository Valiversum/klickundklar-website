// Klick & Klar — Intro/Reveal
// A cursor animates to the entry button and "clicks" it automatically
// (~1.2s), then a solid-color cover fades out to reveal the real page.
// Cleans itself up afterwards so it costs nothing once the content is
// visible.

(() => {
  const body = document.body;
  const entry = document.getElementById("ic-entry");
  const intro = document.getElementById("ic-intro");
  const cursor = document.getElementById("ic-cursor");
  const cover = document.getElementById("ic-cover");
  if (!entry || !intro || !cursor) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let revealed = false;

  // ---------------------------------------------------------------------
  // Reveal
  // ---------------------------------------------------------------------

  function reveal() {
    if (revealed) return;
    revealed = true;

    body.classList.add("ic-activating");
    body.classList.add("ic-revealed");

    const cleanupDelay = prefersReducedMotion ? 50 : 620;

    window.setTimeout(() => {
      intro.hidden = true;
      cursor.remove();
      if (cover) cover.remove();
    }, cleanupDelay);
  }

  // A real click (impatient user) or keyboard activation skips straight
  // to reveal, regardless of where the animated sequence is.
  entry.addEventListener("click", reveal);
  entry.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      reveal();
    }
  });

  // ---------------------------------------------------------------------
  // Automatic cursor: moves to the button and "clicks" it (~1.2s total),
  // then the reveal above runs. Purely a scripted animation — not tied
  // to the real pointer.
  // ---------------------------------------------------------------------

  if (prefersReducedMotion) {
    cursor.style.display = "none";
    window.setTimeout(reveal, 150);
    return;
  }

  const startX = window.innerWidth * 0.24;
  const startY = window.innerHeight * 0.3;
  cursor.style.transition = "none";
  cursor.style.transform = `translate3d(${startX}px, ${startY}px, 0)`;

  requestAnimationFrame(() => {
    const rect = entry.getBoundingClientRect();
    const targetX = rect.left + rect.width * 0.4;
    const targetY = rect.top + rect.height * 0.6;
    cursor.style.transition =
      "transform 850ms cubic-bezier(0.65, 0, 0.35, 1), opacity var(--dur-base) ease, width 120ms ease, height 120ms ease, color 120ms ease";
    requestAnimationFrame(() => {
      cursor.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
    });
  });

  window.setTimeout(() => {
    cursor.classList.add("ic-cursor--hover");
    entry.classList.add("ic-entry--pressed");
  }, 900);

  window.setTimeout(() => {
    entry.classList.remove("ic-entry--pressed");
    reveal();
  }, 1100);
})();

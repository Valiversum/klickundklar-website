// Klick & Klar — Intro/Reveal Concept Prototype
// Vanilla JS, no dependencies. Blur-to-clear reveal + custom cursor
// on fine-pointer devices only. Cleans itself up after the reveal so
// it costs nothing once the real content is visible.

(() => {
  const body = document.body;
  const entry = document.getElementById("ic-entry");
  const intro = document.getElementById("ic-intro");
  const cursor = document.getElementById("ic-cursor");
  if (!entry || !intro || !cursor) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const hasFinePointer = window.matchMedia("(pointer: fine)").matches;

  let revealed = false;
  let rafId = null;
  let mouseX = -200;
  let mouseY = -200;

  // ---------------------------------------------------------------------
  // Custom cursor (fine pointer + motion allowed only)
  // ---------------------------------------------------------------------

  const cursorEnabled = hasFinePointer && !prefersReducedMotion;
  let cleanupCursor = null;

  if (!cursorEnabled) {
    body.classList.add("ic-no-fine-pointer");
  } else {
    body.classList.add("ic-hide-native-cursor");

    function onMouseMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (rafId === null) {
        rafId = requestAnimationFrame(updateCursor);
      }
    }

    function updateCursor() {
      cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      rafId = null;
    }

    function onEnterHover() {
      cursor.classList.add("ic-cursor--hover");
    }
    function onEnterLeave() {
      cursor.classList.remove("ic-cursor--hover");
    }

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    entry.addEventListener("mouseenter", onEnterHover);
    entry.addEventListener("mouseleave", onEnterLeave);

    cleanupCursor = () => {
      window.removeEventListener("mousemove", onMouseMove);
      entry.removeEventListener("mouseenter", onEnterHover);
      entry.removeEventListener("mouseleave", onEnterLeave);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }

  // ---------------------------------------------------------------------
  // Reveal
  // ---------------------------------------------------------------------

  function reveal() {
    if (revealed) return;
    revealed = true;

    body.classList.add("ic-activating");
    body.classList.add("ic-revealed");
    body.classList.remove("ic-hide-native-cursor");

    const cleanupDelay = prefersReducedMotion ? 50 : 620;

    window.setTimeout(() => {
      intro.hidden = true;
      cursor.remove();
      if (cleanupCursor) cleanupCursor();
    }, cleanupDelay);
  }

  entry.addEventListener("click", reveal);
  // Native <button> already activates on Enter/Space, but some input
  // paths (e.g. synthetic automation events) skip that default action —
  // this keydown listener is a harmless, explicit backstop.
  entry.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      reveal();
    }
  });
})();

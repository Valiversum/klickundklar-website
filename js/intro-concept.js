// Klick & Klar — Intro/Reveal
// Vanilla JS, blur-to-clear reveal + custom image cursor on fine-pointer
// devices only. Cleans itself up after the reveal so it costs nothing
// once the real content is visible. Pixelation of the intro cover
// (below) uses html2canvas — a one-off capture on load, not a per-frame
// cost.

// ---------------------------------------------------------------------
// Real pixelation of the hidden content: capture it once with
// html2canvas, downscale to a handful of blocks, then draw that back up
// with image smoothing off — a single canvas op, not an ongoing effect.
// ---------------------------------------------------------------------

(async () => {
  const canvas = document.getElementById("ic-pixelate");
  const content = document.getElementById("ic-content");
  if (!canvas || !content || typeof html2canvas !== "function") return;

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const paper = getComputedStyle(document.body)
      .getPropertyValue("--c-paper")
      .trim() || "#f5f3ee";

    const shot = await html2canvas(content, {
      backgroundColor: paper,
      width: viewportW,
      height: viewportH,
      x: 0,
      y: 0,
      scale: 1,
      logging: false,
    });

    const pixelSize = 26; // on-screen size of one pixel block
    const dpr = window.devicePixelRatio || 1;
    const smallW = Math.max(1, Math.round(viewportW / pixelSize));
    const smallH = Math.max(1, Math.round(viewportH / pixelSize));

    const small = document.createElement("canvas");
    small.width = smallW;
    small.height = smallH;
    small.getContext("2d").drawImage(shot, 0, 0, shot.width, shot.height, 0, 0, smallW, smallH);

    canvas.width = viewportW * dpr;
    canvas.height = viewportH * dpr;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, smallW, smallH, 0, 0, canvas.width, canvas.height);
  } catch (err) {
    // html2canvas failed (CDN blocked, unsupported CSS, etc.) — the CSS
    // fallback (solid paper background on .ic-pixelate) still covers
    // the content, just without the pixel-mosaic look.
  }
})();

(() => {
  const body = document.body;
  const entry = document.getElementById("ic-entry");
  const intro = document.getElementById("ic-intro");
  const cursor = document.getElementById("ic-cursor");
  const pixelate = document.getElementById("ic-pixelate");
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
      if (pixelate) pixelate.remove();
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

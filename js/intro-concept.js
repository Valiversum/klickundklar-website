// Klick & Klar — Intro/Reveal
// A cursor animates to the entry button and "clicks" it automatically
// (~1.2s), then the pixelated cover reveals the real page. Cleans
// itself up afterwards so it costs nothing once the content is visible.
// Pixelation of the cover uses html2canvas — a one-off capture on load,
// not a per-frame cost.

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
      if (pixelate) pixelate.remove();
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

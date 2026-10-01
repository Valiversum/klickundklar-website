// Klick & Klar — Mobile nav toggle
// Shared across all pages using the ic-nav header. Shows/hides the
// link list on narrow screens; no-ops harmlessly if the markup isn't
// present (e.g. future pages that don't need it).

(() => {
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  if (!toggle || !links) return;

  function setOpen(open) {
    links.classList.toggle("is-open", open);
    toggle.classList.toggle("is-active", open);
    toggle.setAttribute("aria-expanded", String(open));
  }

  toggle.addEventListener("click", () => {
    setOpen(!links.classList.contains("is-open"));
  });

  links.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
})();

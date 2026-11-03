// Klick & Klar — Hinweis-Banner schliessbar (pro Sitzung gemerkt)
(() => {
  const banner = document.getElementById("ic-banner");
  const close = document.getElementById("ic-banner-close");
  if (!banner || !close) return;
  try {
    if (sessionStorage.getItem("ic-banner-closed")) banner.hidden = true;
  } catch (e) {}
  close.addEventListener("click", () => {
    banner.hidden = true;
    try { sessionStorage.setItem("ic-banner-closed", "1"); } catch (e) {}
  });
})();

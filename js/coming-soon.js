// Klick & Klar – Coming-Soon-Seite: Zitate wechseln alle 10 Sekunden.

(() => {
  const quotes = document.querySelectorAll(".soon__quote");
  const dots = document.querySelectorAll("#quote-dots span");
  if (!quotes.length) return;

  let current = 0;

  function show(index) {
    quotes[current].classList.remove("is-active");
    dots[current]?.classList.remove("is-active");
    current = index;
    quotes[current].classList.add("is-active");
    dots[current]?.classList.add("is-active");
  }

  setInterval(() => {
    show((current + 1) % quotes.length);
  }, 10000);
})();

// Klick & Klar – main.js

// Smooth scroll only for in-page anchor links (kept off globally so
// normal wheel/trackpad scrolling stays instant and responsive).
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const id = link.getAttribute("href").slice(1);
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

document.getElementById("year").textContent = new Date().getFullYear();

// Sticky header shadow on scroll
const header = document.getElementById("site-header");
const onScroll = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 8);
};
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// Mobile nav toggle
const navToggle = document.getElementById("nav-toggle");
const navLinks = document.getElementById("nav-links");

navToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

// Scroll reveal animations (progressive enhancement only — content is
// visible by default via CSS, this just adds a fade-in when supported).
const revealEls = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && revealEls.length) {
  document.documentElement.classList.add("js-reveal");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05, rootMargin: "0px 0px -5% 0px" }
  );
  revealEls.forEach((el) => observer.observe(el));

  // Safety net: never let content stay hidden, even if the observer
  // misbehaves for some reason.
  setTimeout(() => {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }, 2000);
}

// Contact form -> mailto fallback (no backend required)
const form = document.getElementById("contact-form");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = data.get("name") || "";
    const email = data.get("email") || "";
    const organisation = data.get("organisation") || "";
    const thema = data.get("thema") || "";
    const message = data.get("message") || "";

    const subject = `Anfrage über die Website: ${thema}`;
    const bodyLines = [
      `Name: ${name}`,
      `E-Mail: ${email}`,
      organisation ? `Schule/Organisation: ${organisation}` : null,
      `Interesse: ${thema}`,
      "",
      message,
    ].filter(Boolean);

    const mailto = `mailto:info@klickundklar.at?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(bodyLines.join("\n"))}`;

    window.location.href = mailto;
  });
}

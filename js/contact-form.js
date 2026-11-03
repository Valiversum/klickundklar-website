// Klick & Klar — Kontaktformular
// Sendet an /api/contact (Cloudflare Worker). Spam-Schutz: verstecktes
// Honeypot-Feld + Cloudflare Turnstile. Das Turnstile-Skript wird erst
// hier nachgeladen, also nur auf der Kontakt-Seite.

(() => {
  // Öffentlicher Site-Key aus dem Cloudflare-Dashboard (Turnstile).
  // Solange leer, zeigt die Seite statt des Formulars einen E-Mail-Hinweis.
  const TURNSTILE_SITE_KEY = "";
  const ENDPOINT = "/api/contact";

  const form = document.getElementById("contact-form");
  const setupNote = document.getElementById("contact-setup");
  if (!form) return;

  if (!TURNSTILE_SITE_KEY) {
    if (setupNote) setupNote.hidden = false;
    return;
  }
  form.hidden = false;

  const submitBtn = document.getElementById("contact-submit");
  const errorEl = document.getElementById("contact-error");
  const successEl = document.getElementById("contact-success");
  const submitLabel = submitBtn.textContent;

  let token = "";
  let widgetId = null;

  function loadTurnstile() {
    return new Promise((resolve, reject) => {
      if (window.turnstile) return resolve(window.turnstile);
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.onload = () => resolve(window.turnstile);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  loadTurnstile()
    .then((ts) => {
      widgetId = ts.render("#turnstile-box", {
        sitekey: TURNSTILE_SITE_KEY,
        language: "de",
        callback: (t) => { token = t; },
        "expired-callback": () => { token = ""; },
        "error-callback": () => { token = ""; },
      });
    })
    .catch(() => showError("Die Spam-Prüfung konnte nicht geladen werden. Bitte lade die Seite neu oder schreib uns direkt per E-Mail."));

  function showError(msg) {
    successEl.hidden = true;
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  function resetWidget() {
    token = "";
    if (window.turnstile && widgetId !== null) window.turnstile.reset(widgetId);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    successEl.hidden = true;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (!token) {
      showError("Bitte bestätige die Spam-Prüfung.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Wird gesendet …";

    const data = new FormData(form);
    const payload = {
      name: data.get("name"),
      email: data.get("email"),
      message: data.get("message"),
      website: data.get("website"),
      consent: form.elements.consent.checked,
      token,
    };

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      let body = {};
      try { body = await res.json(); } catch { /* keine JSON-Antwort */ }

      if (res.ok && body.ok) {
        form.reset();
        resetWidget();
        successEl.hidden = false;
      } else {
        showError(body.error || "Das hat leider nicht geklappt. Bitte versuche es später erneut oder schreib uns direkt per E-Mail.");
        resetWidget();
      }
    } catch {
      showError("Keine Verbindung. Bitte prüfe deine Internetverbindung und versuche es erneut.");
      resetWidget();
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = submitLabel;
    }
  });
})();

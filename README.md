# Klick & Klar – Vereinswebsite

Website für den Verein **„Klick & Klar – Verein für digitale Medienbildung und
Social-Media-Kompetenz"** (klickundklar.at). Kein Build-Prozess, kein Framework:
reines HTML/CSS/JS, ausgeliefert als **Cloudflare Worker mit statischen Assets**.
Ein kleiner Worker übernimmt das Kontaktformular und die Video-Auslieferung.

## Projektstruktur

```
index.html            Startseite (Video-Banner, Workshop, Wer wir sind, Kontakt)
wer-wir-sind.html     Team, Vision, Download der Vereinsstatuten
workshops.html        Workshops (aktuelle und in Planung)
initiativen.html      Initiativen (Video-Banner, Inhalte folgen)
lernmaterial.html     Lernmaterial (Downloads folgen)
kontakt.html          Kontaktformular, E-Mail, Social Media
impressum.html        Impressum
datenschutz.html      Datenschutzerklärung
ki-oder-real.html     Quiz (nicht verlinkt, noindex, Platzhalterdaten)
404.html              Fehlerseite

css/dashboard.css     Gesamtes Styling (Design-Tokens oben in :root)
js/                   nav.js, mail.js, hero-video.js, workshop-video.js, banner.js,
                      contact-form.js, intro-concept.js, ki-oder-real.js
assets/               Bilder, Videos, Favicons, PDF
worker/               Cloudflare Worker (index.js, contact.js, mail.js, Tests)
wrangler.toml         Worker- und Asset-Konfiguration
_headers              Sicherheits- und Cache-Header
.assetsignore         Dateien, die nicht öffentlich ausgeliefert werden
robots.txt, sitemap.xml
```

## Inhalte anpassen

Alles steht direkt im HTML, es gibt kein CMS.

- **E-Mail-Adresse**: wird per `a.js-mail[data-u][data-d]` zusammengesetzt
  (Spam-Schutz, `js/mail.js`). Anzeige: `hello ( @ ) valentinmazal.at`.
- **Team**: `wer-wir-sind.html`. Fotos als WebP in `assets/`, mit `width`/`height`.
- **Farben, Abstände**: Tokens am Anfang von `css/dashboard.css`.
- **Videos**: als H.264-MP4 (1280 und 640 px breit, `-movflags +faststart`) plus
  WebP-Standbild. Neue Dateinamen verwenden (z. B. `-v3`), damit kein alter
  Cache greift.
- **Sitemap**: neue Seiten in `sitemap.xml` eintragen (URLs ohne `.html`).

## Lokal ansehen

```bash
python3 -m http.server 8081
```

Dann `http://localhost:8081` öffnen. Der Worker (Formular, Video-Range) läuft
lokal nicht mit; dafür `npx wrangler dev`.

## Deployment

Manuell, nach `git push`:

```bash
npx wrangler deploy
```

Die automatische Bereitstellung über GitHub hat zeitweise gehangen. Nach jedem
Deploy kurz prüfen: `curl -sL https://klickundklar.at/ | head`.

Hinweise:

- `.assetsignore` hält Entwicklungsdateien und unbenutzte Originale aus der
  öffentlichen Auslieferung.
- `.mp4`-Dateien laufen über den Worker (`run_worker_first`), weil Safari/iOS
  Videos nur mit Range-Antworten (HTTP 206) abspielt.
- `_headers` setzt `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy` und die Cache-Zeiten.

## Kontaktformular (Cloudflare Worker)

Das Formular auf `kontakt.html` sendet an `/api/contact`. Das verarbeitet der
Worker in `worker/` (Prüfung, Turnstile, Mailversand an `CONTACT_TO`). Das
Anliegen („Allgemeine Anfrage“, „Workshop buchen: Für immer Scrollen“) kommt aus
einer festen Liste. Lokal testen: `node --test worker/contact.test.mjs`.

Einmalige Einrichtung im Cloudflare-Dashboard:

1. **Email Routing**: Die Zieladresse (`hello@valentinmazal.at`) muss dort als
   bestätigte Adresse eingetragen sein (die `send_email`-Bindung in
   `wrangler.toml` darf nur an diese Adresse senden).
2. **Turnstile**: Widget anlegen (Domain `klickundklar.at`).
   - *Site-Key* (öffentlich) in `js/contact-form.js` bei `TURNSTILE_SITE_KEY`.
   - *Secret Key* als Worker-Secret: `npx wrangler secret put TURNSTILE_SECRET`.
   Ohne Secret antwortet der Worker mit 503, ohne Site-Key zeigt die Seite
   einen E-Mail-Hinweis statt des Formulars.

## Rechtliches (offene Punkte)

- Vereinsstatuten (`assets/Vereinsstatuten-Klick-und-Klar.pdf`): Die Datei trägt
  auf Seite 1 noch den Entwurfs-Hinweis. Durch die eingereichte Fassung ersetzen.
- Datenschutzerklärung bei neuen Diensten (Analyse, Social-Media-Einbettungen)
  anpassen.

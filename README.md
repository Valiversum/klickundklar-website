# Klick & Klar – Vereinswebsite

Statische Website für den Verein **„Klick & Klar – Verein für digitale
Medienbildung und Social-Media-Kompetenz"**. Kein Build-Prozess, kein
Framework – reines HTML/CSS/JS. Läuft direkt auf Cloudflare Pages.

## Projektstruktur

```
index.html          Startseite (alle Inhalte, Sektionen per Anker verlinkt)
impressum.html       Impressum
datenschutz.html     Datenschutzerklärung
css/style.css         Gesamtes Styling (CSS-Variablen für Farben oben in :root)
js/main.js            Mobile-Menü, Scroll-Reveal, Kontaktformular (mailto)
assets/logo.png        Logo (optimiert, für Web)
assets/logo.svg         Original-Logo in hoher Auflösung (Master-Datei)
assets/favicon.svg      Favicon
_headers                Cloudflare-Cache-Header
robots.txt, sitemap.xml  SEO-Basics
```

## Inhalte anpassen

Alles ist direkt im HTML editierbar, es gibt kein CMS. Die wichtigsten Stellen:

- **Workshops**: in `index.html` im Abschnitt `<section id="workshops">` –
  einfach weitere `<article class="workshop-card">`-Blöcke kopieren/anpassen.
- **Vorstand/Team**: `<section id="team">` – Namen unter "Name folgt" eintragen.
- **Kontakt-E-Mail**: aktuell `info@klickundklar.at` – kommt an mehreren
  Stellen vor (Header ist nicht betroffen), am schnellsten per Suchen &
  Ersetzen in allen `.html`-Dateien.
- **Impressum**: `impressum.html` – ZVR-Zahl, Adresse und Obmann/Obfrau
  ergänzen, sobald der Verein bei der Vereinsbehörde registriert ist.
- **Farben**: `css/style.css`, ganz oben unter `:root` (`--navy`, `--orange`,
  `--teal`).

## Lokal ansehen

Kein Build nötig, einfach ein Verzeichnis servieren, z. B.:

```bash
python3 -m http.server 8080
```

Dann `http://localhost:8080` öffnen.

## Deployment: GitHub → Cloudflare Pages → klickundklar.at

### 1. GitHub-Repository erstellen und Code pushen

```bash
gh repo create klickundklar-website --private --source=. --remote=origin --push
```

Falls `gh` (GitHub CLI) nicht installiert/eingeloggt ist: Repository manuell
auf [github.com/new](https://github.com/new) anlegen (z. B.
`klickundklar-website`), dann:

```bash
git remote add origin https://github.com/<dein-github-name>/klickundklar-website.git
git branch -M main
git push -u origin main
```

### 2. Cloudflare Pages mit GitHub verbinden

1. In Cloudflare einloggen → **Workers & Pages** → **Create application** →
   **Pages** → **Connect to Git**.
2. Das GitHub-Repository `klickundklar-website` auswählen und autorisieren.
3. Build-Einstellungen:
   - **Framework preset**: `None`
   - **Build command**: *(leer lassen)*
   - **Build output directory**: `/`
4. **Save and Deploy** – Cloudflare baut die Seite und stellt sie unter einer
   `*.pages.dev`-URL bereit. Jeder Push auf `main` deployed automatisch neu.

### 3. Eigene Domain klickundklar.at verbinden

Da die Domain bei **netcup** liegt (nicht bei Cloudflare als DNS-Zone), gibt
es zwei Wege:

**Variante A – Domain zu Cloudflare umziehen (empfohlen, einfacher & schneller):**
1. Im Cloudflare-Dashboard: **Add a site** → `klickundklar.at` hinzufügen
   (kostenloser Plan reicht).
2. Cloudflare zeigt zwei Nameserver an (z. B. `xxx.ns.cloudflare.com`).
3. Bei netcup im **Domain-Verwaltung**-Bereich die Nameserver der Domain auf
   die von Cloudflare angezeigten ändern.
4. Sobald die Umstellung aktiv ist (kann bis zu 24h dauern, meist schneller):
   im Cloudflare-Pages-Projekt unter **Custom domains** → `klickundklar.at`
   und `www.klickundklar.at` hinzufügen. Cloudflare setzt die nötigen
   DNS-Einträge automatisch.

**Variante B – Nameserver bei netcup belassen, nur DNS-Einträge setzen:**
1. Im Cloudflare-Pages-Projekt unter **Custom domains** die Domain
   `klickundklar.at` hinzufügen – Cloudflare zeigt dir den nötigen
   `CNAME`-Zieleintrag (z. B. `klickundklar-website.pages.dev`).
2. Bei netcup im DNS-Verwaltungsbereich der Domain:
   - `CNAME` (oder bei manchen Anbietern "ALIAS"/"ANAME" für die Root-Domain)
     `@` → `klickundklar-website.pages.dev`
   - `CNAME www` → `klickundklar-website.pages.dev`
   - Falls netcup keine CNAME-Weiterleitung auf Root-Ebene erlaubt: netcups
     eigene Weiterleitungsfunktion nutzen oder auf Variante A wechseln.

Variante A ist robuster (volles Cloudflare-Feature-Set, automatisches SSL,
Caching) und wird empfohlen.

### 4. Danach

- SSL/TLS-Zertifikat wird von Cloudflare automatisch ausgestellt (kann
  einige Minuten dauern).
- Jede Änderung: lokal committen & `git push` → Cloudflare deployed
  automatisch neu.

## Rechtliches (offene Punkte)

- ZVR-Zahl in `impressum.html` ergänzen, sobald der Verein registriert ist.
- Namen des Vorstands (Obmann/Obfrau, Kassier:in, Schriftführer:in) in
  `index.html` (`#team`) und `impressum.html` ergänzen.
- Vereinsadresse in `impressum.html` ergänzen.

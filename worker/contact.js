// Verarbeitung der Kontaktformular-Anfrage. Abhängigkeiten (EmailMessage,
// fetch) werden injiziert, damit die Logik lokal getestet werden kann.

import { validate, buildRawEmail } from "./mail.js";

const MAX_BODY_BYTES = 20000;
const TURNSTILE_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra },
  });
}

export async function handleContact(request, env, { EmailMessage, fetchImpl = fetch }) {
  if (request.method !== "POST") {
    return json({ error: "Methode nicht erlaubt." }, 405, { allow: "POST" });
  }

  // Nur Anfragen von der eigenen Seite zulassen.
  const origin = request.headers.get("origin");
  const host = new URL(request.url).host;
  let originHost = null;
  try { originHost = origin ? new URL(origin).host : null; } catch { /* ungültig */ }
  if (!originHost || originHost !== host) {
    return json({ error: "Anfrage nicht erlaubt." }, 403);
  }

  if (!(request.headers.get("content-type") || "").includes("application/json")) {
    return json({ error: "Ungültige Anfrage." }, 415);
  }

  let raw;
  try { raw = await request.text(); } catch { return json({ error: "Ungültige Anfrage." }, 400); }
  if (raw.length > MAX_BODY_BYTES) return json({ error: "Anfrage zu groß." }, 413);

  let data;
  try { data = JSON.parse(raw); } catch { return json({ error: "Ungültige Anfrage." }, 400); }

  // Honeypot: nur Bots füllen das versteckte Feld aus. Stillschweigend "ok".
  if (typeof data.website === "string" && data.website.trim() !== "") {
    return json({ ok: true });
  }

  const checked = validate(data);
  if (!checked.ok) return json({ error: checked.error }, 400);

  if (!env.TURNSTILE_SECRET) {
    return json({ error: "Das Formular ist noch nicht eingerichtet. Bitte schreibe uns direkt per E-Mail." }, 503);
  }
  if (typeof data.token !== "string" || data.token === "") {
    return json({ error: "Bitte bestätige die Spam-Prüfung." }, 400);
  }

  try {
    const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: data.token });
    const ip = request.headers.get("cf-connecting-ip");
    if (ip) form.set("remoteip", ip);
    const res = await fetchImpl(TURNSTILE_URL, { method: "POST", body: form });
    const result = await res.json();
    if (!result.success) {
      return json({ error: "Die Spam-Prüfung ist fehlgeschlagen. Bitte versuche es erneut." }, 400);
    }
  } catch (err) {
    console.error("turnstile verification failed", err);
    return json({ error: "Die Spam-Prüfung ist gerade nicht erreichbar. Bitte versuche es später erneut." }, 502);
  }

  const { name, email, message } = checked.value;
  const fromAddress = env.CONTACT_FROM;
  const to = env.CONTACT_TO;
  const body =
    `Neue Nachricht über das Kontaktformular\n\n` +
    `Name:   ${name}\nE-Mail: ${email}\n\n${message}\n`;

  try {
    const rawEmail = buildRawEmail({
      fromAddress,
      fromName: "Klick & Klar Website",
      to,
      replyTo: email,
      subject: `Kontaktformular: ${name}`,
      body,
    });
    await env.EMAIL.send(new EmailMessage(fromAddress, to, rawEmail));
  } catch (err) {
    console.error("send failed", err);
    return json({ error: "Die Nachricht konnte nicht gesendet werden. Bitte schreibe uns direkt per E-Mail." }, 502);
  }

  return json({ ok: true });
}

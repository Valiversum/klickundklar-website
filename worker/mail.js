// Reine Hilfsfunktionen (ohne Cloudflare-Abhängigkeiten, daher testbar).

export const LIMITS = { name: 100, email: 200, message: 5000 };

const EMAIL_RE = /^[^\s@<>"'(),;:\\]+@[^\s@<>"'(),;:\\]+\.[^\s@<>"'(),;:\\]{2,}$/;

export function sanitizeLine(value) {
  return String(value ?? "").replace(/[\r\n\u2028\u2029]+/g, " ").trim();
}

export function validate(data) {
  const name = sanitizeLine(data?.name);
  const email = sanitizeLine(data?.email);
  const message = String(data?.message ?? "").replace(/\r\n/g, "\n").trim();

  if (!name || !email || !message) {
    return { ok: false, error: "Bitte fülle Name, E-Mail und Nachricht aus." };
  }
  if (name.length > LIMITS.name || email.length > LIMITS.email || message.length > LIMITS.message) {
    return { ok: false, error: "Eine Eingabe ist zu lang." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Bitte gib eine gültige E-Mail-Adresse an." };
  }
  if (data?.consent !== true) {
    return { ok: false, error: "Bitte bestätige die Kenntnisnahme der Datenschutzerklärung." };
  }
  return { ok: true, value: { name, email, message } };
}

function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function encodeHeader(text) {
  return /^[\x20-\x7e]*$/.test(text) ? text : `=?UTF-8?B?${toBase64(text)}?=`;
}

function wrap76(b64) {
  return b64.match(/.{1,76}/g)?.join("\r\n") ?? "";
}

export function buildRawEmail({ fromAddress, fromName, to, replyTo, subject, body, date = new Date() }) {
  const domain = fromAddress.split("@")[1];
  const headers = [
    `From: ${encodeHeader(sanitizeLine(fromName))} <${fromAddress}>`,
    `To: ${to}`,
    replyTo ? `Reply-To: ${replyTo}` : null,
    `Subject: ${encodeHeader(sanitizeLine(subject))}`,
    `Date: ${date.toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
  ].filter(Boolean);
  return headers.join("\r\n") + "\r\n\r\n" + wrap76(toBase64(body)) + "\r\n";
}

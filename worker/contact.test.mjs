import test from "node:test";
import assert from "node:assert/strict";
import { validate, buildRawEmail } from "./mail.js";
import { handleContact } from "./contact.js";

class FakeEmailMessage { constructor(from, to, raw) { this.from = from; this.to = to; this.raw = raw; } }

const good = { name: "Anna Muster", email: "anna@example.com", message: "Hallo Verein!", consent: true, token: "tok", website: "" };

function req(body, { origin = "https://klickundklar.at", method = "POST", type = "application/json" } = {}) {
  const headers = { "content-type": type };
  if (origin) headers.origin = origin;
  return new Request("https://klickundklar.at/api/contact", {
    method, headers, body: method === "POST" ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
  });
}
function makeEnv(extra = {}) {
  const sent = [];
  return { sent, env: { TURNSTILE_SECRET: "s", CONTACT_FROM: "kontakt@klickundklar.at", CONTACT_TO: "me@example.com",
    EMAIL: { send: async (m) => { sent.push(m); } }, ...extra } };
}
const okTurnstile = async () => new Response(JSON.stringify({ success: true }));
const badTurnstile = async () => new Response(JSON.stringify({ success: false }));
const deps = (fetchImpl = okTurnstile) => ({ EmailMessage: FakeEmailMessage, fetchImpl });

test("validate: akzeptiert gültige Daten", () => assert.equal(validate(good).ok, true));
test("validate: Pflichtfelder", () => assert.equal(validate({ ...good, message: "  " }).ok, false));
test("validate: ungültige E-Mail", () => assert.equal(validate({ ...good, email: "kein-mail" }).ok, false));
test("validate: Zustimmung nötig", () => assert.equal(validate({ ...good, consent: false }).ok, false));
test("validate: Längenlimit", () => assert.equal(validate({ ...good, message: "x".repeat(5001) }).ok, false));
test("validate: Zeilenumbrüche im Namen werden entfernt", () => {
  assert.equal(validate({ ...good, name: "A\r\nBcc: x@y.z" }).value.name, "A Bcc: x@y.z");
});

test("buildRawEmail: Umlaute und Reply-To", () => {
  const raw = buildRawEmail({ fromAddress: "k@klickundklar.at", fromName: "Klick & Klar", to: "me@example.com",
    replyTo: "anna@example.com", subject: "Kontaktformular: Jürgen", body: "Grüße, äöü €" });
  assert.match(raw, /Reply-To: anna@example\.com/);
  assert.match(raw, /Subject: =\?UTF-8\?B\?/);
  const b64 = raw.split("\r\n\r\n")[1].replace(/\s+/g, "");
  assert.equal(Buffer.from(b64, "base64").toString("utf8"), "Grüße, äöü €");
});
test("buildRawEmail: keine Header-Injection über Betreff/Name", () => {
  const raw = buildRawEmail({ fromAddress: "k@klickundklar.at", fromName: "X\r\nBcc: evil@x.y", to: "me@example.com",
    subject: "S\r\nBcc: evil@x.y", body: "b" });
  const head = raw.split("\r\n\r\n")[0];
  assert.ok(!head.split("\r\n").some((l) => l.startsWith("Bcc:")));
});

test("handler: Erfolg sendet genau eine Mail", async () => {
  const { env, sent } = makeEnv();
  const res = await handleContact(req(good), env, deps());
  assert.equal(res.status, 200);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "me@example.com");
});
test("handler: GET abgelehnt", async () => {
  const { env } = makeEnv();
  assert.equal((await handleContact(req(null, { method: "GET" }), env, deps())).status, 405);
});
test("handler: fremde Origin abgelehnt", async () => {
  const { env, sent } = makeEnv();
  assert.equal((await handleContact(req(good, { origin: "https://evil.example" }), env, deps())).status, 403);
  assert.equal(sent.length, 0);
});
test("handler: fehlende Origin abgelehnt", async () => {
  const { env } = makeEnv();
  assert.equal((await handleContact(req(good, { origin: null }), env, deps())).status, 403);
});
test("handler: falscher Content-Type", async () => {
  const { env } = makeEnv();
  assert.equal((await handleContact(req("x", { type: "text/plain" }), env, deps())).status, 415);
});
test("handler: kaputtes JSON", async () => {
  const { env } = makeEnv();
  assert.equal((await handleContact(req("{nope"), env, deps())).status, 400);
});
test("handler: zu große Anfrage", async () => {
  const { env } = makeEnv();
  assert.equal((await handleContact(req(JSON.stringify({ ...good, message: "x".repeat(25000) })), env, deps())).status, 413);
});
test("handler: Honeypot -> ok, aber keine Mail", async () => {
  const { env, sent } = makeEnv();
  const res = await handleContact(req({ ...good, website: "http://spam" }), env, deps());
  assert.equal(res.status, 200);
  assert.equal(sent.length, 0);
});
test("handler: ohne Turnstile-Secret -> 503 (fail closed)", async () => {
  const { env, sent } = makeEnv({ TURNSTILE_SECRET: undefined });
  assert.equal((await handleContact(req(good), env, deps())).status, 503);
  assert.equal(sent.length, 0);
});
test("handler: ohne Token abgelehnt", async () => {
  const { env, sent } = makeEnv();
  assert.equal((await handleContact(req({ ...good, token: "" }), env, deps())).status, 400);
  assert.equal(sent.length, 0);
});
test("handler: Turnstile fehlgeschlagen -> keine Mail", async () => {
  const { env, sent } = makeEnv();
  assert.equal((await handleContact(req(good), env, deps(badTurnstile))).status, 400);
  assert.equal(sent.length, 0);
});
test("handler: Turnstile nicht erreichbar -> 502", async () => {
  const { env, sent } = makeEnv();
  const res = await handleContact(req(good), env, deps(async () => { throw new Error("net"); }));
  assert.equal(res.status, 502);
  assert.equal(sent.length, 0);
});
test("handler: Mailversand scheitert -> 502", async () => {
  const { env } = makeEnv({ EMAIL: { send: async () => { throw new Error("boom"); } } });
  assert.equal((await handleContact(req(good), env, deps())).status, 502);
});
test("handler: ungültige Eingabe -> 400 vor Turnstile", async () => {
  let called = false;
  const { env } = makeEnv();
  const res = await handleContact(req({ ...good, email: "x" }), env, deps(async () => { called = true; return okTurnstile(); }));
  assert.equal(res.status, 400);
  assert.equal(called, false);
});

// Cloudflare Worker: Kontaktformular unter /api/contact, alles andere
// liefern die statischen Assets.

import { EmailMessage } from "cloudflare:email";
import { handleContact } from "./contact.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/contact") {
      return handleContact(request, env, { EmailMessage });
    }
    if (url.pathname.endsWith(".mp4") && request.method === "GET") {
      return serveVideo(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

// Safari/iOS spielen Video nur ab, wenn Range-Anfragen mit 206 beantwortet werden.
async function serveVideo(request, env) {
  const res = await env.ASSETS.fetch(new Request(request.url, { method: "GET" }));
  if (!res.ok) return res;
  const buf = await res.arrayBuffer();
  const size = buf.byteLength;
  const headers = new Headers({
    "Content-Type": "video/mp4",
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=3600",
  });
  const m = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("Range") || "");
  if (!m || (m[1] === "" && m[2] === "")) {
    headers.set("Content-Length", String(size));
    return new Response(buf, { status: 200, headers });
  }
  let start, end;
  if (m[1] === "") {
    start = Math.max(0, size - Number(m[2]));
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start > end || start >= size) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }
  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(end - start + 1));
  return new Response(buf.slice(start, end + 1), { status: 206, headers });
}

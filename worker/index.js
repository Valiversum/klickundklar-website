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
    return env.ASSETS.fetch(request);
  },
};

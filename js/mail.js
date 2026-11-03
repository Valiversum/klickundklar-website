// Klick & Klar — E-Mail-Adresse als Spam-Schutz
// Im HTML steht die Adresse nur in der Form "name ( @ ) domain" ohne
// mailto-Link. Dieses Skript baut den klickbaren Link erst im Browser.

document.querySelectorAll("a.js-mail").forEach((a) => {
  a.href = "mailto:" + a.dataset.u + "@" + a.dataset.d;
});

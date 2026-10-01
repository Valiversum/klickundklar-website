// Klick & Klar — "KI oder Real?" Quiz
//
// PLATZHALTER-DATEN: Ersetze img/caption/isReal/source/explainText durch
// die echten Fotos und Angaben. Jedes Objekt:
//   img          Pfad zum Foto (z.B. "/assets/quiz/foto-01.webp") oder
//                null für den grauen Platzhalter-Kasten
//   caption      Kurze Beschreibung, die ÜBER dem Foto steht
//   isReal       true = echtes Foto, false = KI-generiert
//   source       Nur bei isReal: Link zur Quelle (wird erst bei der
//                Auflösung nach der Antwort angezeigt)
//   explain      Nur bei !isReal: true = dieses Foto wird am Ende als
//                eines der drei KI-Beispiele mit Erklärung gezeigt
//   explainText  Nur wenn explain=true: Erklärung, woran man das
//                KI-Foto erkennt

const QUIZ_ROUNDS = [
  {
    img: null,
    caption: "Platzhalter-Beschreibung für Foto 1 — bitte ersetzen.",
    isReal: true,
    source: "https://beispielquelle.at/foto-1",
  },
  {
    img: null,
    caption: "Platzhalter-Beschreibung für Foto 2 — bitte ersetzen.",
    isReal: false,
    explain: true,
    explainText:
      "Platzhalter: Erklärung, woran man bei Foto 2 erkennt, dass es KI-generiert ist (z. B. Hände, Texturen, Lichtführung, Hintergrunddetails).",
  },
  {
    img: null,
    caption: "Platzhalter-Beschreibung für Foto 3 — bitte ersetzen.",
    isReal: true,
    source: "https://beispielquelle.at/foto-3",
  },
  {
    img: null,
    caption: "Platzhalter-Beschreibung für Foto 4 — bitte ersetzen.",
    isReal: false,
    explain: true,
    explainText:
      "Platzhalter: Erklärung, woran man bei Foto 4 erkennt, dass es KI-generiert ist.",
  },
  {
    img: null,
    caption: "Platzhalter-Beschreibung für Foto 5 — bitte ersetzen.",
    isReal: true,
    source: "https://beispielquelle.at/foto-5",
  },
  {
    img: null,
    caption: "Platzhalter-Beschreibung für Foto 6 — bitte ersetzen.",
    isReal: false,
    explain: true,
    explainText:
      "Platzhalter: Erklärung, woran man bei Foto 6 erkennt, dass es KI-generiert ist.",
  },
  {
    img: null,
    caption: "Platzhalter-Beschreibung für Foto 7 — bitte ersetzen.",
    isReal: true,
    source: "https://beispielquelle.at/foto-7",
  },
  {
    img: null,
    caption: "Platzhalter-Beschreibung für Foto 8 — bitte ersetzen.",
    isReal: false,
  },
  {
    img: null,
    caption: "Platzhalter-Beschreibung für Foto 9 — bitte ersetzen.",
    isReal: true,
    source: "https://beispielquelle.at/foto-9",
  },
  {
    img: null,
    caption: "Platzhalter-Beschreibung für Foto 10 — bitte ersetzen.",
    isReal: false,
  },
];

(() => {
  const root = document.getElementById("quiz-root");
  if (!root) return;

  const stages = {
    intro: document.getElementById("stage-intro"),
    round: document.getElementById("stage-round"),
    score: document.getElementById("stage-score"),
    sources: document.getElementById("stage-sources"),
    explain: document.getElementById("stage-explain"),
    end: document.getElementById("stage-end"),
  };

  function showStage(name) {
    Object.entries(stages).forEach(([key, el]) => {
      if (el) el.hidden = key !== name;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderPhoto(container, round, index) {
    container.innerHTML = "";
    if (round.img) {
      const img = document.createElement("img");
      img.src = round.img;
      img.alt = "";
      img.loading = "lazy";
      container.appendChild(img);
    } else {
      container.classList.add("ic-quiz__photo--placeholder");
      container.textContent = `Foto ${index + 1}`;
    }
  }

  // ---------------------------------------------------------------------
  // Round-by-round quiz
  // ---------------------------------------------------------------------

  let order = QUIZ_ROUNDS.map((_, i) => i);
  let current = 0;
  let score = 0;
  let answered = false;

  const progressEl = document.getElementById("quiz-progress");
  const captionEl = document.getElementById("quiz-caption");
  const photoEl = document.getElementById("quiz-photo");
  const actionsEl = document.getElementById("quiz-actions");
  const feedbackEl = document.getElementById("quiz-feedback");
  const feedbackResultEl = document.getElementById("quiz-feedback-result");
  const feedbackSourceEl = document.getElementById("quiz-feedback-source");
  const nextBtn = document.getElementById("quiz-next");

  function loadRound() {
    answered = false;
    const idx = order[current];
    const round = QUIZ_ROUNDS[idx];

    progressEl.textContent = `Foto ${current + 1} / ${QUIZ_ROUNDS.length}`;
    captionEl.textContent = round.caption;
    photoEl.className = "ic-quiz__photo";
    renderPhoto(photoEl, round, idx);

    actionsEl.hidden = false;
    feedbackEl.hidden = true;
    feedbackSourceEl.hidden = true;
    photoEl.classList.remove("ic-quiz__photo--correct", "ic-quiz__photo--wrong");
  }

  function handleVote(vote) {
    if (answered) return;
    answered = true;

    const idx = order[current];
    const round = QUIZ_ROUNDS[idx];
    const guessedReal = vote === "real";
    const correct = guessedReal === round.isReal;

    if (correct) score += 1;

    actionsEl.hidden = true;
    feedbackEl.hidden = false;
    photoEl.classList.add(correct ? "ic-quiz__photo--correct" : "ic-quiz__photo--wrong");

    const truth = round.isReal ? "ein echtes Foto" : "KI-generiert";
    feedbackResultEl.textContent = correct
      ? `Richtig — das war ${truth}.`
      : `Leider falsch — das war ${truth}.`;

    if (round.isReal && round.source) {
      feedbackSourceEl.hidden = false;
      feedbackSourceEl.innerHTML = `Quelle: <a href="${round.source}" target="_blank" rel="noopener">${round.source}</a>`;
    }
  }

  function nextRound() {
    current += 1;
    if (current >= order.length) {
      showScore();
    } else {
      loadRound();
    }
  }

  actionsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-vote]");
    if (!btn) return;
    handleVote(btn.dataset.vote);
  });
  nextBtn.addEventListener("click", nextRound);

  // ---------------------------------------------------------------------
  // Score
  // ---------------------------------------------------------------------

  const scoreEl = document.getElementById("quiz-score");

  function showScore() {
    scoreEl.textContent = `${score} von ${QUIZ_ROUNDS.length} richtig`;
    showStage("score");
  }

  document.getElementById("quiz-to-sources").addEventListener("click", showSources);

  // ---------------------------------------------------------------------
  // Sources recap
  // ---------------------------------------------------------------------

  const sourcesListEl = document.getElementById("quiz-sources-list");

  function showSources() {
    sourcesListEl.innerHTML = "";
    QUIZ_ROUNDS.forEach((round, idx) => {
      if (!round.isReal) return;
      const li = document.createElement("li");
      li.className = "ic-quiz__source-item";
      const link = round.source
        ? `<a href="${round.source}" target="_blank" rel="noopener">${round.source}</a>`
        : "Quelle folgt";
      li.innerHTML = `<span class="ic-quiz__source-caption">Foto ${idx + 1}: ${round.caption}</span><span class="ic-quiz__source-link">${link}</span>`;
      sourcesListEl.appendChild(li);
    });
    showStage("sources");
  }

  document.getElementById("quiz-to-explain").addEventListener("click", startExplain);

  // ---------------------------------------------------------------------
  // AI-tell explanations (up to 3 flagged photos)
  // ---------------------------------------------------------------------

  const explainItems = QUIZ_ROUNDS.filter((r) => !r.isReal && r.explain).slice(0, 3);
  let explainIndex = 0;

  const explainProgressEl = document.getElementById("quiz-explain-progress");
  const explainCaptionEl = document.getElementById("quiz-explain-caption");
  const explainPhotoEl = document.getElementById("quiz-explain-photo");
  const explainTextEl = document.getElementById("quiz-explain-text");
  const explainNextBtn = document.getElementById("quiz-explain-next");

  function startExplain() {
    explainIndex = 0;
    if (explainItems.length === 0) {
      showStage("end");
      return;
    }
    loadExplain();
    showStage("explain");
  }

  function loadExplain() {
    const round = explainItems[explainIndex];
    explainProgressEl.textContent = `KI-Beispiel ${explainIndex + 1} / ${explainItems.length}`;
    explainCaptionEl.textContent = round.caption;
    explainPhotoEl.className = "ic-quiz__photo";
    renderPhoto(explainPhotoEl, round, QUIZ_ROUNDS.indexOf(round));
    explainTextEl.textContent = round.explainText || "Erklärung folgt.";
    explainNextBtn.textContent =
      explainIndex === explainItems.length - 1 ? "Fertig" : "Weiter";
  }

  explainNextBtn.addEventListener("click", () => {
    explainIndex += 1;
    if (explainIndex >= explainItems.length) {
      showStage("end");
    } else {
      loadExplain();
    }
  });

  // ---------------------------------------------------------------------
  // Start / restart
  // ---------------------------------------------------------------------

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function start() {
    order = shuffle(QUIZ_ROUNDS.map((_, i) => i));
    current = 0;
    score = 0;
    showStage("round");
    loadRound();
  }

  document.getElementById("quiz-start").addEventListener("click", start);
  document.getElementById("quiz-restart").addEventListener("click", start);

  showStage("intro");
})();

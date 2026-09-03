// Klick & Klar – Digitaler Selbstcheck (smartphone-check.js)
//
// Kleiner, clientseitiger Multi-Step-Test. Kein Framework, kein Backend,
// keine Speicherung von Antworten (State lebt nur im Skript, geht beim
// Reload verloren – so ist es gewollt). Fragen sind datengetrieben in
// QUESTIONS definiert; Rendering & Navigation sind generisch.

(() => {
  const root = document.getElementById("check-root");
  if (!root) return; // Skript nur auf dieser Seite aktiv

  const stage = document.getElementById("check-stage");
  const progressLabel = document.getElementById("check-progress");
  const barFill = document.getElementById("check-bar-fill");

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // ---------------------------------------------------------------------
  // Fragen-Definition (datengetrieben statt pro Frage hart codiert)
  // ---------------------------------------------------------------------

  const FREQUENCY_5 = ["Nie", "Selten", "Manchmal", "Oft", "Sehr oft"];
  const FREQUENCY_5_HABIT = ["Nie", "Selten", "Manchmal", "Meistens", "Immer"];

  const QUESTIONS = [
    {
      id: "usage",
      type: "time-slider",
      headline: "Wie lange bist du pro Tag auf deinem Handy?",
    },
    {
      id: "feeling",
      type: "choice",
      headline:
        "Wie fühlst du dich meistens, nachdem du dein Smartphone länger benutzt hast?",
      options: [
        "Sehr gut",
        "Eher gut",
        "Neutral",
        "Eher erschöpft oder unruhig",
        "Sehr erschöpft oder unruhig",
      ],
    },
    {
      id: "control",
      type: "control-slider",
      headline:
        "Wie viel Kontrolle hast du darüber, wie lange du am Handy bist?",
      minLabel: "Ich entscheide selbst",
      maxLabel: "Mein Handy entscheidet eher für mich",
      descriptions: [
        "Ich lege das Handy meistens bewusst wieder weg.",
        "Meistens habe ich einen guten Überblick über meine Nutzung.",
        "Manchmal bleibe ich länger als geplant.",
        "Öfter merke ich erst spät, wie viel Zeit vergangen ist.",
        "Ich bleibe häufig deutlich länger am Handy, als ich eigentlich möchte.",
      ],
    },
    {
      id: "aimless",
      type: "choice",
      headline: "Wie oft greifst du zum Handy, ohne genau zu wissen warum?",
      options: FREQUENCY_5,
    },
    {
      id: "distraction",
      type: "choice",
      headline:
        "Wie oft benutzt du dein Smartphone, obwohl du eigentlich etwas anderes tun wolltest?",
      options: FREQUENCY_5,
    },
    {
      id: "morning",
      type: "choice",
      headline:
        "Wie häufig schaust du innerhalb der ersten 10 Minuten nach dem Aufwachen aufs Handy?",
      options: FREQUENCY_5_HABIT,
    },
    {
      id: "night",
      type: "choice",
      headline: "Wie häufig benutzt du dein Smartphone kurz vor dem Einschlafen?",
      options: FREQUENCY_5_HABIT,
    },
  ];

  const TOTAL = QUESTIONS.length;
  const TIME_STEP_HOURS = 0.25; // 15 Minuten
  const TIME_MAX_STEP = 24; // 24 * 0.25h = 6h
  const TIME_PLUS_STEP = 25; // Sentinel für "6+"

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------

  let current = 0; // Index in QUESTIONS, oder TOTAL für die Ergebnisseite
  let direction = "forward";
  const answers = {}; // id -> Rohwert (Slider-Step oder Options-Index)

  // ---------------------------------------------------------------------
  // Hilfsfunktionen: Zeit-Slider
  // ---------------------------------------------------------------------

  function hoursFromStep(step) {
    return step >= TIME_PLUS_STEP ? 6 : step * TIME_STEP_HOURS;
  }

  function formatTime(step) {
    const isPlus = step >= TIME_PLUS_STEP;
    const hours = hoursFromStep(step);
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);

    let label;
    if (isPlus) {
      label = "6+ Std.";
    } else if (wholeHours === 0) {
      label = `${minutes} Min.`;
    } else if (minutes === 0) {
      label = `${wholeHours} Std.`;
    } else {
      label = `${wholeHours} Std. ${minutes} Min.`;
    }

    return { label, isPlus, hours };
  }

  function daysPerYear(hours) {
    return Math.round((hours * 365) / 24);
  }

  function daysPerYearSentence(step) {
    const { hours, isPlus } = formatTime(step);
    const days = daysPerYear(hours);
    return isPlus
      ? `Das sind rechnerisch mindestens ${days} Tage pro Jahr.`
      : `Das sind etwa ${days} Tage pro Jahr.`;
  }

  // ---------------------------------------------------------------------
  // Rendering: Kopfbereich (Fortschritt)
  // ---------------------------------------------------------------------

  function updateTopBar() {
    const step = Math.min(current + 1, TOTAL);
    progressLabel.textContent = current >= TOTAL ? "Ergebnis" : `${step} / ${TOTAL}`;
    const pct = current >= TOTAL ? 100 : (current / TOTAL) * 100;
    barFill.style.width = `${pct}%`;
  }

  // ---------------------------------------------------------------------
  // Rendering: gemeinsamer Panel-Rahmen inkl. Zurück/Weiter
  // ---------------------------------------------------------------------

  function buildControls(question) {
    const controls = document.createElement("div");
    controls.className = "check__controls";

    if (current > 0) {
      const back = document.createElement("button");
      back.type = "button";
      back.className = "check__back";
      back.id = "check-back";
      back.innerHTML = "&larr; Zurück";
      back.addEventListener("click", () => goTo(current - 1, "back"));
      controls.appendChild(back);
    }

    const next = document.createElement("button");
    next.type = "button";
    next.className = "btn btn--primary check__next";
    next.id = "check-next";
    next.textContent = current === TOTAL - 1 ? "Ergebnis ansehen" : "Weiter";
    next.disabled = answers[question.id] === undefined;
    next.addEventListener("click", () => goTo(current + 1, "forward"));
    controls.appendChild(next);

    return controls;
  }

  function setNextEnabled(enabled) {
    const next = document.getElementById("check-next");
    if (next) next.disabled = !enabled;
  }

  // ---------------------------------------------------------------------
  // Rendering: Frage-Typen
  // ---------------------------------------------------------------------

  function renderTimeSlider(question, panel) {
    const hasAnswer = answers[question.id] !== undefined;
    const step = hasAnswer ? answers[question.id] : 0; // Start bei 0h, erst "aktiv" nach Interaktion
    const touched = hasAnswer;

    const headline = document.createElement("h2");
    headline.className = "check__headline";
    headline.tabIndex = -1;
    headline.textContent = question.headline;
    panel.appendChild(headline);

    const valueWrap = document.createElement("div");
    valueWrap.style.textAlign = "center";
    const value = document.createElement("div");
    value.className = "check__value";
    value.textContent = touched ? formatTime(step).label : "– Std. – Min.";
    valueWrap.appendChild(value);
    panel.appendChild(valueWrap);

    const sliderWrap = document.createElement("div");

    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "check__slider";
    slider.min = "0";
    slider.max = String(TIME_PLUS_STEP);
    slider.step = "1";
    slider.value = String(step);
    slider.setAttribute("aria-label", question.headline);
    slider.setAttribute(
      "aria-valuetext",
      touched ? formatTime(step).label : "noch keine Angabe"
    );
    const fillPct = (step / TIME_PLUS_STEP) * 100;
    slider.style.setProperty("--fill", `${fillPct}%`);

    slider.addEventListener("input", () => {
      const s = Number(slider.value);
      answers[question.id] = s;
      const t = formatTime(s);
      value.textContent = t.label;
      slider.setAttribute("aria-valuetext", t.label);
      slider.style.setProperty("--fill", `${(s / TIME_PLUS_STEP) * 100}%`);
      hint.textContent = daysPerYearSentence(s);
      setNextEnabled(true);
    });

    sliderWrap.appendChild(slider);

    const scaleRow = document.createElement("div");
    scaleRow.className = "check__slider-scale";
    scaleRow.setAttribute("aria-hidden", "true");
    scaleRow.innerHTML = "<span>0 Std.</span><span>6+ Std.</span>";
    sliderWrap.appendChild(scaleRow);

    panel.appendChild(sliderWrap);

    const hint = document.createElement("p");
    hint.className = "check__hint";
    hint.textContent = touched
      ? daysPerYearSentence(step)
      : "Bewege den Regler, um deine tägliche Nutzung zu schätzen.";
    panel.appendChild(hint);

    panel.appendChild(buildControls(question));

    // Fokus nach dem Rendern auf die Überschrift, für klare Screenreader-
    // Ansage & konsistente Tastatur-Navigation zwischen den Schritten.
    requestAnimationFrame(() => headline.focus());
  }

  function renderControlSlider(question, panel) {
    const hasAnswer = answers[question.id] !== undefined;
    const step = hasAnswer ? answers[question.id] : 3; // Default Mitte
    const touched = hasAnswer;

    const headline = document.createElement("h2");
    headline.className = "check__headline";
    headline.tabIndex = -1;
    headline.textContent = question.headline;
    panel.appendChild(headline);

    const sliderWrap = document.createElement("div");

    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "check__slider";
    slider.min = "1";
    slider.max = "5";
    slider.step = "1";
    slider.value = String(step);
    slider.setAttribute("aria-label", question.headline);
    slider.setAttribute(
      "aria-valuetext",
      touched ? question.descriptions[step - 1] : "noch keine Angabe"
    );
    slider.style.setProperty("--fill", `${((step - 1) / 4) * 100}%`);

    slider.addEventListener("input", () => {
      const s = Number(slider.value);
      answers[question.id] = s;
      slider.setAttribute("aria-valuetext", question.descriptions[s - 1]);
      slider.style.setProperty("--fill", `${((s - 1) / 4) * 100}%`);
      hint.textContent = question.descriptions[s - 1];
      setNextEnabled(true);
    });

    sliderWrap.appendChild(slider);

    const scaleRow = document.createElement("div");
    scaleRow.className = "check__scale-labels";
    scaleRow.setAttribute("aria-hidden", "true");
    scaleRow.innerHTML = `<span>${question.minLabel}</span><span>${question.maxLabel}</span>`;
    sliderWrap.appendChild(scaleRow);

    panel.appendChild(sliderWrap);

    const hint = document.createElement("p");
    hint.className = "check__hint";
    hint.textContent = touched
      ? question.descriptions[step - 1]
      : "Bewege den Regler, um dich einzuordnen.";
    panel.appendChild(hint);

    panel.appendChild(buildControls(question));

    requestAnimationFrame(() => headline.focus());
  }

  function renderChoice(question, panel) {
    const headline = document.createElement("h2");
    headline.className = "check__headline";
    headline.tabIndex = -1;
    headline.textContent = question.headline;
    panel.appendChild(headline);

    const fieldset = document.createElement("fieldset");
    fieldset.className = "check__options";
    fieldset.style.border = "none";
    fieldset.style.margin = "0";
    fieldset.style.padding = "0";

    const legend = document.createElement("legend");
    legend.className = "sr-only";
    legend.textContent = question.headline;
    legend.style.position = "absolute";
    legend.style.left = "-9999px";
    fieldset.appendChild(legend);

    question.options.forEach((label, index) => {
      const wrap = document.createElement("div");
      wrap.className = "check__option";

      const inputId = `q-${question.id}-${index}`;
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `q-${question.id}`;
      input.id = inputId;
      input.value = String(index);
      input.checked = answers[question.id] === index;

      input.addEventListener("change", () => {
        answers[question.id] = index;
        setNextEnabled(true);
      });

      const optionLabel = document.createElement("label");
      optionLabel.setAttribute("for", inputId);
      optionLabel.textContent = label;

      wrap.appendChild(input);
      wrap.appendChild(optionLabel);
      fieldset.appendChild(wrap);
    });

    panel.appendChild(fieldset);

    const spacer = document.createElement("p");
    spacer.className = "check__hint";
    spacer.setAttribute("aria-hidden", "true");
    panel.appendChild(spacer);

    panel.appendChild(buildControls(question));

    requestAnimationFrame(() => headline.focus());
  }

  // ---------------------------------------------------------------------
  // Score-Logik
  // ---------------------------------------------------------------------

  function scaleToScore(index, length) {
    // 0 -> 0, (length-1) -> 100
    return (index / (length - 1)) * 100;
  }

  function categoryFor(score) {
    if (score >= 67) return "hoch";
    if (score >= 34) return "mittel";
    return "niedrig";
  }

  function computeScores() {
    const usageStep = answers.usage ?? 8;
    const usageHours = hoursFromStep(usageStep);
    const feelingIdx = answers.feeling ?? 2;
    const controlStep = answers.control ?? 3;
    const aimlessIdx = answers.aimless ?? 2;
    const distractionIdx = answers.distraction ?? 2;
    const morningIdx = answers.morning ?? 2;
    const nightIdx = answers.night ?? 2;

    // Nutzungsintensität: v.a. Nutzungszeit, ergänzt durch Gewohnheiten
    const usageComponent = (Math.min(usageHours, 6) / 6) * 100;
    const aimlessComponent = scaleToScore(aimlessIdx, 5);
    const distractionComponent = scaleToScore(distractionIdx, 5);
    const intensity = Math.round(
      usageComponent * 0.6 + aimlessComponent * 0.2 + distractionComponent * 0.2
    );

    // Bewusste Kontrolle: v.a. Frage 3, ergänzt durch 4 & 5 (invertiert)
    const controlComponent = ((5 - controlStep) / 4) * 100;
    const aimlessControlComponent = 100 - aimlessComponent;
    const distractionControlComponent = 100 - distractionComponent;
    const control = Math.round(
      controlComponent * 0.5 +
        aimlessControlComponent * 0.25 +
        distractionControlComponent * 0.25
    );

    // Wohlbefinden nach der Nutzung: v.a. Frage 2, leicht ergänzt durch 6 & 7
    const feelingComponent = 100 - scaleToScore(feelingIdx, 5);
    const morningComponent = 100 - scaleToScore(morningIdx, 5);
    const nightComponent = 100 - scaleToScore(nightIdx, 5);
    const wellbeing = Math.round(
      feelingComponent * 0.7 + morningComponent * 0.15 + nightComponent * 0.15
    );

    return {
      usageStep,
      intensity: clamp0to100(intensity),
      control: clamp0to100(control),
      wellbeing: clamp0to100(wellbeing),
    };
  }

  function clamp0to100(n) {
    return Math.max(0, Math.min(100, n));
  }

  const INTENSITY_TEXT = {
    niedrig: "Dein Smartphone spielt in deinem Alltag eher eine kleine Rolle.",
    mittel:
      "Deine Smartphone-Nutzung nimmt einen spürbaren Teil deines Alltags ein.",
    hoch: "Dein Smartphone ist über den Tag verteilt ein sehr präsenter Begleiter.",
  };

  const CONTROL_TEXT = {
    niedrig:
      "Gleichzeitig hast du öfter das Gefühl, dass dein Handy dich länger hält, als du eigentlich vorhattest.",
    mittel:
      "Gleichzeitig gibt es Situationen, in denen du das Gerät länger nutzt, als du ursprünglich wolltest.",
    hoch: "Gleichzeitig hast du meistens ein gutes Gefühl dafür, wann du das Handy wieder weglegst.",
  };

  const WELLBEING_TEXT = {
    niedrig:
      "Nach längerer Nutzung fühlst du dich häufiger erschöpft oder unruhig – ein guter Anlass, bewusst öfter Pausen einzubauen.",
    mittel:
      "Wie du dich nach der Nutzung fühlst, ist unterschiedlich – mal gut, mal eher anstrengend.",
    hoch: "Nach der Nutzung fühlst du dich meistens gut – dein Umgang mit dem Handy scheint dir aktuell nicht zu schaden.",
  };

  function summaryText(scores) {
    const intensityCat = categoryFor(scores.intensity);
    const controlCat = categoryFor(scores.control);
    const wellbeingCat = categoryFor(scores.wellbeing);
    return [
      INTENSITY_TEXT[intensityCat],
      CONTROL_TEXT[controlCat],
      WELLBEING_TEXT[wellbeingCat],
    ].join(" ");
  }

  // ---------------------------------------------------------------------
  // Rendering: Ergebnisseite
  // ---------------------------------------------------------------------

  function dimensionRow(name, score) {
    const cat = categoryFor(score);
    const filled = Math.round(score / 10);

    const row = document.createElement("div");

    const head = document.createElement("div");
    head.className = "check__dimension-head";
    const nameEl = document.createElement("span");
    nameEl.className = "check__dimension-name";
    nameEl.textContent = name;
    const labelEl = document.createElement("span");
    labelEl.className = "check__dimension-label";
    labelEl.textContent = cat;
    head.appendChild(nameEl);
    head.appendChild(labelEl);
    row.appendChild(head);

    const dots = document.createElement("div");
    dots.className = "check__dots";
    dots.setAttribute("role", "img");
    dots.setAttribute(
      "aria-label",
      `${name}: ${cat} (${filled} von 10)`
    );
    for (let i = 0; i < 10; i++) {
      const dot = document.createElement("span");
      if (i < filled) dot.classList.add("is-filled");
      dots.appendChild(dot);
    }
    row.appendChild(dots);

    return row;
  }

  function renderResults(panel) {
    const scores = computeScores();
    const { hours, isPlus } = formatTime(scores.usageStep);
    const days = daysPerYear(hours);
    const timeLabel = formatTime(scores.usageStep).label;

    const head = document.createElement("div");
    head.className = "check__results-head";
    const h2 = document.createElement("h2");
    h2.tabIndex = -1;
    h2.textContent = "Dein digitales Nutzungsprofil";
    head.appendChild(h2);
    const sub = document.createElement("p");
    sub.textContent =
      "Eine kurze, unaufgeregte Einordnung deiner Antworten – keine Diagnose.";
    head.appendChild(sub);
    panel.appendChild(head);

    const highlight = document.createElement("div");
    highlight.className = "check__highlight";
    const num = document.createElement("div");
    num.className = "check__highlight-number";
    num.innerHTML = `<span>${days}</span> Tage`;
    highlight.appendChild(num);
    const copy = document.createElement("p");
    copy.className = "check__highlight-copy";
    copy.textContent = isPlus
      ? `Bei deiner angegebenen Nutzung von ${timeLabel} täglich verbringst du rechnerisch mindestens ${days} Tage pro Jahr am Smartphone.`
      : `Bei deiner angegebenen Nutzung von ${timeLabel} täglich verbringst du rechnerisch etwa ${days} Tage pro Jahr am Smartphone.`;
    highlight.appendChild(copy);
    const note = document.createElement("p");
    note.className = "check__highlight-note";
    note.textContent =
      "Das ist eine rechnerische Hochrechnung und keine Bewertung deiner Smartphone-Nutzung.";
    highlight.appendChild(note);
    panel.appendChild(highlight);

    const summary = document.createElement("p");
    summary.className = "check__summary";
    summary.textContent = summaryText(scores);
    panel.appendChild(summary);

    const dims = document.createElement("div");
    dims.className = "check__dimensions";
    dims.appendChild(dimensionRow("Nutzungsintensität", scores.intensity));
    dims.appendChild(dimensionRow("Bewusste Kontrolle", scores.control));
    dims.appendChild(dimensionRow("Wohlbefinden nach der Nutzung", scores.wellbeing));
    panel.appendChild(dims);

    const cta = document.createElement("div");
    cta.className = "check__cta";
    const restart = document.createElement("button");
    restart.type = "button";
    restart.className = "btn btn--primary";
    restart.textContent = "Nochmal machen";
    restart.addEventListener("click", resetCheck);
    cta.appendChild(restart);

    // Zweiter CTA ("Mehr über bewusste Mediennutzung erfahren") bewusst
    // weggelassen: Es gibt aktuell keine dedizierte Info-Seite dazu, nur
    // Abschnitte auf der Startseite. Sobald es eine solche Seite gibt,
    // hier einen zweiten <a class="btn btn--secondary"> ergänzen.

    panel.appendChild(cta);

    requestAnimationFrame(() => h2.focus());
  }

  // ---------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------

  function resetCheck() {
    current = 0;
    direction = "forward";
    Object.keys(answers).forEach((k) => delete answers[k]);
    render();
  }

  function goTo(index, dir) {
    if (index < 0 || index > TOTAL) return;
    current = index;
    direction = dir;
    render();
  }

  function render() {
    updateTopBar();
    stage.innerHTML = "";

    const panel = document.createElement("div");
    panel.className = "check__panel";
    if (!prefersReducedMotion) {
      panel.classList.add(direction === "back" ? "is-leaving-back" : "is-entering");
    }
    stage.appendChild(panel);

    if (current >= TOTAL) {
      renderResults(panel);
      return;
    }

    const question = QUESTIONS[current];
    if (question.type === "time-slider") {
      renderTimeSlider(question, panel);
    } else if (question.type === "control-slider") {
      renderControlSlider(question, panel);
    } else {
      renderChoice(question, panel);
    }
  }

  render();
})();

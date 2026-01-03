// ========================
// Eco-Responders Prototype
// Save: local autosave + shareable Resume Code + QR link
// ========================

// ---- Local storage helpers ----
function loadSaved(key) {
  return localStorage.getItem(key) || "";
}
function saveLocal(key, value) {
  localStorage.setItem(key, value);
}
function removeLocal(key) {
  localStorage.removeItem(key);
}

// ---- Keys to include in Save & Exit state ----
const SAVE_KEYS = [
  "startedMission",   // begin mission clicked
  "pathChoice",       // noaa | field
  "currentView",      // sceneA | sceneB | branchNoaa | branchField
  // writing boxes
  "noaa_journal",
  "noaa_challenge",
  "field_journal",
  "field_challenge",
];

// ---- UI elements ----
const beginMissionBtn = document.getElementById("beginMissionBtn");
const sceneB = document.getElementById("sceneB");

const choiceFeedback = document.getElementById("choiceFeedback");
const continueBtn = document.getElementById("continueBtn");

const branchNoaa = document.getElementById("branchNoaa");
const branchField = document.getElementById("branchField");

const widgetMsg = document.getElementById("widgetMsg");
const qrWrap = document.getElementById("qrWrap");
const qrEl = document.getElementById("qr");

// Resume UI
const resumeInput = document.getElementById("resumeInput");
const resumeBtn = document.getElementById("resumeBtn");
const clearResumeInputBtn = document.getElementById("clearResumeInputBtn");

// Save & Exit
const saveExitBtn = document.getElementById("saveExitBtn");

// ---- Textareas autosave ----
document.querySelectorAll("textarea[data-save]").forEach((ta) => {
  const key = ta.dataset.save;
  ta.value = loadSaved(key);
  ta.addEventListener("input", () => saveLocal(key, ta.value));
});

// ---- View control (keeps flow simple) ----
function showView(viewId) {
  // Hide all major sections except sceneA (always visible)
  // sceneA stays; we toggle sceneB/branches
  // Save where they are
  saveLocal("currentView", viewId);

  if (viewId === "sceneA") {
    sceneB.classList.add("hidden");
    branchNoaa.classList.add("hidden");
    branchField.classList.add("hidden");
    return;
  }

  if (viewId === "sceneB") {
    sceneB.classList.remove("hidden");
    branchNoaa.classList.add("hidden");
    branchField.classList.add("hidden");
    return;
  }

  if (viewId === "branchNoaa") {
    sceneB.classList.remove("hidden");
    branchNoaa.classList.remove("hidden");
    branchField.classList.add("hidden");
    return;
  }

  if (viewId === "branchField") {
    sceneB.classList.remove("hidden");
    branchNoaa.classList.add("hidden");
    branchField.classList.remove("hidden");
    return;
  }
}

// ---- Begin Mission ----
if (beginMissionBtn) {
  beginMissionBtn.addEventListener("click", () => {
    saveLocal("startedMission", "yes");
    showView("sceneB");
    widgetMsg.textContent = "Mission started ✅";
  });
}

// ---- Choice buttons (NOAA vs Field) with immediate feedback ----
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-choice]");
  if (!btn) return;

  const type = btn.dataset.choice;
  const value = btn.dataset.value;

  if (type === "startpath") {
    saveLocal("pathChoice", value);

    const msg = (value === "noaa")
      ? `You chose to start with regional data.\n\nThis path will help you spot patterns over time—like rainfall, temperature, and fuel moisture—that influence fire risk before flames ever appear.\n\n🔍 Scientists often begin here when they want to predict what might happen next.`
      : `You chose to begin in the field.\n\nThis path focuses on direct evidence—what you can see, touch, and observe right now.\n\n🧭 Scientists take this approach when they want to understand impacts on people, plants, and animals.`;

    choiceFeedback.textContent = msg;
    choiceFeedback.classList.remove("hidden");

    continueBtn.classList.remove("hidden");
  }
});

// ---- Continue (go to selected branch) ----
if (continueBtn) {
  continueBtn.addEventListener("click", () => {
    const choice = loadSaved("pathChoice");
    if (choice === "noaa") showView("branchNoaa");
    else if (choice === "field") showView("branchField");
    else showView("sceneB");
  });
}

// ============================
// Resume Code (no server)
// ============================
// We encode the full saved state into the code itself.
// This is why it works without a server.
// (QR will contain a URL with that encoded state.)

function encodeState(obj) {
  const json = JSON.stringify(obj);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return `ER1.${b64}`; // version prefix
}

function decodeState(code) {
  if (!code.startsWith("ER1.")) throw new Error("That code doesn't look like a valid Resume Code.");
  const b64 = code.slice("ER1.".length);
  const json = decodeURIComponent(escape(atob(b64)));
  return JSON.parse(json);
}

function collectState() {
  const state = {};
  for (const k of SAVE_KEYS) state[k] = loadSaved(k);
  return state;
}

function applyState(state) {
  // write state into localStorage
  for (const k of SAVE_KEYS) {
    if (typeof state[k] === "string") saveLocal(k, state[k]);
  }

  // refill textareas
  document.querySelectorAll("textarea[data-save]").forEach((ta) => {
    const key = ta.dataset.save;
    ta.value = loadSaved(key);
  });

  // restore view
  const started = loadSaved("startedMission");
  const view = loadSaved("currentView") || (started === "yes" ? "sceneB" : "sceneA");
  showView(view);

  // restore choice feedback UI if relevant
  const choice = loadSaved("pathChoice");
  if (choice === "noaa" || choice === "field") {
    choiceFeedback.classList.remove("hidden");
    continueBtn.classList.remove("hidden");
  }
}

// ---- Save & Exit: create code + auto-copy + show QR ----
if (saveExitBtn) {
  saveExitBtn.addEventListener("click", async () => {
    const state = collectState();
    const code = encodeState(state);

    // Auto-copy to clipboard (and show it)
    try {
      await navigator.clipboard.writeText(code);
      widgetMsg.textContent = "✅ Resume Code copied!\n(You can also scan the QR.)";
    } catch {
      widgetMsg.textContent = "✅ Resume Code created.\nCopy it from the box below.";
    }

    // Put code in the input so they can see it/copy it
    resumeInput.value = code;

    // Build a shareable link that includes the code (for QR)
    // Use URL fragment so it doesn't hit any server logs.
    const url = `${location.origin}${location.pathname}#resume=${encodeURIComponent(code)}`;

    // Render QR
    qrWrap.classList.remove("hidden");
    qrEl.innerHTML = ""; // clear old QR
    // eslint-disable-next-line no-undef
    new QRCode(qrEl, {
      text: url,
      width: 160,
      height: 160,
      correctLevel: QRCode.CorrectLevel.M
    });
  });
}

// ---- Resume from Code button ----
if (resumeBtn) {
  resumeBtn.addEventListener("click", () => {
    try {
      const code = (resumeInput.value || "").trim();
      const state = decodeState(code);
      applyState(state);
      widgetMsg.textContent = "✅ Resumed! You're back where you left off.";
    } catch (err) {
      widgetMsg.textContent = `⚠️ ${err.message}`;
    }
  });
}

if (clearResumeInputBtn) {
  clearResumeInputBtn.addEventListener("click", () => {
    resumeInput.value = "";
    widgetMsg.textContent = "";
    qrWrap.classList.add("hidden");
    qrEl.innerHTML = "";
  });
}

// ---- Auto-resume if opened from a QR/link with #resume=... ----
function tryResumeFromUrl() {
  const hash = location.hash || "";
  const match = hash.match(/#resume=([^&]+)/);
  if (!match) return;

  try {
    const code = decodeURIComponent(match[1]);
    const state = decodeState(code);
    applyState(state);
    widgetMsg.textContent = "✅ Resumed from QR/link!";
    // optional: clear hash to reduce confusion
    history.replaceState(null, "", location.pathname);
  } catch {
    // ignore; keep normal behavior
  }
}

// ---- Initial restore from local autosave ----
function initialLoad() {
  tryResumeFromUrl();

  // If not resumed from URL, restore local view
  const started = loadSaved("startedMission");
  const view = loadSaved("currentView") || (started === "yes" ? "sceneB" : "sceneA");
  showView(view);

  // Restore choice UI
  const choice = loadSaved("pathChoice");
  if (choice === "noaa" || choice === "field") {
    choiceFeedback.classList.remove("hidden");
    continueBtn.classList.remove("hidden");
  }
}

initialLoad();

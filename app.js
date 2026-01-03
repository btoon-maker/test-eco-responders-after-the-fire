// ===========================
// Keys we save
// ===========================
const SAVE_KEYS = [
  "currentSection",
  "start_choice",             // "noaa" or "field"
  "noaa_prediction",
  "field_observations",
  "optional_challenge",
];

// ===========================
// Helpers
// ===========================
function getLS(key) { return localStorage.getItem(key) || ""; }
function setLS(key, val) { localStorage.setItem(key, val); }
function delLS(key) { localStorage.removeItem(key); }

function setStatus(msg) {
  const el = document.getElementById("saveStatus");
  if (el) el.textContent = msg;
}

function showSection(id) {
  setLS("currentSection", id);

  const ids = ["home", "missionStart", "branchNoaa", "branchField"];
  ids.forEach(sid => {
    const el = document.getElementById(sid);
    if (el) el.classList.toggle("hidden", sid !== id);
  });

  updateQrForCurrentState(); // keeps QR aligned with state
}

// ===========================
// Autosave textareas
// ===========================
function wireAutosave() {
  document.querySelectorAll("textarea[data-save]").forEach((ta) => {
    const key = ta.dataset.save;
    ta.value = getLS(key);
    ta.addEventListener("input", () => setLS(key, ta.value));
  });
}

// ===========================
// Resume Code (compressed, serverless)
// ===========================
function collectState() {
  const state = {};
  SAVE_KEYS.forEach(k => state[k] = getLS(k));
  return state;
}

function applyState(state) {
  SAVE_KEYS.forEach(k => {
    if (typeof state[k] === "string") setLS(k, state[k]);
  });

  // refill inputs
  document.querySelectorAll("textarea[data-save]").forEach((ta) => {
    ta.value = getLS(ta.dataset.save);
  });

  // restore choice UI if present
  const choice = getLS("start_choice");
  if (choice) {
    const cont = document.getElementById("continueAfterChoiceBtn");
    if (cont) cont.disabled = false;
    renderChoiceFeedback(choice);
  }

  const section = getLS("currentSection") || "home";
  showSection(section);
}

function encodeResumeCode(stateObj) {
  const json = JSON.stringify(stateObj);
  const compressed = LZString.compressToEncodedURIComponent(json);
  return `R1.${compressed}`;
}

function decodeResumeCode(code) {
  const trimmed = (code || "").trim();
  if (!trimmed.startsWith("R1.")) throw new Error("That doesn't look like a valid Resume Code.");
  const compressed = trimmed.slice(3);
  const json = LZString.decompressFromEncodedURIComponent(compressed);
  if (!json) throw new Error("That code couldn't be read. Check for missing characters.");
  return JSON.parse(json);
}

// ===========================
// QR creation (lesson + resume state)
// ===========================
let qr;
function buildResumeUrl(code) {
  const url = new URL(window.location.href);
  url.searchParams.set("resume", code);
  return url.toString();
}

function updateQrForCurrentState() {
  const code = encodeResumeCode(collectState());
  const url = buildResumeUrl(code);

  // Update (but don't overwrite if user is typing)
  const input = document.getElementById("resumeInput");
  if (input && !input.value) input.value = code;

  // Modal QR (only render into modal target)
  const qrBox = document.getElementById("qrCode");
  if (!qrBox) return;

  qrBox.innerHTML = "";
  qr = new QRCode(qrBox, {
    text: url,
    width: 170,
    height: 170,
    correctLevel: QRCode.CorrectLevel.M,
  });

  return { code, url };
}

// ===========================
// Clipboard
// ===========================
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ===========================
// Choice feedback
// ===========================
function renderChoiceFeedback(which) {
  const box = document.getElementById("choiceFeedback");
  if (!box) return;

  box.classList.remove("hidden");
  if (which === "noaa") {
    box.innerHTML = `
      <h3 style="margin-top:0;">You chose to start with regional data.</h3>
      <p style="margin:0;">
        This path helps you spot patterns over time—like rainfall, heat, and fuel moisture—that influence fire risk.
      </p>`;
  } else {
    box.innerHTML = `
      <h3 style="margin-top:0;">You chose to begin in the field.</h3>
      <p style="margin:0;">
        This path focuses on direct evidence—what you can observe right now—so you can understand impacts on people and wildlife.
      </p>`;
  }
}

// ===========================
// Pause Modal (center pop-out)
// ===========================
function openPauseModal() {
  const overlay = document.getElementById("pauseOverlay");
  const codeBox = document.getElementById("resumeCodeBox");
  const modalMsg = document.getElementById("modalMsg");
  const resumeInput = document.getElementById("resumeInput");

  const { code } = updateQrForCurrentState() || { code: encodeResumeCode(collectState()) };

  // show code in modal
  if (codeBox) codeBox.textContent = code;

  // also put code into the top-right input so it’s visible there too
  if (resumeInput) resumeInput.value = code;

  // auto-copy
  copyToClipboard(code).then((ok) => {
    if (modalMsg) modalMsg.textContent = ok
      ? "✅ Resume Code copied automatically.\n(You can also scan the QR.)"
      : "⚠️ Auto-copy was blocked.\nUse the Copy Code button.";
  });

  if (overlay) overlay.classList.add("show");
}

function closePauseModal() {
  const overlay = document.getElementById("pauseOverlay");
  if (overlay) overlay.classList.remove("show");
}

// ===========================
// Export My Journal (PDF)
// ===========================
function getPromptTextFor(key) {
  const p = document.querySelector(`[data-prompt-for="${key}"]`);
  return (p ? p.textContent.trim() : "");
}

function buildJournalExportData() {
  const started = getLS("currentSection") !== "" ? "Yes" : "No";
  const choice = getLS("start_choice") || "(not chosen)";

  const sections = [];

  // Choices
  sections.push({
    title: "Choices",
    items: [
      { prompt: "Begin Mission started?", answer: started },
      { prompt: "Where did you begin?", answer: choice },
    ]
  });

  // Writing blocks (include prompts + answers)
  const keys = ["noaa_prediction", "field_observations", "optional_challenge"];
  const writingItems = keys.map(k => ({
    prompt: getPromptTextFor(k) || k,
    answer: getLS(k) || "(blank)"
  }));

  sections.push({
    title: "Field Journal Responses",
    items: writingItems
  });

  return sections;
}

function exportJournalToPdf() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "letter" });

  const margin = 48;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = pageW - margin * 2;

  let y = margin;

  function addTitle(text) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    const lines = doc.splitTextToSize(text, maxW);
    lines.forEach(line => {
      if (y > pageH - margin) { doc.addPage(); y = margin; }
      doc.text(line, margin, y);
      y += 20;
    });
    y += 6;
  }

  function addSubhead(text) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    if (y > pageH - margin) { doc.addPage(); y = margin; }
    doc.text(text, margin, y);
    y += 16;
  }

  function addBlock(label, text) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const labelLines = doc.splitTextToSize(label, maxW);
    labelLines.forEach(line => {
      if (y > pageH - margin) { doc.addPage(); y = margin; }
      doc.text(line, margin, y);
      y += 14;
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(text, maxW);
    lines.forEach(line => {
      if (y > pageH - margin) { doc.addPage(); y = margin; }
      doc.text(line, margin, y);
      y += 14;
    });

    y += 10;
  }

  addTitle("Eco-Responders: After the Fire — My Journal Export");

  const sections = buildJournalExportData();
  sections.forEach(sec => {
    addSubhead(sec.title);
    sec.items.forEach(item => {
      addBlock("Prompt:", item.prompt || "(prompt)");
      addBlock("My Answer:", item.answer || "(blank)");
    });
    y += 6;
  });

  doc.save("Eco-Responders_Journal.pdf");
}

// ===========================
// Wire buttons
// ===========================
function wireButtons() {
  // Begin Mission
  document.getElementById("beginMissionBtn")?.addEventListener("click", () => {
    showSection("missionStart");
    setStatus("Mission started ✅");
  });

  // Choices
  const contBtn = document.getElementById("continueAfterChoiceBtn");

  document.getElementById("choiceNoaaBtn")?.addEventListener("click", () => {
    setLS("start_choice", "noaa");
    renderChoiceFeedback("noaa");
    if (contBtn) contBtn.disabled = false;
    setStatus("Choice saved.");
    updateQrForCurrentState();
  });

  document.getElementById("choiceFieldBtn")?.addEventListener("click", () => {
    setLS("start_choice", "field");
    renderChoiceFeedback("field");
    if (contBtn) contBtn.disabled = false;
    setStatus("Choice saved.");
    updateQrForCurrentState();
  });

  contBtn?.addEventListener("click", () => {
    const choice = getLS("start_choice");
    if (choice === "noaa") showSection("branchNoaa");
    else if (choice === "field") showSection("branchField");
  });

  // Back
  document.getElementById("backToStartFromNoaaBtn")?.addEventListener("click", () => showSection("missionStart"));
  document.getElementById("backToStartFromFieldBtn")?.addEventListener("click", () => showSection("missionStart"));

  // Pause & Resume Later (opens modal)
  document.getElementById("pauseBtn")?.addEventListener("click", () => {
    openPauseModal();
    setStatus("Paused.");
  });

  // Modal close
  document.getElementById("closePauseBtn")?.addEventListener("click", closePauseModal);
  document.getElementById("pauseOverlay")?.addEventListener("click", (e) => {
    if (e.target && e.target.id === "pauseOverlay") closePauseModal();
  });

  // Modal Copy
  document.getElementById("copyCodeBtn")?.addEventListener("click", async () => {
    const code = document.getElementById("resumeCodeBox")?.textContent || "";
    const ok = await copyToClipboard(code);
    const modalMsg = document.getElementById("modalMsg");
    if (modalMsg) modalMsg.textContent = ok ? "✅ Copied!" : "⚠️ Copy blocked. Select the code and copy.";
  });

  // Resume from input (top-right)
  document.getElementById("resumeBtn")?.addEventListener("click", () => {
    const input = document.getElementById("resumeInput");
    const code = (input?.value || "").trim();
    try {
      const state = decodeResumeCode(code);
      applyState(state);
      setStatus("Resumed!");
    } catch (e) {
      setStatus(`Resume failed: ${e.message}`);
    }
  });

  document.getElementById("clearResumeInputBtn")?.addEventListener("click", () => {
    const input = document.getElementById("resumeInput");
    if (input) input.value = "";
    setStatus("Cleared.");
  });

  // Export PDF (bottom)
  document.getElementById("exportPdfBtn")?.addEventListener("click", () => {
    exportJournalToPdf();
  });
}

// ===========================
// Auto-resume from URL (?resume=...)
// ===========================
function maybeResumeFromUrl() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("resume");
  if (!code) return false;

  try {
    const state = decodeResumeCode(code);
    applyState(state);
    setStatus("Resumed from QR ✅");
    return true;
  } catch (e) {
    setStatus(`QR resume failed: ${e.message}`);
    return false;
  }
}

// ===========================
// Boot
// ===========================
wireAutosave();
wireButtons();

const didResume = maybeResumeFromUrl();
if (!didResume) {
  const section = getLS("currentSection") || "home";
  showSection(section);

  const choice = getLS("start_choice");
  if (choice) {
    document.getElementById("continueAfterChoiceBtn").disabled = false;
    renderChoiceFeedback(choice);
  } else {
    document.getElementById("choiceFeedback")?.classList.add("hidden");
  }
}

// Ensure QR in modal always matches current state
updateQrForCurrentState();
setStatus("Ready.");

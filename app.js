// ===========================
// State keys for this page
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

function setTopStatus(msg) {
  const el = document.getElementById("saveStatus");
  if (el) el.textContent = msg;
}
function setModalStatus(msg) {
  const el = document.getElementById("modalStatus");
  if (el) el.textContent = msg;
}

function showSection(id) {
  setLS("currentSection", id);

  const ids = ["home", "missionStart", "branchNoaa", "branchField"];
  ids.forEach(sid => {
    const el = document.getElementById(sid);
    if (el) el.classList.toggle("hidden", sid !== id);
  });
}

// ===========================
// Autosave for journal boxes
// ===========================
function wireAutosave() {
  document.querySelectorAll("textarea[data-save]").forEach((ta) => {
    const key = ta.dataset.save;
    ta.value = getLS(key);
    ta.addEventListener("input", () => setLS(key, ta.value));
  });
}

// ===========================
// Resume Code (compressed)
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

  // refill textareas
  document.querySelectorAll("textarea[data-save]").forEach((ta) => {
    ta.value = getLS(ta.dataset.save);
  });

  // restore choice UI state
  const choice = getLS("start_choice");
  if (choice) {
    const contBtn = document.getElementById("continueAfterChoiceBtn");
    if (contBtn) contBtn.disabled = false;
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
// QR Code: lesson + resume
// ===========================
function buildResumeUrl(code) {
  const url = new URL(window.location.href);
  url.searchParams.set("resume", code);
  return url.toString();
}

function renderQrInto(el, text) {
  if (!el) return;
  el.innerHTML = "";
  new QRCode(el, {
    text,
    width: 160,
    height: 160,
    correctLevel: QRCode.CorrectLevel.M,
  });
}

// ===========================
// Clipboard helper
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
// Choice feedback (content unchanged)
// ===========================
function renderChoiceFeedback(which) {
  const box = document.getElementById("choiceFeedback");
  if (!box) return;

  box.classList.remove("hidden");
  if (which === "noaa") {
    box.innerHTML = `
      <h3 style="margin-top:0;">You chose to start with regional data.</h3>
      <p style="margin:0;">
        This path will help you spot patterns over time—like rainfall, heat, and fuel moisture—that influence fire risk
        before flames ever appear. 🔍 Scientists often begin here when they want to predict what might happen next.
      </p>
    `;
  } else {
    box.innerHTML = `
      <h3 style="margin-top:0;">You chose to begin in the field.</h3>
      <p style="margin:0;">
        This path focuses on direct evidence—what you can see, touch, and observe right now.
        🧭 Scientists take this approach when they want to understand impacts on people, plants, and animals.
      </p>
    `;
  }
}

// ===========================
// Modal open/close
// ===========================
function openModalWithCurrentState() {
  const overlay = document.getElementById("overlay");
  const resumeBox = document.getElementById("resumeCodeBox");
  const resumeInput = document.getElementById("resumeInput");
  const qrEl = document.getElementById("qrCodeModal");

  const code = encodeResumeCode(collectState());
  const url = buildResumeUrl(code);

  if (resumeBox) resumeBox.textContent = code;
  if (resumeInput) resumeInput.value = code;

  renderQrInto(qrEl, url);

  setModalStatus("Resume Code created. Copy it or scan the QR.");

  // Attempt auto-copy
  copyToClipboard(code).then(ok => {
    if (ok) {
      setTopStatus("Paused. Resume Code copied.");
      setModalStatus("✅ Resume Code copied automatically. Scan QR to resume on another device.");
    } else {
      setTopStatus("Paused. (Copy may be blocked.)");
      setModalStatus("⚠️ Auto-copy was blocked by the browser. Use the Copy Code button.");
    }
  });

  if (overlay) {
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
  }
}

function closeModal() {
  const overlay = document.getElementById("overlay");
  if (overlay) {
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
  }
}

// ===========================
// Wire up buttons (including Begin Mission)
// ===========================
function wireButtons() {
  // Begin Mission
  document.getElementById("beginMissionBtn")?.addEventListener("click", () => {
    showSection("missionStart");
  });

  // Choices
  const contBtn = document.getElementById("continueAfterChoiceBtn");

  document.getElementById("choiceNoaaBtn")?.addEventListener("click", () => {
    setLS("start_choice", "noaa");
    renderChoiceFeedback("noaa");
    if (contBtn) contBtn.disabled = false;
    setTopStatus("Choice saved.");
  });

  document.getElementById("choiceFieldBtn")?.addEventListener("click", () => {
    setLS("start_choice", "field");
    renderChoiceFeedback("field");
    if (contBtn) contBtn.disabled = false;
    setTopStatus("Choice saved.");
  });

  contBtn?.addEventListener("click", () => {
    const choice = getLS("start_choice");
    if (choice === "noaa") showSection("branchNoaa");
    else if (choice === "field") showSection("branchField");
  });

  // Back buttons
  document.getElementById("backToStartFromNoaaBtn")?.addEventListener("click", () => showSection("missionStart"));
  document.getElementById("backToStartFromFieldBtn")?.addEventListener("click", () => showSection("missionStart"));

  // Pause & Resume Later (opens modal)
  document.getElementById("pauseResumeBtn")?.addEventListener("click", () => {
    openModalWithCurrentState();
  });

  // Close modal
  document.getElementById("closeModalBtn")?.addEventListener("click", closeModal);

  // Click outside modal closes it (overlay click)
  document.getElementById("overlay")?.addEventListener("click", (e) => {
    if (e.target && e.target.id === "overlay") closeModal();
  });

  // Copy code
  document.getElementById("copyCodeBtn")?.addEventListener("click", async () => {
    const code = document.getElementById("resumeCodeBox")?.textContent || "";
    const ok = await copyToClipboard(code);
    setModalStatus(ok ? "✅ Copied!" : "⚠️ Copy blocked—select the code and copy.");
  });

  // Resume from pasted code
  document.getElementById("resumeBtn")?.addEventListener("click", () => {
    const input = document.getElementById("resumeInput");
    const code = (input?.value || "").trim();
    try {
      const state = decodeResumeCode(code);
      applyState(state);
      setTopStatus("Resumed!");
      setModalStatus("✅ Resumed! You're back where you left off.");
      closeModal();
    } catch (e) {
      setModalStatus(`Resume failed: ${e.message}`);
    }
  });

  // Clear resume input
  document.getElementById("clearResumeInputBtn")?.addEventListener("click", () => {
    const input = document.getElementById("resumeInput");
    if (input) input.value = "";
    setModalStatus("Cleared.");
  });

  // Reset (testing)
  document.getElementById("resetBtn")?.addEventListener("click", () => {
    const ok = confirm("Reset clears saved work on this device. Continue?");
    if (!ok) return;
    SAVE_KEYS.forEach(delLS);

    const url = new URL(window.location.href);
    url.searchParams.delete("resume");
    window.history.replaceState({}, "", url.toString());

    setTopStatus("Reset complete.");
    setModalStatus("Reset complete.");
    location.reload();
  });

  // Export PDF
  document.getElementById("exportPdfBtn")?.addEventListener("click", () => {
    exportJournalToPDF();
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
    setTopStatus("Resumed from QR!");
    // Optional: clear param after resume
    url.searchParams.delete("resume");
    window.history.replaceState({}, "", url.toString());
    return true;
  } catch (e) {
    setTopStatus(`QR resume failed: ${e.message}`);
    return false;
  }
}

// ===========================
// PDF Export (REAL DOWNLOAD)
// Uses jsPDF to generate and download a file.
// ===========================
function exportJournalToPDF() {
  const exportMsg = document.getElementById("exportMsg");
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "letter" });

    const margin = 48;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - margin * 2;

    let y = margin;

    function addLine(text, fontSize = 11, isBold = false) {
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.setFontSize(fontSize);

      const lines = doc.splitTextToSize(String(text), maxWidth);
      for (const line of lines) {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += fontSize + 6;
      }
    }

    function addSpacer(px = 10) {
      y += px;
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    }

    // Pull saved values
    const choice = getLS("start_choice") || "(not chosen)";
    const currentSection = getLS("currentSection") || "home";

    const noaaPrediction = getLS("noaa_prediction") || "(blank)";
    const fieldObservations = getLS("field_observations") || "(blank)";
    const optionalChallenge = getLS("optional_challenge") || "(blank)";

    // Title
    addLine("Eco-Responders: After the Fire — Export My Journal", 16, true);
    addSpacer(6);
    addLine(`Saved Place: ${currentSection}`, 11, false);
    addLine(`Choice: ${choice}`, 11, false);
    addSpacer(14);

    // Include prompts + answers (prompts are exactly as on the page)
    addLine("NOAA Data Path", 13, true);
    addLine("Prompt: Predict what might happen to the forest next year if rainfall stays low and temperatures stay high. Use data to support your prediction.", 11, false);
    addLine("Student Response:", 11, true);
    addLine(noaaPrediction, 11, false);
    addSpacer(16);

    addLine("Field Observation Path", 13, true);
    addLine("Prompt: Record two observations showing how the fire affected people or wildlife.", 11, false);
    addLine("Student Response:", 11, true);
    addLine(fieldObservations, 11, false);
    addSpacer(12);

    addLine("🌱 Mission Challenge (Optional)", 13, true);
    addLine("Prompt: Research a local fire-adapted plant. How does it help stabilize soil or promote regrowth?", 11, false);
    addLine("Student Response:", 11, true);
    addLine(optionalChallenge, 11, false);

    // Trigger download
    const filename = "Eco-Responders_Journal.pdf";
    doc.save(filename);

    if (exportMsg) exportMsg.textContent = "✅ PDF downloaded (check your downloads folder).";
  } catch (e) {
    if (exportMsg) exportMsg.textContent = "⚠️ PDF export failed. Try Chrome/Edge, or check if pop-ups/downloads are blocked.";
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
    const contBtn = document.getElementById("continueAfterChoiceBtn");
    if (contBtn) contBtn.disabled = false;
    renderChoiceFeedback(choice);
  } else {
    document.getElementById("choiceFeedback")?.classList.add("hidden");
  }
}

setTopStatus("Ready.");
setModalStatus("");

// ===========================
// State keys for this page
// ===========================
const SAVE_KEYS = [
  // visibility / progress
  "v_missionStart",
  "v_choiceFeedback",
  "v_branchNoaa",
  "v_branchField",
  "start_choice",

  // writing
  "noaa_prediction",
  "noaa_mission_challenge",
  "field_observations",
  "optional_challenge",
  "field_mission_challenge",
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

function reveal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("hidden");
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setVisibleFlag(flagKey, yes) {
  setLS(flagKey, yes ? "yes" : "");
}

function restoreVisibilityFromStorage() {
  if (getLS("v_missionStart") === "yes") document.getElementById("missionStart")?.classList.remove("hidden");
  if (getLS("v_branchNoaa") === "yes") document.getElementById("branchNoaa")?.classList.remove("hidden");
  if (getLS("v_branchField") === "yes") document.getElementById("branchField")?.classList.remove("hidden");

  // Restore choice feedback
  const choice = getLS("start_choice");
  if (choice) {
    renderChoiceFeedback(choice);
    document.getElementById("choiceFeedback")?.classList.remove("hidden");
    const contBtn = document.getElementById("continueAfterChoiceBtn");
    if (contBtn) contBtn.disabled = false;
  }
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

  // restore what should be visible
  restoreVisibilityFromStorage();

  setTopStatus("Resumed!");
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
// Choice feedback (unchanged)
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
  const qrEl = document.getElementById("qrCodeModal");

  const code = encodeResumeCode(collectState());
  const url = buildResumeUrl(code);

  if (resumeBox) resumeBox.textContent = code;
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
// Resume from TOP box (always present)
// ===========================
function resumeFromTopBox() {
  const input = document.getElementById("resumeInputTop");
  const code = (input?.value || "").trim();
  try {
    const state = decodeResumeCode(code);
    applyState(state);
    setTopStatus("Resumed!");
  } catch (e) {
    setTopStatus(`Resume failed: ${e.message}`);
  }
}

// ===========================
// Wire up buttons
// ===========================
function wireButtons() {
  // Begin Mission (continuous reveal)
  document.getElementById("beginMissionBtn")?.addEventListener("click", () => {
    setVisibleFlag("v_missionStart", true);
    reveal("missionStart");
    setTopStatus("Mission started.");
  });

  // Choices
  const contBtn = document.getElementById("continueAfterChoiceBtn");

  document.getElementById("choiceNoaaBtn")?.addEventListener("click", () => {
    setLS("start_choice", "noaa");
    setVisibleFlag("v_choiceFeedback", true);
    renderChoiceFeedback("noaa");
    if (contBtn) contBtn.disabled = false;
    setTopStatus("Choice saved.");
  });

  document.getElementById("choiceFieldBtn")?.addEventListener("click", () => {
    setLS("start_choice", "field");
    setVisibleFlag("v_choiceFeedback", true);
    renderChoiceFeedback("field");
    if (contBtn) contBtn.disabled = false;
    setTopStatus("Choice saved.");
  });

  // Continue reveals the chosen branch BELOW (does not hide anything above)
  contBtn?.addEventListener("click", () => {
    const choice = getLS("start_choice");
    if (choice === "noaa") {
      setVisibleFlag("v_branchNoaa", true);
      setVisibleFlag("v_branchField", false); // keep only one branch visible at a time
      document.getElementById("branchField")?.classList.add("hidden");
      reveal("branchNoaa");
    } else if (choice === "field") {
      setVisibleFlag("v_branchField", true);
      setVisibleFlag("v_branchNoaa", false);
      document.getElementById("branchNoaa")?.classList.add("hidden");
      reveal("branchField");
    }
    setTopStatus("Continued.");
  });

  // Pause modal
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

  // Top resume box
  document.getElementById("resumeTopBtn")?.addEventListener("click", resumeFromTopBox);
  document.getElementById("clearTopBtn")?.addEventListener("click", () => {
    const input = document.getElementById("resumeInputTop");
    if (input) input.value = "";
    setTopStatus("Cleared.");
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

    const choice = getLS("start_choice") || "(not chosen)";
    const noaaPrediction = getLS("noaa_prediction") || "(blank)";
    const noaaMission = getLS("noaa_mission_challenge") || "(blank)";
    const fieldObs = getLS("field_observations") || "(blank)";
    const fieldOpt = getLS("optional_challenge") || "(blank)";
    const fieldMission = getLS("field_mission_challenge") || "(blank)";

    addLine("Eco-Responders: After the Fire — Export My Journal", 16, true);
    addSpacer(6);
    addLine(`Choice: ${choice}`, 11, false);
    addSpacer(14);

    addLine("NOAA Data Path", 13, true);
    addLine("Prompt: Predict what might happen to the forest next year if rainfall stays low and temperatures stay high. Use data to support your prediction.", 11, false);
    addLine("Student Response:", 11, true);
    addLine(noaaPrediction, 11, false);
    addSpacer(10);
    addLine("⚡ Mission Challenge (Optional)", 12, true);
    addLine("Prompt: Add one more prediction OR one question you want to investigate next.", 11, false);
    addLine("Student Response:", 11, true);
    addLine(noaaMission, 11, false);
    addSpacer(16);

    addLine("Field Observation Path", 13, true);
    addLine("Prompt: Record two observations showing how the fire affected people or wildlife.", 11, false);
    addLine("Student Response:", 11, true);
    addLine(fieldObs, 11, false);
    addSpacer(12);

    addLine("🌱 Mission Challenge (Optional)", 12, true);
    addLine("Prompt: Research a local fire-adapted plant. How does it help stabilize soil or promote regrowth?", 11, false);
    addLine("Student Response:", 11, true);
    addLine(fieldOpt, 11, false);
    addSpacer(10);

    addLine("⚡ Mission Challenge (Optional)", 12, true);
    addLine("Prompt: Add one more observation you think matters most, and explain why.", 11, false);
    addLine("Student Response:", 11, true);
    addLine(fieldMission, 11, false);

    doc.save("Eco-Responders_Journal.pdf");

    if (exportMsg) exportMsg.textContent = "✅ PDF downloaded (check your downloads folder).";
  } catch (e) {
    if (exportMsg) exportMsg.textContent = "⚠️ PDF export failed. Try Chrome/Edge, or check if downloads are blocked.";
  }
}

// ===========================
// Boot
// ===========================
wireAutosave();
wireButtons();

const didResume = maybeResumeFromUrl();
if (!didResume) restoreVisibilityFromStorage();

setTopStatus("Ready.");
setModalStatus("");

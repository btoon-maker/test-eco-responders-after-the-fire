// ===========================
// Save keys
// ===========================
const SAVE_KEYS = [
  "added_setting",
  "added_call",
  "choice_start",          // "noaa" | "field"
  "added_noaa",
  "added_field",

  // writing
  "noaa_prediction",
  "noaa_mission_challenge",
  "field_observations",
  "optional_challenge",
  "field_mission_challenge",
];

// ===========================
// LocalStorage helpers
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

function scrollToEl(el) {
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ===========================
// Autosave wiring (works for new sections added later)
// ===========================
function wireAutosaveWithin(root) {
  root.querySelectorAll("textarea[data-save]").forEach((ta) => {
    const key = ta.dataset.save;
    ta.value = getLS(key);
    ta.addEventListener("input", () => setLS(key, ta.value));
  });
}

// ===========================
// Template rendering
// ===========================
function addTemplateOnce(templateId, markerKey) {
  if (getLS(markerKey) === "yes") return null;

  const tpl = document.getElementById(templateId);
  const story = document.getElementById("story");
  if (!tpl || !story) return null;

  const node = tpl.content.cloneNode(true);
  story.appendChild(node);

  setLS(markerKey, "yes");

  // wire autosave for any new textareas
  wireAutosaveWithin(story);

  // return last section element appended (best effort)
  const sections = story.querySelectorAll("section");
  return sections[sections.length - 1] || null;
}

function ensureTemplate(templateId, markerKey) {
  if (getLS(markerKey) === "yes") return null;
  return addTemplateOnce(templateId, markerKey);
}

// ===========================
// Choice feedback (same text as before)
// ===========================
function renderChoiceFeedback(which) {
  const box = document.getElementById("choiceFeedback");
  if (!box) return;
  box.style.display = "block";

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
// Resume code encode/decode
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

  rebuildFromStorage();
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
// QR for lesson+resume
// ===========================
function buildResumeUrl(code) {
  const url = new URL(window.location.href);
  url.searchParams.set("resume", code);
  return url.toString();
}

function renderQrInto(el, text) {
  if (!el) return;
  el.innerHTML = "";
  new QRCode(el, { text, width: 160, height: 160, correctLevel: QRCode.CorrectLevel.M });
}

// ===========================
// Clipboard
// ===========================
async function copyToClipboard(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch { return false; }
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

  copyToClipboard(code).then(ok => {
    if (ok) {
      setTopStatus("Paused. Resume Code copied.");
      setModalStatus("✅ Resume Code copied automatically. Scan QR to resume on another device.");
    } else {
      setTopStatus("Paused. (Copy may be blocked.)");
      setModalStatus("⚠️ Auto-copy was blocked by the browser. Use the Copy Code button.");
    }
  });

  overlay?.classList.add("show");
  overlay?.setAttribute("aria-hidden", "false");
}

function closeModal() {
  const overlay = document.getElementById("overlay");
  overlay?.classList.remove("show");
  overlay?.setAttribute("aria-hidden", "true");
}

// ===========================
// Rebuild story based on saved progress
// (this is what makes “only appears after click” still work after resume)
// ===========================
function rebuildFromStorage() {
  const story = document.getElementById("story");
  if (!story) return;

  // clear and rebuild cleanly
  story.innerHTML = "";

  // Always add Setting first (it’s the start of the page)
  addTemplateOnce("tpl-setting", "added_setting");

  // If they had begun, add The Call
  if (getLS("added_call") === "yes") {
    addTemplateOnce("tpl-call", "added_call");
  }

  // If they chose a path, show feedback and add only that branch
  const choice = getLS("choice_start");
  if (choice === "noaa") {
    // ensure call exists
    if (getLS("added_call") !== "yes") addTemplateOnce("tpl-call", "added_call");
    // make sure feedback is visible and buttons are disabled
    renderChoiceFeedback("noaa");
    disableChoiceButtons();
    // add NOAA branch
    addTemplateOnce("tpl-noaa", "added_noaa");
  }
  if (choice === "field") {
    if (getLS("added_call") !== "yes") addTemplateOnce("tpl-call", "added_call");
    renderChoiceFeedback("field");
    disableChoiceButtons();
    addTemplateOnce("tpl-field", "added_field");
  }

  // wire autosave for any textareas now present
  wireAutosaveWithin(story);

  // wire story buttons again (because we rebuilt DOM)
  wireStoryButtons();
}

function disableChoiceButtons() {
  const b1 = document.getElementById("choiceNoaaBtn");
  const b2 = document.getElementById("choiceFieldBtn");
  if (b1) b1.disabled = true;
  if (b2) b2.disabled = true;
}

// ===========================
// Story button wiring (Begin Mission + choices)
// ===========================
function wireStoryButtons() {
  const beginBtn = document.getElementById("beginMissionBtn");
  if (beginBtn && !beginBtn.dataset.wired) {
    beginBtn.dataset.wired = "yes";
    beginBtn.addEventListener("click", () => {
      // Add The Call only when clicked
      const callSection = ensureTemplate("tpl-call", "added_call");
      if (callSection) {
        setTopStatus("The Call appeared.");
        scrollToEl(callSection);
      } else {
        // already added; scroll to it
        scrollToEl(document.getElementById("call"));
      }
    });
  }

  const noaaBtn = document.getElementById("choiceNoaaBtn");
  if (noaaBtn && !noaaBtn.dataset.wired) {
    noaaBtn.dataset.wired = "yes";
    noaaBtn.addEventListener("click", () => {
      setLS("choice_start", "noaa");
      renderChoiceFeedback("noaa");
      disableChoiceButtons();

      // Add NOAA branch only when clicked
      const noaaSection = ensureTemplate("tpl-noaa", "added_noaa");
      if (noaaSection) {
        setTopStatus("NOAA section appeared.");
        scrollToEl(noaaSection);
      } else {
        scrollToEl(document.getElementById("noaa"));
      }
    });
  }

  const fieldBtn = document.getElementById("choiceFieldBtn");
  if (fieldBtn && !fieldBtn.dataset.wired) {
    fieldBtn.dataset.wired = "yes";
    fieldBtn.addEventListener("click", () => {
      setLS("choice_start", "field");
      renderChoiceFeedback("field");
      disableChoiceButtons();

      // Add Field branch only when clicked
      const fieldSection = ensureTemplate("tpl-field", "added_field");
      if (fieldSection) {
        setTopStatus("Field section appeared.");
        scrollToEl(fieldSection);
      } else {
        scrollToEl(document.getElementById("field"));
      }
    });
  }
}

// ===========================
// Resume from top box
// ===========================
function resumeFromTopBox() {
  const input = document.getElementById("resumeInputTop");
  const code = (input?.value || "").trim();
  try {
    const state = decodeResumeCode(code);
    applyState(state);
  } catch (e) {
    setTopStatus(`Resume failed: ${e.message}`);
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
        if (y > pageHeight - margin) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += fontSize + 6;
      }
    }
    function addSpacer(px = 10) {
      y += px;
      if (y > pageHeight - margin) { doc.addPage(); y = margin; }
    }

    const choice = getLS("choice_start") || "(not chosen)";

    addLine("Eco-Responders: After the Fire — Export My Journal", 16, true);
    addSpacer(6);
    addLine(`Choice: ${choice}`, 11, false);
    addSpacer(14);

    // NOAA (only include if it appeared or has data)
    if (getLS("added_noaa") === "yes" || getLS("noaa_prediction") || getLS("noaa_mission_challenge")) {
      addLine("NOAA Data Path", 13, true);
      addLine("Prompt: Predict what might happen to the forest next year if rainfall stays low and temperatures stay high. Use data to support your prediction.", 11, false);
      addLine("Student Response:", 11, true);
      addLine(getLS("noaa_prediction") || "(blank)", 11, false);
      addSpacer(10);
      addLine("⚡ Mission Challenge (Optional)", 12, true);
      addLine("Prompt: Add one more prediction OR one question you want to investigate next.", 11, false);
      addLine("Student Response:", 11, true);
      addLine(getLS("noaa_mission_challenge") || "(blank)", 11, false);
      addSpacer(16);
    }

    // Field (only include if it appeared or has data)
    if (getLS("added_field") === "yes" || getLS("field_observations") || getLS("optional_challenge") || getLS("field_mission_challenge")) {
      addLine("Field Observation Path", 13, true);
      addLine("Prompt: Record two observations showing how the fire affected people or wildlife.", 11, false);
      addLine("Student Response:", 11, true);
      addLine(getLS("field_observations") || "(blank)", 11, false);
      addSpacer(12);

      addLine("🌱 Mission Challenge (Optional)", 12, true);
      addLine("Prompt: Research a local fire-adapted plant. How does it help stabilize soil or promote regrowth?", 11, false);
      addLine("Student Response:", 11, true);
      addLine(getLS("optional_challenge") || "(blank)", 11, false);
      addSpacer(10);

      addLine("⚡ Mission Challenge (Optional)", 12, true);
      addLine("Prompt: Add one more observation you think matters most, and explain why.", 11, false);
      addLine("Student Response:", 11, true);
      addLine(getLS("field_mission_challenge") || "(blank)", 11, false);
    }

    doc.save("Eco-Responders_Journal.pdf");
    if (exportMsg) exportMsg.textContent = "✅ PDF downloaded (check your downloads folder).";
  } catch (e) {
    if (exportMsg) exportMsg.textContent = "⚠️ PDF export failed. Try Chrome/Edge, or check if downloads are blocked.";
  }
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

    // remove param
    url.searchParams.delete("resume");
    window.history.replaceState({}, "", url.toString());

    setTopStatus("Resumed from QR!");
    return true;
  } catch (e) {
    setTopStatus(`QR resume failed: ${e.message}`);
    return false;
  }
}

// ===========================
// Global wiring (pause panel + export)
// ===========================
function wireGlobalButtons() {
  document.getElementById("pauseResumeBtn")?.addEventListener("click", openModalWithCurrentState);
  document.getElementById("closeModalBtn")?.addEventListener("click", closeModal);
  document.getElementById("overlay")?.addEventListener("click", (e) => {
    if (e.target && e.target.id === "overlay") closeModal();
  });

  document.getElementById("copyCodeBtn")?.addEventListener("click", async () => {
    const code = document.getElementById("resumeCodeBox")?.textContent || "";
    const ok = await copyToClipboard(code);
    setModalStatus(ok ? "✅ Copied!" : "⚠️ Copy blocked—select the code and copy.");
  });

  document.getElementById("resetBtn")?.addEventListener("click", () => {
    const ok = confirm("Reset clears saved work on this device. Continue?");
    if (!ok) return;

    SAVE_KEYS.forEach(delLS);

    const url = new URL(window.location.href);
    url.searchParams.delete("resume");
    window.history.replaceState({}, "", url.toString());

    location.reload();
  });

  document.getElementById("resumeTopBtn")?.addEventListener("click", resumeFromTopBox);
  document.getElementById("clearTopBtn")?.addEventListener("click", () => {
    const input = document.getElementById("resumeInputTop");
    if (input) input.value = "";
    setTopStatus("Cleared.");
  });

  document.getElementById("exportPdfBtn")?.addEventListener("click", exportJournalToPDF);
}

// ===========================
// Boot
// ===========================
wireGlobalButtons();

// If the lesson has never been built on this device, start with Setting only
if (getLS("added_setting") !== "yes") setLS("added_setting", ""); // just explicit

// Resume from QR if present, otherwise rebuild from localStorage
const didResume = maybeResumeFromUrl();
if (!didResume) rebuildFromStorage();

setTopStatus("Ready.");
setModalStatus("");

// ============================================================
// Eco-Responders Prototype Logic
// - Auto-save on device (localStorage)
// - Save & Exit creates a Resume Code + QR link (no server)
// - Resume from code restores on any device
// ============================================================

// ---------- Storage helpers ----------
function lsGet(key){ return localStorage.getItem(key) || ""; }
function lsSet(key, val){ localStorage.setItem(key, val); }
function lsDel(key){ localStorage.removeItem(key); }

// ---------- Keys we save ----------
const SAVE_KEYS = [
  "ui_begin_mission",
  "ui_branch",          // "noaa" | "fire"
  "ui_scrollY",         // optional: remembers scroll position
  // writing fields:
  "fj_noaa_pattern",
  "mc_noaa_predict",
  "fj_fire_observations",
  "mc_fire_plant",
];

// ---------- Auto-save: textareas ----------
function wireAutosave(){
  document.querySelectorAll("[data-save]").forEach(el => {
    const key = el.getAttribute("data-save");
    el.value = lsGet(key);

    el.addEventListener("input", () => {
      lsSet(key, el.value);
    });
  });
}

// ---------- UI state restore ----------
function applyUIFromLocal(){
  const began = lsGet("ui_begin_mission") === "1";
  const branch = lsGet("ui_branch"); // "noaa" or "fire"

  setMissionVisible(began);

  if (branch === "noaa") showBranch("noaa");
  else if (branch === "fire") showBranch("fire");
  else hideBranches();
}

function setMissionVisible(visible){
  const sec = document.getElementById("missionStart");
  if (!sec) return;
  sec.classList.toggle("hidden", !visible);
}

function hideBranches(){
  document.getElementById("branchNOAA")?.classList.add("hidden");
  document.getElementById("branchFireZone")?.classList.add("hidden");
}

function showBranch(which){
  hideBranches();
  if (which === "noaa") document.getElementById("branchNOAA")?.classList.remove("hidden");
  if (which === "fire") document.getElementById("branchFireZone")?.classList.remove("hidden");
}

// ---------- Export (copy) ----------
function buildExportText(){
  const began = lsGet("ui_begin_mission") === "1";
  const branch = lsGet("ui_branch") || "(not chosen)";
  const out = [];

  out.push("Eco-Responders: After the Fire — Notes");
  out.push("");
  out.push(`Begin Mission clicked: ${began ? "Yes" : "No"}`);
  out.push(`Branch chosen: ${branch}`);
  out.push("");

  out.push("NOAA Branch — Field Journal:");
  out.push(lsGet("fj_noaa_pattern") || "(blank)");
  out.push("");
  out.push("NOAA Mission Challenge (Optional):");
  out.push(lsGet("mc_noaa_predict") || "(blank)");
  out.push("");
  out.push("Fire Zone Branch — Field Journal:");
  out.push(lsGet("fj_fire_observations") || "(blank)");
  out.push("");
  out.push("Fire Zone Mission Challenge (Optional):");
  out.push(lsGet("mc_fire_plant") || "(blank)");

  return out.join("\n");
}

async function copyToClipboard(text){
  try{
    await navigator.clipboard.writeText(text);
    return true;
  }catch{
    return false;
  }
}

// ============================================================
// Resume Code + QR (NO SERVER)
// We encode all saved data into the code itself.
// QR encodes a URL: <site>#r=<payload>
// ============================================================

function makeResumePayloadFromLocal(){
  const state = {};
  SAVE_KEYS.forEach(k => state[k] = lsGet(k));
  return state;
}

function applyResumeStateToLocal(state){
  SAVE_KEYS.forEach(k => {
    if (typeof state[k] === "string") lsSet(k, state[k]);
  });

  // Restore textareas immediately
  document.querySelectorAll("[data-save]").forEach(el => {
    const key = el.getAttribute("data-save");
    el.value = lsGet(key);
  });

  // Restore UI sections
  applyUIFromLocal();
}

function encodeResumeState(state){
  // Compress JSON → base64-url string (shorter than raw)
  const json = JSON.stringify(state);
  const compressed = LZString.compressToEncodedURIComponent(json);
  return `SINS1.${compressed}`;
}

function decodeResumeCode(code){
  const trimmed = (code || "").trim();
  if (!trimmed.startsWith("SINS1.")) throw new Error("That doesn’t look like a valid Resume Code.");
  const payload = trimmed.slice("SINS1.".length);
  const json = LZString.decompressFromEncodedURIComponent(payload);
  if (!json) throw new Error("Resume Code could not be read (maybe incomplete).");
  return JSON.parse(json);
}

function makeResumeUrl(code){
  // QR opens THIS lesson and auto-resumes using the URL hash
  const base = window.location.origin + window.location.pathname;
  return `${base}#r=${encodeURIComponent(code)}`;
}

// ---------- Modal ----------
function openModalWithCode(code){
  const backdrop = document.getElementById("modalBackdrop");
  const codeBox = document.getElementById("resumeCodeBox");
  const msg = document.getElementById("modalMsg");
  const qrEl = document.getElementById("qrcode");

  if (!backdrop || !codeBox || !qrEl) return;

  codeBox.textContent = code;

  // Build QR for a resume URL
  const url = makeResumeUrl(code);

  // Clear existing QR
  qrEl.innerHTML = "";
  new QRCode(qrEl, {
    text: url,
    width: 220,
    height: 220,
  });

  // Try auto-copy
  copyToClipboard(code).then(ok => {
    msg.textContent = ok ? "✅ Resume Code copied automatically." : "⚠️ Couldn’t auto-copy. Use the Copy Code button.";
  });

  backdrop.style.display = "flex";
}

function closeModal(){
  const backdrop = document.getElementById("modalBackdrop");
  if (backdrop) backdrop.style.display = "none";
}

// ============================================================
// Wire up buttons
// ============================================================

function wireButtons(){
  // Begin mission
  document.getElementById("beginMissionBtn")?.addEventListener("click", () => {
    lsSet("ui_begin_mission", "1");
    setMissionVisible(true);

    // friendly scroll
    document.getElementById("missionStart")?.scrollIntoView({ behavior:"smooth", block:"start" });
  });

  // Branch buttons
  document.getElementById("btnNOAA")?.addEventListener("click", () => {
    lsSet("ui_branch", "noaa");
    showBranch("noaa");
    document.getElementById("branchNOAA")?.scrollIntoView({ behavior:"smooth", block:"start" });
  });

  document.getElementById("btnFireZone")?.addEventListener("click", () => {
    lsSet("ui_branch", "fire");
    showBranch("fire");
    document.getElementById("branchFireZone")?.scrollIntoView({ behavior:"smooth", block:"start" });
  });

  // Export (copy)
  document.getElementById("exportBtn")?.addEventListener("click", async () => {
    const text = buildExportText();
    const ok = await copyToClipboard(text);
    const m = document.getElementById("exportMsg");
    if (m) m.textContent = ok ? "✅ Copied! Paste into Canvas." : "⚠️ Couldn’t copy. Try again or use a different browser.";
    if (!ok) prompt("Copy your notes here:", text);
  });

  // Save & Exit (top-right)
  const saveExit = () => {
    // Remember scroll position (optional)
    lsSet("ui_scrollY", String(window.scrollY || 0));

    const state = makeResumePayloadFromLocal();
    const code = encodeResumeState(state);
    openModalWithCode(code);
  };

  document.getElementById("saveExitBtnTop")?.addEventListener("click", saveExit);

  // Reset (top-right)
  document.getElementById("resetBtnTop")?.addEventListener("click", () => {
    const ok = confirm("This clears saved work on THIS device. Continue?");
    if (!ok) return;
    SAVE_KEYS.forEach(k => lsDel(k));
    // also clear hash resume
    history.replaceState(null, "", window.location.pathname);
    location.reload();
  });

  // Resume (top-right)
  document.getElementById("resumeBtnTop")?.addEventListener("click", () => {
    const input = document.getElementById("resumeInputTop");
    const msg = document.getElementById("resumeMsgTop");
    if (!input || !msg) return;

    try{
      const code = input.value.trim();
      const state = decodeResumeCode(code);
      applyResumeStateToLocal(state);
      msg.textContent = "✅ Resumed! Your progress is back.";
    }catch(err){
      msg.textContent = "⚠️ " + err.message;
    }
  });

  document.getElementById("clearResumeTop")?.addEventListener("click", () => {
    const input = document.getElementById("resumeInputTop");
    const msg = document.getElementById("resumeMsgTop");
    if (input) input.value = "";
    if (msg) msg.textContent = "";
  });

  // Modal buttons
  document.getElementById("closeModalBtn")?.addEventListener("click", closeModal);
  document.getElementById("modalBackdrop")?.addEventListener("click", (e) => {
    if (e.target && e.target.id === "modalBackdrop") closeModal();
  });

  document.getElementById("copyCodeBtn")?.addEventListener("click", async () => {
    const code = document.getElementById("resumeCodeBox")?.textContent || "";
    const ok = await copyToClipboard(code);
    const msg = document.getElementById("modalMsg");
    if (msg) msg.textContent = ok ? "✅ Copied!" : "⚠️ Couldn’t copy. You can still select and copy the code.";
  });
}

// ============================================================
// Auto-resume if QR link opened (#r=...)
// ============================================================
function tryResumeFromHash(){
  const hash = window.location.hash || "";
  const match = hash.match(/#r=(.+)$/);
  if (!match) return;

  const code = decodeURIComponent(match[1]);
  try{
    const state = decodeResumeCode(code);
    applyResumeStateToLocal(state);

    // Optional: restore scroll position if it exists
    const y = parseInt(lsGet("ui_scrollY") || "0", 10);
    if (!Number.isNaN(y)) window.scrollTo({ top:y });

    // Clear hash after successful resume (prevents reprocessing)
    history.replaceState(null, "", window.location.pathname);
  }catch{
    // If hash is bad, leave it—student can paste manually
  }
}

// ---------- Init ----------
wireAutosave();
wireButtons();
applyUIFromLocal();
tryResumeFromHash();

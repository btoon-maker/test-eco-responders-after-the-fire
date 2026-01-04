/* Eco-Responders Single-Page Lesson Builder
   Changes in this revision ONLY:
   - Make a Choice: only the chosen branch section appears; switching choice removes the other branch section(s)
   - Dropdown arrows are handled in CSS (index.html)
   - Export PDF: ONLY selected choices + journal prompts + student text responses (no narrative page text)
*/

const STORAGE_PREFIX = "eco_v2_";
const STATE_KEY = `${STORAGE_PREFIX}state`;

const lessonEl = document.getElementById("lesson");
const imagesNoteEl = document.getElementById("imagesNote");

const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");
const pasteCodeEl = document.getElementById("pasteCode");

const modalBackdrop = document.getElementById("pauseModalBackdrop");
const closePauseModalBtn = document.getElementById("closePauseModal");
const resumeCodeEl = document.getElementById("resumeCode");
const copyCodeBtn = document.getElementById("copyCodeBtn");
const saveStatusEl = document.getElementById("saveStatus");
const exportBtn = document.getElementById("exportBtn");

let qrInstance = null;

// -------------------- SCRIPT DATA (wording copied exactly) --------------------
const SCRIPT = {
  lessonTitle: "Eco-Responders",
  sections: [
    {
      id: "hello",
      title: "Situation Briefing",
      blocks: [
        {
          type: "text+image",
          layout: "imageRight",
          text:
`The air smells faintly of pine and smoke, reminders that nature is constantly changing.


As an Eco-Responder, you’ve learned that every fire tells two stories: one of loss and one of renewal.


This week, your team is on alert. Just over the ridge, a town called Forest Glen was hit by a wildfire two weeks ago.

Your town, Maple Valley, sits just downwind.`,
          image: { filename: "forest_intro_right.png", positionNote: "right of the text" }
        },
        {
          type: "dropdown",
          title: "What to Expect",
          text:
`As an Eco-Responder, your job is to find out how wildfires start, spread, and change habitats.

You’ll look at real evidence, from NOAA weather data to FEMA field reports, to spot patterns and causes.

🔍 Your Mission

Add notes in your Field Journal as you move through each part of the story.
Use your clues and ideas to make a final plan that helps Maple Valley rebuild safely for both people and wildlife.

You’ll also make choices that guide what you see and discover along the way.

You will encounter two kinds of challenges:

🔬 Think Like a Scientist

Found inside your Field Journal.
These help you connect your evidence to clear explanations, just like real scientists do.

Mission Challenges

Found in the lesson.

These are optional deeper dives for students who want to explore more.`
        },
        {
          type: "dropdown",
          title: "Mission Glossary: Key Terms to Know",
          text:
`⚡ Fuel-Moisture
How much water is stored in plants and soil. When it’s low, leaves and branches dry out and burn more easily.

🔥 Red Flag Warning
A weather alert from NOAA when hot, dry, and windy conditions make wildfires more likely to spread.

🏠 Defensible Space
A safety zone (about 30 feet around a home) kept clear of flammable materials to slow or stop wildfire spread.

🏗 Fire-Resistant Materials
Building materials (like stucco or metal roofs) that don’t easily burn, protecting homes from embers and heat.

♻ Feedback Loop
When one change causes another that strengthens or weakens the first, for example, fewer trees → hotter ground → more fires.

🌎 Ecosystem Recovery
How plants, animals, and soil rebuild after a disturbance like a wildfire.

🏛 FEMA (Federal Emergency Management Agency )
The agency that helps people and communities prepare for and recover from natural disasters.

☁ NOAA (National Oceanic and Atmospheric Administration )
The agency that studies Earth’s weather and climate to help predict and prevent environmental hazards.`
        },
        {
          type: "buttonReveal",
          label: "Begin Mission",
          reveal: "the_call"
        }
      ]
    },

    {
      id: "the_call",
      title: "The Call",
      blocks: [
        {
          type: "text+image",
          layout: "imageLeft",
          text:
` Ping! Ping! Ping!

Your Eco-Responder tablet flashes red.
Jordan, your FEMA mentor, appears on the screen.

“Forest Glen’s fire is finally contained,” he says, “but NOAA just issued a Red Flag Warning for Maple Valley. Relative humidity is 14%, winds steady at 25 mph, strong enough to push embers a mile. We need evidence from Forest Glen before the next spark.”
"Don't forget to bring your field journal!"`,
          image: { filename: "the_call_right.png", positionNote: "left of the text" }
        },
        {
          type: "choice",
          title: "Make a Choice\n🔊 Listen to directions (optional)",
          choiceKey: "the_call_path",
          options: [
            {
              label: "Analyze NOAA Weather Data First",
              feedback:
`You chose to start with regional data.

This path will help you spot patterns over time—like rainfall, temperature, and fuel moisture—that influence fire risk before flames ever appear.

🔍 Scientists often begin here when they want to predict what might happen next.`,
              continueReveal: "noaa_path"
            },
            {
              label: "Go Straight to the Fire Zone for Field Observation",
              feedback:
`You chose to begin in the field.

This path focuses on direct evidence—what you can see, touch, and observe right now.
🧭 Scientists take this approach when they want to understand impacts on people, plants, and animals.`,
              continueReveal: "field_path"
            }
          ]
        }
      ]
    },

    {
      id: "noaa_path",
      title: "Analyze NOAA Weather Data First",
      blocks: [
        {
          type: "text",
          text:
`You arrive at the mobile lab, and your tablet connects to NOAA’s drought archive.

“See the trend? Less rain and more heat mean lower fuel moisture,” Jordan mutters. “That’s a dangerous mix. The plants themselves become fuel.”
With your data uploaded, you now need to understand the field conditions.`
        },
        {
          type: "imageCenter",
          image: { filename: "NOAA_center.png", positionNote: "center under the text" }
        },
        {
          type: "journal",
          title: "Time to Spot a Pattern\n🔊 Listen to directions (optional)",
          prompt:
`Record one pattern that increased fire risk and explain its effect on plants and animals. 

💡 Scientist Tip: You might want to mention how this pattern affects living things, not just the environment.`,
          saveKey: "noaa_prediction",
          missionChallenge: {
            title: "Make a Prediction\n🔊 Listen to directions (optional)",
            prompt:
`⚡ Mission Challenge (Optional)

Predict what might happen to the forest next year if rainfall continues to drop and temperatures stay high. Use data to support your prediction.`,
            saveKey: "noaa_mission_challenge"
          }
        }
      ]
    },

    {
      id: "field_path",
      title: "Fire Zone for Field Observation",
      blocks: [
        {
          type: "text+image",
          layout: "imageLeft",
          text:
`You ride beside Ranger Marisol into Forest Glen.
The air smells like ash and rain. Your tablet displays photos from Ranger Marisol.

In the photos, you notice:

– Soil dry and crumbly, the organic layer burned away.
– Green sprouts poking through black earth.
– Metal-roofed homes still standing; wood roofs gone.

“Soil’s dry,” she says. “Thin ash layer, but look, some pine cones cracked open.”


You examine one: resin melted, seeds spilled onto the ground.

“Serotinous cones,” she explains. “Some trees need heat to start over.”

Nearby, houses with metal roofs stand untouched; those with wood shingles are gone.`,
          image: { filename: "field_left.png", positionNote: "left the text" }
        },
        {
          type: "journal",
          title: "Time to Record Observations\n🔊 Listen to directions (optional)",
          prompt:
`Record two observations showing how the fire affected people or wildlife. 

💡 Scientist Tip: You might want to mention how this pattern affects living things, not just the environment.`,
          saveKey: "field_observation_prediction",
          missionChallenge: {
            title: "Time to Research\n🔊 Listen to directions (optional)",
            prompt:
`🌱 Mission Challenge (Optional)

Research a local fire-adapted plant. How does it help stabilize soil or promote regrowth?`,
            saveKey: "field_observation_mission_challenge"
          }
        }
      ]
    }
  ]
};

// -------------------- STATE --------------------
function defaultState(){
  return {
    v: 2,
    revealed: ["hello"],
    choices: {},           // {choiceKey: currentSelectedLabel}
    journals: {},          // {saveKey: response}
    pendingContinues: {}   // {choiceKey: {feedbackText, continueReveal}}
  };
}

let state = loadStateFromLocal() || defaultState();

// If URL includes ?resume=..., try to load it immediately
(function loadFromURLParam(){
  const url = new URL(window.location.href);
  const code = url.searchParams.get("resume");
  if(code){
    const decoded = decodeStateFromCode(code);
    if(decoded){
      state = sanitizeState(decoded);
      saveStateToLocal();
      url.searchParams.delete("resume");
      window.history.replaceState({}, "", url.toString());
    }
  }
})();

// -------------------- HELPERS: locate parent section for a choiceKey --------------------
function findChoiceParentSectionId(choiceKey){
  for(const sec of SCRIPT.sections){
    for(const b of sec.blocks){
      if(b.type === "choice" && b.choiceKey === choiceKey){
        return sec.id;
      }
    }
  }
  return null;
}

function pruneRevealedToSection(sectionIdInclusive){
  const idx = state.revealed.indexOf(sectionIdInclusive);
  if(idx === -1) return;
  state.revealed = state.revealed.slice(0, idx + 1);
}

// -------------------- RENDER --------------------
function renderAll(){
  lessonEl.innerHTML = "";

  state.revealed.forEach((sectionId, idx) => {
    const sec = SCRIPT.sections.find(s => s.id === sectionId);
    if(sec) lessonEl.appendChild(renderSection(sec, idx));
  });

  imagesNoteEl.textContent =
    "Images are currently placeholders until you upload them to ./images/ with the exact filenames shown in the script.";

  updateResumeArtifacts();
}

function renderSection(sec, idx){
  const wrap = document.createElement("section");
  wrap.className = "section";

  const card = document.createElement("div");
  card.className = "card";

  // subtle per-section tint (kept as-is)
  const tintA = `hsla(${(idx*35)%360}, 55%, 55%, 0.12)`;
  const tintB = `hsla(${(idx*35 + 18)%360}, 55%, 45%, 0.06)`;
  card.style.background = `linear-gradient(180deg, rgba(16,38,36,0.92), rgba(16,38,36,0.78)),
                           radial-gradient(900px 300px at 20% 10%, ${tintA}, transparent 60%),
                           radial-gradient(900px 300px at 90% 30%, ${tintB}, transparent 60%)`;

  const head = document.createElement("div");
  head.className = "section-head";

  const h = document.createElement("h2");
  h.className = "section-title";
  h.textContent = sec.title;

  head.appendChild(h);
  card.appendChild(head);

  const body = document.createElement("div");
  body.className = "section-body";

  sec.blocks.forEach((b) => body.appendChild(renderBlock(b)));

  card.appendChild(body);
  wrap.appendChild(card);
  return wrap;
}

function renderBlock(b){
  if(b.type === "text"){
    return contentBlock(b.text);
  }

  if(b.type === "text+image"){
    const container = document.createElement("div");
    container.className = "two-col";

    const textCol = document.createElement("div");
    textCol.className = "col-text";
    textCol.appendChild(contentBlock(b.text));

    const mediaCol = document.createElement("div");
    mediaCol.className = "col-media";
    mediaCol.appendChild(imageBlock(b.image.filename));

    if(b.layout === "imageLeft"){
      container.appendChild(mediaCol);
      container.appendChild(textCol);
    }else{
      container.appendChild(textCol);
      container.appendChild(mediaCol);
    }
    return container;
  }

  if(b.type === "imageCenter"){
    const container = document.createElement("div");
    container.className = "center-media";
    container.appendChild(imageBlock(b.image.filename));
    return container;
  }

  if(b.type === "dropdown"){
    const d = document.createElement("details");
    d.className = "dropdown";
    const s = document.createElement("summary");
    s.textContent = b.title;
    const inner = document.createElement("div");
    inner.className = "dropdown-body";
    inner.textContent = b.text;
    d.appendChild(s);
    d.appendChild(inner);
    return d;
  }

  if(b.type === "buttonReveal"){
    const container = document.createElement("div");
    container.className = "choice-block";
    const row = document.createElement("div");
    row.className = "btn-row";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn primary";
    btn.textContent = b.label;
    btn.addEventListener("click", () => revealSection(b.reveal, true));
    row.appendChild(btn);
    container.appendChild(row);
    return container;
  }

  if(b.type === "choice"){
    return renderChoice(b);
  }

  if(b.type === "journal"){
    return renderJournal(b);
  }

  const f = document.createElement("div");
  f.textContent = "";
  return f;
}

function contentBlock(text){
  const p = document.createElement("div");
  p.className = "content";
  p.textContent = text;
  return p;
}

function imageBlock(filename){
  const wrap = document.createElement("div");

  const img = document.createElement("img");
  img.src = `./images/${filename}`;
  img.alt = "Image Placeholder";
  img.loading = "lazy";

  const placeholder = document.createElement("div");
  placeholder.className = "img-placeholder";
  placeholder.textContent = `Image Placeholder\n${filename}\n(Upload to ./images/${filename})`;

  let loaded = false;
  img.addEventListener("load", () => {
    loaded = true;
    if(wrap.contains(placeholder)) wrap.removeChild(placeholder);
    if(!wrap.contains(img)) wrap.appendChild(img);
  });
  img.addEventListener("error", () => {
    if(!loaded){
      if(wrap.contains(img)) wrap.removeChild(img);
      if(!wrap.contains(placeholder)) wrap.appendChild(placeholder);
    }
  });

  wrap.appendChild(placeholder);
  const probe = new Image();
  probe.onload = () => img.dispatchEvent(new Event("load"));
  probe.onerror = () => img.dispatchEvent(new Event("error"));
  probe.src = img.src;

  return wrap;
}

// -------------------- CHOICES: ONLY the selected branch can appear --------------------
function renderChoice(choiceBlock){
  const container = document.createElement("div");
  container.className = "choice-block";

  const t = document.createElement("div");
  t.className = "choice-title";
  t.textContent = choiceBlock.title;
  container.appendChild(t);

  const row = document.createElement("div");
  row.className = "btn-row";

  const currentSelected = state.choices[choiceBlock.choiceKey] || null;

  choiceBlock.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn";
    btn.textContent = opt.label;

    if(currentSelected === opt.label){
      btn.classList.add("primary");
    }

    btn.addEventListener("click", () => {
      const prev = state.choices[choiceBlock.choiceKey] || null;

      // If switching choices AFTER a branch was shown, remove branch + everything after parent section
      if(prev && prev !== opt.label){
        const parentId = findChoiceParentSectionId(choiceBlock.choiceKey);
        if(parentId){
          pruneRevealedToSection(parentId);
        }
      }

      // Set current choice (always allowed)
      state.choices[choiceBlock.choiceKey] = opt.label;

      // Set pending feedback + Continue (does NOT reveal branch until Continue)
      state.pendingContinues[choiceBlock.choiceKey] = {
        feedbackText: opt.feedback,
        continueReveal: opt.continueReveal
      };

      saveStateToLocal();
      renderAll();
      smoothScrollTo(container);
    });

    row.appendChild(btn);
  });

  container.appendChild(row);

  // Show feedback + Continue if pending
  const pending = state.pendingContinues[choiceBlock.choiceKey];
  if(pending){
    const fb = document.createElement("div");
    fb.className = "feedback";
    fb.textContent = pending.feedbackText;
    container.appendChild(fb);

    const contRow = document.createElement("div");
    contRow.className = "btn-row";

    const contBtn = document.createElement("button");
    contBtn.type = "button";
    contBtn.className = "btn warning";
    contBtn.textContent = "Continue";
    contBtn.addEventListener("click", () => {
      const target = pending.continueReveal;

      // Enforce exclusivity again: revealing one branch means only that branch exists after parent
      const parentId = findChoiceParentSectionId(choiceBlock.choiceKey);
      if(parentId){
        pruneRevealedToSection(parentId);
      }

      delete state.pendingContinues[choiceBlock.choiceKey];
      saveStateToLocal();
      revealSection(target, true);
    });

    contRow.appendChild(contBtn);
    container.appendChild(contRow);
  }

  return container;
}

function revealSection(sectionId, shouldScroll=false){
  if(!state.revealed.includes(sectionId)){
    state.revealed.push(sectionId);
    saveStateToLocal();
    renderAll();
  }
  if(shouldScroll){
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 50);
  }
}

// -------------------- JOURNALS --------------------
function renderJournal(j){
  const wrap = document.createElement("div");
  wrap.className = "journal";

  const h = document.createElement("h4");
  h.textContent = j.title;
  wrap.appendChild(h);

  const p = document.createElement("div");
  p.className = "prompt";
  p.textContent = j.prompt;
  wrap.appendChild(p);

  const ta = document.createElement("textarea");
  ta.placeholder = "";
  ta.value = state.journals[j.saveKey] || "";
  ta.addEventListener("input", () => {
    state.journals[j.saveKey] = ta.value;
    saveStateToLocalDebounced();
  });
  wrap.appendChild(ta);

  if(j.missionChallenge){
    const mc = document.createElement("div");
    mc.className = "mission";

    const tag = document.createElement("div");
    tag.className = "tag";
    tag.textContent = "Mission Challenges";
    mc.appendChild(tag);

    const mcTitle = document.createElement("h4");
    mcTitle.style.marginTop = "10px";
    mcTitle.style.color = "var(--accent2)";
    mcTitle.textContent = j.missionChallenge.title;
    mc.appendChild(mcTitle);

    const mcPrompt = document.createElement("div");
    mcPrompt.className = "prompt";
    mcPrompt.textContent = j.missionChallenge.prompt;
    mc.appendChild(mcPrompt);

    const mcTa = document.createElement("textarea");
    mcTa.placeholder = "";
    mcTa.value = state.journals[j.missionChallenge.saveKey] || "";
    mcTa.addEventListener("input", () => {
      state.journals[j.missionChallenge.saveKey] = mcTa.value;
      saveStateToLocalDebounced();
    });
    mc.appendChild(mcTa);

    wrap.appendChild(mc);
  }

  return wrap;
}

// -------------------- SAVE / LOAD / RESUME CODE + QR --------------------
function sanitizeState(s){
  if(!s || typeof s !== "object") return defaultState();
  const clean = defaultState();
  clean.v = 2;
  clean.revealed = Array.isArray(s.revealed) ? s.revealed.filter(Boolean) : clean.revealed;
  if(!clean.revealed.includes("hello")) clean.revealed.unshift("hello");
  clean.choices = (s.choices && typeof s.choices === "object") ? s.choices : {};
  clean.journals = (s.journals && typeof s.journals === "object") ? s.journals : {};
  clean.pendingContinues = (s.pendingContinues && typeof s.pendingContinues === "object") ? s.pendingContinues : {};
  return clean;
}

function loadStateFromLocal(){
  try{
    const raw = localStorage.getItem(STATE_KEY);
    if(!raw) return null;
    return sanitizeState(JSON.parse(raw));
  }catch(e){
    return null;
  }
}

function saveStateToLocal(){
  try{
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
    pulseSaved();
    updateResumeArtifacts();
  }catch(e){
    // ignore
  }
}

let saveTimer = null;
function saveStateToLocalDebounced(){
  if(saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveStateToLocal(), 200);
  showSaving();
}

function showSaving(){
  saveStatusEl.textContent = "Saving…";
  saveStatusEl.style.borderColor = "rgba(255,207,90,0.45)";
}
function pulseSaved(){
  saveStatusEl.textContent = "Saved";
  saveStatusEl.style.borderColor = "rgba(69,211,154,0.45)";
}

function encodeStateToCode(s){
  const json = JSON.stringify(s);
  return LZString.compressToEncodedURIComponent(json);
}
function decodeStateFromCode(code){
  try{
    const json = LZString.decompressFromEncodedURIComponent(code);
    if(!json) return null;
    return JSON.parse(json);
  }catch(e){
    return null;
  }
}

function updateResumeArtifacts(){
  const code = encodeStateToCode(state);
  resumeCodeEl.value = code;

  const resumeURL = new URL(window.location.href);
  resumeURL.searchParams.set("resume", code);

  const qrEl = document.getElementById("qrCode");
  if(qrEl){
    qrEl.innerHTML = "";
    qrInstance = new QRCode(qrEl, {
      text: resumeURL.toString(),
      width: 170,
      height: 170,
      correctLevel: QRCode.CorrectLevel.M
    });
  }
}

// -------------------- MODAL + BUTTONS --------------------
pauseBtn.addEventListener("click", () => {
  modalBackdrop.classList.add("show");
  modalBackdrop.setAttribute("aria-hidden", "false");
  updateResumeArtifacts();
});

closePauseModalBtn.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (e) => {
  if(e.target === modalBackdrop) closeModal();
});
document.addEventListener("keydown", (e) => {
  if(e.key === "Escape" && modalBackdrop.classList.contains("show")) closeModal();
});

function closeModal(){
  modalBackdrop.classList.remove("show");
  modalBackdrop.setAttribute("aria-hidden", "true");
}

copyCodeBtn.addEventListener("click", async () => {
  const code = resumeCodeEl.value || "";
  try{
    await navigator.clipboard.writeText(code);
    copyCodeBtn.textContent = "Copied";
    setTimeout(() => copyCodeBtn.textContent = "Copy", 900);
  }catch(e){
    resumeCodeEl.select();
    document.execCommand("copy");
    copyCodeBtn.textContent = "Copied";
    setTimeout(() => copyCodeBtn.textContent = "Copy", 900);
  }
});

resumeBtn.addEventListener("click", () => {
  const code = (pasteCodeEl.value || "").trim();
  if(!code) return;
  const decoded = decodeStateFromCode(code);
  if(!decoded){
    alert("That Resume Code could not be read. Please try again.");
    return;
  }
  state = sanitizeState(decoded);
  saveStateToLocal();
  renderAll();
  pasteCodeEl.value = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// -------------------- EXPORT: ONLY choices + journal prompts/responses --------------------
exportBtn.addEventListener("click", async () => {
  await exportChoicesAndResponsesPDF();
});

async function exportChoicesAndResponsesPDF(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "letter" });

  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  y = addWrapped(doc, "My Journal", margin, y, maxWidth, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  // Selected choices (current)
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  y = addWrapped(doc, "My Selected Choices", margin, y, maxWidth, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const choiceEntries = Object.entries(state.choices || {});
  if(choiceEntries.length === 0){
    y = addWrapped(doc, "• (No choices selected yet)", margin, y, maxWidth, 14);
  }else{
    for(const [, label] of choiceEntries){
      y = ensureSpace(doc, y, pageHeight, margin, 50);
      y = addWrapped(doc, `• ${label}`, margin, y, maxWidth, 14);
    }
  }

  // Journal prompts & responses for revealed sections ONLY
  const journalItems = getJournalItemsInOrder();

  if(journalItems.length){
    y += 14;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    y = addWrapped(doc, "My Prompts & Responses", margin, y, maxWidth, 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    for(const item of journalItems){
      y = ensureSpace(doc, y, pageHeight, margin, 200);

      doc.setFont("helvetica", "bold");
      y = addWrapped(doc, item.promptTitleLine, margin, y, maxWidth, 14);
      doc.setFont("helvetica", "normal");
      y = addWrapped(doc, item.promptText, margin, y, maxWidth, 14);

      y += 6;
      y = drawResponseBox(doc, y, margin, maxWidth, pageHeight, item.saveKey);
      y += 8;
    }
  }

  doc.save("My_Journal.pdf");
}

function getJournalItemsInOrder(){
  const items = [];
  for(const secId of state.revealed){
    const sec = SCRIPT.sections.find(s => s.id === secId);
    if(!sec) continue;
    for(const b of sec.blocks){
      if(b.type === "journal"){
        items.push({
          promptTitleLine: b.title,
          promptText: b.prompt,
          saveKey: b.saveKey
        });
        if(b.missionChallenge){
          items.push({
            promptTitleLine: b.missionChallenge.title,
            promptText: b.missionChallenge.prompt,
            saveKey: b.missionChallenge.saveKey
          });
        }
      }
    }
  }
  return items;
}

function drawResponseBox(doc, y, margin, maxWidth, pageHeight, saveKey){
  const response = (state.journals && state.journals[saveKey]) ? state.journals[saveKey] : "";

  const boxX = margin;
  const boxW = maxWidth;
  const boxPadding = 8;
  const boxTextW = boxW - boxPadding * 2;

  const lines = doc.splitTextToSize(response || "", boxTextW);
  const minBoxH = 70;
  const lineH = 14;
  const contentH = Math.max(minBoxH, (lines.length * lineH) + boxPadding * 2);

  y = ensureSpace(doc, y, pageHeight, margin, contentH + 20);

  doc.setDrawColor(50);
  doc.rect(boxX, y, boxW, contentH);

  doc.setFont("helvetica", "normal");
  doc.text(lines.length ? lines : [""], boxX + boxPadding, y + boxPadding + 12);

  return y + contentH + 14;
}

function addWrapped(doc, text, x, y, maxWidth, lineHeight){
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + (lines.length * lineHeight);
}

function ensureSpace(doc, y, pageHeight, margin, needed){
  if(y + needed > pageHeight - margin){
    doc.addPage();
    return margin;
  }
  return y;
}

// -------------------- UTIL --------------------
function smoothScrollTo(el){
  const r = el.getBoundingClientRect();
  const target = window.scrollY + r.top - 110;
  window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
}

// Initial render
saveStateToLocal();
renderAll();

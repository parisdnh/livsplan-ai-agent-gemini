/* ============================================================
   agent.js — AI onboarding agent
   ============================================================ */

// ── Progress-kontroller ───────────────────────────────────────
function createProgress(barId, labelId, stages) {
  let timer = null;
  let value = 0;
  let stage = 0;

  function draw(pct, lbl) {
    const bar = document.getElementById(barId);
    const lbl2 = document.getElementById(labelId);
    if (bar)  bar.style.width  = Math.min(100, pct) + '%';
    if (lbl2 && lbl) lbl2.textContent = lbl;
  }

  return {
    start() {
      value = 0; stage = 0;
      draw(0, stages[0].label);
      timer = setInterval(() => {
        const target = stages[stage].pct;
        value += Math.max(0.15, (target - value) * 0.045);
        if (value >= target && stage < stages.length - 1) stage++;
        draw(value, stages[stage].label);
      }, 120);
    },
    finish(onDone) {
      clearInterval(timer); timer = null;
      draw(100, '✨ Ferdig!');
      setTimeout(onDone, 650);
    },
  };
}

const genProgress = createProgress('gen-bar', 'gen-label', [
  { pct: 18, label: 'Analyserer svarene dine…' },
  { pct: 42, label: 'Genererer tidslinje og måneder…' },
  { pct: 63, label: 'Lager budsjett og sparemål…' },
  { pct: 80, label: 'Skriver personlige premier…' },
  { pct: 92, label: 'Fullfører planen…' },
]);

const updProgress = createProgress('upd-bar', 'upd-label', [
  { pct: 30, label: 'Tolker forespørselen…' },
  { pct: 75, label: 'Oppdaterer planen…' },
  { pct: 92, label: 'Nesten ferdig…' },
]);

const QUESTIONS = [
  { key: 'navn',      text: 'Hva heter du? 🌸' },
  { key: 'premie',    text: 'Hva er premien din — hva jobber du mot? Det kan være en drømmereise, en luksusveske, konsert, flytte hjemmefra, spare til noe stort, eller noe helt annet!' },
  { key: 'dato',      text: 'Når vil du nå premien? Skriv f.eks. "desember 2027" eller "mars 2026" 📅' },
  { key: 'sparing',   text: 'Hvor mye kan du spare per måned? Skriv et tall i kroner (f.eks. 3000) 💰' },
  { key: 'situasjon', text: 'Jobber du, studerer du, eller begge deler? Fortell gjerne litt om hverdagen din 😊' },
];

const agentAnswers  = {};
let currentQuestion = 0;
let waitingForInput = false;

// ── API-nøkkel ────────────────────────────────────────────────
function saveApiKey() {
  const inp = document.getElementById('api-key-input');
  const key = (inp.value || '').trim();

  if (!key || !key.startsWith('sk-ant-')) {
    inp.classList.add('error');
    inp.placeholder = key.startsWith('sk-') && !key.startsWith('sk-ant-')
      ? 'Dette ser ut som en OpenAI-nøkkel — Anthropic-nøkler starter med sk-ant-'
      : 'Nøkkelen må starte med sk-ant-…';
    setTimeout(() => { inp.classList.remove('error'); inp.placeholder = 'sk-ant-…'; }, 3000);
    return;
  }
  localStorage.setItem('lp_api_key', key);
  document.getElementById('api-key-section').style.display = 'none';
  document.getElementById('chat-container').style.display  = 'flex';
  startChat();
}

// ── Chat-hjelpere ─────────────────────────────────────────────
function addMessage(html, role) {
  const box    = document.getElementById('chat-messages');
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble chat-bubble-' + role;
  bubble.innerHTML = html.replace(/\n/g, '<br>');
  box.appendChild(bubble);
  box.scrollTop = box.scrollHeight;
  return bubble;
}

function showTyping() {
  const box = document.getElementById('chat-messages');
  const el  = document.createElement('div');
  el.className = 'chat-bubble chat-bubble-ai';
  el.id        = 'typing-indicator';
  el.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

function setChatLocked(locked) {
  const inp = document.getElementById('chat-input');
  const btn = document.querySelector('#chat-input-row button');
  if (inp) inp.disabled = locked;
  if (btn) btn.disabled = locked;
}

// ── Chat-flyt ─────────────────────────────────────────────────
function startChat() {
  currentQuestion = 0;
  setTimeout(() => {
    addMessage(
      'Hei! Jeg er din personlige livsplanlegger 🌺\n\n' +
      'Jeg stiller deg 5 raske spørsmål, så genererer jeg en helt personlig tidslinje, budsjett og målliste — tilpasset akkurat deg og premien din.\n\n' +
      'La oss starte!',
      'ai'
    );
    setTimeout(askNext, 1200);
  }, 400);
}

function askNext() {
  if (currentQuestion >= QUESTIONS.length) {
    generatePlan();
    return;
  }
  showTyping();
  setTimeout(() => {
    removeTyping();
    addMessage(QUESTIONS[currentQuestion].text, 'ai');
    setChatLocked(false);
    const inp = document.getElementById('chat-input');
    if (inp) inp.focus();
    waitingForInput = true;
  }, 700);
}

function sendAnswer() {
  if (!waitingForInput) return;
  const inp    = document.getElementById('chat-input');
  const answer = (inp.value || '').trim();
  if (!answer) return;

  waitingForInput = false;
  inp.value = '';
  setChatLocked(true);

  addMessage(answer, 'user');
  agentAnswers[QUESTIONS[currentQuestion].key] = answer;
  currentQuestion++;
  setTimeout(askNext, 500);
}

// ── Generer plan ──────────────────────────────────────────────
async function generatePlan() {
  document.getElementById('chat-input-row').style.display = 'none';

  addMessage('Perfekt! Nå lager jeg din personlige livsplan basert på svarene dine ✨', 'ai');
  setTimeout(() => {
    document.getElementById('chat-generating').style.display = 'block';
    genProgress.start();
  }, 600);

  const apiKey = localStorage.getItem('lp_api_key') || '';
  const today  = new Date().toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });

  const prompt = `Du er en personlig livsplanlegger. Lag en komplett personlig livsplan basert på disse svarene:

Navn: ${agentAnswers.navn}
Premie (hva de jobber mot): ${agentAnswers.premie}
Ønsket dato for premien: ${agentAnswers.dato}
Sparing per måned: ${agentAnswers.sparing} kr
Livssituasjon: ${agentAnswers.situasjon}
Dagens dato: ${today}

Returner KUN et JSON-objekt med denne nøyaktige strukturen — ingen tekst rundt, ingen markdown:

{
  "navn": "...",
  "premie": "...",
  "avreisedato": "YYYY-MM-DD",
  "sparemaal": 30000,
  "months": [
    {
      "id": "jan2026",
      "name": "Januar 2026",
      "color": "#5CAD8A",
      "phase": "saving",
      "badgeText": "🎯 Sparer",
      "location": "Hjemme",
      "jobb": "...",
      "status": "Planlegging",
      "notes": "",
      "context": "En motiverende, personlig beskrivelse av denne måneden og hva som er viktig nå for å nå premien.",
      "todos": [
        {"text": "Konkret, spesifikk og handlingsorientert oppgave", "done": false}
      ]
    }
  ],
  "budgetSections": [
    {
      "title": "💰 Sparefase",
      "rows": [
        {"cat": "Månedlig sparing mot premien", "budget": 3000, "spent": 0}
      ]
    }
  ],
  "goals": [
    {
      "icon": "🎯",
      "title": "Tittel på delmål mot premien",
      "desc": "Beskrivelse med konkrete, praktiske tips og steg for å nå dette delmålet.",
      "pct": 0
    }
  ]
}

Regler:
- Lag månedskort fra neste måned og frem til premiedatoen (maks 8 måneder)
- Hvert månedskort skal ha 4–5 konkrete, spesifikke todos som er relevante for akkurat denne premien
- Todos skal ikke være generiske — de skal passe til nettopp det denne personen jobber mot
- Budsjett skal reflektere hva det faktisk koster å nå premien
- sparemaal = estimert totalbeløp brukeren trenger
- Lag 5–7 personlige premier/delmål
- Bruk ordet "premie" konsekvent — ikke "drøm" eller "mål"
- Månedsfarge-logikk: tidlig fase="#5CAD8A", midtfase="#C9A8E0", sluttfase="#F4A97A", premiedato="#E8619A"
- phase-verdier: "saving", "planning", "final", "goal"
- Alt innhold skal være på norsk
- Returner KUN JSON — ingen annen tekst`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `API-feil (${res.status})`);
    }

    const result = await res.json();
    const raw    = result.content[0].text;

    let data;
    try {
      // Strip markdown code fences if present
      const stripped = raw.replace(/^```(?:json)?\s*/im, '').replace(/```\s*$/m, '').trim();
      // Find outermost JSON object
      const start = stripped.indexOf('{');
      const end   = stripped.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error('no braces');
      data = JSON.parse(stripped.slice(start, end + 1));
    } catch {
      const preview = raw.slice(-200);
      throw new Error(`JSON-parsing feilet. Svaret ble trolig avkuttet. Siste del: "${preview}"`);
    }

    genProgress.finish(() => {
      document.getElementById('chat-generating').style.display = 'none';
      loadFromAgentData(data);
    });

  } catch (err) {
    genProgress.finish(() => {});
    document.getElementById('chat-generating').style.display = 'none';

    const keyPreview = apiKey ? apiKey.slice(0, 14) + '…' : '(ingen nøkkel)';
    const isKeyError = err.message.toLowerCase().includes('api-key') ||
                       err.message.toLowerCase().includes('api_key') ||
                       err.message.toLowerCase().includes('unauthorized') ||
                       err.message.includes('401');

    const msg = isKeyError
      ? `API-nøkkelen ble avvist av Anthropic.\n\nNøkkel som ble brukt: <code>${keyPreview}</code>\n\nSjekk at du kopierte hele nøkkelen fra console.anthropic.com → API Keys.\n\n` +
        `<button onclick="changeApiKey()" class="retry-btn">🔑 Bytt nøkkel</button>`
      : `Noe gikk galt: <strong>${err.message}</strong>\n\nSjekk internettilkoblingen og prøv igjen.\n\n` +
        `<button onclick="retryGenerate()" class="retry-btn">🔄 Prøv igjen</button> ` +
        `<button onclick="changeApiKey()" class="retry-btn">🔑 Bytt nøkkel</button>`;

    addMessage(msg, 'ai');
    document.getElementById('chat-input-row').style.display = 'flex';
    setChatLocked(true);
  }
}

function retryGenerate() {
  document.getElementById('chat-input-row').style.display = 'none';
  generatePlan();
}

// ── Bytt API-nøkkel ───────────────────────────────────────────
function changeApiKey() {
  localStorage.removeItem('lp_api_key');
  document.getElementById('chat-container').style.display  = 'none';
  document.getElementById('api-key-section').style.display = 'flex';
  document.getElementById('api-key-input').value = '';
}

// ── Persistent AI-chat (etter onboarding) ────────────────────
let persistentHistory = [];
let persistentTypingEl = null;

function togglePersistentChat() {
  const panel = document.getElementById('persistent-panel');
  const opening = !panel.classList.contains('open');
  panel.classList.toggle('open');
  if (opening && persistentHistory.length === 0) {
    initPersistentChat();
  }
}

function closePersistentChat() {
  document.getElementById('persistent-panel').classList.remove('open');
}

function initPersistentChat() {
  const name = localStorage.getItem('lp_user_name') || 'deg';
  addPersistentMsg(
    `Hei igjen, ${name}! 🌸 Planen din er klar — men jeg kan gjøre den enda mer personlig.\n\nFortell meg mer om hverdagen din, be meg justere mål, endre tidslinjen, tilpasse budsjettet, eller hva som helst annet.`,
    'ai'
  );
}

function addPersistentMsg(html, role) {
  const box    = document.getElementById('persistent-messages');
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble chat-bubble-' + role;
  bubble.innerHTML = html.replace(/\n/g, '<br>');
  box.appendChild(bubble);
  box.scrollTop = box.scrollHeight;
}

function showPersistentTyping() {
  const box = document.getElementById('persistent-messages');
  persistentTypingEl = document.createElement('div');
  persistentTypingEl.className = 'chat-bubble chat-bubble-ai';
  persistentTypingEl.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  box.appendChild(persistentTypingEl);
  box.scrollTop = box.scrollHeight;
}

function removePersistentTyping() {
  if (persistentTypingEl) { persistentTypingEl.remove(); persistentTypingEl = null; }
}

async function sendPersistentMessage() {
  const inp = document.getElementById('persistent-input');
  const msg = (inp.value || '').trim();
  if (!msg) return;

  inp.value = '';
  inp.disabled = true;
  addPersistentMsg(msg, 'user');
  persistentHistory.push({ role: 'user', content: msg });

  // Behold maks 20 meldinger i historikk
  if (persistentHistory.length > 20) persistentHistory = persistentHistory.slice(-20);

  showPersistentTyping();
  document.getElementById('persistent-updating').style.display = 'block';
  updProgress.start();

  const apiKey  = localStorage.getItem('lp_api_key') || '';
  const name    = localStorage.getItem('lp_user_name') || '';
  const premie  = localStorage.getItem('lp_premie') || '';
  const dateStr = departureDate && !isNaN(departureDate.getTime())
    ? departureDate.toLocaleDateString('nb-NO', { month: 'long', year: 'numeric' })
    : 'ikke satt';

  const systemPrompt = `Du er en personlig livsplanlegger for ${name}. De jobber mot premien sin: "${premie}" (dato: ${dateStr}).

Nåværende plan:
- Sparemål: ${savings.goal ? savings.goal.toLocaleString('no-NO') + ' kr' : 'ikke satt'}
- Måneder i tidslinjen: ${months.length}
- Premier/delmål: ${goals.map(g => g.title).join(' | ')}

Brukeren kan be deg om å:
- Endre eller legge til premier/delmål
- Justere tidslinjen (måneder og todos)
- Endre budsjettet
- Gjøre planen mer personlig og detaljert
- Gi råd og motivasjon

Svar ALLTID med et gyldig JSON-objekt:
{
  "message": "Svarmeldingen din på norsk her",
  "update": {
    "goals": [...],
    "months": [...],
    "budgetSections": [...],
    "sparemaal": 50000,
    "premie": "...",
    "avreisedato": "YYYY-MM-DD"
  }
}

Inkluder kun feltene i "update" som faktisk endres. Utelat "update" helt hvis ingenting i planen endres.
Bruk "premie" konsekvent — aldri "drøm" eller "mål". Svar på norsk. Vær konkret og motiverende.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
        system: systemPrompt,
        messages: persistentHistory,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `API-feil (${res.status})`);
    }

    const result = await res.json();
    const raw    = result.content[0].text;
    persistentHistory.push({ role: 'assistant', content: raw });

    removePersistentTyping();
    updProgress.finish(() => {
      document.getElementById('persistent-updating').style.display = 'none';
    });

    let parsed;
    try {
      const start = raw.indexOf('{');
      const end   = raw.lastIndexOf('}');
      parsed = JSON.parse(raw.slice(start, end + 1));
    } catch {
      addPersistentMsg(raw, 'ai');
      inp.disabled = false; inp.focus();
      return;
    }

    addPersistentMsg(parsed.message || raw, 'ai');

    if (parsed.update && Object.keys(parsed.update).length > 0) {
      applyPlanUpdate(parsed.update);
    }

  } catch (err) {
    removePersistentTyping();
    updProgress.finish(() => {
      document.getElementById('persistent-updating').style.display = 'none';
    });
    addPersistentMsg(`Noe gikk galt: ${err.message}`, 'ai');
  }

  inp.disabled = false;
  inp.focus();
}

function applyPlanUpdate(update) {
  let changed = false;

  if (update.goals)          { goals  = update.goals;          changed = true; }
  if (update.months)         { months = update.months;         changed = true; }
  if (update.budgetSections) { budget = update.budgetSections; changed = true; }
  if (update.sparemaal)      { savings.goal = update.sparemaal; changed = true; }

  if (update.premie) {
    userPremie = update.premie;
    localStorage.setItem('lp_premie', userPremie);
    updateDynamicText();
    changed = true;
  }
  if (update.avreisedato) {
    departureDate = new Date(update.avreisedato);
    localStorage.setItem('lp_departure_date', update.avreisedato);
    buildCountdown();
    updateDynamicText();
    changed = true;
  }

  if (changed) {
    persist();
    buildTimeline();
    buildBudget();
    buildGoals();
    buildSavings();

    showToast('Plan oppdatert! ✨');
  }
}

// ── Init ─────────────────────────────────────────────────────
(function initAgent() {
  if (localStorage.getItem('lp_onboarding_done')) return;

  document.getElementById('onboarding').style.display = 'block';

  const savedKey = localStorage.getItem('lp_api_key');
  if (savedKey) {
    document.getElementById('api-key-section').style.display = 'none';
    document.getElementById('chat-container').style.display  = 'flex';
    startChat();
  } else {
    document.getElementById('api-key-section').style.display = 'flex';
    document.getElementById('chat-container').style.display  = 'none';
  }
})();

/* ============================================================
   app.js — livsplan main logic
   ============================================================ */

// ── State ────────────────────────────────────────────────────
let months  = JSON.parse(localStorage.getItem('lp_months'))  || JSON.parse(JSON.stringify(DEFAULT_MONTHS));
let budget  = JSON.parse(localStorage.getItem('lp_budget'))  || JSON.parse(JSON.stringify(DEFAULT_BUDGET_SECTIONS));
let goals   = JSON.parse(localStorage.getItem('lp_goals'))   || JSON.parse(JSON.stringify(DEFAULT_GOALS));
let savings = JSON.parse(localStorage.getItem('lp_savings')) || { current: 0, log: [], goal: 0 };

let departureDate = localStorage.getItem('lp_departure_date')
  ? new Date(localStorage.getItem('lp_departure_date'))
  : null;
let userName   = localStorage.getItem('lp_user_name') || '';
let userPremie = localStorage.getItem('lp_premie')    || '';

// ── Persist ──────────────────────────────────────────────────
function persist() {
  localStorage.setItem('lp_months',  JSON.stringify(months));
  localStorage.setItem('lp_budget',  JSON.stringify(budget));
  localStorage.setItem('lp_goals',   JSON.stringify(goals));
  localStorage.setItem('lp_savings', JSON.stringify(savings));
}

function saveAll() {
  persist();
  const ind = document.getElementById('save-indicator');
  if (ind) { ind.style.display = 'inline'; setTimeout(() => ind.style.display = 'none', 2500); }
  showToast('Lagret! 💗');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

// ── Tabs ─────────────────────────────────────────────────────
function showTab(name, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  btn.classList.add('active');
}

// ── Countdown ────────────────────────────────────────────────
function buildCountdown() {
  const noDate = !departureDate || isNaN(departureDate.getTime());
  if (noDate) {
    ['cd-days','cd-weeks','cd-months'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '—';
    });
    return;
  }
  const now  = new Date();
  const diff = departureDate - now;
  if (diff <= 0) {
    ['cd-days','cd-weeks','cd-months'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '0';
    });
    return;
  }
  const days  = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  const mons  = Math.floor(days / 30.44);
  document.getElementById('cd-days').textContent   = days;
  document.getElementById('cd-weeks').textContent  = weeks;
  document.getElementById('cd-months').textContent = mons;
}

function updateDynamicText() {
  const subtitle = document.getElementById('header-subtitle');
  if (subtitle && userName && userPremie) {
    const dateStr = departureDate && !isNaN(departureDate.getTime())
      ? departureDate.toLocaleDateString('nb-NO', { month: 'long', year: 'numeric' })
      : '';
    subtitle.textContent = `${userName} → ${userPremie}${dateStr ? ' · ' + dateStr : ''}`;
  }

  const cdTitle = document.getElementById('cd-title');
  if (cdTitle && userPremie) cdTitle.textContent = userPremie;

  const cdSub = document.getElementById('cd-subtitle');
  if (cdSub && userName) cdSub.textContent = `Hold fokus, ${userName}! Du fortjener premien 🌸`;

  const pill = document.getElementById('savings-pill');
  if (pill && userPremie) pill.textContent = userPremie;
}

// ── Savings tracker ──────────────────────────────────────────
function buildSavings() {
  const goal = savings.goal || 0;
  const pct  = goal > 0 ? Math.min(100, Math.round((savings.current / goal) * 100)) : 0;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('savings-current',   savings.current.toLocaleString('nb-NO') + ' kr');
  set('savings-goal-val',  goal > 0 ? goal.toLocaleString('nb-NO') + ' kr' : '— kr');
  set('savings-pct',       pct + '%');
  set('savings-left',      goal > 0 ? Math.max(0, goal - savings.current).toLocaleString('nb-NO') + ' kr igjen' : '—');
  set('savings-goal-label',goal > 0 ? goal.toLocaleString('nb-NO') + ' kr' : '— kr');

  const fill = document.getElementById('savings-bar-fill');
  if (fill) fill.style.width = pct + '%';

  const mc = document.getElementById('milestones');
  if (!mc || goal <= 0) return;
  const step = Math.round(goal / 5);
  const stones = [
    { amount: step,   label: formatK(step),   icon: '🌱' },
    { amount: step*2, label: formatK(step*2),  icon: '🌸' },
    { amount: step*3, label: formatK(step*3),  icon: '🌺' },
    { amount: step*4, label: formatK(step*4),  icon: '🦋' },
    { amount: goal,   label: formatK(goal),    icon: '🌟' },
  ];
  mc.innerHTML = '';
  stones.forEach(m => {
    const el = document.createElement('div');
    el.className = 'milestone' + (savings.current >= m.amount ? ' reached' : '');
    el.innerHTML = `<span class="m-icon">${m.icon}</span>${m.label}${savings.current >= m.amount ? ' ✓' : ''}`;
    mc.appendChild(el);
  });
}

function formatK(n) {
  return n >= 1000 ? (n / 1000).toFixed(0) + 'k' : n + '';
}

function addSavings() {
  const inp = document.getElementById('savings-add-input');
  const val = parseInt(inp.value);
  if (!val || val === 0) return;
  savings.current += val;
  if (savings.current < 0) savings.current = 0;
  savings.log.push({ amount: val, date: new Date().toLocaleDateString('nb-NO') });
  inp.value = '';
  persist();
  buildSavings();
  showToast(val > 0 ? `+${val.toLocaleString('nb-NO')} kr spart! 🎉` : `${val.toLocaleString('nb-NO')} kr registrert 💸`);
}

function setSavingsGoalEdit() {
  const inp = document.getElementById('savings-goal-edit');
  const val = parseInt(inp.value);
  if (val && val > 0) {
    savings.goal = val;
    inp.value = '';
    persist();
    buildSavings();
    showToast('Sparemål oppdatert! 🌟');
  }
}

// ── Timeline ─────────────────────────────────────────────────
function buildTimeline() {
  const tl = document.getElementById('timeline');
  if (!tl) return;
  tl.innerHTML = '';
  if (months.length === 0) {
    tl.innerHTML = '<div class="empty-state">Ingen måneder ennå — fullfør onboarding for å generere tidslinjen din! 🌸</div>';
    return;
  }
  months.forEach((m, mi) => {
    const done  = m.todos.filter(t => t.done).length;
    const total = m.todos.length;
    const pct   = total ? Math.round((done / total) * 100) : 0;
    const card  = document.createElement('div');
    card.className = 'month-card';
    card.innerHTML = `
      <div class="month-header" onclick="toggleMonth(${mi})">
        <div class="month-color" style="background:${m.color}; color:${m.color}"></div>
        <div class="month-name">${m.name}</div>
        <div class="month-meta">
          <span class="badge badge-${m.phase}">${m.badgeText}</span>
          <span class="month-pct">${pct}%</span>
          <span class="chevron" id="chev-${mi}">▾</span>
        </div>
      </div>
      <div class="month-body" id="body-${mi}">
        <div class="month-body-inner">
          <div class="phase-banner">
            <strong>${m.name} — ${m.location}</strong><br>${m.context}
          </div>
          <div>
            <div class="section-label">✅ Todo denne måneden</div>
            <div class="todo-list" id="todos-${mi}"></div>
            <div class="add-todo" style="margin-top:10px">
              <input id="newtodo-${mi}" placeholder="Legg til oppgave…"
                     onkeydown="if(event.key==='Enter')addTodo(${mi})" />
              <button onclick="addTodo(${mi})">+</button>
            </div>
          </div>
          <div>
            <div class="section-label">📍 Detaljer</div>
            <div class="info-rows">
              <div class="info-row">
                <span class="info-key">📍 Sted</span>
                <span class="info-val editable-val" id="loc-${mi}"
                      onclick="editField(${mi},'location','loc-${mi}')">${m.location}</span>
              </div>
              <div class="info-row">
                <span class="info-key">💼 Jobb/skole</span>
                <span class="info-val editable-val" id="job-${mi}"
                      onclick="editField(${mi},'jobb','job-${mi}')">${m.jobb}</span>
              </div>
              <div class="info-row">
                <span class="info-key">🌟 Status</span>
                <span class="info-val">${m.status}</span>
              </div>
            </div>
            <div class="section-label" style="margin-top:16px">📝 Notater</div>
            <textarea class="notes-area"
              placeholder="Tanker, ideer, drømmer…"
              onchange="saveNotes(${mi},this.value)">${m.notes || ''}</textarea>
            <div class="progress-mini">
              <div class="progress-mini-fill" id="prog-${mi}" style="width:${pct}%"></div>
            </div>
          </div>
        </div>
      </div>`;
    tl.appendChild(card);
    renderTodos(mi);
  });
}

function toggleMonth(mi) {
  const body = document.getElementById('body-' + mi);
  const chev = document.getElementById('chev-' + mi);
  const open = body.classList.toggle('open');
  chev.classList.toggle('open', open);
}

function renderTodos(mi) {
  const list = document.getElementById('todos-' + mi);
  if (!list) return;
  list.innerHTML = '';
  months[mi].todos.forEach((t, ti) => {
    const item = document.createElement('div');
    item.className = 'todo-item' + (t.done ? ' done' : '');
    item.innerHTML = `
      <input type="checkbox" id="cb-${mi}-${ti}" ${t.done ? 'checked' : ''}
             onchange="toggleTodo(${mi},${ti})">
      <label class="todo-label" for="cb-${mi}-${ti}">${t.text}</label>
      <button class="todo-del" onclick="deleteTodo(${mi},${ti})">✕</button>`;
    list.appendChild(item);
  });
}

function toggleTodo(mi, ti) {
  months[mi].todos[ti].done = !months[mi].todos[ti].done;
  persist();
  const done  = months[mi].todos.filter(t => t.done).length;
  const total = months[mi].todos.length;
  const pct   = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('cb-' + mi + '-' + ti).parentElement
    .classList.toggle('done', months[mi].todos[ti].done);
  const prog = document.getElementById('prog-' + mi);
  if (prog) prog.style.width = pct + '%';
  const chev = document.getElementById('chev-' + mi);
  if (chev) chev.previousElementSibling.textContent = pct + '%';
}

function addTodo(mi) {
  const inp = document.getElementById('newtodo-' + mi);
  if (!inp.value.trim()) return;
  months[mi].todos.push({ text: inp.value.trim(), done: false });
  inp.value = '';
  persist();
  renderTodos(mi);
}

function deleteTodo(mi, ti) {
  months[mi].todos.splice(ti, 1);
  persist();
  renderTodos(mi);
}

function saveNotes(mi, val) {
  months[mi].notes = val;
  persist();
}

function editField(mi, field, elId) {
  const el  = document.getElementById(elId);
  const cur = months[mi][field];
  el.outerHTML = `<div class="inline-edit" id="${elId}">
    <input id="ei-${elId}" value="${cur}" onkeydown="if(event.key==='Enter')saveField(${mi},'${field}','${elId}')"/>
    <button onclick="saveField(${mi},'${field}','${elId}')">OK</button>
  </div>`;
  document.getElementById('ei-' + elId).focus();
}

function saveField(mi, field, elId) {
  const inp = document.getElementById('ei-' + elId);
  const val = inp ? inp.value.trim() : '';
  if (val) months[mi][field] = val;
  persist();
  const span       = document.createElement('span');
  span.className   = 'info-val editable-val';
  span.id          = elId;
  span.textContent = months[mi][field];
  span.onclick     = () => editField(mi, field, elId);
  document.getElementById(elId).replaceWith(span);
}

// ── Budget ───────────────────────────────────────────────────
function buildBudget() {
  const metricsEl  = document.getElementById('budget-metrics');
  const sectionsEl = document.getElementById('budget-sections');
  if (!metricsEl) return;

  if (budget.length === 0) {
    metricsEl.innerHTML  = '';
    sectionsEl.innerHTML = '<div class="empty-state">Ingen budsjettposter ennå — AI-en fyller inn når du fullfører onboarding 🌸</div>';
    return;
  }

  let totalB = 0, totalS = 0;
  budget.forEach(sec => sec.rows.forEach(r => { totalB += r.budget; totalS += r.spent; }));
  const left = totalB - totalS;

  metricsEl.innerHTML = `
    <div class="metric-card" data-emoji="💸">
      <div class="metric-label">Totalbudsjett</div>
      <div class="metric-val">${totalB.toLocaleString('nb-NO')} kr</div>
    </div>
    <div class="metric-card" data-emoji="🛍️">
      <div class="metric-label">Brukt</div>
      <div class="metric-val ${totalS > 0 ? 'pink' : ''}">${totalS.toLocaleString('nb-NO')} kr</div>
    </div>
    <div class="metric-card" data-emoji="${left >= 0 ? '🌸' : '😬'}">
      <div class="metric-label">Gjenstår</div>
      <div class="metric-val ${left >= 0 ? 'green' : 'red'}">${left.toLocaleString('nb-NO')} kr</div>
    </div>
    <div class="metric-card" data-emoji="📊">
      <div class="metric-label">Forbrukt</div>
      <div class="metric-val">${totalB ? Math.round((totalS / totalB) * 100) : 0}%</div>
    </div>`;

  sectionsEl.innerHTML = '';
  budget.forEach((sec, si) => {
    const div = document.createElement('div');
    div.className = 'budget-section';
    div.innerHTML = `<div class="budget-section-title">${sec.title}</div>
      <div class="budget-table-wrap">
        <table>
          <thead><tr><th>Post</th><th>Budsjett (kr)</th><th>Brukt (kr)</th><th>Rest</th><th></th></tr></thead>
          <tbody id="btbody-${si}"></tbody>
        </table>
        <div class="add-budget-row">
          <input id="bcat-${si}" placeholder="Ny post…" />
          <input id="bbud-${si}" type="number" placeholder="Beløp" />
          <button onclick="addBudgetRow(${si})">+ Legg til</button>
        </div>
      </div>`;
    sectionsEl.appendChild(div);
    renderBudgetRows(si);
  });
}

function renderBudgetRows(si) {
  const tbody = document.getElementById('btbody-' + si);
  if (!tbody) return;
  tbody.innerHTML = '';
  budget[si].rows.forEach((row, ri) => {
    const rest = row.budget - row.spent;
    const tr   = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.cat}</td>
      <td><input class="budget-input" type="number" value="${row.budget}"
           onchange="updateBudget(${si},${ri},'budget',this.value)" /></td>
      <td><input class="budget-input" type="number" value="${row.spent}"
           onchange="updateBudget(${si},${ri},'spent',this.value)" /></td>
      <td class="${rest < 0 ? 'overspent' : 'surplus'}">${rest.toLocaleString('nb-NO')} kr</td>
      <td><button class="del-btn" onclick="deleteBudgetRow(${si},${ri})">✕</button></td>`;
    tbody.appendChild(tr);
  });
}

function updateBudget(si, ri, field, val) {
  budget[si].rows[ri][field] = parseInt(val) || 0;
  persist();
  buildBudget();
}

function deleteBudgetRow(si, ri) {
  budget[si].rows.splice(ri, 1);
  persist();
  buildBudget();
}

function addBudgetRow(si) {
  const cat = document.getElementById('bcat-' + si).value.trim();
  const bud = parseInt(document.getElementById('bbud-' + si).value) || 0;
  if (!cat) return;
  budget[si].rows.push({ cat, budget: bud, spent: 0 });
  document.getElementById('bcat-' + si).value = '';
  document.getElementById('bbud-' + si).value = '';
  persist();
  buildBudget();
}

// ── Goals / Premier ──────────────────────────────────────────
function buildGoals() {
  const list = document.getElementById('goals-list');
  if (!list) return;
  list.innerHTML = '';
  if (goals.length === 0) {
    list.innerHTML = '<div class="empty-state">Ingen premier ennå — AI-en fyller inn når du fullfører onboarding! ✨</div>';
    return;
  }
  goals.forEach((g, i) => {
    const card = document.createElement('div');
    card.className = 'goal-card';
    card.innerHTML = `
      <div class="goal-top">
        <span class="goal-icon">${g.icon}</span>
        <span class="goal-title-text"
              contenteditable="true"
              onblur="saveGoalField(${i},'title',this.textContent)"
              title="Klikk for å redigere">${g.title}</span>
        <button class="goal-del" onclick="deleteGoal(${i})">✕</button>
      </div>
      <div class="edit-hint">✏️ Klikk på tittel eller beskrivelse for å redigere</div>
      <span class="goal-desc-text"
            contenteditable="true"
            onblur="saveGoalField(${i},'desc',this.textContent)"
            title="Klikk for å redigere">${g.desc}</span>
      <div class="goal-progress-row">
        <div class="goal-bar">
          <div class="goal-bar-fill" id="gbar-${i}" style="width:${g.pct}%"></div>
        </div>
        <input type="range" class="goal-slider" min="0" max="100" step="5" value="${g.pct}"
               oninput="updateGoalPct(${i},this.value)">
        <span class="goal-pct-label" id="gpct-${i}">${g.pct}%</span>
      </div>`;
    list.appendChild(card);
  });
}

function saveGoalField(i, field, val) {
  goals[i][field] = val.trim();
  persist();
}

function updateGoalPct(i, val) {
  goals[i].pct = parseInt(val);
  document.getElementById('gbar-' + i).style.width = val + '%';
  document.getElementById('gpct-' + i).textContent = val + '%';
  persist();
}

function deleteGoal(i) {
  goals.splice(i, 1);
  persist();
  buildGoals();
}

function addGoal() {
  const title = document.getElementById('new-goal-title').value.trim();
  const desc  = document.getElementById('new-goal-desc').value.trim();
  if (!title) return;
  const icon = GOAL_ICONS[goals.length % GOAL_ICONS.length];
  goals.push({ icon, title, desc, pct: 0 });
  document.getElementById('new-goal-title').value = '';
  document.getElementById('new-goal-desc').value  = '';
  persist();
  buildGoals();
  showToast('Ny premie lagt til! ✨');
}

// ── Load from agent data ──────────────────────────────────────
function loadFromAgentData(data) {
  userName   = data.navn   || '';
  userPremie = data.premie || data.maal || '';

  if (data.avreisedato) {
    departureDate = new Date(data.avreisedato);
    localStorage.setItem('lp_departure_date', data.avreisedato);
  }
  if (userName)   localStorage.setItem('lp_user_name', userName);
  if (userPremie) localStorage.setItem('lp_premie', userPremie);

  months  = data.months         || [];
  budget  = data.budgetSections || [];
  goals   = data.goals          || [];
  savings = { current: 0, log: [], goal: data.sparemaal || 0 };

  persist();
  localStorage.setItem('lp_onboarding_done', 'true');

  updateDynamicText();
  buildCountdown();
  buildSavings();
  buildTimeline();
  buildBudget();
  buildGoals();
  showApp();

  showToast(`Velkommen, ${userName}! Planen din er klar 🌸`);
}

// ── Show / reset app ──────────────────────────────────────────
function showApp() {
  const onb = document.getElementById('onboarding');
  const app = document.getElementById('app-main');
  if (onb) onb.style.display = 'none';
  if (app) app.style.display = 'block';
  const btnSave  = document.getElementById('btn-save');
  const btnReset = document.getElementById('btn-reset');
  if (btnSave)  btnSave.style.display  = '';
  if (btnReset) btnReset.style.display = '';
}

function resetAll() {
  if (!confirm('Er du sikker? All fremgang slettes og du starter på nytt med AI-onboarding.')) return;
  ['lp_months','lp_budget','lp_goals','lp_savings',
   'lp_departure_date','lp_user_name','lp_premie','lp_onboarding_done']
    .forEach(k => localStorage.removeItem(k));
  location.reload();
}

// ── Init ─────────────────────────────────────────────────────
buildCountdown();
buildSavings();
buildTimeline();
buildBudget();
buildGoals();
setInterval(buildCountdown, 60000);

if (localStorage.getItem('lp_onboarding_done')) {
  updateDynamicText();
  showApp();
}

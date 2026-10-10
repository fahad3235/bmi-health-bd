/* BMI Health BD — fully offline. State in localStorage under KEY. Zero network requests. */

const KEY = 'bmi-health-bd-v1';

function loadState() {
  const def = { lang: 'en', unit: 'metric', history: [], last: null };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return def;
    const s = JSON.parse(raw);
    if (!s || typeof s !== 'object') return def;
    if (s.lang !== 'bn') s.lang = 'en';
    if (s.unit !== 'imperial') s.unit = 'metric';
    if (!Array.isArray(s.history)) s.history = [];
    s.history = s.history.filter((e) => e && typeof e.id === 'string' &&
      Number.isFinite(e.bmi) && typeof e.date === 'string').slice(0, 200);
    return Object.assign(def, s);
  } catch (e) { return def; }
}
let S = loadState();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

function t(key) { return (I18N[S.lang] && I18N[S.lang][key]) || I18N.en[key] || key; }
function fmt(key, a) { return t(key).replace('{0}', a); }
function num(x, d) {
  const s = d === undefined ? String(x) : Number(x).toFixed(d);
  return S.lang === 'bn' ? bnNum(s) : s;
}

function el(id) { return document.getElementById(id); }

/* ---------- metric/imperial input visibility ---------- */
function renderUnit() {
  const imp = S.unit === 'imperial';
  el('row-metric').style.display = imp ? 'none' : '';
  el('row-imperial').style.display = imp ? '' : 'none';
  el('w-metric').style.display = imp ? 'none' : '';
  el('w-imperial').style.display = imp ? '' : 'none';
  el('unit-metric').classList.toggle('on', !imp);
  el('unit-imperial').classList.toggle('on', imp);
}

/* Read inputs, always returning METRIC values for the math. */
function readInputs() {
  let heightCm, weightKg;
  if (S.unit === 'metric') {
    heightCm = parseFloat(el('in-hcm').value);
    weightKg = parseFloat(el('in-wkg').value);
  } else {
    const ft = parseFloat(el('in-ft').value) || 0;
    const inch = parseFloat(el('in-in').value) || 0;
    const lb = parseFloat(el('in-lb').value);
    heightCm = inToCm(ft * 12 + inch);
    weightKg = lbToKg(lb);
  }
  const age = parseInt(el('in-age').value, 10);
  const sex = document.querySelector('input[name=sex]:checked').value;
  const activity = el('in-act').value;
  return { heightCm, weightKg, age, sex, activity };
}

function showErrors(errs) {
  ['height', 'weight', 'age'].forEach((k) => el('err-' + k).textContent = '');
  errs.forEach((k) => { el('err-' + k).textContent = t('err_' + k); });
}

function calculate() {
  const inp = readInputs();
  const errs = validateInputs(inp);
  showErrors(errs);
  if (errs.length) { el('results').style.display = 'none'; return; }
  const r = calculateAll(inp);
  S.last = Object.assign({ date: new Date().toISOString().slice(0, 10),
    heightCm: inp.heightCm, weightKg: inp.weightKg, age: inp.age,
    sex: inp.sex, activity: inp.activity }, r);
  save();
  renderResults(r);
}

function renderResults(r) {
  el('results').style.display = '';
  el('res-bmi').textContent = num(r.bmi, 2);
  const catKey = 'cat_' + r.category;
  el('res-cat').textContent = t(catKey);
  el('res-cat').className = 'cat cat-' + r.category;
  // gauge marker: clamp 15..35 -> 0..100%
  const pos = Math.min(100, Math.max(0, ((r.bmi - 15) / 20) * 100));
  el('gauge-marker').style.left = pos.toFixed(1) + '%';
  el('res-bmr').textContent = fmt('kcalDay', num(Math.round(r.bmr)));
  el('res-tdee').textContent = fmt('kcalDay', num(Math.round(r.tdee)));
  el('res-ideal').textContent = fmt('kgUnit', num(r.idealLow, 1) + ' – ' + num(r.idealHigh, 1));
  el('save-btn').textContent = t('saveResult');
}

function saveResult() {
  if (!S.last) return;
  S.last.id = 'e' + Date.now();
  S.history.unshift(S.last);
  S.history = S.history.slice(0, 200);
  S.last = null;
  el('results').style.display = 'none';
  save();
  renderHistory();
}

function deleteEntry(id) {
  S.history = S.history.filter((e) => e.id !== id);
  save();
  renderHistory();
}

function renderHistory() {
  const box = el('history-list');
  if (!S.history.length) {
    box.innerHTML = '<p class="muted">' + t('noHistory') + '</p>';
    return;
  }
  box.innerHTML = '';
  S.history.forEach((e) => {
    const row = document.createElement('div');
    row.className = 'hist-row';
    const left = document.createElement('div');
    const d = document.createElement('div');
    d.className = 'hist-date';
    d.textContent = S.lang === 'bn' ? bnNum(e.date) : e.date;
    const v = document.createElement('div');
    v.className = 'hist-val';
    v.textContent = t('bmi') + ' ' + num(e.bmi, 1) + ' · ' + t('cat_' + e.category);
    left.appendChild(d); left.appendChild(v);
    const btn = document.createElement('button');
    btn.className = 'btn small danger';
    btn.textContent = t('del');
    btn.addEventListener('click', () => deleteEntry(e.id));
    row.appendChild(left); row.appendChild(btn);
    box.appendChild(row);
  });
}

/* ---------- language ---------- */
function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach((n) => {
    n.textContent = t(n.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-ph]').forEach((n) => {
    n.placeholder = t(n.getAttribute('data-i18n-ph'));
  });
  document.documentElement.lang = S.lang === 'bn' ? 'bn' : 'en';
  el('lang-btn').textContent = t('langBtn');
  renderUnit();
  if (S.last) renderResults(S.last);
  renderHistory();
}

/* ---------- data: export / import / clear ---------- */
function exportJSON() {
  const blob = new Blob([JSON.stringify({ app: 'bmi-health-bd', v: 1, history: S.history }, null, 2)],
    { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'bmi-health-bd-history.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function importJSON(file) {
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const d = JSON.parse(rd.result);
      if (!d || !Array.isArray(d.history)) throw new Error('bad');
      const clean = d.history.filter((e) => e && typeof e.id === 'string' &&
        Number.isFinite(e.bmi) && typeof e.date === 'string').slice(0, 200);
      S.history = clean;
      save(); renderHistory();
      el('flash').textContent = t('imported');
    } catch (e) { el('flash').textContent = t('importBad'); }
  };
  rd.readAsText(file);
}

function init() {
  el('lang-btn').addEventListener('click', () => {
    S.lang = S.lang === 'bn' ? 'en' : 'bn';
    save(); applyLang();
  });
  el('unit-metric').addEventListener('click', () => { S.unit = 'metric'; save(); renderUnit(); });
  el('unit-imperial').addEventListener('click', () => { S.unit = 'imperial'; save(); renderUnit(); });
  el('calc-btn').addEventListener('click', calculate);
  el('save-btn').addEventListener('click', saveResult);
  el('export-btn').addEventListener('click', exportJSON);
  el('import-file').addEventListener('change', (e) => {
    if (e.target.files[0]) importJSON(e.target.files[0]);
    e.target.value = '';
  });
  el('clear-btn').addEventListener('click', () => {
    if (confirm(t('clearConfirm'))) { S.history = []; S.last = null; save(); renderHistory(); }
  });
  // defaults
  el('in-hcm').value = '170';
  el('in-wkg').value = '65';
  el('in-age').value = '25';
  applyLang();
}

document.addEventListener('DOMContentLoaded', init);

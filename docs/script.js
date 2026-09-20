(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const form = $('#doseForm');
  const fields = { sex: $('#sex'), age: $('#age'), height: $('#height'), weight: $('#weight') };
  const results = $('#results');
  const metrics = $('#metrics');
  const searchBox = $('#searchBox');
  const countLabel = $('#resultCount');
  const emptyState = $('#emptyState');
  const clearSearchBtn = $('#clearSearchBtn');
  const formError = $('#formError');
  const actionStatus = $('#actionStatus');
  let report = null;

  const fmt = (value, digits = 1) => Number(value).toFixed(digits);
  const range = (low, high, unit, digits = 1) => `${fmt(low, digits)}–${fmt(high, digits)} ${unit}`;

  function getPatient() {
    const patient = { sex: fields.sex.value, age: Number(fields.age.value), height: Number(fields.height.value), weight: Number(fields.weight.value) };
    const limits = { age: [18, 120, 'Age'], height: [120, 230, 'Height'], weight: [20, 350, 'Weight'] };
    for (const [key, [min, max, label]] of Object.entries(limits)) {
      if (!Number.isFinite(patient[key]) || patient[key] < min || patient[key] > max) throw new Error(`${label} must be between ${min} and ${max}.`);
    }
    return patient;
  }

  function calculateMetrics(patient) {
    const TBW = patient.weight;
    const BMI = TBW / ((patient.height / 100) ** 2);
    const IBW = patient.sex === 'male' ? 50 + 0.91 * (patient.height - 152.4) : 45.5 + 0.91 * (patient.height - 152.4);
    const LBW = patient.sex === 'male'
      ? 1.10 * TBW - 128 * ((TBW / patient.height) ** 2)
      : 1.07 * TBW - 148 * ((TBW / patient.height) ** 2);
    const FFM = patient.sex === 'male'
      ? (9270 * TBW) / (6680 + 216 * BMI)
      : (9270 * TBW) / (8780 + 244 * BMI);
    return { TBW, BMI, IBW, LBW, FFM };
  }

  function buildSections(patient, m) {
    const remiAgeFactor = patient.age >= 80 ? 0.3 : patient.age >= 65 ? 0.5 : 1;
    const row = (drug, doseRange, basis, calculated) => ({ drug, range: doseRange, basis, value: calculated });
    return [
      { title: 'Neuromuscular blockers', rows: [
        row('Succinylcholine (IV)', '0.7–1.5 mg/kg', 'TBW', range(0.7 * m.TBW, 1.5 * m.TBW, 'mg')),
        row('Succinylcholine (IM)', '2.5–4 mg/kg', 'TBW', range(2.5 * m.TBW, 4 * m.TBW, 'mg')),
        row('Rocuronium', '0.6–1.2 mg/kg', 'IBW', range(0.6 * m.IBW, 1.2 * m.IBW, 'mg')),
        row('Cisatracurium', '0.15–0.2 mg/kg', 'IBW', range(0.15 * m.IBW, 0.2 * m.IBW, 'mg')),
        row('Vecuronium', '0.08–0.1 mg/kg', 'IBW', range(0.08 * m.IBW, 0.1 * m.IBW, 'mg')),
        row('Pancuronium', '0.04–0.1 mg/kg', 'IBW', range(0.04 * m.IBW, 0.1 * m.IBW, 'mg'))
      ] },
      { title: 'Opioids', rows: [
        row('Fentanyl (induction)', '0.7–2 mcg/kg', 'LBW', range(0.7 * m.LBW, 2 * m.LBW, 'mcg')),
        row('Fentanyl (maintenance)', '0.3–3 mcg/kg/hr', 'LBW', range(0.3 * m.LBW, 3 * m.LBW, 'mcg/hr')),
        row('Remifentanil (induction)', '1 mcg/kg', 'LBW', `${fmt(m.LBW)} mcg`),
        row('Remifentanil (maintenance)', '0.25–0.4 mcg/kg/min', 'LBW, age adjusted', range(0.25 * m.LBW * remiAgeFactor, 0.4 * m.LBW * remiAgeFactor, 'mcg/min')),
        row('Sufentanil (induction)', '2–10 mcg/kg', 'LBW', range(2 * m.LBW, 10 * m.LBW, 'mcg')),
        row('Sufentanil (maintenance)', '0.1–0.5 mcg/kg/hr', 'LBW', range(0.1 * m.LBW, 0.5 * m.LBW, 'mcg/hr'))
      ] },
      { title: 'Anesthetics & sedatives', rows: [
        row('Propofol (induction)', '2–2.5 mg/kg', 'LBW', range(2 * m.LBW, 2.5 * m.LBW, 'mg')),
        row('Propofol (maintenance)', '20–150 mcg/kg/min', 'TBW', range(0.02 * m.TBW, 0.15 * m.TBW, 'mg/min', 2)),
        row('Ketamine (IV)', '1–2.5 mg/kg', 'TBW', range(m.TBW, 2.5 * m.TBW, 'mg')),
        row('Etomidate', '0.1–0.4 mg/kg', 'TBW', range(0.1 * m.TBW, 0.4 * m.TBW, 'mg')),
        row('Dexmedetomidine (loading)', '0.5–1 mcg/kg', 'IBW', range(0.5 * m.IBW, m.IBW, 'mcg')),
        row('Dexmedetomidine (maintenance)', '0.2–0.7 mcg/kg/hr', 'IBW', range(0.2 * m.IBW, 0.7 * m.IBW, 'mcg/hr'))
      ] },
      { title: 'Local anesthetics', rows: [
        row('Lidocaine (plain)', '5 mg/kg', 'TBW', `${fmt(5 * m.TBW)} mg`),
        row('Lidocaine (with epinephrine)', '7 mg/kg', 'TBW', `${fmt(7 * m.TBW)} mg`),
        row('Bupivacaine (plain)', '2.5 mg/kg', 'TBW', `${fmt(2.5 * m.TBW)} mg`),
        row('Bupivacaine (with epinephrine)', '3 mg/kg', 'TBW', `${fmt(3 * m.TBW)} mg`)
      ] },
      { title: 'Cardiovascular & hemodynamic agents', rows: [
        row('Esmolol (laryngoscopy/intubation response; off-label)', '0.5–1.5 mg/kg IV before induction/intubation; timing varies', 'TBW', range(0.5 * m.TBW, 1.5 * m.TBW, 'mg IV')),
        row('Esmolol (optional SVT loading dose)', '500 mcg/kg over 1 min', 'TBW', `${fmt(0.5 * m.TBW)} mg over 1 min`),
        row('Esmolol (SVT maintenance infusion)', '50–200 mcg/kg/min', 'TBW', range(50 * m.TBW, 200 * m.TBW, 'mcg/min', 0)),
        row('Phenylephrine (bolus)', 'Fixed dose', '—', '40–120 mcg'),
        row('Phenylephrine (infusion)', '0.15–4 mcg/kg/min', 'TBW', range(0.15 * m.TBW, 4 * m.TBW, 'mcg/min')),
        row('Ephedrine (bolus)', 'Fixed dose', '—', '5–10 mg'),
        row('Epinephrine (infusion)', '0.1–1 mcg/kg/min', 'TBW', range(0.1 * m.TBW, m.TBW, 'mcg/min')),
        row('Epinephrine (cardiac arrest)', 'Fixed dose', '—', '1 mg'),
        row('Dobutamine (infusion)', '2–20 mcg/kg/min', 'TBW', range(2 * m.TBW, 20 * m.TBW, 'mcg/min')),
        row('Dopamine (infusion)', '1–20 mcg/kg/min', 'TBW', range(m.TBW, 20 * m.TBW, 'mcg/min')),
        row('Milrinone (loading dose)', '50 mcg/kg', 'TBW', `${fmt(50 * m.TBW)} mcg over 20 min`),
        row('Milrinone (infusion)', '0.5 mcg/kg/min', 'TBW', `${fmt(0.5 * m.TBW)} mcg/min`),
        row('Vasopressin', 'Fixed dose', '—', '0.04 units/min')
      ] }
    ];
  }

  function makeMetric(label, value) {
    const item = document.createElement('div'); item.className = 'metric';
    const name = document.createElement('span'); name.textContent = label;
    const result = document.createElement('strong'); result.textContent = value;
    item.append(name, result); return item;
  }
  function renderMetrics(m) {
    metrics.replaceChildren(makeMetric('BMI', `${fmt(m.BMI)} kg/m²`), makeMetric('TBW', `${fmt(m.TBW)} kg`), makeMetric('IBW', `${fmt(m.IBW)} kg`), makeMetric('LBW', `${fmt(m.LBW)} kg`), makeMetric('FFM', `${fmt(m.FFM)} kg`));
  }

  function renderSections(sections) {
    const fragment = document.createDocumentFragment();
    sections.forEach((section) => {
      const wrapper = document.createElement('section'); wrapper.className = 'dose-section';
      const heading = document.createElement('h3'); heading.textContent = section.title;
      const scroll = document.createElement('div'); scroll.className = 'table-scroll';
      const table = document.createElement('table'); table.className = 'dose-table';
      table.innerHTML = '<thead><tr><th scope="col">Medication</th><th scope="col">Reference range</th><th scope="col">Basis</th><th scope="col">Calculated dose</th></tr></thead>';
      const body = document.createElement('tbody');
      section.rows.forEach((item) => {
        const tr = document.createElement('tr'); tr.dataset.search = `${section.title} ${item.drug} ${item.range} ${item.basis}`.toLowerCase();
        [item.drug, item.range, item.basis, item.value].forEach((value) => { const td = document.createElement('td'); td.textContent = value; tr.append(td); });
        body.append(tr);
      });
      table.append(body); scroll.append(table); wrapper.append(heading, scroll); fragment.append(wrapper);
    });
    results.replaceChildren(fragment);
  }

  function calculate() {
    try {
      const patient = getPatient();
      const patientMetrics = calculateMetrics(patient);
      const sections = buildSections(patient, patientMetrics);
      report = { patient, metrics: patientMetrics, sections };
      formError.textContent = '';
      [$('#copyBtn'), $('#csvBtn'), $('#printBtn')].forEach((button) => { button.disabled = false; });
      renderMetrics(patientMetrics); renderSections(sections); filterResults();
    } catch (error) {
      report = null;
      formError.textContent = error.message;
      metrics.replaceChildren();
      results.replaceChildren();
      countLabel.textContent = 'Enter valid patient values to calculate doses.';
      emptyState.hidden = true;
      [$('#copyBtn'), $('#csvBtn'), $('#printBtn')].forEach((button) => { button.disabled = true; });
    }
  }

  function filterResults() {
    const query = searchBox.value.trim().toLowerCase(); let visible = 0;
    document.querySelectorAll('.dose-section').forEach((section) => {
      let sectionVisible = 0;
      section.querySelectorAll('tbody tr').forEach((tr) => { const matches = !query || tr.dataset.search.includes(query); tr.hidden = !matches; if (matches) sectionVisible += 1; });
      section.hidden = sectionVisible === 0; visible += sectionVisible;
    });
    countLabel.textContent = `${visible} medication ${visible === 1 ? 'entry' : 'entries'}${query ? ` matching “${searchBox.value.trim()}”` : ''}`;
    emptyState.hidden = visible !== 0; clearSearchBtn.hidden = !query;
  }

  function reportText() {
    const { patient, metrics: m, sections } = report;
    const lines = ['Medication Dosing Report', `Patient: ${patient.sex}; age ${patient.age}; ${fmt(patient.height)} cm; ${fmt(patient.weight)} kg`, `Metrics: BMI ${fmt(m.BMI)} kg/m²; IBW ${fmt(m.IBW)} kg; LBW ${fmt(m.LBW)} kg; FFM ${fmt(m.FFM)} kg`, ''];
    sections.forEach((section) => { lines.push(section.title, 'Medication\tReference range\tBasis\tCalculated dose'); section.rows.forEach((item) => lines.push(`${item.drug}\t${item.range}\t${item.basis}\t${item.value}`)); lines.push(''); });
    lines.push('Reference ranges only—verify indication, patient factors, local policy, and product labeling.'); return lines.join('\n');
  }
  async function copyReport() {
    if (!report) return; const text = reportText();
    try { await navigator.clipboard.writeText(text); }
    catch { const textarea = document.createElement('textarea'); textarea.value = text; textarea.style.cssText = 'position:fixed;opacity:0'; document.body.append(textarea); textarea.select(); document.execCommand('copy'); textarea.remove(); }
    showStatus('Report copied.');
  }
  const csvCell = (value) => `"${String(value).replaceAll('"', '""')}"`;
  function downloadCsv() {
    if (!report) return;
    const rows = [['Category', 'Medication', 'Reference range', 'Basis', 'Calculated dose']];
    report.sections.forEach((section) => section.rows.forEach((item) => rows.push([section.title, item.drug, item.range, item.basis, item.value])));
    const url = URL.createObjectURL(new Blob([rows.map((row) => row.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'anesthesia-dosing-report.csv'; link.click(); URL.revokeObjectURL(url); showStatus('CSV downloaded.');
  }
  let statusTimer;
  function showStatus(message) { actionStatus.textContent = message; clearTimeout(statusTimer); statusTimer = setTimeout(() => { actionStatus.textContent = ''; }, 3000); }

  const themeBtn = $('#themeBtn'); const themeIcon = themeBtn.querySelector('span');
  function savedTheme() { const value = localStorage.getItem('theme'); return value === 'dark' || value === 'light' ? value : 'system'; }
  function applyTheme(theme) {
    if (theme === 'system') { document.documentElement.removeAttribute('data-theme'); document.documentElement.style.colorScheme = ''; }
    else { document.documentElement.setAttribute('data-theme', theme); document.documentElement.style.colorScheme = theme; }
    localStorage.setItem('theme', theme);
    const config = { system: ['🖥️', 'System'], dark: ['🌙', 'Dark'], light: ['☀️', 'Light'] }[theme];
    themeIcon.textContent = config[0]; themeBtn.title = `Theme: ${config[1]}. Click to change.`; themeBtn.setAttribute('aria-label', `Theme: ${config[1]}. Click to change theme.`);
  }

  form.addEventListener('submit', (event) => { event.preventDefault(); calculate(); });
  form.addEventListener('input', calculate); form.addEventListener('change', calculate); searchBox.addEventListener('input', filterResults);
  clearSearchBtn.addEventListener('click', () => { searchBox.value = ''; filterResults(); searchBox.focus(); });
  $('#resetBtn').addEventListener('click', () => { form.reset(); searchBox.value = ''; calculate(); });
  $('#copyBtn').addEventListener('click', copyReport); $('#csvBtn').addEventListener('click', downloadCsv); $('#printBtn').addEventListener('click', () => window.print());
  themeBtn.addEventListener('click', () => { const order = ['system', 'dark', 'light']; applyTheme(order[(order.indexOf(savedTheme()) + 1) % order.length]); });
  window.addEventListener('keydown', (event) => { if (event.key === '/' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) { event.preventDefault(); searchBox.focus(); } });
  applyTheme(savedTheme()); calculate();
})();

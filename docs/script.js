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
  let selectedCategory = 'all';

  const SOURCES = Object.freeze({
    obesity: { label: 'Weight basis', title: 'Peri-operative medication dosing in adults with obesity — systematic review', url: 'https://pubmed.ncbi.nlm.nih.gov/29855999/' },
    obesityGuidance: { label: 'Weight basis', title: 'Association of Anaesthetists — peri-operative management of the obese surgical patient', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5029585/' },
    succinylcholine: { label: 'Label', title: 'Succinylcholine chloride injection — U.S. prescribing information', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=7d0f0431-e616-49c2-80d8-0752a45428db' },
    rocuronium: { label: 'Label', title: 'Rocuronium bromide injection — U.S. prescribing information', url: 'https://www.dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=04c9812d-5aa3-4949-ad02-c618028f1bb0' },
    cisatracurium: { label: 'Label', title: 'Cisatracurium besylate injection — U.S. prescribing information', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=1c6a8b98-deac-4e25-b4a0-5d0af5090281' },
    vecuronium: { label: 'Label', title: 'Vecuronium bromide for injection — U.S. prescribing information', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=a3db901c-191c-472b-8bbc-5f12472c6d02' },
    pancuronium: { label: 'Label', title: 'Pancuronium bromide injection — U.S. prescribing information', url: 'https://labeling.pfizer.com/ShowLabeling.aspx?format=PDF&id=4562' },
    fentanylPractice: { label: 'Reference', title: 'Merck Manual — sedative and analgesic medications for induction of intubation', url: 'https://www.merckmanuals.com/professional/multimedia/table/sedative-and-analgesic-medications-for-induction-of-intubation' },
    fentanyl: { label: 'Label', title: 'Fentanyl citrate injection — U.S. prescribing information', url: 'https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=bfa8018a-4cbc-434b-e09e-782872b0340a' },
    remifentanil: { label: 'Label', title: 'Remifentanil hydrochloride injection — U.S. prescribing information', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=39284dec-b9bc-4fc8-b2d3-f1ef1323e5d4' },
    sufentanil: { label: 'Label', title: 'Sufentanil citrate injection — U.S. prescribing information', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=20293943-46ff-4345-1aa4-929b4e017a25' },
    propofol: { label: 'Label', title: 'Propofol injectable emulsion — U.S. prescribing information', url: 'https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=f23fe3c5-aa37-4ecc-ad76-f13c1a1dabe2&type=display' },
    ketamine: { label: 'Label', title: 'Ketamine hydrochloride injection — U.S. prescribing information', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=549d6ed3-3c9b-4ea2-8aaf-f61d43e04602' },
    etomidate: { label: 'Label', title: 'Etomidate injection — U.S. prescribing information', url: 'https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=9bdee875-4b48-c592-e053-2995a90a6485' },
    dexmedetomidine: { label: 'Label', title: 'Dexmedetomidine injection — U.S. prescribing information', url: 'https://www.dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=ebdfe2e8-30ca-4f18-935a-41bcbbce4937' },
    lidocaine: { label: 'Label', title: 'Lidocaine with and without epinephrine — U.S. prescribing information', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4dd52202-8eef-4136-92dd-ada573b7cf74' },
    bupivacaine: { label: 'Label', title: 'Marcaine with and without epinephrine — U.S. prescribing information', url: 'https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=93cf0914-de08-4ec6-8f8c-d663243b9958&type=display' },
    localAnesthetic: { label: 'Reference', title: 'University of Iowa — maximum recommended local-anesthetic doses', url: 'https://medicine.uiowa.edu/iowaprotocols/maximum-recommended-doses-and-duration-local-anesthetics' },
    esmolol: { label: 'Label', title: 'Esmolol hydrochloride injection — U.S. prescribing information', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4cfdfa50-579b-43e7-bc0a-e831d3099bfd' },
    esmolol05: { label: 'Study', title: 'Esmolol 0.5 mg/kg peri-induction study', url: 'https://pubmed.ncbi.nlm.nih.gov/35422539/' },
    esmolol15: { label: 'Study', title: 'Esmolol 1.5 mg/kg peri-induction study', url: 'https://pubmed.ncbi.nlm.nih.gov/31198248/' },
    phenylephrine: { label: 'Label', title: 'Phenylephrine hydrochloride injection — U.S. prescribing information', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=c2ba1b3e-94bc-494d-b0fe-4ab9dd61dddc' },
    ephedrine: { label: 'Label', title: 'Ephedrine sulfate injection — U.S. prescribing information', url: 'https://www.dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=5ecd9746-25c7-4bd4-9503-eb97e7db5aa5&type=display' },
    epinephrine: { label: 'Label', title: 'Epinephrine injection — U.S. prescribing information', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=ef556382-9d19-4f0e-9dbe-fcecc772a3e2' },
    aha: { label: 'AHA', title: 'American Heart Association 2025 adult advanced life support guideline', url: 'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-advanced-life-support' },
    dobutamine: { label: 'Label', title: 'Dobutamine injection — U.S. prescribing information', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=a0882db1-2532-4b80-b753-68f013fe79e7' },
    dopamine: { label: 'Label', title: 'Dopamine hydrochloride injection — U.S. prescribing information', url: 'https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=460906f7-b532-4ddb-a799-ad7b50488143' },
    milrinone: { label: 'Label', title: 'Milrinone lactate injection — U.S. prescribing information', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=fa8c2d27-bb10-4966-bd8e-193fd921ea17' },
    vasopressin: { label: 'Guideline', title: 'Surviving Sepsis Campaign 2021 guideline', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8486643/' }
  });

  const fmt = (value, digits = 1) => Number(value).toFixed(digits);
  const range = (low, high, unit, digits = 1) => `${fmt(low, digits)}–${fmt(high, digits)} ${unit}`;
  const capped = (value, maximum) => `${fmt(Math.min(value, maximum))} mg (maximum ${maximum} mg)`;
  const cappedRange = (low, high, maximum) => {
    const cappedLow = Math.min(low, maximum);
    const cappedHigh = Math.min(high, maximum);
    const dose = cappedLow === cappedHigh ? `${fmt(cappedHigh)} mg` : range(cappedLow, cappedHigh, 'mg');
    return `${dose} (maximum ${maximum} mg)`;
  };

  function getPatient() {
    const patient = { sex: fields.sex.value, age: Number(fields.age.value), height: Number(fields.height.value), weight: Number(fields.weight.value) };
    if (patient.sex !== 'male' && patient.sex !== 'female') throw new Error('Choose the formula sex used for weight calculations.');
    const limits = { age: [18, 120, 'Age'], height: [120, 230, 'Height'], weight: [20, 350, 'Weight'] };
    for (const [key, [min, max, label]] of Object.entries(limits)) {
      if (!Number.isFinite(patient[key]) || patient[key] < min || patient[key] > max) throw new Error(`${label} must be between ${min} and ${max}.`);
    }
    return patient;
  }

  function calculateMetrics(patient) {
    return window.AnesthesiaCalculations.bodyMetrics(patient);
  }

  function buildSections(patient, m) {
    const remiAgeFactor = patient.age > 65 ? 0.5 : 1;
    const remiUsesIBW = m.TBW > 1.3 * m.IBW;
    const remiDosingWeight = remiUsesIBW ? m.IBW : m.TBW;
    const remiBasis = `${remiUsesIBW ? 'IBW (label obesity threshold)' : 'TBW'}, age adjusted`;
    const row = (drug, doseRange, basis, calculated, sources) => ({ drug, range: doseRange, basis, value: calculated, sources });
    return [
      { title: 'Neuromuscular blockers', rows: [
        row('Succinylcholine (IV)', '0.3–1.1 mg/kg', 'TBW', range(0.3 * m.TBW, 1.1 * m.TBW, 'mg'), ['succinylcholine', 'obesity']),
        row('Succinylcholine (IM)', '3–4 mg/kg; max 150 mg', 'TBW', cappedRange(3 * m.TBW, 4 * m.TBW, 150), ['succinylcholine', 'obesity']),
        row('Rocuronium (intubation/RSI)', '0.6–1.2 mg/kg', 'IBW*', range(0.6 * m.IBW, 1.2 * m.IBW, 'mg'), ['rocuronium', 'obesity']),
        row('Cisatracurium (intubation)', '0.15–0.2 mg/kg', 'IBW*', range(0.15 * m.IBW, 0.2 * m.IBW, 'mg'), ['cisatracurium', 'obesity']),
        row('Vecuronium (initial)', '0.08–0.1 mg/kg', 'IBW*', range(0.08 * m.IBW, 0.1 * m.IBW, 'mg'), ['vecuronium', 'obesity']),
        row('Pancuronium (initial)', '0.04–0.1 mg/kg', 'IBW*', range(0.04 * m.IBW, 0.1 * m.IBW, 'mg'), ['pancuronium', 'obesity'])
      ] },
      { title: 'Opioids', rows: [
        row('Fentanyl (induction adjunct)', '0.5–2 mcg/kg', 'LBW*', range(0.5 * m.LBW, 2 * m.LBW, 'mcg'), ['fentanylPractice', 'obesityGuidance']),
        row('Fentanyl (general-anesthesia adjunct; total)', '2–20 mcg/kg', 'LBW*', range(2 * m.LBW, 20 * m.LBW, 'mcg'), ['fentanyl', 'obesityGuidance']),
        row('Remifentanil (optional loading dose)', '1 mcg/kg over 30–60 sec; reduce starting dose 50% if >65', remiBasis, `${fmt(remiDosingWeight * remiAgeFactor)} mcg`, ['remifentanil']),
        row('Remifentanil (typical initial maintenance)', '0.25–0.4 mcg/kg/min; reduce starting dose 50% if >65', remiBasis, range(0.25 * remiDosingWeight * remiAgeFactor, 0.4 * remiDosingWeight * remiAgeFactor, 'mcg/min'), ['remifentanil']),
        row('Sufentanil (GA analgesic adjunct; total)', '1–8 mcg/kg by case duration', 'LBW*', range(m.LBW, 8 * m.LBW, 'mcg'), ['sufentanil', 'obesityGuidance']),
        row('Sufentanil (maintenance ceiling)', '≤1 mcg/kg/hr of expected surgical time', 'LBW*', `≤${fmt(m.LBW)} mcg/hr`, ['sufentanil', 'obesityGuidance'])
      ] },
      { title: 'Anesthetics & sedatives', rows: [
        row('Propofol (induction, healthy adult <65)', '2–2.5 mg/kg', 'LBW*', range(2 * m.LBW, 2.5 * m.LBW, 'mg'), ['propofol', 'obesity']),
        row('Propofol (adult GA maintenance)', '50–200 mcg/kg/min; context dependent', 'TBW*', range(0.05 * m.TBW, 0.2 * m.TBW, 'mg/min', 2), ['propofol', 'obesity']),
        row('Ketamine (IV induction)', '1–2 mg/kg over 60 sec', 'TBW', range(m.TBW, 2 * m.TBW, 'mg'), ['ketamine']),
        row('Etomidate (induction)', '0.2–0.6 mg/kg; usual 0.3 mg/kg', 'TBW', range(0.2 * m.TBW, 0.6 * m.TBW, 'mg'), ['etomidate']),
        row('Dexmedetomidine (adult sedation loading)', '0.5–1 mcg/kg over 10 min; indication and age dependent', 'TBW', range(0.5 * m.TBW, m.TBW, 'mcg'), ['dexmedetomidine']),
        row('Dexmedetomidine (ICU maintenance)', '0.2–0.7 mcg/kg/hr', 'TBW', range(0.2 * m.TBW, 0.7 * m.TBW, 'mcg/hr'), ['dexmedetomidine'])
      ] },
      { title: 'Local anesthetics', rows: [
        row('Lidocaine (plain; maximum)', '4.5 mg/kg; max 300 mg', 'TBW', capped(4.5 * m.TBW, 300), ['lidocaine', 'localAnesthetic']),
        row('Lidocaine (with epinephrine; maximum)', '7 mg/kg; max 500 mg', 'TBW', capped(7 * m.TBW, 500), ['lidocaine', 'localAnesthetic']),
        row('Bupivacaine (plain infiltration; maximum)', '2–2.5 mg/kg; max 175 mg', 'TBW', capped(2.5 * m.TBW, 175), ['bupivacaine', 'localAnesthetic']),
        row('Bupivacaine (with epinephrine infiltration; maximum)', '2.5–3 mg/kg; max 225 mg', 'TBW', capped(3 * m.TBW, 225), ['bupivacaine', 'localAnesthetic'])
      ] },
      { title: 'Cardiovascular & hemodynamic agents', rows: [
        row('Esmolol (laryngoscopy/intubation response; off-label)', '0.5–1.5 mg/kg IV before induction/intubation; timing varies', 'TBW', range(0.5 * m.TBW, 1.5 * m.TBW, 'mg IV'), ['esmolol05', 'esmolol15']),
        row('Esmolol (optional SVT loading dose)', '500 mcg/kg over 1 min', 'TBW', `${fmt(0.5 * m.TBW)} mg over 1 min`, ['esmolol']),
        row('Esmolol (SVT maintenance infusion)', '50–200 mcg/kg/min', 'TBW', range(50 * m.TBW, 200 * m.TBW, 'mcg/min', 0), ['esmolol']),
        row('Phenylephrine (perioperative bolus)', 'Fixed dose', '—', '50–250 mcg', ['phenylephrine']),
        row('Phenylephrine (perioperative infusion)', '0.5–1.4 mcg/kg/min', 'TBW', range(0.5 * m.TBW, 1.4 * m.TBW, 'mcg/min'), ['phenylephrine']),
        row('Ephedrine (perioperative bolus)', 'Fixed dose; max cumulative 50 mg', '—', '5–10 mg', ['ephedrine']),
        row('Epinephrine (septic-shock infusion)', '0.05–2 mcg/kg/min', 'IBW', range(0.05 * m.IBW, 2 * m.IBW, 'mcg/min'), ['epinephrine']),
        row('Epinephrine (adult cardiac arrest)', '1 mg IV/IO every 3–5 min', '—', '1 mg', ['aha']),
        row('Dobutamine (infusion)', '2.5–15 mcg/kg/min; rarely up to 40', 'TBW', range(2.5 * m.TBW, 15 * m.TBW, 'mcg/min'), ['dobutamine']),
        row('Dopamine (infusion)', 'Start 2–5; titrate to max 50 mcg/kg/min', 'TBW', range(2 * m.TBW, 50 * m.TBW, 'mcg/min'), ['dopamine']),
        row('Milrinone (loading dose)', '50 mcg/kg over 10 min', 'TBW', `${fmt(50 * m.TBW)} mcg over 10 min`, ['milrinone']),
        row('Milrinone (infusion)', '0.375–0.75 mcg/kg/min', 'TBW', range(0.375 * m.TBW, 0.75 * m.TBW, 'mcg/min'), ['milrinone']),
        row('Vasopressin (septic-shock adjunct)', 'Usual fixed dose', '—', '0.03 units/min', ['vasopressin'])
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
    sections.forEach((section, index) => {
      const wrapper = document.createElement('details'); wrapper.className = 'dose-section'; wrapper.dataset.category = section.title.toLowerCase();
      wrapper.open = index === 0;
      const heading = document.createElement('summary'); heading.textContent = section.title;
      const scroll = document.createElement('div'); scroll.className = 'table-scroll';
      const table = document.createElement('table'); table.className = 'dose-table';
      table.innerHTML = '<thead><tr><th scope="col">Medication</th><th scope="col">Reference range</th><th scope="col">Basis</th><th scope="col">Calculated dose</th><th scope="col">Sources</th></tr></thead>';
      const body = document.createElement('tbody');
      section.rows.forEach((item) => {
        const tr = document.createElement('tr');
        const sourceTitles = item.sources.map((key) => SOURCES[key].title).join(' ');
        tr.dataset.search = `${section.title} ${item.drug} ${item.range} ${item.basis} ${sourceTitles}`.toLowerCase();
        [item.drug, item.range, item.basis, item.value].forEach((value) => { const td = document.createElement('td'); td.textContent = value; tr.append(td); });
        const sourceCell = document.createElement('td'); sourceCell.className = 'source-links';
        const sourceList = document.createElement('div');
        item.sources.forEach((key) => {
          const source = SOURCES[key];
          const link = document.createElement('a');
          link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
          link.textContent = source.label; link.title = source.title;
          link.setAttribute('aria-label', source.title);
          sourceList.append(link);
        });
        sourceCell.append(sourceList);
        tr.append(sourceCell);
        body.append(tr);
      });
      table.append(body); scroll.append(table); wrapper.append(heading, scroll); fragment.append(wrapper);
    });
    results.replaceChildren(fragment);
  }

  function calculate(silent = false) {
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
      formError.textContent = silent ? '' : error.message;
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
      const categoryMatches = selectedCategory === 'all' || section.dataset.category === selectedCategory;
      section.hidden = sectionVisible === 0 || !categoryMatches;
      if (categoryMatches) visible += sectionVisible;
      if ((query || selectedCategory !== 'all') && categoryMatches && sectionVisible) section.open = true;
    });
    countLabel.textContent = `${visible} medication ${visible === 1 ? 'entry' : 'entries'}${query ? ` matching “${searchBox.value.trim()}”` : ''}`;
    emptyState.hidden = visible !== 0; clearSearchBtn.hidden = !query;
  }

  function reportText() {
    const { patient, metrics: m, sections } = report;
    const lines = ['Medication Dosing Report', `Patient: ${patient.sex}; age ${patient.age}; ${fmt(patient.height)} cm; ${fmt(patient.weight)} kg`, `Metrics: BMI ${fmt(m.BMI)} kg/m²; IBW ${fmt(m.IBW)} kg; LBW ${fmt(m.LBW)} kg; FFM ${fmt(m.FFM)} kg`, ''];
    sections.forEach((section) => {
      lines.push(section.title, 'Medication\tReference range\tBasis\tCalculated dose\tSources');
      section.rows.forEach((item) => lines.push(`${item.drug}\t${item.range}\t${item.basis}\t${item.value}\t${item.sources.map((key) => SOURCES[key].url).join(' ')}`));
      lines.push('');
    });
    lines.push('* Weight scalar reflects obesity-focused guidance and may differ from product labeling.');
    lines.push('Reference ranges only—verify indication, patient factors, local policy, and current product labeling.'); return lines.join('\n');
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
    const rows = [['Category', 'Medication', 'Reference range', 'Basis', 'Calculated dose', 'Sources']];
    report.sections.forEach((section) => section.rows.forEach((item) => rows.push([section.title, item.drug, item.range, item.basis, item.value, item.sources.map((key) => SOURCES[key].url).join(' ')])));
    const url = URL.createObjectURL(new Blob([rows.map((row) => row.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'anesthesia-dosing-report.csv'; link.click(); URL.revokeObjectURL(url); showStatus('CSV downloaded.');
  }
  let statusTimer;
  function showStatus(message) { actionStatus.textContent = message; clearTimeout(statusTimer); statusTimer = setTimeout(() => { actionStatus.textContent = ''; }, 3000); }

  form.addEventListener('submit', (event) => { event.preventDefault(); calculate(); });
  form.addEventListener('input', () => calculate(true));
  form.addEventListener('change', () => calculate(true));
  searchBox.addEventListener('input', filterResults);
  document.querySelectorAll('.category-chip').forEach((button) => {
    button.addEventListener('click', () => {
      selectedCategory = button.dataset.category;
      document.querySelectorAll('.category-chip').forEach((chip) => {
        const active = chip === button;
        chip.classList.toggle('active', active);
        chip.setAttribute('aria-pressed', String(active));
      });
      filterResults();
    });
  });
  clearSearchBtn.addEventListener('click', () => { searchBox.value = ''; filterResults(); searchBox.focus(); });
  $('#resetBtn').addEventListener('click', () => {
    form.reset(); searchBox.value = ''; selectedCategory = 'all';
    document.querySelectorAll('.category-chip').forEach((chip) => {
      const active = chip.dataset.category === 'all';
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
    calculate(true);
  });
  $('#copyBtn').addEventListener('click', copyReport); $('#csvBtn').addEventListener('click', downloadCsv); $('#printBtn').addEventListener('click', () => window.print());
  window.addEventListener('keydown', (event) => { if (event.key === '/' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) { event.preventDefault(); searchBox.focus(); } });
  calculate(true);
})();

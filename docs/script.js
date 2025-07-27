function calculate() {
  const sex = document.getElementById("sex").value;
  const age = parseFloat(document.getElementById("age").value);
  const height = parseFloat(document.getElementById("height").value);
  const weight = parseFloat(document.getElementById("weight").value);

  if (isNaN(height) || isNaN(weight) || isNaN(age)) {
    document.getElementById("output").textContent = "Please enter valid numbers for age, height, and weight.";
    return;
  }

  const height_m = height / 100;
  const TBW = weight;
  const BMI = TBW / (height_m ** 2);
  const IBW = sex === "male"
    ? 50 + 0.91 * (height - 152.4)
    : 45.5 + 0.91 * (height - 152.4);
  const LBW = sex === "male"
    ? (1.10 * TBW) - 128 * (TBW / height) * (TBW / height)
    : (1.07 * TBW) - 148 * (TBW / height) * (TBW / height);
  const FFM = sex === "male"
    ? (9270 * TBW) / (6680 + 216 * BMI)
    : (9270 * TBW) / (8780 + 244 * BMI);
  const ageFactorRemi = age >= 80 ? 0.3 : age >= 65 ? 0.5 : age < 1 ? 1.5 : 1;

  // Clear previous results
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";
  let exportText = `Patient: ${sex}, Age ${age}, Height ${height} cm, Weight ${weight} kg\n\n`;

  function createSection(title, contentHTML, textBlock) {
    const section = document.createElement("div");
    section.className = "accordion-section";
    const header = document.createElement("div");
    header.className = "accordion-header";
    header.innerHTML = `${title} <span>+</span>`;
    section.appendChild(header);

    const content = document.createElement("div");
    content.className = "accordion-content";
    content.innerHTML = contentHTML;
    section.appendChild(content);

    header.addEventListener("click", () => {
      content.classList.toggle("open");
      header.querySelector("span").textContent = content.classList.contains("open") ? "−" : "+";
    });

    resultsDiv.appendChild(section);
    exportText += `\n${title}\n${textBlock}\n`;
  }

  // Patient Metrics
  createSection(
    "Patient Metrics",
    `
      <p><strong>BMI:</strong> ${BMI.toFixed(1)}</p>
      <p><strong>IBW:</strong> ${IBW.toFixed(1)} kg</p>
      <p><strong>LBW:</strong> ${LBW.toFixed(1)} kg</p>
      <p><strong>FFM:</strong> ${FFM.toFixed(1)} kg</p>
    `,
    `BMI: ${BMI.toFixed(1)}, IBW: ${IBW.toFixed(1)}, LBW: ${LBW.toFixed(1)}, FFM: ${FFM.toFixed(1)}`
  );

  // Muscle Relaxants
  createSection(
    "Muscle Relaxants",
    `
      <p>Succinylcholine (1 mg/kg TBW): <strong>${TBW.toFixed(1)} mg</strong></p>
      <p>Rocuronium (0.6–1.2 mg/kg LBW): <strong>${(LBW * 0.6).toFixed(1)} – ${(LBW * 1.2).toFixed(1)} mg</strong></p>
      <p>Cisatracurium (0.15 mg/kg LBW): <strong>${(LBW * 0.15).toFixed(1)} mg</strong></p>
    `,
    `Succinylcholine: ${TBW.toFixed(1)} mg | Rocuronium: ${(LBW * 0.6).toFixed(1)}–${(LBW * 1.2).toFixed(1)} mg | Cisatracurium: ${(LBW * 0.15).toFixed(1)} mg`
  );

  // Opioids
  createSection(
    "Opioids",
    `
      <p>Fentanyl Induction (2 mcg/kg TBW): <strong>${(TBW * 2).toFixed(1)} mcg</strong></p>
      <p>Fentanyl Maintenance (1 mcg/kg IBW): <strong>${(IBW * 1).toFixed(1)} mcg</strong></p>
      <p>Remifentanil (LBW, age-adjusted): <strong>${(LBW * 0.1 * ageFactorRemi).toFixed(1)} mcg/min</strong></p>
      ${BMI > 39 ? `<p>Remifentanil (FFM, BMI > 39): <strong>${(FFM * 0.1 * ageFactorRemi).toFixed(1)} mcg/min</strong></p>` : ""}
    `,
    `Fentanyl: ${TBW.toFixed(1)} mcg induction, ${IBW.toFixed(1)} mcg maintenance | Remifentanil: ${(LBW * 0.1 * ageFactorRemi).toFixed(1)} mcg/min`
  );

  // Anesthetics
  createSection(
    "Anesthetics",
    `
      <p>Propofol Induction (2 mg/kg LBW): <strong>${(LBW * 2).toFixed(1)} mg</strong></p>
      <p>Propofol Maintenance (100 mcg/kg/min TBW): <strong>${(TBW * 100).toFixed(1)} mcg/min</strong></p>
      <p>Ketamine IV Induction (1.5 mg/kg TBW): <strong>${(TBW * 1.5).toFixed(1)} mg</strong></p>
      <p>Ketamine Subanesthetic (0.35 mg/kg TBW): <strong>${(TBW * 0.35).toFixed(1)} mg</strong></p>
    `,
    `Propofol: ${(LBW * 2).toFixed(1)} mg induction, ${(TBW * 100).toFixed(1)} mcg/min maintenance | Ketamine: ${(TBW * 1.5).toFixed(1)} mg`
  );

  // Local Anesthetics
  createSection(
    "Local Anesthetics",
    `
      <p>Lidocaine Plain Max (4 mg/kg, max 300 mg): <strong>${Math.min(TBW * 4, 300).toFixed(1)} mg</strong></p>
      <p>Lidocaine with Epi Max (7 mg/kg, max 500 mg): <strong>${Math.min(TBW * 7, 500).toFixed(1)} mg</strong></p>
      <p>Bupivacaine Plain Max (2 mg/kg, max 175 mg): <strong>${Math.min(TBW * 2, 175).toFixed(1)} mg</strong></p>
      <p>Bupivacaine with Epi Max (3 mg/kg, max 225 mg): <strong>${Math.min(TBW * 3, 225).toFixed(1)} mg</strong></p>
    `,
    `Lidocaine: ${Math.min(TBW * 4, 300).toFixed(1)} mg plain, ${Math.min(TBW * 7, 500).toFixed(1)} mg with epi | Bupivacaine: ${Math.min(TBW * 2, 175).toFixed(1)} mg plain, ${Math.min(TBW * 3, 225).toFixed(1)} mg with epi`
  );

  // Vasopressors
  createSection(
    "Vasopressors",
    `<p>Epinephrine Max (0.07 mg/kg): <strong>${(TBW * 0.07).toFixed(2)} mg</strong></p>`,
    `Epinephrine: ${(TBW * 0.07).toFixed(2)} mg`
  );

  window.exportTextCache = exportText;
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  if (document.body.classList.contains("dark")) {
    localStorage.setItem("theme", "dark");
  } else {
    localStorage.setItem("theme", "light");
  }
}

function copyToClipboard() {
  if (!window.exportTextCache || !window.exportTextCache.trim()) {
    alert("No results to copy. Please calculate first.");
    return;
  }
  navigator.clipboard.writeText(window.exportTextCache)
    .then(() => alert("Copied to clipboard!"));
}

function exportToCSV() {
  if (!window.exportTextCache) return alert("No results to export.");
  const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(window.exportTextCache.replace(/\n/g, "\r\n"));
  const link = document.createElement("a");
  link.href = csvContent;
  link.download = "dosing-results.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToPDF() {
  if (!window.exportTextCache) return alert("No results to export.");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'letter' });
  const margin = 40, pageHeight = doc.internal.pageSize.getHeight(), lineHeight = 14;
  const splitText = doc.splitTextToSize(window.exportTextCache, doc.internal.pageSize.getWidth() - margin * 2);
  let cursorY = margin;
  splitText.forEach(line => {
    if (cursorY + lineHeight > pageHeight - margin) { doc.addPage(); cursorY = margin; }
    doc.text(line, margin, cursorY);
    cursorY += lineHeight;
  });
  doc.save("dosing-results.pdf");
}

// Apply saved theme on load
window.onload = function() {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    document.getElementById("darkToggle").checked = true;
  }
};
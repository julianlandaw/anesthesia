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

  function makeTable(title, rows) {
      // Create HTML Table
      let html = `<h2>${title}</h2><table class="dose-table"><thead><tr>
        <th>Drug</th><th>Dose Range</th><th>Basis</th><th>Calculated</th></tr></thead><tbody>`;
      rows.forEach(row => {
        html += `<tr><td>${row.drug}</td><td>${row.range}</td><td>${row.basis}</td><td>${row.value}</td></tr>`;
      });
      html += "</tbody></table>";
      resultsDiv.innerHTML += html;
    
      // Push data for export
      window.exportDataCache.push({ title, rows });
    }

    window.exportDataCache = [];

  // Patient Metrics
  makeTable("Patient Metrics", [
    { drug: "BMI", range: "-", basis: "-", value: `${BMI.toFixed(1)} kg/m²` },
    { drug: "IBW", range: "-", basis: "-", value: `${IBW.toFixed(1)} kg` },
    { drug: "LBW", range: "-", basis: "-", value: `${LBW.toFixed(1)} kg` },
    { drug: "FFM", range: "-", basis: "-", value: `${FFM.toFixed(1)} kg` }
  ]);

  // Muscle Relaxants
  makeTable("Muscle Relaxants", [
    { drug: "Succinylcholine (IV)", range: "0.7–1.5 mg/kg", basis: "TBW", value: `${(0.7 * TBW).toFixed(1)}–${(TBW * 1.5).toFixed(1)} mg` },
    { drug: "Succinylcholine (IM)", range: "2.5–4 mg/kg", basis: "TBW", value: `${(2.5 * TBW).toFixed(1)}–${(4 * TBW).toFixed(1)} mg` },
    { drug: "Rocuronium", range: "0.6–1.2 mg/kg", basis: "IBW", value: `${(0.6 * IBW).toFixed(1)}–${(1.2 * IBW).toFixed(1)} mg` },
    { drug: "Cisatracurium", range: "0.15–0.2 mg/kg", basis: "IBW", value: `${(IBW * 0.15).toFixed(1)}–${(IBW * 0.2).toFixed(1)} mg` },
    { drug: "Vecuronium", range: "0.08–0.1 mg/kg", basis: "IBW", value: `${(IBW * 0.08).toFixed(1)}–${(IBW * 0.1).toFixed(1)} mg` },
    { drug: "Pancuronium", range: "0.04–0.1 mg/kg", basis: "IBW", value: `${(IBW * 0.04).toFixed(1)}–${(IBW * 0.1).toFixed(1)} mg` }
  ]);

  // Opioids
  makeTable("Opioids", [
    { drug: "Fentanyl (Induction)", range: "0.7–2 mcg/kg", basis: "LBW", value: `${(LBW * 0.7).toFixed(1)}–${(LBW * 2).toFixed(1)} mcg` },
    { drug: "Fentanyl (Maintenance)", range: "0.3–3 mcg/kg/hr", basis: "LBW", value: `${(LBW * 0.3).toFixed(1)}–${(LBW * 3).toFixed(1)} mcg/hr` },
    { drug: "Remifentanil (Induction)", range: "1 mcg/kg", basis: "LBW", value: `${(LBW).toFixed(1)} mcg` },
    { drug: "Remifentanil (Maintenance)", range: "0.25–0.4 mcg/kg/min", basis: "LBW (age adj)", value: `${(LBW * 0.25 * ageFactorRemi).toFixed(1)}–${(LBW * 0.4 * ageFactorRemi).toFixed(1)} mcg/min` },
    { drug: "Sufentanil (Induction)", range: "2–10 mcg/kg", basis: "LBW", value: `${(LBW * 2).toFixed(1)}–${(LBW * 10).toFixed(1)} mcg` },
    { drug: "Sufentanil (Maintenance)", range: "0.1–0.5 mcg/kg/hr", basis: "LBW", value: `${(LBW * 0.1).toFixed(1)}–${(LBW * 0.5).toFixed(1)} mcg/hr` }
  ]);

  // Anesthetics
  makeTable("Anesthetics", [
    { drug: "Propofol (Induction)", range: "2–2.5 mg/kg", basis: "LBW", value: `${(LBW * 2).toFixed(1)}–${(LBW * 2.5).toFixed(1)} mg` },
    { drug: "Propofol (Maintenance)", range: "20–150 mcg/kg/min", basis: "TBW", value: `${(TBW / 1000 * 20).toFixed(2)}–${(TBW / 1000 * 150).toFixed(2)} mg/min` },
    { drug: "Ketamine (IV)", range: "1–2.5 mg/kg", basis: "TBW", value: `${TBW.toFixed(1)}–${(TBW * 2.5).toFixed(1)} mg` },
    { drug: "Etomidate", range: "0.1–0.4 mg/kg", basis: "TBW", value: `${(TBW * 0.1).toFixed(1)}–${(TBW * 0.4).toFixed(1)} mg` },
    { drug: "Dexmedetomidine (Induction)", range: "0.5–1 mcg/kg", basis: "IBW", value: `${(IBW * 0.5).toFixed(1)}–${(IBW).toFixed(1)} mcg` },
    { drug: "Dexmedetomidine (Maintenance)", range: "0.2–0.7 mcg/kg/hr", basis: "IBW", value: `${(IBW * 0.2).toFixed(1)}–${(IBW * 0.7).toFixed(1)} mcg/hr` }
  ]);

  // Local Anesthetics
  makeTable("Local Anesthetics", [
    { drug: "Lidocaine (Plain)", range: "5 mg/kg", basis: "TBW", value: `${(TBW * 5).toFixed(1)} mg` },
    { drug: "Lidocaine (Epi)", range: "7 mg/kg", basis: "TBW", value: `${(TBW * 7).toFixed(1)} mg` },
    { drug: "Bupivacaine (Plain)", range: "2.5 mg/kg", basis: "TBW", value: `${(TBW * 2.5).toFixed(1)} mg` },
    { drug: "Bupivacaine (Epi)", range: "3 mg/kg", basis: "TBW", value: `${(TBW * 3).toFixed(1)} mg` }
  ]);

  // Vasopressors
  makeTable("Vasopressors", [
    { drug: "Phenylephrine (Bolus)", range: "--", basis: "--", value: "40-120 mcg" },
    { drug: "Phenylephrine (Infusion)", range: "0.15-4 mcg/kg/min", basis: "TBW", value: `${(TBW * 0.15).toFixed(1)}-${(TBW * 0.4).toFixed(1)} mcg/min` },
    { drug: "Ephedrine (Bolus)", range: "--", basis: "--", value: "5-10 mg" },
    { drug: "Epinephrine (Infusion)", range: "0.1-1 mcg/kg/min", basis: "TBW", value: `${(TBW * 0.1).toFixed(1)}-${(TBW).toFixed(1)} mcg/min` },
    { drug: "Epinephrine (Bolus, Arrest)", range: "--", basis: "--", value: "1 mg" },
    { drug: "Dobutamine (Infusion)", range: "2-20 mcg/kg/min", basis: "TBW", value: `${(TBW * 2).toFixed(1)}-${(TBW * 20).toFixed(1)} mcg/min` },
    { drug: "Dopamine (Infusion)", range: "1-20 mcg/kg/min", basis: "TBW", value: `${(TBW).toFixed(1)}-${(TBW * 20).toFixed(1)} mcg/min` },
    { drug: "Milrinone (Load)", range: "50 mcg/kg", basis: "TBW", value: `${(TBW * 50).toFixed(1)} mcg over 20 min` },
    { drug: "Milrinone (Infusion)", range: "0.5 mcg/kg/min", basis: "TBW", value: `${(TBW * 0.5).toFixed(1)} mcg/min` },
    { drug: "Vasopressin", range: "--", basis: "--", value: "0.04 units/min fixed" },
  ]);

  window.exportTextCache = exportText;
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  if (document.body.classList.contains("dark")) {
    localStorage.setItem("theme", "dark");
  } else {
    localStorage.setItem("theme", "light");
  }
}

// Apply saved theme on load
window.onload = function() {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    document.getElementById("darkToggle").checked = true;
  }
};

function copyToClipboard() {
  if (!window.exportDataCache) {
    alert("No results to copy. Please calculate first.");
    return;
  }

  let textOutput = "Medication Dosing Report\n\n";

  window.exportDataCache.forEach(section => {
    textOutput += section.title + "\n";
    textOutput += "Drug\tDose Range\tBasis\tCalculated\n"; // Tab-separated
    section.rows.forEach(row => {
      textOutput += `${row.drug}\t${row.range}\t${row.basis}\t${row.value}\n`;
    });
    textOutput += "\n";
  });

  navigator.clipboard.writeText(textOutput)
    .then(() => alert("Report copied to clipboard!"))
    .catch(err => alert("Failed to copy: " + err));
}

function exportToCSV() {
  if (!window.exportDataCache) {
    alert("No results to export. Please calculate first.");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Category,Drug,Dose Range,Basis,Calculated\n";

  window.exportDataCache.forEach(section => {
    section.rows.forEach(row => {
      csvContent += `${section.title},${row.drug},${row.range},${row.basis},${row.value}\n`;
    });
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "dosing-report.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToPDF() {
  if (!window.exportDataCache) {
    alert("No results to export. Please calculate first.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Medication Dosing Report", 14, 20);

  window.exportDataCache.forEach(section => {
    doc.setFontSize(12);
    doc.text(section.title, 14, doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 30);
    doc.autoTable({
      head: [["Drug", "Dose Range", "Basis", "Calculated"]],
      body: section.rows.map(row => [row.drug, row.range, row.basis, row.value]),
      startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 35,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 86, 179] } // blue header
    });
  });

  doc.save("dosing-report.pdf");
}

function filterResults() {
  const query = document.getElementById("searchBox").value.toLowerCase();
  const tables = document.querySelectorAll("#results table");

  tables.forEach(table => {
    let visibleRows = 0;
    const rows = table.querySelectorAll("tbody tr");

    rows.forEach(row => {
      const text = row.innerText.toLowerCase();
      if (text.includes(query)) {
        row.style.display = "";
        visibleRows++;
      } else {
        row.style.display = "none";
      }
    });

    // Hide entire table if no rows match
    const title = table.previousElementSibling; // The <h2> before the table
    if (visibleRows === 0) {
      table.style.display = "none";
      if (title) title.style.display = "none";
    } else {
      table.style.display = "";
      if (title) title.style.display = "";
    }
  });
}

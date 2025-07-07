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
    ? (1.10 * TBW) - 128 * (TBW / (height ** 2))
    : (1.07 * TBW) - 148 * (TBW / (height ** 2));
  const FFM = sex === "male"
    ? (9270 * TBW) / (668 + 216 * BMI)
    : (9270 * TBW) / (878 + 244 * BMI);
  const ageFactorRemi = age >= 80 ? 0.3 : age >= 65 ? 0.5 : age < 1 ? 1.5 : 1;

  const output = `
--- Patient Metrics ---
Sex: ${sex}
Age: ${age} years
Height: ${height.toFixed(1)} cm (${(height / 100).toFixed(2)} m)
Weight (TBW): ${TBW.toFixed(1)} kg
BMI: ${BMI.toFixed(1)}
IBW: ${IBW.toFixed(1)} kg
LBW: ${LBW.toFixed(1)} kg
FFM: ${FFM.toFixed(1)} kg

--- Medication Dosing ---
Succinylcholine (1 mg/kg TBW): ${TBW.toFixed(1)} mg
Rocuronium (0.6 mg/kg LBW): ${(LBW * 0.6).toFixed(1)} mg
Cisatracurium (0.15 mg/kg LBW): ${(LBW * 0.15).toFixed(1)} mg

Fentanyl Induction (2 mcg/kg TBW): ${(TBW * 2.0).toFixed(1)} mcg
Fentanyl Maintenance (1 mcg/kg IBW): ${(IBW * 1.0).toFixed(1)} mcg

Remifentanil (LBW, age-adjusted): ${(LBW * 0.1 * ageFactorRemi).toFixed(1)} mcg/min
${BMI > 39 ? `Remifentanil (FFM, BMI > 39): ${(FFM * 0.1 * ageFactorRemi).toFixed(1)} mcg/min\n` : ""}
Propofol Induction (2 mg/kg LBW, adj): ${(LBW * 2.0 * (age > 65 ? 0.75 : 1.0)).toFixed(1)} mg
Propofol Maintenance (100 mcg/kg/min TBW, adj): ${(TBW * 100 * (age > 65 ? 0.75 : 1.0)).toFixed(1)} mcg/min

Lidocaine Max (Plain): ${Math.min(TBW * 4.0, 300).toFixed(1)} mg
Lidocaine Max (With Epi): ${Math.min(TBW * 7.0, 500).toFixed(1)} mg

Bupivacaine Max (Plain): ${Math.min(TBW * 2.0, 175).toFixed(1)} mg
Bupivacaine Max (With Epi): ${Math.min(TBW * 3.0, 225).toFixed(1)} mg

Epinephrine Max (0.07 mg/kg): ${(TBW * 0.07).toFixed(2)} mg

Ketamine IV (1.5 mg/kg, adj): ${(TBW * 1.5 * (age > 65 ? 0.75 : 1.0)).toFixed(1)} mg
Ketamine Subanesthetic (0.35 mg/kg, adj): ${(TBW * 0.35 * (age > 65 ? 0.75 : 1.0)).toFixed(1)} mg
`;

  document.getElementById("output").textContent = output;
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
}
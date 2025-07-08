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

-- Muscle Relaxants --
Succinylcholine IV (0.7-1 mg/kg TBW): 
                    ${(0.7 * TBW).toFixed(1)}-${TBW.toFixed(1)} mg  
                IM (2.5-4 mg/kg TBW): 
                    ${(2.5 * TBW).toFixed(1)}-${(4 * TBW).toFixed(1)} mg
Rocuronium    Intubating (0.6-1.2 mg/kg LBW): 
               ${(LBW * 0.6).toFixed(1)}-${(LBW * 1.2).toFixed(1)} mg
              Maintenance (0.06-0.6 mg/kg LBW): 
               ${(LBW * 0.06).toFixed(1)}-${(LBW * 0.6).toFixed(1)} mg
Cisatracurium Intubating (0.15-0.2 mg/kg LBW): 
               ${(LBW * 0.15).toFixed(1)}-${(LBW * 0.2).toFixed(1)} mg
              Maintenance (0.02-0.1 mg/kg LBW): 
               ${(LBW * 0.02).toFixed(1)}-${(LBW * 0.1).toFixed(1)} mg
Vecuronium    Intubating (0.08-0.1 mg/kg LBW): 
               ${(LBW * 0.08).toFixed(1)}-${(LBW * 0.1).toFixed(1)} mg
              Maintenance (0.01-0.05 mg/kg LBW): 
               ${(LBW * 0.01).toFixed(1)}-${(LBW * 0.05).toFixed(1)} mg

-- Analgesics/Narcotics -- 
Fentanyl Induction (0.7-2 mcg/kg TBW): ${(TBW * 0.7).toFixed(1)}-${(TBW * 2.0).toFixed(1)} mcg
         Maintenance (1 mcg/kg IBW): ${(IBW * 1.0).toFixed(1)} mcg
         Infusion (0.3-3 mcg/kg/hr IBW): ${(IBW * 0.3).toFixed(1)}-${(IBW * 3.0).toFixed(1)} mcg/hr

Remifentanil (LBW, age-adjusted): ${(LBW * 0.1 * ageFactorRemi).toFixed(1)} mcg/min
${BMI > 39 ? `Remifentanil (FFM, BMI > 39): ${(FFM * 0.1 * ageFactorRemi).toFixed(1)} mcg/min\n` : ""}

-- Anesthetics/Sedatives --
Propofol Induction (2 mg/kg LBW, adj): ${(LBW * 2.0 * (age > 65 ? 0.75 : 1.0)).toFixed(1)} mg
Propofol Maintenance (100 mcg/kg/min TBW, adj): ${(TBW * 100 * (age > 65 ? 0.75 : 1.0)).toFixed(1)} mcg/min
Ketamine IV (1.5 mg/kg, adj): ${(TBW * 1.5 * (age > 65 ? 0.75 : 1.0)).toFixed(1)} mg
Ketamine Subanesthetic (0.35 mg/kg, adj): ${(TBW * 0.35 * (age > 65 ? 0.75 : 1.0)).toFixed(1)} mg

-- Local Anesthetics -- 
Lidocaine Max (Plain, 5 mg/kg LBW up to 300): ${Math.min(LBW * 5.0, 300).toFixed(1)} mg
          Max (With Epi, 7 mg/kg LBW up to 500): ${Math.min(LBW * 7.0, 500).toFixed(1)} mg
          Tumescent (With Epi, 55-65 mg/kg LBW): ${(LBW * 55).toFixed(1)}-${(LBW * 65).toFixed(1)} mg
Bupivacaine Max (Plain, 2.5 mg/kg LBW): ${(LBW * 2.5).toFixed(1)} mg
Bupivacaine Max (With Epi, 3 mg/kg LBW: ${(LBW * 3).toFixed(1)} mg
Mepivacaine Max (Plain, 5 mg/kg LBW): ${(LBW * 5).toFixed(1)} mg
Mepivacaine Max (With Epi, 7 mg/kg LBW: ${(LBW * 7).toFixed(1)} mg
Ropivacaine Max (Plain, 3 mg/kg LBW): ${(LBW * 3).toFixed(1)} mg
Ropivacaine Max (With Epi, 3.5 mg/kg LBW: ${(LBW * 3.5).toFixed(1)} mg

-- Vasopressors and Inotropes -- 
Phenylephrine Infusion (0.15-4 mcg/kg/min LBW): ${(0.15 * LBW).toFixed(1)}-${(4 * LBW).toFixed(1)} mcg/min
              Push: 40-120 mcg 
Ephedrine Push: 5-10 mg
Norepinephrine Infusion (0.04-0.4 mcg/kg/min LBW): ${(0.04 * LBW).toFixed(1)}-${(0.4 * LBW).toFixed(1)} mcg/min
Epinephrine Infusion (0.1-1 mcg/kg/min LBW): ${(0.1 * LBW).toFixed(1)}-${(1.0 * LBW).toFixed(1)} mcg/min
            Push (Cardiac Arrest): 1 mg (< 1 mg if from LAST)
            Max (0.07 mg/kg): ${(LBW * 0.07).toFixed(2)} mg
Dobutamine Infusion (2-20 mcg/kg/min LBW): ${(2 * LBW).toFixed(1)}-${(20 * LBW).toFixed(1)} mcg/min
Dopamine Infusion (1-20 mcg/kg/min LBW): ${(1 * LBW).toFixed(1)}-${(20 * LBW).toFixed(1)} mcg/min
Milrinone Bolus (50 mcg/kg LBW): ${(50 * LBW / 1000).toFixed(1)} mg over 20 min
          Infusion (0.5 mcg/kg/min LBW): ${(0.5 * LBW).toFixed(1)} mcg/min
Vasopressin Infusion: 0.04 units/min fixed rate
`;

  document.getElementById("output").textContent = output;
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
}
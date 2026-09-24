const test = require('node:test');
const assert = require('node:assert/strict');
const calc = require('../docs/calculations.js');

const closeTo = (actual, expected, tolerance = 0.01) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} was not within ${tolerance} of ${expected}`);
};

test('body metrics reproduce standard male and female reference cases', () => {
  const male = calc.bodyMetrics({ sex: 'male', height: 175, weight: 80 });
  closeTo(male.BMI, 26.1224);
  closeTo(male.IBW, 70.4646);
  closeTo(male.LBW, 60.1828);
  closeTo(male.FFM, 60.1828);

  const female = calc.bodyMetrics({ sex: 'female', height: 160, weight: 60 });
  closeTo(female.BMI, 23.4375);
  closeTo(female.IBW, 52.3819);
  closeTo(female.LBW, 38.3619);
  closeTo(female.FFM, 38.3619);
});

test('drug-weight metrics use named Devine IBW and Janmahasatian lean body weight formulas', () => {
  closeTo(calc.devineIdealBodyWeight('male', 177.8), 73);
  closeTo(calc.devineIdealBodyWeight('female', 162.56), 54.7);
});

test('height conversion and predicted body weight use total inches correctly', () => {
  closeTo(calc.heightToCm(70, 'in'), 177.8);
  closeTo(calc.predictedBodyWeight('male', 177.8), 73.114);
  closeTo(calc.predictedBodyWeight('female', 162.56), 54.7496);
});

test('tidal volume ranges normalize reversed custom bounds', () => {
  assert.deepEqual(calc.tidalVolumeRange(70, 8, 6), { min: 420, max: 560 });
});

test('Apfel and RCRI scores count selected factors', () => {
  assert.equal(calc.apfelScore([true, false, true, true]), 3);
  assert.deepEqual(calc.apfelRisk[3], { pct: '≈60%', label: 'High' });
  assert.equal(calc.rcriScore([true, false, true, false, false, true]), 3);
});

test('Winter formula returns expected value and tolerance band', () => {
  assert.deepEqual(calc.winterExpectedPaco2(12), { expected: 26, min: 24, max: 28 });
});

test('alveolar gas equation accepts fraction and percentage FiO2', () => {
  const fraction = calc.alveolarGas({ paco2: 40, fio2: 0.5, pao2: 100 });
  const percent = calc.alveolarGas({ paco2: 40, fio2: 50, pao2: 100 });
  closeTo(fraction.PAO2, 306.5);
  closeTo(fraction.Aa, 206.5);
  assert.deepEqual(percent, fraction);
});

test('anion gap includes optional albumin correction', () => {
  assert.deepEqual(calc.anionGap({ na: 140, cl: 104, hco3: 20 }), { value: 16, corrected: null });
  assert.deepEqual(calc.anionGap({ na: 140, cl: 104, hco3: 20, albumin: 2 }), { value: 16, corrected: 21 });
});

test('respiratory compensation moves bicarbonate in the physiologic direction', () => {
  assert.deepEqual(calc.respiratoryCompensation(60, 'acidosis'), { acute: 26, chronic: 31 });
  assert.deepEqual(calc.respiratoryCompensation(30, 'alkalosis'), { acute: 22, chronic: 20 });
});

test('delta ratio uses corrected anion gap when available and only when interpretable', () => {
  closeTo(calc.deltaRatio({ anionGap: 16, correctedAnionGap: 20, hco3: 18 }), 8 / 6);
  assert.equal(calc.deltaRatio({ anionGap: 10, hco3: 18 }), null);
  assert.equal(calc.deltaRatio({ anionGap: 20, hco3: 25 }), null);
});

test('Henderson-Hasselbalch and driving pressure helpers produce expected values', () => {
  closeTo(calc.hendersonHasselbalchPh({ paco2: 40, hco3: 24 }), 7.401, 0.002);
  assert.equal(calc.drivingPressure(24, 8), 16);
});

test('calculation helpers reject invalid values', () => {
  assert.throws(() => calc.predictedBodyWeight('', 170), /sex/);
  assert.throws(() => calc.heightToCm(Number.NaN, 'cm'), /finite/);
  assert.throws(() => calc.alveolarGas({ paco2: 40, fio2: undefined, pao2: 90 }), /finite/);
});

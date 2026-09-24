(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AnesthesiaCalculations = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function requireFinite(name, value) {
    if (!Number.isFinite(value)) throw new TypeError(`${name} must be a finite number.`);
  }

  function bodyMetrics({ sex, height, weight }) {
    requireFinite('height', height);
    requireFinite('weight', weight);
    if (sex !== 'male' && sex !== 'female') throw new TypeError('sex must be male or female.');
    const TBW = weight;
    const BMI = TBW / ((height / 100) ** 2);
    const IBW = devineIdealBodyWeight(sex, height);
    const LBW = sex === 'male'
      ? (9270 * TBW) / (6680 + 216 * BMI)
      : (9270 * TBW) / (8780 + 244 * BMI);
    return { TBW, BMI, IBW, LBW, FFM: LBW };
  }

  function devineIdealBodyWeight(sex, heightCm) {
    requireFinite('heightCm', heightCm);
    if (sex !== 'male' && sex !== 'female') throw new TypeError('sex must be male or female.');
    const inchesOverFiveFeet = (heightCm / 2.54) - 60;
    return (sex === 'male' ? 50 : 45.5) + 2.3 * inchesOverFiveFeet;
  }

  function heightToCm(height, unit = 'cm') {
    requireFinite('height', height);
    if (unit !== 'cm' && unit !== 'in') throw new TypeError('unit must be cm or in.');
    return unit === 'in' ? height * 2.54 : height;
  }

  function predictedBodyWeight(sex, heightCm) {
    requireFinite('heightCm', heightCm);
    if (sex !== 'male' && sex !== 'female') throw new TypeError('sex must be male or female.');
    return (sex === 'male' ? 50 : 45.5) + 0.91 * (heightCm - 152.4);
  }

  function tidalVolumeRange(pbwKg, minMlKg, maxMlKg) {
    [pbwKg, minMlKg, maxMlKg].forEach((value, index) => requireFinite(['pbwKg', 'minMlKg', 'maxMlKg'][index], value));
    const low = Math.min(minMlKg, maxMlKg);
    const high = Math.max(minMlKg, maxMlKg);
    return { min: pbwKg * low, max: pbwKg * high };
  }

  function countTrue(values) {
    return Array.from(values).filter(Boolean).length;
  }

  const apfelRisk = Object.freeze([
    Object.freeze({ pct: '≈10%', label: 'Low' }),
    Object.freeze({ pct: '≈20%', label: 'Low–moderate' }),
    Object.freeze({ pct: '≈40%', label: 'Moderate' }),
    Object.freeze({ pct: '≈60%', label: 'High' }),
    Object.freeze({ pct: '≈80%', label: 'Very high' })
  ]);

  function apfelScore(factors) {
    return countTrue(factors);
  }

  function rcriScore(factors) {
    return countTrue(factors);
  }

  function winterExpectedPaco2(hco3) {
    requireFinite('hco3', hco3);
    const expected = 1.5 * hco3 + 8;
    return { expected, min: expected - 2, max: expected + 2 };
  }

  function alveolarGas({ paco2, fio2, pao2, pb = 760, ph2o = 47, rq = 0.8 }) {
    [paco2, fio2, pao2, pb, ph2o, rq].forEach((value, index) => requireFinite(['paco2', 'fio2', 'pao2', 'pb', 'ph2o', 'rq'][index], value));
    const fraction = fio2 > 1 ? fio2 / 100 : fio2;
    const PAO2 = fraction * (pb - ph2o) - (paco2 / rq);
    return { PAO2, Aa: PAO2 - pao2 };
  }

  function anionGap({ na, cl, hco3, albumin }) {
    [na, cl, hco3].forEach((value, index) => requireFinite(['na', 'cl', 'hco3'][index], value));
    const value = na - (cl + hco3);
    const corrected = Number.isFinite(albumin) ? value + 2.5 * (4 - albumin) : null;
    return { value, corrected };
  }

  function respiratoryCompensation(paco2, disorder) {
    requireFinite('paco2', paco2);
    const deltaTens = (paco2 - 40) / 10;
    if (disorder === 'acidosis') {
      return { acute: 24 + deltaTens, chronic: 24 + 3.5 * deltaTens };
    }
    if (disorder === 'alkalosis') {
      return { acute: 24 + 2 * deltaTens, chronic: 24 + 4 * deltaTens };
    }
    throw new TypeError('disorder must be acidosis or alkalosis.');
  }

  function deltaRatio({ anionGap: gap, correctedAnionGap, hco3, normalGap = 12, normalHco3 = 24 }) {
    [gap, hco3, normalGap, normalHco3].forEach((value, index) => requireFinite(['anionGap', 'hco3', 'normalGap', 'normalHco3'][index], value));
    const selectedGap = Number.isFinite(correctedAnionGap) ? correctedAnionGap : gap;
    const denominator = normalHco3 - hco3;
    if (selectedGap <= normalGap || denominator <= 0) return null;
    return (selectedGap - normalGap) / denominator;
  }

  function hendersonHasselbalchPh({ paco2, hco3 }) {
    [paco2, hco3].forEach((value, index) => requireFinite(['paco2', 'hco3'][index], value));
    if (paco2 <= 0 || hco3 <= 0) throw new RangeError('paco2 and hco3 must be greater than zero.');
    return 6.1 + Math.log10(hco3 / (0.03 * paco2));
  }

  function drivingPressure(plateauPressure, peep) {
    requireFinite('plateauPressure', plateauPressure);
    requireFinite('peep', peep);
    return plateauPressure - peep;
  }

  return {
    bodyMetrics,
    devineIdealBodyWeight,
    heightToCm,
    predictedBodyWeight,
    tidalVolumeRange,
    apfelScore,
    apfelRisk,
    rcriScore,
    winterExpectedPaco2,
    alveolarGas,
    anionGap,
    respiratoryCompensation,
    deltaRatio,
    hendersonHasselbalchPh,
    drivingPressure
  };
});

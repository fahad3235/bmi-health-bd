/* bmi-health-bd — all health math in ONE pure, commented module.
   No DOM, no storage, no network. Formulas cited inline. */

/* ---------- Unit conversions (exact international definitions) ---------- */
const CM_PER_IN = 2.54;          // exact: 1 inch = 2.54 cm
const KG_PER_LB = 0.45359237;    // exact: 1 lb = 0.45359237 kg

function inToCm(inches) { return inches * CM_PER_IN; }
function lbToKg(lb) { return lb * KG_PER_LB; }
function cmToIn(cm) { return cm / CM_PER_IN; }
function kgToLb(kg) { return kg / KG_PER_LB; }

/* ---------- BMI ----------
   BMI = mass(kg) / height(m)^2.
   Hand check: 65 kg, 170 cm -> 65 / 1.7^2 = 65 / 2.89 = 22.4913... ~ 22.49 */
function bmi(weightKg, heightCm) {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

/* ---------- WHO BMI categories (adults) ----------
   Underweight < 18.5 | Normal 18.5–24.9 | Overweight 25–29.9 | Obese >= 30
   Source: WHO BMI classification. */
function bmiCategory(b) {
  if (b < 18.5) return 'under';
  if (b < 25) return 'normal';
  if (b < 30) return 'over';
  return 'obese';
}

/* ---------- BMR: Mifflin-St Jeor (1990) ----------
   Male:   10*W + 6.25*H - 5*A + 5
   Female: 10*W + 6.25*H - 5*A - 161
   (W in kg, H in cm, A in years.)
   Hand check: male, 25y, 70kg, 175cm ->
   10*70 + 6.25*175 - 5*25 + 5 = 700 + 1093.75 - 125 + 5 = 1673.75 */
function bmr(sex, weightKg, heightCm, age) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return base + (sex === 'male' ? 5 : -161);
}

/* ---------- TDEE = BMR x activity factor ----------
   Standard Mifflin-St Jeor activity multipliers:
   sedentary 1.2 | light 1.375 | moderate 1.55 | active 1.725 | very 1.9
   Hand check: BMR 1673.75 x 1.55 = 2594.3125 ~ 2594.31 */
const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very: 1.9,
};
function tdee(bmrVal, activity) {
  return bmrVal * (ACTIVITY_FACTORS[activity] || 1.2);
}

/* ---------- Healthy weight range ----------
   Weight range whose BMI falls in 18.5–24.9 at the given height:
   low = 18.5 * h^2, high = 24.9 * h^2.
   Hand check: 170 cm -> 18.5*2.89 = 53.465 (~53.5),
   24.9*2.89 = 71.961 (~72.0). */
function idealWeightRange(heightCm) {
  const h2 = Math.pow(heightCm / 100, 2);
  return { low: 18.5 * h2, high: 24.9 * h2 };
}

/* ---------- Validation bounds (shared by UI and tests) ---------- */
const BOUNDS = {
  heightCm: { min: 50, max: 250 },
  weightKg: { min: 20, max: 300 },
  age: { min: 5, max: 120 },
};

function validateInputs({ heightCm, weightKg, age }) {
  const errs = [];
  if (!Number.isFinite(heightCm) || heightCm < BOUNDS.heightCm.min || heightCm > BOUNDS.heightCm.max)
    errs.push('height');
  if (!Number.isFinite(weightKg) || weightKg < BOUNDS.weightKg.min || weightKg > BOUNDS.weightKg.max)
    errs.push('weight');
  if (!Number.isFinite(age) || age < BOUNDS.age.min || age > BOUNDS.age.max)
    errs.push('age');
  return errs;
}

/* Full pipeline: metric inputs -> result object. Throws nothing; caller validates. */
function calculateAll({ heightCm, weightKg, age, sex, activity }) {
  const b = bmi(weightKg, heightCm);
  const bmrVal = bmr(sex, weightKg, heightCm, age);
  const tdeeVal = tdee(bmrVal, activity);
  const range = idealWeightRange(heightCm);
  return {
    bmi: b,
    category: bmiCategory(b),
    bmr: bmrVal,
    tdee: tdeeVal,
    idealLow: range.low,
    idealHigh: range.high,
  };
}

if (typeof module !== 'undefined') module.exports = {
  inToCm, lbToKg, cmToIn, kgToLb, bmi, bmiCategory, bmr, tdee,
  idealWeightRange, validateInputs, calculateAll, ACTIVITY_FACTORS, BOUNDS,
};

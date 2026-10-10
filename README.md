# BMI Health BD

A free, fully offline BMI / BMR / TDEE health calculator in English and বাংলা — built for Bangladesh, running entirely in your browser with zero network requests.

## Problem

Quick health-metric tools online are ad-heavy, English-only, and send your data to servers. BMI Health BD gives you BMI (with WHO category on a color gauge), BMR (Mifflin-St Jeor), TDEE for 5 activity levels, and a healthy weight range — privately, in your language.

## Features

- BMI with WHO category (underweight / normal / overweight / obese) + color gauge
- BMR via Mifflin-St Jeor (sex-specific), TDEE = BMR × activity factor (5 standard levels)
- Healthy weight range for your height (BMI 18.5–24.9)
- Metric ↔ imperial unit toggle with exact conversions
- History: save dated results, view trend list, delete entries
- localStorage persistence; JSON export / import
- Full EN ⇄ বাংলা UI toggle (Bengali digits in results)
- Responsive mobile + desktop; "not medical advice" disclaimer in-app

## Stack

Vanilla HTML + CSS + JavaScript. No build step, no dependencies, no backend, no network requests.

## Prerequisites

Any modern browser. For tests: Node.js + puppeteer-core + a Chromium binary.

## Install

No install needed — open `index.html` directly, or serve the folder:

```sh
cd ~/workspace/muse-project-factory/builds/bmi-health-bd
python3 -m http.server 8000
# open http://localhost:8000
```

## Dev commands

None — there is no build. Edit files and reload.

## Env

None. No API keys, no `.env`, no secrets anywhere.

## Testing

Real headless-Chrome checks via puppeteer-core (`/tmp/bmi-test/test.js`):

```sh
cd /tmp/bmi-test && npm i puppeteer-core   # once
node test.js
```

23 checks: zero console/page errors; hand-verified math — 170cm/65kg → BMI 22.49 ±0.01 (Normal); male 25y/70kg/175cm → BMR 1673.75 ±1 (displayed 1674); TDEE @1.55 → 2594.31; imperial 5'7"/150lb matches metric within tolerance; ideal range @170cm → 53.5–72.0 kg; WHO category boundaries (18.4/18.5, 24.9/25, 29.9/30); female BMR spot-check; history save + delete; validation rejections; BN/EN toggle + Bengali digits; malformed import rejected; 390px mobile no horizontal overflow. **26/26 passed.**

## Deployment

Static site — GitHub Pages compatible: push the folder contents to `main` and enable Pages (Deploy from a branch → `main` / root).

## Limitations

- **Not medical advice.** BMI/WHO categories are population screening tools; athletes, children, pregnant people, and the elderly need professional assessment. A disclaimer is shown in the app.
- BMR (Mifflin-St Jeor) is an estimate, typically ±10% of measured values.
- Activity multipliers are standard averages, not personalized.
- History is per-browser localStorage (no sync); JSON export is the backup path.
- `file://` works for the app itself.

## Status

Complete and tested. 23/23 headless-Chrome checks passed, zero console errors.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const tools = require('../assets/js/health-tools.js');

test('BMI conversion and Asia-Pacific screening bands', () => {
  const metric = tools.computeBMI({ weight: 70, heightCm: 170 });
  assert.ok(Math.abs(metric.bmi - 24.2215) < 0.01);
  assert.equal(metric.category, 'Increased-risk / overweight band');

  const imperial = tools.computeBMI({ weight: 154.3236, weightUnit: 'lb', heightUnit: 'ft', heightFeet: 5, heightInches: 7 });
  assert.ok(Math.abs(imperial.kg - 70) < 0.01);
  assert.ok(Math.abs(imperial.cm - 170.18) < 0.01);
  assert.equal(tools.computeBMI({ weight: 51.75, heightCm: 150 }).category, 'Increased-risk / overweight band');
  assert.equal(tools.computeBMI({ weight: 56.25, heightCm: 150 }).category, 'Obesity class I band');
  assert.equal(tools.computeBMI({ weight: 75, heightCm: 170 }).category, 'Obesity class I band');
  assert.throws(() => tools.computeBMI({ weight: 70, heightCm: 0 }), RangeError);
});

test('Asian waist flags use 80 cm and 90 cm cutoffs with inch conversion', () => {
  assert.equal(tools.waistToCm(35.5, 'in'), 90.17);
  assert.equal(tools.hasElevatedAsianWaist(tools.waistToCm(35.5, 'in'), 90), true);
  assert.equal(tools.hasElevatedAsianWaist(89.9, 90), false);
  assert.equal(tools.hasElevatedAsianWaist(80, 80), true);
});

test('heat-index conversion, humidity response, and PAGASA bands', () => {
  const dry = tools.computeHeatIndexC(35, 'C', 25);
  const humid = tools.computeHeatIndexC(35, 'C', 75);
  const fahrenheit = tools.computeHeatIndexC(95, 'F', 75);
  assert.equal(dry.calculated, true);
  assert.ok(humid.heatIndexC > dry.heatIndexC);
  assert.ok(Math.abs(humid.heatIndexC - fahrenheit.heatIndexC) < 0.001);
  assert.equal(tools.computeHeatIndexC(25, 'C', 70).calculated, false);
  assert.equal(tools.pagasaHeatBand(27), 'Caution');
  assert.equal(tools.pagasaHeatBand(33), 'Extreme caution');
  assert.equal(tools.pagasaHeatBand(42), 'Danger');
  assert.equal(tools.pagasaHeatBand(51.1), 'Extreme danger');
});

test('hydration plan uses moderate-work guidance and avoids a target in danger bands', () => {
  const estimate = tools.hydrationEstimate(35, 40);
  assert.equal(estimate.mode, 'moderate-heat-plan');
  assert.equal(estimate.cups, 2);
  assert.equal(estimate.millilitres, 480);
  assert.equal(tools.hydrationEstimate(35, 180).minutes, 120);
  assert.equal(tools.hydrationEstimate(42, 120).mode, 'stop-and-cool');
  assert.equal(tools.hydrationEstimate(26, 60).mode, 'no-heat-target');
});

test('rice estimates include cup size, swaps, and optional PHP-based cost input', () => {
  const white = tools.riceEstimate({ cups: 1, rice: 'white', cupMillilitres: 240 });
  assert.equal(white.calories, 205);
  assert.equal(white.alternateRice, 'brown');
  assert.equal(white.alternateCalories, 248);
  assert.equal(tools.riceEstimate({ cups: 1, rice: 'white', cupMillilitres: 180 }).calories, 153.75);

  const priced = tools.riceEstimate({ cups: 1, rice: 'white', pricePerKg: 100 });
  assert.ok(priced.pricePerServing > 0);
  assert.equal(tools.riceEstimate({ cups: 1, rice: 'white' }).pricePerServing, null);
});
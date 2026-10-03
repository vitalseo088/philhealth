(function (root) {
  'use strict';

  const LB_TO_KG = 0.45359237;
  const IN_TO_CM = 2.54;
  const STANDARD_CUP_ML = 240;
  const RICE_REFERENCE = {
    white: { calories: 205, grams: 158, dryYieldCupsPerPound: 7 },
    brown: { calories: 248, grams: 202, dryYieldCupsPerPound: 5.5 }
  };

  function computeBMI({ weight, weightUnit = 'kg', heightCm, heightFeet, heightInches, heightUnit = 'cm' }) {
    const enteredWeight = Number(weight);
    const kg = weightUnit === 'lb' ? enteredWeight * LB_TO_KG : enteredWeight;
    const cm = heightUnit === 'ft'
      ? (Number(heightFeet) * 12 + Number(heightInches)) * IN_TO_CM
      : Number(heightCm);
    if (!Number.isFinite(kg) || kg < 25 || kg > 350) throw new RangeError('Enter an adult weight from 25 to 350 kg (55 to 772 lb).');
    if (!Number.isFinite(cm) || cm < 100 || cm > 250) throw new RangeError('Enter a height from 100 to 250 cm (3 ft 3 in to 8 ft 2 in).');
    const bmi = kg / ((cm / 100) ** 2);
    let category;
    if (bmi < 18.5) category = 'Below the reference range';
    else if (bmi < 23) category = 'Asia-Pacific reference band';
    else if (bmi < 25) category = 'Increased-risk / overweight band';
    else if (bmi < 30) category = 'Obesity class I band';
    else category = 'Obesity class II band';
    return { bmi, kg, cm, category };
  }

  function waistToCm(value, unit = 'cm') {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) throw new RangeError('Enter a valid waist measurement.');
    return unit === 'in' ? numeric * IN_TO_CM : numeric;
  }

  function hasElevatedAsianWaist(waistValueCm, cutoffCm) {
    const cutoff = Number(cutoffCm);
    if (![80, 90].includes(cutoff)) throw new RangeError('Choose the 80 cm or 90 cm comparison threshold.');
    return Number(waistValueCm) >= cutoff;
  }

  function computeHeatIndexC(temperature, unit = 'C', humidity) {
    const entered = Number(temperature);
    const rh = Number(humidity);
    if (!Number.isFinite(entered) || !Number.isFinite(rh) || rh < 10 || rh > 100) {
      throw new RangeError('Enter a valid temperature and relative humidity from 10% to 100%.');
    }
    const tempC = unit === 'F' ? (entered - 32) * 5 / 9 : entered;
    if (tempC < 15 || tempC > 55) throw new RangeError('Enter an air temperature from 15°C to 55°C (59°F to 131°F).');
    const tempF = tempC * 9 / 5 + 32;
    if (tempF < 80) return { airTempC: tempC, heatIndexC: null, calculated: false };

    let heatIndexF = -42.379
      + 2.04901523 * tempF
      + 10.14333127 * rh
      - 0.22475541 * tempF * rh
      - 0.00683783 * tempF * tempF
      - 0.05481717 * rh * rh
      + 0.00122874 * tempF * tempF * rh
      + 0.00085282 * tempF * rh * rh
      - 0.00000199 * tempF * tempF * rh * rh;

    if (rh < 13 && tempF >= 80 && tempF <= 112) {
      heatIndexF -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(tempF - 95)) / 17);
    } else if (rh > 85 && tempF >= 80 && tempF <= 87) {
      heatIndexF += ((rh - 85) / 10) * ((87 - tempF) / 5);
    }
    return { airTempC: tempC, heatIndexC: (heatIndexF - 32) * 5 / 9, calculated: true };
  }

  function pagasaHeatBand(heatIndexC) {
    if (!Number.isFinite(Number(heatIndexC)) || Number(heatIndexC) < 27) return 'Below caution';
    if (Number(heatIndexC) <= 32) return 'Caution';
    if (Number(heatIndexC) <= 41) return 'Extreme caution';
    if (Number(heatIndexC) <= 51) return 'Danger';
    return 'Extreme danger';
  }

  function hydrationEstimate(heatIndexC, activeMinutes) {
    const minutes = Math.max(0, Number(activeMinutes) || 0);
    const band = pagasaHeatBand(heatIndexC);
    if (band === 'Below caution') return { band, mode: 'no-heat-target', minutes: 0, cups: 0, millilitres: 0 };
    if (band === 'Danger' || band === 'Extreme danger') {
      return { band, mode: 'stop-and-cool', minutes: 0, cups: 0, millilitres: 0 };
    }
    if (!minutes) return { band, mode: 'no-activity', minutes: 0, cups: 0, millilitres: 0 };
    const plannedMinutes = Math.min(minutes, 120);
    const cups = Math.ceil(plannedMinutes / 20);
    return {
      band,
      mode: 'moderate-heat-plan',
      minutes: plannedMinutes,
      cups,
      millilitres: cups * 240,
      capped: minutes > 120
    };
  }

  function riceEstimate({ cups, rice = 'white', cupMillilitres = STANDARD_CUP_ML, pricePerKg = null }) {
    const portionCups = Number(cups);
    const cupMl = Number(cupMillilitres);
    const reference = RICE_REFERENCE[rice];
    if (!reference) throw new RangeError('Choose white or brown rice.');
    if (!Number.isFinite(portionCups) || portionCups < 0 || portionCups > 10) throw new RangeError('Enter a portion from 0 to 10 cups.');
    if (![180, STANDARD_CUP_ML].includes(cupMl)) throw new RangeError('Choose a 180 mL rice-cooker cup or 240 mL measuring cup.');
    const standardCupEquivalent = portionCups * cupMl / STANDARD_CUP_ML;
    const calories = standardCupEquivalent * reference.calories;
    const other = RICE_REFERENCE[rice === 'white' ? 'brown' : 'white'];
    const price = pricePerKg === null || pricePerKg === '' ? null : Number(pricePerKg);
    if (price !== null && (!Number.isFinite(price) || price < 0 || price > 100000)) {
      throw new RangeError('Enter a valid dry-rice price in Philippine pesos per kilogram.');
    }
    const cookedCupsPerKg = reference.dryYieldCupsPerPound * (1 / LB_TO_KG);
    return {
      rice,
      portionCups,
      cupMillilitres: cupMl,
      standardCupEquivalent,
      calories,
      halfPortionCalories: calories / 2,
      alternateRice: rice === 'white' ? 'brown' : 'white',
      alternateCalories: standardCupEquivalent * other.calories,
      pricePerServing: price === null ? null : price * standardCupEquivalent / cookedCupsPerKg
    };
  }

  const SOURCES = {
    bmi: [
      ['WHO Western Pacific Region, The Asia-Pacific Perspective: Redefining Obesity and Its Treatment (2000)', 'https://iris.who.int/bitstream/handle/10665/206936/0957708211_eng.pdf?sequence=1'],
      ['WHO Expert Consultation: Appropriate body-mass index for Asian populations (2004)', 'https://pubmed.ncbi.nlm.nih.gov/14726171/']
    ],
    diabetes: [
      ['CDC Prediabetes Risk Test: scoring and risk factors', 'https://www.cdc.gov/diabetes/widgets/risktest/how-your-test-is-scored.html'],
      ['IDF Consensus Worldwide Definition of the Metabolic Syndrome', 'https://idf.org/media/uploads/2023/05/attachments-30.pdf'],
      ['WHO Western Pacific Region Asia-Pacific BMI report', 'https://iris.who.int/bitstream/handle/10665/206936/0957708211_eng.pdf?sequence=1']
    ],
    hypertension: [
      ['U.S. Preventive Services Task Force: Hypertension in Adults—Screening', 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/hypertension-in-adults-screening'],
      ['IDF Consensus Worldwide Definition of the Metabolic Syndrome', 'https://idf.org/media/uploads/2023/05/attachments-30.pdf']
    ],
    heat: [
      ['DOST-PAGASA Heat Index', 'https://www.pagasa.dost.gov.ph/weather/heat-index'],
      ['Philippine News Agency report on PAGASA heat-index effect categories', 'https://www.pna.gov.ph/articles/1270410'],
      ['National Weather Service heat-index calculation and limits', 'https://www.weather.gov/ama/heatindex'],
      ['PAGASA: Climate of the Philippines (hot dry season)', 'https://www.pagasa.dost.gov.ph/information/climate-philippines']
    ],
    hydration: [
      ['NIOSH: Criteria for a Recommended Standard—Occupational Exposure to Heat and Hot Environments', 'https://www.cdc.gov/niosh/docs/2016-106/pdfs/2016-106.pdf'],
      ['DOST-PAGASA Heat Index', 'https://www.pagasa.dost.gov.ph/weather/heat-index']
    ],
    rice: [
      ['USDA FoodData Central: cooked rice nutrient records', 'https://fdc.nal.usda.gov/food-search?query=cooked%20rice&type=SR%20Legacy'],
      ['USDA Food Buying Guide: grain yield table', 'https://foodbuyingguide.fns.usda.gov/files/Reports/USDA_FBG_Section4_GrainsYieldTable.pdf']
    ]
  };

  function create({ shell, esc }) {
    const safe = esc || ((value) => String(value));
    const h = (value) => safe(String(value));
    const link = (title, url) => `<li><a href="${h(url)}" target="_blank" rel="noopener noreferrer">${h(title)}</a></li>`;
    const refs = (items, method) => `
      <details class="health-sources"><summary>Sources and calculation notes</summary>
        <ul>${items.map(([title, url]) => link(title, url)).join('')}</ul>
        <p class="small muted">${method}</p><p class="small muted">References checked October 4, 2026. Check the linked guidance again before making health decisions.</p>
      </details>`;
    const hero = (title, description) => `
      <div class="page-hero"><div class="container">
        <div class="breadcrumbs"><a href="/index.html">Home</a><span>/</span><a href="/tools/index.html">Tools</a><span>/</span>${h(title)}</div>
        <div class="eyebrow">Health &amp; wellness tools</div><h1>${h(title)}</h1><p class="lead">${h(description)}</p>
      </div></div>`;
    const page = (title, description, content) => `${hero(title, description)}<section class="section"><div class="container health-tool">${content}</div></section>`;
    const healthNote = (copy = 'This tool is for education and planning only. It does not diagnose a condition or replace advice from a qualified health professional.') =>
      `<div class="notice health-disclaimer" role="note"><strong>Important</strong>${h(copy)}</div>`;
    const privacyNote = `<p class="small muted health-privacy">Your entries are processed in this browser and are not saved or sent by this tool.</p>`;
    const empty = (copy) => `<div class="result-panel empty" id="health-result" role="status" aria-live="polite"><div><div class="result-kicker">Your result</div><p>${h(copy)}</p></div></div>`;
    const errorResult = (message) => `<div class="notice health-disclaimer" role="alert"><strong>Check your entries</strong>${h(message)}</div>`;
    const number = (value, decimals = 1) => Number(value).toLocaleString('en-PH', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    const referenceBlock = (sourceKey, method) => refs(SOURCES[sourceKey], method);
    const waistControls = (prefix) => `
      <div class="field-row">
        <div class="field"><label class="label" for="${prefix}-waist">Waist measurement</label><input id="${prefix}-waist" type="number" inputmode="decimal" min="15" max="200" step="0.1" required aria-describedby="${prefix}-waist-help"><span id="${prefix}-waist-help" class="field-error">Measure around your waist without pulling the tape tight.</span></div>
        <div class="field"><label class="label" for="${prefix}-waist-unit">Waist unit</label><select id="${prefix}-waist-unit"><option value="cm">Centimetres (cm)</option><option value="in">Inches (in)</option></select></div>
      </div>
      <div class="field"><label class="label" for="${prefix}-cutoff">Compare with which Asian waist cutoff?</label><select id="${prefix}-cutoff" required><option value="90">90 cm — adult-men reference</option><option value="80">80 cm — adult-women reference</option></select><span class="field-error">These are screening cutoffs; local clinical guidance may differ.</span></div>`;

    function bmi() {
      const title = 'Asian BMI calculator';
      shell(page(title, 'Check adult BMI with the lower WHO Western Pacific Asia-Pacific risk bands. Switch between kg/lb and cm/ft-in.', `
        ${healthNote('BMI is a screening measure, not a diagnosis. This Asia-Pacific reference is for non-pregnant adults aged 18 and over; it is not intended for children or pregnancy.')}
        <div class="tool-layout health-tool-layout">
          <form class="tool-card-shell" id="asian-bmi-form">
            <h2>Enter your measurements</h2><p class="subcopy">Use a standard tape and enter your current weight and height.</p>
            <div class="field-row">
              <div class="field"><label class="label" for="bmi-weight">Weight (<span id="bmi-weight-unit-label">kg</span>)</label><input id="bmi-weight" type="number" inputmode="decimal" min="25" max="350" step="0.1" required></div>
              <div class="field"><label class="label" for="bmi-weight-unit">Weight unit</label><select id="bmi-weight-unit"><option value="kg">Kilograms (kg)</option><option value="lb">Pounds (lb)</option></select></div>
            </div>
            <div class="field"><label class="label" for="bmi-height-unit">Height format</label><select id="bmi-height-unit"><option value="cm">Centimetres (cm)</option><option value="ft">Feet and inches (ft + in)</option></select></div>
            <div class="field" id="bmi-height-cm-wrap"><label class="label" for="bmi-height-cm">Height (cm)</label><input id="bmi-height-cm" type="number" inputmode="decimal" min="100" max="250" step="0.1" required></div>
            <div class="field-row" id="bmi-height-ft-wrap" hidden>
              <div class="field"><label class="label" for="bmi-height-ft">Feet (ft)</label><input id="bmi-height-ft" type="number" min="3" max="8" step="1" disabled></div>
              <div class="field"><label class="label" for="bmi-height-in">Remaining inches (in)</label><input id="bmi-height-in" type="number" min="0" max="11.9" step="0.1" disabled></div>
            </div>
            <div class="button-row"><button class="btn btn-primary" type="submit">Calculate BMI</button><button class="btn btn-ghost" type="reset">Clear</button></div>
            ${privacyNote}
          </form>
          ${empty('Enter your measurements to calculate BMI and see the Asia-Pacific reference band.')}
        </div>
        ${referenceBlock('bmi', 'The WHO Western Pacific report proposed provisional adult Asia-Pacific bands: overweight/increased-risk at BMI ≥23 and obesity at BMI ≥25. They are regional reference points, not a universal WHO classification or a diagnosis.')}
      `), title);

      const form = document.querySelector('#asian-bmi-form');
      const weightUnit = form.querySelector('#bmi-weight-unit');
      const heightUnit = form.querySelector('#bmi-height-unit');
      const weight = form.querySelector('#bmi-weight');
      const cmWrap = form.querySelector('#bmi-height-cm-wrap');
      const ftWrap = form.querySelector('#bmi-height-ft-wrap');
      const cmInput = form.querySelector('#bmi-height-cm');
      const ftInput = form.querySelector('#bmi-height-ft');
      const inchInput = form.querySelector('#bmi-height-in');
      const result = document.querySelector('#health-result');
      const updateUnits = () => {
        const isLb = weightUnit.value === 'lb';
        form.querySelector('#bmi-weight-unit-label').textContent = isLb ? 'lb' : 'kg';
        weight.min = isLb ? '55.2' : '25';
        weight.max = isLb ? '771.6' : '350';
        weight.setAttribute('aria-label', `Weight in ${isLb ? 'pounds' : 'kilograms'}`);
        const useFeet = heightUnit.value === 'ft';
        cmWrap.hidden = useFeet;
        cmInput.disabled = useFeet;
        ftWrap.hidden = !useFeet;
        ftInput.disabled = !useFeet;
        inchInput.disabled = !useFeet;
        cmInput.required = !useFeet;
        ftInput.required = useFeet;
        inchInput.required = useFeet;
      };
      weightUnit.addEventListener('change', updateUnits);
      heightUnit.addEventListener('change', updateUnits);
      form.addEventListener('reset', () => window.setTimeout(() => {
        updateUnits();
        result.className = 'result-panel empty';
        result.innerHTML = '<div><div class="result-kicker">Your result</div><p>Enter your measurements to calculate BMI and see the Asia-Pacific reference band.</p></div>';
      }, 0));
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        try {
          const data = computeBMI({
            weight: weight.value,
            weightUnit: weightUnit.value,
            heightCm: cmInput.value,
            heightFeet: ftInput.value,
            heightInches: inchInput.value,
            heightUnit: heightUnit.value
          });
          const message = data.bmi < 18.5
            ? 'A low BMI can also be a reason to discuss nutrition or health with a professional.'
            : data.bmi < 23
              ? 'This is below the Asia-Pacific increased-risk action point; it does not rule out health risks.'
              : data.bmi < 25
                ? 'The Asia-Pacific report flags this range earlier than standard international BMI categories.'
                : 'This range is a screening signal only. A clinician can interpret BMI with your full health context.';
          result.className = 'result-panel health-result-panel';
          result.innerHTML = `<div><div class="result-kicker">Estimated adult BMI</div><div class="result-value">${number(data.bmi, 1)}</div><h2>${h(data.category)}</h2><p class="explain">${message}</p><div class="breakdown"><div><span>Asia-Pacific increased-risk point</span><strong>23.0</strong></div><div><span>Asia-Pacific obesity point</span><strong>25.0</strong></div><div><span>Converted weight and height</span><strong>${number(data.kg, 1)} kg · ${number(data.cm, 1)} cm</strong></div></div><p class="small muted">BMI = weight (kg) ÷ height (m)². It does not measure body-fat distribution or diagnose illness.</p></div>`;
        } catch (error) {
          result.className = 'result-panel health-result-panel';
          result.innerHTML = errorResult(error.message);
        }
      });
      updateUnits();
    }

    function diabetes() {
      const title = 'Type 2 diabetes risk screener';
      shell(page(title, 'Review common screening factors, including Asian waist cutoffs. This checklist does not calculate a personal probability.', `
        ${healthNote('NOT A DIAGNOSIS: This is a conversation checklist, not a validated prediction score. A blood test and a health professional are needed to assess or diagnose diabetes. No flags do not rule it out.')}
        <div class="tool-layout health-tool-layout">
          <form class="tool-card-shell" id="diabetes-risk-form">
            <h2>Check common risk factors</h2><p class="subcopy">For adults. Select only what you know; nothing is sent from this page.</p>
            <div class="field"><label class="label" for="diabetes-age">Age (years)</label><input id="diabetes-age" type="number" min="18" max="120" step="1" required></div>
            ${waistControls('diabetes')}
            <fieldset class="health-checks"><legend>Has any of the following applied to you?</legend>
              <label><input type="checkbox" id="diabetes-family"> A parent, brother or sister has type 2 diabetes.</label>
              <label><input type="checkbox" id="diabetes-glucose"> You have previously been told you have prediabetes or high blood sugar.</label>
              <label><input type="checkbox" id="diabetes-gestational"> You have had diabetes during pregnancy (if applicable).</label>
              <label><input type="checkbox" id="diabetes-bp"> You have high blood pressure or take medicine for it.</label>
              <label><input type="checkbox" id="diabetes-activity"> You are not physically active most weeks.</label>
            </fieldset>
            <div class="button-row"><button class="btn btn-primary" type="submit">Review my risk factors</button><button class="btn btn-ghost" type="reset">Clear</button></div>${privacyNote}
          </form>
          ${empty('Enter age and waist, then choose any risk factors that apply.')}
        </div>
        ${referenceBlock('diabetes', 'The checklist summarizes common factors used in public-health screening and adds the Asian waist flag. It is deliberately not a points score: the combination has not been validated as a Philippines-specific prediction model. Consider asking a health professional whether HbA1c or fasting glucose testing is appropriate.')}
      `), title);
      const form = document.querySelector('#diabetes-risk-form');
      const waist = form.querySelector('#diabetes-waist');
      const waistUnit = form.querySelector('#diabetes-waist-unit');
      const cutoff = form.querySelector('#diabetes-cutoff');
      const result = document.querySelector('#health-result');
      const setWaistRange = () => {
        waist.min = waistUnit.value === 'in' ? '15' : '40';
        waist.max = waistUnit.value === 'in' ? '79' : '200';
      };
      waistUnit.addEventListener('change', setWaistRange);
      form.addEventListener('reset', () => window.setTimeout(() => {
        setWaistRange();
        result.className = 'result-panel empty';
        result.innerHTML = '<div><div class="result-kicker">Your result</div><p>Enter age and waist, then choose any risk factors that apply.</p></div>';
      }, 0));
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const age = Number(form.querySelector('#diabetes-age').value);
        let waistCm;
        try { waistCm = waistToCm(waist.value, waistUnit.value); }
        catch (error) {
          result.className = 'result-panel health-result-panel';
          result.innerHTML = errorResult(error.message);
          return;
        }
        if (waistCm < 40 || waistCm > 200) {
          result.className = 'result-panel health-result-panel';
          result.innerHTML = errorResult('Enter a waist measurement from 40 to 200 cm (about 15.7 to 78.7 in).');
          return;
        }
        const flags = [];
        if (age >= 40) flags.push('Age 40 or older');
        if (hasElevatedAsianWaist(waistCm, cutoff.value)) flags.push(`Waist at or above the ${cutoff.value} cm Asian screening cutoff`);
        if (form.querySelector('#diabetes-family').checked) flags.push('Close family history of type 2 diabetes');
        if (form.querySelector('#diabetes-glucose').checked) flags.push('Previous prediabetes or high blood-sugar result');
        if (form.querySelector('#diabetes-gestational').checked) flags.push('History of diabetes during pregnancy');
        if (form.querySelector('#diabetes-bp').checked) flags.push('High blood pressure or related medication');
        if (form.querySelector('#diabetes-activity').checked) flags.push('Low physical activity');
        const advice = flags.length
          ? 'These factors are reasons to discuss screening with a health professional. A blood test—not this checklist—is needed to assess blood glucose.'
          : 'No listed factors were selected. This does not rule out diabetes or replace routine screening and medical advice.';
        result.className = 'result-panel health-result-panel';
        result.innerHTML = `<div><div class="result-kicker">Screening factors to discuss</div><div class="result-value">${flags.length}</div><h2>${flags.length ? 'Risk markers selected' : 'No listed markers selected'}</h2><p class="explain">${advice}</p>${flags.length ? `<ul class="health-flag-list">${flags.map(item => `<li>${h(item)}</li>`).join('')}</ul>` : ''}<div class="notice info"><strong>Not a diagnosis</strong>Only a qualified health professional can assess your risk and arrange appropriate tests.</div></div>`;
      });
      setWaistRange();
    }

    function hypertension() {
      const title = 'Hypertension risk screener';
      shell(page(title, 'Review common blood-pressure risk factors and Asian waist cutoffs, then plan a proper blood-pressure check.', `
        ${healthNote('NOT A DIAGNOSIS: Waist size and this checklist cannot detect or diagnose high blood pressure. Only properly measured blood pressure, with clinical confirmation when needed, can assess hypertension. No flags do not rule it out.')}
        <div class="tool-layout health-tool-layout">
          <form class="tool-card-shell" id="hypertension-risk-form">
            <h2>Check common risk factors</h2><p class="subcopy">For adults aged 18 and over. This is a practical checklist, not a validated score.</p>
            <div class="field"><label class="label" for="hypertension-age">Age (years)</label><input id="hypertension-age" type="number" min="18" max="120" step="1" required></div>
            ${waistControls('hypertension')}
            <fieldset class="health-checks"><legend>Has any of the following applied to you?</legend>
              <label><input type="checkbox" id="hypertension-family"> A parent or sibling has been diagnosed with high blood pressure.</label>
              <label><input type="checkbox" id="hypertension-reading"> A health professional has previously told you a blood-pressure reading was high.</label>
              <label><input type="checkbox" id="hypertension-kidney"> You have chronic kidney disease.</label>
              <label><input type="checkbox" id="hypertension-tobacco"> You currently use tobacco.</label>
              <label><input type="checkbox" id="hypertension-activity"> You are not physically active most weeks.</label>
            </fieldset>
            <div class="button-row"><button class="btn btn-primary" type="submit">Review my risk factors</button><button class="btn btn-ghost" type="reset">Clear</button></div>${privacyNote}
          </form>
          ${empty('Enter age and waist, then choose any risk factors that apply.')}
        </div>
        ${referenceBlock('hypertension', 'The Asian waist measurement is one risk marker only. The USPSTF recommends blood-pressure screening for adults and confirmation with measurements outside the clinic before diagnosis or treatment decisions. This checklist is not a substitute for either step.')}
      `), title);
      const form = document.querySelector('#hypertension-risk-form');
      const waist = form.querySelector('#hypertension-waist');
      const waistUnit = form.querySelector('#hypertension-waist-unit');
      const cutoff = form.querySelector('#hypertension-cutoff');
      const result = document.querySelector('#health-result');
      const setWaistRange = () => {
        waist.min = waistUnit.value === 'in' ? '15' : '40';
        waist.max = waistUnit.value === 'in' ? '79' : '200';
      };
      waistUnit.addEventListener('change', setWaistRange);
      form.addEventListener('reset', () => window.setTimeout(() => {
        setWaistRange();
        result.className = 'result-panel empty';
        result.innerHTML = '<div><div class="result-kicker">Your result</div><p>Enter age and waist, then choose any risk factors that apply.</p></div>';
      }, 0));
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const age = Number(form.querySelector('#hypertension-age').value);
        let waistCm;
        try { waistCm = waistToCm(waist.value, waistUnit.value); }
        catch (error) {
          result.className = 'result-panel health-result-panel';
          result.innerHTML = errorResult(error.message);
          return;
        }
        if (waistCm < 40 || waistCm > 200) {
          result.className = 'result-panel health-result-panel';
          result.innerHTML = errorResult('Enter a waist measurement from 40 to 200 cm (about 15.7 to 78.7 in).');
          return;
        }
        const flags = [];
        if (age >= 40) flags.push('Age 40 or older');
        if (hasElevatedAsianWaist(waistCm, cutoff.value)) flags.push(`Waist at or above the ${cutoff.value} cm Asian screening cutoff`);
        if (form.querySelector('#hypertension-family').checked) flags.push('Close family history of hypertension');
        if (form.querySelector('#hypertension-reading').checked) flags.push('Previously elevated blood-pressure reading');
        if (form.querySelector('#hypertension-kidney').checked) flags.push('Chronic kidney disease');
        if (form.querySelector('#hypertension-tobacco').checked) flags.push('Current tobacco use');
        if (form.querySelector('#hypertension-activity').checked) flags.push('Low physical activity');
        const advice = flags.length
          ? 'Consider arranging a blood-pressure check with a trained health worker. An elevated reading should be rechecked and interpreted by a professional.'
          : 'No listed factors were selected. High blood pressure can still occur without obvious risk markers, so follow routine screening advice.';
        result.className = 'result-panel health-result-panel';
        result.innerHTML = `<div><div class="result-kicker">Screening factors to discuss</div><div class="result-value">${flags.length}</div><h2>${flags.length ? 'Risk markers selected' : 'No listed markers selected'}</h2><p class="explain">${advice}</p>${flags.length ? `<ul class="health-flag-list">${flags.map(item => `<li>${h(item)}</li>`).join('')}</ul>` : ''}<div class="notice info"><strong>Blood-pressure screening</strong>A waist measurement is not a blood-pressure measurement. Use a validated upper-arm monitor or ask a health professional; a diagnosis may require repeat or out-of-clinic readings.</div></div>`;
      });
      setWaistRange();
    }

    function heatIndex() {
      const title = 'Heat index & safe-workout guide';
      shell(page(title, 'Estimate how hot it feels from air temperature and humidity, then use PAGASA heat bands to plan outdoor activity.', `
        <div class="notice health-season"><strong>Philippine hot-dry season</strong>PAGASA identifies March to May as the hot dry season, when temperature and humidity are especially uncomfortable. This tool is useful year-round; check current local advisories before going out.</div>
        ${healthNote('This is an estimate, not a live forecast or a guarantee of safe conditions. Direct sun, low wind, clothing, workload and health conditions can increase heat strain.')}
        <div class="tool-layout health-tool-layout">
          <form class="tool-card-shell" id="heat-index-form">
            <h2>Check the conditions</h2><p class="subcopy">Use a local weather reading taken near the time and place of the activity.</p>
            <div class="field-row">
              <div class="field"><label class="label" for="heat-temperature">Air temperature (<span id="heat-unit-label">°C</span>)</label><input id="heat-temperature" type="number" inputmode="decimal" min="15" max="55" step="0.1" required></div>
              <div class="field"><label class="label" for="heat-unit">Temperature unit</label><select id="heat-unit"><option value="C">Celsius (°C)</option><option value="F">Fahrenheit (°F)</option></select></div>
            </div>
            <div class="field"><label class="label" for="heat-humidity">Relative humidity (%)</label><input id="heat-humidity" type="number" min="10" max="100" step="1" required></div>
            <div class="field"><label class="label" for="heat-activity">What are you planning?</label><select id="heat-activity"><option value="exercise">Outdoor exercise</option><option value="work">Outdoor work</option><option value="both">Work and exercise</option></select></div>
            <div class="button-row"><button class="btn btn-primary" type="submit">Estimate heat risk</button><button class="btn btn-ghost" type="reset">Clear</button></div>${privacyNote}
          </form>
          ${empty('Enter a temperature and humidity reading to see the estimated heat band and activity guidance.')}
        </div>
        <div class="health-grid-note">
          <article class="card"><span class="category-label">Caution · 27–32°C</span><h3>Plan breaks</h3><p class="muted">Fatigue is possible. Choose a cooler time, lower intensity and take regular breaks.</p></article>
          <article class="card"><span class="category-label">Extreme caution · 33–41°C</span><h3>Reduce heat exposure</h3><p class="muted">Prefer indoor or shaded activity, shorten the session and stop if you feel unwell.</p></article>
          <article class="card"><span class="category-label">Danger · 42–51°C</span><h3>Postpone strenuous activity</h3><p class="muted">Move work or exercise to a cooler environment and follow local advisories.</p></article>
          <article class="card"><span class="category-label">Extreme danger · above 51°C</span><h3>Avoid outdoor exertion</h3><p class="muted">Seek a cooler place. Water alone cannot make extreme heat safe.</p></article>
        </div>
        <div class="notice info health-emergency"><strong>Know the warning signs</strong>Confusion, collapse, seizures or loss of consciousness in the heat need emergency help. Move the person to a cooler place and begin cooling while help is on the way.</div>
        <p class="small"><a href="/tools/heat-hydration.html">Open the heat hydration planner</a></p>
        ${referenceBlock('heat', 'The heat-index formula is an empirical approximation and is shown only from 80°F (about 26.7°C), where the NWS regression is used. Heat bands follow PAGASA’s Philippines guidance.')}
      `), title);
      const form = document.querySelector('#heat-index-form');
      const unit = form.querySelector('#heat-unit');
      const temperature = form.querySelector('#heat-temperature');
      const result = document.querySelector('#health-result');
      const updateUnit = () => {
        form.querySelector('#heat-unit-label').textContent = unit.value === 'F' ? '°F' : '°C';
        temperature.min = unit.value === 'F' ? '59' : '15';
        temperature.max = unit.value === 'F' ? '131' : '55';
      };
      unit.addEventListener('change', updateUnit);
      form.addEventListener('reset', () => window.setTimeout(() => {
        updateUnit();
        result.className = 'result-panel empty';
        result.innerHTML = '<div><div class="result-kicker">Your result</div><p>Enter a temperature and humidity reading to see the estimated heat band and activity guidance.</p></div>';
      }, 0));
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        try {
          const reading = computeHeatIndexC(temperature.value, unit.value, form.querySelector('#heat-humidity').value);
          const band = reading.calculated ? pagasaHeatBand(reading.heatIndexC) : 'Below caution';
          const activity = form.querySelector('#heat-activity').value;
          const highRisk = band === 'Danger' || band === 'Extreme danger';
          const advice = !reading.calculated
            ? 'The NWS heat-index regression is not used below 80°F. Heat risk can still come from direct sun, exertion or personal health factors; check PAGASA and use caution.'
            : highRisk
              ? `For ${activity === 'work' ? 'outdoor work' : activity === 'both' ? 'work and exercise' : 'outdoor exercise'}, postpone strenuous activity and move to a cooler place. Follow PAGASA and local safety instructions.`
              : band === 'Extreme caution'
                ? 'For outdoor activity, reduce duration and intensity; prefer shade or an indoor cool area and take frequent breaks.'
                : 'Choose a cooler time of day, start gently, take breaks and stop if you feel unwell.';
          const shown = reading.calculated
            ? `${number(reading.heatIndexC, 1)}°C (${number(reading.heatIndexC * 9 / 5 + 32, 1)}°F)`
            : `Not calculated below 80°F; air temperature ${number(reading.airTempC, 1)}°C (${number(reading.airTempC * 9 / 5 + 32, 1)}°F)`;
          result.className = `result-panel health-result-panel${highRisk ? ' health-result-danger' : ''}`;
          result.innerHTML = `<div><div class="result-kicker">Estimated feels-like temperature</div><div class="result-value health-heat-value">${shown}</div><span class="health-band health-band-${band.toLowerCase().replaceAll(' ', '-')}">${h(band)}</span><p class="explain">${advice}</p><div class="breakdown"><div><span>Air temperature</span><strong>${number(reading.airTempC, 1)}°C</strong></div><div><span>Relative humidity</span><strong>${number(Number(form.querySelector('#heat-humidity').value), 0)}%</strong></div><div><span>Activity</span><strong>${h(form.querySelector('#heat-activity').selectedOptions[0].textContent)}</strong></div></div><p class="small muted">This estimate does not replace a PAGASA alert or a worksite heat-stress plan.</p></div>`;
        } catch (error) {
          result.className = 'result-panel health-result-panel';
          result.innerHTML = errorResult(error.message);
        }
      });
      updateUnit();
    }

    function hydration() {
      const title = 'Tropical heat hydration planner';
      shell(page(title, 'Plan a modest drinking schedule for active time in heat, using humidity, outdoor-work time and exercise time.', `
        ${healthNote('This is not a personal daily water prescription. It uses occupational guidance for moderate activity in heat and does not account for medical fluid restrictions, illness, pregnancy or individual sweat loss.')}
        <div class="tool-layout health-tool-layout">
          <form class="tool-card-shell" id="hydration-form">
            <h2>Plan active time in heat</h2><p class="subcopy">Enter local conditions and non-overlapping activity minutes. Do not count a workout twice if it is part of your work shift.</p>
            <div class="field-row">
              <div class="field"><label class="label" for="hydration-temperature">Air temperature (<span id="hydration-unit-label">°C</span>)</label><input id="hydration-temperature" type="number" inputmode="decimal" min="15" max="55" step="0.1" required></div>
              <div class="field"><label class="label" for="hydration-unit">Temperature unit</label><select id="hydration-unit"><option value="C">Celsius (°C)</option><option value="F">Fahrenheit (°F)</option></select></div>
            </div>
            <div class="field"><label class="label" for="hydration-humidity">Relative humidity (%)</label><input id="hydration-humidity" type="number" min="10" max="100" step="1" required></div>
            <div class="field-row">
              <div class="field"><label class="label" for="hydration-work">Outdoor work (minutes)</label><input id="hydration-work" type="number" min="0" max="480" step="5" value="0" required></div>
              <div class="field"><label class="label" for="hydration-exercise">Outdoor exercise (minutes)</label><input id="hydration-exercise" type="number" min="0" max="240" step="5" value="0" required></div>
            </div>
            <div class="button-row"><button class="btn btn-primary" type="submit">Build hydration plan</button><button class="btn btn-ghost" type="reset">Clear</button></div>${privacyNote}
          </form>
          ${empty('Enter temperature, humidity, and your active minutes to build a heat-aware plan.')}
        </div>
        <div class="notice info"><strong>How to use this estimate</strong>NIOSH advises about 1 cup (8 oz / 240 mL) of water every 15–20 minutes for moderate work in heat for under 2 hours. This planner uses the slower 20-minute interval and estimates only the first 2 hours. Longer or heavy work needs a planned work/rest and electrolyte strategy.</div>
        <div class="notice health-disclaimer"><strong>Do not overdrink</strong>NIOSH advises workers not to drink more than 48 oz (about 1.4 L) per hour. This is an upper limit, not a target. People with heart or kidney conditions or fluid restrictions should ask their clinician for personal advice.</div>
        ${referenceBlock('hydration', 'Humidity is included through the heat-index estimate. The drinking interval is not increased just because humidity is high: a larger water target is not a substitute for shade, cooling, rest, acclimatization or reducing exertion.')}
      `), title);
      const form = document.querySelector('#hydration-form');
      const unit = form.querySelector('#hydration-unit');
      const temperature = form.querySelector('#hydration-temperature');
      const result = document.querySelector('#health-result');
      const updateUnit = () => {
        form.querySelector('#hydration-unit-label').textContent = unit.value === 'F' ? '°F' : '°C';
        temperature.min = unit.value === 'F' ? '59' : '15';
        temperature.max = unit.value === 'F' ? '131' : '55';
      };
      unit.addEventListener('change', updateUnit);
      form.addEventListener('reset', () => window.setTimeout(() => {
        updateUnit();
        result.className = 'result-panel empty';
        result.innerHTML = '<div><div class="result-kicker">Your result</div><p>Enter temperature, humidity, and your active minutes to build a heat-aware plan.</p></div>';
      }, 0));
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        try {
          const reading = computeHeatIndexC(temperature.value, unit.value, form.querySelector('#hydration-humidity').value);
          const workMinutes = Number(form.querySelector('#hydration-work').value);
          const exerciseMinutes = Number(form.querySelector('#hydration-exercise').value);
          const totalMinutes = workMinutes + exerciseMinutes;
          const heat = reading.calculated ? reading.heatIndexC : null;
          const estimate = hydrationEstimate(heat, totalMinutes);
          let recommendation;
          if (estimate.mode === 'no-heat-target') {
            recommendation = 'The estimated heat index is below the PAGASA caution band. This tool does not set a daily water target; drink to thirst and follow your clinician’s advice.';
          } else if (estimate.mode === 'stop-and-cool') {
            recommendation = 'The heat index is in a PAGASA danger band. Do not rely on a hydration schedule to make outdoor work or exercise safe. Pause strenuous activity, move to a cooler place and follow local safety advice.';
          } else if (estimate.mode === 'no-activity') {
            recommendation = 'No active minutes were entered, so no activity-based amount is estimated. Heat exposure can still require rest, shade and access to water.';
          } else {
            recommendation = `For ${estimate.minutes} minutes of moderate activity, plan about ${number(estimate.millilitres / 1000, 2)} L total (${estimate.cups} × 240 mL cups), spaced roughly every 20 minutes.`;
            if (estimate.capped) recommendation += ' This covers only the first 2 hours; it is not a full-shift estimate.';
          }
          const bandText = reading.calculated ? estimate.band : 'Below caution';
          result.className = `result-panel health-result-panel${estimate.mode === 'stop-and-cool' ? ' health-result-danger' : ''}`;
          result.innerHTML = `<div><div class="result-kicker">Heat-aware planning estimate</div><div class="result-value">${reading.calculated ? `${number(reading.heatIndexC, 1)}°C` : 'Not calculated'}</div><span class="health-band health-band-${bandText.toLowerCase().replaceAll(' ', '-')}">${h(bandText)}</span><p class="explain">${recommendation}</p><div class="breakdown"><div><span>Outdoor work entered</span><strong>${number(workMinutes, 0)} min</strong></div><div><span>Outdoor exercise entered</span><strong>${number(exerciseMinutes, 0)} min</strong></div><div><span>Total active time</span><strong>${number(totalMinutes, 0)} min</strong></div>${estimate.mode === 'moderate-heat-plan' ? `<div><span>Estimated water for first ${estimate.minutes} min</span><strong>${number(estimate.millilitres / 1000, 2)} L</strong></div>` : ''}</div><p class="small muted">Heat risk is higher in direct sun, heavy clothing, poor ventilation, strenuous work or before acclimatization. Stop and cool down if you feel unwell.</p></div>`;
        } catch (error) {
          result.className = 'result-panel health-result-panel';
          result.innerHTML = errorResult(error.message);
        }
      });
      updateUnit();
    }

    function rice() {
      const title = 'Rice portion & calorie converter';
      shell(page(title, 'Convert cooked rice cups into approximate calories, compare a brown-rice swap or a half-rice plate, and optionally estimate cost in ₱.', `
        ${healthNote('Calorie values are food-database estimates, not a nutrition prescription. Rice variety, water absorbed, cooking method and measuring-cup size can change the result.')}
        <div class="tool-layout health-tool-layout">
          <form class="tool-card-shell" id="rice-form">
            <h2>Enter your cooked portion</h2><p class="subcopy">A standard measuring cup is 240 mL. A rice-cooker cup is often about 180 mL; check your cup because sizes vary.</p>
            <div class="field-row">
              <div class="field"><label class="label" for="rice-portion">Cooked portion (cups)</label><input id="rice-portion" type="number" min="0.25" max="10" step="0.25" value="1" required></div>
              <div class="field"><label class="label" for="rice-type">Rice type</label><select id="rice-type"><option value="white">White, long-grain</option><option value="brown">Brown, long-grain</option></select></div>
            </div>
            <div class="field"><label class="label" for="rice-cup-size">Cup size</label><select id="rice-cup-size"><option value="240">Standard measuring cup (240 mL)</option><option value="180">Rice-cooker cup (about 180 mL)</option></select></div>
            <div class="field"><label class="label" for="rice-price">Optional: local price for dry rice (₱ per kg)</label><div class="health-currency-input"><span aria-hidden="true">₱</span><input id="rice-price" type="number" inputmode="decimal" min="0" max="100000" step="0.01" placeholder="Leave blank to skip cost"></div><span class="field-error">Use the price from your local store; no market price is assumed.</span></div>
            <div class="button-row"><button class="btn btn-primary" type="submit">Convert portion</button><button class="btn btn-ghost" type="reset">Reset</button></div>${privacyNote}
          </form>
          ${empty('Enter your cooked rice portion to estimate calories and compare plate options.')}
        </div>
        <div class="health-grid-note health-rice-swaps">
          <article class="card"><span class="category-label">Brown rice</span><h3>Choose a whole grain</h3><p class="muted">Brown rice usually provides more fibre. It is not automatically lower in calories; cup weight and water absorption affect the comparison.</p></article>
          <article class="card"><span class="category-label">Half rice + vegetables</span><h3>Make room for vegetables</h3><p class="muted">Try half your usual rice portion with extra non-starchy vegetables. The calorie estimate counts rice only; vegetables, sauce and oil are not included.</p></article>
        </div>
        ${referenceBlock('rice', 'Reference values used: about 205 kcal per USDA cup (158 g) of cooked white long-grain rice and 248 kcal per USDA cup (202 g) of cooked long-grain brown rice. The different gram weights explain why volume-based comparisons may surprise. Optional cost uses USDA dry-to-cooked yield estimates (about 7 cooked cups/lb white and 5.5 cups/lb brown); actual local yield varies.')}
      `), title);
      const form = document.querySelector('#rice-form');
      const result = document.querySelector('#health-result');
      form.addEventListener('reset', () => window.setTimeout(() => {
        result.className = 'result-panel empty';
        result.innerHTML = '<div><div class="result-kicker">Your result</div><p>Enter your cooked rice portion to estimate calories and compare plate options.</p></div>';
      }, 0));
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        try {
          const priceValue = form.querySelector('#rice-price').value.trim();
          const resultData = riceEstimate({
            cups: form.querySelector('#rice-portion').value,
            rice: form.querySelector('#rice-type').value,
            cupMillilitres: form.querySelector('#rice-cup-size').value,
            pricePerKg: priceValue === '' ? null : priceValue
          });
          const riceName = resultData.rice === 'white' ? 'white long-grain' : 'brown long-grain';
          const alternateName = resultData.alternateRice === 'white' ? 'white long-grain' : 'brown long-grain';
          const calories = Math.round(resultData.calories);
          const alternateCalories = Math.round(resultData.alternateCalories);
          const halfCalories = Math.round(resultData.halfPortionCalories);
          const priceSummary = resultData.pricePerServing === null ? '' : `<div><span>Estimated rice cost for this portion</span><strong>${h(new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(resultData.pricePerServing))}</strong></div>`;
          result.className = 'result-panel health-result-panel';
          result.innerHTML = `<div><div class="result-kicker">Estimated calories from rice</div><div class="result-value">${number(calories, 0)} kcal</div><h2>${number(resultData.portionCups, 2)} ${resultData.cupMillilitres === 180 ? 'rice-cooker' : 'standard'} cup${resultData.portionCups === 1 ? '' : 's'} of ${riceName}</h2><div class="breakdown"><div><span>Same volume of ${alternateName}</span><strong>About ${number(alternateCalories, 0)} kcal</strong></div><div><span>Half this rice portion</span><strong>About ${number(halfCalories, 0)} kcal</strong></div>${priceSummary}</div><p class="explain">Half rice with extra non-starchy vegetables is one possible plate change. Vegetable calories are not included. Brown rice is a fibre-rich whole-grain option, not a guaranteed calorie reduction.</p><p class="small muted">Cup-based values are estimates. Weighing cooked rice in grams gives a more precise portion comparison.</p></div>`;
        } catch (error) {
          result.className = 'result-panel health-result-panel';
          result.innerHTML = errorResult(error.message);
        }
      });
    }

    return { bmi, diabetes, hypertension, heatIndex, hydration, rice };
  }

  const api = {
    create,
    computeBMI,
    waistToCm,
    hasElevatedAsianWaist,
    computeHeatIndexC,
    pagasaHeatBand,
    hydrationEstimate,
    riceEstimate,
    constants: { LB_TO_KG, IN_TO_CM, STANDARD_CUP_ML, RICE_REFERENCE }
  };
  root.PHHealthTools = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
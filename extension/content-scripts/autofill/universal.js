/**
 * Resumit — Universal Autofill Engine
 * Works on Workday, Greenhouse, Lever, LinkedIn Easy Apply, and any job application form.
 *
 * Strategy:
 * 1. Platform-specific selectors (most reliable)
 * 2. data-automation-id matching (Workday)
 * 3. Label text → input semantic matching (universal)
 * 4. Placeholder / name / id attribute matching (generic fallback)
 */

(function () {
  'use strict';

  // ── Entry point ─────────────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'AUTOFILL') {
      runAutofill(msg.payload)
        .then(() => sendResponse({ ok: true }))
        .catch((err) => sendResponse({ ok: false, error: err.message }));
      return true; // keep channel open for async
    }
  });

  // ── Field fill helpers ──────────────────────────────────────────────────────

  /** Fill a native or React-managed input. */
  function fillInput(el, value) {
    if (!el || value === undefined || value === null || value === '') return false;
    el.focus();
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
      || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;

    if (nativeSetter) {
      nativeSetter.call(el, value);
    } else {
      el.value = value;
    }

    ['input', 'change', 'blur', 'keyup'].forEach((evName) => {
      el.dispatchEvent(new Event(evName, { bubbles: true }));
    });
    el.dispatchEvent(new InputEvent('input', { bubbles: true, data: value }));
    return true;
  }

  /** Fill a textarea (same as input but uses textarea prototype). */
  function fillTextarea(el, value) {
    if (!el || !value) return false;
    el.focus();
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    if (nativeSetter) nativeSetter.call(el, value);
    else el.value = value;
    ['input', 'change', 'blur'].forEach((ev) => el.dispatchEvent(new Event(ev, { bubbles: true })));
    return true;
  }

  /** Click a radio/checkbox option whose label matches the target text. */
  function clickOptionByLabel(container, targetTexts) {
    const labels = Array.from((container || document).querySelectorAll('label, [role="radio"], [role="option"]'));
    for (const lbl of labels) {
      const text = (lbl.textContent || '').toLowerCase().trim();
      if (targetTexts.some((t) => text.includes(t.toLowerCase()))) {
        const input = lbl.querySelector('input') || lbl;
        input.click();
        return true;
      }
    }
    return false;
  }

  /** Select a <select> option by value or text. */
  function selectOption(el, targetTexts) {
    if (!el) return false;
    const opts = Array.from(el.options);
    for (const opt of opts) {
      const t = opt.text.toLowerCase();
      if (targetTexts.some((v) => t.includes(v.toLowerCase()))) {
        el.value = opt.value;
        ['change', 'input'].forEach((ev) => el.dispatchEvent(new Event(ev, { bubbles: true })));
        return true;
      }
    }
    return false;
  }

  // ── Label → field matching ──────────────────────────────────────────────────

  /**
   * Find an input associated with a label that contains any of the given keywords.
   */
  function findInputByLabel(keywords, { root = document, type = 'input,textarea,select' } = {}) {
    const labels = Array.from(root.querySelectorAll('label, [class*="label"], [class*="Label"], .field-name, .form-label'));
    for (const lbl of labels) {
      const text = (lbl.textContent || lbl.innerText || '').toLowerCase().trim();
      if (!keywords.some((kw) => text.includes(kw.toLowerCase()))) continue;

      // Method 1: htmlFor attribute
      if (lbl.htmlFor) {
        const el = document.getElementById(lbl.htmlFor);
        if (el) return el;
      }

      // Method 2: label wraps input
      const child = lbl.querySelector(type);
      if (child) return child;

      // Method 3: label is immediately before input in DOM
      const parent = lbl.parentElement;
      if (parent) {
        const sibling = parent.querySelector(type);
        if (sibling) return sibling;
      }

      // Method 4: aria-labelledby reverse lookup
      if (lbl.id) {
        const el = root.querySelector(`[aria-labelledby*="${lbl.id}"]`);
        if (el) return el;
      }
    }
    return null;
  }

  /**
   * Find inputs by common attributes (name, id, placeholder, autocomplete).
   */
  function findInputByAttrs(attrs, root = document) {
    const selectors = attrs.flatMap((attr) => [
      `input[name*="${attr}" i]`,
      `input[id*="${attr}" i]`,
      `input[placeholder*="${attr}" i]`,
      `input[autocomplete="${attr}"]`,
      `textarea[name*="${attr}" i]`,
      `textarea[placeholder*="${attr}" i]`,
    ]);
    for (const sel of selectors) {
      try {
        const el = root.querySelector(sel);
        if (el) return el;
      } catch (_) {}
    }
    return null;
  }

  /** Workday: find by data-automation-id */
  function findWorkday(automationId, root = document) {
    return root.querySelector(`[data-automation-id="${automationId}"] input`)
      || root.querySelector(`[data-automation-id="${automationId}"]`);
  }

  // ── Platform detection ──────────────────────────────────────────────────────

  function detectPlatform() {
    const url = location.href.toLowerCase();
    if (url.includes('myworkdayjobs.com') || url.includes('workday.com')) return 'workday';
    if (url.includes('greenhouse.io') || url.includes('boards.greenhouse.io')) return 'greenhouse';
    if (url.includes('lever.co')) return 'lever';
    if (url.includes('linkedin.com')) return 'linkedin';
    if (url.includes('wellfound.com') || url.includes('angel.co')) return 'wellfound';
    if (url.includes('ashbyhq.com')) return 'ashby';
    return 'generic';
  }

  // ── Platform-specific fillers ───────────────────────────────────────────────

  async function fillWorkday(fields) {
    const { firstName, lastName, email, phone, address, city, state, country, linkedIn, github, yearsExp } = fields;

    const attempts = [
      // Personal info
      () => fillInput(findWorkday('legalNameSection_firstName') || findInputByLabel(['first name', 'legal first'], {}), firstName),
      () => fillInput(findWorkday('legalNameSection_lastName') || findInputByLabel(['last name', 'legal last', 'surname'], {}), lastName),
      () => fillInput(findWorkday('email') || findInputByAttrs(['email']), email),
      () => fillInput(findWorkday('phone') || findInputByLabel(['phone', 'mobile', 'telephone'], {}), phone),

      // Address
      () => fillInput(findWorkday('addressSection_addressLine1') || findInputByLabel(['street', 'address line 1', 'address 1'], {}), address),
      () => fillInput(findWorkday('addressSection_city') || findInputByLabel(['city'], {}), city),
      () => fillInput(findWorkday('addressSection_postalCode') || findInputByLabel(['zip', 'postal', 'post code'], {}), fields.zip),

      // Work authorization — click "Yes" for "authorized to work"
      () => clickOptionByLabel(document.querySelector('[data-automation-id*="workAuth"], [data-automation-id*="authorized"]'), ['yes']),

      // "Are you a veteran?" — No
      () => clickOptionByLabel(document.querySelector('[data-automation-id*="veteran"]'), ['no', "i'm not"]),

      // LinkedIn / Website
      () => fillInput(findInputByLabel(['linkedin', 'linked in', 'profile url', 'website'], {}), linkedIn || github),

      // Experience years (text field sometimes)
      () => {
        if (!yearsExp) return;
        const el = findInputByLabel(['years of experience', 'years experience', 'total experience'], {});
        if (el) fillInput(el, String(yearsExp));
      },

      // Cover letter / summary textarea
      () => {
        const ta = document.querySelector('textarea[data-automation-id="coverLetter"]')
          || document.querySelector('textarea[placeholder*="cover" i]');
        if (ta && fields.summary) fillTextarea(ta, fields.summary);
      },
    ];

    for (const attempt of attempts) {
      try { attempt(); } catch (_) {}
      await sleep(80);
    }

    // Handle dropdowns with custom Workday UI
    await fillWorkdayDropdowns(fields);
  }

  async function fillWorkdayDropdowns(fields) {
    // Country dropdown
    if (fields.country) {
      const countryBtn = document.querySelector('[data-automation-id="addressSection_country"] button, [data-automation-id="country"] button');
      if (countryBtn) {
        countryBtn.click();
        await sleep(400);
        const opts = document.querySelectorAll('[role="option"], [data-automation-id*="option"]');
        for (const opt of opts) {
          if (opt.textContent?.toLowerCase().includes(fields.country.toLowerCase())) {
            opt.click();
            break;
          }
        }
      }
    }

    // Phone country code
    const phoneCodeBtn = document.querySelector('[data-automation-id="phoneType"] button, [data-automation-id="phoneCountryCode"] button');
    if (phoneCodeBtn && fields.phoneCode) {
      phoneCodeBtn.click();
      await sleep(400);
      const opts = document.querySelectorAll('[role="option"]');
      for (const opt of opts) {
        if (opt.textContent?.includes(fields.phoneCode)) {
          opt.click();
          break;
        }
      }
    }
  }

  async function fillGreenhouse(fields) {
    const { firstName, lastName, email, phone, linkedIn, github, resumeUrl } = fields;

    const map = [
      { attrs: ['first_name', 'firstname', 'first-name'], labels: ['first name'], value: firstName },
      { attrs: ['last_name', 'lastname', 'last-name'], labels: ['last name', 'surname'], value: lastName },
      { attrs: ['email'], labels: ['email'], value: email },
      { attrs: ['phone'], labels: ['phone', 'mobile', 'telephone'], value: phone },
      { attrs: ['linkedin_profile', 'linkedin'], labels: ['linkedin', 'linkedin profile'], value: linkedIn },
      { attrs: ['website', 'github', 'portfolio'], labels: ['website', 'github', 'portfolio'], value: github || linkedIn },
    ];

    for (const { attrs, labels, value } of map) {
      if (!value) continue;
      const el = findInputByAttrs(attrs) || findInputByLabel(labels, {});
      fillInput(el, value);
      await sleep(60);
    }

    // Work authorization radio
    await sleep(200);
    clickOptionByLabel(null, ['yes', "i am authorized", "authorized to work"]);
  }

  async function fillLever(fields) {
    const { firstName, lastName, email, phone, linkedIn, github } = fields;
    const fullName = [firstName, lastName].filter(Boolean).join(' ');

    const map = [
      { attrs: ['name', 'full-name', 'fullname', 'full_name'], labels: ['full name', 'name'], value: fullName },
      { attrs: ['email'], labels: ['email'], value: email },
      { attrs: ['phone'], labels: ['phone', 'mobile'], value: phone },
      { attrs: ['linkedin', 'linkedin-profile'], labels: ['linkedin'], value: linkedIn },
      { attrs: ['github', 'portfolio', 'website'], labels: ['github', 'website', 'portfolio'], value: github || linkedIn },
    ];

    for (const { attrs, labels, value } of map) {
      if (!value) continue;
      const el = findInputByAttrs(attrs) || findInputByLabel(labels, {});
      fillInput(el, value);
      await sleep(60);
    }
  }

  async function fillLinkedIn(fields) {
    const { firstName, lastName, email, phone } = fields;

    // Easy Apply modal
    const modal = document.querySelector('.jobs-easy-apply-content, .artdeco-modal');
    if (!modal) return;

    const map = [
      { labels: ['first name'], value: firstName },
      { labels: ['last name'], value: lastName },
      { labels: ['email', 'email address'], value: email },
      { labels: ['phone', 'mobile phone', 'phone number'], value: phone },
    ];

    for (const { labels, value } of map) {
      if (!value) continue;
      const el = findInputByLabel(labels, { root: modal });
      if (el) fillInput(el, value);
      await sleep(80);
    }

    // Name/ID based fallback
    fillInput(modal.querySelector('input[name="firstName"]'), firstName);
    fillInput(modal.querySelector('input[name="lastName"]'), lastName);
    fillInput(modal.querySelector('input[name="phoneNumber"]'), phone);
  }

  async function fillGeneric(fields) {
    const { firstName, lastName, email, phone, linkedIn, github, address, city, state, zip, country, summary } = fields;
    const fullName = [firstName, lastName].filter(Boolean).join(' ');

    const genericMap = [
      { labels: ['first name', 'given name', 'legal first'], attrs: ['first_name', 'firstname', 'given-name', 'fname'], value: firstName },
      { labels: ['last name', 'family name', 'surname', 'legal last'], attrs: ['last_name', 'lastname', 'family-name', 'lname'], value: lastName },
      { labels: ['full name', 'your name', 'name'], attrs: ['name', 'full_name', 'fullname'], value: fullName },
      { labels: ['email', 'email address', 'e-mail'], attrs: ['email', 'email_address', 'e-mail'], value: email },
      { labels: ['phone', 'phone number', 'mobile', 'telephone', 'cell'], attrs: ['phone', 'telephone', 'mobile', 'cell'], value: phone },
      { labels: ['linkedin', 'linkedin profile', 'linkedin url'], attrs: ['linkedin', 'linkedin_url'], value: linkedIn },
      { labels: ['github', 'github url', 'code portfolio'], attrs: ['github', 'github_url'], value: github },
      { labels: ['portfolio', 'website', 'personal website'], attrs: ['portfolio', 'website', 'personal_website'], value: linkedIn || github },
      { labels: ['street address', 'address line 1', 'address'], attrs: ['address', 'street', 'address_line1'], value: address },
      { labels: ['city'], attrs: ['city'], value: city },
      { labels: ['state', 'province', 'region'], attrs: ['state', 'province'], value: state },
      { labels: ['zip', 'postal code', 'post code'], attrs: ['zip', 'postal_code', 'postcode'], value: zip },
      { labels: ['country'], attrs: ['country'], value: country },
      { labels: ['cover letter', 'summary', 'additional information', 'tell us about yourself'], attrs: ['cover_letter', 'message', 'summary'], value: summary, isTextarea: true },
    ];

    let filledCount = 0;
    for (const { labels, attrs, value, isTextarea } of genericMap) {
      if (!value) continue;
      const el = findInputByLabel(labels, {}) || findInputByAttrs(attrs);
      if (!el) continue;

      if (isTextarea || el.tagName === 'TEXTAREA') {
        fillTextarea(el, value);
      } else if (el.tagName === 'SELECT') {
        selectOption(el, [value]);
      } else {
        fillInput(el, value);
      }
      filledCount++;
      await sleep(80);
    }

    // Work auth questions — almost every site has these
    await fillWorkAuthQuestions();

    return filledCount;
  }

  /** Universal work authorization + EEOC question handler */
  async function fillWorkAuthQuestions() {
    const authKeywords = [
      'authorized to work', 'legally authorized', 'work authorization',
      'eligible to work', 'right to work', 'permitted to work', 'visa', 'sponsorship',
    ];
    const yesKeywords = ['yes'];
    const noKeywords = ['no'];

    // Find all fieldsets/question containers
    const containers = document.querySelectorAll('fieldset, [role="group"], [class*="question"], [class*="Question"]');
    for (const container of containers) {
      const label = (container.querySelector('legend, [class*="label"], h3, h4, p')?.textContent || '').toLowerCase();

      // Work authorization — answer YES
      if (authKeywords.some((k) => label.includes(k))) {
        clickOptionByLabel(container, yesKeywords);
        await sleep(100);
      }

      // Sponsorship required — answer NO (US-centric)
      if (label.includes('require') && label.includes('sponsor')) {
        clickOptionByLabel(container, noKeywords);
        await sleep(100);
      }

      // Veteran status — "I am not a veteran" or "No"
      if (label.includes('veteran') || label.includes('military')) {
        clickOptionByLabel(container, ['not a veteran', 'i choose not', 'decline', 'no', 'prefer not']);
        await sleep(100);
      }

      // Disability — "prefer not to say" or "No"
      if (label.includes('disability') || label.includes('disabled')) {
        clickOptionByLabel(container, ['no', 'not disabled', 'prefer not', 'choose not', 'decline']);
        await sleep(100);
      }

      // Race / ethnicity — "prefer not to disclose"
      if (label.includes('race') || label.includes('ethnicity') || label.includes('gender')) {
        clickOptionByLabel(container, ['prefer not', 'choose not', 'decline', 'do not wish']);
        await sleep(100);
      }
    }

    // Handle dropdowns (<select>) for the same questions
    document.querySelectorAll('select').forEach((sel) => {
      const label = sel.closest('label, div, fieldset')?.textContent?.toLowerCase() || '';
      if (authKeywords.some((k) => label.includes(k))) {
        selectOption(sel, ['yes']);
      }
      if (label.includes('veteran')) {
        selectOption(sel, ['not a veteran', 'no', 'prefer not']);
      }
      if (label.includes('disability')) {
        selectOption(sel, ['no', 'not', 'prefer not']);
      }
    });
  }

  // ── Main autofill orchestrator ──────────────────────────────────────────────

  async function runAutofill(fields) {
    const platform = detectPlatform();
    console.log(`[Resumit Autofill] Platform: ${platform}`, fields);

    // Run platform specific filler
    switch (platform) {
      case 'workday':  await fillWorkday(fields); break;
      case 'greenhouse': await fillGreenhouse(fields); break;
      case 'lever':    await fillLever(fields); break;
      case 'linkedin': await fillLinkedIn(fields); break;
      default:         await fillGeneric(fields); break;
    }

    // Always run generic as a catch-all pass (fills anything the platform-specific missed)
    if (platform !== 'generic') {
      await sleep(200);
      await fillGeneric(fields);
    }

    // Final: highlight filled fields with a subtle green glow
    document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea').forEach((el) => {
      if (el.value && el.value.length > 1) {
        el.style.transition = 'box-shadow 0.3s';
        el.style.boxShadow = '0 0 0 2px rgba(20,184,166,0.4)';
        setTimeout(() => { el.style.boxShadow = ''; }, 2000);
      }
    });
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
})();

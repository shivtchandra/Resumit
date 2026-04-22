/**
 * Resumit Extension — Service Worker (Background)
 * Handles: extension icon click → open side panel, auth token cache, messaging hub
 */

const RESUMIT_API = 'https://resumit.onrender.com';
const DEV_API = 'http://localhost:8000';

// Use dev API if running unpacked in dev mode
const getApiBase = () => RESUMIT_API;

/**
 * Side panel, popup, and other extension pages do NOT get sender.tab.
 * Always fall back to the current active tab in the focused window.
 */
async function getTargetTabId(sender) {
  if (sender?.tab?.id != null) return sender.tab.id;
  let tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tabs[0]?.id) return tabs[0].id;
  tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.id;
}

// ── Side panel: open on icon click ──────────────────────────────────────────
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error);

// ── Message hub ─────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case 'GET_JD':
      (async () => {
        const tabId = await getTargetTabId(sender);
        await handleGetJD(tabId, sendResponse);
      })();
      return true; // async

    case 'ANALYZE':
      handleAnalyze(msg.payload, sendResponse);
      return true;

    case 'GET_RESUMES':
      handleGetResumes(sendResponse);
      return true;

    case 'AUTOFILL':
      (async () => {
        const tabId = await getTargetTabId(sender);
        await handleAutofill(tabId, msg.payload, sendResponse);
      })();
      return true;

    case 'DETECT_QUESTIONS':
      (async () => {
        const tabId = await getTargetTabId(sender);
        await handleDetectQuestions(tabId, sendResponse);
      })();
      return true;

    case 'FILL_ANSWERS':
      (async () => {
        const tabId = await getTargetTabId(sender);
        await handleFillAnswers(tabId, msg.payload, sendResponse);
      })();
      return true;

    case 'SET_TOKEN':
      chrome.storage.local.set({ authToken: msg.token, user: msg.user });
      sendResponse({ ok: true });
      break;

    case 'GET_TOKEN':
      chrome.storage.local.get(['authToken', 'user'], (res) => {
        sendResponse({ token: res.authToken, user: res.user });
      });
      return true;

    case 'SIGN_OUT':
      chrome.storage.local.remove(['authToken', 'user']);
      sendResponse({ ok: true });
      break;
  }
});

// ── JD Extraction ───────────────────────────────────────────────────────────
async function handleGetJD(tabId, sendResponse) {
  if (!tabId) { sendResponse({ jd: null }); return; }
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: extractJDFromPage,
    });
    sendResponse({ jd: result?.result ?? null });
  } catch (e) {
    sendResponse({ jd: null, error: e.message });
  }
}

// Injected into the active tab to extract JD text
function extractJDFromPage() {
  const url = window.location.href;

  const selectors = {
    // LinkedIn
    linkedin: [
      '.jobs-description__content .jobs-box__html-content',
      '.job-view-layout .jobs-description-content__text',
      '.jobs-description',
    ],
    // Indeed
    indeed: [
      '#jobDescriptionText',
      '.jobsearch-jobDescriptionText',
    ],
    // Greenhouse
    greenhouse: [
      '#content .section-wrapper',
      '#app_body .section-wrapper',
    ],
    // Lever
    lever: [
      '.posting-description',
      '.section-wrapper.page-full-width',
    ],
    // Workday
    workday: [
      '[data-automation-id="jobPostingDescription"]',
      '.wd-popup-content',
    ],
  };

  let platform = 'unknown';
  if (url.includes('linkedin.com')) platform = 'linkedin';
  else if (url.includes('indeed.com')) platform = 'indeed';
  else if (url.includes('greenhouse.io')) platform = 'greenhouse';
  else if (url.includes('lever.co')) platform = 'lever';
  else if (url.includes('workday.com') || url.includes('myworkdayjobs.com')) platform = 'workday';

  const trySelectors = selectors[platform] || [];

  for (const sel of trySelectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText.trim().length > 80) {
      return el.innerText.trim();
    }
  }

  // Fallback: grab largest text block on page
  const candidates = Array.from(document.querySelectorAll('div, section, article'))
    .filter(el => {
      const txt = el.innerText?.trim();
      return txt && txt.length > 300 && txt.length < 15000;
    })
    .sort((a, b) => b.innerText.length - a.innerText.length);

  return candidates[0]?.innerText?.trim() ?? null;
}

// ── Analysis ────────────────────────────────────────────────────────────────
async function handleAnalyze({ resumeText, jobDescription, token }, sendResponse) {
  try {
    const formData = new FormData();
    // Pass resume as text blob
    const blob = new Blob([resumeText], { type: 'text/plain' });
    formData.append('file', blob, 'resume.txt');
    formData.append('job_description', jobDescription);
    formData.append('source', 'extension');

    const res = await fetch(`${getApiBase()}/api/v1/analyze`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    sendResponse({ ok: true, data });
  } catch (e) {
    sendResponse({ ok: false, error: e.message });
  }
}

// ── Resume List ──────────────────────────────────────────────────────────────
async function handleGetResumes(sendResponse) {
  const { authToken } = await chrome.storage.local.get('authToken');
  if (!authToken) { sendResponse({ resumes: [] }); return; }

  try {
    const res = await fetch(`${getApiBase()}/api/v1/users/resumes`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();
    sendResponse({ resumes: data.resumes ?? [] });
  } catch (e) {
    sendResponse({ resumes: [], error: e.message });
  }
}

// ── Auto-fill ────────────────────────────────────────────────────────────────
async function handleAutofill(tabId, payload, sendResponse) {
  if (!tabId) { sendResponse({ ok: false }); return; }
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: doAutofill,
      args: [payload],
    });
    sendResponse({ ok: true });
  } catch (e) {
    sendResponse({ ok: false, error: e.message });
  }
}

function doAutofill(fields) {
  function setNativeValue(el, value) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    )?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function fillByLabel(labelText, value) {
    const labels = Array.from(document.querySelectorAll('label'));
    const label = labels.find(l =>
      l.innerText.toLowerCase().includes(labelText.toLowerCase())
    );
    if (label) {
      const target = label.control || document.getElementById(label.htmlFor);
      if (target && value) setNativeValue(target, value);
    }
  }

  function fillByPlaceholder(ph, value) {
    const el = document.querySelector(`input[placeholder*="${ph}" i], textarea[placeholder*="${ph}" i]`);
    if (el && value) setNativeValue(el, value);
  }

  function fillByAttr(attr, val, value) {
    const el = document.querySelector(`[${attr}*="${val}" i]`);
    if (el && value) setNativeValue(el, value);
  }

  const { firstName, lastName, email, phone, linkedIn, github, currentCompany, location } = fields;

  fillByLabel('first name', firstName);
  fillByLabel('last name', lastName);
  fillByLabel('email', email);
  fillByLabel('phone', phone);
  fillByLabel('linkedin', linkedIn);
  fillByLabel('github', github);
  fillByLabel('current company', currentCompany);
  fillByLabel('location', location);
  fillByLabel('city', location);

  fillByPlaceholder('first name', firstName);
  fillByPlaceholder('last name', lastName);
  fillByPlaceholder('email', email);
  fillByPlaceholder('phone', phone);

  fillByAttr('name', 'firstName', firstName);
  fillByAttr('name', 'lastName', lastName);
  fillByAttr('name', 'email', email);
  fillByAttr('name', 'phone', phone);
  fillByAttr('name', 'phoneNumber', phone);
  fillByAttr('data-automation-id', 'legalNameSection_firstName', firstName);
  fillByAttr('data-automation-id', 'legalNameSection_lastName', lastName);
  fillByAttr('data-automation-id', 'email', email);
  fillByAttr('data-automation-id', 'phone-device-type', phone);
}

// ── Question Detection ───────────────────────────────────────────────────────
async function handleDetectQuestions(tabId, sendResponse) {
  if (!tabId) { sendResponse({ questions: [] }); return; }
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: detectOpenEndedQuestions,
    });
    sendResponse({ questions: result?.result ?? [] });
  } catch (e) {
    sendResponse({ questions: [], error: e.message });
  }
}

function detectOpenEndedQuestions() {
  const results = [];

  // Find all textareas and multi-line inputs that look like open-ended questions
  const textareas = Array.from(document.querySelectorAll('textarea'));

  // Also find text inputs near question-like labels
  const inputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])'));

  const questionKeywords = [
    'why', 'what', 'how', 'describe', 'tell us', 'explain', 'share',
    'experience', 'project', 'accomplish', 'achieve', 'motivated', 'passion',
    'challenge', 'strength', 'weakness', 'goal', 'background', 'story',
    'interest', 'contribute', 'skill', 'work', 'role', 'company',
  ];

  function isQuestionLike(text) {
    if (!text || text.length < 10) return false;
    const lower = text.toLowerCase();
    return questionKeywords.some(kw => lower.includes(kw)) || lower.includes('?');
  }

  function getLabelForElement(el) {
    // Try explicit label association
    const id = el.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.innerText.trim();
    }
    // Try wrapping label
    const parent = el.closest('label');
    if (parent) return parent.innerText.replace(el.value || '', '').trim();
    // Try preceding sibling / parent text
    const container = el.closest('div, li, fieldset, section');
    if (container) {
      const labels = container.querySelectorAll('label, legend, .label, [class*="label"], [class*="question"], h3, h4, p');
      for (const lbl of labels) {
        const txt = lbl.innerText.trim();
        if (txt.length > 8) return txt;
      }
      // Try aria-label
      const ariaLabel = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
      if (ariaLabel) {
        const ref = document.getElementById(ariaLabel);
        return ref ? ref.innerText.trim() : ariaLabel;
      }
    }
    return el.placeholder || null;
  }

  function makeSelector(el) {
    if (el.id) return `#${CSS.escape(el.id)}`;
    if (el.name) return `[name="${el.name}"]`;
    // Fall back to position-based index
    const all = Array.from(document.querySelectorAll(el.tagName.toLowerCase()));
    const idx = all.indexOf(el);
    return `${el.tagName.toLowerCase()}:nth-of-type(${idx + 1})`;
  }

  for (const el of textareas) {
    const label = getLabelForElement(el);
    if (isQuestionLike(label) || isQuestionLike(el.placeholder)) {
      results.push({
        question: label || el.placeholder || 'Open-ended question',
        selector: makeSelector(el),
        currentValue: el.value,
      });
    }
  }

  // For short text inputs, only include if the label is clearly a question
  for (const el of inputs) {
    const label = getLabelForElement(el);
    if (label && label.includes('?') && label.length > 15) {
      results.push({
        question: label,
        selector: makeSelector(el),
        currentValue: el.value,
      });
    }
  }

  return results;
}

// ── Fill Answers ─────────────────────────────────────────────────────────────
async function handleFillAnswers(tabId, answers, sendResponse) {
  if (!tabId) { sendResponse({ ok: false }); return; }
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: doFillAnswers,
      args: [answers],
    });
    sendResponse({ ok: true });
  } catch (e) {
    sendResponse({ ok: false, error: e.message });
  }
}

function doFillAnswers(answers) {
  function setNativeValue(el, value) {
    const proto = el.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) {
      setter.call(el, value);
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  for (const { selector, answer } of answers) {
    try {
      const el = document.querySelector(selector);
      if (el) setNativeValue(el, answer);
    } catch (_) {}
  }
}

/**
 * Resumit — Greenhouse Autofill Content Script
 */
(function () {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'AUTOFILL_GREENHOUSE') {
      fillGreenhouse(msg.payload);
    }
  });

  function setNativeValue(el, value) {
    if (!el || !value) return;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function fillGreenhouse(fields) {
    const { firstName, lastName, email, phone, linkedIn } = fields;

    const map = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
    };

    Object.entries(map).forEach(([id, value]) => {
      const el = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
      setNativeValue(el, value);
    });

    // LinkedIn URL field
    if (linkedIn) {
      const liField = document.querySelector('input[type="url"]') || document.querySelector('input[placeholder*="LinkedIn" i]');
      setNativeValue(liField, linkedIn);
    }
  }
})();

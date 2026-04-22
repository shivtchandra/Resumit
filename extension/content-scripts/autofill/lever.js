/**
 * Resumit — Lever Autofill Content Script
 */
(function () {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'AUTOFILL_LEVER') {
      fillLever(msg.payload);
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

  function fillLever(fields) {
    const { firstName, lastName, email, phone, linkedIn } = fields;

    // Lever uses placeholder/name attributes
    const tryFillByPlaceholder = (ph, value) => {
      if (!value) return;
      const el = document.querySelector(`input[placeholder*="${ph}" i], textarea[placeholder*="${ph}" i]`);
      setNativeValue(el, value);
    };

    const tryFillByName = (name, value) => {
      if (!value) return;
      const el = document.querySelector(`input[name="${name}"]`);
      setNativeValue(el, value);
    };

    tryFillByName('name', `${firstName || ''} ${lastName || ''}`.trim());
    tryFillByPlaceholder('full name', `${firstName || ''} ${lastName || ''}`.trim());
    tryFillByName('email', email);
    tryFillByPlaceholder('email', email);
    tryFillByName('phone', phone);
    tryFillByPlaceholder('phone', phone);

    if (linkedIn) {
      tryFillByPlaceholder('linkedin', linkedIn);
      tryFillByPlaceholder('url', linkedIn);
    }
  }
})();

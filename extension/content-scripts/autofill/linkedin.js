/**
 * Resumit — LinkedIn Autofill Content Script
 * Listens for AUTOFILL messages from the background worker and fills Easy Apply fields.
 */
(function () {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'AUTOFILL_LINKEDIN') {
      fillLinkedIn(msg.payload);
    }
  });

  function setReactInput(el, value) {
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (nativeSetter) {
      nativeSetter.call(el, value);
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function fillLinkedIn(fields) {
    const { firstName, lastName, email, phone } = fields;

    const tryFill = (selector, value) => {
      if (!value) return;
      const el = document.querySelector(selector);
      if (el) setReactInput(el, value);
    };

    // LinkedIn Easy Apply modal field selectors
    tryFill('input[name="firstName"]', firstName);
    tryFill('input[name="lastName"]', lastName);
    tryFill('input[name="email"]', email);
    tryFill('input[name="phoneNumber"]', phone);

    // Fallback: label-based
    document.querySelectorAll('.jobs-easy-apply-form-section__form-element input').forEach(input => {
      const label = input.closest('.form-group')?.querySelector('label')?.innerText?.toLowerCase() || '';
      if (label.includes('first') && firstName) setReactInput(input, firstName);
      if (label.includes('last') && lastName) setReactInput(input, lastName);
      if (label.includes('email') && email) setReactInput(input, email);
      if (label.includes('phone') && phone) setReactInput(input, phone);
    });
  }
})();

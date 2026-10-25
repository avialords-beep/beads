const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/;

export function isVitrioEmail(value) {
  const email = String(value ?? '').trim();
  return email.length <= 254 && EMAIL_PATTERN.test(email);
}

// Components with their own validation must not receive a second error or input contour.
const fieldSelector = 'input[type="email"]:not([readonly]):not([disabled]):not([data-email-validation="component"])';
const actionSelector = [
  'button[type="submit"]',
  'button[data-method]',
  'button[data-payment]',
  'button[data-payment-method]',
  'button[data-payment-review]',
  'button[data-checkout-method]',
  '.scratch-payment-method',
  '.bp-pay',
  '.payment-button',
  '.robux-payment',
  '.gifts-payment-button',
  '.ld-checkout-pay',
  '.looks-pay-cta',
  '.ai-payment-button',
  '.primary-action--checkout',
].join(',');

function fieldRoot(input) {
  return input.closest('label, .field, .auth-field, .robux-field, .bp-receipt-email, .checkout-receipt') || input.parentElement || input;
}

function errorNode(input) {
  const root = fieldRoot(input);
  let node = root.querySelector(':scope > .vitrio-email-error, :scope > [id*="email-error"], :scope > [class*="email-error"]');
  if (!node) {
    node = document.createElement('p');
    node.className = 'vitrio-email-error';
    node.id = `vitrio-email-error-${Math.random().toString(36).slice(2, 9)}`;
    node.setAttribute('role', 'status');
    node.setAttribute('aria-live', 'polite');
    root.insertBefore(node, input.nextElementSibling);
  }
  const describedBy = new Set((input.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
  describedBy.add(node.id);
  input.setAttribute('aria-describedby', [...describedBy].join(' '));
  return node;
}

function relatedActions(input) {
  const form = input.form;
  if (form) return [...form.querySelectorAll(actionSelector)];
  const section = input.closest('.checkout, .checkout-page, .gu-scroll, .gu-dock, .bp-shell, .robux-page, .robux-layout, main, #root');
  return section ? [...section.querySelectorAll(actionSelector)] : [];
}

function validate(input, {announce = false} = {}) {
  if (!input || input.matches('[readonly], [disabled]')) return true;
  const value = String(input.value || '').trim();
  const required = input.required;
  const invalid = value ? !isVitrioEmail(value) : required && announce;
  const touched = input.dataset.vitrioEmailTouched === 'true';
  const visible = invalid || (touched && required && !value);
  const root = fieldRoot(input);
  root.classList.toggle('vitrio-email-field', true);
  root.classList.toggle('vitrio-email-invalid', visible);
  const ariaInvalid = String(visible);
  if (input.getAttribute('aria-invalid') !== ariaInvalid) input.setAttribute('aria-invalid', ariaInvalid);
  const error = errorNode(input);
  const message = visible ? (value ? 'Проверьте почту' : 'Введите почту') : '';
  if (error.textContent !== message) error.textContent = message;
  if (error.hidden === visible) error.hidden = !visible;
  return !invalid;
}

function validateForm(form) {
  const emails = [...form.querySelectorAll(fieldSelector)];
  let valid = true;
  for (const input of emails) {
    input.dataset.vitrioEmailTouched = 'true';
    valid = validate(input, {announce: true}) && valid;
  }
  if (!valid) emails.find(input => input.getAttribute('aria-invalid') === 'true')?.focus({preventScroll: true});
  return valid;
}

function onInput(event) {
  const input = event.target.closest?.(fieldSelector);
  if (!input) return;
  input.dataset.vitrioEmailTouched = 'true';
  validate(input);
}

function onBlur(event) {
  const input = event.target.closest?.(fieldSelector);
  if (!input) return;
  input.dataset.vitrioEmailTouched = 'true';
  validate(input, {announce: true});
}

function onSubmit(event) {
  if (!validateForm(event.target)) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}

function onClick(event) {
  const button = event.target.closest?.(actionSelector);
  if (!button || button.disabled) return;
  const form = button.form || button.closest('.checkout, .checkout-page, .gu-scroll, .gu-dock, .bp-shell, .robux-page, .robux-layout, main, #root');
  const input = form?.querySelector(`${fieldSelector}[required], ${fieldSelector}:not([required])`);
  if (!input) return;
  const emails = [...form.querySelectorAll(fieldSelector)];
  const invalid = emails.some(candidate => {
    candidate.dataset.vitrioEmailTouched = 'true';
    return !validate(candidate, {announce: true});
  });
  if (invalid) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const firstInvalid = emails.find(candidate => candidate.getAttribute('aria-invalid') === 'true');
    firstInvalid?.focus({preventScroll: false});
  }
}

function refresh() {
  document.querySelectorAll(fieldSelector).forEach(input => validate(input));
}

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.dataset.vitrioEmailValidation = 'true';
  style.textContent = `
    .vitrio-email-field { min-width: 0; }
    .vitrio-email-field input, .vitrio-email-field .robux-input, .vitrio-email-field .auth-input-wrap { transition: border-color .2s ease, box-shadow .2s ease, background-color .2s ease; }
    .vitrio-email-field.vitrio-email-invalid input, .vitrio-email-field.vitrio-email-invalid .robux-input, .vitrio-email-field.vitrio-email-invalid .auth-input-wrap { border-color: #d94c57 !important; box-shadow: inset 0 0 0 1px rgba(217,76,87,.82) !important; }
    .vitrio-email-error { margin: 6px 0 0; color: #d94c57; font: 500 12px/1.35 Unbounded, system-ui, sans-serif; }
    .vitrio-email-error[hidden] { display: none; }
    @media (max-width: 640px) { .vitrio-email-field input { font-size: 16px; } }
    @media (prefers-reduced-motion: reduce) { .vitrio-email-field input, .vitrio-email-field .robux-input, .vitrio-email-field .auth-input-wrap { transition: none; } }
  `;
  document.head.append(style);
  document.addEventListener('input', onInput, true);
  document.addEventListener('blur', onBlur, true);
  document.addEventListener('submit', onSubmit, true);
  document.addEventListener('click', onClick, true);
  refresh();
  new MutationObserver(records => {
    const hasEmailFieldChange = records.some(record => [...record.addedNodes, ...record.removedNodes].some(node => (
      node.nodeType === Node.ELEMENT_NODE && (node.matches(fieldSelector) || node.querySelector(fieldSelector))
    )));
    if (hasEmailFieldChange) refresh();
  }).observe(document.documentElement, {subtree: true, childList: true});
}

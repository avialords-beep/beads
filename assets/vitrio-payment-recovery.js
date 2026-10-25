// Browser handoff is not payment confirmation. This module never sends a payment request.
// Vite bundles and versioned legacy imports share one top-layer lifecycle.
const runtime = globalThis[Symbol.for('vitrio.paymentRecovery')] ??= { dialog: null, handoff: null, sequence: 0 };

export function validatedVitrioBankRedirectUrl(value, method = '') {
  try {
    const url = new URL(String(value || ''));
    const tpayHost = /(^|\.)(tbank\.ru|tinkoff\.ru|tbank-online\.com)$/i.test(url.hostname);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port
      && (method !== 'tpay' || tpayHost) ? url.href : '';
  } catch { return ''; }
}

const validQr = (value) => /^data:image\/(?:png|webp);base64,[A-Za-z0-9+/=]+$/i.test(String(value || ''))
  && String(value).length <= 500_000 ? String(value) : '';

function installStyle(document) {
  if (document.head.querySelector('[data-vitrio-payment-recovery-style]')) return;
  const style = document.createElement('style');
  style.dataset.vitrioPaymentRecoveryStyle = 'true';
  style.textContent = `
@font-face{font-family:Nunito;src:url('/assets/fonts/nunito-variable.woff2') format('woff2');font-style:normal;font-weight:200 1000;font-display:swap}
[data-vitrio-payment-recovery]{--vpr-bg:#fff;--vpr-ink:#18201b;--vpr-muted:#56635b;--vpr-line:#d9e0d9;--vpr-quiet:#f1f5f0;box-sizing:border-box;position:fixed;left:0;right:0;top:var(--vpr-viewport-top,0px);bottom:calc(var(--vpr-layout-height,100dvh) - var(--vpr-viewport-top,0px) - var(--vpr-viewport-height,100dvh));width:min(440px,calc(100% - 32px));max-height:calc(var(--vpr-viewport-height,100dvh) - 32px);margin:auto;padding:28px;border:1px solid var(--vpr-line);border-radius:43px;background:var(--vpr-bg);color:var(--vpr-ink);box-shadow:0 24px 72px rgba(4,15,8,.24);font:16px/1.5 Nunito,Arial,sans-serif;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:var(--vpr-muted) var(--vpr-bg);animation:vpr-enter 180ms cubic-bezier(.16,1,.3,1)}
[data-vitrio-payment-recovery][data-theme=dark]{--vpr-bg:#151a17;--vpr-ink:#f3f7f2;--vpr-muted:#becabe;--vpr-line:#38453b;--vpr-quiet:#232e26;color-scheme:dark}
[data-vitrio-payment-recovery]::backdrop{background:rgba(3,8,5,.66);backdrop-filter:blur(5px)}
[data-vitrio-payment-recovery] h2{margin:0 0 12px;font:800 clamp(20px,5vw,24px)/1.25 Nunito,Arial,sans-serif;letter-spacing:-.025em;text-wrap:balance}
[data-vitrio-payment-recovery] [data-status-icon]{display:grid;place-items:center;width:56px;height:56px;margin:0 52px 20px 0;border-radius:18px;background:#fff3e6;color:#9c5625}
[data-vitrio-payment-recovery][data-theme=dark] [data-status-icon]{background:#382c21;color:#ffd2a5}
[data-vitrio-payment-recovery][data-kind=bank] [data-status-icon]{background:#edf6cf;color:#476124}
[data-vitrio-payment-recovery][data-theme=dark][data-kind=bank] [data-status-icon]{background:#2c371e;color:#d6ed99}
[data-vitrio-payment-recovery] [data-status-icon] svg{width:34px;height:34px;animation:vpr-icon-enter 420ms cubic-bezier(.16,1,.3,1)}
[data-vitrio-payment-recovery] [data-icon-bank]{display:none}
[data-vitrio-payment-recovery][data-kind=bank] [data-icon-bank]{display:block}
[data-vitrio-payment-recovery][data-kind=bank] [data-icon-error]{display:none}
[data-vitrio-payment-recovery] p{margin:0 0 22px;color:var(--vpr-muted);overflow-wrap:anywhere}
[data-vitrio-payment-recovery] img{display:block;width:min(260px,100%);height:auto;aspect-ratio:1;object-fit:contain;box-sizing:border-box;margin:0 auto 22px;padding:12px;border-radius:16px;background:#fff}
[data-vitrio-payment-recovery] img[hidden]{display:none}
[data-vitrio-payment-recovery] footer{display:grid;gap:10px}
[data-vitrio-payment-recovery] button{box-sizing:border-box;min-height:48px;padding:12px 20px;border:1px solid var(--vpr-line);border-radius:999px;color:var(--vpr-ink);background:var(--vpr-quiet);font:800 16px/1.25 Nunito,Arial,sans-serif;cursor:pointer;touch-action:manipulation;overflow-wrap:anywhere;transition:background-color 160ms ease,transform 160ms ease}
[data-vitrio-payment-recovery] button:hover{filter:brightness(.97)}
[data-vitrio-payment-recovery] button:active{transform:translateY(1px)}
[data-vitrio-payment-recovery] button:focus-visible{outline:3px solid #a7cd23;outline-offset:3px}
[data-vitrio-payment-recovery] button[data-continue]{border-color:transparent;background:#cfff22;color:#13200c}
[data-vitrio-payment-recovery] button[data-continue][data-action=open]{display:flex;justify-content:center;align-items:center;gap:10px}
[data-vitrio-payment-recovery] button[data-continue][data-action=open]::after{content:"";width:20px;height:20px;flex:none;background:currentColor;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 18 18 6M6 6h12v12' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/contain no-repeat}
[data-vitrio-payment-recovery] button[data-continue][hidden]{display:none}
[data-vitrio-payment-recovery] button:disabled{cursor:wait;opacity:.6}
[data-vitrio-payment-recovery] button[data-dismiss]{position:absolute;top:16px;right:16px;min-height:44px;width:44px;padding:0;border:0;background:transparent;font-size:26px;font-weight:500;line-height:1}
[data-vitrio-payment-recovery]::selection{background:#cfff22;color:#13200c}
@keyframes vpr-enter{from{opacity:.7;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes vpr-icon-enter{from{opacity:0;transform:translateY(5px) scale(.84)}to{opacity:1;transform:translateY(0) scale(1)}}
@media(max-width:480px){[data-vitrio-payment-recovery]{padding:28px 22px 22px}}
@media(prefers-reduced-motion:reduce){[data-vitrio-payment-recovery],[data-vitrio-payment-recovery] [data-status-icon] svg{animation:none}[data-vitrio-payment-recovery] button{transition:none}}
`;
  document.head.append(style);
}

function themeFor(document) {
  // Checkout portals can use a different world from the app behind them.
  const shells = '.gpt-checkout-screen,.bp-shell.cs-checkout-page.cs-checkout-live,.checkout-form,.screen-payment,.ld-checkout[open],.looks-subscription-modal[open],.checkout-page,#cards-checkout,.cards-checkout,dialog#voice-checkout[open],.ai-subscription,.gifts-view--checkout,.scratch-dialog__body--payment,.v-studio-plan-dialog,.v-billing,.v-account-dialog,.robux-register';
  const visible = (node) => node && !node.hidden && (typeof node.getClientRects !== 'function' || node.getClientRects().length > 0);
  const focused = document.activeElement?.closest?.(shells);
  const surface = visible(focused) ? focused : [...(document.querySelectorAll?.(shells) || [])].find(visible) || document.body;
  const scheme = globalThis.getComputedStyle?.(surface)?.colorScheme;
  for (let node = surface; node; node = node.parentElement) {
    const style = globalThis.getComputedStyle?.(node);
    const rgb = String(style?.backgroundColor || '').match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
    if (rgb && (!rgb[4] || Number(rgb[4]) > .5)) return (Number(rgb[1]) + Number(rgb[2]) + Number(rgb[3])) / 3 < 100 ? 'dark' : 'light';
  }
  return scheme === 'dark' ? 'dark' : 'light';
}

export function showPaymentRecovery(options = {}, handoff = null) {
  const document = globalThis.document;
  if (runtime.handoff !== handoff) runtime.handoff?.close();
  runtime.dialog?.close('replaced');
  let closed = false, continuation = 0;
  let state = { kind: 'preparation', method: '', ...options };
  const parentSignal = state.signal;
  const empty = { update: () => false, close: () => {}, get closed() { return true; }, get dialog() { return null; } };
  if (!document?.body || !document?.createElement || state.signal?.aborted) return empty;
  const dialog = document.createElement('dialog');
  if (typeof dialog.showModal !== 'function') return empty;
  installStyle(document);
  dialog.dataset.vitrioPaymentRecovery = 'true';
  const id = `vitrio-payment-recovery-${++runtime.sequence}`;
  dialog.setAttribute('aria-labelledby', `${id}-title`); dialog.setAttribute('aria-describedby', `${id}-copy`);
  const icon = document.createElement('span'); icon.dataset.statusIcon = 'true'; icon.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [name, value] of Object.entries({ viewBox: '0 0 48 48', fill: 'none', stroke: 'currentColor', 'stroke-width': '2.5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', focusable: 'false' })) svg.setAttribute(name, value);
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  for (const [name, value] of Object.entries({ cx: '24', cy: '24', r: '18' })) circle.setAttribute(name, value);
  const warning = document.createElementNS('http://www.w3.org/2000/svg', 'path'); warning.dataset.iconError = 'true'; warning.setAttribute('d', 'M24 14v12m0 7v.1');
  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path'); arrow.dataset.iconBank = 'true'; arrow.setAttribute('d', 'M16 24h16m-6-6 6 6-6 6');
  svg.append(circle, warning, arrow); icon.append(svg);
  const title = document.createElement('h2'); title.id = `${id}-title`;
  const copy = document.createElement('p'); copy.id = `${id}-copy`; copy.setAttribute('role', 'status'); copy.setAttribute('aria-live', 'polite');
  const image = document.createElement('img'); image.alt = 'QR-код этой оплаты через СБП'; image.hidden = true;
  const footer = document.createElement('footer');
  const primary = document.createElement('button'); primary.type = 'button'; primary.dataset.continue = 'true';
  const secondary = document.createElement('button'); secondary.type = 'button'; secondary.textContent = 'Закрыть';
  const dismiss = document.createElement('button'); dismiss.type = 'button'; dismiss.dataset.dismiss = 'true'; dismiss.textContent = '×'; dismiss.setAttribute('aria-label', 'Закрыть сообщение об оплате');
  footer.append(primary, secondary); dialog.append(dismiss, icon, title, copy, image, footer);
  const previousFocus = document.activeElement;
  const events = new AbortController();
  const viewport = globalThis.visualViewport;
  const updateViewport = () => {
    const height = Number(viewport?.height), top = Number(viewport?.offsetTop) || 0;
    if (!Number.isFinite(height) || height <= 0) return;
    dialog.style.setProperty('--vpr-viewport-height', `${height}px`);
    dialog.style.setProperty('--vpr-viewport-top', `${Math.max(0, top)}px`);
    dialog.style.setProperty('--vpr-layout-height', `${Number(globalThis.innerHeight) || height}px`);
  };
  viewport?.addEventListener('resize', updateViewport, { signal: events.signal });
  viewport?.addEventListener('scroll', updateViewport, { signal: events.signal });
  globalThis.addEventListener?.('resize', updateViewport, { signal: events.signal });
  const render = () => {
    continuation++;
    const bank = state.kind === 'bank';
    dialog.dataset.kind = bank ? 'bank' : 'preparation';
    state.url = state.url ? validatedVitrioBankRedirectUrl(state.url, state.method) : '';
    dialog.dataset.theme = ['light', 'dark'].includes(state.theme) ? state.theme : themeFor(document);
    title.textContent = String(state.title || (bank ? 'Перейдите к оплате' : 'Проверка оплаты')).slice(0, 160);
    copy.textContent = String(state.message || (bank
      ? 'Если страница банка не открылась, перейдите к оплате кнопкой ниже. После оплаты вернитесь сюда, чтобы проверить её статус.'
      : 'Проверьте статус текущего платежа перед повторной попыткой.')).slice(0, 1200);
    const qr = state.method === 'sbp' && validQr(state.qrDataUrl);
    image.hidden = !qr; if (qr) image.src = qr; else image.removeAttribute('src');
    primary.textContent = String(state.primaryLabel || (bank ? 'Перейти к оплате' : 'Попробовать снова')).slice(0, 120);
    primary.dataset.action = bank || state.action === 'open' ? 'open' : 'retry';
    primary.hidden = !state.url && typeof state.onContinue !== 'function';
    primary.disabled = false;
  };
  const close = (reason = 'closed') => {
    if (closed) return;
    closed = true; events.abort(); parentSignal?.removeEventListener('abort', onAbort);
    if (runtime.dialog === control) runtime.dialog = null;
    if (dialog.open) dialog.close(); dialog.remove();
    if (reason !== 'replaced' && previousFocus?.isConnected && !document.querySelector('[data-vitrio-payment-recovery]')) previousFocus.focus?.({ preventScroll: true });
    state.onClose?.({ reason });
  };
  const onAbort = () => close('aborted');
  const control = { update(next = {}) { if (closed) return false; state = { ...state, ...next, signal: parentSignal }; render(); return true; }, close, get closed() { return closed; }, get dialog() { return closed ? null : dialog; } };
  runtime.dialog = control;
  const dismissDialog = () => close('dismissed');
  for (const button of [secondary, dismiss]) button.addEventListener('click', dismissDialog, { signal: events.signal });
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); dismissDialog(); }, { signal: events.signal });
  dialog.addEventListener('close', () => close('dismissed'), { signal: events.signal });
  primary.addEventListener('click', () => {
    if (closed || primary.disabled) return;
    const version = continuation;
    try {
      // Execute inside the tap, before any await, so Telegram/browser activation is retained.
      const result = typeof state.onContinue === 'function' ? state.onContinue() : launchBankUrl(state.url);
      if (result && typeof result.then === 'function') {
        primary.disabled = true;
        Promise.resolve(result).catch(() => {
          if (!closed && version === continuation) copy.textContent = 'Переход пока не подтвердился. Проверьте статус текущей оплаты перед новой попыткой.';
        }).finally(() => { if (!closed && version === continuation) primary.disabled = false; });
      }
    } catch {
      copy.textContent = 'Не удалось открыть страницу банка. Попробуйте перейти по той же ссылке ещё раз.';
    }
  }, { signal: events.signal });
  parentSignal?.addEventListener('abort', onAbort, { once: true });
  render(); updateViewport(); document.body.append(dialog); dialog.showModal(); (primary.hidden ? secondary : primary).focus({ preventScroll: true });
  return control;
}

function launchBankUrl(url, openExternal) {
  if (typeof openExternal === 'function') return openExternal(url);
  try {
    if (globalThis.Telegram?.WebApp?.openLink) {
      globalThis.Telegram.WebApp.openLink(url, { try_instant_view: false });
      return;
    }
  } catch { /* A bridge rejection may still use the ordinary browser. */ }
  const popup = globalThis.open?.(url, '_blank', 'noopener,noreferrer');
  if (popup) popup.opener = null;
  // noopener may return null even for an opened tab. Keep this WebApp and its
  // same-link recovery available; a null handle is not proof of failure.
}

export function openBankPayment(url, { method = '', qrDataUrl = '', signal, openExternal } = {}) {
  const redirect = validatedVitrioBankRedirectUrl(url, method);
  if (!redirect) throw new Error('Платёжный сервис не вернул безопасную банковскую ссылку.');
  runtime.handoff?.close(); runtime.dialog?.close('replaced');
  let closed = false, dialog = null, timer = null, telegramLeaveSubscribed = false;
  const document = globalThis.document;
  const telegram = globalThis.Telegram?.WebApp;
  const close = () => {
    if (closed) return;
    closed = true; clearTimeout(timer);
    document?.removeEventListener?.('visibilitychange', leave); globalThis.removeEventListener?.('pagehide', leave);
    if (telegramLeaveSubscribed) { try { telegram.offEvent?.('deactivated', close); } catch { /* Older bridges may lack event cleanup. */ } telegramLeaveSubscribed = false; }
    signal?.removeEventListener('abort', close); dialog?.close();
    if (runtime.handoff === control) runtime.handoff = null;
  };
  const leave = (event) => { if (event?.type === 'pagehide' || document?.visibilityState === 'hidden') close(); };
  const control = { close, get closed() { return closed; }, get dialog() { return dialog?.dialog || null; } };
  if (signal?.aborted) { close(); return control; }
  runtime.handoff = control;
  document?.addEventListener?.('visibilitychange', leave); globalThis.addEventListener?.('pagehide', leave);
  try { if (telegram?.onEvent && telegram?.offEvent) { telegram.onEvent('deactivated', close); telegramLeaveSubscribed = true; } } catch { /* Visibility and pagehide remain available on older clients. */ }
  signal?.addEventListener('abort', close, { once: true });
  const attempt = () => {
    try {
      const result = launchBankUrl(redirect, openExternal);
      if (result?.catch) result.catch(() => {}); // Only a leave event can confirm handoff, never a bridge return value.
    } catch { /* The same-link dialog remains available. */ }
  };
  attempt();
  if (!document?.body) { close(); return control; }
  if (!closed) timer = setTimeout(() => {
    if (closed) return;
    dialog = showPaymentRecovery({ kind: 'bank', method, url: redirect, qrDataUrl, signal, onContinue: attempt, onClose: close }, control);
  }, 700);
  return control;
}

export function startPaymentPreparation({ onSlow, signal, delayMs = 15_000 } = {}) {
  let stopped = false;
  const stop = () => { if (stopped) return; stopped = true; clearTimeout(timer); signal?.removeEventListener('abort', stop); };
  const timer = signal?.aborted ? null : setTimeout(() => { stop(); onSlow?.(); }, delayMs);
  if (signal?.aborted) stopped = true;
  else signal?.addEventListener('abort', stop, { once: true });
  return { stop };
}

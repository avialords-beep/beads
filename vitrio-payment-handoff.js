import { startPaymentPreparation, showPaymentRecovery } from '/assets/vitrio-payment-recovery.js?v=20261013-payment-unified-1';

// Preserve server validation and provider rejection. Elapsed time alone never
// proves a failed request or the visitor's VPN/network configuration.
export function paymentPreparationFailureDetails(cause) {
  const message = String(cause?.message || 'Ответ платёжного сервиса пока не получен.');
  const status = Number(cause?.status || 0);
  const code = cause?.code || cause?.payload?.code || cause?.details?.code;
  if (code === 'PAYMENT_PREPARATION_PENDING') return { title: 'Оплата ещё готовится', message };
  const loading = cause?.paymentSdkNotStarted === true || code === 'AI_CHECKOUT_UNAVAILABLE'
    || (!status && ['NETWORK_ERROR', 'INVALID_RESPONSE'].includes(code))
    || status >= 500 || status === 408 || (!status && (!cause?.message || cause?.name === 'TimeoutError'
      || /failed to fetch|network(?:error| error| request failed)|load failed|fetch failed|connection (?:failed|interrupted)|importing a module script failed/i.test(message)
      || /^Не удалось загрузить (?:форму|оформление) оплаты|^Форма оплаты загружается дольше обычного|^Ответ (?:сервера|платёжного сервиса) задерживается/u.test(message)));
  return {
    title: loading ? 'Не удалось загрузить оплату' : 'Не удалось открыть оплату',
    message,
  };
}

// The widget promise settles after payment, not when the form opens. Observe
// only a new provider frame (or an existing frame whose source changed).
export function observeCloudPaymentsCardReady(onReady, { signal } = {}) {
  if (!onReady || typeof MutationObserver === 'undefined' || typeof document === 'undefined' || !document.body || signal?.aborted) return () => {};
  const existing = new Map(Array.from(document.querySelectorAll('iframe'), frame => [frame, { src: frame.src, visible: frame.getBoundingClientRect().width > 0 && frame.getBoundingClientRect().height > 0 }]));
  const frames = new Map();
  let active = true;
  const cleanup = () => {
    if (!active) return;
    active = false;
    observer.disconnect();
    for (const [frame, state] of frames) frame.removeEventListener('load', state.listener);
    signal?.removeEventListener('abort', cleanup);
  };
  const scan = () => {
    if (!active || signal?.aborted) return;
    for (const frame of document.querySelectorAll('iframe')) {
      let state = frames.get(frame);
      if (state && state.src !== frame.src) { state.src = frame.src; state.loaded = false; }
      const before = existing.get(frame);
      if (before?.visible && before.src === frame.src && !state) continue;
      let url;
      try { url = new URL(frame.src); } catch { continue; }
      if (url.protocol !== 'https:' || !/(^|\.)cloudpayments\.ru$/i.test(url.hostname)) continue;
      if (!state) {
        state = { src: frame.src, loaded: false, listener: null };
        state.listener = () => { state.loaded = state.src === frame.src; scan(); };
        frames.set(frame, state);
        frame.addEventListener('load', state.listener);
      }
      const rect = frame.getBoundingClientRect();
      if (state.loaded && rect.width > 0 && rect.height > 0) {
        cleanup();
        onReady(frame);
        return;
      }
    }
  };
  const observer = new MutationObserver(scan);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'style', 'class', 'hidden'] });
  scan(); // Subscribe to hidden reusable frames before the next provider load.
  signal?.addEventListener('abort', cleanup, { once: true });
  return cleanup;
}

// One UI deadline covers invoice/link/SDK preparation. It never aborts or
// resends a payment request, and excludes card entry and payment settlement.
export function createPaymentPreparation({ method = '', onSlow, onCheckStatus, signal } = {}) {
  let feedback = null;
  let gate = null;
  let resolveGate = null;
  let cardCleanup = null;
  let disposed = false;
  let slow = false;
  const showSlow = () => {
    if (disposed || feedback?.closed) return;
    slow = true;
    onSlow?.();
    feedback = showPaymentRecovery({ kind: 'preparation', method, signal, title: 'Оплата ещё готовится',
      message: 'Платёжный сервис отвечает дольше обычного. Ждём результат текущего запроса. Новую оплату не создаём.',
      ...(onCheckStatus ? { primaryLabel: 'Проверить статус', onContinue: onCheckStatus } : {}) });
  };
  let timer = startPaymentPreparation({ onSlow: showSlow, signal });
  const stop = () => { timer.stop(); cardCleanup?.(); cardCleanup = null; };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    stop();
    feedback?.close('aborted');
    resolveGate?.(false);
    signal?.removeEventListener('abort', dispose);
  };
  signal?.addEventListener('abort', dispose, { once: true });
  if (signal?.aborted) dispose();
  return {
    stop,
    dispose,
    async ready(options = {}) {
      const { cardFormPending = false, onContinue } = typeof options === 'function' ? { onContinue: options } : options;
      if (!cardFormPending) timer.stop();
      if (disposed || feedback?.closed) return false;
      if (!feedback) { onContinue?.(); return true; }
      gate ||= new Promise((resolve, reject) => {
        resolveGate = resolve;
        let accepted = false;
        feedback.update({ action: 'open', title: 'Оплата готова', message: 'Продолжите оплату по уже созданному счёту.', primaryLabel: 'Продолжить оплату',
          onContinue() {
            try {
              // Invoke the opener directly in the trusted click, before any await.
              onContinue?.();
              accepted = true;
              feedback.close();
              feedback = null;
              if (cardFormPending && slow) { slow = false; timer = startPaymentPreparation({ onSlow: showSlow, signal }); }
              resolve(true);
            } catch (error) { reject(error); }
          }, onClose() { if (!accepted) resolve(false); } });
      });
      return gate;
    },
    watchCardForm() {
      cardCleanup?.();
      cardCleanup = observeCloudPaymentsCardReady(() => {
        timer.stop();
        cardCleanup = null;
        if (feedback && !feedback.closed) feedback.update({ action: 'open', title: 'Форма оплаты готова', message: 'Продолжите оплату в открытой форме.', primaryLabel: 'Продолжить оплату',
          onContinue() { feedback.close(); feedback = null; } });
      }, { signal });
      return () => { cardCleanup?.(); cardCleanup = null; };
    },
    fail(cause, { onCheckStatus: checkStatus = onCheckStatus, onRetry } = {}) {
      stop();
      if (disposed || feedback?.closed) return feedback;
      const failure = paymentPreparationFailureDetails(cause);
      const options = { kind: 'preparation', action: 'retry', method, signal, ...failure,
        ...(onRetry ? { primaryLabel: 'Попробовать снова', onContinue: onRetry }
          : checkStatus ? { primaryLabel: 'Проверить статус', onContinue: checkStatus }
            : { message: `${failure.message} Не оплачивайте повторно, пока статус платежа не будет известен.`, onContinue: null }) };
      if (feedback) feedback.update(options);
      else feedback = showPaymentRecovery(options);
      return feedback;
    },
  };
}

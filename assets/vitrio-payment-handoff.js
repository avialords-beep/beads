const CLOUDPAYMENTS_WIDGET_URL = 'https://widget.cloudpayments.ru/bundles/cloudpayments.js';

function validatedVitrioBankRedirectUrl(value, method = '') {
  try {
    const url = new URL(String(value || ''));
    const tpayHost = /(^|\.)(tbank\.ru|tinkoff\.ru|tbank-online\.com)$/i.test(url.hostname);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port
      && (method !== 'tpay' || tpayHost) ? url.href : '';
  } catch { return ''; }
}

export function loadCloudPaymentsRuntime() {
  if (window.cp?.CloudPayments) return Promise.resolve(window.cp);
  if (window.__vitrioCloudPaymentsRuntime) return window.__vitrioCloudPaymentsRuntime;
  window.__vitrioCloudPaymentsRuntime = new Promise((resolve, reject) => {
    const origin = new URL(CLOUDPAYMENTS_WIDGET_URL).origin;
    for (const rel of ['dns-prefetch', 'preconnect']) {
      if (document.head.querySelector(`link[rel="${rel}"][href="${origin}"]`)) continue;
      const link = document.createElement('link');
      link.rel = rel;
      link.href = origin;
      if (rel === 'preconnect') link.crossOrigin = 'anonymous';
      document.head.append(link);
    }
    const existing = Array.from(document.scripts || []).find(node => node.src === CLOUDPAYMENTS_WIDGET_URL && node.dataset?.vitrioPaymentSdkFailed !== 'true');
    const script = existing || document.createElement('script');
    if (!existing) { script.src = CLOUDPAYMENTS_WIDGET_URL; script.async = true; }
    let settled = false;
    const finish = error => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (existing) { script.removeEventListener('load', loaded); script.removeEventListener('error', failed); }
      else { script.onload = null; script.onerror = null; }
      if (error) {
        window.__vitrioCloudPaymentsRuntime = null;
        if (script.dataset) script.dataset.vitrioPaymentSdkFailed = 'true';
        if (!existing) script.remove();
        // Loading the SDK is a GET, before any widget/payment submission.
        // Callers may retry this stage using their existing invoice only.
        error.paymentSdkNotStarted = true;
        reject(error);
      } else resolve(window.cp);
    };
    const timer = setTimeout(() => finish(new Error('Форма оплаты загружается дольше обычного. Проверьте соединение и попробуйте ещё раз.')), 20_000);
    const loaded = () => finish(window.cp?.CloudPayments ? null : new Error('Не удалось открыть форму оплаты. Попробуйте ещё раз.'));
    const failed = () => finish(new Error('Не удалось загрузить форму оплаты. Проверьте соединение.'));
    if (existing) { script.addEventListener('load', loaded); script.addEventListener('error', failed); }
    else { script.onload = loaded; script.onerror = failed; document.head.append(script); }
  });
  return window.__vitrioCloudPaymentsRuntime;
}

export function prewarmCloudPaymentsRuntime(enabled) {
  if (enabled === true) void loadCloudPaymentsRuntime().catch(() => {});
}

export function preparedBankUrl(payload, expectedMethod) {
  return preparedBankHandoff(payload, expectedMethod).url;
}

export function preparedBankHandoff(payload, expectedMethod) {
  const handoff = payload?.paymentHandoff || payload?.payment?.paymentHandoff;
  if (handoff?.type === 'bank_pending' && handoff.method === expectedMethod) {
    throw Object.assign(new Error('Ссылка для этой оплаты ещё готовится. Проверьте статус текущего платежа.'), {
      code: 'PAYMENT_PREPARATION_PENDING', status: 409, ambiguous: true,
      details: { recoveryPayment: payload?.payment || { id: handoff.paymentId } },
    });
  }
  const expiresAt = handoff?.expiresAt ? Date.parse(handoff.expiresAt) : null;
  if (handoff?.type === 'bank_redirect' && handoff.method === expectedMethod && expiresAt !== null && (!Number.isFinite(expiresAt) || expiresAt <= Date.now())) {
    throw Object.assign(new Error('Срок ссылки истёк. Проверьте оплату и выберите способ снова.'), {
      code: 'PAYMENT_LINK_EXPIRED', status: 409, ambiguous: true,
      details: { recoveryPayment: payload?.payment },
    });
  }
  if (handoff?.type !== 'bank_redirect' || handoff.method !== expectedMethod) return { url: '', qrDataUrl: '' };
  return {
    url: validatedVitrioBankRedirectUrl(handoff.redirectUrl, expectedMethod),
    qrDataUrl: expectedMethod === 'sbp' && /^data:image\/(?:png|webp);base64,[A-Za-z0-9+/=]+$/i.test(String(handoff.qrDataUrl ?? ''))
      ? String(handoff.qrDataUrl) : '',
  };
}

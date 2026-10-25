import { notificationIcons } from '/assets/vitrio-notification-icons.js';

const API = '/api/vitrio/notifications';
const POLL_MS = 60_000;
let nextDialogId = 0;
const node = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};
const glyph = name => {
  const element = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [key, value] of Object.entries({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' })) element.setAttribute(key, value);
  element.innerHTML = notificationIcons[name] || notificationIcons.Mail;
  return element;
};
export const notificationTone = notification => {
  if (['success', 'error', 'warning'].includes(notification.severity)) return [notification.severity, notification.severity === 'success' ? 'CircleCheck' : notification.severity === 'error' ? 'CircleAlert' : notification.type === 'renewal_reminder' ? 'Clock3' : 'TriangleAlert'];
  if (['renewal_paid', 'trial_started', 'subscription_started', 'refund_completed'].includes(notification.type)) return ['success', 'CircleCheck'];
  if (['payment_failed', 'renewal_failed'].includes(notification.type)) return ['error', 'CircleAlert'];
  if (['renewal_reminder', 'bank_action_required', 'bank_action'].includes(notification.type)) return ['warning', notification.type === 'renewal_reminder' ? 'Clock3' : 'TriangleAlert'];
  return ['info', ['payment_pending', 'pending'].includes(notification.type) ? 'Clock3' : 'Mail'];
};
export function notificationDate(value) {
  const date = new Date(value || '');
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' }).format(date) + ' МСК' : '';
}
export function mergeNotifications(current, incoming, now = Date.now()) {
  const rows = new Map(current.map(item => [item.id, item]));
  for (const item of Array.isArray(incoming) ? incoming : []) {
    if (!item || item.status !== 'published' || typeof item.id !== 'string' || !item.id || typeof item.title !== 'string' || !Array.isArray(item.paragraphs)) continue;
    if (item.publishedAt && new Date(item.publishedAt).getTime() > now) continue;
    rows.set(item.id, { ...item, paragraphs: item.paragraphs.filter(text => typeof text === 'string') });
  }
  return [...rows.values()];
}

/** Account lifetime belongs to the caller. Neither polling nor opening the list proves a notice was viewed. */
export function createVitrioNotificationCenter({ request, theme = 'studio', accountId, onAccountChange = () => {} }) {
  if (!accountId || typeof request !== 'function') throw new TypeError('An authenticated account and request function are required');
  const id = `vitrio-notifications-${++nextDialogId}`;
  let destroyed = false, dialog, list, status, more, acknowledge, observer, returnFocus;
  let rows = [], unread = 0, nextCursor = null, loading = false, loadFailed = false, readBusy = false, readError = false;
  let pollTimer, readTimer, pollRequest, listRequest, failureCount = 0, previousOverflow;
  const buttons = new Map(), buttonListeners = new WeakMap(), visibleIds = new Set(), acknowledgementIds = new Map();
  const count = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
  const accountMatches = payload => {
    const identity = payload.userId ?? payload.accountId;
    if (identity !== undefined && String(identity) !== String(accountId)) { onAccountChange(); return false; }
    return true;
  };
  const isOpen = () => Boolean(dialog?.open && !destroyed);
  const updateButtons = () => {
    for (const [button, badge] of buttons) {
      button.setAttribute('aria-label', unread ? `Уведомления: ${unread} непрочитанных` : 'Уведомления');
      button.setAttribute('aria-expanded', String(isOpen()));
      badge.hidden = !unread;
      badge.textContent = unread > 99 ? '99+' : String(unread);
    }
    if (acknowledge) acknowledge.hidden = !rows.some(item => !item.readAt);
  };
  function schedulePoll() {
    clearTimeout(pollTimer);
    if (!destroyed && document.visibilityState !== 'hidden') pollTimer = setTimeout(refreshCount, Math.min(POLL_MS * 2 ** failureCount, 300_000));
  }
  async function refreshCount() {
    if (destroyed || document.visibilityState === 'hidden' || pollRequest || readBusy) return schedulePoll();
    const controller = new AbortController(); pollRequest = controller;
    try {
      const payload = await request(`${API}?summary=1`, { signal: controller.signal });
      if (!accountMatches(payload)) return;
      if (!destroyed) { unread = count(payload.unreadCount); failureCount = 0; updateButtons(); }
    } catch (cause) {
      if (cause?.name !== 'AbortError') failureCount = Math.min(3, failureCount + 1);
    } finally { if (pollRequest === controller) pollRequest = null; schedulePoll(); }
  }
  function setStatus(message, error = false, retry) {
    status.replaceChildren(); status.hidden = !message;
    status.setAttribute('role', error ? 'alert' : 'status');
    if (message) status.append(node('p', '', message));
    if (retry) { const button = action('Повторить', 'RefreshCw'); button.addEventListener('click', retry); status.append(button); }
  }
  function action(label, icon) {
    const button = node('button', 'vn-action'); button.type = 'button';
    if (icon) button.append(glyph(icon)); button.append(node('span', '', label)); return button;
  }
  function observeRows() {
    observer?.disconnect(); visibleIds.clear();
    if (!isOpen()) return;
    if (typeof IntersectionObserver === 'function') {
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= .5) visibleIds.add(entry.target.dataset.noticeId);
          else visibleIds.delete(entry.target.dataset.noticeId);
        }
        queueVisibleRead();
      }, { root: list, threshold: .5 });
      list.querySelectorAll('[data-notice-id]').forEach(element => observer.observe(element));
    } else measureVisibleRows();
  }
  function measureVisibleRows() {
    if (!isOpen()) return;
    const bounds = list.getBoundingClientRect(); visibleIds.clear();
    list.querySelectorAll('[data-notice-id]').forEach(element => {
      const rect = element.getBoundingClientRect();
      const visible = Math.max(0, Math.min(rect.bottom, bounds.bottom) - Math.max(rect.top, bounds.top));
      if (rect.height > 0 && visible / Math.min(rect.height, bounds.height) >= .5) visibleIds.add(element.dataset.noticeId);
    });
    queueVisibleRead();
  }
  function queueVisibleRead() {
    clearTimeout(readTimer);
    if (isOpen() && !readBusy && !readError && document.visibilityState !== 'hidden') readTimer = setTimeout(() => markRead([...visibleIds]), 500);
  }
  async function markRead(ids) {
    const selected = new Set(ids);
    const pending = rows.filter(item => selected.has(item.id) && !item.readAt).map(item => item.id);
    if (!pending.length || readBusy || destroyed || !isOpen() || document.visibilityState === 'hidden') return;
    readBusy = true; acknowledge.disabled = true;
    try {
      // A read acknowledgement is idempotent; only the server response changes local unread state.
      for (let offset = 0; offset < pending.length; offset += 100) {
        const batch = pending.slice(offset, offset + 100);
        if (destroyed || !isOpen() || document.visibilityState === 'hidden') return;
        const batchKey = JSON.stringify([...batch].sort());
        let clientEventId = acknowledgementIds.get(batchKey);
        if (!clientEventId && globalThis.crypto?.randomUUID) { clientEventId = globalThis.crypto.randomUUID(); acknowledgementIds.set(batchKey, clientEventId); }
        const payload = await request(`${API}/read`, { method: 'PATCH', body: { ids: batch,
          ...(clientEventId ? { clientEventId, surface: theme === 'gpt' ? 'vitrio-gpt' : 'vitrio-studio' } : {}) } });
        if (destroyed) return;
        if (!accountMatches(payload)) return;
        const confirmed = Array.isArray(payload.readIds) ? new Set(payload.readIds) : null;
        const accepted = new Set(confirmed ? batch.filter(value => confirmed.has(value)) : batch);
        rows = rows.map(item => accepted.has(item.id) ? { ...item, readAt: new Date().toISOString() } : item);
        unread = count(payload.unreadCount);
        list.querySelectorAll('[data-notice-id]').forEach(element => { if (accepted.has(element.dataset.noticeId)) element.classList.remove('is-unread'); });
        updateButtons();
      }
      readError = false;
      setStatus(''); updateButtons();
    } catch (cause) {
      if (destroyed) return;
      readError = true;
      setStatus('Не удалось сохранить прочтение. Уведомления остаются непрочитанными.', true, () => { readError = false; void markRead(pending); });
    } finally {
      readBusy = false; if (acknowledge) acknowledge.disabled = false;
      if (!readError && rows.some(item => !item.readAt && visibleIds.has(item.id) && !selected.has(item.id))) queueVisibleRead();
    }
  }
  function renderRows() {
    list.replaceChildren();
    for (const item of rows) {
      const [tone, icon] = notificationTone(item);
      const article = node('article', `vn-notice vn-notice--${tone}${item.readAt ? '' : ' is-unread'}`); article.dataset.noticeId = item.id;
      const iconCell = node('span', 'vn-notice-icon'); iconCell.append(glyph(icon));
      const content = node('div', 'vn-notice-content');
      const header = node('header', 'vn-notice-head'); header.append(node('h3', '', item.title));
      const time = node('time', '', notificationDate(item.publishedAt || item.createdAt));
      if (Number.isFinite(new Date(item.publishedAt || item.createdAt).getTime())) time.dateTime = item.publishedAt || item.createdAt;
      header.append(time); content.append(header);
      if (item.supersededAt && Number.isFinite(new Date(item.supersededAt).getTime())) content.append(node('span', 'vn-history-flag', 'График изменён'));
      item.paragraphs.forEach(text => content.append(node('p', '', text)));
      article.append(iconCell, content); list.append(article);
    }
    if (!rows.length && !loading && !loadFailed) { const empty = node('div', 'vn-empty'); empty.append(glyph('Mail'), node('h3', '', 'Пока нет уведомлений'), node('p', '', 'Здесь появятся сообщения о подписке и оплате.')); list.append(empty); }
    more.hidden = !nextCursor; more.disabled = loading; updateButtons(); observeRows();
  }
  async function load(append = false) {
    if (loading || destroyed || !isOpen()) return;
    loading = true; loadFailed = false; more.disabled = true; dialog.setAttribute('aria-busy', 'true'); setStatus(rows.length ? '' : 'Загружаем уведомления…');
    const controller = new AbortController(); listRequest = controller;
    try {
      const query = new URLSearchParams({ limit: '20' }); if (append && nextCursor) query.set('cursor', nextCursor);
      const payload = await request(`${API}?${query}`, { signal: controller.signal });
      if (destroyed || !isOpen() || listRequest !== controller) return;
      if (!Array.isArray(payload.notifications)) throw new Error('Invalid notification response');
      if (!accountMatches(payload)) return;
      rows = mergeNotifications(append ? rows : [], payload.notifications);
      unread = count(payload.unreadCount); nextCursor = typeof payload.nextCursor === 'string' && payload.nextCursor ? payload.nextCursor : null;
      readError = false; setStatus('');
    } catch (cause) {
      if (!destroyed && isOpen() && cause?.name !== 'AbortError') { loadFailed = true; setStatus('Не удалось загрузить уведомления. Проверьте соединение и повторите.', true, () => void load(append)); }
    } finally {
      if (listRequest === controller) { listRequest = null; loading = false; dialog.removeAttribute('aria-busy'); if (isOpen()) renderRows(); }
    }
  }
  function buildDialog() {
    dialog = node('dialog', `vn-dialog vn-theme-${theme === 'gpt' ? 'gpt' : 'studio'}`); dialog.id = id; dialog.setAttribute('aria-labelledby', `${id}-title`);
    const header = node('header', 'vn-header'), title = node('h2', '', 'Уведомления'); title.id = `${id}-title`;
    const titleGroup = node('div', 'vn-title'); titleGroup.append(glyph('Bell'), title);
    const closeButton = node('button', 'vn-close'); closeButton.type = 'button'; closeButton.setAttribute('aria-label', 'Закрыть уведомления'); closeButton.append(glyph('X')); closeButton.addEventListener('click', close);
    header.append(titleGroup, closeButton);
    const toolbar = node('div', 'vn-toolbar'); toolbar.append(node('span', '', 'Подписка и платежи'));
    acknowledge = action('Прочитать загруженные', 'CheckCheck'); acknowledge.addEventListener('click', () => void markRead(rows.map(item => item.id))); toolbar.append(acknowledge);
    status = node('div', 'vn-status'); status.hidden = true;
    list = node('div', 'vn-list'); list.setAttribute('role', 'region'); list.setAttribute('aria-label', 'История уведомлений'); list.tabIndex = 0;
    list.addEventListener('scroll', () => { if (typeof IntersectionObserver !== 'function') measureVisibleRows(); }, { passive: true });
    more = action('Показать ещё', 'ChevronDown'); more.classList.add('vn-more'); more.hidden = true; more.addEventListener('click', () => void load(true));
    const footer = node('footer', 'vn-footer'); footer.append(more, node('p', '', 'Время указано по Москве'));
    dialog.append(header, toolbar, status, list, footer); document.body.append(dialog);
    dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close(); } });
    dialog.addEventListener('close', cleanupClose);
  }
  function cleanupClose() {
    clearTimeout(readTimer); observer?.disconnect(); visibleIds.clear(); listRequest?.abort(); listRequest = null; loading = false;
    if (previousOverflow !== undefined) { document.documentElement.style.overflow = previousOverflow; previousOverflow = undefined; }
    updateButtons(); if (returnFocus?.isConnected) returnFocus.focus();
  }
  function open(trigger) {
    if (destroyed || isOpen()) return;
    if (!dialog) buildDialog();
    returnFocus = trigger || document.activeElement;
    previousOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden';
    dialog.showModal(); updateButtons(); void load();
  }
  function close() { if (dialog?.open) dialog.close(); }
  function attach(button) {
    if (destroyed || buttons.has(button)) return;
    button.classList.add('vn-trigger'); button.type = 'button'; button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-controls', id);
    const badge = node('span', 'vn-badge'); badge.setAttribute('aria-hidden', 'true');
    button.replaceChildren(glyph('Bell'), badge); buttons.set(button, badge);
    const listener = () => open(button); buttonListeners.set(button, listener);
    button.addEventListener('click', listener); updateButtons();
  }
  function detach(button) { const listener = buttonListeners.get(button); if (listener) button.removeEventListener('click', listener); buttonListeners.delete(button); buttons.delete(button); }
  const wake = () => { if (document.visibilityState === 'hidden') { clearTimeout(pollTimer); clearTimeout(readTimer); pollRequest?.abort(); } else { void refreshCount(); queueVisibleRead(); } };
  document.addEventListener('visibilitychange', wake); window.addEventListener('focus', wake); void refreshCount();
  return { accountId, attach, detach, open, close, refresh: refreshCount, destroy() {
    if (destroyed) return; destroyed = true; clearTimeout(pollTimer); clearTimeout(readTimer); pollRequest?.abort(); listRequest?.abort(); observer?.disconnect();
    close(); dialog?.remove(); rows = []; acknowledgementIds.clear(); for (const button of buttons.keys()) detach(button); document.removeEventListener('visibilitychange', wake); window.removeEventListener('focus', wake);
  } };
}

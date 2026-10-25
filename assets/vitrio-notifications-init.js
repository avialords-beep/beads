import { createVitrioNotificationCenter } from '/assets/vitrio-notifications.js?v=20261022-notices-footer-2';

/** The two native shells share one inbox; bot-scoped Telegram sessions never mount it. */
export function startVitrioNotifications({ document: doc = document, window: win = window, fetch: fetchRequest = fetch } = {}) {
  let current, center, pending, revision = 0, frame, stopped = false, retryAt = 0, failedOwner;
  const mounted = new Set();
  function targets() {
    const gpt = doc.querySelector('.gpt-studio-content-head');
    if (gpt) {
      if (new URLSearchParams(win.location.search).has('bot')) return null;
      return { owner: gpt, theme: 'gpt', slots: [gpt] };
    }
    const rail = doc.querySelector('body.v-studio-refresh .v-sidebar .sr-sidebar-tools');
    if (!rail) return null;
    return { owner: rail, theme: 'studio', slots: [rail, ...doc.querySelectorAll('.v-app > .sr-mobile-bar .v-app-header-actions')] };
  }
  function clear() {
    revision += 1; pending?.abort(); pending = null; center?.destroy(); center = null;
    for (const button of mounted) button.remove(); mounted.clear();
    current = null;
  }
  async function api(path, options = {}) {
    let response;
    try {
      response = await fetchRequest(path, { method: options.method || 'GET', credentials: 'same-origin', cache: 'no-store', signal: options.signal,
        headers: { Accept: 'application/json', ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }) },
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }) });
    } catch (cause) { if (cause?.name === 'AbortError') throw cause; throw new Error('Не удалось связаться с сервером.'); }
    let payload = {}; try { payload = await response.json(); } catch { /* Upstream HTML is never inserted into the page. */ }
    if (!response.ok) {
      if (response.status === 401) { retryAt = Date.now() + 60_000; failedOwner = current?.owner; clear(); return Promise.reject(new Error('Войдите в аккаунт, чтобы открыть уведомления.')); }
      throw new Error(typeof payload.error === 'string' ? payload.error : 'Не удалось загрузить уведомления.');
    }
    return payload;
  }
  function reconcile(target) {
    for (const button of mounted) if (!button.isConnected || !target.slots.includes(button.parentNode)) { center.detach(button); button.remove(); mounted.delete(button); }
    for (let slot of target.slots) {
      if ([...mounted].some(button => button.parentNode === slot)) continue;
      const button = doc.createElement('button'); button.dataset.vitrioNotifications = ''; button.className = target.theme === 'studio' ? 'vn-studio-trigger' : 'vn-gpt-trigger';
      if (target.theme === 'gpt') {
        // React owns its existing controls. Insert a sibling without moving or wrapping its nodes.
        slot.insertBefore(button, slot.querySelector('.gpt-balance'));
      } else slot.append(button);
      mounted.add(button); center.attach(button);
    }
  }
  function mount(target, id) {
    center = createVitrioNotificationCenter({ request: api, theme: target.theme, accountId: id, onAccountChange: () => { clear(); schedule(); } });
    reconcile(target);
  }
  async function scan() {
    frame = null; if (stopped) return;
    const target = targets();
    if (current?.owner === target?.owner && center) { current = target; reconcile(target); return; }
    if (current?.owner === target?.owner && pending) return;
    if (Date.now() < retryAt && target?.owner === failedOwner) return;
    clear(); if (!target) return;
    current = target;
    const version = revision, controller = new AbortController(); pending = controller;
    try {
      const payload = await api('/api/vitrio/me', { signal: controller.signal });
      if (stopped || revision !== version || !target.owner.isConnected || !payload.user?.id) return;
      mount(target, payload.user.id);
    } catch (cause) {
      if (cause?.name === 'AbortError' || revision !== version || stopped) return;
      // A failed identity read must never display cached account data. A fresh focus retries.
      current = null; failedOwner = target.owner; retryAt = Date.now() + 60_000;
    } finally { if (pending === controller) pending = null; }
  }
  function schedule() { if (!stopped && !frame) frame = win.requestAnimationFrame(scan); }
  const wake = () => { retryAt = 0; void center?.refresh(); schedule(); };
  const observer = new MutationObserver(records => {
    if (current?.owner.isConnected && center) {
      if (current.theme === 'gpt' && new URLSearchParams(win.location.search).has('bot')) { clear(); schedule(); return; }
      if ([...mounted].some(button => !button.isConnected)) schedule();
      else if (current.theme === 'studio') {
        const target = targets(); if (!target || target.slots.length !== current.slots.length || target.slots.some((slot, index) => slot !== current.slots[index])) schedule();
      }
      return;
    }
    if (records.some(record => record.addedNodes.length || record.removedNodes.length)) schedule();
  });
  observer.observe(doc.body, { childList: true, subtree: true });
  win.addEventListener('focus', wake); win.addEventListener('pageshow', wake); win.addEventListener('popstate', wake); schedule();
  return () => { stopped = true; observer.disconnect(); if (frame) win.cancelAnimationFrame(frame); clear(); win.removeEventListener('focus', wake); win.removeEventListener('pageshow', wake); win.removeEventListener('popstate', wake); };
}

if (typeof document !== 'undefined' && document.body) startVitrioNotifications();

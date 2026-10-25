// Support stays mounted while acknowledgments and assistant replies arrive.
const CATEGORY_ORDER = ['other', 'billing', 'subscription', 'refund'];
const outboxes = new Map();
const supportEvents = new EventTarget();
export function supportCategories(categories = []) {
  return CATEGORY_ORDER.map((code) => categories.find((item) => item.code === code)).filter(Boolean);
}
export function supportMessages(ticket, operations = []) {
  const messages = [...(ticket.messages || [])];
  for (const operation of operations) {
    if (operation.ticketId !== ticket.id || messages.some((message) => message.clientRequestId === operation.key)) continue;
    messages.push({ id: `pending-${operation.key}`, clientRequestId: operation.key, authorType: 'user', body: operation.body, createdAt: operation.createdAt, delivery: operation.status, error: operation.error, rejected: operation.rejected });
  }
  return messages;
}
export function supportTicketIsCurrent(current, incoming) {
  if (!current || current.local) return true;
  const timestamp = (ticket) => Math.max(Date.parse(ticket.updatedAt || ticket.createdAt) || 0, ...(ticket.messages || []).map((message) => Date.parse(message.createdAt) || 0));
  const previous = timestamp(current), next = timestamp(incoming);
  if (next !== previous) return next > previous;
  const ids = new Set((incoming.messages || []).map((message) => message.id));
  return (current.messages || []).every((message) => ids.has(message.id));
}

export function mountSupportWorkspace({ app, shell, request, bindCommon, icon, esc, workspaceDate, supportTone, dismissDialog, userId, initial }) {
  const categories = supportCategories(initial.categories);
  let consent = initial.aiConsent || { accepted: false, version: '' };
  let tickets = [...initial.tickets], selectedId = initial.selected?.id || '', disposed = false, timer = 0, pollInFlight = false, mutationRevision = 0, selectionRevision = 0, consentDialog = null;
  const details = new Map(initial.selected ? [[initial.selected.id, initial.selected]] : []), drafts = new Map();
  const liveOperations = outboxes.get(userId), operations = liveOperations || new Map();
  outboxes.set(userId, operations);
  const storageKey = `vitrio-support-outbox:${userId}`;
  const persisted = (() => { try { return JSON.parse(sessionStorage.getItem(storageKey) || '[]'); } catch { return []; } })();
  const saveOutbox = () => { try { if (operations.size) sessionStorage.setItem(storageKey, JSON.stringify([...operations.values()].map(({ promise, ...item }) => item))); else sessionStorage.removeItem(storageKey); } catch { /* Sending remains possible when browser storage is unavailable. */ } };
  const ticketRow = (ticket) => `<span class="v-ticket-row-top"><b>${esc(ticket.categoryLabel)}</b><i class="v-status v-status--${supportTone(ticket.status)}">${ticket.local && operationFor(ticket.id)?.status === 'error' ? 'Не подтверждено' : esc(ticket.statusLabel)}</i></span><small>${ticket.local ? operationFor(ticket.id)?.status === 'error' ? 'Проверьте отправку в диалоге' : 'Отправляем обращение…' : `Обновлено ${workspaceDate(ticket.updatedAt)}`}</small>`;
  const messageMarkup = (message) => `<span>${message.authorType === 'assistant' ? 'ИИ-помощник Vitrio' : message.authorType === 'admin' ? 'Оператор Vitrio' : 'Вы'}</span><p>${esc(message.body).replace(/\n/g, '<br>')}</p><footer><time datetime="${esc(message.createdAt)}">${workspaceDate(message.createdAt, true)}</time><span data-message-delivery></span></footer>`;
  const emptyDialogue = `<section class="v-support-dialogue v-support-dialogue--empty"><span>${icon('message')}</span><h2>Выберите обращение</h2><p>Здесь появится вся переписка с поддержкой и статус заявки.</p></section>`;
  app.innerHTML = shell('Поддержка', `<main class="v-workspace v-support-workspace"><header class="v-workspace-head v-account-head"><div><h1>Поддержка</h1><p>Создайте обращение — ответ и дальнейший статус будут храниться в одном диалоге.</p></div></header><div class="v-support-layout"><section class="v-support-create"><h2>Новое обращение</h2><p>Опишите ситуацию подробно: это поможет быстрее разобраться в вопросе.</p><form data-support-create><label class="v-field"><span>Тема обращения</span><select name="category" required>${categories.map((category) => `<option value="${esc(category.code)}">${esc(category.label)}</option>`).join('')}</select></label><label class="v-field"><span>Суть обращения</span><textarea name="description" minlength="15" maxlength="4000" placeholder="Укажите, что произошло, когда это случилось и какой результат вы ожидаете." required></textarea></label><p class="v-form-legal">Сообщение и данные аккаунта обрабатываются для ответа на обращение по <a href="/vitrio/privacy" target="_blank" rel="noopener">политике обработки данных</a>. Не указывайте пароль, код входа или реквизиты карты.</p><p class="v-form-error" role="alert" hidden></p><button class="v-button v-button--accent" type="submit">Отправить обращение</button></form></section><section class="v-support-list"><header><h2>Мои обращения</h2><span data-support-count>${tickets.length}</span></header><div data-support-tickets></div></section><section class="v-support-conversation" aria-label="Переписка с поддержкой">${emptyDialogue}</section></div></main>`);
  const workspace = app.querySelector('.v-support-workspace'), conversation = workspace.querySelector('.v-support-conversation'), list = workspace.querySelector('[data-support-tickets]'), createForm = workspace.querySelector('[data-support-create]');
  createForm.elements.category.value = 'other';
  bindCommon();
  const active = () => !disposed && workspace.isConnected;
  const visibleOperations = () => [...operations.values()];
  const operationFor = (id) => visibleOperations().find((operation) => operation.ticketId === id);
  function syncList() {
    workspace.querySelector('[data-support-count]').textContent = String(tickets.length);
    list.querySelector('.v-support-empty')?.remove();
    for (const ticket of tickets) {
      let row = [...list.children].find((node) => node.dataset.openTicket === ticket.id);
      if (!row) { row = document.createElement('button'); row.type = 'button'; row.className = 'v-ticket-row'; row.dataset.openTicket = ticket.id; list.append(row); }
      const markup = ticketRow(ticket);
      if (row.innerHTML !== markup) row.innerHTML = markup;
      row.classList.toggle('is-active', ticket.id === selectedId);
      row.setAttribute('aria-current', ticket.id === selectedId ? 'true' : 'false');
    }
    for (const row of [...list.children]) if (!tickets.some((ticket) => ticket.id === row.dataset.openTicket)) row.remove();
    if (!tickets.length) list.innerHTML = `<div class="v-support-empty"><span>${icon('message')}</span><b>Обращений пока нет</b><p>Опишите вопрос — ответ появится здесь.</p></div>`;
  }
  function rememberDraft() { const input = conversation.querySelector('[name="body"]'); if (input && selectedId) drafts.set(selectedId, input.value); }
  function scrollToLatest(thread, force = false) {
    if (force || thread.scrollHeight - thread.scrollTop - thread.clientHeight < 100) thread.scrollTo({ top: thread.scrollHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  function syncDialogue({ fresh = false, forceScroll = false } = {}) {
    const ticket = details.get(selectedId);
    if (!ticket) return;
    const mounted = conversation.querySelector('[data-support-dialogue]');
    if (fresh || mounted?.dataset.supportDialogue !== selectedId) {
      conversation.innerHTML = `<section class="v-support-dialogue" data-support-dialogue="${esc(selectedId)}"><header><div><p data-support-category></p><h2 tabindex="-1" data-support-title></h2></div><span class="v-status" data-support-status></span></header><div data-support-refund></div><div class="v-support-thread" role="log" aria-label="Сообщения обращения" aria-live="polite" aria-relevant="additions text"></div><div class="v-support-typing" role="status" hidden><span class="v-support-typing-dots" aria-hidden="true"><i></i><i></i><i></i></span><span data-support-typing-copy></span></div><p class="v-support-refresh-error" role="status" hidden>Не удалось обновить диалог. <button type="button" data-support-refresh>Повторить</button></p><form class="v-support-reply" data-support-reply><label class="sr-only" for="support-reply">Сообщение в обращение</label><textarea id="support-reply" name="body" maxlength="4000" placeholder="Дополните обращение или ответьте поддержке" required></textarea><button class="v-button v-button--accent" type="submit">Отправить</button></form><p class="v-support-closed" hidden>Обращение закрыто. Если нужен новый вопрос, создайте отдельное обращение.</p></section>`;
      conversation.querySelector('[name="body"]').value = drafts.get(selectedId) || '';
      forceScroll = true;
    }
    const thread = conversation.querySelector('.v-support-thread'), follow = forceScroll || thread.scrollHeight - thread.scrollTop - thread.clientHeight < 100;
    conversation.querySelector('[data-support-category]').textContent = ticket.categoryLabel;
    conversation.querySelector('[data-support-title]').textContent = `Обращение от ${workspaceDate(ticket.createdAt)}`;
    const status = conversation.querySelector('[data-support-status]');
    status.textContent = ticket.local ? operationFor(ticket.id)?.status === 'error' ? 'Не подтверждено' : 'Отправляем' : ticket.statusLabel;
    status.className = `v-status v-status--${supportTone(ticket.status)}`;
    const refund = conversation.querySelector('[data-support-refund]');
    const refundMarkup = ticket.refund ? `<div class="v-refund-state"><span>${icon('repeat')}</span><div><b>Заявка на возврат</b><p>Статус: ${esc(ticket.refund.statusLabel)}${ticket.refund.amount ? ` · ${Number(ticket.refund.amount).toLocaleString('ru-RU')} ₽` : ''}</p></div></div>` : '';
    if (refund.innerHTML !== refundMarkup) refund.innerHTML = refundMarkup;
    const messages = supportMessages(ticket, visibleOperations());
    const byId = new Map([...thread.children].map((node) => [node.dataset.messageId, node]));
    const byRequest = new Map([...thread.children].filter((node) => node.dataset.clientRequestId).map((node) => [node.dataset.clientRequestId, node]));
    for (const message of messages) {
      let node = byId.get(message.id) || (message.clientRequestId && byRequest.get(message.clientRequestId));
      if (!node) { node = document.createElement('article'); node.className = `v-support-message v-support-message--${['assistant', 'admin'].includes(message.authorType) ? message.authorType : 'user'} is-arriving`; node.innerHTML = messageMarkup(message); thread.append(node); node.addEventListener('animationend', () => node.classList.remove('is-arriving'), { once: true }); }
      node.dataset.messageId = message.id;
      if (message.clientRequestId) node.dataset.clientRequestId = message.clientRequestId;
      const body = node.querySelector('p');
      if (body.textContent !== message.body) body.textContent = message.body;
      const delivery = node.querySelector('[data-message-delivery]');
      const deliveryMarkup = message.delivery === 'sending' ? 'Отправляем…' : message.delivery === 'error' ? `${esc(message.error || 'Не удалось подтвердить отправку.')} <button type="button" data-support-retry="${esc(message.clientRequestId)}">Повторить</button>${message.rejected ? ` <button type="button" data-support-edit="${esc(message.clientRequestId)}">Изменить</button>` : ''}` : '';
      if (delivery.innerHTML !== deliveryMarkup) delivery.innerHTML = deliveryMarkup;
      node.classList.toggle('is-pending', message.delivery === 'sending');
      node.classList.toggle('has-send-error', message.delivery === 'error');
      if (message.delivery === 'error') delivery.title = message.error || 'Повторная отправка не создаст копию сообщения.'; else delivery.removeAttribute('title');
    }
    const ids = new Set(messages.map((message) => message.id));
    for (const node of [...thread.children]) if (!ids.has(node.dataset.messageId)) node.remove();
    const assistantState = ticket.assistant?.state;
    const typing = conversation.querySelector('.v-support-typing');
    typing.hidden = !['queued', 'processing'].includes(assistantState);
    conversation.querySelector('[data-support-typing-copy]').textContent = assistantState === 'processing' ? 'ИИ-помощник набирает ответ' : 'ИИ-помощник готовит ответ';
    const reply = conversation.querySelector('[data-support-reply]'), operation = operationFor(selectedId), closed = ticket.status === 'closed';
    reply.hidden = closed;
    conversation.querySelector('.v-support-closed').hidden = !closed;
    reply.querySelector('button').disabled = Boolean(operation) || ticket.local === true;
    reply.querySelector('button').textContent = operation?.status === 'sending' ? 'Отправляем…' : 'Отправить';
    reply.elements.body.disabled = ticket.local === true;
    if (follow) scrollToLatest(thread, true);
  }
  function updateTicket(ticket) {
    let acknowledged = false;
    for (const message of ticket.messages || []) {
      const operation = operations.get(message.clientRequestId);
      if (operation && !operation.create && operation.ticketId === ticket.id) { operations.delete(operation.key); acknowledged = true; }
    }
    if (acknowledged) { saveOutbox(); syncCreateButton(); }
    if (!supportTicketIsCurrent(details.get(ticket.id), ticket)) return;
    details.set(ticket.id, ticket);
    const index = tickets.findIndex((item) => item.id === ticket.id);
    if (index < 0) tickets.unshift(ticket); else tickets[index] = ticket;
    syncList();
    if (ticket.id === selectedId) syncDialogue();
  }
  function setUrl(id, push = false) { const url = new URL(location.href); url.searchParams.set('ticket', id); history[push ? 'pushState' : 'replaceState']({}, '', url); }
  function schedulePoll(delay) { clearTimeout(timer); if (active()) timer = setTimeout(poll, delay ?? (['queued', 'processing'].includes(details.get(selectedId)?.assistant?.state) ? 1200 : 12000)); }
  async function poll() {
    if (!active()) return;
    if (document.hidden || pollInFlight || !selectedId || details.get(selectedId)?.local) return schedulePoll(2000);
    pollInFlight = true;
    const id = selectedId, revision = mutationRevision, selection = selectionRevision;
    try {
      const { ticket } = await request(`/vitrio/support/tickets/${encodeURIComponent(id)}`);
      if (!active() || id !== selectedId || revision !== mutationRevision || selection !== selectionRevision) return;
      updateTicket(ticket);
      conversation.querySelector('.v-support-refresh-error').hidden = true;
    } catch (cause) {
      if (active() && id === selectedId) conversation.querySelector('.v-support-refresh-error').hidden = false;
    } finally { pollInFlight = false; schedulePoll(); }
  }
  async function selectTicket(id, { push = true } = {}) {
    rememberDraft(); selectedId = id; selectionRevision += 1;
    if (push && !details.get(id)?.local) setUrl(id, true);
    syncList();
    if (details.has(id)) syncDialogue({ fresh: true });
    else conversation.innerHTML = `<section class="v-support-dialogue v-support-loading" role="status"><div class="v-support-skeleton"></div><div class="v-support-skeleton"></div><p>Открываем переписку…</p></section>`;
    try {
      if (!details.get(id)?.local) {
        const revision = selectionRevision, { ticket } = await request(`/vitrio/support/tickets/${encodeURIComponent(id)}`);
        if (!active() || selectedId !== id || revision !== selectionRevision) return;
        updateTicket(ticket);
        syncDialogue();
      }
    } catch (cause) {
      if (active() && selectedId === id) {
        if (details.has(id)) conversation.querySelector('.v-support-refresh-error').hidden = false;
        else conversation.innerHTML = `<section class="v-support-dialogue v-support-dialogue--empty"><h2>Не удалось открыть обращение</h2><p>${esc(cause.message)}</p><button type="button" class="v-button v-button--soft" data-support-select-retry="${esc(id)}">Повторить</button></section>`;
      }
    } finally { schedulePoll(); }
  }
  function chooseConsent() {
    return new Promise((resolve) => {
      const restore = document.activeElement, dialog = document.createElement('div');
      dialog.className = 'v-dialog-backdrop v-support-consent-backdrop';
      dialog.innerHTML = `<section class="v-dialog v-support-consent-dialog" role="dialog" aria-modal="true" aria-labelledby="support-consent-title" aria-describedby="support-consent-copy"><header class="v-dialog-titlebar"><h2 id="support-consent-title">Подключить ИИ-помощника?</h2><button class="v-icon-button" type="button" data-consent-close aria-label="Закрыть окно">${icon('close')}</button></header><p id="support-consent-copy">Разрешите CheapVibeCode подготовить ответ по очищенному тексту обращения и необходимым сведениям об аккаунте. Согласие сохранится для следующих обращений.</p><p>Не указывайте пароли, коды входа и реквизиты карты. Решения по возвратам и спорным ситуациям проверяет поддержка.</p><a class="v-support-consent-policy" href="/vitrio/privacy" target="_blank" rel="noopener">Как обрабатываются данные</a><footer class="v-support-consent-actions"><button class="v-button v-button--accent" type="button" data-consent-accept>Согласен, отправить</button><button class="v-button v-button--soft" type="button" data-consent-without>Отправить без ИИ</button></footer></section>`;
      consentDialog = dialog;
      const shellNode = app.querySelector('.v-app'), oldOverflow = document.body.style.overflow;
      shellNode?.setAttribute('inert', ''); document.body.style.overflow = 'hidden'; document.body.append(dialog);
      let settled = false;
      const close = (choice) => {
        if (settled) return;
        settled = true; consentDialog = null;
        dismissDialog(dialog, () => { shellNode?.removeAttribute('inert'); document.body.style.overflow = oldOverflow; if (restore?.isConnected) restore.focus(); });
        resolve(choice);
      };
      dialog.supportClose = () => close(null);
      dialog.querySelector('[data-consent-close]').addEventListener('click', () => close(null));
      dialog.querySelector('[data-consent-accept]').addEventListener('click', () => close(true));
      dialog.querySelector('[data-consent-without]').addEventListener('click', () => close(false));
      dialog.addEventListener('click', (event) => { if (event.target === dialog) close(null); });
      dialog.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(null); }
        if (event.key === 'Tab') {
          const controls = [...dialog.querySelectorAll('button,a[href]')].filter((node) => !node.disabled), first = controls[0], last = controls.at(-1);
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      });
      dialog.querySelector('[data-consent-accept]').focus();
    });
  }
  function syncCreateButton() { createForm.querySelector('[type="submit"]').disabled = visibleOperations().some((item) => item.create); }
  const onAcknowledged = (event) => {
    if (!active() || event.detail.userId !== userId) return;
    const { ticket, operation } = event.detail;
    if (operation.payload.aiConsent === true) consent = { accepted: true, version: operation.payload.aiConsentVersion };
    if (operation.create) {
      const previousId = operation.ticketId;
      details.delete(previousId); tickets = tickets.filter((item) => item.id !== previousId);
      if (selectedId === previousId) {
        selectedId = ticket.id;
        // Keep the optimistic bubble, composer and scroll mounted on acknowledgment.
        const mounted = conversation.querySelector('[data-support-dialogue]');
        if (mounted) mounted.dataset.supportDialogue = ticket.id;
        setUrl(ticket.id);
      }
      if (createForm.elements.description.value.trim() === operation.body) createForm.elements.description.value = '';
    }
    mutationRevision += 1; updateTicket(ticket); syncCreateButton(); schedulePoll(600);
  };
  const onDeliveryFailed = (event) => { if (active() && event.detail.userId === userId) { syncCreateButton(); syncList(); syncDialogue(); } };
  supportEvents.addEventListener('acknowledged', onAcknowledged);
  supportEvents.addEventListener('failed', onDeliveryFailed);
  async function send(operation) {
    if (operation.promise) return operation.promise;
    operation.status = 'sending'; operation.error = ''; mutationRevision += 1; saveOutbox();
    if (active()) { syncCreateButton(); syncDialogue({ forceScroll: true }); }
    operation.promise = (async () => {
      try {
        const path = operation.create ? '/vitrio/support/tickets' : `/vitrio/support/tickets/${encodeURIComponent(operation.ticketId)}/messages`;
        const { ticket } = await request(path, { method: 'POST', body: JSON.stringify(operation.payload) });
        if (!ticket?.messages?.some((message) => message.clientRequestId === operation.key)) throw new Error('Не удалось подтвердить сохранение сообщения. Повторите отправку.');
        operations.delete(operation.key); saveOutbox(); mutationRevision += 1;
        supportEvents.dispatchEvent(new CustomEvent('acknowledged', { detail: { userId, operation, ticket } }));
      } catch (cause) {
        operation.status = 'error'; operation.error = cause.code === 'NETWORK_ERROR' ? 'Связь прервалась. Повторите отправку: сообщение не продублируется.' : cause.message;
        operation.rejected = cause.status >= 400 && cause.status < 500 && cause.status !== 408;
        saveOutbox();
        supportEvents.dispatchEvent(new CustomEvent('failed', { detail: { userId } }));
      } finally { operation.promise = null; }
    })();
    return operation.promise;
  }
  function newOperation({ body, create = false, category, aiConsent }) {
    const key = crypto.randomUUID(), createdAt = new Date().toISOString(), ticketId = create ? `pending-${key}` : selectedId;
    const payload = { clientRequestId: key, background: true, ...(create ? { category, description: body, ...(aiConsent === undefined ? {} : { aiConsent }), ...(aiConsent === true ? { aiConsentVersion: consent.version } : {}) } : { body }) };
    const operation = { key, body, create, ticketId, createdAt, payload, status: 'sending' };
    operations.set(key, operation); saveOutbox();
    if (create) {
      const ticket = { id: ticketId, category, categoryLabel: categories.find((item) => item.code === category)?.label || 'Другой вопрос', status: 'open', statusLabel: 'Отправляем', createdAt, updatedAt: createdAt, local: true, messages: [] };
      rememberDraft(); details.set(ticketId, ticket); tickets.unshift(ticket); selectedId = ticketId; selectionRevision += 1; syncList(); syncDialogue({ fresh: true, forceScroll: true });
      if (matchMedia('(max-width: 1200px)').matches) conversation.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    }
    return operation;
  }
  createForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (consentDialog || visibleOperations().some((item) => item.create) || !createForm.reportValidity()) return;
    const error = createForm.querySelector('.v-form-error'); error.hidden = true;
    const body = createForm.elements.description.value.trim(), category = createForm.elements.category.value;
    if (body.length < 15) { error.textContent = 'Опишите вопрос немного подробнее — минимум 15 символов.'; error.hidden = false; createForm.elements.description.focus(); return; }
    let choice;
    if (!consent.accepted) { choice = await chooseConsent(); if (choice === null || !active()) return; }
    void send(newOperation({ body, category, create: true, aiConsent: choice }));
  });
  conversation.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-support-reply]'); if (!form) return;
    event.preventDefault();
    const body = form.elements.body.value.trim();
    if (!body || operationFor(selectedId) || details.get(selectedId)?.local || !form.reportValidity()) return;
    form.elements.body.value = ''; drafts.delete(selectedId);
    void send(newOperation({ body }));
  });
  conversation.addEventListener('click', (event) => {
    const retry = event.target.closest('[data-support-retry]');
    if (retry) { const operation = operations.get(retry.dataset.supportRetry); if (operation) void send(operation); }
    const edit = event.target.closest('[data-support-edit]');
    if (edit) {
      const operation = operations.get(edit.dataset.supportEdit);
      if (operation?.rejected && !operation.promise) {
        operations.delete(operation.key); saveOutbox(); mutationRevision += 1; syncCreateButton();
        if (operation.create) {
          details.delete(operation.ticketId); tickets = tickets.filter((ticket) => ticket.id !== operation.ticketId);
          createForm.elements.description.value = operation.body;
          createForm.elements.category.value = operation.payload.category;
          createForm.elements.category.dispatchEvent(new Event('change', { bubbles: true }));
          const error = createForm.querySelector('.v-form-error'); error.textContent = operation.error; error.hidden = false;
          selectedId = tickets[0]?.id || ''; syncList();
          if (selectedId) void selectTicket(selectedId, { push: false }); else conversation.innerHTML = emptyDialogue;
          createForm.elements.description.focus();
          void request('/vitrio/support/tickets').then((data) => { if (active()) consent = data.aiConsent || consent; }).catch(() => {});
        } else { syncDialogue(); const input = conversation.querySelector('[name="body"]'); if (input) { input.value = operation.body; input.focus(); } }
      }
    }
    if (event.target.closest('[data-support-refresh]')) void poll();
    const selectRetry = event.target.closest('[data-support-select-retry]'); if (selectRetry) void selectTicket(selectRetry.dataset.supportSelectRetry, { push: false });
  });
  list.addEventListener('click', (event) => { const row = event.target.closest('[data-open-ticket]'); if (row && row.dataset.openTicket !== selectedId) void selectTicket(row.dataset.openTicket); });
  const onVisibility = () => { if (!document.hidden) schedulePoll(0); };
  document.addEventListener('visibilitychange', onVisibility);
  for (const item of liveOperations ? [...liveOperations.values()] : Array.isArray(persisted) ? persisted.slice(0, 20) : []) {
    if (!item || !/^[\w-]{8,100}$/.test(item.key) || typeof item.body !== 'string' || item.body.length > 4000 || typeof item.ticketId !== 'string' || !Number.isFinite(Date.parse(item.createdAt)) || !item.payload || item.payload.clientRequestId !== item.key || item.payload.background !== true || (item.create ? item.payload.description !== item.body || !CATEGORY_ORDER.includes(item.payload.category) : item.payload.body !== item.body)) continue;
    if (initial.selected?.messages?.some((message) => message.clientRequestId === item.key)) { operations.delete(item.key); continue; }
    if (!item.promise) { item.status = 'error'; item.error = 'Отправка не была подтверждена. Повторите её: сообщение не продублируется.'; }
    operations.set(item.key, item);
    if (item.create) { const category = item.payload.category; const ticket = { id: item.ticketId, category, categoryLabel: categories.find((entry) => entry.code === category)?.label || 'Другой вопрос', status: 'open', statusLabel: 'Не подтверждено', createdAt: item.createdAt, updatedAt: item.createdAt, local: true, messages: [] }; details.set(ticket.id, ticket); tickets.unshift(ticket); selectedId = ticket.id; }
  }
  saveOutbox(); syncCreateButton(); syncList();
  if (selectedId) syncDialogue({ fresh: true });
  schedulePoll();
  return () => { disposed = true; clearTimeout(timer); rememberDraft(); consentDialog?.supportClose(); document.removeEventListener('visibilitychange', onVisibility); supportEvents.removeEventListener('acknowledged', onAcknowledged); supportEvents.removeEventListener('failed', onDeliveryFailed); };
}

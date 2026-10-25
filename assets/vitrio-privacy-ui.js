export async function loadVitrioLegalDocuments(signal) {
  const response = await fetch('/api/legal/documents?product=vitrio', { credentials: 'same-origin', cache: 'no-store', signal, headers: { Accept: 'application/json' } });
  const payload = await response.json().catch(() => ({}));
  const documents = payload.documents;
  if (!response.ok || !documents?.dataConsent || !documents?.agreement || !documents?.privacy) throw new Error('Не удалось загрузить документы. Повторите попытку.');
  for (const document of Object.values(documents)) {
    let legalUrl;
    try { legalUrl = new URL(document?.url, 'https://vitrio.space'); } catch { /* Invalid document URL is rejected below. */ }
    if (!document || typeof document.url !== 'string' || typeof document.version !== 'string' || !/^[a-f0-9]{64}$/i.test(document.sha256 || '') || legalUrl?.origin !== 'https://vitrio.space' || legalUrl.username || legalUrl.password) throw new Error('Не удалось проверить документы. Повторите попытку.');
  }
  return Object.freeze(Object.fromEntries(Object.entries(documents).map(([key, document]) => [key, Object.freeze({ ...document })])));
}

// One native confirmation is shared by the product's owned-result surfaces.
export function confirmOwnedContentDeletion({ title, description, deleteContent, trigger = document.activeElement, paper = false }) {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = `vitrio-erasure-dialog${paper ? ' is-paper' : ''}`;
    const heading = document.createElement('h2'); heading.id = 'vitrio-erasure-title'; heading.textContent = title;
    const copy = document.createElement('p'); copy.textContent = description;
    const error = document.createElement('p'); error.className = 'vitrio-erasure-error'; error.setAttribute('role', 'alert'); error.hidden = true;
    const actions = document.createElement('div'); actions.className = 'vitrio-erasure-actions';
    const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = 'Отмена';
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'vitrio-erasure-submit'; remove.textContent = 'Удалить';
    actions.append(cancel, remove); dialog.append(heading, copy, error, actions); dialog.setAttribute('aria-labelledby', heading.id);
    let busy = false, deleted = false;
    const close = () => { if (!busy) dialog.close(); };
    cancel.addEventListener('click', close);
    dialog.addEventListener('keydown', (event) => event.stopPropagation());
    dialog.addEventListener('cancel', (event) => { if (busy) event.preventDefault(); });
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
    });
    remove.addEventListener('click', async () => {
      if (busy) return;
      busy = true; cancel.disabled = true; remove.disabled = true; remove.textContent = 'Удаляем…'; dialog.setAttribute('aria-busy', 'true'); error.hidden = true;
      try { await deleteContent(); deleted = true; busy = false; dialog.close(); }
      catch (cause) { error.textContent = cause?.message || 'Не удалось удалить. Повторите попытку.'; error.hidden = false; }
      finally { busy = false; cancel.disabled = false; remove.disabled = false; remove.textContent = 'Удалить'; dialog.removeAttribute('aria-busy'); }
    });
    dialog.addEventListener('close', () => { dialog.remove(); if (trigger?.isConnected) trigger.focus({ preventScroll: true }); resolve(deleted); }, { once: true });
    document.body.append(dialog); dialog.showModal(); cancel.focus();
  });
}

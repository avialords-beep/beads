// Keep the native select as the source of truth for existing filters and forms.
export function initPartnerAdminSelects(root = document, options = {}) {
  const doc = root.ownerDocument || root;
  const win = doc.defaultView;
  const controls = new Map();
  let active = null;
  let nextId = 0;

  const close = (focus = false) => {
    if (!active) return;
    const current = active;
    active = null;
    if (current.menu.hasAttribute('popover') && current.menu.matches(':popover-open')) current.menu.hidePopover();
    current.menu.hidden = true;
    current.trigger.setAttribute('aria-expanded', 'false');
    current.trigger.removeAttribute('aria-activedescendant');
    if (focus && current.trigger.isConnected) current.trigger.focus({ preventScroll: true });
  };

  function enhance(select) {
    if (controls.has(select) || select.multiple || select.size > 1 || select.hasAttribute('data-native-select')) return;
    const original = { tabIndex: select.getAttribute('tabindex'), ariaHidden: select.getAttribute('aria-hidden') };
    const label = select.getAttribute('aria-label') || [...(select.labels || [])].map((node) => {
      const copy = node.cloneNode(true);
      copy.querySelectorAll('select, input, button').forEach((field) => field.remove());
      return copy.textContent.trim();
    }).join(' ') || select.name || 'Выберите значение';
    const wrapper = doc.createElement('span');
    wrapper.className = 'partner-admin-select';
    const trigger = doc.createElement('button');
    trigger.type = 'button';
    trigger.className = 'partner-admin-select-trigger';
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-autocomplete', 'none');
    trigger.setAttribute('aria-label', label);
    const text = doc.createElement('span');
    const arrow = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrow.setAttribute('viewBox', '0 0 24 24');
    arrow.setAttribute('aria-hidden', 'true');
    const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'm7 10 5 5 5-5');
    arrow.append(path);
    let resolvedArrow = arrow;
    if (options.icons?.ChevronDown) { const holder = doc.createElement('span'); holder.innerHTML = options.icons.ChevronDown; resolvedArrow = holder.firstElementChild; }
    trigger.append(text, resolvedArrow);
    const menu = doc.createElement('div');
    menu.className = 'partner-admin-select-menu';
    do { menu.id = `partner-admin-select-menu-${++nextId}`; } while (doc.getElementById(menu.id));
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-label', label);
    menu.hidden = true;
    if (typeof menu.showPopover === 'function') menu.setAttribute('popover', 'manual');
    trigger.setAttribute('aria-controls', menu.id);
    const error = doc.createElement('span');
    error.className = 'partner-admin-select-error';
    error.id = `${menu.id}-error`;
    error.setAttribute('role', 'alert');
    error.hidden = true;
    select.before(wrapper);
    wrapper.append(select, trigger, error);
    (select.closest('dialog') || doc.body).append(menu);
    select.classList.add('partner-admin-select-native');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');
    let items = [];
    let highlighted = -1;
    let prefix = '';
    let typedAt = 0;
    const abort = new win.AbortController();
    const on = (target, type, fn) => target.addEventListener(type, fn, { signal: abort.signal });
    const isDisabled = () => select.matches(':disabled');
    const enabled = () => items.filter((item) => !item.disabled);
    const mark = (index) => {
      highlighted = index;
      items.forEach((item) => item.node.classList.toggle('is-highlighted', item.index === index));
      const item = items.find((candidate) => candidate.index === index);
      if (!item) { trigger.removeAttribute('aria-activedescendant'); return; }
      trigger.setAttribute('aria-activedescendant', item.node.id);
      item.node.scrollIntoView({ block: 'nearest' });
    };
    const sync = () => {
      const selected = select.options[select.selectedIndex];
      text.textContent = selected?.label || 'Выберите значение';
      trigger.title = text.textContent;
      trigger.disabled = isDisabled();
      wrapper.hidden = select.hidden;
      trigger.setAttribute('aria-required', String(select.required));
      const labelledBy = select.getAttribute('aria-labelledby');
      if (labelledBy) trigger.setAttribute('aria-labelledby', labelledBy);
      else trigger.removeAttribute('aria-labelledby');
      trigger.setAttribute('aria-label', select.getAttribute('aria-label') || label);
      if (select.validity.valid) { error.hidden = true; error.textContent = ''; }
      trigger.setAttribute('aria-invalid', String(!error.hidden));
      const describedBy = [select.getAttribute('aria-describedby'), !error.hidden && error.id].filter(Boolean).join(' ');
      if (describedBy) trigger.setAttribute('aria-describedby', describedBy);
      else trigger.removeAttribute('aria-describedby');
      if (active?.select === select) {
        if (trigger.disabled || wrapper.hidden) close();
        else {
          render();
          position();
          mark(items.find((item) => item.index === highlighted && !item.disabled)?.index ?? enabled()[0]?.index ?? -1);
        }
      }
    };
    const render = () => {
      items = [...select.options].filter((option) => !option.hidden && !option.parentElement.hidden).map((option) => {
        const node = doc.createElement('div');
        const index = option.index;
        const disabled = option.disabled || option.parentElement.disabled;
        node.id = `${menu.id}-option-${index}`;
        node.className = 'partner-admin-select-option';
        node.setAttribute('role', 'option');
        node.setAttribute('aria-selected', String(index === select.selectedIndex));
        node.setAttribute('aria-disabled', String(Boolean(disabled)));
        node.dataset.index = String(index);
        node.textContent = option.label;
        if (options.icons?.Check) { const mark = doc.createElement('span'); mark.className = 'partner-admin-select-check'; mark.innerHTML = options.icons.Check; node.append(mark); node.classList.add('has-lucide-check'); }
        return { node, index, disabled, label: option.label };
      });
      menu.replaceChildren(...items.map((item) => item.node));
      if (!items.length) {
        const empty = doc.createElement('div');
        empty.className = 'partner-admin-select-empty';
        empty.textContent = 'Нет доступных вариантов';
        menu.append(empty);
      }
    };
    const position = () => {
      if (active?.select !== select) return;
      const rect = trigger.getBoundingClientRect();
      if (!trigger.getClientRects().length) { close(); return; }
      const viewport = win.visualViewport;
      const leftEdge = (viewport?.offsetLeft || 0) + 8;
      const topEdge = (viewport?.offsetTop || 0) + 8;
      const width = (viewport?.width || doc.documentElement.clientWidth) - 16;
      const bottomEdge = topEdge + (viewport?.height || win.innerHeight) - 16;
      const menuWidth = Math.min(width, Math.max(rect.width, 180));
      menu.style.width = `${menuWidth}px`;
      const below = Math.max(0, bottomEdge - rect.bottom - 6);
      const above = Math.max(0, rect.top - topEdge - 6);
      const desired = Math.min(320, menu.scrollHeight);
      const goesAbove = below < desired && above > below;
      const height = Math.min(320, goesAbove ? above : below);
      menu.style.maxHeight = `${height}px`;
      menu.style.left = `${Math.max(leftEdge, Math.min(rect.left, leftEdge + width - menuWidth))}px`;
      menu.style.top = `${goesAbove ? rect.top - Math.min(menu.scrollHeight, height) - 6 : rect.bottom + 6}px`;
    };
    const control = { select, trigger, menu, sync, position, destroy };
    const open = () => {
      sync();
      if (trigger.disabled) return;
      close();
      render();
      active = control;
      menu.hidden = false;
      if (menu.hasAttribute('popover')) menu.showPopover();
      trigger.setAttribute('aria-expanded', 'true');
      position();
      mark(items.find((item) => item.index === select.selectedIndex && !item.disabled)?.index ?? enabled()[0]?.index ?? -1);
    };
    const commit = (index) => {
      if (isDisabled() || !items.some((item) => item.index === index && !item.disabled)) return;
      const changed = select.selectedIndex !== index;
      close(true);
      select.selectedIndex = index;
      if (changed) {
        select.dispatchEvent(new win.Event('input', { bubbles: true }));
        select.dispatchEvent(new win.Event('change', { bubbles: true }));
      }
      sync();
    };
    on(trigger, 'click', () => active === control ? close() : open());
    on(trigger, 'keydown', (event) => {
      const isOpen = active === control;
      if (event.key === 'Escape' && isOpen) { event.preventDefault(); event.stopPropagation(); close(true); return; }
      if (event.key === 'Tab') { close(); return; }
      if (['Enter', ' '].includes(event.key)) {
        event.preventDefault();
        if (isOpen) commit(highlighted); else open();
        return;
      }
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        if (!isOpen) open();
        const choices = enabled();
        const cursor = choices.findIndex((item) => item.index === highlighted);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 : !isOpen ? Math.max(0, cursor) : Math.max(0, Math.min(choices.length - 1, cursor + (event.key === 'ArrowDown' ? 1 : -1)));
        mark(choices[next]?.index ?? -1);
        return;
      }
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        if (!isOpen) render();
        const now = Date.now();
        prefix = now - typedAt > 700 ? event.key : prefix + event.key;
        typedAt = now;
        const match = enabled().find((item) => item.label.toLocaleLowerCase().startsWith(prefix.toLocaleLowerCase()));
        if (match) { if (isOpen) mark(match.index); else commit(match.index); }
      }
    });
    on(menu, 'mousedown', (event) => event.preventDefault());
    on(menu, 'click', (event) => {
      const option = event.target.closest('[data-index]');
      if (option) commit(Number(option.dataset.index));
    });
    on(select, 'change', sync);
    on(select, 'input', sync);
    on(select, 'focus', () => trigger.focus());
    on(select, 'invalid', (event) => {
      event.preventDefault();
      error.hidden = false;
      error.textContent = select.validationMessage;
      sync();
      trigger.focus();
    });
    if (select.form) on(select.form, 'reset', () => win.setTimeout(sync, 0));

    // Programmatic assignments do not emit change or a DOM mutation.
    const descriptors = new Map();
    for (const key of ['value', 'selectedIndex']) {
      const descriptor = Object.getOwnPropertyDescriptor(win.HTMLSelectElement.prototype, key);
      if (!descriptor || Object.hasOwn(select, key)) continue;
      descriptors.set(key, descriptor);
      Object.defineProperty(select, key, { configurable: true, get() { return descriptor.get.call(this); }, set(value) { descriptor.set.call(this, value); sync(); } });
    }
    const observer = new win.MutationObserver(sync);
    observer.observe(select, { subtree: true, childList: true, characterData: true, attributes: true });
    function destroy() {
      if (active === control) close();
      observer.disconnect();
      abort.abort();
      descriptors.forEach((_, key) => { delete select[key]; });
      select.classList.remove('partner-admin-select-native');
      for (const [key, value] of [['tabindex', original.tabIndex], ['aria-hidden', original.ariaHidden]]) {
        if (value === null) select.removeAttribute(key); else select.setAttribute(key, value);
      }
      wrapper.before(select);
      wrapper.remove();
      menu.remove();
      controls.delete(select);
    }
    controls.set(select, control);
    sync();
  }

  const refresh = () => {
    for (const [select, control] of controls) if (!root.contains(select)) control.destroy();
    root.querySelectorAll('select').forEach(enhance);
    controls.forEach((control) => control.sync());
  };
  const observer = new win.MutationObserver((records) => {
    if (records.some((record) => record.target.nodeName === 'FIELDSET' || [...record.addedNodes, ...record.removedNodes].some((node) => node.nodeType === 1 && (node.matches('select') || node.querySelector('select'))))) refresh();
  });
  const abort = new win.AbortController();
  const onOutside = (event) => { if (active && !active.trigger.contains(event.target) && !active.menu.contains(event.target)) close(); };
  doc.addEventListener('pointerdown', onOutside, { capture: true, signal: abort.signal });
  doc.addEventListener('focusin', onOutside, { signal: abort.signal });
  doc.addEventListener('scroll', () => active?.position(), { capture: true, passive: true, signal: abort.signal });
  win.addEventListener('resize', () => active?.position(), { signal: abort.signal });
  win.visualViewport?.addEventListener('resize', () => active?.position(), { signal: abort.signal });
  refresh();
  observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['disabled'] });
  return { refresh, destroy() { observer.disconnect(); abort.abort(); [...controls.values()].forEach((control) => control.destroy()); } };
}

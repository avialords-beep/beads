// Keep an opened one-time link through reloads, only in this tab and for 30 minutes.
export function readPasswordResetToken(scope) {
  const key = `${scope}:password-reset`;
  const query = new URLSearchParams(location.search);
  const fromUrl = query.get('token') || new URLSearchParams(location.hash.slice(1)).get('token') || '';
  let saved = '';
  try {
    if (fromUrl) {
      sessionStorage.setItem(key, JSON.stringify({ token: fromUrl, openedAt: Date.now() }));
      saved = fromUrl;
    } else {
      const record = JSON.parse(sessionStorage.getItem(key) || 'null');
      const age = Date.now() - record?.openedAt;
      if (typeof record?.token === 'string' && age >= 0 && age < 30 * 60 * 1000) saved = record.token;
      else sessionStorage.removeItem(key);
    }
  } catch { /* A blocked tab store keeps the token in a fragment instead. */ }
  if (fromUrl) {
    query.delete('token');
    history.replaceState(null, '', `${location.pathname}${query.size ? `?${query}` : ''}${saved ? '' : `#token=${encodeURIComponent(fromUrl)}`}`);
  }
  return fromUrl || saved;
}

export function clearPasswordResetToken(scope) {
  try { sessionStorage.removeItem(`${scope}:password-reset`); } catch { /* Storage may be blocked. */ }
}

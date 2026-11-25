const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Prefixes root-relative asset paths ("/images/...") in bundled data with the deploy base URL. */
export function withBase<T>(value: T): T {
  if (typeof value === 'string') return (value.startsWith('/') ? BASE + value : value) as T;
  if (Array.isArray(value)) return value.map(withBase) as T;
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, withBase(v)])) as T;
  return value;
}

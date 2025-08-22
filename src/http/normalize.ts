// src/http/normalize.ts
const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeUuidsDeep<T>(value: T): T {
  if (typeof value === 'string') {
    return (UUID_SHAPE.test(value) ? value.toLowerCase() : value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map(normalizeUuidsDeep) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: any = Array.isArray(value) ? [] : {};
    for (const [k, v] of Object.entries(value as any)) {
      out[k] = normalizeUuidsDeep(v);
    }
    return out;
  }
  return value;
}

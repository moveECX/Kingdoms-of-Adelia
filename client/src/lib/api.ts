const BASE = '/api/v1';

async function parse<T>(res: Response, path: string): Promise<T> {
  const data: unknown = await res.json();
  if (!res.ok) {
    const msg = (data as { error?: string }).error ?? String(res.status);
    throw new Error(`${path}: ${msg}`);
  }
  return data as T;
}

export async function getJson<T>(path: string): Promise<T> {
  return parse<T>(await fetch(BASE + path), path);
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parse<T>(res, path);
}

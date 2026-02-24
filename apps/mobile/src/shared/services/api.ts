import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
console.log('[API] Base URL:', API_URL);

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    await supabase.auth.signOut();
    throw new Error('Session expired');
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error?.message ?? `Request failed: ${response.status}`);
  }
  const json = await response.json();
  return json.data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  console.log('[API] GET', `${API_URL}${path}`);
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}${path}`, { headers });
  console.log('[API] GET', path, '→', response.status);
  return handleResponse<T>(response);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  console.log('[API] POST', `${API_URL}${path}`, body ? JSON.stringify(body).slice(0, 200) : '(no body)');
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: body ? { ...headers, 'Content-Type': 'application/json' } : headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  console.log('[API] POST', path, '→', response.status);
  return handleResponse<T>(response);
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function apiDelete(path: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers,
  });
  if (response.status === 401) {
    await supabase.auth.signOut();
    throw new Error('Session expired');
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error?.message ?? `Request failed: ${response.status}`);
  }
}

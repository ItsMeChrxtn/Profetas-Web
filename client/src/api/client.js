import { API_BASE } from '../utils/apiBase.js';
import { withLoader } from '../utils/loader.js';

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${API_BASE}/api${path}`, {
    credentials: 'include',
    headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || 'Something went wrong. Please try again.');
    error.status = res.status;
    error.errors = data.errors;
    throw error;
  }

  return data;
}

// Save/update/delete requests show the mushroom loader unless called with { loader: false }.
function mutate(method, path, body, { loader = true } = {}) {
  const payload = body instanceof FormData ? body : JSON.stringify(body ?? {});
  const run = () => request(path, { method, body: payload });
  return loader ? withLoader(run) : run();
}

export const api = {
  get: (path) => request(path),
  post: (path, body, opts) => mutate('POST', path, body, opts),
  put: (path, body, opts) => mutate('PUT', path, body, opts),
  patch: (path, body, opts) => mutate('PATCH', path, body, opts),
  del: (path, opts) => {
    const run = () => request(path, { method: 'DELETE' });
    return opts?.loader === false ? run() : withLoader(run);
  },
};

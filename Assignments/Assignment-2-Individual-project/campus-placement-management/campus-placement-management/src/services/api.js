const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('Cannot reach the server. Is JSON Server running on port 5000?');
  }

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  list: (resource) => request(`/${resource}`),
  create: (resource, data) =>
    request(`/${resource}`, { method: 'POST', body: JSON.stringify(data) }),
  update: (resource, id, data) =>
    request(`/${resource}/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (resource, id) => request(`/${resource}/${id}`, { method: 'DELETE' }),
};

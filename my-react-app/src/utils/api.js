const ACCESS_KEY = 'scrum_access';
const REFRESH_KEY = 'scrum_refresh';

const getApiBase = () => import.meta.env.VITE_API_URL || '';

async function doFetch(url, opts = {}) {
  const res = await fetch(url, opts);
  return res;
}

/**
 * apiFetch(pathOrUrl, options)
 * - Añade Authorization con el access token (si existe)
 * - Si la respuesta es 401 intenta refrescar usando refresh token y reintenta una vez
 * - Lanza error si no es posible autenticar/refresh
 *
 * pathOrUrl: ruta relativa (ej: '/api/tasks/') o URL absoluta
 */
export async function apiFetch(pathOrUrl, options = {}) {
  const api = getApiBase();
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${api}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;

  const headers = new Headers(options.headers || {});
  const access = localStorage.getItem(ACCESS_KEY);
  if (access) headers.set('Authorization', `Bearer ${access}`);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let res = await doFetch(url, { ...options, headers });

  if (res.status === 401) {
    // intentar refresh once
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (!refresh) {
      // no hay refresh: limpiar estado local
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem('scrum_user');
      throw new Error('Unauthorized');
    }

    const refreshRes = await doFetch(`${api}/api/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!refreshRes.ok) {
      // refresh falló: limpiar y fallar
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem('scrum_user');
      throw new Error('Session expired');
    }

    const refreshData = await refreshRes.json();
    localStorage.setItem(ACCESS_KEY, refreshData.access);

    // reintentar la petición original con nuevo access token
    headers.set('Authorization', `Bearer ${refreshData.access}`);
    res = await doFetch(url, { ...options, headers });
  }

  return res;
}

export default apiFetch;
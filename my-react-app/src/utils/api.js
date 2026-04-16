const ACCESS_KEY = 'scrum_access';
const REFRESH_KEY = 'scrum_refresh';

// Toma la URL base de la API desde variables de entorno de Vite.
const getApiBase = () => import.meta.env.VITE_API_URL || '';

// Envoltorio simple sobre fetch (nos permite centralizar cambios futuros).
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
  // API base (ej: http://127.0.0.1:8000)
  const api = getApiBase();
  // Si recibimos URL absoluta la usamos; si no, armamos URL con la base.
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${api}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;

  // Construimos headers partiendo de los que nos pasen opcionalmente.
  const headers = new Headers(options.headers || {});
  // Si hay access token, lo mandamos como Bearer para endpoints protegidos.
  const access = localStorage.getItem(ACCESS_KEY);
  if (access) headers.set('Authorization', `Bearer ${access}`);
  // Si no es FormData, por defecto trabajamos como JSON.
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Hacemos primer intento de request.
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

    // Intento de renovación de access usando refresh token.
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

  // Devolvemos la respuesta final (original o reintentada tras refresh).
  return res;
}

export default apiFetch;
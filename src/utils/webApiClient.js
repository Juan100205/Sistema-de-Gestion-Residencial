// src/utils/webApiClient.js
// Polyfill for window.api — uses fetch to talk to the Express server
// instead of Electron IPC. Matches the exact interface of preload.js.

const BASE = '/api';

async function post(url, body) {
  const res = await fetch(BASE + url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function put(url, body) {
  const res = await fetch(BASE + url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function get(url) {
  const res = await fetch(BASE + url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function del(url) {
  const res = await fetch(BASE + url, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function qs(params) {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null))
  ).toString();
  return q ? '?' + q : '';
}

const webApi = {
  periodo: {
    getAll: () => get('/periodo'),
    getActivo: () => get('/periodo/activo'),
    delete: (id) => del(`/periodo/${id}`),
    update: (payload) => put('/periodo', payload),
    resetEnvVars: (id) => post(`/periodo/${id}/resetEnvVars`),
    getConsumoDetallado: (anio, mes) => get(`/periodo/consumo/${anio}/${mes}`),
    saveConsumos: (payload) => post('/periodo/saveConsumos', payload),
    saveMultipleConsumos: (payload) => post('/periodo/saveMultipleConsumos', payload),
    getPrevious: ({ anio, mes }) => get(`/periodo/previous${qs({ anio, mes })}`),
  },
  basurero: {
    getAll: () => get('/basurero'),
    restore: (payload) => post('/basurero/restore', payload),
    getSnapshotData: ({ anio, mes }) => get(`/basurero/snapshot${qs({ anio, mes })}`),
  },
  excel: {
    saveData: (rows) => post('/excel/save', rows),
    updateData: (payload) => put('/excel/update', payload),
  },
  export: {
    getTorres: () => get('/export/torres'),
    getApartamentos: () => get('/export/apartamentos'),
    getReportData: ({ anio, mes, filters }) =>
      get(`/export/report${qs({ anio, mes, filters: filters ? JSON.stringify(filters) : undefined })}`),
    getApartmentHistory: ({ aptoId }) => get(`/export/history/${aptoId}`),
    getAllData: () => get('/export/all'),
  },
  home: {
    getStats: (periodoId) => get(`/home/stats${qs({ periodoId })}`),
    getAlertas: () => get('/home/alertas'),
    getHeatmap: (periodoId) => get(`/home/heatmap${qs({ periodoId })}`),
  },
  audit: {
    getAll: () => get('/audit'),
  },
  db: {
    getInfo: () => get('/db/info'),
    reset: () => post('/db/reset'),
  },
};

export default webApi;

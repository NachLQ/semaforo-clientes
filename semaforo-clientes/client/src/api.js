// api.js — pequeño cliente HTTP para hablar con la API.

async function req(url, opciones = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones,
  });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const data = await res.json();
      if (data.error) msg = data.error;
    } catch {
      /* sin cuerpo JSON */
    }
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Catálogos
  tiposEvento: () => req('/api/tipos-evento'),
  plantillas: () => req('/api/plantillas-mensaje'),

  // Clientes
  listarClientes: () => req('/api/clientes'),
  crearCliente: (datos) => req('/api/clientes', { method: 'POST', body: JSON.stringify(datos) }),
  obtenerCliente: (id) => req(`/api/clientes/${id}`),
  actualizarCliente: (id, datos) => req(`/api/clientes/${id}`, { method: 'PUT', body: JSON.stringify(datos) }),
  borrarCliente: (id) => req(`/api/clientes/${id}`, { method: 'DELETE' }),

  // Eventos
  crearEvento: (clienteId, datos) =>
    req(`/api/clientes/${clienteId}/eventos`, { method: 'POST', body: JSON.stringify(datos) }),
  borrarEvento: (clienteId, eventoId) =>
    req(`/api/clientes/${clienteId}/eventos/${eventoId}`, { method: 'DELETE' }),

  // Panel
  panel: () => req('/api/panel'),
  alertas: () => req('/api/panel/alertas'),

  // Revisión trimestral
  revisionActual: () => req('/api/revision/actual'),
  guardarDecisiones: (datos) => req('/api/revision/decisiones', { method: 'POST', body: JSON.stringify(datos) }),
};

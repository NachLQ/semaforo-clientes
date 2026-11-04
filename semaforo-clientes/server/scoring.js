// scoring.js
// Motor de cálculo del "Semáforo de Clientes".
// Toda la lógica de puntuación vive aquí para que sea fácil de auditar y testear.
// La fórmula completa está documentada en el README.

// Catálogo de tipos de evento. Cada tipo define qué significa su valor numérico.
export const TIPOS_EVENTO = {
  pago_puntual: {
    etiqueta: 'Pago puntual',
    grupo: 'pago',
    campoNumerico: null, // el importe va en "importe"
    icono: '✅',
  },
  pago_tardio: {
    etiqueta: 'Pago tardío',
    grupo: 'pago',
    campoNumerico: 'dias', // días de retraso
    etiquetaNumerico: 'Días de retraso',
    icono: '⏰',
  },
  pago_parcial: {
    etiqueta: 'Pago parcial o incompleto',
    grupo: 'pago',
    campoNumerico: 'dias', // días de retraso (opcional)
    etiquetaNumerico: 'Días de retraso',
    icono: '🪙',
  },
  cambio_alcance: {
    etiqueta: 'Cambio de alcance / scope creep',
    grupo: 'gestion',
    campoNumerico: null,
    icono: '🔀',
  },
  hora_extra: {
    etiqueta: 'Hora extra no facturada',
    grupo: 'horas',
    campoNumerico: 'horas',
    etiquetaNumerico: 'Horas',
    icono: '🕒',
  },
  urgencia: {
    etiqueta: 'Urgencia fuera de horario',
    grupo: 'gestion',
    campoNumerico: null,
    icono: '🚨',
  },
  tono: {
    etiqueta: 'Tono de la relación',
    grupo: 'tono',
    campoNumerico: 'valoracion', // 1-5
    etiquetaNumerico: 'Valoración (1-5)',
    icono: '🙂',
  },
  reunion_no_productiva: {
    etiqueta: 'Reunión no productiva',
    grupo: 'gestion',
    campoNumerico: null,
    icono: '💬',
  },
  revision_extra: {
    etiqueta: 'Revisión extra no prevista',
    grupo: 'gestion',
    campoNumerico: null,
    icono: '🔁',
  },
  incidencia: {
    etiqueta: 'Incidencia destacada',
    grupo: 'otro',
    campoNumerico: null,
    icono: '📌',
  },
};

const TIPOS_PAGO = ['pago_puntual', 'pago_tardio', 'pago_parcial'];
const TIPOS_GESTION = ['cambio_alcance', 'urgencia', 'reunion_no_productiva', 'revision_extra'];

// Pesos de cada componente sobre 100.
const PESO_RENTABILIDAD = 40;
const PESO_FIABILIDAD = 35;
const PESO_GESTION = 25;

// Calcula la tarifa de referencia €/hora del cliente.
// - unidad "hora": la tarifa ya es €/hora.
// - unidad "proyecto": se deriva con horas_estimadas si están disponibles.
function tarifaHoraReferencia(cliente) {
  if (cliente.unidad_tarifa === 'hora') return cliente.tarifa_acordada;
  if (cliente.unidad_tarifa === 'proyecto' && cliente.horas_estimadas > 0) {
    return cliente.tarifa_acordada / cliente.horas_estimadas;
  }
  return null;
}

// ---- COMPONENTE 1: Rentabilidad real (40%) ----
function calcularRentabilidad(cliente, eventos) {
  const pagos = eventos.filter((e) => TIPOS_PAGO.includes(e.tipo));
  const ingresos = pagos.reduce((s, e) => s + (e.importe || 0), 0);
  const horasExtra = eventos
    .filter((e) => e.tipo === 'hora_extra')
    .reduce((s, e) => s + (e.valor_numerico || 0), 0);

  const tarifaHora = tarifaHoraReferencia(cliente);

  // Sin ingresos registrados o sin tarifa de referencia => puntuación neutra provisional.
  if (!ingresos || !tarifaHora) {
    return {
      puntos: 18, // neutro sobre 40
      eurosHoraReal: null,
      ratio: null,
      ingresos,
      horasEfectivas: horasExtra || null,
      horasExtra,
      sinDatos: true,
    };
  }

  // Horas implícitas = horas que "deberían" haber costado los ingresos a tarifa.
  // Horas efectivas = implícitas + horas extra no facturadas.
  const horasImplicitas = ingresos / tarifaHora;
  const horasEfectivas = horasImplicitas + horasExtra;
  const eurosHoraReal = ingresos / horasEfectivas;
  const ratio = eurosHoraReal / tarifaHora;

  let puntos;
  if (ratio >= 1) puntos = 40;
  else if (ratio >= 0.8) puntos = 30;
  else if (ratio >= 0.6) puntos = 20;
  else puntos = 5;

  return {
    puntos,
    eurosHoraReal,
    ratio,
    ingresos,
    horasEfectivas,
    horasExtra,
    sinDatos: false,
  };
}

// ---- COMPONENTE 2: Fiabilidad de pago (35%) ----
function calcularFiabilidad(eventos) {
  const pagos = eventos.filter((e) => TIPOS_PAGO.includes(e.tipo));

  if (pagos.length === 0) {
    return { puntos: 17, retrasoMedio: null, parciales: 0, sinDatos: true };
  }

  const parciales = pagos.filter((e) => e.tipo === 'pago_parcial').length;
  // El pago puntual cuenta como 0 días; tardío/parcial usan su valor numérico.
  const totalDias = pagos.reduce((s, e) => {
    if (e.tipo === 'pago_puntual') return s;
    return s + (e.valor_numerico || 0);
  }, 0);
  const retrasoMedio = totalDias / pagos.length;

  let puntos;
  if (parciales >= 3) {
    puntos = 5; // pagos parciales frecuentes
  } else if (retrasoMedio === 0 && parciales === 0) {
    puntos = 35;
  } else if (retrasoMedio < 7) {
    puntos = 25;
  } else if (retrasoMedio <= 21) {
    puntos = 15;
  } else {
    puntos = 5;
  }

  return { puntos, retrasoMedio, parciales, sinDatos: false };
}

// ---- COMPONENTE 3: Coste de gestión (25%) ----
function calcularGestion(eventos) {
  const negativos = eventos.filter((e) => TIPOS_GESTION.includes(e.tipo)).length;

  let puntos;
  if (negativos === 0) puntos = 25;
  else if (negativos <= 2) puntos = 18;
  else if (negativos <= 5) puntos = 10;
  else puntos = 3;

  return { puntos, eventosNegativos: negativos };
}

function semaforoDe(total) {
  if (total >= 70) return 'verde';
  if (total >= 40) return 'ambar';
  return 'rojo';
}

// Tono medio (solo informativo, no entra en la puntuación).
function tonoMedio(eventos) {
  const tonos = eventos.filter((e) => e.tipo === 'tono' && e.valor_numerico);
  if (tonos.length === 0) return null;
  return tonos.reduce((s, e) => s + e.valor_numerico, 0) / tonos.length;
}

// Punto de entrada: calcula el score completo de un cliente.
export function calcularScore(cliente, eventos) {
  const rentabilidad = calcularRentabilidad(cliente, eventos);
  const fiabilidad = calcularFiabilidad(eventos);
  const gestion = calcularGestion(eventos);

  const total = rentabilidad.puntos + fiabilidad.puntos + gestion.puntos;
  const semaforo = semaforoDe(total);

  // Componente relativo más bajo (normalizado a su peso) para las recomendaciones.
  const componentes = [
    { clave: 'rentabilidad', etiqueta: 'la rentabilidad real', ratio: rentabilidad.puntos / PESO_RENTABILIDAD },
    { clave: 'fiabilidad', etiqueta: 'la fiabilidad de pago', ratio: fiabilidad.puntos / PESO_FIABILIDAD },
    { clave: 'gestion', etiqueta: 'el coste de gestión', ratio: gestion.puntos / PESO_GESTION },
  ];
  const peorComponente = componentes.sort((a, b) => a.ratio - b.ratio)[0];

  return {
    score_total: total,
    score_rentabilidad: rentabilidad.puntos,
    score_fiabilidad: fiabilidad.puntos,
    score_gestion: gestion.puntos,
    semaforo,
    detalle: {
      rentabilidad,
      fiabilidad,
      gestion,
      tono_medio: tonoMedio(eventos),
      peor_componente: peorComponente.etiqueta,
      peor_componente_clave: peorComponente.clave,
      ingresos: rentabilidad.ingresos,
      euros_hora_real: rentabilidad.eurosHoraReal,
      horas_efectivas: rentabilidad.horasEfectivas,
    },
  };
}

export { TIPOS_PAGO, TIPOS_GESTION, PESO_RENTABILIDAD, PESO_FIABILIDAD, PESO_GESTION };

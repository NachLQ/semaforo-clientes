// seed.js
// Carga datos demo realistas con historias claras (8 clientes, 60+ eventos).
// Ejecutar: npm run seed

import db, { initSchema } from './db.js';
import { calcularScore } from './scoring.js';
import { generarRecomendacion } from './plantillas.js';

initSchema();

console.log('🌱 Reseteando base de datos...');
db.exec(`
  DELETE FROM decisiones_cliente;
  DELETE FROM revisiones_trimestrales;
  DELETE FROM recomendaciones;
  DELETE FROM scores;
  DELETE FROM eventos;
  DELETE FROM clientes;
  DELETE FROM sqlite_sequence WHERE name IN
    ('clientes','eventos','scores','recomendaciones','revisiones_trimestrales','decisiones_cliente');
`);

const insertCliente = db.prepare(
  `INSERT INTO clientes (nombre, servicio_principal, tarifa_acordada, unidad_tarifa, horas_estimadas, fecha_inicio, notas)
   VALUES (@nombre, @servicio_principal, @tarifa_acordada, @unidad_tarifa, @horas_estimadas, @fecha_inicio, @notas)`
);
const insertEvento = db.prepare(
  `INSERT INTO eventos (cliente_id, tipo, fecha, descripcion, valor_numerico, importe)
   VALUES (@cliente_id, @tipo, @fecha, @descripcion, @valor_numerico, @importe)`
);

// Helpers para construir eventos de forma compacta.
const pago = (fecha, importe, descripcion = null) => ({ tipo: 'pago_puntual', fecha, importe, descripcion });
const tardio = (fecha, dias, importe, descripcion = null) => ({
  tipo: 'pago_tardio', fecha, valor_numerico: dias, importe, descripcion,
});
const parcial = (fecha, dias, importe, descripcion = null) => ({
  tipo: 'pago_parcial', fecha, valor_numerico: dias, importe, descripcion,
});
const horaExtra = (fecha, horas, descripcion = null) => ({ tipo: 'hora_extra', fecha, valor_numerico: horas, descripcion });
const cambio = (fecha, descripcion = null) => ({ tipo: 'cambio_alcance', fecha, descripcion });
const urgencia = (fecha, descripcion = null) => ({ tipo: 'urgencia', fecha, descripcion });
const reunion = (fecha, descripcion = null) => ({ tipo: 'reunion_no_productiva', fecha, descripcion });
const revision = (fecha, descripcion = null) => ({ tipo: 'revision_extra', fecha, descripcion });
const tono = (fecha, valoracion, descripcion = null) => ({ tipo: 'tono', fecha, valor_numerico: valoracion, descripcion });

// Definición de los 8 clientes y sus eventos (últimos 3 meses: abr-jun 2026).
const CLIENTES = [
  {
    cliente: {
      nombre: 'Estudio Nómada', servicio_principal: 'Diseño web', tarifa_acordada: 65,
      unidad_tarifa: 'hora', horas_estimadas: null, fecha_inicio: '2024-09-01',
      notas: 'Cliente joya. Comunicación impecable, paga sin recordatorios.',
    },
    eventos: [
      pago('2026-04-05', 800, 'Factura abril'),
      pago('2026-05-05', 700, 'Factura mayo'),
      pago('2026-06-05', 700, 'Factura junio'),
      tono('2026-06-05', 5, 'Trato excelente, da feedback claro'),
    ],
  },
  {
    cliente: {
      nombre: 'Clínica Bienestar', servicio_principal: 'Mantenimiento web + SEO', tarifa_acordada: 55,
      unidad_tarifa: 'hora', horas_estimadas: null, fecha_inicio: '2025-02-10',
      notas: 'Cliente sólido. Algún retraso puntual pero trabajo limpio.',
    },
    eventos: [
      pago('2026-04-08', 600, 'Iguala abril'),
      tardio('2026-05-14', 6, 500, 'Iguala mayo, pagó con 6 días de retraso'),
      pago('2026-06-08', 500, 'Iguala junio'),
      horaExtra('2026-05-20', 4, 'Ajustes extra de SEO no facturados'),
      reunion('2026-05-02', 'Reunión larga sin decisiones claras'),
      tono('2026-06-08', 4, 'Buena relación'),
    ],
  },
  {
    cliente: {
      nombre: 'Academia Futuro', servicio_principal: 'Plataforma de cursos', tarifa_acordada: 50,
      unidad_tarifa: 'hora', horas_estimadas: null, fecha_inicio: '2025-01-15',
      notas: 'Cliente aceptable pero con tendencia al scope creep.',
    },
    eventos: [
      pago('2026-04-10', 450, 'Hito 1'),
      pago('2026-05-10', 450, 'Hito 2'),
      tardio('2026-06-12', 9, 400, 'Hito 3 con retraso'),
      cambio('2026-04-18', 'Pidió añadir foro no previsto'),
      cambio('2026-04-29', 'Cambio de diseño de la home'),
      cambio('2026-05-15', 'Nueva pasarela de pago a mitad de proyecto'),
      cambio('2026-05-28', 'Rehacer landing de captación'),
      horaExtra('2026-05-30', 11, 'Horas extra por cambios no facturadas'),
      tono('2026-06-12', 3, 'Correcto pero pide mucho'),
    ],
  },
  {
    cliente: {
      nombre: 'Consultora Azul', servicio_principal: 'Branding + web', tarifa_acordada: 50,
      unidad_tarifa: 'hora', horas_estimadas: null, fecha_inicio: '2024-11-20',
      notas: 'Cliente a vigilar. Paga tarde de media y aparece alguna urgencia.',
    },
    eventos: [
      tardio('2026-04-22', 12, 500, 'Factura abril con 12 días de retraso'),
      tardio('2026-05-25', 10, 500, 'Factura mayo con 10 días de retraso'),
      pago('2026-06-15', 400, 'Factura junio'),
      urgencia('2026-05-09', 'Pidió cambios un sábado para el lunes'),
      cambio('2026-04-30', 'Amplió el alcance de la web'),
      cambio('2026-05-18', 'Nuevas secciones no previstas'),
      horaExtra('2026-05-27', 12, 'Horas extra no facturadas'),
      tono('2026-06-15', 3, 'Relación tensa por los plazos'),
    ],
  },
  {
    cliente: {
      nombre: 'Reformas Vidal', servicio_principal: 'Web corporativa + catálogo', tarifa_acordada: 45,
      unidad_tarifa: 'hora', horas_estimadas: null, fecha_inicio: '2024-06-01',
      notas: 'Cliente problemático. Paga tarde, scope creep constante, tono difícil. Factura alta.',
    },
    eventos: [
      tardio('2026-04-15', 25, 5300, 'Factura grande, 25 días de retraso'),
      tardio('2026-05-12', 28, 5300, 'Segundo hito, 28 días tarde'),
      tardio('2026-06-10', 22, 5300, 'Tercer hito, 22 días tarde'),
      cambio('2026-04-20', 'Rehacer todo el catálogo'),
      cambio('2026-04-27', 'Cambio de proveedor de fotos a mitad'),
      cambio('2026-05-14', 'Nuevas categorías no previstas'),
      cambio('2026-05-29', 'Rediseño completo de la home'),
      urgencia('2026-05-03', 'Llamada un domingo por la noche'),
      urgencia('2026-06-01', 'Cambios urgentes sin previo aviso'),
      horaExtra('2026-05-22', 35, 'Horas extra acumuladas sin facturar'),
      horaExtra('2026-06-05', 30, 'Más horas extra por cambios'),
      tono('2026-05-12', 2, 'Trato exigente y poco flexible'),
      tono('2026-06-10', 2, 'Sigue siendo difícil'),
    ],
  },
  {
    cliente: {
      nombre: 'Diseños Carla', servicio_principal: 'Tienda online', tarifa_acordada: 40,
      unidad_tarifa: 'hora', horas_estimadas: null, fecha_inicio: '2024-10-01',
      notas: 'Cliente ruina evidente. Paga muy tarde o a medias, cambios sin fin, tono pésimo.',
    },
    eventos: [
      parcial('2026-04-12', 30, 150, 'Pagó solo una parte, 30 días tarde'),
      parcial('2026-04-30', 40, 150, 'Otro pago parcial, 40 días tarde'),
      parcial('2026-05-20', 35, 150, 'Pago parcial, 35 días tarde'),
      parcial('2026-06-08', 50, 150, 'Pago a medias, 50 días tarde'),
      cambio('2026-04-15', 'Cambió toda la estructura de la tienda'),
      cambio('2026-04-28', 'Rehacer fichas de producto'),
      cambio('2026-05-18', 'Nuevo diseño otra vez'),
      urgencia('2026-04-20', 'Mensajes a medianoche exigiendo cambios'),
      urgencia('2026-05-10', 'Urgencia en fin de semana'),
      urgencia('2026-06-02', 'Otra urgencia fuera de horario'),
      reunion('2026-05-05', 'Reunión de 2 horas sin conclusiones'),
      revision('2026-05-25', 'Quinta ronda de revisiones del mismo diseño'),
      horaExtra('2026-05-15', 20, 'Horas extra no facturadas'),
      horaExtra('2026-06-04', 20, 'Más horas regaladas'),
      tono('2026-05-10', 1, 'Trato muy difícil, exige y no respeta'),
      tono('2026-06-08', 1, 'Insostenible'),
    ],
  },
  {
    cliente: {
      nombre: 'Taller Montseny', servicio_principal: 'Web sencilla', tarifa_acordada: 50,
      unidad_tarifa: 'hora', horas_estimadas: null, fecha_inicio: '2026-04-25',
      notas: 'Cliente nuevo (2 meses). Aún sin histórico de pago, puntuación provisional.',
    },
    eventos: [
      cambio('2026-05-20', 'Pidió un pequeño ajuste de alcance'),
      horaExtra('2026-06-02', 6, 'Algunas horas extra iniciales'),
    ],
  },
  {
    cliente: {
      nombre: 'Marketing Sur', servicio_principal: 'Campañas + web', tarifa_acordada: 60,
      unidad_tarifa: 'hora', horas_estimadas: null, fecha_inicio: '2024-03-01',
      notas: 'Buen cliente, paga bien, PERO concentra demasiado de mi facturación. Riesgo de dependencia.',
    },
    eventos: [
      pago('2026-04-03', 6000, 'Retainer abril'),
      pago('2026-05-03', 6300, 'Retainer mayo'),
      pago('2026-06-03', 6500, 'Retainer junio'),
      reunion('2026-05-11', 'Reunión mensual algo larga'),
      tono('2026-06-03', 4, 'Buena relación, profesional'),
    ],
  },
];

console.log('🌱 Insertando clientes y eventos...');
const insertarTodo = db.transaction(() => {
  let totalEventos = 0;
  for (const def of CLIENTES) {
    const info = insertCliente.run(def.cliente);
    const clienteId = info.lastInsertRowid;
    for (const ev of def.eventos) {
      insertEvento.run({
        cliente_id: clienteId,
        tipo: ev.tipo,
        fecha: ev.fecha,
        descripcion: ev.descripcion ?? null,
        valor_numerico: ev.valor_numerico ?? null,
        importe: ev.importe ?? null,
      });
      totalEventos += 1;
    }
  }
  return totalEventos;
});
const totalEventos = insertarTodo();

// Calcular y persistir scores + recomendaciones de todos los clientes.
console.log('🧮 Calculando puntuaciones...');
const clientes = db.prepare('SELECT * FROM clientes').all();
for (const c of clientes) {
  const eventos = db.prepare('SELECT * FROM eventos WHERE cliente_id = ?').all(c.id);
  const score = calcularScore(c, eventos);
  const reco = generarRecomendacion(c, score);
  db.prepare(
    `INSERT INTO scores (cliente_id, score_total, score_rentabilidad, score_fiabilidad, score_gestion, semaforo)
     VALUES (?,?,?,?,?,?)`
  ).run(c.id, score.score_total, score.score_rentabilidad, score.score_fiabilidad, score.score_gestion, score.semaforo);
  db.prepare(
    `INSERT INTO recomendaciones (cliente_id, nivel, texto_recomendacion, plantilla_mensaje)
     VALUES (?,?,?,?)`
  ).run(c.id, reco.nivel, reco.texto_recomendacion, reco.plantilla ? JSON.stringify(reco.plantilla) : null);
}

// Revisión trimestral del trimestre anterior (2026-Q1) con decisiones tomadas.
console.log('📋 Creando revisión trimestral anterior (2026-Q1)...');
const byNombre = Object.fromEntries(clientes.map((c) => [c.nombre, c]));
// Foto de scores "del trimestre pasado" (ligeramente distinta para mostrar evolución).
const scoresQ1 = {};
for (const c of clientes) {
  const filaScore = db.prepare('SELECT score_total FROM scores WHERE cliente_id = ? ORDER BY id DESC LIMIT 1').get(c.id);
  // Simulamos que en Q1 los scores eran un poco distintos.
  const ajuste = { 'Reformas Vidal': 6, 'Diseños Carla': 8, 'Consultora Azul': 5 }[c.nombre] || 0;
  scoresQ1[c.id] = Math.min(100, (filaScore?.score_total || 0) + ajuste);
}
const resumenQ1 = JSON.stringify({ scores: scoresQ1, guardado_at: '2026-03-31T18:00:00.000Z' });
const infoRev = db
  .prepare('INSERT INTO revisiones_trimestrales (trimestre, resumen_json, created_at) VALUES (?,?,?)')
  .run('2026-Q1', resumenQ1, '2026-03-31 18:00:00');
const revisionId = infoRev.lastInsertRowid;

const decisionesQ1 = [
  { nombre: 'Reformas Vidal', accion: 'repreciar', notas: 'Subir tarifa un 15% por scope creep continuo.' },
  { nombre: 'Diseños Carla', accion: 'condiciones', notas: 'Exigir pago por adelantado y limitar rondas de revisión.' },
  { nombre: 'Consultora Azul', accion: 'mantener', notas: 'Mantener y vigilar plazos de pago.' },
];
const insertDecision = db.prepare(
  'INSERT INTO decisiones_cliente (revision_id, cliente_id, accion, notas, created_at) VALUES (?,?,?,?,?)'
);
for (const d of decisionesQ1) {
  const c = byNombre[d.nombre];
  if (c) insertDecision.run(revisionId, c.id, d.accion, d.notas, '2026-03-31 18:05:00');
}

// Resumen por consola para verificar que el seed cuadra.
console.log('\n✅ Seed completado.');
console.log(`   Clientes: ${clientes.length} | Eventos: ${totalEventos}`);
console.log('\n   Puntuaciones resultantes:');
console.log('   ' + '─'.repeat(72));
const filas = clientes
  .map((c) => {
    const s = db.prepare('SELECT * FROM scores WHERE cliente_id = ? ORDER BY id DESC LIMIT 1').get(c.id);
    return { nombre: c.nombre, ...s };
  })
  .sort((a, b) => b.score_total - a.score_total);
for (const f of filas) {
  const semCol = { verde: '🟢', ambar: '🟡', rojo: '🔴' }[f.semaforo];
  console.log(
    `   ${semCol} ${f.nombre.padEnd(20)} total=${String(f.score_total).padStart(3)}  ` +
      `(rent ${f.score_rentabilidad}, fiab ${f.score_fiabilidad}, gest ${f.score_gestion})`
  );
}
console.log('   ' + '─'.repeat(72));
console.log('\n   Ejecuta "npm run dev" en la raíz para arrancar la app.\n');

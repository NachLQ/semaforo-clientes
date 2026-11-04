// index.js
// API REST del Semáforo de Clientes (Express + better-sqlite3).

import express from 'express';
import cors from 'cors';
import db, { initSchema } from './db.js';
import { calcularScore, TIPOS_EVENTO } from './scoring.js';
import { generarRecomendacion, listaPlantillas } from './plantillas.js';

initSchema();

// Primera ejecución: si no hay clientes, cargar la demo automáticamente
// (así el pack funciona nada más arrancar, sin `npm run seed` manual).
if (db.prepare('SELECT COUNT(*) AS c FROM clientes').get().c === 0) {
  await import('./seed.js');
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// ---------- Helpers ----------

function getCliente(id) {
  return db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
}

// Calcula el score de un cliente y lo persiste (Score + Recomendacion).
function calcularYGuardar(cliente) {
  const eventos = db
    .prepare('SELECT * FROM eventos WHERE cliente_id = ?')
    .all(cliente.id);
  const score = calcularScore(cliente, eventos);
  const reco = generarRecomendacion(cliente, score);

  db.prepare(
    `INSERT INTO scores (cliente_id, score_total, score_rentabilidad, score_fiabilidad, score_gestion, semaforo)
     VALUES (?,?,?,?,?,?)`
  ).run(
    cliente.id,
    score.score_total,
    score.score_rentabilidad,
    score.score_fiabilidad,
    score.score_gestion,
    score.semaforo
  );

  db.prepare(
    `INSERT INTO recomendaciones (cliente_id, nivel, texto_recomendacion, plantilla_mensaje)
     VALUES (?,?,?,?)`
  ).run(
    cliente.id,
    reco.nivel,
    reco.texto_recomendacion,
    reco.plantilla ? JSON.stringify(reco.plantilla) : null
  );

  return { score, reco };
}

// Score "en vivo" sin persistir (para listados y panel).
function scoreEnVivo(cliente) {
  const eventos = db.prepare('SELECT * FROM eventos WHERE cliente_id = ?').all(cliente.id);
  const score = calcularScore(cliente, eventos);
  const reco = generarRecomendacion(cliente, score);
  return { score, reco, eventos };
}

// ---------- Catálogos ----------

app.get('/api/tipos-evento', (_req, res) => {
  res.json(TIPOS_EVENTO);
});

app.get('/api/plantillas-mensaje', (_req, res) => {
  res.json(listaPlantillas());
});

// ---------- Clientes ----------

app.get('/api/clientes', (_req, res) => {
  const clientes = db.prepare('SELECT * FROM clientes ORDER BY nombre').all();
  const conScore = clientes.map((c) => {
    const { score, reco } = scoreEnVivo(c);
    return { ...c, score, recomendacion: reco };
  });
  res.json(conScore);
});

app.post('/api/clientes', (req, res) => {
  const { nombre, servicio_principal, tarifa_acordada, unidad_tarifa, horas_estimadas, fecha_inicio, notas } =
    req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre es obligatorio.' });
  }
  const info = db
    .prepare(
      `INSERT INTO clientes (nombre, servicio_principal, tarifa_acordada, unidad_tarifa, horas_estimadas, fecha_inicio, notas)
       VALUES (?,?,?,?,?,?,?)`
    )
    .run(
      nombre.trim(),
      servicio_principal || null,
      Number(tarifa_acordada) || 0,
      unidad_tarifa === 'proyecto' ? 'proyecto' : 'hora',
      horas_estimadas ? Number(horas_estimadas) : null,
      fecha_inicio || null,
      notas || null
    );
  const cliente = getCliente(info.lastInsertRowid);
  calcularYGuardar(cliente);
  const { score, reco } = scoreEnVivo(cliente);
  res.status(201).json({ ...cliente, score, recomendacion: reco });
});

app.get('/api/clientes/:id', (req, res) => {
  const cliente = getCliente(req.params.id);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });
  const { score, reco, eventos } = scoreEnVivo(cliente);
  res.json({ ...cliente, score, recomendacion: reco, eventos });
});

app.put('/api/clientes/:id', (req, res) => {
  const cliente = getCliente(req.params.id);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });
  const { nombre, servicio_principal, tarifa_acordada, unidad_tarifa, horas_estimadas, fecha_inicio, notas } =
    req.body;
  db.prepare(
    `UPDATE clientes SET
       nombre = ?, servicio_principal = ?, tarifa_acordada = ?, unidad_tarifa = ?,
       horas_estimadas = ?, fecha_inicio = ?, notas = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    nombre?.trim() || cliente.nombre,
    servicio_principal ?? cliente.servicio_principal,
    tarifa_acordada != null ? Number(tarifa_acordada) : cliente.tarifa_acordada,
    unidad_tarifa === 'proyecto' ? 'proyecto' : 'hora',
    horas_estimadas != null ? Number(horas_estimadas) : cliente.horas_estimadas,
    fecha_inicio ?? cliente.fecha_inicio,
    notas ?? cliente.notas,
    cliente.id
  );
  const actualizado = getCliente(cliente.id);
  calcularYGuardar(actualizado);
  const { score, reco } = scoreEnVivo(actualizado);
  res.json({ ...actualizado, score, recomendacion: reco });
});

app.delete('/api/clientes/:id', (req, res) => {
  const cliente = getCliente(req.params.id);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });
  db.prepare('DELETE FROM clientes WHERE id = ?').run(cliente.id);
  res.json({ ok: true });
});

// ---------- Eventos ----------

app.get('/api/clientes/:id/eventos', (req, res) => {
  const cliente = getCliente(req.params.id);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });
  const eventos = db
    .prepare('SELECT * FROM eventos WHERE cliente_id = ? ORDER BY fecha DESC, id DESC')
    .all(cliente.id);
  res.json(eventos);
});

app.post('/api/clientes/:id/eventos', (req, res) => {
  const cliente = getCliente(req.params.id);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });

  const { tipo, fecha, descripcion, valor_numerico, importe } = req.body;
  if (!tipo || !TIPOS_EVENTO[tipo]) {
    return res.status(400).json({ error: 'Tipo de evento no válido.' });
  }
  const fechaEvento = fecha || new Date().toISOString().slice(0, 10);

  const info = db
    .prepare(
      `INSERT INTO eventos (cliente_id, tipo, fecha, descripcion, valor_numerico, importe)
       VALUES (?,?,?,?,?,?)`
    )
    .run(
      cliente.id,
      tipo,
      fechaEvento,
      descripcion || null,
      valor_numerico != null && valor_numerico !== '' ? Number(valor_numerico) : null,
      importe != null && importe !== '' ? Number(importe) : null
    );

  // Recalcular y persistir el score tras cada evento.
  calcularYGuardar(cliente);

  const evento = db.prepare('SELECT * FROM eventos WHERE id = ?').get(info.lastInsertRowid);
  const { score, reco } = scoreEnVivo(cliente);
  res.status(201).json({ evento, score, recomendacion: reco });
});

app.delete('/api/clientes/:id/eventos/:eventoId', (req, res) => {
  const cliente = getCliente(req.params.id);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });
  db.prepare('DELETE FROM eventos WHERE id = ? AND cliente_id = ?').run(req.params.eventoId, cliente.id);
  calcularYGuardar(cliente);
  const { score, reco } = scoreEnVivo(cliente);
  res.json({ ok: true, score, recomendacion: reco });
});

// ---------- Score y recomendación ----------

app.get('/api/clientes/:id/score', (req, res) => {
  const cliente = getCliente(req.params.id);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });
  const { score } = scoreEnVivo(cliente);
  res.json(score);
});

app.get('/api/clientes/:id/recomendacion', (req, res) => {
  const cliente = getCliente(req.params.id);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });
  const { reco } = scoreEnVivo(cliente);
  res.json(reco);
});

// ---------- Panel comparativo ----------

function construirPanel() {
  const clientes = db.prepare('SELECT * FROM clientes').all();
  const filas = clientes.map((c) => {
    const { score } = scoreEnVivo(c);
    return {
      id: c.id,
      nombre: c.nombre,
      servicio_principal: c.servicio_principal,
      tarifa_acordada: c.tarifa_acordada,
      unidad_tarifa: c.unidad_tarifa,
      score_total: score.score_total,
      semaforo: score.semaforo,
      euros_hora_real: score.detalle.euros_hora_real,
      ingresos: score.detalle.ingresos || 0,
      horas_efectivas: score.detalle.horas_efectivas || 0,
      detalle: score.detalle,
    };
  });

  const ingresosTotales = filas.reduce((s, f) => s + f.ingresos, 0);
  filas.forEach((f) => {
    f.pct_ingresos = ingresosTotales > 0 ? (f.ingresos / ingresosTotales) * 100 : 0;
    f.dependencia_alta = f.pct_ingresos > 40;
  });

  // Ranking por puntuación descendente.
  filas.sort((a, b) => b.score_total - a.score_total);

  // Coste de oportunidad del peor cliente:
  // horas del peor cliente x €/hora real del mejor cliente - ingresos del peor cliente.
  const mejor = filas[0];
  const peor = filas[filas.length - 1];
  let costeOportunidad = null;
  if (mejor && peor && mejor.id !== peor.id && mejor.euros_hora_real) {
    const valor = peor.horas_efectivas * mejor.euros_hora_real - peor.ingresos;
    costeOportunidad = {
      valor: Math.round(valor),
      peor_cliente: { id: peor.id, nombre: peor.nombre, horas: Math.round(peor.horas_efectivas), ingresos: peor.ingresos },
      mejor_cliente: { id: mejor.id, nombre: mejor.nombre, euros_hora_real: Math.round(mejor.euros_hora_real) },
    };
  }

  return { filas, ingresosTotales, costeOportunidad, mejor, peor };
}

app.get('/api/panel', (_req, res) => {
  const { filas, ingresosTotales, costeOportunidad } = construirPanel();
  res.json({
    clientes: filas,
    ingresos_totales: ingresosTotales,
    coste_oportunidad: costeOportunidad,
  });
});

app.get('/api/panel/alertas', (_req, res) => {
  const { filas } = construirPanel();
  const dependencia = filas
    .filter((f) => f.dependencia_alta)
    .map((f) => ({ id: f.id, nombre: f.nombre, pct_ingresos: Math.round(f.pct_ingresos) }));
  const ruina = filas
    .filter((f) => f.semaforo === 'rojo')
    .map((f) => ({ id: f.id, nombre: f.nombre, score_total: f.score_total }));
  res.json({ dependencia_alta: dependencia, clientes_ruina: ruina });
});

// ---------- Revisión trimestral ----------

function trimestreActual(fecha = new Date()) {
  const y = fecha.getFullYear();
  const q = Math.floor(fecha.getMonth() / 3) + 1;
  return `${y}-Q${q}`;
}

app.get('/api/revision/actual', (_req, res) => {
  const trimestre = trimestreActual();

  // Foto actual de la cartera.
  const { filas } = construirPanel();
  const clientes = db.prepare('SELECT * FROM clientes').all();

  // Clientes nuevos: relación iniciada dentro del trimestre actual.
  const inicioTrimestre = (() => {
    const now = new Date();
    const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
    return new Date(now.getFullYear(), qStartMonth, 1).toISOString().slice(0, 10);
  })();
  const nuevos = clientes
    .filter((c) => c.fecha_inicio && c.fecha_inicio >= inicioTrimestre)
    .map((c) => c.nombre);

  const joya = [...filas].sort((a, b) => b.score_total - a.score_total)[0];
  const ruina = [...filas].sort((a, b) => a.score_total - b.score_total)[0];

  // Revisión anterior guardada (la más reciente que no sea el trimestre actual).
  const revisionPrevia = db
    .prepare('SELECT * FROM revisiones_trimestrales WHERE trimestre != ? ORDER BY id DESC LIMIT 1')
    .get(trimestre);

  let decisionesPrevias = [];
  let cambioScores = [];
  if (revisionPrevia) {
    decisionesPrevias = db
      .prepare(
        `SELECT d.*, c.nombre AS cliente_nombre
         FROM decisiones_cliente d JOIN clientes c ON c.id = d.cliente_id
         WHERE d.revision_id = ?`
      )
      .all(revisionPrevia.id);

    // Comparar score guardado en la revisión previa con el actual.
    let resumenPrevio = {};
    try {
      resumenPrevio = JSON.parse(revisionPrevia.resumen_json || '{}');
    } catch {
      resumenPrevio = {};
    }
    const scoresPrevios = resumenPrevio.scores || {};
    cambioScores = filas.map((f) => ({
      id: f.id,
      nombre: f.nombre,
      score_actual: f.score_total,
      score_previo: scoresPrevios[f.id] ?? null,
      delta: scoresPrevios[f.id] != null ? f.score_total - scoresPrevios[f.id] : null,
    }));
  } else {
    cambioScores = filas.map((f) => ({
      id: f.id,
      nombre: f.nombre,
      score_actual: f.score_total,
      score_previo: null,
      delta: null,
    }));
  }

  // Clientes que requieren decisión: rojos y ámbar.
  const requierenDecision = filas
    .filter((f) => f.semaforo === 'rojo' || f.semaforo === 'ambar')
    .map((f) => ({ id: f.id, nombre: f.nombre, score_total: f.score_total, semaforo: f.semaforo }));

  res.json({
    trimestre,
    resumen: {
      total_clientes: clientes.length,
      nuevos,
      cambio_scores: cambioScores,
    },
    joya: joya ? { id: joya.id, nombre: joya.nombre, score_total: joya.score_total } : null,
    ruina: ruina ? { id: ruina.id, nombre: ruina.nombre, score_total: ruina.score_total } : null,
    requieren_decision: requierenDecision,
    revision_previa: revisionPrevia
      ? { trimestre: revisionPrevia.trimestre, decisiones: decisionesPrevias }
      : null,
  });
});

app.post('/api/revision/decisiones', (req, res) => {
  const { trimestre, decisiones } = req.body;
  const tri = trimestre || trimestreActual();
  if (!Array.isArray(decisiones)) {
    return res.status(400).json({ error: 'Se esperaba un array de decisiones.' });
  }

  // Guardar foto de scores actuales en el resumen para comparativas futuras.
  const { filas } = construirPanel();
  const scores = {};
  filas.forEach((f) => {
    scores[f.id] = f.score_total;
  });
  const resumen = { scores, guardado_at: new Date().toISOString() };

  const tx = db.transaction(() => {
    const info = db
      .prepare('INSERT INTO revisiones_trimestrales (trimestre, resumen_json) VALUES (?,?)')
      .run(tri, JSON.stringify(resumen));
    const revisionId = info.lastInsertRowid;
    const stmt = db.prepare(
      'INSERT INTO decisiones_cliente (revision_id, cliente_id, accion, notas) VALUES (?,?,?,?)'
    );
    decisiones.forEach((d) => {
      if (d.cliente_id && d.accion) {
        stmt.run(revisionId, d.cliente_id, d.accion, d.notas || null);
      }
    });
    return revisionId;
  });

  const revisionId = tx();
  res.status(201).json({ ok: true, revision_id: revisionId, trimestre: tri });
});

// ---------- Arranque ----------

app.listen(PORT, () => {
  console.log(`✅ Semáforo de Clientes API escuchando en http://localhost:${PORT}`);
});

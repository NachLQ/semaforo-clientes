// db.js
// Conexión SQLite (better-sqlite3) y esquema de la base de datos.

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
mkdirSync(DATA_DIR, { recursive: true });

export const DB_PATH = join(DATA_DIR, 'semaforo.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Esquema. Nota: ampliamos el modelo del prompt con dos campos en Evento:
//  - importe: euros del pago (solo eventos de pago).
//  - Cliente.horas_estimadas: opcional, para derivar €/hora en tarifas por proyecto.
// Ambos están documentados en el README (sección "Decisiones de diseño").
export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      servicio_principal TEXT,
      tarifa_acordada REAL NOT NULL DEFAULT 0,
      unidad_tarifa TEXT NOT NULL DEFAULT 'hora' CHECK (unidad_tarifa IN ('hora','proyecto')),
      horas_estimadas REAL,
      fecha_inicio TEXT,
      notas TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS eventos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
      tipo TEXT NOT NULL,
      fecha TEXT NOT NULL,
      descripcion TEXT,
      valor_numerico REAL,
      importe REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
      score_total INTEGER NOT NULL,
      score_rentabilidad INTEGER NOT NULL,
      score_fiabilidad INTEGER NOT NULL,
      score_gestion INTEGER NOT NULL,
      semaforo TEXT NOT NULL,
      calculado_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recomendaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
      nivel TEXT NOT NULL,
      texto_recomendacion TEXT NOT NULL,
      plantilla_mensaje TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS revisiones_trimestrales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trimestre TEXT NOT NULL,
      resumen_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS decisiones_cliente (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      revision_id INTEGER NOT NULL REFERENCES revisiones_trimestrales(id) ON DELETE CASCADE,
      cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
      accion TEXT NOT NULL CHECK (accion IN ('repreciar','condiciones','despedir','mantener')),
      notas TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_eventos_cliente ON eventos(cliente_id);
    CREATE INDEX IF NOT EXISTS idx_decisiones_revision ON decisiones_cliente(revision_id);
  `);
}

export default db;

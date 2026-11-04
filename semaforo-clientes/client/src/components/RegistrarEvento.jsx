import { useState } from 'react';
import { api } from '../api.js';
import { hoyISO } from '../ui.js';

// Registro rápido de evento: menos de 15 segundos.
// Paso 1: elegir tipo (un toque). Paso 2: solo el campo imprescindible + guardar.
export default function RegistrarEvento({ clienteId, tiposEvento, onRegistrado }) {
  const [tipo, setTipo] = useState(null);
  const [valor, setValor] = useState('');
  const [importe, setImporte] = useState('');
  const [valoracion, setValoracion] = useState(3);
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(hoyISO());
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const def = tipo ? tiposEvento[tipo] : null;
  const esPago = def?.grupo === 'pago';
  const pidePagoTardio = tipo === 'pago_tardio' || tipo === 'pago_parcial';
  const pideHoras = tipo === 'hora_extra';
  const pideTono = tipo === 'tono';

  function reset() {
    setTipo(null);
    setValor('');
    setImporte('');
    setValoracion(3);
    setDescripcion('');
    setFecha(hoyISO());
    setError(null);
  }

  async function guardar() {
    setGuardando(true);
    setError(null);
    try {
      const payload = { tipo, fecha, descripcion: descripcion || null };
      if (pideTono) payload.valor_numerico = valoracion;
      else if (pidePagoTardio) payload.valor_numerico = valor;
      else if (pideHoras) payload.valor_numerico = valor;
      if (esPago) payload.importe = importe;
      const data = await api.crearEvento(clienteId, payload);
      reset();
      onRegistrado?.(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  // Paso 1: parrilla de tipos.
  if (!tipo) {
    return (
      <div>
        <h3 className="mb-3 font-bold text-slate-800">Registrar evento</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.entries(tiposEvento).map(([clave, t]) => (
            <button
              key={clave}
              onClick={() => setTipo(clave)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-sm font-semibold text-slate-700 hover:border-slate-900 hover:bg-slate-50"
            >
              <span className="text-lg">{t.icono}</span>
              <span className="leading-tight">{t.etiqueta}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Paso 2: solo lo imprescindible.
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold text-slate-800">
          {def.icono} {def.etiqueta}
        </h3>
        <button onClick={reset} className="text-sm font-semibold text-slate-500 hover:text-slate-900">
          ← Cambiar
        </button>
      </div>

      <div className="space-y-3">
        {pideTono && (
          <div>
            <label className="etiqueta">¿Cómo es el trato? (1 difícil · 5 excelente)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setValoracion(n)}
                  className={`h-12 flex-1 rounded-xl text-lg font-bold ${
                    valoracion === n ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {pidePagoTardio && (
          <div>
            <label className="etiqueta">Días de retraso</label>
            <input
              type="number"
              inputMode="numeric"
              autoFocus
              className="campo"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Ej: 12"
            />
          </div>
        )}

        {pideHoras && (
          <div>
            <label className="etiqueta">Horas no facturadas</label>
            <input
              type="number"
              inputMode="decimal"
              autoFocus
              className="campo"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Ej: 4"
            />
          </div>
        )}

        {esPago && (
          <div>
            <label className="etiqueta">Importe cobrado (€)</label>
            <input
              type="number"
              inputMode="decimal"
              autoFocus={!pidePagoTardio}
              className="campo"
              value={importe}
              onChange={(e) => setImporte(e.target.value)}
              placeholder="Ej: 600"
            />
          </div>
        )}

        {/* Campo opcional plegado: descripción + fecha */}
        <details className="rounded-xl bg-slate-50 px-3 py-2">
          <summary className="cursor-pointer text-sm font-semibold text-slate-500">
            Añadir nota o cambiar fecha (opcional)
          </summary>
          <div className="mt-2 space-y-2">
            <input
              className="campo"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción (opcional)"
            />
            <input type="date" className="campo" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
        </details>

        {error && <p className="text-sm font-semibold text-rojo">{error}</p>}

        <button onClick={guardar} disabled={guardando} className="btn-primario w-full">
          {guardando ? 'Guardando…' : 'Guardar evento'}
        </button>
      </div>
    </div>
  );
}

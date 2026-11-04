import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Semaforo from '../components/Semaforo.jsx';

const ACCIONES = [
  { valor: 'repreciar', etiqueta: 'Repreciar' },
  { valor: 'condiciones', etiqueta: 'Poner condiciones' },
  { valor: 'despedir', etiqueta: 'Despedir' },
  { valor: 'mantener', etiqueta: 'Mantener y vigilar' },
];

function Pasos({ paso }) {
  const titulos = ['Resumen', 'Joya y ruina', 'Decisiones', 'Guardar'];
  return (
    <div className="flex items-center gap-1">
      {titulos.map((t, i) => (
        <div key={t} className="flex flex-1 flex-col items-center">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
              i + 1 <= paso ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'
            }`}
          >
            {i + 1}
          </div>
          <span className={`mt-1 text-[10px] ${i + 1 === paso ? 'font-bold text-slate-900' : 'text-slate-400'}`}>
            {t}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function RevisionPage() {
  const [data, setData] = useState(null);
  const [paso, setPaso] = useState(1);
  const [decisiones, setDecisiones] = useState({}); // { clienteId: { accion, notas } }
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.revisionActual().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="tarjeta text-rojo">Error: {error}</p>;
  if (!data) return <p className="text-slate-400">Cargando revisión…</p>;

  function setDecision(clienteId, campo, valor) {
    setDecisiones((d) => ({ ...d, [clienteId]: { ...d[clienteId], [campo]: valor } }));
  }

  async function guardar() {
    setError(null);
    try {
      const payload = {
        trimestre: data.trimestre,
        decisiones: Object.entries(decisiones)
          .filter(([, v]) => v.accion)
          .map(([cliente_id, v]) => ({ cliente_id: Number(cliente_id), accion: v.accion, notas: v.notas || null })),
      };
      await api.guardarDecisiones(payload);
      setGuardado(true);
      setPaso(4);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="tarjeta">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">Revisión trimestral</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">{data.trimestre}</span>
        </div>
        <Pasos paso={paso} />
      </div>

      {/* PASO 1: Resumen del trimestre */}
      {paso === 1 && (
        <div className="tarjeta space-y-3">
          <h3 className="font-bold text-slate-800">1 · Resumen del trimestre</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <div className="text-2xl font-black text-slate-900">{data.resumen.total_clientes}</div>
              <div className="text-xs text-slate-500">clientes activos</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <div className="text-2xl font-black text-slate-900">{data.resumen.nuevos.length}</div>
              <div className="text-xs text-slate-500">nuevos este trimestre</div>
            </div>
          </div>
          {data.resumen.nuevos.length > 0 && (
            <p className="text-sm text-slate-600">
              <b>Nuevos:</b> {data.resumen.nuevos.join(', ')}
            </p>
          )}

          <div>
            <h4 className="mb-1 mt-2 text-sm font-bold text-slate-700">Cambio de puntos vs. trimestre anterior</h4>
            <ul className="divide-y divide-slate-100">
              {data.resumen.cambio_scores.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-slate-700">{c.nombre}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{c.score_actual} pts</span>
                    {c.delta != null && (
                      <span
                        className={`text-xs font-bold ${
                          c.delta > 0 ? 'text-verde' : c.delta < 0 ? 'text-rojo' : 'text-slate-400'
                        }`}
                      >
                        {c.delta > 0 ? `▲ +${c.delta}` : c.delta < 0 ? `▼ ${c.delta}` : '='}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {data.revision_previa && (
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-sm font-bold text-slate-700">
                Decisiones del trimestre anterior ({data.revision_previa.trimestre})
              </div>
              <ul className="mt-1 space-y-1 text-sm text-slate-600">
                {data.revision_previa.decisiones.map((d) => (
                  <li key={d.id}>
                    • <b>{d.cliente_nombre}</b>: {ACCIONES.find((a) => a.valor === d.accion)?.etiqueta || d.accion}
                    {d.notas ? ` — ${d.notas}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={() => setPaso(2)} className="btn-primario w-full">
            Siguiente
          </button>
        </div>
      )}

      {/* PASO 2: Joya y ruina */}
      {paso === 2 && (
        <div className="tarjeta space-y-3">
          <h3 className="font-bold text-slate-800">2 · Tu cliente joya y tu cliente ruina</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-verde bg-verde-claro p-4 text-center">
              <div className="text-sm font-bold uppercase text-verde-oscuro">💎 Cliente joya</div>
              <div className="my-2 text-xl font-black text-slate-900">{data.joya?.nombre}</div>
              <Semaforo semaforo="verde" puntos={data.joya?.score_total} tamano="mini" />
            </div>
            <div className="rounded-2xl border border-rojo bg-rojo-claro p-4 text-center">
              <div className="text-sm font-bold uppercase text-rojo-oscuro">🩸 Cliente ruina</div>
              <div className="my-2 text-xl font-black text-slate-900">{data.ruina?.nombre}</div>
              <Semaforo semaforo="rojo" puntos={data.ruina?.score_total} tamano="mini" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPaso(1)} className="btn-secundario flex-1">
              Atrás
            </button>
            <button onClick={() => setPaso(3)} className="btn-primario flex-1">
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: Decisiones por cliente rojo/ámbar */}
      {paso === 3 && (
        <div className="tarjeta space-y-3">
          <h3 className="font-bold text-slate-800">3 · Decide qué hacer con cada cliente en riesgo</h3>
          {data.requieren_decision.length === 0 ? (
            <p className="text-sm text-slate-500">No tienes clientes en rojo ni ámbar. ¡Buen trimestre!</p>
          ) : (
            data.requieren_decision.map((c) => (
              <div key={c.id} className="rounded-2xl border border-slate-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-bold text-slate-800">{c.nombre}</span>
                  <Semaforo semaforo={c.semaforo} puntos={c.score_total} tamano="mini" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ACCIONES.map((a) => (
                    <button
                      key={a.valor}
                      onClick={() => setDecision(c.id, 'accion', a.valor)}
                      className={`rounded-xl px-2 py-2 text-sm font-semibold ${
                        decisiones[c.id]?.accion === a.valor
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {a.etiqueta}
                    </button>
                  ))}
                </div>
                <input
                  className="campo mt-2 text-sm"
                  placeholder="Nota (opcional)"
                  value={decisiones[c.id]?.notas || ''}
                  onChange={(e) => setDecision(c.id, 'notas', e.target.value)}
                />
              </div>
            ))
          )}
          {error && <p className="text-sm font-semibold text-rojo">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => setPaso(2)} className="btn-secundario flex-1">
              Atrás
            </button>
            <button onClick={guardar} className="btn-primario flex-1">
              Guardar decisiones
            </button>
          </div>
        </div>
      )}

      {/* PASO 4: Confirmación */}
      {paso === 4 && guardado && (
        <div className="tarjeta space-y-3 text-center">
          <div className="text-5xl">✅</div>
          <h3 className="text-lg font-extrabold text-slate-900">Revisión guardada</h3>
          <p className="text-sm text-slate-600">
            Tus decisiones del trimestre {data.trimestre} quedan registradas con fecha para el seguimiento del próximo
            trimestre.
          </p>
          <button
            onClick={() => {
              setGuardado(false);
              setPaso(1);
            }}
            className="btn-secundario w-full"
          >
            Volver al inicio de la revisión
          </button>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { COLORES_SEMAFORO, euros, eurosHora, pct } from '../ui.js';

function FilaCliente({ c, posicion }) {
  const color = COLORES_SEMAFORO[c.semaforo];
  return (
    <Link
      to={`/clientes/${c.id}`}
      className={`flex items-center gap-3 rounded-2xl border-l-4 ${color.border} bg-white p-3 shadow-sm transition hover:shadow-md`}
    >
      <span className="w-5 text-center text-sm font-bold text-slate-300">{posicion}</span>
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${color.solid}`}>
        <span className="text-xl font-black text-white">{c.score_total}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-bold text-slate-900">{c.nombre}</span>
          {c.dependencia_alta && (
            <span className="shrink-0 rounded-full bg-rojo-claro px-2 py-0.5 text-[10px] font-bold uppercase text-rojo-oscuro">
              ⚠ Dependencia
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-slate-500">
          <span>{eurosHora(c.euros_hora_real)} reales</span>
          <span>{pct(c.pct_ingresos)} de ingresos</span>
        </div>
      </div>
      <span className="text-slate-300">›</span>
    </Link>
  );
}

export default function PanelPage() {
  const [panel, setPanel] = useState(null);
  const [alertas, setAlertas] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.panel(), api.alertas()])
      .then(([p, a]) => {
        setPanel(p);
        setAlertas(a);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="tarjeta text-rojo">Error: {error}. ¿Está arrancado el servidor?</p>;
  if (!panel) return <p className="text-slate-400">Cargando panel…</p>;

  const co = panel.coste_oportunidad;

  return (
    <div className="space-y-4">
      {/* MÉTRICA ESTRELLA: coste de oportunidad del peor cliente */}
      {co && (
        <div className="rounded-3xl bg-slate-900 p-5 text-white">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-300">
            Coste de oportunidad de tu peor cliente
          </div>
          <div className="my-1 text-6xl font-black leading-none text-rojo">
            {euros(co.valor)}
          </div>
          <p className="text-sm text-slate-300">
            Es lo que ganarías de más si dedicaras las <b>{co.peor_cliente.horas} h</b> que te come{' '}
            <b>{co.peor_cliente.nombre}</b> a un cliente como <b>{co.mejor_cliente.nombre}</b> (
            {eurosHora(co.mejor_cliente.euros_hora_real)}), en vez de los {euros(co.peor_cliente.ingresos)} que te paga.
          </p>
        </div>
      )}

      {/* Alertas de dependencia */}
      {alertas?.dependencia_alta?.length > 0 && (
        <div className="rounded-2xl border border-rojo bg-rojo-claro p-3">
          <div className="font-bold text-rojo-oscuro">⚠ Dependencia alta</div>
          <p className="text-sm text-rojo-oscuro">
            {alertas.dependencia_alta.map((d) => `${d.nombre} (${d.pct_ingresos}%)`).join(', ')} supera{' '}
            {alertas.dependencia_alta.length > 1 ? 'n' : ''} el 40% de tus ingresos. Si lo pierdes, duele.
          </p>
        </div>
      )}

      {/* Ranking */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-extrabold text-slate-800">Tus clientes por puntuación</h2>
          <span className="text-xs text-slate-400">{panel.clientes.length} clientes</span>
        </div>
        <div className="space-y-2">
          {panel.clientes.map((c, i) => (
            <FilaCliente key={c.id} c={c} posicion={i + 1} />
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Link to="/clientes/nuevo" className="btn-secundario flex-1">
          ➕ Nuevo cliente
        </Link>
        <Link to="/revision" className="btn-secundario flex-1">
          🗓️ Revisión trimestral
        </Link>
      </div>

      <p className="px-1 text-center text-xs text-slate-400">
        Ingresos totales registrados: {euros(panel.ingresos_totales)}
      </p>
    </div>
  );
}

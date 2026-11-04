import { eurosHora, euros } from '../ui.js';

// Barra de un componente del score.
function Barra({ etiqueta, puntos, maximo, explicacion }) {
  const pctRel = Math.round((puntos / maximo) * 100);
  const color = pctRel >= 75 ? 'bg-verde' : pctRel >= 45 ? 'bg-ambar' : 'bg-rojo';
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-semibold text-slate-700">{etiqueta}</span>
        <span className="text-sm font-bold text-slate-900">
          {puntos} <span className="text-slate-400">/ {maximo}</span>
        </span>
      </div>
      <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pctRel}%` }} />
      </div>
      {explicacion && <p className="mt-1 text-xs text-slate-500">{explicacion}</p>}
    </div>
  );
}

// Muestra SIEMPRE el desglose de los 3 componentes con su explicación en llano.
export default function Desglose({ score }) {
  const d = score.detalle;
  const r = d.rentabilidad;
  const f = d.fiabilidad;

  const explRent = r.sinDatos
    ? 'Aún sin ingresos registrados: puntuación provisional.'
    : `Cobras ${eurosHora(r.eurosHoraReal)} reales frente a la tarifa acordada` +
      (r.horasExtra ? ` (${r.horasExtra} h extra no facturadas restan rentabilidad).` : '.');

  const explFiab = f.sinDatos
    ? 'Aún sin histórico de pagos.'
    : f.parciales >= 3
    ? 'Pagos parciales frecuentes.'
    : f.retrasoMedio === 0
    ? 'Paga siempre dentro de plazo.'
    : `Retraso medio de ${Math.round(f.retrasoMedio)} días.`;

  const explGest =
    d.gestion.eventosNegativos === 0
      ? 'Sin cambios de alcance, urgencias ni reuniones improductivas.'
      : `${d.gestion.eventosNegativos} eventos que consumen tiempo (cambios, urgencias, reuniones, revisiones).`;

  return (
    <div className="space-y-4">
      <Barra etiqueta="Rentabilidad real" puntos={score.score_rentabilidad} maximo={40} explicacion={explRent} />
      <Barra etiqueta="Fiabilidad de pago" puntos={score.score_fiabilidad} maximo={35} explicacion={explFiab} />
      <Barra etiqueta="Coste de gestión" puntos={score.score_gestion} maximo={25} explicacion={explGest} />

      <div className="grid grid-cols-3 gap-2 pt-2 text-center">
        <div className="rounded-xl bg-slate-50 p-2">
          <div className="text-xs text-slate-500">€/hora real</div>
          <div className="font-bold text-slate-900">{eurosHora(d.euros_hora_real)}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-2">
          <div className="text-xs text-slate-500">Ingresos</div>
          <div className="font-bold text-slate-900">{euros(d.ingresos)}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-2">
          <div className="text-xs text-slate-500">Tono medio</div>
          <div className="font-bold text-slate-900">{d.tono_medio ? `${d.tono_medio.toFixed(1)}/5` : '—'}</div>
        </div>
      </div>
    </div>
  );
}

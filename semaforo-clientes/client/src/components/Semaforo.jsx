import { COLORES_SEMAFORO } from '../ui.js';

// Semáforo visualmente dominante: el color y los puntos mandan.
// tamaño: 'grande' (ficha) | 'mediano' (tarjeta panel) | 'mini' (chip).
export default function Semaforo({ semaforo, puntos, tamano = 'mediano' }) {
  const c = COLORES_SEMAFORO[semaforo] || COLORES_SEMAFORO.ambar;

  if (tamano === 'mini') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-bold ${c.bg} ${c.text}`}>
        <span className={`h-2.5 w-2.5 rounded-full ${c.solid}`} />
        {puntos} pts
      </span>
    );
  }

  if (tamano === 'grande') {
    return (
      <div className={`flex flex-col items-center justify-center rounded-3xl ${c.bg} p-6 w-full`}>
        <div className={`flex h-28 w-28 items-center justify-center rounded-full ${c.solid} shadow-lg`}>
          <span className="text-5xl font-black text-white">{puntos}</span>
        </div>
        <div className={`mt-3 text-lg font-extrabold uppercase tracking-wide ${c.text}`}>
          {c.emoji} {c.nombre}
        </div>
        <div className="text-sm text-slate-500">puntos sobre 100</div>
      </div>
    );
  }

  // mediano
  return (
    <div className={`flex items-center gap-3 rounded-2xl ${c.bg} px-3 py-2`}>
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${c.solid}`}>
        <span className="text-lg font-black text-white">{puntos}</span>
      </div>
      <div>
        <div className={`text-sm font-extrabold uppercase ${c.text}`}>{c.nombre}</div>
        <div className="text-xs text-slate-500">puntos</div>
      </div>
    </div>
  );
}

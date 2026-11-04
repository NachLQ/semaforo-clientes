import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api.js';
import { euros, fechaCorta } from '../ui.js';
import Semaforo from '../components/Semaforo.jsx';
import Desglose from '../components/Desglose.jsx';
import RegistrarEvento from '../components/RegistrarEvento.jsx';
import PlantillaMensaje from '../components/PlantillaMensaje.jsx';

const NIVEL_ESTILO = {
  joya: 'bg-verde-claro text-verde-oscuro',
  aceptable: 'bg-verde-claro text-verde-oscuro',
  mejorar: 'bg-ambar-claro text-ambar-oscuro',
  problematico: 'bg-rojo-claro text-rojo-oscuro',
  ruina: 'bg-rojo-claro text-rojo-oscuro',
};

export default function ClientePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [tiposEvento, setTiposEvento] = useState(null);
  const [error, setError] = useState(null);

  async function cargar() {
    try {
      const [c, t] = await Promise.all([api.obtenerCliente(id), api.tiposEvento()]);
      setCliente(c);
      setTiposEvento(t);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function borrarEvento(eventoId) {
    await api.borrarEvento(id, eventoId);
    cargar();
  }

  async function borrarCliente() {
    if (!confirm(`¿Eliminar a ${cliente.nombre} y todo su historial?`)) return;
    await api.borrarCliente(id);
    navigate('/panel');
  }

  if (error) return <p className="tarjeta text-rojo">Error: {error}</p>;
  if (!cliente || !tiposEvento) return <p className="text-slate-400">Cargando…</p>;

  const score = cliente.score;
  const reco = cliente.recomendacion;

  return (
    <div className="space-y-4">
      <Link to="/panel" className="text-sm font-semibold text-slate-500">
        ← Volver al panel
      </Link>

      {/* Cabecera + semáforo dominante */}
      <div className="tarjeta">
        <div className="mb-3">
          <h2 className="text-xl font-extrabold text-slate-900">{cliente.nombre}</h2>
          <p className="text-sm text-slate-500">
            {cliente.servicio_principal || 'Sin servicio definido'} ·{' '}
            {cliente.tarifa_acordada} € / {cliente.unidad_tarifa}
            {cliente.fecha_inicio ? ` · desde ${fechaCorta(cliente.fecha_inicio)}` : ''}
          </p>
        </div>
        <Semaforo semaforo={score.semaforo} puntos={score.score_total} tamano="grande" />
        {cliente.notas && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{cliente.notas}</p>}
      </div>

      {/* Recomendación + plantilla editable */}
      <div className="tarjeta space-y-3">
        <h3 className="font-bold text-slate-800">Recomendación</h3>
        <div className={`rounded-xl p-3 font-semibold ${NIVEL_ESTILO[reco.nivel] || 'bg-slate-100'}`}>
          {reco.texto_recomendacion}
        </div>
        {reco.plantilla && <PlantillaMensaje plantilla={reco.plantilla} />}
      </div>

      {/* Desglose */}
      <div className="tarjeta">
        <h3 className="mb-3 font-bold text-slate-800">Por qué estos puntos</h3>
        <Desglose score={score} />
      </div>

      {/* Registro rápido */}
      <div className="tarjeta">
        <RegistrarEvento clienteId={id} tiposEvento={tiposEvento} onRegistrado={cargar} />
      </div>

      {/* Historial de eventos */}
      <div className="tarjeta">
        <h3 className="mb-3 font-bold text-slate-800">Historial ({cliente.eventos.length})</h3>
        {cliente.eventos.length === 0 ? (
          <p className="text-sm text-slate-400">Aún no hay eventos. Registra el primero arriba.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {cliente.eventos.map((ev) => {
              const def = tiposEvento[ev.tipo] || {};
              return (
                <li key={ev.id} className="flex items-center gap-3 py-2">
                  <span className="text-lg">{def.icono || '•'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-800">{def.etiqueta || ev.tipo}</div>
                    <div className="text-xs text-slate-500">
                      {fechaCorta(ev.fecha)}
                      {ev.importe != null ? ` · ${euros(ev.importe)}` : ''}
                      {ev.valor_numerico != null && ev.tipo !== 'pago_puntual'
                        ? ` · ${ev.valor_numerico}${
                            ev.tipo === 'hora_extra' ? ' h' : ev.tipo === 'tono' ? '/5' : ' días'
                          }`
                        : ''}
                      {ev.descripcion ? ` · ${ev.descripcion}` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => borrarEvento(ev.id)}
                    className="shrink-0 text-xs font-semibold text-slate-400 hover:text-rojo"
                  >
                    Borrar
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <button onClick={borrarCliente} className="w-full py-3 text-sm font-semibold text-slate-400 hover:text-rojo">
        Eliminar cliente
      </button>
    </div>
  );
}

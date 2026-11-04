import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { hoyISO } from '../ui.js';

export default function NuevoClientePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: '',
    servicio_principal: '',
    tarifa_acordada: '',
    unidad_tarifa: 'hora',
    horas_estimadas: '',
    fecha_inicio: hoyISO(),
    notas: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      const cliente = await api.crearCliente(form);
      navigate(`/clientes/${cliente.id}`);
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="tarjeta space-y-4">
      <h2 className="text-lg font-extrabold text-slate-900">Nuevo cliente</h2>

      <div>
        <label className="etiqueta">Nombre *</label>
        <input className="campo" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} autoFocus />
      </div>

      <div>
        <label className="etiqueta">Servicio principal</label>
        <input
          className="campo"
          value={form.servicio_principal}
          onChange={(e) => set('servicio_principal', e.target.value)}
          placeholder="Ej: Diseño web"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="etiqueta">Tarifa acordada</label>
          <input
            type="number"
            inputMode="decimal"
            className="campo"
            value={form.tarifa_acordada}
            onChange={(e) => set('tarifa_acordada', e.target.value)}
            placeholder="Ej: 50"
          />
        </div>
        <div>
          <label className="etiqueta">Unidad</label>
          <select className="campo" value={form.unidad_tarifa} onChange={(e) => set('unidad_tarifa', e.target.value)}>
            <option value="hora">€ / hora</option>
            <option value="proyecto">€ / proyecto</option>
          </select>
        </div>
      </div>

      {form.unidad_tarifa === 'proyecto' && (
        <div>
          <label className="etiqueta">Horas estimadas del proyecto</label>
          <input
            type="number"
            inputMode="decimal"
            className="campo"
            value={form.horas_estimadas}
            onChange={(e) => set('horas_estimadas', e.target.value)}
            placeholder="Para calcular tu €/hora real"
          />
          <p className="mt-1 text-xs text-slate-400">
            Necesario para estimar la rentabilidad por hora en proyectos cerrados.
          </p>
        </div>
      )}

      <div>
        <label className="etiqueta">Inicio de la relación</label>
        <input type="date" className="campo" value={form.fecha_inicio} onChange={(e) => set('fecha_inicio', e.target.value)} />
      </div>

      <div>
        <label className="etiqueta">Notas</label>
        <textarea className="campo min-h-[80px]" value={form.notas} onChange={(e) => set('notas', e.target.value)} />
      </div>

      {error && <p className="text-sm font-semibold text-rojo">{error}</p>}

      <div className="flex gap-2">
        <button type="button" onClick={() => navigate('/panel')} className="btn-secundario flex-1">
          Cancelar
        </button>
        <button type="submit" disabled={guardando} className="btn-primario flex-1">
          {guardando ? 'Guardando…' : 'Crear cliente'}
        </button>
      </div>
    </form>
  );
}

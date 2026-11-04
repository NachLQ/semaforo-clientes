// ui.js — utilidades de presentación compartidas (formato y estilos del semáforo).

export const COLORES_SEMAFORO = {
  verde: {
    nombre: 'Verde',
    emoji: '🟢',
    bg: 'bg-verde-claro',
    text: 'text-verde-oscuro',
    solid: 'bg-verde',
    ring: 'ring-verde',
    border: 'border-verde',
  },
  ambar: {
    nombre: 'Ámbar',
    emoji: '🟡',
    bg: 'bg-ambar-claro',
    text: 'text-ambar-oscuro',
    solid: 'bg-ambar',
    ring: 'ring-ambar',
    border: 'border-ambar',
  },
  rojo: {
    nombre: 'Rojo',
    emoji: '🔴',
    bg: 'bg-rojo-claro',
    text: 'text-rojo-oscuro',
    solid: 'bg-rojo',
    ring: 'ring-rojo',
    border: 'border-rojo',
  },
};

const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const eur2 = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export function euros(n) {
  if (n == null) return '—';
  return eur.format(n);
}

export function eurosHora(n) {
  if (n == null) return '—';
  return `${eur2.format(Math.round(n))}/h`;
}

export function pct(n) {
  if (n == null) return '—';
  return `${Math.round(n)}%`;
}

export function fechaCorta(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

export function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

import { useEffect, useState } from 'react';

// Plantilla de mensaje EDITABLE antes de copiar.
export default function PlantillaMensaje({ plantilla }) {
  const [texto, setTexto] = useState(plantilla?.texto || '');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setTexto(plantilla?.texto || '');
  }, [plantilla?.id, plantilla?.texto]);

  if (!plantilla) return null;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // Fallback si el portapapeles no está disponible.
      const ta = document.createElement('textarea');
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-700">✉️ {plantilla.titulo}</span>
        <span className="text-xs text-slate-400">editable</span>
      </div>
      <textarea
        className="campo min-h-[150px] resize-y bg-white text-sm leading-relaxed"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      <p className="mt-1 text-xs text-slate-400">
        Edita los datos entre [corchetes] antes de copiar.
      </p>
      <button onClick={copiar} className="btn-primario mt-2 w-full">
        {copiado ? '✓ Copiado al portapapeles' : 'Copiar mensaje'}
      </button>
    </div>
  );
}

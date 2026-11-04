// plantillas.js
// Plantillas de mensaje y generador de recomendaciones por reglas.
// El copy es obligatorio (ver prompt) y editable por el usuario en el cliente.

// Las plantillas usan marcadores [entre corchetes] que el usuario rellena/edita.
export const PLANTILLAS = {
  subida_tarifa: {
    id: 'subida_tarifa',
    titulo: 'Subida de tarifa',
    texto:
      'Hola [nombre], quería comentarte que a partir de [fecha] voy a actualizar mis tarifas. ' +
      'Tu nueva tarifa será de [nueva tarifa]. Quiero seguir trabajando contigo y por eso te lo ' +
      'comunico con tiempo para que podamos organizarnos. ¿Tienes alguna pregunta?',
  },
  nuevas_condiciones: {
    id: 'nuevas_condiciones',
    titulo: 'Nuevas condiciones de trabajo',
    texto:
      'Hola [nombre], para poder seguir dándote el mejor servicio necesito proponerte algunos ' +
      'cambios en cómo trabajamos juntos: [condiciones]. Creo que esto nos beneficia a los dos y ' +
      'me permite dedicarte la atención que mereces. ¿Lo hablamos?',
  },
  despedida: {
    id: 'despedida',
    titulo: 'Despedida profesional',
    texto:
      'Hola [nombre], después de pensarlo con calma, he decidido reorganizar mi cartera de clientes ' +
      'y no voy a poder seguir con nuestro proyecto a partir de [fecha]. Ha sido un placer trabajar ' +
      'contigo y te deseo lo mejor. Si necesitas algún detalle para la transición, estoy disponible ' +
      'estas semanas.',
  },
};

// Devuelve todas las plantillas como array (para GET /api/plantillas-mensaje).
export function listaPlantillas() {
  return Object.values(PLANTILLAS);
}

// Sustituye [nombre] por el nombre real del cliente en una plantilla.
function personalizar(texto, cliente) {
  if (!cliente) return texto;
  return texto.replace(/\[nombre\]/g, cliente.nombre);
}

// Genera la recomendación automática a partir del score calculado.
// Devuelve nivel, texto y (si aplica) la plantilla de mensaje sugerida.
export function generarRecomendacion(cliente, score) {
  const total = score.score_total;
  const peor = score.detalle?.peor_componente || 'el componente más bajo';

  let nivel;
  let texto;
  let plantillaId = null;

  if (total >= 70) {
    nivel = 'joya';
    texto = 'Cliente joya. Cuídalo y prioriza su disponibilidad.';
  } else if (total >= 55) {
    nivel = 'aceptable';
    texto = `Cliente aceptable. Vigilar ${peor}.`;
  } else if (total >= 40) {
    nivel = 'mejorar';
    texto = 'Cliente a mejorar. Considera repreciar o poner condiciones.';
    plantillaId = 'subida_tarifa';
  } else if (total >= 20) {
    nivel = 'problematico';
    texto = 'Cliente problemático. Plantéate nuevas condiciones o despedirlo.';
    plantillaId = 'nuevas_condiciones';
  } else {
    nivel = 'ruina';
    texto = 'Cliente ruina. Los números son claros: te cuesta dinero.';
    plantillaId = 'despedida';
  }

  const plantilla = plantillaId ? PLANTILLAS[plantillaId] : null;

  return {
    nivel,
    texto_recomendacion: texto,
    plantilla: plantilla
      ? {
          id: plantilla.id,
          titulo: plantilla.titulo,
          texto: personalizar(plantilla.texto, cliente),
        }
      : null,
  };
}

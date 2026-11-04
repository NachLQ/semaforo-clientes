# 🚦 Semáforo de Clientes

**Detector de clientes rentables y clientes ruina para autónomos.**

> "Tu peor cliente te está costando dinero. Esta herramienta te lo demuestra con números."

---

## Qué es y para quién

Todo autónomo tiene **un** cliente que paga tarde, pide cambios infinitos y consume el triple de
tiempo. Pero no tiene los números delante para atreverse a soltarlo.

**Semáforo de Clientes** es una app para autónomos, freelancers y pequeños estudios que:

1. Registra los **eventos** de cada cliente (pagos tardíos, cambios de alcance, urgencias, horas
   extra no facturadas, tono de la relación…).
2. Calcula automáticamente una **puntuación de 0 a 100** con un **semáforo** 🟢🟡🔴.
3. Te dice, con números, **cuáles son rentables de verdad** y **cuáles te están costando dinero
   sin que lo sepas**.
4. Te da una **recomendación** y, si hace falta, una **plantilla de mensaje lista para usar**
   (subir tarifa, poner condiciones o despedir).
5. Te guía en una **revisión trimestral** para decidir y dejar constancia.

---

## Requisitos

- **Node.js 18+** (probado con Node 24).
- npm.

No necesita base de datos externa: usa **SQLite** en un fichero local (`server/data/semaforo.db`).

---

## Instalación y ejecución

Desde la carpeta `semaforo-clientes/`:

```bash
# 1. Instalar dependencias (raíz + server + client)
npm run install:all

# 2. Cargar los datos demo (8 clientes con historias claras)
npm run seed

# 3. Arrancar API (puerto 4000) y cliente (puerto 5173) a la vez
npm run dev
```

Abre **http://localhost:5173** en el navegador.

> Si prefieres arrancarlos por separado: `npm run dev:server` y `npm run dev:client`.
> El cliente habla con la API mediante un proxy `/api` → `http://localhost:4000` (ya configurado).

---

## Cómo se usa

### Registrar un cliente
Pulsa **➕ Nuevo** en la barra inferior. Rellena nombre, servicio, **tarifa acordada** (€/hora o
€/proyecto), fecha de inicio y notas. La ficha mostrará siempre su puntuación y su semáforo.

### Registrar eventos (en menos de 15 segundos)
Entra en la ficha de un cliente → **Registrar evento**:
1. Toca el tipo de evento (un toque).
2. Rellena el único campo imprescindible (días de retraso, horas, importe o valoración).
3. **Guardar**.

La puntuación se recalcula al instante. La fecha y la nota son opcionales (van plegadas).

Tipos de evento: pago puntual, pago tardío, pago parcial, cambio de alcance, hora extra no
facturada, urgencia fuera de horario, tono de la relación (1-5), reunión no productiva, revisión
extra y incidencia destacada.

---

## Cómo funciona el semáforo y los puntos

La puntuación va de **0 a 100** y se reparte en **tres componentes**. En la ficha ves siempre el
desglose, no solo el número.

### 1. Rentabilidad real — 40 puntos
¿Cuánto cobras **de verdad por hora**, contando las horas extra que regalas?

- Calculamos tu **€/hora real** = `ingresos cobrados ÷ horas efectivas`.
- Las **horas efectivas** = las horas que cubren tus ingresos a tu tarifa **+ las horas extra no
  facturadas**. Cuantas más horas regalas, más baja tu €/hora real.
- Comparamos ese €/hora real con tu **tarifa acordada**:

| €/hora real vs tarifa | Puntos |
|----------------------|:-----:|
| ≥ 100 %              | 40 |
| 80 – 99 %           | 30 |
| 60 – 79 %           | 20 |
| < 60 %              | 5 |

### 2. Fiabilidad de pago — 35 puntos
Basado en tus eventos de pago (puntual cuenta como 0 días de retraso):

| Situación | Puntos |
|-----------|:-----:|
| Sin retrasos | 35 |
| Retraso medio < 7 días | 25 |
| Retraso medio 7 – 21 días | 15 |
| Retraso medio > 21 días **o** pagos parciales frecuentes (≥ 3) | 5 |

### 3. Coste de gestión — 25 puntos
Cuenta los eventos que te comen tiempo: **cambios de alcance, urgencias, reuniones no productivas
y revisiones extra**.

| Nº de eventos | Puntos |
|---------------|:-----:|
| 0 | 25 |
| 1 – 2 | 18 |
| 3 – 5 | 10 |
| > 5 | 3 |

### Semáforo final

| Puntos totales | Semáforo |
|----------------|:--------:|
| ≥ 70 | 🟢 Verde |
| 40 – 69 | 🟡 Ámbar |
| < 40 | 🔴 Rojo |

> El **tono de la relación** (1-5) se muestra como dato informativo en la ficha, pero **no** entra
> en el cálculo de puntos (la fórmula se mantiene objetiva y centrada en dinero y tiempo).

### Ejemplo verificable a mano (cliente del seed: **Diseños Carla**)
- Ingresos cobrados: 4 pagos parciales de 150 € = **600 €**. Tarifa 40 €/h.
- Horas que cubren esos ingresos: 600 ÷ 40 = 15 h. Horas extra no facturadas: 40 h. → **Horas
  efectivas = 55 h**.
- €/hora real = 600 ÷ 55 = **10,9 €/h** → 10,9 / 40 = **27 %** (< 60 %) → **Rentabilidad = 5**.
- Pagos parciales frecuentes (4 ≥ 3) → **Fiabilidad = 5**.
- Eventos de gestión: 3 cambios + 3 urgencias + 1 reunión + 1 revisión = 8 (> 5) → **Gestión = 3**.
- **Total = 5 + 5 + 3 = 13 → 🔴 Rojo.** ✅

Y **Estudio Nómada** (joya): rentabilidad 40 (cobra justo su tarifa, 0 horas extra) + fiabilidad
35 (siempre puntual) + gestión 25 (0 eventos) = **100 → 🟢 Verde.** ✅

---

## El panel comparativo

En **📊 Panel** ves:

- El **ranking** de clientes por puntuación, con su semáforo, su €/hora real y el **% de tus
  ingresos** que representa cada uno.
- **Alerta de dependencia**: si un cliente supera el **40 %** de tus ingresos, aparece un aviso
  bien visible (en el seed lo dispara **Marketing Sur**, 45 %).
- La métrica estrella, el número más grande del panel: **"Coste de oportunidad de tu peor
  cliente"**. Es lo que ganarías de más si dedicaras las horas de tu cliente rojo a un cliente como
  el verde.
  - Cálculo: `horas del peor cliente × €/hora real del mejor cliente − ingresos del peor cliente`.
  - En el seed: 55 h × 65 €/h − 600 € = **2.975 €**.

---

## Las plantillas de mensaje

Cuando un cliente baja de 55 puntos, la recomendación incluye una **plantilla lista para usar**:

| Puntos | Recomendación | Plantilla |
|--------|---------------|-----------|
| ≥ 70 | Cliente joya | — |
| 55 – 69 | Cliente aceptable (vigilar) | — |
| 40 – 54 | Cliente a mejorar | **Subida de tarifa** |
| 20 – 39 | Cliente problemático | **Nuevas condiciones de trabajo** |
| < 20 | Cliente ruina | **Despedida profesional** |

La plantilla aparece en la ficha con el `[nombre]` ya rellenado. **Es editable**: ajusta los datos
entre `[corchetes]` (fecha, nueva tarifa, condiciones…) y pulsa **Copiar mensaje**.

---

## La revisión trimestral

En **🗓️ Revisión**, un flujo guiado de **4 pasos** que conviene hacer cada 3 meses:

1. **Resumen del trimestre**: clientes activos, nuevos y cambio de puntos respecto al trimestre
   anterior (con las decisiones que tomaste entonces).
2. **Joya y ruina**: tu mejor y tu peor cliente del trimestre.
3. **Decisiones**: para cada cliente en rojo o ámbar, eliges acción (repreciar / poner condiciones
   / despedir / mantener y vigilar) y una nota.
4. **Guardar**: las decisiones quedan registradas con fecha para el seguimiento.

El seed ya incluye una revisión guardada del trimestre anterior (**2026-Q1**) con decisiones, para
que veas la evolución desde el primer momento.

---

## Qué incluye el seed

`npm run seed` carga **8 clientes** con historias claras y **63 eventos** de los últimos 3 meses:

| Cliente | Historia | Puntos | Semáforo |
|---------|----------|:------:|:--------:|
| Estudio Nómada | Joya: puntual, sin cambios, tono excelente | 100 | 🟢 |
| Marketing Sur | Buen cliente pero **45 % de tus ingresos** (dependencia) | 93 | 🟢 |
| Clínica Bienestar | Sólido, algún retraso puntual | 73 | 🟢 |
| Academia Futuro | Aceptable con tendencia al scope creep | 55 | 🟡 |
| Taller Montseny | Nuevo (2 meses), aún sin histórico de pago | 53 | 🟡 |
| Consultora Azul | A vigilar: paga tarde, alguna urgencia | 45 | 🟡 |
| Reformas Vidal | Problemático: tarde, scope creep, **38 % de ingresos** | 38 | 🔴 |
| Diseños Carla | Ruina: paga a medias, cambios sin fin, tono 1/5 | 13 | 🔴 |

Más una **revisión trimestral 2026-Q1** con 3 decisiones tomadas.

---

## Arquitectura

```
semaforo-clientes/
├── package.json          # scripts raíz (dev con concurrently, seed, build)
├── server/               # API REST: Node.js + Express + SQLite (better-sqlite3)
│   ├── index.js          # endpoints
│   ├── db.js             # conexión y esquema
│   ├── scoring.js        # motor de puntuación (toda la fórmula, fácil de auditar)
│   ├── plantillas.js     # copys + generador de recomendaciones
│   ├── seed.js           # datos demo
│   └── data/             # semaforo.db (se crea solo)
└── client/               # React 18 + Vite + Tailwind CSS (mobile-first)
    └── src/
        ├── pages/        # Panel, Cliente, Nuevo cliente, Revisión
        ├── components/   # Semáforo, Desglose, RegistrarEvento, PlantillaMensaje
        ├── api.js        # cliente HTTP
        └── ui.js         # formato y estilos del semáforo
```

### API (REST, JSON)

```
GET    /api/tipos-evento
GET    /api/plantillas-mensaje
GET    /api/clientes
POST   /api/clientes
GET    /api/clientes/:id
PUT    /api/clientes/:id
DELETE /api/clientes/:id
GET    /api/clientes/:id/eventos
POST   /api/clientes/:id/eventos
DELETE /api/clientes/:id/eventos/:eventoId
GET    /api/clientes/:id/score
GET    /api/clientes/:id/recomendacion
GET    /api/panel                 # ranking + coste de oportunidad
GET    /api/panel/alertas         # dependencia alta + clientes ruina
GET    /api/revision/actual
POST   /api/revision/decisiones
```

### Decisiones de diseño (ampliaciones documentadas del modelo)

El modelo de datos del enunciado se respeta y se amplía con **dos campos** para poder calcular la
rentabilidad real de forma honesta:

- **`eventos.importe`**: euros del pago (solo en eventos de pago). El `valor_numerico` del enunciado
  guarda el dato específico del tipo (días de retraso, horas o valoración 1-5).
- **`clientes.horas_estimadas`** (opcional): para tarifas **por proyecto**, permite derivar el
  €/hora de referencia. En tarifas por hora no se usa.

El **integración con facturación/tiempo es un mock**: hoy los ingresos y las horas se introducen
mediante eventos. La capa de cálculo (`scoring.js`) está aislada para conectar en el futuro un
proveedor real (Stripe, Holded, herramientas de time-tracking) sin tocar la interfaz.

---

## Limitaciones (fuera del MVP)

- Sin importación automática desde facturación ni time-tracking (entrada manual de eventos).
- Un solo usuario local, sin autenticación ni multiusuario.
- Sin notificaciones automáticas de revisión.
- La base de datos es un fichero local (no hay despliegue en la nube).

## Mejoras fase 2

- Conectar facturación real (Stripe/Holded) y time-tracking para autocompletar eventos.
- Notificación automática cuando toca revisión trimestral.
- Histórico de evolución de puntos por cliente (gráfica temporal).
- Exportar el informe de un cliente (PDF) para acompañar la subida de tarifa.
- Multiusuario con login para pequeños estudios con varios socios.

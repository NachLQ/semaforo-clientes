# QA verificado — Semáforo de Clientes 1.0

**Fecha:** 21/07/2026
**Entorno probado:** Windows + Node.js (v24).
**Verificado por:** equipo de QA.

## Pruebas realizadas y superadas
- Arranque de servidor (:4000) y cliente con better-sqlite3 (prebuilt) en Node 24.
- Se añadió auto-seed al servidor (no auto-sembraba); verificado en frío: 8 clientes y 60+ eventos demo.
- Motor de scoring de 3 componentes (rentabilidad/fiabilidad/gestión → semáforo) verificado: Estudio Nómada 100/verde (65 €/h, 0 retraso), Diseños Carla 13/rojo (11 €/h, 40 h extra sin cobrar, 38 días de retraso medio, 8 eventos negativos).
- Detecta clientes tóxicos de alto volumen: Reformas Vidal 38/rojo pese a 15.900 € de ingresos.
- Coste de oportunidad calculado correctamente: 2.975 € = 55 h del peor cliente × 65 €/h − 600 € que paga.
- Alerta de dependencia: Marketing Sur (45 % de ingresos) supera el umbral del 40 %.
- Render de la UI con el ranking de clientes por puntuación y euros/hora reales.
- Persistencia SQLite; la base de datos demo se auto-genera al primer arranque.

## Limpieza de la entrega
El ZIP no contiene bases de datos de prueba, dependencias instaladas (node_modules),
builds (dist), cachés, logs, ZIPs anidados ni archivos internos de producción
(prompts, metadatos). Los datos de demostración se cargan solos al primer arranque.

## Límites declarados
Producto local y monousuario. Los recordatorios/envíos no mandan mensajes reales
salvo que se conecte un proveedor. No sustituye a software fiscal homologado.
Consulta la Licencia, el Soporte y el Disclaimer incluidos.

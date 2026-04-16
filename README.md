# Perú Elige 2026 — Dashboard Electoral v2

Dashboard interactivo de seguimiento del conteo oficial de la ONPE para las Elecciones Generales 2026 (Primera Vuelta), con modelo de proyección al 100% basado en **damping dinámico por región**.

**[Ver dashboard live →](https://mrsprintalot.github.io/Peru_Elecciones_2026_v2/)**

## Qué es esto

Un fork del [dashboard original de Renzo Núñez](https://github.com/renzonunezaf/Elecciones_2026) con un motor de proyección mejorado que diferencia entre zonas geográficas según su perfil de voto y nivel de avance en el conteo.

## Modelo v2: Damping Dinámico

El modelo original aplicaba factores de ajuste empíricos con un damping uniforme de 0.50 para todas las regiones. Esto funcionaba bien en las etapas tempranas del conteo, pero generaba distorsiones cuando algunas regiones superaban el 90% de actas mientras otras aún estaban por debajo del 60%.

El modelo v2 introduce **damping dinámico por segmento**:

| Segmento | Damping | Razón |
|----------|---------|-------|
| Voto exterior | 0.95 | Perfil marcadamente distinto al nacional, baja cobertura de actas |
| Lima + Callao | 0.80 | Actas JEE pendientes, conteo urbano aún en progreso |
| Regiones >90% actas | 0.25 | El acumulado ya refleja el resultado real |
| Resto del país <90% | 0.50 | Damping estándar conservador |

Además se recalibraron los **factores empíricos por departamento** para capturar el sesgo urbano/rural que los factores originales (calculados entre 80-88% de actas) no contemplaban.

## Funcionalidades adicionales

- **Banner "Zona de Definición"** — Brecha en votos y puntos porcentuales entre el 2° y 3° lugar, con indicador de empate técnico cuando la diferencia es menor a 80K votos
- **Votos pendientes por zona** — Distribución geográfica de los votos por contabilizar: Lima+Callao, Sierra rural, Exterior, Resto
- **Gráfico con jerarquía visual** — Los candidatos fuera de la pelea principal se muestran con opacidad reducida
- **Panel de último corte** — Tooltip actualizado automáticamente con los datos del corte más reciente

## Stack

- JavaScript vanilla (single-file, ~2,400 líneas)
- D3.js — Mapa coroplético con TopoJSON
- Chart.js — Gráfico de evolución + proyección
- Cloudflare Workers — Proxy para la API de la ONPE

## Arquitectura de datos

El dashboard consume datos de la API interna de la ONPE (`resultadoelectoral.onpe.gob.pe/presentacion-backend`) a través de un proxy en Cloudflare Workers que agrega CORS headers y cachea respuestas. La infraestructura del proxy fue desarrollada por Renzo Núñez en el proyecto original.

Los datos se actualizan automáticamente cada 3 minutos. Cuando el proxy no está disponible, el dashboard cae a un sistema de 3 niveles de fallback: localStorage (última sesión) → datos embebidos en el HTML (snapshot estático) → data hardcodeada del último deploy.

Los datos de Datum e Ipsos (conteos rápidos) están embebidos como referencia estática.

## Fuentes de datos

- **ONPE** — resultadoelectoral.onpe.gob.pe (conteo oficial en tiempo real)
- **Datum Internacional** — Conteo rápido 100% (América TV / Canal N)
- **Ipsos Perú** — Conteo rápido 95.7%

## Créditos

- **Dashboard base:** [Renzo Núñez Berdejo](https://github.com/renzonunezaf/Elecciones_2026) — Diseño, arquitectura, sistema de candidatos, mapa D3, Chart.js, Cloudflare Worker proxy
- **Modelo v2 (damping dinámico):** [Rafael Vasquez](https://mrsprintalot.github.io/Peru_Elecciones_2026_v2/) — Recalibración de factores empíricos, damping dinámico por región, banner de zona de definición, panel de votos pendientes por zona

## Licencia

Este proyecto es un fork con fines educativos y de portafolio. Los datos electorales son de dominio público (ONPE).

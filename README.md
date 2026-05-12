# Perú Elige 2026 — Dashboard Electoral v45 (JEE)

Dashboard interactivo de seguimiento del conteo oficial ONPE para las Elecciones Generales 2026 (Primera Vuelta), con modelo de proyección geográfica basado en distribución real de actas JEE.

**[Ver dashboard live →](https://mrsprintalot.github.io/Peru_Elecciones_2026_v2/)**

**[📊 Análisis electoral completo →](https://github.com/MrSprintALot/Peru_Elecciones_2026_v2/blob/main/analisis_electoral_2026_v2.md)**

---

## Características

- **Conteo en tiempo real** — Conecta a la API de ONPE vía Cloudflare Worker propio (`onpe-proxy.perudata2026.workers.dev`)
- **Proyección v3-JEE** — Al 99%+: usa distribución geográfica real de las 450 actas JEE pendientes. Al <99%: damping dinámico por región
- **Verificador de consistencia** — Compara en tiempo real el total nacional vs la suma de 26 APIs regionales, detectando discrepancias
- **Mapa coroplético** — Ganador por departamento con D3.js + TopoJSON
- **Gráfico de evolución** — Tracking histórico del conteo + proyección al 100%
- **Panel de Irregularidades** — Registro de observaciones documentadas con status (procedió / pendiente / no procedió)

---

## Modelo de proyección v3-JEE

| Escenario | Método |
|-----------|--------|
| natPct ≥ 99% | Distribución geográfica real de actas JEE (450 actas, fuente: ATuManera/Peru_elecciones2026) |
| natPct < 99% | Damping dinámico: Extranjero 0.80 · Lima/Callao 0.50 · >90% 0.25 · resto 0.50 |

**Base de cálculo**: Porcentajes del API nacional (no regional) para corregir discrepancia estructural de ~307K VV entre ambas APIs.

---

## Discrepancias detectadas

El dashboard verifica en tiempo real la coherencia entre el API nacional y las 26 APIs regionales:

- **~307K VV** presentes en el nacional sin respaldo en ninguna región individual
- **Ratio 9:1** hacia Sánchez (JPP) vs RLA en los votos sin respaldo
- **4,343 mesas** contabilizadas en el nacional pero inexistentes en las APIs regionales

Estas discrepancias son consistentes en cada actualización y están documentadas también por análisis independientes (Prime Institute, OpenElection).

---

## Stack técnico

- **Frontend**: HTML/CSS/JS vanilla — single file, sin frameworks
- **Visualización**: D3.js (mapa), Chart.js (evolución temporal)
- **Proxy**: Cloudflare Worker propio — `onpe-proxy.perudata2026.workers.dev`
- **Deploy**: GitHub Pages

## Arquitectura de datos

```
Browser → Cloudflare Worker → API ONPE
              ↓
         Cache 90s (edge)
              ↓
         /api/snapshot?half=1  (nacional + regiones 1-13)
         /api/snapshot?half=2  (regiones 14-26 + Extranjero)
         /api/tracking         (historial de cortes, KV store)
```

**Fallback en 3 niveles**: Worker → localStorage (última sesión) → datos embebidos en HTML

---

## Fuentes de datos

- **ONPE** — `resultadoelectoral.onpe.gob.pe` (conteo oficial en tiempo real)
- **Datum Internacional** — Conteo rápido 100% (América TV / Canal N)
- **Ipsos Perú** — Conteo rápido 95.7%
- **ATuManera/Peru_elecciones2026** — Desglose territorial de actas JEE

---

## Autor

**Rafael Vasquez** — [@MrSprintALot](https://github.com/MrSprintALot) · [LinkedIn](https://www.linkedin.com/in/rafaelvasquezba/)

---

## Licencia

Los datos electorales son de dominio público (ONPE). El código de este dashboard es de libre uso con fines educativos.

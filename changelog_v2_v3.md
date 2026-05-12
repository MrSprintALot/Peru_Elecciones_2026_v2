# Perú Elige 2026 — Changelog v2 → v45 (JEE)

## Resumen ejecutivo

La transición de v2 a v45 (JEE) resolvió tres problemas críticos:
1. El dashboard dependía de infraestructura de terceros (Worker de Renzo, ya inactivo)
2. El modelo de proyección generaba brechas infladas (~87K votos) al aplicar factores de ajuste sobre datos casi completos (99.7%)
3. La discrepancia estructural entre la API nacional y las 26 APIs regionales de ONPE (~307K VV) no estaba siendo manejada correctamente

---

## Problemas encontrados y soluciones

### 1. Worker de Cloudflare caído (bloqueaba todo el dashboard)

**Problema:** El dashboard dependía del Worker de Renzo Núñez (`onpe-proxy.renzonunez-af.workers.dev`). Al darse de baja ese repo/cuenta, todos los requests fallaban con 403 "Host not in allowlist".

**Solución:** Desplegamos un Worker propio en Cloudflare (`onpe-proxy.perudata2026.workers.dev`). Para hacerlo fue necesario:
- Capturar los endpoints reales de la API de ONPE directamente del browser (DevTools → Network)
- Reverse-engineer de la estructura JSON de respuesta
- Deploy con `wrangler` usando API token propio

**Endpoints ONPE descubiertos:**
```
/resumen-general/totales?idEleccion=10&tipoFiltro=eleccion
/eleccion-presidencial/participantes-ubicacion-geografica-nombre?idEleccion=10&tipoFiltro=eleccion
/resumen-general/totales?idAmbitoGeografico=1&idEleccion=10&tipoFiltro=ubigeo_nivel_01&idUbigeoDepartamento=XXXXXX
```

---

### 2. Proyección inflada al 99.7% (~87K votos → real ~17K)

**Problema:** El motor de proyección v3 aplicaba factores de ajuste (damping dinámico por región) sobre datos donde ya no había pendientes significativos. Con datos embebidos al 75% de avance y el conteo real al 99.7%, el modelo calculaba ~25% de votos pendientes inexistentes, inflando la brecha a ~87K votos y 0.53pp.

**Causa raíz:** Tres capas de bugs:
1. `runProjection` no recibía el `natPct` real del Worker — usaba el promedio de las regiones embebidas (75%)
2. El `early-return` al 99%+ usaba la suma regional (~16.4M VV) en vez del total nacional (16.7M VV)
3. Los factores de damping seguían aplicándose sobre actas casi inexistentes

**Solución — Modelo v3-JEE:**
- `runProjection(regions, natPct, natVV, natCands)` — recibe el porcentaje y VV nacionales directamente del snapshot
- Al `natPct >= 99.0`: early-return que usa los **porcentajes del API nacional** (no los regionales) como base, y proyecta solo las **actas JEE reales** con su distribución geográfica conocida
- Al `natPct < 99.0`: mantiene el damping dinámico original

```javascript
// Distribución real de 450 actas JEE (fuente: ATuManera/Peru_elecciones2026)
const JEE_ACTAS = {
  'Lima': 142, 'Piura': 94, 'Cusco': 53, 'San Martín': 39, 'Cajamarca': 36,
  'Ucayali': 31, 'Madre de Dios': 13, 'Ayacucho': 11, 'Apurímac': 10,
  'Callao': 8, ...
};
const AVG_VV_JEE = 180; // votos válidos promedio por acta JEE
```

**Resultado:** Brecha proyectada correcta: **~0.10pp / ~17-20K votos — Sánchez 2do lugar**

---

### 3. Discrepancia estructural API nacional vs regionales

**Problema:** La suma de los 26 endpoints regionales de ONPE tiene ~307K votos válidos menos que el endpoint nacional. Esta discrepancia es **consistente en cada refresh** y tiene un sesgo desproporcionado: Sánchez tiene +8K votos extra en el nacional, RLA tiene +76K.

**Verificación en tiempo real:** El dashboard implementó un verificador que en cada refresh calcula:
```
Δ Sánchez = (nat_vv × nat_sanch%) - Σ(región_vv × región_sanch%)
Δ RLA     = (nat_vv × nat_rla%)   - Σ(región_vv × región_rla%)
Ratio     = Δ Sánchez / Δ RLA
```

**Resultado medido:** Δ Sánchez: +8,046 | Δ RLA: +76,860 | Ratio: 0.1:1 | VV total: +307,962

**Solución en la proyección:** Usar `natVV` (total nacional oficial) como base de cálculo, no la suma regional. Se aplica un `scaleFactor` para escalar los porcentajes regionales al total nacional correcto.

---

## Cambios de infraestructura

| Componente | v2 | v45 |
|---|---|---|
| Worker | `renzonunez-af.workers.dev` (externo, caído) | `perudata2026.workers.dev` (propio) |
| CORS | `*` (abierto) | Allowlist: `mrsprintalot.github.io` |
| Endpoints ONPE | Heredados (desconocidos) | Capturados del browser, documentados |
| KV Tracking | KV de Renzo | KV propio (`f0e9f6ee...`) |
| Analytics | GoatCounter de Renzo | Removido |

---

## Cambios en el dashboard

| Feature | v2 | v45 |
|---|---|---|
| Proyección al 99%+ | Damping dinámico (incorrecto) | JEE geográfico (correcto) |
| Base de proyección | Suma regional (~16.4M VV) | Total nacional (16.7M VV) |
| Umbral empate técnico | 80K votos | 30K votos |
| Banner brecha | "EMPATE TÉCNICO" | "RESULTADO AJUSTADO" |
| Pestañas | 2 (ONPE, Datum) | 3 (ONPE, Datum, Irregularidades) |
| Verificador consistencia | No | Sí — en tiempo real |
| Panel irregularidades | No | 12 items, 3 categorías, con status |
| Autoría | Renzo Núñez + Rafael Vasquez | Rafael Vasquez (MrSprintALot) |
| Versión | v44 | v45 (JEE) |

---

## Resultado final de la proyección v45-JEE

Al 99.789% de actas contabilizadas (196 actas en JEE):

| Pos | Candidato | ONPE actual | Proyección 100% | Brecha |
|---|---|---|---|---|
| 1° | Fujimori | 17.175% | ~17.18% | — |
| 2° | **Sánchez** | **12.008%** | **~12.02%** | **+20.3K vs 3°** |
| 3° | López Aliaga | 11.912% | ~11.90% | — |
| 4° | Nieto | 10.978% | ~10.97% | — |
| 5° | Belmont | 10.145% | ~10.15% | — |

**Conclusión:** Con ~27K VV pendientes (196 actas JEE × ~180 VV/acta) y una brecha de ~20K votos, Sánchez pasa a segunda vuelta con alta probabilidad. La distribución geográfica de las actas JEE pendientes (Lima 142 actas favorece RLA, pero Cajamarca + Cusco + San Martín + Apurímac favorecen a Sánchez) no alcanza para revertir el resultado.

# 🗳️ Análisis Electoral Perú 2026 — Primera Vuelta

<div align="center">

![Estado](https://img.shields.io/badge/Conteo_ONPE-99.789%25-2ECDA7?style=for-the-badge)
![Actas JEE](https://img.shields.io/badge/Actas_JEE-196_pendientes-EF9F27?style=for-the-badge)
![Corte](https://img.shields.io/badge/Corte-12_mayo_2026-4A90D9?style=for-the-badge)

**Dashboard live → [mrsprintalot.github.io/Peru_Elecciones_2026_v2](https://mrsprintalot.github.io/Peru_Elecciones_2026_v2/)**

</div>

---

## 📊 Resultado actual

| Pos | Candidato | Partido | % Votos válidos | Votos (~) | Estado |
|:---:|---|---|:---:|:---:|:---:|
| 🥇 | **Keiko Fujimori** | Fuerza Popular | **17.175%** | ~2,872K | ✅ Segunda vuelta |
| 🥈 | **Roberto Sánchez** | Juntos por el Perú | **12.008%** | ~2,007K | 🟡 Segunda vuelta |
| 🥉 | Rafael López Aliaga | Renovación Popular | 11.912% | ~1,991K | 🔴 Fuera por ~20K votos |
| 4° | Jorge Nieto | Partido del Buen Gobierno | 10.978% | ~1,835K | ❌ |
| 5° | Ricardo Belmont | Partido Cívico Obras | 10.145% | ~1,696K | ❌ |

> **Segunda vuelta proyectada:** 🟠 Fujimori vs 🔴 Sánchez — junio 2026

---

## 🎯 Proyección al 100% — Modelo v3-JEE

Con **196 actas JEE pendientes** (~27,000 VV restantes):

```
Sánchez  ████████████████████  ~12.02%  (+0.12pp sobre RLA)
RLA      ███████████████████▌  ~11.90%
Brecha   ──────────────────── ~20,300 votos
```

> **Metodología:** Los porcentajes del API nacional se usan como base (no los regionales, que tienen una discrepancia estructural de ~307K VV). Los votos pendientes se proyectan usando la distribución geográfica **real** de las 196 actas JEE por región.

---

## 📈 Evolución del conteo (56% → 99.8%)

La historia del conteo muestra dos tendencias opuestas muy claras:

| Candidato | Al 56% | Al 99.8% | Variación | Explicación |
|---|:---:|:---:|:---:|---|
| 🔴 Sánchez | 8.26% | 12.01% | **▲ +3.75pp** | Voto rural/sierra llega tarde al conteo |
| 🔵 RLA | 14.26% | 11.91% | **▼ -2.35pp** | Perfil urbano/Lima se agota pronto |
| 🟠 Fujimori | 16.94% | 17.18% | ▲ +0.24pp | Estable, leve alza con costa norte |
| 🟢 Nieto | 12.67% | 10.98% | ▼ -1.69pp | Arequipa y sur moderno se diluyen |
| 🟣 Belmont | 9.90% | 10.15% | ▲ +0.25pp | Estable |

**Punto de cruce RLA ↔ Sánchez:** aproximadamente al **88-90% de actas**, cuando las zonas rurales de Cajamarca, Ayacucho, Cusco y Apurímac completaron su escrutinio.

---

## 🗺️ Análisis geográfico

### Ganadores por departamento

| Candidato | Departamentos ganados | Perfil |
|---|---|---|
| 🟠 **Fujimori** | Amazonas, Áncash, Callao, Huánuco, Ica, Junín, La Libertad, Lambayeque, **Lima**, Loreto, Pasco, Piura, San Martín, Tumbes, Ucayali | Costa y selva norte/central |
| 🔴 **Sánchez** | Apurímac, Ayacucho, Cajamarca, Huancavelica, Puno | Sierra sur y norte |
| 🟢 **Nieto** | Arequipa, Moquegua, Tacna | Sur moderno |
| 🟣 **Belmont** | Cusco | Sierra sur |
| 🔵 **RLA** | Extranjero | Voto emigrante |

### 🔍 Insights clave

- **Lima (~37% del electorado):** RLA 19.9% · Fujimori 17.9% · Nieto 15.1% · **Sánchez solo 3.3%** — Lima salvó a RLA de quedar más atrás a nivel nacional
- **Sierra sur** (Cusco, Puno, Ayacucho, Apurímac, Huancavelica): dominio de Sánchez y Belmont — voto anti-establishment consolidado
- **Arequipa:** Nieto ganó con 18.6% — única fortaleza geográfica relevante del candidato
- **Extranjero** (solo 6% de avance): RLA dominante con 28.95% — peruanos emigrados con perfil conservador/urbano

---

## ⚠️ Discrepancia API nacional vs regionales

Esta es la anomalía más relevante detectada durante el análisis:

```
API Nacional    →  16,718,407 VV
Suma Regionales →  16,415,184 VV
                   ──────────────
Diferencia      →  +303,223 VV  ❗
```

| Candidato | Votos extra en nacional | Ratio |
|---|:---:|:---:|
| 🔵 RLA | **+76,860** | — |
| 🔴 Sánchez | **+8,046** | **0.1 : 1** |

> Los ~303K VV presentes en el endpoint nacional **no aparecen en ninguna región individual**. La distribución no es uniforme: RLA tiene proporcionalmente muchos más votos "sin respaldo regional" que Sánchez. Esta discrepancia es **consistente en cada refresh** y fue verificada en tiempo real por el dashboard.
>
> **Nota:** Esta anomalía no altera el orden de los primeros puestos, pero es un elemento legítimo de auditoría que varias organizaciones independientes (Prime Institute, OpenElection) han documentado.

---

## 📋 Actas JEE — Distribución geográfica

Las **196 actas** aún en poder del JEE se distribuyen así:

| Región | Actas | VV est. | Perfil de voto |
|---|:---:|:---:|---|
| Lima | **142** | ~25,560 | RLA fuerte (19.9%) · Sánchez bajo (3.3%) |
| Piura | 94 | ~16,920 | Fujimori fuerte |
| Cusco | 53 | ~9,540 | Sánchez fuerte (19.4%) |
| San Martín | 39 | ~7,020 | Sánchez fuerte (23.4%) |
| Cajamarca | 36 | ~6,480 | Sánchez muy fuerte (39.1%) |
| Resto | ~50 | ~9,000 | Mixto |

> Lima tiene más actas pero el margen RLA-Sánchez allí es enorme. Cajamarca + Cusco + San Martín compensan con porcentajes de Sánchez muy elevados. **Resultado neto: Sánchez mantiene ~20K votos de ventaja.**

---

## 📊 Encuestadoras vs resultado real

| Fuente | Fujimori | Sánchez | RLA | Nieto | Belmont | 2do lugar |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **ONPE 99.8%** | **17.18%** | **12.01%** | **11.91%** | **10.98%** | **10.15%** | **Sánchez** ✅ |
| Ipsos CR 95.7% | 17.1% | 12.4% | 11.3% | 10.7% | 10.2% | Sánchez ✅ |
| Datum CR 100% | 16.8% | 9.4% | 12.9% | 11.6% | 10.1% | RLA ❌ |

> **Ipsos** estuvo notablemente más cerca del resultado final, especialmente en el 2° lugar. **Datum** divergió significativamente en Sánchez (9.4% vs 12.0% real) — subestimó el voto rural de izquierda por ~2.6pp.

---

## 🚨 Irregularidades documentadas

<details>
<summary><strong>📡 API & Datos (click para expandir)</strong></summary>

| Irregularidad | Status |
|---|:---:|
| Discrepancia ~307K VV nacional vs suma regional, ratio 9:1 hacia Sánchez | 🟡 Pendiente |
| 4,343 mesas contadas en nacional inexistentes en APIs regionales | 🟡 Pendiente |
| Actas serie 900,000 con Z-scores hasta 9.76; JPP concentra 77% de anomalías | 🟡 Pendiente |
| Actas con resultados idénticos en 6+ locales | 🟡 Pendiente |

</details>

<details>
<summary><strong>🚛 Logística (click para expandir)</strong></summary>

| Irregularidad | Status |
|---|:---:|
| Empresa Galaga falló — centros con hasta 5h de retraso, +60K sin votar | 🟡 En investigación |
| Jornada extendida al lunes 13 (precedente inusual) | 🟢 Confirmado |
| Pérdida de actas en SJL y San Borja; cédulas en vía pública en Surquillo | 🟡 En investigación |
| Posible eliminación de material en Callao (investigación Fiscalía) | 🟡 En investigación |

</details>

<details>
<summary><strong>🏛️ Institucional (click para expandir)</strong></summary>

| Hecho | Status |
|---|:---:|
| Renuncia de jefe ONPE Piero Corvetto (cargo irrenunciable en proceso) | 🟢 Confirmado |
| Jefe interino reconoció "error garrafal" ante el Congreso | 🟢 Confirmado |
| Auditoría informática a M&T Internacional — MYPE 2 empleados, inhabilitada OSCE 2016 | 🟡 En investigación |
| Denuncia JNE contra ONPE por violación de derechos al voto | 🟡 Pendiente |

</details>

---

## 💡 Conclusiones

> 1. **Segunda vuelta definida:** Fujimori vs Sánchez — la brecha de ~20K votos con solo ~27K VV pendientes hace el resultado prácticamente irreversible
>
> 2. **Sánchez sorprendió al modelo:** subió 3.75pp durante el conteo — el voto rural de izquierda se consolidó más de lo esperado (solo Ipsos lo capturó)
>
> 3. **RLA perdió en la sierra:** su perfil urbano concentrado en Lima y el exterior no compensó el voto rural que llegó tarde
>
> 4. **La discrepancia API es real y documentada:** no altera el orden de los primeros puestos pero justifica una auditoría técnica independiente
>
> 5. **Proceso con fallos graves de gestión** (logística, custodia, contrataciones) pero sin evidencia concluyente de manipulación masiva del resultado

---

<div align="center">

*Análisis: **Rafael Vasquez** ([@MrSprintALot](https://github.com/MrSprintALot)) · mayo 2026*  
*Fuentes: ONPE · Datum Internacional · Ipsos Perú · Prime Institute · OpenElection · ATuManera/Peru_elecciones2026*

</div>

# Perú Elige 2026 — Setup Guide

## Estructura del proyecto
```
Elecciones_2026/
├── index.html          ← Dashboard principal (tabs, mapa, gráficos)
├── og-preview.png      ← Imagen para preview de LinkedIn/redes
├── data/
│   ├── tracking.json   ← Historial de cortes (backup)
│   └── onpe_live.json  ← Data regional (backup)
└── worker/
    └── worker.js       ← Cloudflare Worker CORS proxy
```

## Paso 1: Deploy en GitHub Pages (ya lo tienes)
1. Sube los archivos al repo `Elecciones_2026`
2. Habilita GitHub Pages en Settings → Pages → main branch

## Paso 2: Deploy del Cloudflare Worker (5 minutos)

### 2a. Crear cuenta Cloudflare (gratis)
1. Ve a https://dash.cloudflare.com/sign-up
2. Crea una cuenta (no necesitas dominio, no piden tarjeta)

### 2b. Crear el Worker
1. En el dashboard: **Workers & Pages** → **Create**
2. Click **Create Worker**
3. Ponle nombre: `onpe-proxy` (la URL será `onpe-proxy.TUSUBDOMINIO.workers.dev`)
4. Click **Deploy** (se crea con código de ejemplo)
5. Click **Edit Code**
6. **Borra todo** el código de ejemplo
7. **Pega** el contenido de `worker/worker.js`
8. Click **Save and Deploy**

### 2c. Verificar que funciona
Visita en tu navegador:
```
https://onpe-proxy.TUSUBDOMINIO.workers.dev/
```
Deberías ver:
```json
{"status":"ok","service":"ONPE CORS Proxy","routes":[...]}
```

Prueba un endpoint:
```
https://onpe-proxy.TUSUBDOMINIO.workers.dev/api/totals?idEleccion=10&tipoFiltro=eleccion
```
Deberías ver los datos de la ONPE con el % de actas.

### 2d. Conectar con tu dashboard
1. Abre `index.html`
2. Busca la línea (cerca de la línea 645):
   ```js
   const WORKER_URL = 'https://onpe-proxy.TUSUBDOMINIO.workers.dev';
   ```
3. Reemplaza `TUSUBDOMINIO` con tu subdominio real de Cloudflare
4. Sube el index.html actualizado a GitHub

## ¡Listo!
Ahora cada vez que alguien abre tu página:
- Carga la data embebida instantáneamente (no hay pantalla en blanco)
- Después de 0.8 segundos, automáticamente consulta la ONPE vía el Worker
- Actualiza el mapa y el gráfico con los datos más recientes
- El botón "Actualizar desde ONPE" también funciona para refrescar manualmente

## Límites del Free Tier
- **100,000 requests/día** — más que suficiente
- **10ms CPU** por request — el proxy es ultra-simple
- **Sin costo** — no piden tarjeta de crédito
- Cache de 1 minuto para no bombardear la ONPE

## Troubleshooting
- **Worker devuelve 502**: La ONPE puede estar caída o saturada
- **Data no actualiza**: Verifica que `WORKER_URL` no tenga `TUSUBDOMINIO` literal
- **CORS error en consola**: El Worker no está desplegado o la URL es incorrecta

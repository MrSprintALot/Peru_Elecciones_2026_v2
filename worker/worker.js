/**
 * ============================================================
 *  ONPE CORS Proxy — Cloudflare Worker
 * ============================================================
 *  Proxy que reenvía requests al API de la ONPE y agrega
 *  headers CORS para permitir consultas desde GitHub Pages.
 *
 *  Deploy: https://dash.cloudflare.com → Workers & Pages → Create
 *  
 *  Endpoints proxeados:
 *    /api/candidates?...   → ONPE eleccion-presidencial/participantes...
 *    /api/totals?...       → ONPE resumen-general/totales
 *    /api/departments      → ONPE ubigeos/departamentos
 *    /api/mesa-totals?...  → ONPE mesa/totales
 *
 *  Uso desde el frontend:
 *    fetch('https://tu-worker.tu-subdomain.workers.dev/api/candidates?idEleccion=10&tipoFiltro=eleccion')
 *
 *  Límites free tier: 100,000 req/día, 10ms CPU/req
 * ============================================================
 */

const ONPE_BASE = 'https://resultadoelectoral.onpe.gob.pe/presentacion-backend';

/* Mapeo de rutas del proxy a rutas de la ONPE */
const ROUTE_MAP = {
  '/api/candidates': '/eleccion-presidencial/participantes-ubicacion-geografica-nombre',
  '/api/totals':     '/resumen-general/totales',
  '/api/departments': '/ubigeos/departamentos',
  '/api/mesa-totals': '/mesa/totales',
  '/api/heatmap':    '/resumen-general/mapa-calor',
};

/* Headers CORS que permiten requests desde cualquier origen */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    /* Preflight OPTIONS */
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    /* Health check */
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'ONPE CORS Proxy',
        routes: Object.keys(ROUTE_MAP),
        timestamp: new Date().toISOString()
      }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    /* Buscar la ruta en el mapeo */
    const route = Object.keys(ROUTE_MAP).find(r => url.pathname.startsWith(r));
    if (!route) {
      return new Response(JSON.stringify({ error: 'Ruta no encontrada', routes: Object.keys(ROUTE_MAP) }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    /* Construir URL de la ONPE */
    const onpeUrl = ONPE_BASE + ROUTE_MAP[route] + url.search;

    try {
      /* Reenviar a la ONPE */
      const onpeResponse = await fetch(onpeUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ONPE-Dashboard-Proxy/1.0'
        }
      });

      /* Crear response con headers CORS */
      const responseBody = await onpeResponse.text();
      return new Response(responseBody, {
        status: onpeResponse.status,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',  /* Cache 1 min */
          'X-ONPE-URL': onpeUrl,
          'X-Proxy-Timestamp': new Date().toISOString()
        }
      });
    } catch (err) {
      return new Response(JSON.stringify({
        error: 'Error conectando con ONPE',
        message: err.message
      }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }
};

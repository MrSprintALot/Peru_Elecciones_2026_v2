/**
 * ONPE Proxy + Aggregator + KV Tracking — Cloudflare Worker v3.1
 * 
 * FIX: Cache only serves when complete (26 regions).
 * /api/snapshot?half=1|2  → Data agregada (split for free tier)
 * /api/tracking           → Full tracking history from KV
 * 
 * KV Binding: TRACKING_KV (namespace: election-tracking)
 */
const ONPE = 'https://resultadoelectoral.onpe.gob.pe/presentacion-backend';
const CORS = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'86400'};
const ROUTES = {'/api/candidates':'/eleccion-presidencial/participantes-ubicacion-geografica-nombre','/api/totals':'/resumen-general/totales'};
const DEPTS = [{u:'010000',n:'Amazonas'},{u:'020000',n:'Áncash'},{u:'030000',n:'Apurímac'},{u:'040000',n:'Arequipa'},{u:'050000',n:'Ayacucho'},{u:'060000',n:'Cajamarca'},{u:'240000',n:'Callao'},{u:'070000',n:'Cusco'},{u:'080000',n:'Huancavelica'},{u:'090000',n:'Huánuco'},{u:'100000',n:'Ica'},{u:'110000',n:'Junín'},{u:'120000',n:'La Libertad'},{u:'130000',n:'Lambayeque'},{u:'140000',n:'Lima'},{u:'150000',n:'Loreto'},{u:'160000',n:'Madre de Dios'},{u:'170000',n:'Moquegua'},{u:'180000',n:'Pasco'},{u:'190000',n:'Piura'},{u:'200000',n:'Puno'},{u:'210000',n:'San Martín'},{u:'220000',n:'Tacna'},{u:'230000',n:'Tumbes'},{u:'250000',n:'Ucayali'}];
const T5 = ['FUJIMORI','LÓPEZ ALIAGA','NIETO','BELMONT','SANCHEZ'];
const K5 = ['fuji','rla','nieto','belm','sanch'];
const HDRS = {'Accept':'application/json, text/plain, */*','Referer':'https://resultadoelectoral.onpe.gob.pe/','Origin':'https://resultadoelectoral.onpe.gob.pe','User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'};

/* Cache: only valid when complete (26 regions) */
let cache = null, cacheTs = 0;
const TTL = 5 * 60 * 1000;
function cacheIsValid() { return cache && cache.regions?.length >= 26 && (Date.now() - cacheTs) < TTL; }

async function oFetch(path) { return (await fetch(ONPE + path, {headers: HDRS})).json(); }
function parseTop5(data) {
  const r = {};
  (data||[]).filter(c => c.porcentajeVotosValidos).forEach(c => {
    T5.forEach((name, i) => { if (c.nombreCandidato?.includes(name)) r[K5[i]] = c.porcentajeVotosValidos; });
  });
  return r;
}

async function buildHalf(depts) {
  return await Promise.all(depts.map(async d => {
    const [cr, tr] = await Promise.all([
      oFetch('/eleccion-presidencial/participantes-ubicacion-geografica-nombre?tipoFiltro=ubigeo_nivel_01&idAmbitoGeografico=1&ubigeoNivel1='+d.u+'&idEleccion=10'),
      oFetch('/resumen-general/totales?idAmbitoGeografico=1&idEleccion=10&tipoFiltro=ubigeo_nivel_01&idUbigeoDepartamento='+d.u)
    ]);
    const c = parseTop5(cr.data);
    return {name:d.n,pct:tr.data.actasContabilizadas,vv:tr.data.totalVotosValidos,fuji:c.fuji||0,rla:c.rla||0,nieto:c.nieto||0,belm:c.belm||0,sanch:c.sanch||0};
  }));
}

/* ═══ KV TRACKING ═══ */
async function saveTrackingCut(env, national) {
  if (!env.TRACKING_KV) return;
  try {
    const cut = {
      ts: new Date().toISOString(), pct: national.pct,
      fujimori: national.candidates.fuji||0, rla: national.candidates.rla||0,
      nieto: national.candidates.nieto||0, belmont: national.candidates.belm||0,
      sanchez: national.candidates.sanch||0,
      jee: national.enviadasJee||0, contabilizadas: national.contabilizadas||0
    };
    let cuts = [];
    try { const raw = await env.TRACKING_KV.get('tracking_cuts', 'json'); if (Array.isArray(raw)) cuts = raw; } catch(e) {}
    const last = cuts[cuts.length - 1];
    if (!last || Math.abs(cut.pct - last.pct) > 0.3) {
      cuts.push(cut);
      if (cuts.length > 200) cuts = cuts.slice(-200);
      await env.TRACKING_KV.put('tracking_cuts', JSON.stringify(cuts));
    }
  } catch(e) { console.error('KV write error:', e); }
}

function jsonResp(data, extra = {}) {
  return new Response(JSON.stringify(data), {headers:{...CORS,'Content-Type':'application/json',...extra}});
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, {headers: CORS});

    if (url.pathname === '/' || url.pathname === '/health') {
      return jsonResp({status:'ok', service:'ONPE Aggregator v3.1 + KV', kvBound:!!env.TRACKING_KV,
        cacheComplete: cacheIsValid(), cacheRegions: cache?.regions?.length||0,
        cacheAge: cache ? Math.round((Date.now()-cacheTs)/1000)+'s' : 'empty'});
    }

    /* ═══ TRACKING HISTORY ═══ */
    if (url.pathname === '/api/tracking') {
      let cuts = [];
      if (env.TRACKING_KV) {
        try { const raw = await env.TRACKING_KV.get('tracking_cuts','json'); if (Array.isArray(raw)) cuts = raw; } catch(e) {}
      }
      return jsonResp({cuts, count:cuts.length}, {'Cache-Control':'public, max-age=60'});
    }

    /* ═══ SNAPSHOT ═══ */
    if (url.pathname === '/api/snapshot') {
      const half = url.searchParams.get('half') || '1';

      /* Only serve from cache if it's COMPLETE (26 regions) */
      if (cacheIsValid()) {
        const result = half === '2'
          ? {regions: cache.regions.slice(13)}
          : {national: cache.national, regions: cache.regions.slice(0,13), timestamp: cache.timestamp};
        return jsonResp(result, {'X-Cache':'HIT','X-Cache-Age':Math.round((Date.now()-cacheTs)/1000)+'s','Cache-Control':'public, max-age=120'});
      }

      try {
        if (half === '1') {
          /* Half 1: national (2) + 13 depts (26) = 28 subrequests */
          const [natT, natC] = await Promise.all([
            oFetch('/resumen-general/totales?idEleccion=10&tipoFiltro=eleccion'),
            oFetch('/eleccion-presidencial/participantes-ubicacion-geografica-nombre?idEleccion=10&tipoFiltro=eleccion')
          ]);
          const national = {
            pct:natT.data.actasContabilizadas, totalActas:natT.data.totalActas,
            contabilizadas:natT.data.contabilizadas, enviadasJee:natT.data.enviadasJee,
            pendientesJee:natT.data.pendientesJee, votosEmitidos:natT.data.totalVotosEmitidos,
            votosValidos:natT.data.totalVotosValidos, candidates:parseTop5(natC.data)
          };
          const regions1 = await buildHalf(DEPTS.slice(0,13));

          /* Save tracking to KV (non-blocking) */
          ctx.waitUntil(saveTrackingCut(env, national));

          /* Store half1 data temporarily (cache NOT valid yet — incomplete) */
          cache = {national, regions: regions1, timestamp: new Date().toISOString()};
          /* DO NOT set cacheTs — cache is incomplete, cacheIsValid() stays false */

          return jsonResp({national, regions:regions1, timestamp:cache.timestamp}, {'X-Cache':'MISS','Cache-Control':'public, max-age=120'});

        } else {
          /* Half 2: 12 depts (24) + extranjero (2) = 26 subrequests */
          const regions2 = await buildHalf(DEPTS.slice(13));
          const [exC, exT] = await Promise.all([
            oFetch('/eleccion-presidencial/participantes-ubicacion-geografica-nombre?tipoFiltro=ambito_geografico&idAmbitoGeografico=2&idEleccion=10'),
            oFetch('/resumen-general/totales?idAmbitoGeografico=2&idEleccion=10&tipoFiltro=ambito_geografico')
          ]);
          const ec = parseTop5(exC.data);
          regions2.push({name:'Extranjero',pct:exT.data.actasContabilizadas,vv:exT.data.totalVotosValidos,fuji:ec.fuji||0,rla:ec.rla||0,nieto:ec.nieto||0,belm:ec.belm||0,sanch:ec.sanch||0});

          /* Complete the cache: merge half1 regions + half2 regions */
          if (cache && cache.regions) {
            cache.regions = [...cache.regions.slice(0,13), ...regions2];
            cacheTs = Date.now(); /* NOW cache is complete — cacheIsValid() returns true */
          }

          return jsonResp({regions:regions2, half:2}, {'X-Cache':'MISS','Cache-Control':'public, max-age=120'});
        }
      } catch (err) {
        /* Serve stale cache if available and complete */
        if (cache?.regions?.length >= 26) {
          const result = half === '2' ? {regions:cache.regions.slice(13)} : {national:cache.national,regions:cache.regions.slice(0,13),timestamp:cache.timestamp};
          return jsonResp(result, {'X-Cache':'STALE','X-Error':err.message});
        }
        return new Response(JSON.stringify({error:err.message}),{status:502,headers:{...CORS,'Content-Type':'application/json'}});
      }
    }

    /* ═══ Direct proxy ═══ */
    const route = Object.keys(ROUTES).find(r => url.pathname.startsWith(r));
    if (!route) return new Response(JSON.stringify({error:'Not found'}),{status:404,headers:{...CORS,'Content-Type':'application/json'}});
    try {
      const r = await fetch(ONPE + ROUTES[route] + url.search, {headers: HDRS});
      return new Response(await r.text(), {status:r.status,headers:{...CORS,'Content-Type':'application/json','Cache-Control':'public, max-age=60'}});
    } catch (err) {
      return new Response(JSON.stringify({error:err.message}),{status:502,headers:{...CORS,'Content-Type':'application/json'}});
    }
  }
};

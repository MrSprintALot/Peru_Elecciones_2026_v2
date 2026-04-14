/**
 * ONPE Proxy + Aggregator — Cloudflare Worker (Free Tier Compatible)
 * 
 * /api/snapshot  → Data completa en 2 llamadas internas (respeta límite 50 subrequests)
 * /api/totals, /api/candidates → Proxy directo
 * 
 * Cache: 2 minutos. Si ONPE está lenta, sirve cache viejo.
 */
const ONPE = 'https://resultadoelectoral.onpe.gob.pe/presentacion-backend';
const CORS = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'86400'};
const ROUTES = {'/api/candidates':'/eleccion-presidencial/participantes-ubicacion-geografica-nombre','/api/totals':'/resumen-general/totales'};
const DEPTS = [{u:'010000',n:'Amazonas'},{u:'020000',n:'Áncash'},{u:'030000',n:'Apurímac'},{u:'040000',n:'Arequipa'},{u:'050000',n:'Ayacucho'},{u:'060000',n:'Cajamarca'},{u:'240000',n:'Callao'},{u:'070000',n:'Cusco'},{u:'080000',n:'Huancavelica'},{u:'090000',n:'Huánuco'},{u:'100000',n:'Ica'},{u:'110000',n:'Junín'},{u:'120000',n:'La Libertad'},{u:'130000',n:'Lambayeque'},{u:'140000',n:'Lima'},{u:'150000',n:'Loreto'},{u:'160000',n:'Madre de Dios'},{u:'170000',n:'Moquegua'},{u:'180000',n:'Pasco'},{u:'190000',n:'Piura'},{u:'200000',n:'Puno'},{u:'210000',n:'San Martín'},{u:'220000',n:'Tacna'},{u:'230000',n:'Tumbes'},{u:'250000',n:'Ucayali'}];
const T5 = ['FUJIMORI','LÓPEZ ALIAGA','NIETO','BELMONT','SANCHEZ'];
const K5 = ['fuji','rla','nieto','belm','sanch'];
const HDRS = {'Accept':'application/json, text/plain, */*','Referer':'https://resultadoelectoral.onpe.gob.pe/','Origin':'https://resultadoelectoral.onpe.gob.pe','User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'};

let cache = null, cacheTs = 0;
const TTL = 2 * 60 * 1000;

async function oFetch(path) { return (await fetch(ONPE + path, {headers: HDRS})).json(); }
function parseTop5(data) {
  const r = {};
  (data||[]).filter(c => c.porcentajeVotosValidos).forEach(c => {
    T5.forEach((name, i) => { if (c.nombreCandidato?.includes(name)) r[K5[i]] = c.porcentajeVotosValidos; });
  });
  return r;
}

/* Build snapshot in 2 halves to stay under 50 subrequest limit */
async function buildHalf(depts) {
  const regions = [];
  /* Process ALL departments in parallel (max 2 calls each) */
  const results = await Promise.all(depts.map(async d => {
    const [cr, tr] = await Promise.all([
      oFetch('/eleccion-presidencial/participantes-ubicacion-geografica-nombre?tipoFiltro=ubigeo_nivel_01&idAmbitoGeografico=1&ubigeoNivel1='+d.u+'&idEleccion=10'),
      oFetch('/resumen-general/totales?idAmbitoGeografico=1&idEleccion=10&tipoFiltro=ubigeo_nivel_01&idUbigeoDepartamento='+d.u)
    ]);
    const c = parseTop5(cr.data);
    return {name:d.n,pct:tr.data.actasContabilizadas,vv:tr.data.totalVotosValidos,fuji:c.fuji||0,rla:c.rla||0,nieto:c.nieto||0,belm:c.belm||0,sanch:c.sanch||0};
  }));
  return results;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, {headers: CORS});

    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({status:'ok',service:'ONPE Aggregator v2',cacheAge:cache?Math.round((Date.now()-cacheTs)/1000)+'s':'empty'}),{headers:{...CORS,'Content-Type':'application/json'}});
    }

    /* ═══ SNAPSHOT (split into halves for free tier) ═══ */
    if (url.pathname === '/api/snapshot') {
      const half = url.searchParams.get('half') || '1';
      const age = Date.now() - cacheTs;

      /* Serve from full cache if fresh */
      if (cache && age < TTL) {
        const result = half === '2' ? {regions: cache.regions.slice(13)} : {national: cache.national, regions: cache.regions.slice(0, 13), timestamp: cache.timestamp};
        return new Response(JSON.stringify(result), {headers:{...CORS,'Content-Type':'application/json','X-Cache':'HIT','X-Cache-Age':Math.round(age/1000)+'s'}});
      }

      try {
        if (half === '1') {
          /* Half 1: national (2 calls) + first 13 depts (26 calls) = 28 subrequests */
          const [natT, natC] = await Promise.all([
            oFetch('/resumen-general/totales?idEleccion=10&tipoFiltro=eleccion'),
            oFetch('/eleccion-presidencial/participantes-ubicacion-geografica-nombre?idEleccion=10&tipoFiltro=eleccion')
          ]);
          const national = {
            pct: natT.data.actasContabilizadas, totalActas: natT.data.totalActas,
            contabilizadas: natT.data.contabilizadas, enviadasJee: natT.data.enviadasJee,
            pendientesJee: natT.data.pendientesJee, votosEmitidos: natT.data.totalVotosEmitidos,
            votosValidos: natT.data.totalVotosValidos, candidates: parseTop5(natC.data)
          };
          const regions1 = await buildHalf(DEPTS.slice(0, 13));
          return new Response(JSON.stringify({national, regions: regions1, timestamp: new Date().toISOString(), half: 1}),
            {headers:{...CORS,'Content-Type':'application/json','X-Cache':'MISS'}});

        } else {
          /* Half 2: remaining 12 depts (24 calls) + extranjero (2 calls) = 26 subrequests */
          const regions2 = await buildHalf(DEPTS.slice(13));
          const [exC, exT] = await Promise.all([
            oFetch('/eleccion-presidencial/participantes-ubicacion-geografica-nombre?tipoFiltro=ambito_geografico&idAmbitoGeografico=2&idEleccion=10'),
            oFetch('/resumen-general/totales?idAmbitoGeografico=2&idEleccion=10&tipoFiltro=ambito_geografico')
          ]);
          const ec = parseTop5(exC.data);
          regions2.push({name:'Extranjero',pct:exT.data.actasContabilizadas,vv:exT.data.totalVotosValidos,fuji:ec.fuji||0,rla:ec.rla||0,nieto:ec.nieto||0,belm:ec.belm||0,sanch:ec.sanch||0});

          return new Response(JSON.stringify({regions: regions2, half: 2}),
            {headers:{...CORS,'Content-Type':'application/json','X-Cache':'MISS'}});
        }
      } catch (err) {
        if (cache) {
          const result = half === '2' ? {regions: cache.regions.slice(13)} : {national: cache.national, regions: cache.regions.slice(0, 13), timestamp: cache.timestamp};
          return new Response(JSON.stringify(result), {headers:{...CORS,'Content-Type':'application/json','X-Cache':'STALE','X-Error':err.message}});
        }
        return new Response(JSON.stringify({error:err.message}),{status:502,headers:{...CORS,'Content-Type':'application/json'}});
      }
    }

    /* ═══ FULL SNAPSHOT (for caching after both halves are fetched) ═══ */
    if (url.pathname === '/api/cache-update') {
      try {
        const body = await request.json();
        if (body.national && body.regions) {
          cache = body; cacheTs = Date.now();
          return new Response(JSON.stringify({ok:true}),{headers:{...CORS,'Content-Type':'application/json'}});
        }
      } catch(e) {}
      return new Response(JSON.stringify({error:'Invalid body'}),{status:400,headers:{...CORS,'Content-Type':'application/json'}});
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

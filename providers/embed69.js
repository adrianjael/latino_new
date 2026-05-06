/**
 * embed69 - Plugin Nuvio (Versión DEBUG + CLON SEGURO)
 * v1.1.4 - Con Logs detallados para detectar fallos de red.
 */
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try { step(generator.next(value)); } catch (e) { reject(e); }
    };
    var rejected = (value) => {
      try { step(generator.throw(value)); } catch (e) { reject(e); }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// --- UTILS ---
var require_unpacker = __commonJS({
  "src/shared/utils/unpacker.js"(exports2, module2) {
    function unpack(code) {
      try {
        const match = code.match(/eval\(function\(p,a,c,k,e,[rd]\)\{.*?\}\s*\('([\s\S]*?)',\s*(\d+),\s*(\d+),\s*'([\s\S]*?)'\.split\('\|'\)/);
        if (!match) return code;
        let [, p, a, c, k] = match;
        a = parseInt(a); c = parseInt(c);
        let kArr = k.split("|");
        return p.replace(/\b\w+\b/g, (e) => kArr[parseInt(e, a)] || e);
      } catch (e) { return code; }
    }
    module2.exports = { unpack };
  }
});

var require_tmdb = __commonJS({
  "src/shared/utils/tmdb.js"(exports2, module2) {
    const CACHE = {};
    module2.exports = {
      getImdbId: (tmdbId, mediaType) => __async(this, null, function* () {
        const key = `${mediaType}_${tmdbId}`;
        if (CACHE[key]) return CACHE[key];
        try {
          const type = String(mediaType).includes("movie") ? "movie" : "tv";
          console.log(`[TMDB] Consultando external_ids para: ${tmdbId}`);
          const res = yield fetch(`https://api.themoviedb.org/3/${type}/${tmdbId}/external_ids?api_key=439c478a771f35c05022f9feabcca01c`);
          if (!res.ok) { console.error(`[TMDB] Error HTTP: ${res.status}`); return null; }
          const data = yield res.json();
          if (data.imdb_id) CACHE[key] = data.imdb_id;
          console.log(`[TMDB] IMDb ID encontrado: ${data.imdb_id}`);
          return data.imdb_id || null;
        } catch (e) { console.error(`[TMDB] Error Fatal: ${e.message}`); return null; }
      })
    };
  }
});

// --- RESOLVERS ---
var require_resolvers = __commonJS({
  "src/shared/resolvers/index.js"(exports2, module2) {
    const { unpack } = require_unpacker();
    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    
    const registry = {
      vidhide: function*(url) {
          console.log(`[VidHide] Iniciando: ${url}`);
          const res = yield fetch(url, { headers: { "User-Agent": UA, "Referer": "https://embed69.org/" } });
          let html = yield res.text();
          if (html.includes("window.location.href")) {
              const m = html.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/i);
              if (m) return yield* registry.vidhide(m[1]);
          }
          const evals = html.match(/eval\(function\(p,a,c,k,e,[rd]\)[\s\S]*?\.split\('\|'\)[^\)]*\)\)/g);
          if (evals) evals.forEach(m => html += "\n" + unpack(m));
          const file = html.match(/(?:file|source|src|hls)\s*[:=]\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
          if (file) console.log(`[VidHide] Éxito: Enlace encontrado.`);
          return file ? { url: file[1], quality: "1080p" } : null;
      },
      streamwish: function*(url) {
          console.log(`[Streamwish] Iniciando: ${url}`);
          const h = yield (yield fetch(url, { headers: { "User-Agent": UA, "Referer": "https://embed69.org/" } })).text();
          const evalMatch = h.match(/eval\(function\(p,a,c,k,e,[rd]\)[\s\S]*?\.split\('\|'\)[^\)]*\)\)/);
          let c = h + (evalMatch ? "\n" + unpack(evalMatch[0]) : "");
          const file = c.match(/(?:file|source|src|hls)\s*[:=]\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
          if (file) console.log(`[Streamwish] Éxito: Enlace encontrado.`);
          return file ? { url: file[1], quality: "Auto" } : null;
      },
      voe: function*(url) {
          console.log(`[VOE] Iniciando: ${url}`);
          const h = yield (yield fetch(url, { headers: { "User-Agent": UA, "Referer": url } })).text();
          const json = h.match(/<script type="application\/json">([\s\S]*?)<\/script>/);
          if (json) {
              let d = JSON.parse(json[1]).replace(/[a-zA-Z]/g, c => String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() <= 'm' ? 13 : -13)));
              ["@$", "^^", "~@", "%?", "*~", "!!", "#&"].forEach(n => d = d.split(n).join(""));
              const s1 = atob(d);
              let s2 = ""; for(let i=0; i<s1.length; i++) s2 += String.fromCharCode(s1.charCodeAt(i)-3);
              const res = JSON.parse(atob(s2.split("").reverse().join("")));
              if (res.source) {
                  console.log(`[VOE] Éxito: Enlace encontrado.`);
                  return { url: res.source, quality: "1080p" };
              }
          }
          return null;
      },
      filemoon: function*(url) {
          try {
              console.log(`[Filemoon] Iniciando Bypass Nativo: ${url}`);
              const videoId = url.split("/").pop();
              const domain = new URL(url).origin;
              const details = yield (yield fetch(`${domain}/api/videos/${videoId}/embed/details`, { headers: { "User-Agent": UA } })).json();
              const pbDomain = new URL(details.embed_frame_url).origin;
              const challenge = yield (yield fetch(`${pbDomain}/api/videos/access/challenge`, { method: 'POST', headers: { "Referer": details.embed_frame_url, "Origin": pbDomain, "User-Agent": UA } })).json();
              const sig = typeof __crypto_ecdsa_sign_secp256r1 === "function" ? __crypto_ecdsa_sign_secp256r1(challenge.nonce) : "{}";
              const attestJson = JSON.parse(sig);
              if (!attestJson.signature) { console.error("[Filemoon] Fallo firma ECDSA"); return null; }
              const vId = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => (Math.random()*16|0).toString(16));
              const attest = yield (yield fetch(`${pbDomain}/api/videos/access/attest`, {
                  method: 'POST', headers: { "Content-Type": "application/json", "Referer": details.embed_frame_url, "Origin": pbDomain, "User-Agent": UA },
                  body: JSON.stringify({
                      viewer_id: vId, device_id: vId, challenge_id: challenge.challenge_id, nonce: challenge.nonce,
                      signature: attestJson.signature, public_key: { crv: "P-256", ext: true, key_ops: ["verify"], kty: "EC", x: attestJson.x, y: attestJson.y },
                      client: { user_agent: UA, platform: "Windows", platform_version: "10.0.0" },
                      storage: { cookie: vId, local_storage: vId }, attributes: { entropy: "high" }
                  })
              })).json();
              const pbRes = yield (yield fetch(`${pbDomain}/api/videos/${videoId}/embed/playback`, {
                  method: 'POST', headers: { "Content-Type": "application/json", "Referer": details.embed_frame_url, "Origin": pbDomain, "User-Agent": UA },
                  body: JSON.stringify({ fingerprint: { token: attest.token, viewer_id: vId, device_id: vId, confidence: attest.confidence } })
              })).json();
              const dec = typeof __crypto_aes_gcm_decrypt === "function" ? __crypto_aes_gcm_decrypt(JSON.stringify(pbRes.playback.key_parts), pbRes.playback.iv, pbRes.playback.payload) : "";
              if (!dec) return null;
              const final = JSON.parse(dec);
              console.log(`[Filemoon] Éxito: Enlace encontrado.`);
              return { url: final.sources[0].url, quality: final.sources[0].label || "1080p", headers: { "User-Agent": UA, "Referer": domain + "/", "Origin": domain } };
          } catch (e) { console.error(`[Filemoon] Error Bypass: ${e.message}`); return null; }
      }
    };

    module2.exports = {
      resolve: (name, url) => __async(this, null, function* () {
        const srv = name.toLowerCase().trim();
        if (registry[srv]) return yield* registry[srv](url);
        return null;
      })
    };
  }
});

// --- MAIN ---
var tmdb = require_tmdb();
var resolvers = require_resolvers();

function decodeJwt(token) {
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const pad = base64.length % 4;
        const padded = pad ? base64 + "====".substring(pad) : base64;
        return JSON.parse(atob(padded));
    } catch(e) { return null; }
}

module.exports = {
  getStreams: (id, type, s, e) => __async(null, null, function* () {
    try {
      console.log(`[Latino TV] Iniciando búsqueda: ${id} [${type}]`);
      let imdbId = id.startsWith("tt") ? id : yield tmdb.getImdbId(id, type);
      if (!imdbId) { console.error("[Latino TV] No se pudo obtener IMDb ID."); return []; }
      
      const urlId = (type === "tv" && s) ? `${imdbId}-${s}x${String(e).padStart(2, "0")}` : imdbId;
      const targetUrl = `https://embed69.org/f/${urlId}`;
      console.log(`[Latino TV] Entrando a: ${targetUrl}`);
      
      const res = yield fetch(targetUrl, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" } });
      if (!res.ok) { console.error(`[Latino TV] Error al entrar a Embed69: ${res.status}`); return []; }
      const html = yield res.text();
      
      const match = html.match(/dataLink\s*=\s*([\[\{][\s\S]*?[\]\}]);/);
      if (!match) { console.error("[Latino TV] No se encontró dataLink en el HTML."); return []; }
      
      let data = JSON.parse(match[1]);
      if (!Array.isArray(data)) data = Object.keys(data).map(k => ({ video_language: k, sortedEmbeds: data[k] }));
      
      const lat = data.find(i => i.video_language === "LAT");
      if (!lat) { console.error("[Latino TV] No se encontraron servidores en LATINO."); return []; }
      
      const embeds = lat.sortedEmbeds.filter(e => e.link && e.servername !== "download");
      console.log(`[Latino TV] Procesando ${embeds.length} servidores en paralelo...`);
      
      const results = yield Promise.allSettled(embeds.map(e => __async(this, null, function* () {
          try {
              const payload = decodeJwt(e.link);
              if (!payload) { console.error(`[Latino TV] Error decodificando JWT para ${e.servername}`); return null; }
              const resResolved = yield resolvers.resolve(e.servername, payload.link);
              if (!resResolved) return null;
              return { 
                  name: `Embed69 - ${e.servername}`, 
                  language: "Latino", 
                  quality: resResolved.quality || "HD", 
                  url: resResolved.url, 
                  headers: resResolved.headers 
              };
          } catch(err) { return null; }
      })));
      
      const finalStreams = results.filter(r => r.status === "fulfilled" && r.value).map(r => r.value);
      console.log(`[Latino TV] Finalizado: ${finalStreams.length} resultados encontrados.`);
      return finalStreams;
    } catch (e) { console.error(`[Latino TV] Error Global: ${e.message}`); return []; }
  })
};

/**
 * embed69 - Plugin Nuvio (Versión Optimizada Final)
 * Estabilidad 100% | Filemoon Nativo | Velocidad Turbo
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
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/embed69/http.js
var require_http = __commonJS({
  "src/embed69/http.js"(exports2, module2) {
    var http = {
      get(url, headers = {}) {
        return __async(this, null, function* () {
          try {
            const response = yield fetch(url, {
              headers: __spreadValues({
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
              }, headers)
            });
            return yield response.text();
          } catch (error) {
            console.error(`[HTTP GET Error] ${url}:`, error.message);
            throw error;
          }
        });
      }
    };
    module2.exports = http;
  }
});

// src/shared/utils/unpacker.js
var require_unpacker = __commonJS({
  "src/shared/utils/unpacker.js"(exports2, module2) {
    function unpack(code) {
      try {
        const match = code.match(/eval\(function\(p,a,c,k,e,[rd]\)\{.*?\}\s*\('([\s\S]*?)',\s*(\d+),\s*(\d+),\s*'([\s\S]*?)'\.split\('\|'\)/);
        if (!match) return code;
        let [, p, a, c, k] = match;
        a = parseInt(a); c = parseInt(c);
        let kArr = k.split("|");
        const result = p.replace(/\b\w+\b/g, (e) => {
          const index = parseInt(e, 36);
          let word = kArr[index];
          if (!word) {
            const altIndex = parseInt(e, a);
            word = kArr[altIndex];
          }
          return word || e;
        });
        return result;
      } catch (e) { return code; }
    }
    module2.exports = { unpack };
  }
});

// src/shared/resolvers/vidhide.js
var require_vidhide = __commonJS({
  "src/shared/resolvers/vidhide.js"(exports2, module2) {
    var { unpack } = require_unpacker();
    var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    function resolveVidhide(url) {
      return __async(this, null, function* () {
        try {
          const origin = new URL(url).origin;
          const response = yield fetch(url, { headers: { "User-Agent": USER_AGENT, "Referer": "https://embed69.org/" } });
          if (!response.ok) return null;
          let html = yield response.text();
          const evalMatches = html.match(/eval\(function\(p,a,c,k,e,[rd]\)[\s\S]*?\.split\('\|'\)[^\)]*\)\)/g);
          let content = html;
          if (evalMatches) evalMatches.forEach(m => { try { content += "\n" + unpack(m); } catch(e){} });
          const fileMatch = content.match(/(?:file|source|src|hls)\s*[:=]\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
          if (fileMatch) return { url: fileMatch[1], quality: "1080p", headers: { "User-Agent": USER_AGENT, "Referer": origin + "/" } };
          return null;
        } catch (e) { return null; }
      });
    }
    module2.exports = resolveVidhide;
  }
});

// src/shared/resolvers/streamwish.js
var require_streamwish = __commonJS({
  "src/shared/resolvers/streamwish.js"(exports2, module2) {
    var { unpack } = require_unpacker();
    var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    function resolveStreamwish(url) {
      return __async(this, null, function* () {
        try {
          const domains = ["vibuxer.com", "awish.pro"];
          const fetchWithTimeout = (targetUrl) => fetch(targetUrl, { 
              headers: { "User-Agent": USER_AGENT, "Referer": "https://embed69.org/" } 
          }).then(r => r.ok ? r.text() : null).catch(() => null);

          // Probamos el original y el primer espejo en paralelo
          const results = yield Promise.all([
              fetchWithTimeout(url),
              fetchWithTimeout(url.replace(/[^/]+\.(?:com|to|pro|net|org)/, domains[0]))
          ]);

          const html = results.find(h => h && (h.includes(".m3u8") || h.includes("eval")));
          if (!html) return null;

          const evalMatch = html.match(/eval\(function\(p,a,c,k,e,[rd]\)[\s\S]*?\.split\('\|'\)[^\)]*\)\)/);
          let content = html;
          if (evalMatch) try { content += "\n" + unpack(evalMatch[0]); } catch(e){}
          const fileMatch = content.match(/(?:file|source|src|hls)\s*[:=]\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
          if (fileMatch) return { url: fileMatch[1], quality: "Auto", headers: { "User-Agent": USER_AGENT } };
          return null;
        } catch (e) { return null; }
      });
    }
    module2.exports = resolveStreamwish;
  }
});

// src/shared/resolvers/voe.js
var require_voe = __commonJS({
  "src/shared/resolvers/voe.js"(exports2, module2) {
    var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    function resolveVoe(url) {
      return __async(this, null, function* () {
        try {
          const response = yield fetch(url, { headers: { "User-Agent": USER_AGENT, "Referer": url } });
          const html = yield response.text();
          const m3u8Match = html.match(/["'](https?:\/\/[^"']+?\.m3u8[^"']*?)["']/i);
          if (m3u8Match) return { url: m3u8Match[1], quality: "Auto", headers: { "Referer": url, "User-Agent": USER_AGENT } };
          return null;
        } catch (e) { return null; }
      });
    }
    module2.exports = resolveVoe;
  }
});

// src/shared/resolvers/filemoon.js (Nuvio Native Integration)
var require_filemoon = __commonJS({
  "src/shared/resolvers/filemoon.js"(exports2, module2) {
    var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    function resolveFilemoon(url) {
      return __async(this, null, function* () {
        try {
          console.log(`[Resolvers] Filemoon (Nuvio-Native): ${url}`);
          const match = url.match(/\/(e|d)\/([a-zA-Z0-9]+)/);
          if (!match) return null;
          const videoId = match[2];
          const currentDomain = new URL(url).origin;

          // 1. Details
          const detailsUrl = `${currentDomain}/api/videos/${videoId}/embed/details`;
          let res = yield fetch(detailsUrl, { headers: { "User-Agent": USER_AGENT } });
          if (!res.ok) return null;
          let data = yield res.json();
          const playbackDomain = new URL(data.embed_frame_url).origin;

          // 2. Challenge
          res = yield fetch(`${playbackDomain}/api/videos/access/challenge`, {
              method: 'POST',
              headers: { "Referer": data.embed_frame_url, "Origin": playbackDomain, "User-Agent": USER_AGENT }
          });
          const challenge = yield res.json();
          
          // 3. Attestation (Native Call)
          const resultStr = typeof __crypto_ecdsa_sign_secp256r1 === "function" 
              ? __crypto_ecdsa_sign_secp256r1(challenge.nonce) : "{}";
          const attestJson = JSON.parse(resultStr);
          if (!attestJson.signature) return null;

          const uuidv4 = () => 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => (Math.random()*16|0).toString(16));
          const vId = uuidv4();

          const attestRes = yield (yield fetch(`${playbackDomain}/api/videos/access/attest`, {
              method: 'POST',
              headers: { "Content-Type": "application/json", "Referer": data.embed_frame_url, "Origin": playbackDomain, "User-Agent": USER_AGENT },
              body: JSON.stringify({
                  viewer_id: vId, device_id: vId, challenge_id: challenge.challenge_id,
                  nonce: challenge.nonce, signature: attestJson.signature,
                  public_key: { crv: "P-256", ext: true, key_ops: ["verify"], kty: "EC", x: attestJson.x, y: attestJson.y },
                  client: { user_agent: USER_AGENT, platform: "Windows", platform_version: "10.0.0" },
                  storage: { cookie: vId, local_storage: vId }, attributes: { entropy: "high" }
              })
          })).json();

          // 4. Playback
          res = yield fetch(`${playbackDomain}/api/videos/${videoId}/embed/playback`, {
              method: 'POST',
              headers: { "Content-Type": "application/json", "Referer": data.embed_frame_url, "Origin": playbackDomain, "User-Agent": USER_AGENT },
              body: JSON.stringify({ fingerprint: { token: attestRes.token, viewer_id: vId, device_id: vId, confidence: attestRes.confidence } })
          });
          const pb = (yield res.json()).playback;
          
          // 5. Decrypt (Native Call)
          let decryptedStr = typeof __crypto_aes_gcm_decrypt === "function" 
              ? __crypto_aes_gcm_decrypt(JSON.stringify(pb.key_parts), pb.iv, pb.payload) : "";
          
          if (!decryptedStr) return null;
          const finalData = JSON.parse(decryptedStr);
          return {
              url: finalData.sources[0].url,
              quality: finalData.sources[0].label || "1080p",
              headers: { "User-Agent": USER_AGENT, "Referer": currentDomain + "/", "Origin": currentDomain }
          };
        } catch (e) { return null; }
      });
    }
    module2.exports = resolveFilemoon;
  }
});

// src/shared/resolvers/index.js
var require_resolvers = __commonJS({
  "src/shared/resolvers/index.js"(exports2, module2) {
    const registry = {
      vidhide: require_vidhide(),
      streamwish: require_streamwish(),
      filemoon: require_filemoon(),
      voe: require_voe()
    };
    function resolve(servername, url) {
      return __async(this, null, function* () {
        const name = servername.toLowerCase().trim();
        if (registry[name]) {
          console.log(`[Resolvers] Iniciando: ${name}`);
          return yield registry[name](url);
        }
        return null;
      });
    }
    module2.exports = { resolve };
  }
});

// src/shared/utils/tmdb.js
var require_tmdb = __commonJS({
  "src/shared/utils/tmdb.js"(exports2, module2) {
    const ID_CACHE = {};
    function getImdbId(tmdbId, mediaType) {
      return __async(this, null, function* () {
        const key = `${mediaType}_${tmdbId}`;
        if (ID_CACHE[key]) return ID_CACHE[key];
        try {
          const type = String(mediaType).includes("movie") ? "movie" : "tv";
          const res = yield fetch(`https://api.themoviedb.org/3/${type}/${tmdbId}/external_ids?api_key=439c478a771f35c05022f9feabcca01c`);
          const data = yield res.json();
          const imdbId = data.imdb_id || null;
          if (imdbId) ID_CACHE[key] = imdbId;
          return imdbId;
        } catch (e) { return null; }
      });
    }
    module2.exports = { getImdbId };
  }
});

// src/embed69/extractor.js
var require_extractor = __commonJS({
  "src/embed69/extractor.js"(exports2, module2) {
    var http = require_http();
    var resolvers = require_resolvers();
    var tmdb = require_tmdb();
    function decodeJwt(token) {
        try { return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); } catch(e) { return null; }
    }
    module2.exports = {
      getLinks(id, type, season, episode) {
        return __async(this, null, function* () {
          try {
            let imdbId = id.startsWith("tt") ? id : yield tmdb.getImdbId(id, type);
            if (!imdbId) return [];
            const urlId = (type === "tv" && season) ? `${imdbId}-${season}x${String(episode).padStart(2, "0")}` : imdbId;
            const html = yield http.get(`https://embed69.org/f/${urlId}`);
            const match = html.match(/dataLink\s*=\s*([\[\{][\s\S]*?[\]\}]);/);
            if (!match) return [];
            let data = JSON.parse(match[1]);
            if (!Array.isArray(data)) data = Object.keys(data).map(k => ({ video_language: k, sortedEmbeds: data[k] }));
            const lat = data.find(i => i.video_language === "LAT");
            if (!lat) return [];
            const embeds = lat.sortedEmbeds.filter(e => e.link && e.servername !== "download");
            
            console.log(`[Embed69] Procesando ${embeds.length} servidores...`);
            const results = yield Promise.allSettled(embeds.map(e => __async(this, null, function* () {
              const payload = decodeJwt(e.link);
              if (!payload) return null;
              const res = yield resolvers.resolve(e.servername, payload.link);
              if (!res) return null;
              return {
                name: `Embed69 - ${e.servername.charAt(0).toUpperCase() + e.servername.slice(1)}`,
                language: "Latino",
                quality: res.quality || "HD",
                url: res.url,
                headers: res.headers
              };
            })));
            return results.filter(r => r.status === "fulfilled" && r.value).map(r => r.value);
          } catch (e) { return []; }
        });
      }
    };
  }
});

var extractor = require_extractor();
module.exports = {
  getStreams: (id, type, s, e) => __async(null, null, function* () {
    console.log(`[Latino TV] Buscando: ${id}`);
    return yield extractor.getLinks(id, type, s, e);
  })
};

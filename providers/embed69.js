/**
 * embed69 - Plugin Nuvio (Versión Híbrida 1.0.9-FIX)
 * Resolvers Robustos + Filemoon Nativo + Velocidad Turbo
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
        return p.replace(/\b\w+\b/g, (e) => {
          const index = parseInt(e, 36);
          let word = kArr[index];
          if (!word) word = kArr[parseInt(e, a)];
          return word || e;
        });
      } catch (e) { return code; }
    }
    module2.exports = { unpack };
  }
});

var require_tmdb = __commonJS({
  "src/shared/utils/tmdb.js"(exports2, module2) {
    const CACHE = {};
    function getImdbId(tmdbId, mediaType) {
      return __async(this, null, function* () {
        const key = `${mediaType}_${tmdbId}`;
        if (CACHE[key]) return CACHE[key];
        try {
          const type = String(mediaType).includes("movie") ? "movie" : "tv";
          const res = yield fetch(`https://api.themoviedb.org/3/${type}/${tmdbId}/external_ids?api_key=439c478a771f35c05022f9feabcca01c`);
          const data = yield res.json();
          if (data.imdb_id) CACHE[key] = data.imdb_id;
          return data.imdb_id || null;
        } catch (e) { return null; }
      });
    }
    module2.exports = { getImdbId };
  }
});

// --- RESOLVERS ---
var require_vidhide = __commonJS({
  "src/shared/resolvers/vidhide.js"(exports2, module2) {
    var { unpack } = require_unpacker();
    var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    function resolve(url) {
      return __async(this, null, function* () {
        try {
          const res = yield fetch(url, { headers: { "User-Agent": UA, "Referer": "https://embed69.org/" } });
          let html = yield res.text();
          if (html.includes("window.location.href") && html.length < 1000) {
              const m = html.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/i);
              if (m) return resolve(m[1]);
          }
          const evalMatches = html.match(/eval\(function\(p,a,c,k,e,[rd]\)[\s\S]*?\.split\('\|'\)[^\)]*\)\)/g);
          if (evalMatches) evalMatches.forEach(m => html += "\n" + unpack(m));
          const fileMatch = html.match(/(?:file|source|src|hls)\s*[:=]\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
          if (fileMatch) return { url: fileMatch[1], quality: "1080p" };
          return null;
        } catch (e) { return null; }
      });
    }
    module2.exports = resolve;
  }
});

var require_streamwish = __commonJS({
  "src/shared/resolvers/streamwish.js"(exports2, module2) {
    var { unpack } = require_unpacker();
    var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    function resolve(url) {
      return __async(this, null, function* () {
        try {
          const mirrors = ["vibuxer.com", "awish.pro"];
          const fetchT = (u) => fetch(u, { headers: { "User-Agent": UA, "Referer": "https://embed69.org/" } }).then(r => r.ok ? r.text() : null).catch(() => null);
          const results = yield Promise.all([fetchT(url), fetchT(url.replace(/[^/]+\.(?:com|to|pro|net|org)/, mirrors[0]))]);
          let html = results.find(h => h && (h.includes(".m3u8") || h.includes("eval")));
          if (!html) return null;
          const evalMatch = html.match(/eval\(function\(p,a,c,k,e,[rd]\)[\s\S]*?\.split\('\|'\)[^\)]*\)\)/);
          if (evalMatch) html += "\n" + unpack(evalMatch[0]);
          const fileMatch = html.match(/(?:file|source|src|hls)\s*[:=]\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
          if (fileMatch) return { url: fileMatch[1], quality: "Auto" };
          return null;
        } catch (e) { return null; }
      });
    }
    module2.exports = resolve;
  }
});

var require_voe = __commonJS({
  "src/shared/resolvers/voe.js"(exports2, module2) {
    var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    function resolve(url) {
      return __async(this, null, function* () {
        try {
          const res = yield fetch(url, { headers: { "User-Agent": UA, "Referer": url } });
          let html = yield res.text();
          const jsonMatch = html.match(/<script type="application\/json">([\s\S]*?)<\/script>/);
          if (jsonMatch) {
              let decoded = JSON.parse(jsonMatch[1]).replace(/[a-zA-Z]/g, c => String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() <= 'm' ? 13 : -13)));
              ["@$", "^^", "~@", "%?", "*~", "!!", "#&"].forEach(n => decoded = decoded.split(n).join(""));
              const stage1 = atob(decoded);
              let shifted = ""; for(let i=0; i<stage1.length; i++) shifted += String.fromCharCode(stage1.charCodeAt(i)-3);
              const data = JSON.parse(atob(shifted.split("").reverse().join("")));
              if (data.source) return { url: data.source, quality: "1080p" };
          }
          const m3u8 = html.match(/["'](https?:\/\/[^"']+?\.m3u8[^"']*?)["']/i);
          return m3u8 ? { url: m3u8[1], quality: "Auto" } : null;
        } catch (e) { return null; }
      });
    }
    module2.exports = resolve;
  }
});

var require_filemoon = __commonJS({
  "src/shared/resolvers/filemoon.js"(exports2, module2) {
    var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    function resolve(url) {
      return __async(this, null, function* () {
        try {
          const videoId = url.split("/").pop();
          const domain = new URL(url).origin;
          const details = yield (yield fetch(`${domain}/api/videos/${videoId}/embed/details`, { headers: { "User-Agent": UA } })).json();
          const pbDomain = new URL(details.embed_frame_url).origin;

          const challenge = yield (yield fetch(`${pbDomain}/api/videos/access/challenge`, {
              method: 'POST',
              headers: { "Referer": details.embed_frame_url, "Origin": pbDomain, "User-Agent": UA }
          })).json();
          
          const sig = typeof __crypto_ecdsa_sign_secp256r1 === "function" ? __crypto_ecdsa_sign_secp256r1(challenge.nonce) : "{}";
          const attestJson = JSON.parse(sig);
          if (!attestJson.signature) return null;

          const vId = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => (Math.random()*16|0).toString(16));
          const attestRes = yield (yield fetch(`${pbDomain}/api/videos/access/attest`, {
              method: 'POST',
              headers: { "Content-Type": "application/json", "Referer": details.embed_frame_url, "Origin": pbDomain, "User-Agent": UA },
              body: JSON.stringify({
                  viewer_id: vId, device_id: vId, challenge_id: challenge.challenge_id, nonce: challenge.nonce,
                  signature: attestJson.signature, public_key: { crv: "P-256", ext: true, key_ops: ["verify"], kty: "EC", x: attestJson.x, y: attestJson.y },
                  client: { user_agent: UA, architecture: "x86", bitness: "64", platform: "Windows", platform_version: "10.0.0", pixel_ratio: 1.0, screen_width: 1920, screen_height: 1080, languages: ["en-US"] },
                  storage: { cookie: vId, local_storage: vId }, attributes: { entropy: "high" }
              })
          })).json();

          const pb = (yield (yield fetch(`${pbDomain}/api/videos/${videoId}/embed/playback`, {
              method: 'POST',
              headers: { "Content-Type": "application/json", "Referer": details.embed_frame_url, "Origin": pbDomain, "User-Agent": UA },
              body: JSON.stringify({ fingerprint: { token: attestRes.token, viewer_id: vId, device_id: vId, confidence: attestRes.confidence } })
          })).json()).playback;
          
          const dec = typeof __crypto_aes_gcm_decrypt === "function" ? __crypto_aes_gcm_decrypt(JSON.stringify(pb.key_parts), pb.iv, pb.payload) : "";
          if (!dec) return null;
          const final = JSON.parse(dec);
          return { url: final.sources[0].url, quality: final.sources[0].label || "1080p", headers: { "User-Agent": UA, "Referer": domain + "/", "Origin": domain } };
        } catch (e) { return null; }
      });
    }
    module2.exports = resolve;
  }
});

// --- MAIN ---
const resolvers = {
    vidhide: require_vidhide(), streamwish: require_streamwish(), voe: require_voe(), filemoon: require_filemoon()
};

const tmdb = require_tmdb();
module.exports = {
  getStreams: (id, type, s, e) => __async(null, null, function* () {
    try {
      console.log(`[Latino TV] Buscando: ${id}`);
      let imdbId = id.startsWith("tt") ? id : yield tmdb.getImdbId(id, type);
      if (!imdbId) return [];
      const urlId = (type === "tv" && s) ? `${imdbId}-${s}x${String(e).padStart(2, "0")}` : imdbId;
      
      const res = yield fetch(`https://embed69.org/f/${urlId}`, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
      });
      if (!res.ok) return [];
      const html = yield res.text();
      
      const m = html.match(/dataLink\s*=\s*([\[\{][\s\S]*?[\]\}]);/);
      if (!m) return [];
      let data = JSON.parse(m[1]);
      if (!Array.isArray(data)) data = Object.keys(data).map(k => ({ video_language: k, sortedEmbeds: data[k] }));
      const lat = data.find(i => i.video_language === "LAT");
      if (!lat) return [];
      
      const results = yield Promise.allSettled(lat.sortedEmbeds.filter(e => e.link && e.servername !== "download").map(e => __async(this, null, function* () {
          try {
              const payload = JSON.parse(atob(e.link.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
              const res = yield resolvers[e.servername.toLowerCase()](payload.link);
              if (!res) return null;
              return { name: `Embed69 - ${e.servername}`, language: "Latino", quality: res.quality || "HD", url: res.url, headers: res.headers };
          } catch(err) { return null; }
      })));
      return results.filter(r => r.status === "fulfilled" && r.value).map(r => r.value);
    } catch(e) { return []; }
  })
};

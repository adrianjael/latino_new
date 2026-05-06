/**
 * embed69 - Plugin Nuvio (v1.1.8)
 * CLONACIÓN 1:1 DEL ORIGINAL CON FIX DE FILEMOON NATIVO
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

// src/embed69/http.js
var require_http = __commonJS({
  "src/embed69/http.js"(exports2, module2) {
    var http = {
      get(_0) {
        return __async(this, arguments, function* (url, headers = {}) {
          try {
            const response = yield fetch(url, {
              method: "GET",
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
      },
      post(_0, _1) {
        return __async(this, arguments, function* (url, data, headers = {}) {
          try {
            const response = yield fetch(url, {
              method: "POST",
              headers: __spreadValues({
                "Content-Type": "application/x-www-form-urlencoded"
              }, headers),
              body: typeof data === "string" ? data : JSON.stringify(data)
            });
            return yield response.text();
          } catch (error) {
            console.error(`[HTTP POST Error] ${url}:`, error.message);
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
        return p.replace(/\b\w+\b/g, (e) => {
          const index = parseInt(e, 36);
          let word = kArr[index];
          if (!word) {
            const altIndex = parseInt(e, a);
            word = kArr[altIndex];
          }
          return word || e;
        });
      } catch (e) {
        return code;
      }
    }
    module2.exports = { unpack };
  }
});

// src/shared/resolvers/vidhide.js
var require_vidhide = __commonJS({
  "src/shared/resolvers/vidhide.js"(exports2, module2) {
    var { unpack } = require_unpacker();
    var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    function resolveVidhide(url, customReferer) {
      return __async(this, null, function* () {
        try {
          console.log(`[Resolvers] Resolviendo VidHide: ${url}`);
          const origin = new URL(url).origin;
          const referer = customReferer || "https://embed69.org/";
          const response = yield fetch(url, {
            headers: { "User-Agent": USER_AGENT, "Referer": referer }
          });
          if (!response.ok) return null;
          let html = yield response.text();
          if (html.includes("window.location.href") && html.length < 1e3) {
            const redirectMatch = html.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/i);
            if (redirectMatch) return resolveVidhide(redirectMatch[1], url);
          }
          const evalMatches = html.match(/eval\(function\(p,a,c,k,e,[rd]\)[\s\S]*?\.split\('\|'\)[^\)]*\)\)/g);
          let contentToSearch = html;
          if (evalMatches) {
            evalMatches.forEach((m) => {
              try { contentToSearch += "\n" + unpack(m); } catch (e) {}
            });
          }
          const patterns = [
            /"?hls2"?\s*[:=]\s*"([^"]+)"/i,
            /"?hls4"?\s*[:=]\s*"([^"]+)"/i,
            /"?file"?\s*[:=]\s*"([^"]+\.m3u8[^"]*)"/i,
            /"?src"?\s*[:=]\s*"([^"]+\.m3u8[^"]*)"/i,
            /["']?file["']?\s*[:=]\s*["']([^"']+\.m3u8[^"']*)["']/i
          ];
          let link = null;
          for (const p of patterns) {
            const m = contentToSearch.match(p);
            if (m && m[1]) { link = m[1]; break; }
          }
          if (!link) {
            const m3u8Matches = contentToSearch.match(/https?:\/\/[^"'\s\\]+\.m3u8[^"'\s\\]*/g);
            if (m3u8Matches) link = m3u8Matches.find((m) => !m.includes("adsystem") && !m.includes("pixel"));
          }
          if (!link) return null;
          let finalUrl = link.startsWith("http") ? link : `${origin}${link}`;
          return { url: finalUrl, quality: "1080p", headers: { "User-Agent": USER_AGENT, "Referer": `${origin}/` } };
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
          console.log(`[Resolvers] Resolviendo Streamwish: ${url}`);
          const domains = ["vibuxer.com", "awish.pro", "dwish.pro", "streamwish.to", "embedwish.com", "strish.com", "wishembed.pro"];
          let success = false;
          let html = "";
          let finalOrigin = "";
          if (!url.includes("hglink.to")) {
            try {
              const res = yield fetch(url, { headers: { "User-Agent": USER_AGENT, "Referer": "https://embed69.org/" } });
              if (res.ok) { html = yield res.text(); finalOrigin = new URL(url).origin; if (html.includes(".m3u8") || html.includes("eval(function")) success = true; }
            } catch (e) {}
          }
          if (!success) {
            for (const domain of domains) {
              try {
                const fetchUrl = url.replace(/[^/]+\.(?:com|to|pro|net|org)/, domain);
                const res = yield fetch(fetchUrl, { headers: { "User-Agent": USER_AGENT, "Referer": "https://embed69.org/" } });
                if (res.ok) { html = yield res.text(); finalOrigin = `https://${domain}`; if (html.includes(".m3u8") || html.includes("eval(function")) { success = true; break; } }
              } catch (e) {}
            }
          }
          if (!success) return null;
          const m3u8Direct = html.match(/https?:\/\/[^"'\s\\]+\.m3u8[^"'\s\\]*/i);
          if (m3u8Direct) return { url: m3u8Direct[0], quality: "Auto", headers: { "Referer": finalOrigin + "/" } };
          const evalMatch = html.match(/eval\(function\(p,a,c,k,e,[rd]\)[\s\S]*?\.split\('\|'\)[^\)]*\)\)/);
          let contentToSearch = html;
          if (evalMatch) { try { contentToSearch += "\n" + unpack(evalMatch[0]); } catch (e) {} }
          const fileMatch = contentToSearch.match(/(?:file|source|src|hls)\s*[:=]\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)['"]/i);
          if (fileMatch) {
            let streamUrl = fileMatch[1];
            if (streamUrl.startsWith("/")) streamUrl = finalOrigin + streamUrl;
            return { url: streamUrl, quality: "Auto", headers: { "Referer": finalOrigin + "/" } };
          }
          return null;
        } catch (e) { return null; }
      });
    }
    module2.exports = resolveStreamwish;
  }
});

// src/shared/utils/base64.js
var require_base64 = __commonJS({
  "src/shared/utils/base64.js"(exports2, module2) {
    function base64Decode(str) {
      if (typeof str !== "string") return "";
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
      let output = "";
      str = str.replace(/=+$/, "");
      if (str.length % 4 === 1) return "";
      for (let bc = 0, bs, buffer, idx = 0; buffer = str.charAt(idx++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
        buffer = chars.indexOf(buffer);
      }
      try { return decodeURIComponent(escape(output)); } catch (e) { return output; }
    }
    module2.exports = { base64Decode };
  }
});

// src/shared/resolvers/voe.js
var require_voe = __commonJS({
  "src/shared/resolvers/voe.js"(exports2, module2) {
    var { base64Decode } = require_base64();
    var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    function localAtob(input) {
      if (!input) return "";
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
      let str = String(input).replace(/=+$/, "").replace(/[\s\n\r\t]/g, "");
      let output = "";
      if (str.length % 4 === 1) return "";
      for (let bc = 0, bs, buffer, idx = 0; buffer = str.charAt(idx++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
        buffer = chars.indexOf(buffer);
      }
      return output;
    }
    function resolveVoe(url) {
      return __async(this, null, function* () {
        try {
          console.log(`[VOE] Resolviendo: ${url}`);
          let response = yield fetch(url, { headers: { "User-Agent": USER_AGENT, "Referer": url } });
          let html = yield response.text();
          if (html.includes("window.location.href") && html.length < 2e3) {
            const rm = html.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/i);
            if (rm) return resolveVoe(rm[1]);
          }
          const jsonMatch = html.match(/<script type="application\/json">([\s\S]*?)<\/script>/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[1].trim());
              let encText = Array.isArray(parsed) ? parsed[0] : parsed;
              let decoded = encText.replace(/[a-zA-Z]/g, (c) => {
                const code = c.charCodeAt(0);
                const limit = c <= "Z" ? 90 : 122;
                const shifted = code + 13;
                return String.fromCharCode(limit >= shifted ? shifted : shifted - 26);
              });
              const noise = ["@$", "^^", "~@", "%?", "*~", "!!", "#&"];
              for (const n of noise) decoded = decoded.split(n).join("");
              const b64_1 = localAtob(decoded);
              let shiftedStr = "";
              for (let j = 0; j < b64_1.length; j++) shiftedStr += String.fromCharCode(b64_1.charCodeAt(j) - 3);
              const reversed = shiftedStr.split("").reverse().join("");
              const data = JSON.parse(localAtob(reversed));
              if (data && data.source) return { url: data.source, quality: "1080p", headers: { "User-Agent": USER_AGENT, "Referer": url } };
            } catch (ex) {}
          }
          return null;
        } catch (e) { return null; }
      });
    }
    module2.exports = resolveVoe;
  }
});

// src/shared/resolvers/filemoon.js (REPARACIÓN NATIVA ANDROID)
var require_filemoon = __commonJS({
  "src/shared/resolvers/filemoon.js"(exports2, module2) {
    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    function resolveFilemoon(url) {
      return __async(this, null, function* () {
        try {
          console.log(`[Resolvers] Filemoon (Native-Handshake): ${url}`);
          const videoId = url.split("/").pop();
          const domain = new URL(url).origin;
          
          const details = yield (yield fetch(`${domain}/api/videos/${videoId}/embed/details`, { headers: { "User-Agent": UA } })).json();
          const pbDomain = new URL(details.embed_frame_url).origin;
          const challenge = yield (yield fetch(`${pbDomain}/api/videos/access/challenge`, { method: 'POST', headers: { "Referer": details.embed_frame_url, "Origin": pbDomain, "User-Agent": UA } })).json();
          
          const sig = typeof __crypto_ecdsa_sign_secp256r1 === "function" ? __crypto_ecdsa_sign_secp256r1(challenge.nonce) : "{}";
          const attestJson = JSON.parse(sig);
          if (!attestJson.signature) return null;

          const uuidv4 = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
              var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
          }).replace(/-/g, '');
          const vId = uuidv4();
          const dId = uuidv4();

          const attestRes = yield (yield fetch(`${pbDomain}/api/videos/access/attest`, {
              method: 'POST', headers: { "Content-Type": "application/json", "Referer": details.embed_frame_url, "Origin": pbDomain, "User-Agent": UA },
              body: JSON.stringify({
                  viewer_id: vId, device_id: dId, challenge_id: challenge.challenge_id, nonce: challenge.nonce,
                  signature: attestJson.signature, public_key: { crv: "P-256", ext: true, key_ops: ["verify"], kty: "EC", x: attestJson.x, y: attestJson.y },
                  client: { user_agent: UA, architecture: "x86", bitness: "64", platform: "Windows", platform_version: "10.0.0", pixel_ratio: 1.0, screen_width: 1920, screen_height: 1080, languages: ["en-US"] },
                  storage: { cookie: vId, local_storage: vId, indexed_db: `${vId}:${dId}`, cache_storage: `${vId}:${dId}` }, 
                  attributes: { entropy: "high" }
              })
          })).json();

          const pbRes = yield (yield fetch(`${pbDomain}/api/videos/${videoId}/embed/playback`, {
              method: 'POST', headers: { "Content-Type": "application/json", "Referer": details.embed_frame_url, "Origin": pbDomain, "User-Agent": UA },
              body: JSON.stringify({ fingerprint: { token: attestRes.token, viewer_id: vId, device_id: dId, confidence: attestRes.confidence } })
          })).json();

          const dec = typeof __crypto_aes_gcm_decrypt === "function" ? __crypto_aes_gcm_decrypt(JSON.stringify(pbRes.playback.key_parts), pbRes.playback.iv, pbRes.playback.payload) : "";
          const final = JSON.parse(dec);
          return { url: final.sources[0].url, quality: final.sources[0].label || "1080p", headers: { "User-Agent": UA, "Referer": domain + "/", "Origin": domain } };
        } catch (e) { return null; }
      });
    }
    module2.exports = resolveFilemoon;
  }
});

// src/shared/resolvers/streamtape.js
var require_streamtape = __commonJS({
  "src/shared/resolvers/streamtape.js"(exports2, module2) {
    var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    function resolveStreamtape(url) {
      return __async(this, null, function* () {
        try {
          const origin = new URL(url).origin;
          const html = yield (yield fetch(url, { headers: { "User-Agent": USER_AGENT, "Referer": origin + "/" } })).text();
          const tapeMatch = html.match(/https?:\/\/[^"'\s]+tapecontent\.net[^"'\s]*/i);
          if (tapeMatch) return { url: tapeMatch[0], quality: "HD", headers: { "User-Agent": USER_AGENT, "Referer": origin + "/" } };
          return null;
        } catch (e) { return null; }
      });
    }
    module2.exports = resolveStreamtape;
  }
});

// src/shared/resolvers/goodstream.js
var require_goodstream = __commonJS({
  "src/shared/resolvers/goodstream.js"(exports2, module2) {
    var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    function resolveGoodstream(url) {
      return __async(this, null, function* () {
        try {
          const origin = new URL(url).origin;
          const html = yield (yield fetch(url, { headers: { "User-Agent": USER_AGENT, "Referer": "https://www.cinecalidad.vg/" } })).text();
          const fileMatch = html.match(/file:\s*"([^"]+)"/);
          if (fileMatch) return { url: fileMatch[1], quality: "1080p", headers: { "Referer": origin + "/", "User-Agent": USER_AGENT } };
          return null;
        } catch (e) { return null; }
      });
    }
    module2.exports = resolveGoodstream;
  }
});

// src/shared/resolvers/generic_packer.js
var require_generic_packer = __commonJS({
  "src/shared/resolvers/generic_packer.js"(exports2, module2) {
    var { unpack } = require_unpacker();
    var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    function resolveGenericPacker(url, referer) {
      return __async(this, null, function* () {
        try {
          const origin = new URL(url).origin;
          let content = yield (yield fetch(url, { headers: { "User-Agent": UA, "Referer": referer || origin + "/" } })).text();
          const evals = content.match(/eval\(function\(p,a,c,k,e,[rd]\)[\s\S]*?\.split\('\|'\)[^\)]*\)\)/g);
          if (evals) evals.forEach(m => { try { content += "\n" + unpack(m); } catch (e) {} });
          const m3u8Match = content.match(/https?:\/\/[^"'\s\\]+\.m3u8[^"'\s\\]*/i);
          if (m3u8Match) return { url: m3u8Match[0], quality: "Auto", headers: { "Referer": origin + "/", "User-Agent": UA } };
          return null;
        } catch (e) { return null; }
      });
    }
    module2.exports = resolveGenericPacker;
  }
});

// src/shared/utils/m3u8.js
var require_m3u8 = __commonJS({
  "src/shared/utils/m3u8.js"(exports2, module2) {
    var m3u8Parser = {
      getQualityFromSafePatterns(url) {
        if (!url) return null;
        const u = url.toLowerCase();
        if (u.includes(",h,.urlset")) return "1080p";
        if (u.includes(",n,.urlset")) return "720p";
        if (u.includes(",l,.urlset")) return "480p";
        const standardMatch = u.match(/[_-](1080|720|480|360)p?(\.m3u8|$|\?)/);
        return standardMatch ? standardMatch[1] + "p" : null;
      },
      detectRealQuality(_0) {
        return __async(this, arguments, function* (url, headers = {}) {
          const fast = this.getQualityFromSafePatterns(url);
          return fast ? { quality: fast } : null;
        });
      }
    };
    module2.exports = m3u8Parser;
  }
});

// src/shared/resolvers/index.js
var require_resolvers = __commonJS({
  "src/shared/resolvers/index.js"(exports2, module2) {
    var resolveVidhide = require_vidhide();
    var resolveStreamwish = require_streamwish();
    var resolveVoe = require_voe();
    var resolveFilemoon = require_filemoon();
    var resolveStreamtape = require_streamtape();
    var resolveGoodstream = require_goodstream();
    var m3u8Parser = require_m3u8();
    var registry = { vidhide: resolveVidhide, streamwish: resolveStreamwish, filemoon: resolveFilemoon, voe: resolveVoe, streamtape: resolveStreamtape, vimeos: resolveGoodstream, goodstream: resolveGoodstream };
    function resolve(servername, url) {
      return __async(this, null, function* () {
        const name = String(servername).toLowerCase().trim();
        if (registry[name]) {
          const result = yield registry[name](url);
          if (result && result.url) {
            const detection = yield m3u8Parser.detectRealQuality(result.url, result.headers || {});
            if (detection) result.quality = detection.quality;
          }
          return result;
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
    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    function getImdbId(tmdbId, mediaType) {
      return __async(this, null, function* () {
        try {
          const type = String(mediaType || "").toLowerCase().includes("movie") ? "movie" : "tv";
          const url = `https://api.themoviedb.org/3/${type}/${tmdbId}/external_ids?api_key=439c478a771f35c05022f9feabcca01c`;
          const data = yield (yield fetch(url, { headers: { "User-Agent": UA } })).json();
          return data ? data.imdb_id || null : null;
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
    function decodeJwtPayload(token) {
      try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        return JSON.parse(atob(base64));
      } catch (e) { return null; }
    }
    var extractor2 = {
      getLinks(id, type, season, episode) {
        return __async(this, null, function* () {
          try {
            let imdbId = id.startsWith("tt") ? id : yield tmdb.getImdbId(id, type);
            if (!imdbId) return [];
            let urlId = (type === "tv" && season && episode) ? `${imdbId}-${season}x${String(episode).padStart(2, "0")}` : imdbId;
            const html = yield http.get(`https://embed69.org/f/${urlId}`);
            const match = html.match(/(?:let|const|var)\s+dataLink\s*=\s*([\[\{][\s\S]*?[\]\}]);/);
            if (!match) return [];
            let data = JSON.parse(match[1]);
            if (!Array.isArray(data)) data = Object.keys(data).map((lang) => ({ video_language: lang, sortedEmbeds: data[lang] }));
            const latData = data.find((item) => item.video_language === "LAT");
            if (!latData) return [];
            const resolvePromises = latData.sortedEmbeds.filter((e) => e.link && e.servername !== "download").map((embed) => __async(this, null, function* () {
              try {
                const payload = decodeJwtPayload(embed.link);
                if (!payload || !payload.link) return null;
                const resolved = yield resolvers.resolve(embed.servername, payload.link);
                if (!resolved || !resolved.url) return null;
                return { name: `Embed69 - ${embed.servername}`, language: "Latino", quality: resolved.quality || "HD", url: resolved.url, headers: resolved.headers };
              } catch (e) { return null; }
            }));
            const results = yield Promise.allSettled(resolvePromises);
            return results.filter((r) => r.status === "fulfilled" && r.value !== null).map((r) => r.value);
          } catch (error) { return []; }
        });
      }
    };
    module2.exports = extractor2;
  }
});

// src/embed69/index.js
var extractor = require_extractor();
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      console.log(`[Latino TV] Buscando en Embed69: ${tmdbId}`);
      return yield extractor.getLinks(tmdbId, mediaType, season, episode);
    } catch (error) { return []; }
  }
}
module.exports = { getStreams };

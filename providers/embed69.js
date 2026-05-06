/**
 * Embed69 Provider - Nuvio Next-Gen (v1.2.4)
 * StreamFlix-Inspired Filemoon Implementation
 */

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36";

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

function voeDecode(encText) {
    try {
        let decoded = encText.replace(/[a-zA-Z]/g, (c) => {
            const code = c.charCodeAt(0);
            const limit = c <= "Z" ? 90 : 122;
            const shifted = code + 13;
            return String.fromCharCode(limit >= shifted ? shifted : shifted - 26);
        });
        const noise = ["@$", "^^", "~@", "%?", "*~", "!!", "#&"];
        for (const n of noise) decoded = decoded.split(n).join("");
        const b64_1 = atob(decoded);
        let shiftedStr = "";
        for (let j = 0; j < b64_1.length; j++) shiftedStr += String.fromCharCode(b64_1.charCodeAt(j) - 3);
        const reversed = shiftedStr.split("").reverse().join("");
        return JSON.parse(atob(reversed));
    } catch (e) { return null; }
}

async function resolveVoe(url) {
    try {
        let html = await (await fetch(url, { headers: { "User-Agent": UA, "Referer": url } })).text();
        if (html.includes('permanentToken')) {
            const redMatch = html.match(/window\.location\.href\s*=\s*'([^']+)'/i);
            if (redMatch) html = await (await fetch(redMatch[1], { headers: { "User-Agent": UA, "Referer": url } })).text();
        }
        const jsonMatch = html.match(/<script type="application\/json">([\s\S]*?)<\/script>/);
        if (jsonMatch) {
            const data = voeDecode(JSON.parse(jsonMatch[1].trim()));
            if (data && data.source) return { url: data.source, quality: "1080p", headers: { "User-Agent": UA, "Referer": url } };
        }
        
        // PLAN B: Búsqueda directa si el JSON no está o falla
        const m3u8Fallback = html.match(/["'](https?:\/\/[^"']+?\.m3u8[^"']*?)["']/i);
        if (m3u8Fallback && !m3u8Fallback[1].includes("test-videos")) {
            return { url: m3u8Fallback[1], quality: "Auto", headers: { "User-Agent": UA, "Referer": url } };
        }
        return null;

    } catch (e) { return null; }
}

async function resolveStreamwish(url) {
    const domains = ["vibuxer.com", "awish.pro", "dwish.pro", "streamwish.to", "embedwish.com", "strish.com", "wishembed.pro"];
    for (const domain of domains) {
        try {
            const fetchUrl = url.replace(/[^/]+\.(?:com|to|pro|net|org)/, domain);
            const res = await fetch(fetchUrl, { headers: { "User-Agent": UA, "Referer": "https://embed69.org/" } });
            if (!res.ok) continue;
            let html = await res.text();
            if (html.includes("eval(function")) html += "\n" + unpack(html);
            const m3u8 = html.match(/(?:file|source|src|hls)\s*[:=]\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i) || html.match(/https?:\/\/[^"'\s\\]+\.m3u8[^"'\s\\]*/i);
            if (m3u8) return { url: m3u8[1] || m3u8[0], quality: "Auto", headers: { "User-Agent": UA, "Referer": `https://${domain}/` } };
        } catch (e) {}
    }
    return null;
}

async function resolveFilemoon(url) {
    try {
        const videoId = url.split("/").pop();
        const domain = new URL(url).origin;
        const details = await (await fetch(`${domain}/api/videos/${videoId}/embed/details`, { headers: { "User-Agent": UA } })).json();
        const embedFrameUrl = details.embed_frame_url;
        const pbDomain = new URL(embedFrameUrl).origin;
        
        const challenge = await (await fetch(`${pbDomain}/api/videos/access/challenge`, { 
            method: 'POST', 
            headers: { "Referer": embedFrameUrl, "Origin": pbDomain, "User-Agent": UA } 
        })).json();
        
        const sig = typeof __crypto_ecdsa_sign_secp256r1 === "function" ? __crypto_ecdsa_sign_secp256r1(challenge.nonce) : "{}";
        const attestJson = JSON.parse(sig);
        if (!attestJson.signature) return null;

        const uuid = () => 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => (c == 'x' ? Math.random()*16|0 : (Math.random()*16|0&0x3|0x8)).toString(16));
        const vId = uuid(); const dId = uuid();

        const attestRes = await (await fetch(`${pbDomain}/api/videos/access/attest`, {
            method: 'POST', headers: { "Content-Type": "application/json", "Referer": embedFrameUrl, "Origin": pbDomain, "User-Agent": UA },
            body: JSON.stringify({
                viewer_id: vId, device_id: dId, challenge_id: challenge.challenge_id, nonce: challenge.nonce,
                signature: attestJson.signature, 
                public_key: { crv: "P-256", ext: true, key_ops: ["verify"], kty: "EC", x: attestJson.x, y: attestJson.y },
                client: { 
                    user_agent: UA, architecture: "x86", bitness: "64", platform: "Windows", 
                    platform_version: "10.0.0", pixel_ratio: 1.0, screen_width: 1920, screen_height: 1080, languages: ["en-US"] 
                },
                storage: { 
                    cookie: vId, local_storage: vId, 
                    indexed_db: `${vId}:${dId}`, cache_storage: `${vId}:${dId}` 
                }, 
                attributes: { entropy: "high" }
            })
        })).json();

        if (!attestRes.token) return null;

        const pbRes = await (await fetch(`${pbDomain}/api/videos/${videoId}/embed/playback`, {
            method: 'POST', headers: { 
                "Content-Type": "application/json", "Referer": embedFrameUrl, "Origin": pbDomain, "User-Agent": UA,
                "X-Embed-Parent": url 
            },
            body: JSON.stringify({ 
                fingerprint: { 
                    token: attestRes.token, 
                    viewer_id: attestRes.viewer_id || vId, 
                    device_id: attestRes.device_id || dId, 
                    confidence: attestRes.confidence 
                } 
            })
        })).json();

        const dec = typeof __crypto_aes_gcm_decrypt === "function" ? __crypto_aes_gcm_decrypt(JSON.stringify(pbRes.playback.key_parts), pbRes.playback.iv, pbRes.playback.payload) : "";
        const final = JSON.parse(dec);
        return { url: final.sources[0].url, quality: final.sources[0].label || "1080p", headers: { "User-Agent": UA, "Referer": embedFrameUrl, "Origin": pbDomain } };
    } catch (e) { return null; }
}

async function resolveVidhide(url) {
    try {
        let html = await (await fetch(url, { headers: { "User-Agent": UA, "Referer": "https://embed69.org/" } })).text();
        if (html.includes("eval(function")) html += "\n" + unpack(html);
        const m3u8 = html.match(/(?:file|source|src|hls)\s*[:=]\s*["']([^"']+\.m3u8[^"']*)["']/i) || html.match(/https?:\/\/[^"'\s\\]+\.m3u8[^"'\s\\]*/i);
        if (m3u8) return { url: m3u8[1] || m3u8[0], quality: "1080p", headers: { "User-Agent": UA, "Referer": new URL(url).origin + "/" } };
        return null;
    } catch (e) { return null; }
}

async function getStreams(tmdbId, mediaType, season, episode) {
    try {
        const res0 = await fetch(`https://api.themoviedb.org/3/${mediaType.includes("movie") ? "movie" : "tv"}/${tmdbId}/external_ids?api_key=439c478a771f35c05022f9feabcca01c`);
        const tmdbData = await res0.json();
        const imdbId = tmdbData.imdb_id;
        if (!imdbId) return [];

        const urlId = (mediaType === "tv" && season) ? `${imdbId}-${season}x${String(episode).padStart(2, "0")}` : imdbId;
        const html = await (await fetch(`https://embed69.org/f/${urlId}`, { headers: { "User-Agent": UA } })).text();
        const match = html.match(/dataLink\s*=\s*([\[\{][\s\S]*?[\]\}]);/);
        if (!match) return [];
        
        let data = JSON.parse(match[1]);
        if (!Array.isArray(data)) data = Object.keys(data).map(k => ({ video_language: k, sortedEmbeds: data[k] }));
        const lat = data.find(i => i.video_language === "LAT");
        if (!lat) return [];

        const streams = [];
        for (const embed of lat.sortedEmbeds) {
            if (!embed.link || embed.servername === "download") continue;
            try {
                const payload = JSON.parse(atob(embed.link.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
                const sName = embed.servername.toLowerCase();
                let res = null;
                if (sName === "filemoon") res = await resolveFilemoon(payload.link);
                else if (sName === "voe") res = await resolveVoe(payload.link);
                else if (sName === "streamwish") res = await resolveStreamwish(payload.link);
                else if (sName === "vidhide") res = await resolveVidhide(payload.link);
                
                if (res) streams.push({ name: `Embed69 - ${embed.servername}`, language: "Latino", quality: res.quality || "HD", url: res.url, headers: res.headers });
            } catch (e) {}
        }
        return streams;
    } catch (e) { return []; }
}

module.exports = { getStreams };

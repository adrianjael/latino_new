/**
 * Embed69 Provider - Nuvio Next-Gen (v1.2.1)
 * Robust Async/Await + Unpacker + Safety Checks
 */

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

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

async function getImdbId(tmdbId, mediaType) {
    try {
        const type = mediaType.includes("movie") ? "movie" : "tv";
        const res = await fetch(`https://api.themoviedb.org/3/${type}/${tmdbId}/external_ids?api_key=439c478a771f35c05022f9feabcca01c`);
        const data = await res.json();
        return data.imdb_id || null;
    } catch (e) { return null; }
}

async function resolveFilemoon(url) {
    try {
        console.log(`[Filemoon] Iniciando: ${url}`);
        const videoId = url.split("/").pop();
        const domain = new URL(url).origin;
        const details = await (await fetch(`${domain}/api/videos/${videoId}/embed/details`, { headers: { "User-Agent": UA } })).json();
        if (!details.embed_frame_url) return null;

        const pbDomain = new URL(details.embed_frame_url).origin;
        const challenge = await (await fetch(`${pbDomain}/api/videos/access/challenge`, { method: 'POST', headers: { "Referer": details.embed_frame_url, "Origin": pbDomain, "User-Agent": UA } })).json();
        
        const sig = typeof __crypto_ecdsa_sign_secp256r1 === "function" ? __crypto_ecdsa_sign_secp256r1(challenge.nonce) : "{}";
        const attestJson = JSON.parse(sig);
        if (!attestJson.signature) return null;

        const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        }).replace(/-/g, '');
        const vId = uuid(); const dId = uuid();

        const attestRes = await (await fetch(`${pbDomain}/api/videos/access/attest`, {
            method: 'POST', headers: { "Content-Type": "application/json", "Referer": details.embed_frame_url, "Origin": pbDomain, "User-Agent": UA },
            body: JSON.stringify({
                viewer_id: vId, device_id: dId, challenge_id: challenge.challenge_id, nonce: challenge.nonce,
                signature: attestJson.signature, public_key: { crv: "P-256", ext: true, key_ops: ["verify"], kty: "EC", x: attestJson.x, y: attestJson.y },
                client: { user_agent: UA, platform: "Windows", platform_version: "10.0.0" },
                storage: { cookie: vId, local_storage: vId }, attributes: { entropy: "high" }
            })
        })).json();

        if (!attestRes.token) return null;

        const pbRes = await (await fetch(`${pbDomain}/api/videos/${videoId}/embed/playback`, {
            method: 'POST', headers: { "Content-Type": "application/json", "Referer": details.embed_frame_url, "Origin": pbDomain, "User-Agent": UA },
            body: JSON.stringify({ fingerprint: { token: attestRes.token, viewer_id: vId, device_id: dId, confidence: attestRes.confidence } })
        })).json();

        if (!pbRes.playback) return null;
        const dec = typeof __crypto_aes_gcm_decrypt === "function" ? __crypto_aes_gcm_decrypt(JSON.stringify(pbRes.playback.key_parts), pbRes.playback.iv, pbRes.playback.payload) : "";
        if (!dec) return null;
        const final = JSON.parse(dec);
        return { url: final.sources[0].url, quality: final.sources[0].label || "1080p", headers: { "User-Agent": UA, "Referer": domain + "/", "Origin": domain } };
    } catch (e) { console.log(`[Filemoon] Error: ${e.message}`); return null; }
}

async function resolveGeneric(url) {
    try {
        console.log(`[Resolver] Genérico: ${url}`);
        const res = await fetch(url, { headers: { "User-Agent": UA, "Referer": "https://embed69.org/" } });
        let html = await res.text();
        
        const evals = html.match(/eval\(function\(p,a,c,k,e,[rd]\)[\s\S]*?\.split\('\|'\)[^\)]*\)\)/g);
        if (evals) evals.forEach(m => html += "\n" + unpack(m));
        
        const m3u8 = html.match(/(?:file|source|src|hls)\s*[:=]\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i) || html.match(/https?:\/\/[^"'\s\\]+\.m3u8[^"'\s\\]*/i);
        if (m3u8) return { url: m3u8[1] || m3u8[0], quality: "Auto", headers: { "User-Agent": UA, "Referer": new URL(url).origin + "/" } };
        return null;
    } catch (e) { return null; }
}

async function getStreams(tmdbId, mediaType, season, episode) {
    try {
        console.log(`[Embed69] Buscando: ${tmdbId}`);
        const imdbId = tmdbId.startsWith("tt") ? tmdbId : await getImdbId(tmdbId, mediaType);
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
                let res = (embed.servername.toLowerCase() === "filemoon") ? await resolveFilemoon(payload.link) : await resolveGeneric(payload.link);
                if (res) {
                    streams.push({ name: `Embed69 - ${embed.servername}`, language: "Latino", quality: res.quality || "HD", url: res.url, headers: res.headers });
                }
            } catch (e) {}
        }
        return streams;
    } catch (e) { return []; }
}

module.exports = { getStreams };

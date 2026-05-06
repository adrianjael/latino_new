/**
 * Embed69 Provider - Nuvio Next-Gen (v1.2.0)
 * Native QuickJS Async/Await Support
 */

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

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
        console.log(`[Embed69] Filemoon Native Resolving: ${url}`);
        const videoId = url.split("/").pop();
        const domain = new URL(url).origin;
        
        const details = await (await fetch(`${domain}/api/videos/${videoId}/embed/details`, { headers: { "User-Agent": UA } })).json();
        const pbDomain = new URL(details.embed_frame_url).origin;
        const challenge = await (await fetch(`${pbDomain}/api/videos/access/challenge`, { method: 'POST', headers: { "Referer": details.embed_frame_url, "Origin": pbDomain, "User-Agent": UA } })).json();
        
        const sig = typeof __crypto_ecdsa_sign_secp256r1 === "function" ? __crypto_ecdsa_sign_secp256r1(challenge.nonce) : "{}";
        const attestJson = JSON.parse(sig);
        if (!attestJson.signature) return null;

        const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        }).replace(/-/g, '');
        
        const vId = uuid();
        const dId = uuid();

        const attestRes = await (await fetch(`${pbDomain}/api/videos/access/attest`, {
            method: 'POST', headers: { "Content-Type": "application/json", "Referer": details.embed_frame_url, "Origin": pbDomain, "User-Agent": UA },
            body: JSON.stringify({
                viewer_id: vId, device_id: dId, challenge_id: challenge.challenge_id, nonce: challenge.nonce,
                signature: attestJson.signature, public_key: { crv: "P-256", ext: true, key_ops: ["verify"], kty: "EC", x: attestJson.x, y: attestJson.y },
                client: { user_agent: UA, platform: "Windows", platform_version: "10.0.0" },
                storage: { cookie: vId, local_storage: vId }, attributes: { entropy: "high" }
            })
        })).json();

        const pbRes = await (await fetch(`${pbDomain}/api/videos/${videoId}/embed/playback`, {
            method: 'POST', headers: { "Content-Type": "application/json", "Referer": details.embed_frame_url, "Origin": pbDomain, "User-Agent": UA },
            body: JSON.stringify({ fingerprint: { token: attestRes.token, viewer_id: vId, device_id: dId, confidence: attestRes.confidence } })
        })).json();

        const dec = typeof __crypto_aes_gcm_decrypt === "function" ? __crypto_aes_gcm_decrypt(JSON.stringify(pbRes.playback.key_parts), pbRes.playback.iv, pbRes.playback.payload) : "";
        const final = JSON.parse(dec);
        return { url: final.sources[0].url, quality: final.sources[0].label || "1080p", headers: { "User-Agent": UA, "Referer": domain + "/", "Origin": domain } };
    } catch (e) { return null; }
}

async function resolveGeneric(url, servername) {
    try {
        const res = await fetch(url, { headers: { "User-Agent": UA, "Referer": "https://embed69.org/" } });
        let html = await res.text();
        
        const m3u8 = html.match(/https?:\/\/[^"'\s\\]+\.m3u8[^"'\s\\]*/i);
        if (m3u8) return { url: m3u8[0], quality: "Auto", headers: { "User-Agent": UA, "Referer": new URL(url).origin + "/" } };
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
                let res = null;
                if (embed.servername.toLowerCase() === "filemoon") {
                    res = await resolveFilemoon(payload.link);
                } else {
                    res = await resolveGeneric(payload.link, embed.servername);
                }

                if (res) {
                    streams.push({
                        name: `Embed69 - ${embed.servername}`,
                        language: "Latino",
                        quality: res.quality || "HD",
                        url: res.url,
                        headers: res.headers
                    });
                }
            } catch (e) {}
        }
        return streams;
    } catch (e) { return []; }
}

module.exports = { getStreams };

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function safeAtob(input) {
    if (!input) return "";
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let str = String(input).replace(/=+$/, '').replace(/[\s\n\r\t]/g, '');
    let output = '';
    if (str.length % 4 === 1) return '';
    for (let bc = 0, bs, buffer, idx = 0; buffer = str.charAt(idx++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
        buffer = chars.indexOf(buffer);
    }
    return output;
}

function unpack(p, a, c, k, e, d) {
    while (c--) if (k[c]) p = p.replace(new RegExp('\\b' + c.toString(a) + '\\b', 'g'), k[c]);
    return p;
}

async function resolveVidhide(url) {
    try {
        const html = await (await fetch(url)).text();
        const p = html.match(/p,a,c,k,e,d\)\s*\{([\s\S]*?)\.split/);
        if (p) {
            const unpacked = eval(`(function(p,a,c,k,e,d){${p[1]}.split('|'))})` + html.match(/\}\(([\s\S]*?)\)\);/)[1]);
            const m3u8 = unpacked.match(/file:"(.*?)"/);
            if (m3u8) return { url: m3u8[1], quality: "1080p" };
        }
    } catch (e) {}
    return null;
}

async function getStreams(tmdbId, mediaType, season, episode) {
    try {
        let cleanId = String(tmdbId).trim().replace(/^tmdb:/, "").replace(/^series:/, "").replace(/^movie:/, "").split(":")[0].split("/")[0];
        const type = ["movie", "film"].includes(String(mediaType).toLowerCase()) ? "movie" : "tv";
        let imdbId = cleanId.startsWith("tt") ? cleanId : null;
        if (!imdbId) {
            try {
                const res0 = await fetch(`https://api.themoviedb.org/3/${type}/${cleanId}/external_ids?api_key=439c478a771f35c05022f9feabcca01c`);
                imdbId = (await res0.json()).imdb_id;
            } catch (e) {}
        }
        if (!imdbId) return [];

        const urlId = (type === "tv" && season) ? `${imdbId}-${season}x${String(episode).padStart(2, "0")}` : imdbId;
        const html = await (await fetch(`https://embed69.org/f/${urlId}`, { headers: { "User-Agent": UA } })).text();
        const match = html.match(/dataLink\s*=\s*([\[\{][\s\S]*?[\]\}]);/);
        if (!match) return [];
        
        let data = JSON.parse(match[1]);
        if (!Array.isArray(data)) data = Object.keys(data).map(k => ({ video_language: k, sortedEmbeds: data[k] }));
        const lat = data.find(i => ["LAT", "LATINO"].includes(String(i.video_language).toUpperCase()));
        if (!lat) return [];

        const embed = lat.sortedEmbeds.find(e => e.servername.toLowerCase() === "vidhide");
        if (!embed || !embed.link) return [];

        const payload = JSON.parse(safeAtob(embed.link.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        const res = await resolveVidhide(payload.link);
        if (res) return [{ name: `Embed69 - VidHide`, language: "Latino", quality: res.quality, url: res.url }];
    } catch (e) {}
    return [];
}

module.exports = { getStreams };

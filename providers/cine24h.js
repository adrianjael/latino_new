(function() {
    const baseUrl = "https://cine24h.online";

    async function searchInSite(query) {
        console.log(`[Cine24h] Buscando: ${query}`);
        try {
            // Usamos browserFetch para la búsqueda inicial para saltar Cloudflare
            const response = await browserFetch(`${baseUrl}/?s=${encodeURIComponent(query)}`);
            const html = await response.text();
            const $ = cheerio.load(html);
            
            let foundUrl = null;
            $("article.TPost, .grid-item, .item").each((i, el) => {
                const title = $(el).find("h2, h3, .Title").text().toLowerCase();
                const href = $(el).find("a").attr("href");
                if (href && title.includes(query.toLowerCase())) {
                    foundUrl = href;
                    return false;
                }
            });
            return foundUrl;
        } catch (e) {
            console.error("[Cine24h] Error en búsqueda:", e.message);
            return null;
        }
    }

    async function getStreams(tmdbId, mediaType, season, episode) {
        console.log(`[Cine24h] v1.0.0 (Browser Mode): ${mediaType} ID:${tmdbId}`);
        try {
            const tmdbDetails = await tmdb.getDetails(tmdbId, mediaType);
            if (!tmdbDetails) return [];
            
            const title = tmdbDetails.title || tmdbDetails.name;
            let itemUrl = await searchInSite(title);
            if (!itemUrl) return [];

            console.log(`[Cine24h] URL encontrada: ${itemUrl}`);
            
            // Si es serie, necesitamos navegar al capítulo
            if (mediaType === "tv") {
                const response = await browserFetch(itemUrl);
                const html = await response.text();
                const $ = cheerio.load(html);
                
                let foundEpUrl = null;
                // Buscamos el ID serie-S_E o texto similar
                $("[id^='serie-'], .episodios a, .list-episodes a").each((i, el) => {
                    const id = $(el).attr("id") || "";
                    const href = $(el).attr("href");
                    const text = $(el).text().toLowerCase();
                    const epMatch = `${season}_${episode}`;
                    const epMatchAlt = `${season}x${episode}`;
                    
                    if (id.includes(`serie-${epMatch}`) || text.includes(epMatchAlt) || (href && href.includes(`-${epMatchAlt}-`))) {
                        // En Cine24h, a veces el clic es dinámico. 
                        // Si no hay href, intentamos deducir el patrón o capturar el data-src
                        foundEpUrl = href || itemUrl; // Fallback a la misma URL si es dinámico
                    }
                });
                if (foundEpUrl) itemUrl = foundEpUrl;
            }

            const response = await browserFetch(itemUrl);
            const html = await response.text();
            const $ = cheerio.load(html);
            const streams = [];

            // Cine24h usa .optnslst li con data-src en Base64
            $(".optnslst li").each((i, el) => {
                const dataSrc = $(el).attr("data-src");
                const serverName = $(el).text().trim() || "Servidor";
                
                if (dataSrc) {
                    try {
                        const decodedUrl = atob(dataSrc);
                        console.log(`[Cine24h] Servidor detectado: ${serverName} -> ${decodedUrl}`);
                        
                        let language = "Latino";
                        if (serverName.toLowerCase().includes("castellano") || serverName.toLowerCase().includes("esp")) {
                            language = "Castellano";
                        } else if (serverName.toLowerCase().includes("sub")) {
                            language = "Subtitulado";
                        }

                        streams.push({
                            title: `Cine24h - ${serverName}`,
                            url: decodedUrl,
                            quality: "HD",
                            language: language,
                            provider: "Cine24h"
                        });
                    } catch (err) {
                        console.error("[Cine24h] Error decodificando Base64");
                    }
                }
            });

            return streams;
        } catch (e) {
            console.error("[Cine24h] Error general:", e.message);
            return [];
        }
    }

    module.exports = { getStreams };
})();

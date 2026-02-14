
// 🎬 app.ts - Cliente MCP App para renderizar tarjetas de personajes de Rick and Morty

import { App } from "@modelcontextprotocol/ext-apps";

// ⚙️ Creamos la instancia de la app MCP
const app = new App({ name: "Rick and Morty character", version: "1.0.0" });

// 🔌 Establecemos comunicación con el host (VS Code, etc.)
app.connect();

let currentCharacterUrl = "";

// 📥 Handler que recibe el resultado de la herramienta desde el host
app.ontoolresult = (result) => {
    // 📝 Extraemos el texto del contenido
    const rawText = result.content?.find((c) => c.type === "text")?.text ?? "";
    
    try {
        // 🔄 Parseamos el JSON con los datos del personaje
        const { id, name, image, url, status, species, gender, origin, location, episode } = JSON.parse(rawText);
        
        if (id) {
            // 🔗 Construimos la URL del personaje
            currentCharacterUrl = url || `https://rickandmortyapi.com/api/character/${id}`;
            
            // 🔗 Actualizamos el enlace del personaje
            const characterLinkEl = document.getElementById("character-link") as HTMLAnchorElement;
            if (characterLinkEl) {
                characterLinkEl.href = currentCharacterUrl;
            }
        }

        if (name) {
            // 📝 Actualizamos el nombre del personaje
            const characterNameEl = document.getElementById("character-name");
            if (characterNameEl) {
                characterNameEl.textContent = name;
            }
        }

        if (status) {
            // 🔴 Actualizamos el estado
            const statusEl = document.getElementById("character-status") as HTMLElement;
            if (statusEl) {
                statusEl.textContent = status;
                statusEl.setAttribute("data-status", status);
            }
        }

        if (species) {
            // 👽 Actualizamos la especie
            const speciesEl = document.getElementById("character-species");
            if (speciesEl) {
                speciesEl.textContent = species;
            }
        }

        if (gender) {
            // ⚧ Actualizamos el género
            const genderEl = document.getElementById("character-gender");
            if (genderEl) {
                genderEl.textContent = gender;
            }
        }

        if (origin) {
            // 🌍 Actualizamos el origen
            const originEl = document.getElementById("character-origin");
            if (originEl) {
                originEl.textContent = origin.name || "-";
            }
        }

        if (location) {
            // 📍 Actualizamos la ubicación
            const locationEl = document.getElementById("character-location");
            if (locationEl) {
                locationEl.textContent = location.name || "-";
            }
        }

        if (image) {
            // 🖼️ Actualizamos la imagen (ahora es un data URL en base64)
            const imageEl = document.getElementById("character-image") as HTMLImageElement;
            if (imageEl) {
                // Usamos directamente el base64, sin necesidad de proxy
                imageEl.src = image;
                imageEl.alt = name || "Character";
            }
        }

        if (episode && Array.isArray(episode)) {
            // 📺 Actualizamos el número de episodios
            const episodesEl = document.getElementById("character-episodes");
            if (episodesEl) {
                episodesEl.textContent = `${episode.length} episodios`;
            }
        }

    } catch (e) {
        console.error("Error parsing character data:", e);
    }
};

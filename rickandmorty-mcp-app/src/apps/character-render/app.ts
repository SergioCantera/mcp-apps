
// 🎬 app.ts - MCP Client App for rendering Rick and Morty character cards

import { App } from "@modelcontextprotocol/ext-apps";

// ⚙️ Create the MCP app instance
const app = new App({ name: "Rick and Morty character", version: "1.0.0" });

// 🔌 Establish communication with the host (VS Code, etc.)
app.connect();

let currentCharacterUrl = "";

// 📥 Handler that receives the tool result from the host
app.ontoolresult = (result) => {
    // 📝 Extract the text from the content
    const rawText = result.content?.find((c) => c.type === "text")?.text ?? "";
    
    try {
        // 🔄 Parse the JSON with the character data
        const { id, name, image, url, status, species, gender, origin, location, episode } = JSON.parse(rawText);
        
        if (id) {
            // 🔗 Construct the character URL
            currentCharacterUrl = url || `https://rickandmortyapi.com/api/character/${id}`;
            
            // 🔗 Update the character link
            const characterLinkEl = document.getElementById("character-link") as HTMLAnchorElement;
            if (characterLinkEl) {
                characterLinkEl.href = currentCharacterUrl;
            }
        }

        if (name) {
            // 📝 Update the character name
            const characterNameEl = document.getElementById("character-name");
            if (characterNameEl) {
                characterNameEl.textContent = name;
            }
        }

        if (status) {
            // 🔴 Update the status
            const statusEl = document.getElementById("character-status") as HTMLElement;
            if (statusEl) {
                statusEl.textContent = status;
                statusEl.setAttribute("data-status", status);
            }
        }

        if (species) {
            // 👽 Update the species
            const speciesEl = document.getElementById("character-species");
            if (speciesEl) {
                speciesEl.textContent = species;
            }
        }

        if (gender) {
            // ⚧ Update the gender
            const genderEl = document.getElementById("character-gender");
            if (genderEl) {
                genderEl.textContent = gender;
            }
        }

        if (origin) {
            // 🌍 Update the origin
            const originEl = document.getElementById("character-origin");
            if (originEl) {
                originEl.textContent = origin.name || "-";
            }
        }

        if (location) {
            // 📍 Update the location
            const locationEl = document.getElementById("character-location");
            if (locationEl) {
                locationEl.textContent = location.name || "-";
            }
        }

        if (image) {
            // 🖼️ Update the image (now it's a base64 data URL)
            const imageEl = document.getElementById("character-image") as HTMLImageElement;
            if (imageEl) {
                // Use the base64 directly, no need for a proxy
                imageEl.src = image;
                imageEl.alt = name || "Character";
            }
        }

        if (episode && Array.isArray(episode)) {
            // 📺 Update the number of episodes
            const episodesEl = document.getElementById("character-episodes");
            if (episodesEl) {
                episodesEl.textContent = `${episode.length} episodes`;
            }
        }

    } catch (e) {
        console.error("Error parsing character data:", e);
    }
};

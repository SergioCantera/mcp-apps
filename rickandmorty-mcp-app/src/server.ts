// 🚀 src/server.ts - Servidor MCP con herramientas de https://rickandmortyapi.com/api


console.log("Starting MCP App server...");

// 📦 Importaciones del SDK de MCP
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod'; // 📋 Zod para validar los parámetros de entrada
import { searchCharacter } from './services/rickandmorty.js';
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

// 🎨 Importaciones para MCP Apps (herramientas con UI)
import {
  registerAppTool,    // 🔧 Registra una herramienta que tiene interfaz visual
  registerAppResource, // 📄 Registra el HTML que se mostrará al usuario
  RESOURCE_MIME_TYPE,  // 📝 Tipo MIME especial para recursos de MCP Apps
} from "@modelcontextprotocol/ext-apps/server";

// 🌐 Importaciones para el servidor HTTP
import cors from "cors";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";

// 🎨 Helper para convertir imagen a base64
async function imageUrlToBase64(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error(`Error converting image to base64: ${error}`);
    return null;
  }
}

function createMcpServer() {
  // ⚙️ Creamos la instancia del servidor MCP
  const server = new McpServer(
    {
      name: "Rick&Morty MCP Server",
      version: "1.0.0",
    }
);

  // 🔗 URIs de los recursos UI - El esquema ui:// indica al host que es un recurso de MCP App
  // La estructura del path es arbitraria, organízala como tenga sentido para tu app
  const characterResourceUri = "ui://get-character/character-render.html";

  // ============================================================================
  // 🎬 HERRAMIENTA: get-character
  // Busca un personaje en Rick and Morty y muestra una tarjeta con su información
  // ============================================================================

  // 🔧 Registramos la herramienta con UI asociada
  registerAppTool(
    server,
    "get-character", // 📛 Nombre único de la herramienta
    {
      title: "Search character in Rick and Morty API", // 🏷️ Título que verá el usuario
      description: "Searches for a character in Rick and Morty and returns its information.",
      // 📋 Esquema de entrada validado con Zod
      inputSchema: z.object({
        name: z.string().describe("Name of the character to search for"),
      }),
      // 🎨 Metadatos que vinculan esta herramienta con su recurso UI
      _meta: { ui: { resourceUri: characterResourceUri } },
    },
    // ⚡ Handler que se ejecuta cuando se invoca la herramienta
    async ({ name }) => {
      const character = await searchCharacter(name);
      
      // ❌ Si no se encuentra el personaje, devolvemos error
      if (!character) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: "No character found" }) }],
        };
      }
      
      // 🖼️ Convertimos la imagen a base64
      const imageBase64 = character.image ? await imageUrlToBase64(character.image) : null;
      
      // ✅ Devolvemos los datos del personaje como JSON
      // El HTML del recurso UI recibirá estos datos para renderizarlos
      return {
        content: [{ type: "text", text: JSON.stringify({
          characterId: character.id,
          name: character.name,
          image: imageBase64,  // 🖼️ Imagen como data URL en base64
          status: character.status,
          species: character.species,
          type: character.type,
          gender: character.gender,
          origin: character.origin,
          location: character.location,
          episode: character.episode,
          url: character.url,
          created: character.created,
        }) }],
      };
    },
  );

  // 📄 Registramos el recurso que sirve el HTML compilado para get-character
  registerAppResource(
    server,
    characterResourceUri, // 🔗 URI del recurso
    characterResourceUri, // 📛 Nombre del recurso
    { mimeType: RESOURCE_MIME_TYPE }, // 📝 Tipo MIME especial
    // ⚡ Handler que lee y devuelve el HTML
    async () => {
      const html = await fs.readFile(
        path.join(import.meta.dirname, "..", "dist", "src", "apps", "character-render", "index.html"),
        "utf-8",
      );
      return {
        contents: [
          { uri: characterResourceUri, mimeType: RESOURCE_MIME_TYPE, text: html },
        ],
      };
    },
  );
  return server;
}


// ============================================================================
// 🌐 SERVIDOR HTTP
// Exponemos el servidor MCP a través de HTTP con Express
// ============================================================================

const expressApp = express();
expressApp.use(cors());       // 🔓 Habilitamos CORS para peticiones cross-origin
expressApp.use(express.json()); // 📝 Parseamos el body como JSON

//  Endpoint principal de MCP - todas las peticiones van aquí
expressApp.post("/mcp", async (req, res) => {
  // 🚀 Creamos un transporte HTTP para esta petición
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Sin gestión de sesiones
    enableJsonResponse: true,      // Respuestas en JSON
  });
  
  // 🧹 Limpiamos el transporte cuando se cierre la conexión
  res.on("close", () => transport.close());
  
  // 🔌 Conectamos el servidor MCP al transporte
  const server = createMcpServer()
  await server.connect(transport);
  
  // ⚡ Procesamos la petición MCP
  await transport.handleRequest(req, res, req.body);
});

// 🎯 Arrancamos el servidor en el puerto 3001
expressApp.listen(3001, (err) => {
  if (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
  console.log("Server listening on http://localhost:3001/mcp");
});
// 🚀 src/server.ts - MCP Server with tools for https://rickandmortyapi.com/api


console.log("Starting MCP App server...");

// 📦 MCP SDK imports
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod'; // 📋 Zod para validar los parámetros de entrada
import { searchCharacter } from './services/rickandmorty.js';
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

// 🎨 MCP Apps imports (tools with UI)
import {
  registerAppTool,    // 🔧 Register a tool with a visual interface
  registerAppResource, // 📄 Register the HTML that will be shown to the user
  RESOURCE_MIME_TYPE,  // 📝 Special MIME type for MCP App resources
} from "@modelcontextprotocol/ext-apps/server";

// 🌐 HTTP server imports
import cors from "cors";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";

// 🎨 Helper to convert image to base64
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
  // ⚙️ Create the MCP server instance
  const server = new McpServer(
    {
      name: "Rick&Morty MCP Server",
      version: "1.0.0",
    }
);

  // 🔗 UI resource URIs - The ui:// scheme indicates to the host that it's an MCP App resource
  // The path structure is arbitrary, organize it as it makes sense for your app
  const characterResourceUri = "ui://get-character/character-render.html";

  // ============================================================================
  // 🎬 TOOL: get-character
  // Searches for a character in Rick and Morty and displays a card with its information
  // ============================================================================

  // 🔧 Register the tool with its associated UI
  registerAppTool(
    server,
    "get-character", // 📛 Unique name of the tool
    {
      title: "Search character in Rick and Morty API", // 🏷️ Title visible to the user
      description: "Searches for a character in Rick and Morty and returns its information.",
      // 📋 Input schema validated with Zod
      inputSchema: z.object({
        name: z.string().describe("Name of the character to search for"),
      }),
      // 🎨 Metadata linking this tool to its UI resource
      _meta: { ui: { resourceUri: characterResourceUri } },
    },
    // ⚡ Handler executed when the tool is invoked
    async ({ name }) => {
      const character = await searchCharacter(name);
      
      // ❌ If the character is not found, return an error
      if (!character) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: "No character found" }) }],
        };
      }
      
      // 🖼️ Convert the image to base64
      const imageBase64 = character.image ? await imageUrlToBase64(character.image) : null;
      
      // ✅ Return the character data as JSON
      // The HTML of the UI resource will receive this data to render it
      return {
        content: [{ type: "text", text: JSON.stringify({
          characterId: character.id,
          name: character.name,
          image: imageBase64,  // 🖼️ Image as a base64 data URL
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

  // 📄 Register the resource that serves the compiled HTML for get-character
  registerAppResource(
    server,
    characterResourceUri, // 🔗 URI of the resource
    characterResourceUri, // 📛 Name of the resource
    { mimeType: RESOURCE_MIME_TYPE }, // 📝 Special MIME type
    // ⚡ Handler that reads and returns the HTML
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
// 🌐 HTTP SERVER
// Expose the MCP server via HTTP with Express
// ============================================================================

const expressApp = express();
expressApp.use(cors());       // 🔓 Enable CORS for cross-origin requests
expressApp.use(express.json()); // 📝 Parse the body as JSON

//  Main MCP endpoint - all requests go here
expressApp.post("/mcp", async (req, res) => {
  // 🚀 Create an HTTP transport for this request
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // No session management
    enableJsonResponse: true,      // JSON responses
  });
  
  // 🧹 Clean up the transport when the connection is closed
  res.on("close", () => transport.close());
  
  // 🔌 Connect the MCP server to the transport
  const server = createMcpServer()
  await server.connect(transport);
  
  // ⚡ Process the MCP request
  await transport.handleRequest(req, res, req.body);
});

// 🎯 Start the server on port 3001
expressApp.listen(3001, (err) => {
  if (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
  console.log("Server listening on http://localhost:3001/mcp");
});
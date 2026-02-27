// 🌤️ src/server.ts - MCP Server with weather tools

console.log("Starting Weather MCP App server...");

// 📦 MCP SDK imports
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod'; // 📋 Zod para validar los parámetros de entrada
import { createWeatherService, WeatherData } from "./services/weatherService.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

// 🎨 MCP Apps imports (tools with UI)
import {
  registerAppTool,    // 🔧 Registers a tool with a visual interface
  registerAppResource, // 📄 Registers the HTML to be displayed to the user
  RESOURCE_MIME_TYPE,  // 📝 Special MIME type for MCP Apps resources
} from "@modelcontextprotocol/ext-apps/server";

// 🌐 HTTP server imports
import cors from "cors";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";

// Configuration
const WEATHER_API_BASE_URL =
  process.env.WEATHER_API_BASE_URL || "https://api.open-meteo.com/v1";
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || "";
const WEATHER_API_PROVIDER =
  (process.env.WEATHER_API_PROVIDER as "openweathermap" | "weatherapi" | "meteo" | "custom") || "custom";

// Initialize weather service
const weatherService = createWeatherService({
  baseURL: WEATHER_API_BASE_URL,
  apiKey: WEATHER_API_KEY,
  apiProvider: WEATHER_API_PROVIDER,
});

// Helper function to format weather data
function formatWeatherResponse(weather: WeatherData): string {
  return JSON.stringify({
    location: weather.location,
    temperature: weather.temperature,
    condition: weather.condition,
    humidity: weather.humidity,
    windSpeed: weather.windSpeed,
    feelsLike: weather.feelsLike,
    pressure: weather.pressure,
    visibility: weather.visibility,
    uvIndex: weather.uvIndex,
    icon: weather.icon,
    timestamp: weather.timestamp,
  });
}

function createMcpServer() {
  // ⚙️ Create MCP server instance
  const server = new McpServer({
    name: "Weather MCP Server",
    version: "1.0.0",
  });

  // 🔗 URI of the UI resource
  const weatherResourceUri = "ui://get-weather/weather-app.html";

  // ============================================================================
  // 🎬 TOOL: get-weather
  // Fetches weather information for a location
  // ============================================================================

  // 🔧 Register the tool with associated UI
  (registerAppTool as any)(
    server,
    "get_weather", // 📛 Unique name of the tool
    {
      title: "Get Weather", // 🏷️ Title visible to the user
      description: "Fetch current weather, forecast, or weather alerts for a location",
      // 📋 Input schema validated with Zod
      inputSchema: z.object({
        location: z.string().describe("City name or location (e.g., 'New York', 'London', 'Tokyo')"),
        type: z.enum(["current", "forecast", "alerts"]).describe("Type of weather data to retrieve"),
      }),
      // 🎨 Metadata linking this tool to its UI resource
      _meta: { ui: { resourceUri: weatherResourceUri } },
    },
    // ⚡ Handler executed when the tool is invoked
    async ({ location, type = "current" }: any) => {
      try {
        let result;
        switch (type) {
          case "forecast":
            result = await weatherService.getForecast(location, 5);
            break;
          case "alerts":
            const alerts = await weatherService.getAlerts(location);
            result = { location, alerts };
            break;
          case "current":
          default:
            result = await weatherService.getCurrentWeather(location);
        }

        // Format response for the UI
        const responseText =
          type === "current"
            ? formatWeatherResponse(result as WeatherData)
            : JSON.stringify(result);

        return {
          content: [{ type: "text", text: responseText }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: error.message }) }],
          isError: true,
        };
      }
    },
  );

  // 📄 Register the resource that serves the compiled HTML for get-weather
  registerAppResource(
    server,
    weatherResourceUri, // 🔗 URI of the resource
    weatherResourceUri, // 📛 Name of the resource
    { mimeType: RESOURCE_MIME_TYPE }, // 📝 Special MIME type
    // ⚡ Handler that reads and returns the HTML
    async () => {
      const html = await fs.readFile(
        path.join(import.meta.dirname, "..", "dist", "src", "apps", "weather-app", "index.html"),
        "utf-8",
      );
      return {
        contents: [
          { uri: weatherResourceUri, mimeType: RESOURCE_MIME_TYPE, text: html },
        ],
      };
    },
  );

  return server;
}

// ============================================================================
// 🌐 HTTP SERVER
// Expose the MCP server via HTTP using Express
// ============================================================================

const expressApp = express();
expressApp.use(cors());       // 🔓 Enable CORS for cross-origin requests
expressApp.use(express.json()); // 📝 Parse the body as JSON

// 📡 Main MCP endpoint - all requests go here
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

// Health check endpoint
expressApp.get("/health", (req, res) => {
  res.json({ status: "ok", service: "weather-mcp" });
});

// 🎯 Start the server on port 3001
const PORT = parseInt(process.env.PORT || "3002", 10);
expressApp.listen(PORT, (err?: Error) => {
  if (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
  console.log(`🌤️  Weather MCP Server running at http://localhost:${PORT}`);
  console.log(`📡 MCP endpoint: POST http://localhost:${PORT}/mcp`);
  console.log(`❤️  Health check: GET http://localhost:${PORT}/health`);
});

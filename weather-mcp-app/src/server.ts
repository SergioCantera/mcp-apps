// 🌤️ src/server.ts - Servidor MCP con herramientas del clima

console.log("Starting Weather MCP App server...");

// 📦 Importaciones del SDK de MCP
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod'; // 📋 Zod para validar los parámetros de entrada
import { createWeatherService, WeatherData } from "./services/weatherService.js";
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
  // ⚙️ Creamos la instancia del servidor MCP
  const server = new McpServer({
    name: "Weather MCP Server",
    version: "1.0.0",
  });

  // 🔗 URI del recurso UI
  const weatherResourceUri = "ui://get-weather/weather-app.html";

  // ============================================================================
  // 🎬 HERRAMIENTA: get-weather
  // Obtiene información del clima para una ubicación
  // ============================================================================

  // 🔧 Registramos la herramienta con UI asociada
  (registerAppTool as any)(
    server,
    "get_weather", // 📛 Nombre único de la herramienta
    {
      title: "Get Weather", // 🏷️ Título que verá el usuario
      description: "Fetch current weather, forecast, or weather alerts for a location",
      // 📋 Esquema de entrada validado con Zod
      inputSchema: z.object({
        location: z.string().describe("City name or location (e.g., 'New York', 'London', 'Tokyo')"),
        type: z.enum(["current", "forecast", "alerts"]).describe("Type of weather data to retrieve"),
      }),
      // 🎨 Metadatos que vinculan esta herramienta con su recurso UI
      _meta: { ui: { resourceUri: weatherResourceUri } },
    },
    // ⚡ Handler que se ejecuta cuando se invoca la herramienta
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

  // 📄 Registramos el recurso que sirve el HTML compilado para get-weather
  registerAppResource(
    server,
    weatherResourceUri, // 🔗 URI del recurso
    weatherResourceUri, // 📛 Nombre del recurso
    { mimeType: RESOURCE_MIME_TYPE }, // 📝 Tipo MIME especial
    // ⚡ Handler que lee y devuelve el HTML
    async () => {
      const html = await fs.readFile(
        path.join(import.meta.dirname, "dist", "src", "apps", "weather-app", "index.html"),
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
// 🌐 SERVIDOR HTTP
// Exponemos el servidor MCP a través de HTTP con Express
// ============================================================================

const expressApp = express();
expressApp.use(cors());       // 🔓 Habilitamos CORS para peticiones cross-origin
expressApp.use(express.json()); // 📝 Parseamos el body como JSON

// 📡 Endpoint principal de MCP - todas las peticiones van aquí
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

// Health check endpoint
expressApp.get("/health", (req, res) => {
  res.json({ status: "ok", service: "weather-mcp" });
});

// 🎯 Arrancamos el servidor en el puerto 3001
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

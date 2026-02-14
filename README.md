# MCP App

A Model Context Protocol (MCP) application that provides interactive data visualization. Built with TypeScript, React, and the MCP Apps SDK.

## 🌟 Features

- **Interactive UI** - Beautiful, responsive display integrated with MCP hosts (Claude Desktop, etc.)
- **API-Agnostic Design** - Prepared to work with API (RickAndMorty API, OpenWeatherMap, etc.)
- **MCP Tool Integration** - Exposes data as MCP tools callable by AI models
- **Host Styling** - Automatically adapts to host theme using CSS variables
- **Type-Safe** - Full TypeScript support with Zod validation
- **Single-File Bundle** - React app bundled into a single HTML file for easy deployment

## 📋 Project Structure

```
mcp-app/
├── src/
│   ├── services/
│   │   ├── apiClient.ts         # Generic HTTP API client
│   │   └── Service.ts           # Service abstraction
│   ├── mcp-app.tsx              # React MCP App component
│   ├── styles.css               # Component styles (host variables)
│   └── main.tsx                 # React entry point
├── server.ts                    # MCP server with tool/resource registration
├── index.html                   # HTML entry point
├── vite.config.ts               # Vite config with singlefile plugin
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies and scripts
├── .env.example                 # Environment variables template
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API

Copy the example environment file and configure your API:

```bash
cp .env.example .env
```

Edit `.env` to set your API credentials:

```env
# Example: Using Open-Meteo (free, no API key needed)
WEATHER_API_BASE_URL=https://api.open-meteo.com/v1
WEATHER_API_PROVIDER=meteo

# Or use RickAndMorty API (free, no API key needed)
WEATHER_API_BASE_URL=https://rickandmortyapi.com/api
WEATHER_API_PROVIDER=rickandmorty
```

### 3. Build the App

```bash
npm run build
```

This bundles the React app into a single HTML file in `dist/`.

### 4. Start the MCP Server

```bash
npm run serve
```

The server will start on steamable http (for MCP host integration).

### 5. Test Locally (Optional)

In one terminal, start the dev server:

```bash
npm run dev
```

In another terminal, start the MCP server:

```bash
npm run serve
```

## 🔧 How It Works

### Architecture

```
LLM/Host
  ↓
MCP Server (server.ts)
  ├─→ Tool: get_example
  │    └─→ Calls ExampleService
  │         └─→ Calls Example API
  └─→ Resource: example-ui
       └─→ Serves bundled React app (dist/index.html)
         └─→ Displays tool results interactively
```

### Three Key Parts

1. **MCP Tool** (`server.ts` - `get_example`)
   - Takes location and weather type as input
   - Calls the example API via ExampleService
   - Returns formatted JSON

2. **ExampleService** (`src/services/exampleService.ts`)
   - Abstracts example data fetching
   - Handles API normalization
   - Framework for supporting multiple providers

3. **React Component** (`src/mcp-app.tsx`)
   - Receives tool input/output via `useApp` hook
   - Displays example data beautifully
   - Uses host CSS variables for theme integration

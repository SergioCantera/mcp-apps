import React from "react";
import ReactDOM from "react-dom/client";
import WeatherApp from "./mcp-app";

ReactDOM.createRoot(document.getElementById("app")!).render(
  <React.StrictMode>
    <WeatherApp />
  </React.StrictMode>
);

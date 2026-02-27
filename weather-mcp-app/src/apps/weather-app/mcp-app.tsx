import { useState } from "react";
import {
  useApp,
  useHostStyles,
} from "@modelcontextprotocol/ext-apps/react";
import "./styles.css";

interface CurrentWeather {
  location: string;
  temperature: number;
  condition: string;
  humidity?: number;
  windSpeed?: number;
  feelsLike?: number;
  pressure?: number;
  visibility?: number;
  uvIndex?: number;
  icon?: string;
  timestamp?: string;
}

interface ForecastDay {
  date: string;
  high: number;
  low: number;
  condition: string;
  icon: string;
  precipitation: number;
}

interface ForecastWeather {
  location: string;
  forecast: ForecastDay[];
}

type WeatherResult = CurrentWeather | ForecastWeather;

interface ToolInput {
  location: string;
  type?: "current" | "forecast" | "alerts";
}

const appInfo = {
  name: "Weather MCP App",
  version: "1.0.0",
};

const capabilities = {};

// Helper to check if weather data is forecast
function isForecast(weather: WeatherResult): weather is ForecastWeather {
  return "forecast" in weather && Array.isArray(weather.forecast);
}

// Helper to check if weather data is current
function isCurrent(weather: WeatherResult): weather is CurrentWeather {
  return "temperature" in weather && typeof weather.temperature === "number";
}

export default function WeatherApp() {
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentInput, setCurrentInput] = useState<ToolInput | null>(null);

  const { app } = useApp({
    appInfo,
    capabilities,
    onAppCreated: (appInstance) => {
      // Register all handlers after app is created
      appInstance.ontoolinput = (params: any) => handleToolInput(params);
      appInstance.ontoolresult = (result: any) => handleToolResult(result);
      appInstance.onhostcontextchanged = (context: any) =>
        handleHostContextChanged(context);
    },
  });

  // Apply host styles
  useHostStyles(app);

  const handleToolInput = (params: { arguments?: ToolInput }) => {
    const input = params.arguments;
    if (input) {
      setCurrentInput(input);
      setLoading(true);
      setError(null);
    }
  };

  const handleToolResult = (result: {
    content: Array<{ type: string; text?: string }>;
  }) => {
    setLoading(false);

    // Extract text content from tool result
    const textContent = result.content?.find((c) => c.type === "text");
    if (textContent && textContent.text) {
      try {
        const weatherData = JSON.parse(textContent.text);
        setWeather(weatherData);
      } catch (e) {
        setError(`Failed to parse weather data: ${e}`);
      }
    }
  };

  const handleHostContextChanged = (context: any) => {
    if (context.theme) {
      document.documentElement.setAttribute("data-theme", context.theme);
    }
    if (context.safeAreaInsets) {
      const { top, right, bottom, left } = context.safeAreaInsets;
      document.body.style.padding = `${top}px ${right}px ${bottom}px ${left}px`;
    }
  };

  return (
    <div className="weather-app">
      <div className="container">
        <h1>🌤️ Weather</h1>

        {loading && (
          <div className="loading">
            <p>Fetching weather data...</p>
            <div className="spinner"></div>
          </div>
        )}

        {error && (
          <div className="error">
            <p>{error}</p>
          </div>
        )}

        {weather && !loading && isCurrent(weather) && (
          <div className="weather-card">
            <div className="location">{weather.location}</div>

            <div className="main-temp">
              <span className="temperature">{Math.round(weather.temperature)}°</span>
              {weather.icon && <span className="icon">{weather.icon}</span>}
            </div>

            <div className="condition">{weather.condition}</div>

            {weather.feelsLike && (
              <div className="feels-like">
                Feels like {Math.round(weather.feelsLike)}°
              </div>
            )}

            <div className="details">
              {weather.humidity !== undefined && (
                <div className="detail-item">
                  <span className="label">Humidity</span>
                  <span className="value">{weather.humidity}%</span>
                </div>
              )}
              {weather.windSpeed !== undefined && (
                <div className="detail-item">
                  <span className="label">Wind</span>
                  <span className="value">{weather.windSpeed} m/s</span>
                </div>
              )}
              {weather.pressure !== undefined && (
                <div className="detail-item">
                  <span className="label">Pressure</span>
                  <span className="value">{weather.pressure} hPa</span>
                </div>
              )}
              {weather.visibility !== undefined && (
                <div className="detail-item">
                  <span className="label">Visibility</span>
                  <span className="value">{(weather.visibility / 1000).toFixed(1)} km</span>
                </div>
              )}
            </div>
          </div>
        )}

        {weather && !loading && isForecast(weather) && (
          <div className="forecast-card">
            <div className="location">{weather.location}</div>
            <h2>7-Day Forecast</h2>
            <div className="forecast-grid">
              {weather.forecast.map((day) => (
                <div key={day.date} className="forecast-day">
                  <div className="forecast-date">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="forecast-icon">{day.icon}</div>
                  <div className="forecast-temps">
                    <span className="high">{Math.round(day.high)}°</span>
                    <span className="low">{Math.round(day.low)}°</span>
                  </div>
                  <div className="forecast-condition">{day.condition}</div>
                  {day.precipitation > 0 && (
                    <div className="forecast-precip">💧 {day.precipitation}mm</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!weather && !loading && !error && (
          <div className="placeholder">
            <p>Weather data will appear here when you fetch it.</p>
            <p className="hint">
              The MCP tool will populate this view with weather information.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

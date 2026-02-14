import ApiClient, { ApiConfig } from "./apiClient";

export interface WeatherData {
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

export interface ForecastData {
  location: string;
  forecast: Array<{
    date: string;
    high: number;
    low: number;
    condition: string;
    icon?: string;
    precipitation?: number;
  }>;
}

export interface WeatherServiceConfig extends ApiConfig {
  apiProvider?: "openweathermap" | "weatherapi" | "meteo" | "custom";
}

/**
 * WeatherService - Abstracted weather API integration
 * Prepared to work with any weather API provider
 * Currently configured for Open-Meteo by default
 */
export class WeatherService {
  private apiClient: ApiClient;
  private apiProvider: string;
  private geocodeCache: Map<string, { lat: number; lon: number }> = new Map();

  constructor(config: WeatherServiceConfig) {
    this.apiProvider = config.apiProvider || "custom";
    this.apiClient = new ApiClient(config);
  }

  /**
   * Get coordinates for a location (Open-Meteo geocoding)
   */
  private async getCoordinates(
    location: string
  ): Promise<{ lat: number; lon: number; name: string }> {
    // Check cache first
    const cached = this.geocodeCache.get(location.toLowerCase());
    if (cached) {
      return { ...cached, name: location };
    }

    try {
      // Use Open-Meteo Geocoding API
      const response = await this.apiClient.get<any>(
        "https://geocoding-api.open-meteo.com/v1/search",
        {
          name: location,
          count: 1,
          language: "en",
          format: "json",
        }
      );

      if (response.results && response.results.length > 0) {
        const result = response.results[0];
        const coords = { lat: result.latitude, lon: result.longitude };
        this.geocodeCache.set(location.toLowerCase(), coords);
        return {
          lat: result.latitude,
          lon: result.longitude,
          name: result.name + (result.admin1 ? `, ${result.admin1}` : ""),
        };
      }
      throw new Error(`Location "${location}" not found`);
    } catch (error) {
      throw new Error(`Failed to geocode location "${location}": ${error}`);
    }
  }

  /**
   * Get current weather for a location (Open-Meteo)
   */
  async getCurrentWeather(location: string): Promise<WeatherData> {
    try {
      const coords = await this.getCoordinates(location);

      // Fetch weather data from Open-Meteo
      const data = await this.apiClient.get<any>(
        "https://api.open-meteo.com/v1/forecast",
        {
          latitude: coords.lat,
          longitude: coords.lon,
          current:
            "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,pressure_msl,visibility",
          temperature_unit: "celsius",
        }
      );

      return this.normalizeWeatherData(data, coords.name);
    } catch (error) {
      throw new Error(`Failed to fetch current weather for ${location}: ${error}`);
    }
  }

  /**
   * Get weather forecast for a location (Open-Meteo)
   */
  async getForecast(
    location: string,
    days?: number
  ): Promise<ForecastData> {
    try {
      const coords = await this.getCoordinates(location);

      const data = await this.apiClient.get<any>(
        "https://api.open-meteo.com/v1/forecast",
        {
          latitude: coords.lat,
          longitude: coords.lon,
          daily:
            "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
          temperature_unit: "celsius",
          days: days || 7,
        }
      );

      return this.normalizeForecastData(data, coords.name);
    } catch (error) {
      throw new Error(`Failed to fetch forecast for ${location}: ${error}`);
    }
  }

  /**
   * Get weather alerts for a location (if available)
   */
  async getAlerts(location: string): Promise<string[]> {
    try {
      const data = await this.apiClient.get<any>("/alerts", {
        q: location,
      });

      return data.alerts || [];
    } catch (error) {
      console.warn(`No alerts available for ${location}`);
      return [];
    }
  }

  /**
   * Normalize weather data from the API response - Open-Meteo format
   */
  private normalizeWeatherData(data: any, location: string): WeatherData {
    const current = data.current;
    if (!current) {
      throw new Error("Invalid weather data response");
    }

    const weatherCodes: Record<number, string> = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Foggy",
      48: "Foggy",
      51: "Light drizzle",
      53: "Moderate drizzle",
      55: "Dense drizzle",
      61: "Slight rain",
      63: "Moderate rain",
      65: "Heavy rain",
      71: "Slight snow",
      73: "Moderate snow",
      75: "Heavy snow",
      80: "Slight rain showers",
      81: "Moderate rain showers",
      82: "Violent rain showers",
      95: "Thunderstorm",
      96: "Thunderstorm with hail",
      99: "Thunderstorm with hail",
    };

    return {
      location,
      temperature: current.temperature_2m || 0,
      condition: weatherCodes[current.weather_code] || "Unknown",
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      feelsLike: current.apparent_temperature,
      pressure: current.pressure_msl,
      visibility: current.visibility,
      icon: this.getWeatherIcon(current.weather_code),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Normalize forecast data from the API response - Open-Meteo format
   */
  private normalizeForecastData(data: any, location: string): ForecastData {
    const daily = data.daily;
    if (!daily || !daily.time) {
      throw new Error("Invalid forecast data response");
    }

    const weatherCodes: Record<number, string> = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Foggy",
      48: "Foggy",
      51: "Light drizzle",
      53: "Moderate drizzle",
      55: "Dense drizzle",
      61: "Slight rain",
      63: "Moderate rain",
      65: "Heavy rain",
      71: "Slight snow",
      73: "Moderate snow",
      75: "Heavy snow",
      80: "Slight rain showers",
      81: "Moderate rain showers",
      82: "Violent rain showers",
      95: "Thunderstorm",
      96: "Thunderstorm with hail",
      99: "Thunderstorm with hail",
    };

    const forecast = daily.time.map((date: string, index: number) => ({
      date,
      high: daily.temperature_2m_max[index],
      low: daily.temperature_2m_min[index],
      condition: weatherCodes[daily.weather_code[index]] || "Unknown",
      icon: this.getWeatherIcon(daily.weather_code[index]),
      precipitation: daily.precipitation_sum[index],
    }));

    return { location, forecast };
  }

  /**
   * Map WMO weather codes to emoji icons
   */
  private getWeatherIcon(code: number): string {
    const iconMap: Record<number, string> = {
      0: "☀️",
      1: "🌤️",
      2: "⛅",
      3: "☁️",
      45: "🌫️",
      48: "🌫️",
      51: "🌦️",
      53: "🌧️",
      55: "🌧️",
      61: "🌧️",
      63: "🌧️",
      65: "⛈️",
      71: "❄️",
      73: "❄️",
      75: "❄️",
      80: "🌧️",
      81: "⛈️",
      82: "⛈️",
      95: "⛈️",
      96: "⛈️",
      99: "⛈️",
    };
    return iconMap[code] || "🌤️";
  }

  /**
   * Update API configuration (e.g., API key)
   */
  updateConfig(config: Partial<WeatherServiceConfig>) {
    if (config.apiKey) {
      this.apiClient.setAuthHeader(config.apiKey);
    }
    if (config.apiProvider) {
      this.apiProvider = config.apiProvider;
    }
  }
}

// Export a factory function to create configured instances
export function createWeatherService(
  config: WeatherServiceConfig
): WeatherService {
  return new WeatherService(config);
}

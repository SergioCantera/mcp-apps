/\*\*

- Weather API Configuration Guide
-
- This file provides provider-specific implementation examples for integrating
- different weather APIs with the WeatherService.
-
- Choose your preferred API provider and follow the integration steps.
  \*/

/\*\*

- ============================================================================
- OPTION 1: OPEN-METEO (RECOMMENDED - Free, No API Key Required)
- ============================================================================
-
- Features:
- - Free weather data (no registration required)
- - No API key needed
- - Good coverage and accuracy
- - Rate limits: 10,000 calls/day free
-
- Setup:
- 1.  No signup required - just use it!
- 2.  Set in .env:
- WEATHER_API_BASE_URL=https://api.open-meteo.com/v1
- WEATHER_API_PROVIDER=meteo
-
- 3.  Update normalizeWeatherData() in src/services/weatherService.ts:
      \*/

/\*
export async function normalizeWeatherDataOpenMeteo(data: any): Promise<WeatherData> {
// Open-Meteo response format:
// {
// "latitude": 40.7128,
// "longitude": -74.0060,
// "generationtime_ms": 0.123,
// "utc_offset_seconds": -18000,
// "timezone": "America/New_York",
// "current": {
// "time": "2024-01-01T12:00",
// "temperature": 25.5,
// "relative_humidity": 65,
// "weather_code": 2,
// "wind_speed_10m": 12.5
// }
// }

return {
location: `${data.latitude}, ${data.longitude}`, // Note: API doesn't return location name
temperature: data.current?.temperature || 0,
condition: interpretWeatherCode(data.current?.weather_code),
humidity: data.current?.relative_humidity,
windSpeed: data.current?.wind_speed_10m,
feelsLike: data.current?.apparent_temperature,
timestamp: new Date().toISOString(),
};
}

function interpretWeatherCode(code: number): string {
// WMO Weather interpretation codes
const codes: Record<number, string> = {
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
return codes[code] || "Unknown";
}
\*/

/\*\*

- ============================================================================
- OPTION 2: OpenWeatherMap.org
- ============================================================================
-
- Features:
- - Comprehensive weather data
- - Free tier available (5-day forecast, 60 calls/minute)
- - Paid plans for more features
- - Good documentation
-
- Setup:
- 1.  Sign up at https://openweathermap.org/api
- 2.  Get your free API key
- 3.  Set in .env:
- WEATHER_API_BASE_URL=https://api.openweathermap.org/data/2.5
- WEATHER_API_KEY=your_api_key_here
- WEATHER_API_PROVIDER=openweathermap
-
- 4.  Update normalizeWeatherData() in src/services/weatherService.ts:
      \*/

/\*
export async function normalizeWeatherDataOpenWeatherMap(data: any): Promise<WeatherData> {
// OpenWeatherMap response format:
// {
// "coord": { "lon": -74.006, "lat": 40.7128 },
// "weather": [{ "id": 500, "main": "Rain", "description": "light rain" }],
// "main": {
// "temp": 25.5,
// "feels_like": 23.8,
// "temp_min": 22.0,
// "temp_max": 28.0,
// "pressure": 1013,
// "humidity": 65
// },
// "wind": { "speed": 12.5, "deg": 270 },
// "visibility": 10000,
// "clouds": { "all": 50 },
// "name": "New York"
// }

return {
location: data.name,
temperature: data.main?.temp || 0,
condition: data.weather?.[0]?.main || "Unknown",
humidity: data.main?.humidity,
windSpeed: data.wind?.speed,
feelsLike: data.main?.feels_like,
pressure: data.main?.pressure,
visibility: data.visibility ? data.visibility / 1000 : undefined, // Convert to km
icon: mapOpenWeatherMapIcon(data.weather?.[0]?.icon),
timestamp: new Date().toISOString(),
};
}

function mapOpenWeatherMapIcon(iconCode: string): string {
const iconMap: Record<string, string> = {
'01d': '☀️',
'01n': '🌙',
'02d': '⛅',
'02n': '☁️',
'03d': '☁️',
'03n': '☁️',
'04d': '☁️',
'04n': '☁️',
'09d': '🌧️',
'09n': '🌧️',
'10d': '🌧️',
'10n': '🌧️',
'11d': '⛈️',
'11n': '⛈️',
'13d': '❄️',
'13n': '❄️',
'50d': '🌫️',
'50n': '🌫️',
};
return iconMap[iconCode] || '☁️';
}
\*/

/\*\*

- ============================================================================
- OPTION 3: WeatherAPI
- ============================================================================
-
- Features:
- - Easy to use API
- - Free tier: 1 million calls/month
- - Good forecast accuracy
- - Simple documentation
-
- Setup:
- 1.  Sign up at https://www.weatherapi.com/
- 2.  Get your free API key
- 3.  Set in .env:
- WEATHER_API_BASE_URL=https://api.weatherapi.com/v1
- WEATHER_API_KEY=your_api_key_here
- WEATHER_API_PROVIDER=weatherapi
-
- 4.  Update normalizeWeatherData() in src/services/weatherService.ts:
      \*/

/\*
export async function normalizeWeatherDataWeatherAPI(data: any): Promise<WeatherData> {
// WeatherAPI response format:
// {
// "location": {
// "name": "New York",
// "region": "New York",
// "country": "United States",
// "lat": 40.7128,
// "lon": -74.006,
// "tz_id": "America/New_York",
// "localtime_epoch": 1704110400,
// "localtime": "2024-01-01 12:00"
// },
// "current": {
// "temp_c": 25.5,
// "condition": { "text": "Partly cloudy", "icon": "..." },
// "humidity": 65,
// "wind_kph": 45,
// "feelslike_c": 23.8,
// "pressure_mb": 1013,
// "vis_km": 10,
// "uv": 5
// }
// }

return {
location: data.location?.name,
temperature: data.current?.temp_c || 0,
condition: data.current?.condition?.text || "Unknown",
humidity: data.current?.humidity,
windSpeed: data.current?.wind_kph ? data.current.wind_kph / 3.6 : undefined, // Convert to m/s
feelsLike: data.current?.feelslike_c,
pressure: data.current?.pressure_mb,
visibility: data.current?.vis_km,
uvIndex: data.current?.uv,
icon: data.current?.condition?.icon,
timestamp: new Date().toISOString(),
};
}
\*/

/\*\*

- ============================================================================
- OPTION 4: Custom API
- ============================================================================
-
- If you want to use a different weather API:
-
- 1.  Create your own normalizeWeatherData function
- 2.  Implement the function based on your API's response format
- 3.  Update the apiClient.ts if custom auth headers are needed
- 4.  Set in .env:
- WEATHER_API_BASE_URL=your_api_base_url
- WEATHER_API_KEY=your_api_key
- WEATHER_API_PROVIDER=custom
  \*/

/\*\*

- ============================================================================
- IMPLEMENTATION INSTRUCTIONS
- ============================================================================
-
- To integrate your chosen weather API:
-
- 1.  Choose your API provider from the options above
- 2.  Configure .env with the API credentials
- 3.  Update src/services/weatherService.ts:
- - Implement normalizeWeatherData() for your API's response format
- - Update normalizeForecastData() if using forecast endpoint
- 4.  Test with: npm run build && npm run serve
- 5.  Call the tool with: { "location": "London" }
-
- The weatherService.ts file is designed to be flexible and support
- multiple providers. You can also add provider detection logic to
- automatically format the response based on the configured provider.
  \*/

export default {};

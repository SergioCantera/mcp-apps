import axios, { AxiosInstance } from "axios";

export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  apiKey?: string;
}

export class ApiClient {
  private client: AxiosInstance;

  constructor(config: ApiConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: config.headers || {},
    });

    // Add API key to headers if provided
    if (config.apiKey) {
      this.client.defaults.headers.common["Authorization"] =
        `Bearer ${config.apiKey}`;
    }
  }

  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    // If URL is absolute, axios will use it directly instead of baseURL
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(
    url: string,
    data?: any,
    params?: Record<string, any>
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, { params });
    return response.data;
  }

  setAuthHeader(token: string) {
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  setHeader(key: string, value: string) {
    this.client.defaults.headers.common[key] = value;
  }
}

export default ApiClient;

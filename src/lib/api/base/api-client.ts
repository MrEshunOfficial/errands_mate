// api/base/api-client.ts

interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export interface APIError extends Error {
  status?: number;
  code?: string;
}

// Add API Response wrapper type
export interface APIResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export abstract class APIClient {
  protected baseURL: string;
  protected defaultHeaders: HeadersInit;

  constructor(baseURL?: string) {
    this.baseURL = this.resolveBaseURL(baseURL);
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  /**
   * Resolve base URL with smart defaults for development and production
   */
  private resolveBaseURL(providedURL?: string): string {
    // 1. Use explicitly provided URL
    if (providedURL) {
      return providedURL;
    }

    // 2. Use environment variable if set
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }

    if (process.env.NEXT_PUBLIC_BACKEND_URL) {
      return process.env.NEXT_PUBLIC_BACKEND_URL;
    }

    // 3. In browser, use current origin (works for both dev and production)
    if (typeof window !== "undefined") {
      return window.location.origin;
    }

    // 4. Server-side fallback for development
    return "http://localhost:3000";
  }

  /**
   * Get authentication token from storage
   */
  protected getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return (
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
    );
  }

  /**
   * Build headers with authentication
   */
  protected buildHeaders(customHeaders?: HeadersInit): HeadersInit {
    const headers: HeadersInit = {
      ...this.defaultHeaders,
      ...customHeaders,
    };

    const token = this.getAuthToken();
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Build URL with query parameters
   */
  protected buildURL(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): string {
    let url: URL;

    try {
      // Handle absolute URLs
      if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
        url = new URL(endpoint);
      } else {
        // Handle relative URLs
        url = new URL(endpoint, this.baseURL);
      }
    } catch {
      throw new Error(
        `Failed to construct URL. Base: "${this.baseURL}", Endpoint: "${endpoint}". ` +
          `Ensure NEXT_PUBLIC_API_URL is set or the endpoint is valid.`,
      );
    }

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Make HTTP request - automatically unwraps { data: ... } responses
   */
  // api/base/api-client.ts

  protected async makeRequest<T>(
    endpoint: string,
    config: RequestConfig = {},
  ): Promise<T> {
    const { params, headers: customHeaders, ...fetchConfig } = config;

    const url = this.buildURL(endpoint, params);
    const headers = this.buildHeaders(customHeaders);

    try {
      const response = await fetch(url, {
        ...fetchConfig,
        headers,
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const responseData = await response.json();

      // Unwrap only the standard { data: ... } envelope used by some endpoints.
      // Do NOT unwrap based on entity keys (e.g. "booking") because sibling
      // fields like "context" would be silently discarded.
      if (responseData?.data !== undefined) {
        return responseData.data as T;
      }

      return responseData as T;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * Handle error responses
   */
  protected async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `HTTP Error: ${response.status}`;
    let errorCode = `HTTP_${response.status}`;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
      errorCode = errorData.code || errorCode;
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }

    const error = new Error(errorMessage) as APIError;
    error.status = response.status;
    error.code = errorCode;

    throw error;
  }

  /**
   * Handle request errors
   */
  protected handleRequestError(error: unknown): void {
    // Silence noisy API errors during development
    if (process.env.NODE_ENV === "development") {
      return;
    }
    if (error instanceof Error) {
      console.error("API Request Error:", error.message, error.stack);
    }
  }

  /**
   * GET request helper
   */
  protected async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: "GET", params });
  }

  /**
   * POST request helper
   */
  protected async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request helper
   */
  protected async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH request helper
   */
  protected async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request helper
   */
  protected async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: "DELETE" });
  }
}

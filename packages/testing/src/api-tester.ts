import type { ApiTestConfig, TestResponse, ApiTestResult } from './types';

/**
 * Simple API testing utility
 * Linus-style: Keep it simple, no over-engineering
 */
export class ApiTester {
  private config: Required<ApiTestConfig>;

  constructor(config: ApiTestConfig) {
    this.config = {
      timeout: 5000,
      headers: {},
      ...config,
    };
  }

  /**
   * Test GET endpoint
   */
  async get<T = any>(path: string): Promise<ApiTestResult> {
    return this.request<T>('GET', path);
  }

  /**
   * Test POST endpoint
   */
  async post<T = any>(path: string, body?: any): Promise<ApiTestResult> {
    return this.request<T>('POST', path, body);
  }

  /**
   * Test PUT endpoint
   */
  async put<T = any>(path: string, body?: any): Promise<ApiTestResult> {
    return this.request<T>('PUT', path, body);
  }

  /**
   * Test DELETE endpoint
   */
  async delete<T = any>(path: string): Promise<ApiTestResult> {
    return this.request<T>('DELETE', path);
  }

  /**
   * Core request method
   */
  private async request<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<ApiTestResult> {
    const url = `${this.config.baseURL}${path}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout
      );

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data: T;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = (await response.text()) as any;
      }

      const testResponse: TestResponse<T> = {
        status: response.status,
        data,
        headers: response.headers,
      };

      return {
        passed: response.ok,
        message: response.ok
          ? `${method} ${path} succeeded`
          : `${method} ${path} failed with status ${response.status}`,
        response: testResponse,
      };
    } catch (error) {
      return {
        passed: false,
        message: `${method} ${path} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Assert response status
   */
  assertStatus(result: ApiTestResult, expectedStatus: number): void {
    if (result.response?.status !== expectedStatus) {
      throw new Error(
        `Expected status ${expectedStatus}, got ${result.response?.status || 'unknown'}`
      );
    }
  }

  /**
   * Assert response contains data
   */
  assertHasData<T>(
    result: ApiTestResult,
    validator: (data: T) => boolean
  ): void {
    if (!result.response?.data) {
      throw new Error('Response has no data');
    }

    if (!validator(result.response.data)) {
      throw new Error('Response data failed validation');
    }
  }
}

/**
 * Factory function for creating API tester
 */
export function apiTester(config: ApiTestConfig): ApiTester {
  return new ApiTester(config);
}

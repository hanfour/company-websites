export interface ApiTestConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface TestResponse<T = any> {
  status: number;
  data: T;
  headers: Headers;
}

export interface ApiTestResult {
  passed: boolean;
  message: string;
  response?: TestResponse;
  error?: Error;
}

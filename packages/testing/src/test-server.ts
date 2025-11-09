import { spawn, type ChildProcess } from 'child_process';

export interface TestServerConfig {
  command: string;
  args?: string[];
  port: number;
  readyMessage?: string | RegExp;
  timeout?: number;
}

export class TestServer {
  private process: ChildProcess | null = null;
  private config: Required<TestServerConfig>;

  constructor(config: TestServerConfig) {
    this.config = {
      args: [],
      readyMessage: /Ready|started|listening/i,
      timeout: 30000,
      ...config,
    };
  }

  /**
   * Start the test server and wait until it's ready
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.stop();
        reject(new Error(`Server failed to start within ${this.config.timeout}ms`));
      }, this.config.timeout);

      this.process = spawn(this.config.command, this.config.args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
      });

      const checkReady = (data: Buffer) => {
        const output = data.toString();
        const isReady =
          typeof this.config.readyMessage === 'string'
            ? output.includes(this.config.readyMessage)
            : this.config.readyMessage.test(output);

        if (isReady) {
          clearTimeout(timeoutId);
          resolve();
        }
      };

      this.process.stdout?.on('data', checkReady);
      this.process.stderr?.on('data', checkReady);

      this.process.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });

      this.process.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          clearTimeout(timeoutId);
          reject(new Error(`Server exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Stop the test server
   */
  stop(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.process !== null && !this.process.killed;
  }
}

/**
 * Factory function for creating test server
 */
export function createTestServer(config: TestServerConfig): TestServer {
  return new TestServer(config);
}

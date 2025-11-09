/**
 * Simple Lock Mechanism
 *
 * Philosophy: "Locks are for people who don't understand concurrency" - Linus
 * But we need SOMETHING to prevent concurrent JSON writes from clobbering each other.
 *
 * This is a simple in-memory lock. For distributed systems, use Redis or similar.
 * For our use case (single Next.js instance), this is sufficient.
 */

export class SimpleLock {
  private locks = new Map<string, Promise<void>>();

  /**
   * Acquire lock and execute function
   * Automatically releases lock when done
   */
  async acquire<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // Wait for any existing operation on this key
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }

    // Create new lock promise
    let release: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      release = resolve;
    });

    this.locks.set(key, lockPromise);

    try {
      // Execute the function
      const result = await fn();
      return result;
    } finally {
      // Always release the lock
      this.locks.delete(key);
      release!();
    }
  }
}

/**
 * Global lock instance
 * One lock per storage instance is enough
 */
export const globalLock = new SimpleLock();

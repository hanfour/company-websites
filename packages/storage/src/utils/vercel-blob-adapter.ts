/**
 * Vercel Blob Adapter for S3 Interface
 *
 * This adapter makes Vercel Blob compatible with our S3Helper interface,
 * allowing JSONStorage to work with Vercel Blob without code changes.
 */

import { put, del, head, list } from '@vercel/blob';

export interface VercelBlobConfig {
  token: string; // BLOB_READ_WRITE_TOKEN
}

/**
 * Vercel Blob Adapter implementing S3-like interface
 */
export class VercelBlobAdapter {
  private token: string;
  private baseUrl: string;

  constructor(config: VercelBlobConfig) {
    this.token = config.token;
    this.baseUrl = 'https://blob.vercel-storage.com';
  }

  /**
   * Read JSON from Vercel Blob
   */
  async readJSON<T = any>(key: string): Promise<T | null> {
    try {
      // Vercel Blob URLs are: https://{account}.public.blob.vercel-storage.com/{key}
      // We need to fetch the data
      const url = await this.getUrl(key);
      if (!url) return null;

      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch blob: ${response.statusText}`);
      }

      const text = await response.text();
      return JSON.parse(text);
    } catch (error: any) {
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Write JSON to Vercel Blob
   */
  async writeJSON(key: string, data: any): Promise<void> {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    await put(key, blob, {
      access: 'public',
      token: this.token,
    });
  }

  /**
   * Delete file from Vercel Blob
   */
  async delete(key: string): Promise<void> {
    const url = await this.getUrl(key);
    if (!url) return; // Already deleted

    await del(url, { token: this.token });
  }

  /**
   * Check if file exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const url = await this.getUrl(key);
      return url !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get URL for a blob key
   */
  private async getUrl(key: string): Promise<string | null> {
    try {
      // List blobs and find matching key
      const { blobs } = await list({ token: this.token });
      const blob = blobs.find((b) => b.pathname === key);
      return blob?.url || null;
    } catch {
      return null;
    }
  }
}

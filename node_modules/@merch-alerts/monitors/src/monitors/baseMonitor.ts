import fetch from 'node-fetch';
import { logger, Product, Event, EventType, MonitorResult, sleep, addJitter } from '@merch-alerts/core';

export interface MonitorConfig {
  name: string;
  domain: string;
  enabled: boolean;
  delayMinutes: number;
  rateLimit: number; // requests per minute
  maxRetries: number;
}

export abstract class BaseMonitor {
  protected config: MonitorConfig;
  protected lastFetch: Date | null = null;
  protected etag: string | null = null;

  constructor(config: MonitorConfig) {
    this.config = config;
  }

  abstract fetchProducts(): Promise<MonitorResult>;

  async monitor(): Promise<MonitorResult | null> {
    if (!this.config.enabled) {
      logger.debug(`Monitor ${this.config.name} is disabled`);
      return null;
    }

    try {
      logger.info(`Starting monitor for ${this.config.name}`);
      const result = await this.fetchProducts();
      
      this.lastFetch = new Date();
      this.etag = result.etag || null;
      
      logger.info(`Monitor ${this.config.name} found ${result.products.length} products, ${result.events.length} events`);
      return result;
      
    } catch (error) {
      logger.error(`Monitor ${this.config.name} failed`, { error });
      return null;
    }
  }

  protected async fetchWithRetry(url: string, options: any = {}, retries = 0): Promise<any> {
    try {
      // Add rate limiting delay
      const delayMs = addJitter((60 / this.config.rateLimit) * 1000);
      await sleep(delayMs);

      const headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; MerchDropBot/1.0)',
        ...options.headers
      };

      // Add ETag if available
      if (this.etag && !options.headers?.['If-None-Match']) {
        headers['If-None-Match'] = this.etag;
      }

      const response = await fetch(url, {
        ...options,
        headers
      });

      if (response.status === 304) {
        logger.debug(`No changes for ${this.config.name} (304 Not Modified)`);
        return { notModified: true };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;

    } catch (error) {
      if (retries < this.config.maxRetries) {
        const backoffMs = Math.pow(2, retries) * 1000;
        logger.warn(`Retry ${retries + 1}/${this.config.maxRetries} for ${url} in ${backoffMs}ms`, { error });
        await sleep(backoffMs);
        return this.fetchWithRetry(url, options, retries + 1);
      }
      throw error;
    }
  }

  protected createProduct(data: any): Product {
    return {
      id: '', // Will be set by database
      title: data.title || 'Unknown Product',
      brand: data.brand,
      sku: data.sku,
      upc: data.upc,
      url: data.url,
      image: data.image,
      category: data.category || 'collectibles',
      platform: this.config.domain,
      tags: data.tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  protected createEvent(productId: string, type: EventType, data: any = {}): Event {
    return {
      id: '', // Will be set by database
      productId,
      type,
      ts: new Date(),
      stock: data.stock,
      price: data.price,
      createdAt: new Date()
    };
  }

  protected extractPrice(priceText: string): number | undefined {
    if (!priceText) return undefined;
    
    const match = priceText.match(/[\d,]+\.?\d*/);
    if (match) {
      return parseFloat(match[0].replace(/,/g, ''));
    }
    return undefined;
  }

  protected normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url, `https://${this.config.domain}`);
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  getConfig(): MonitorConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<MonitorConfig>) {
    this.config = { ...this.config, ...updates };
  }
}

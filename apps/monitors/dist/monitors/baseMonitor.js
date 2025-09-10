"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseMonitor = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const core_1 = require("@merch-alerts/core");
class BaseMonitor {
    constructor(config) {
        this.lastFetch = null;
        this.etag = null;
        this.config = config;
    }
    async monitor() {
        if (!this.config.enabled) {
            core_1.logger.debug(`Monitor ${this.config.name} is disabled`);
            return null;
        }
        try {
            core_1.logger.info(`Starting monitor for ${this.config.name}`);
            const result = await this.fetchProducts();
            this.lastFetch = new Date();
            this.etag = result.etag || null;
            core_1.logger.info(`Monitor ${this.config.name} found ${result.products.length} products, ${result.events.length} events`);
            return result;
        }
        catch (error) {
            core_1.logger.error(`Monitor ${this.config.name} failed`, { error });
            return null;
        }
    }
    async fetchWithRetry(url, options = {}, retries = 0) {
        try {
            // Add rate limiting delay
            const delayMs = (0, core_1.addJitter)((60 / this.config.rateLimit) * 1000);
            await (0, core_1.sleep)(delayMs);
            const headers = {
                'User-Agent': 'Mozilla/5.0 (compatible; MerchDropBot/1.0)',
                ...options.headers
            };
            // Add ETag if available
            if (this.etag && !options.headers?.['If-None-Match']) {
                headers['If-None-Match'] = this.etag;
            }
            const response = await (0, node_fetch_1.default)(url, {
                ...options,
                headers
            });
            if (response.status === 304) {
                core_1.logger.debug(`No changes for ${this.config.name} (304 Not Modified)`);
                return { notModified: true };
            }
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response;
        }
        catch (error) {
            if (retries < this.config.maxRetries) {
                const backoffMs = Math.pow(2, retries) * 1000;
                core_1.logger.warn(`Retry ${retries + 1}/${this.config.maxRetries} for ${url} in ${backoffMs}ms`, { error });
                await (0, core_1.sleep)(backoffMs);
                return this.fetchWithRetry(url, options, retries + 1);
            }
            throw error;
        }
    }
    createProduct(data) {
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
    createEvent(productId, type, data = {}) {
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
    extractPrice(priceText) {
        if (!priceText)
            return undefined;
        const match = priceText.match(/[\d,]+\.?\d*/);
        if (match) {
            return parseFloat(match[0].replace(/,/g, ''));
        }
        return undefined;
    }
    normalizeUrl(url) {
        try {
            const urlObj = new URL(url, `https://${this.config.domain}`);
            return urlObj.toString();
        }
        catch {
            return url;
        }
    }
    getConfig() {
        return { ...this.config };
    }
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
    }
}
exports.BaseMonitor = BaseMonitor;
//# sourceMappingURL=baseMonitor.js.map
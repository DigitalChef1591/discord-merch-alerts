import { EventType } from './types';
export declare function generateAlertHash(source: string, url: string, sku: string | undefined, type: EventType): string;
export declare function sleep(ms: number): Promise<void>;
export declare function addJitter(baseMs: number, jitterPercent?: number): number;
export declare function formatPrice(price: number | undefined): string | undefined;
export declare function extractDomain(url: string): string;
export declare function isValidUrl(url: string): boolean;
export declare function truncateText(text: string, maxLength: number): string;
export declare function categorizeProduct(title: string, brand?: string, tags?: string[]): string;
//# sourceMappingURL=utils.d.ts.map
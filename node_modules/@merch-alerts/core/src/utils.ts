import { createHash } from 'crypto';
import { EventType } from './types';

export function generateAlertHash(source: string, url: string, sku: string | undefined, type: EventType): string {
  const dateBucket = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const hashInput = `${source}|${url}|${sku || 'no-sku'}|${type}|${dateBucket}`;
  return createHash('sha1').update(hashInput).digest('hex');
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function addJitter(baseMs: number, jitterPercent: number = 0.1): number {
  const jitter = baseMs * jitterPercent * (Math.random() - 0.5) * 2;
  return Math.max(0, baseMs + jitter);
}

export function formatPrice(price: number | undefined): string | undefined {
  if (price === undefined) return undefined;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
}

export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function categorizeProduct(title: string, brand?: string, tags: string[] = []): string {
  const titleLower = title.toLowerCase();
  const brandLower = brand?.toLowerCase() || '';
  const allText = `${titleLower} ${brandLower} ${tags.join(' ').toLowerCase()}`;

  // Sneakers
  if (allText.includes('sneaker') || allText.includes('shoe') || allText.includes('jordan') || 
      allText.includes('nike') || allText.includes('adidas') || allText.includes('yeezy')) {
    return 'sneakers';
  }

  // GPUs
  if (allText.includes('gpu') || allText.includes('graphics card') || allText.includes('rtx') || 
      allText.includes('gtx') || allText.includes('nvidia') || allText.includes('amd')) {
    return 'gpus';
  }

  // LEGO
  if (allText.includes('lego') || brandLower === 'lego') {
    return 'toys';
  }

  // Funko
  if (allText.includes('funko') || allText.includes('pop!') || brandLower === 'funko') {
    return 'collectibles';
  }

  // Loungefly
  if (allText.includes('loungefly') || brandLower === 'loungefly') {
    return 'collectibles';
  }

  // Trading Cards
  if (allText.includes('pokemon') || allText.includes('magic the gathering') || allText.includes('mtg') ||
      allText.includes('yugioh') || allText.includes('yu-gi-oh') || allText.includes('one piece') ||
      allText.includes('lorcana') || allText.includes('trading card')) {
    return 'trading-cards';
  }

  // Streetwear
  if (allText.includes('hoodie') || allText.includes('t-shirt') || allText.includes('sweatshirt') ||
      allText.includes('jacket') || allText.includes('supreme') || allText.includes('bape')) {
    return 'streetwear';
  }

  // Default to collectibles
  return 'collectibles';
}

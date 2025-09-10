export interface Product {
  id: string;
  title: string;
  brand?: string;
  sku?: string;
  upc?: string;
  url: string;
  image?: string;
  category: string;
  platform: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  productId: string;
  type: EventType;
  ts: Date;
  stock?: number;
  price?: number;
  createdAt: Date;
}

export interface Alert {
  id: string;
  eventId: string;
  source: string;
  hash: string;
  postedPremiumAt?: Date;
  postedFreeAt?: Date;
  freeMessageId?: string;
  premiumMessageId?: string;
  unlockScheduledAt?: Date;
  createdAt: Date;
}

export interface Channel {
  id: string;
  guildId: string;
  category: string;
  name: string;
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Source {
  id: string;
  name: string;
  domain: string;
  enabled: boolean;
  delayMinutes: number;
  lastFetch?: Date;
  etag?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Affiliate {
  id: string;
  domain: string;
  strategy: AffiliateStrategy;
  param?: string;
  code?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Code {
  id: string;
  brand: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum EventType {
  NEW = 'NEW',
  RESTOCK = 'RESTOCK',
  PRICE_DROP = 'PRICE_DROP',
  PREORDER = 'PREORDER'
}

export enum AffiliateStrategy {
  APPEND_PARAM = 'APPEND_PARAM',
  REPLACE_DOMAIN = 'REPLACE_DOMAIN',
  CODE_MESSAGE = 'CODE_MESSAGE'
}

export interface ChannelConfig {
  category: string;
  channels: {
    name: string;
    isPremium: boolean;
  }[];
}

export interface MonitorResult {
  products: Product[];
  events: Event[];
  source: string;
  etag?: string;
}

export interface AffiliateResult {
  url: string;
  codeMessage?: string;
}

export interface EmbedData {
  title: string;
  brand?: string;
  status: string;
  price?: string;
  url?: string;
  image?: string;
  codeMessage?: string;
  source: string;
  timestamp: Date;
  isLocked?: boolean;
  unlockTime?: Date;
}

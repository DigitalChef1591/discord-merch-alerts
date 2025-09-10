import { ChannelConfig } from '@merch-alerts/core';

export const CHANNEL_STRUCTURE: ChannelConfig[] = [
  {
    category: 'Welcome',
    channels: [
      { name: 'start-here', isPremium: false },
      { name: 'rules', isPremium: false },
      { name: 'faq', isPremium: false },
      { name: 'announcements', isPremium: false }
    ]
  },
  {
    category: 'Sneakers',
    channels: [
      { name: 'sneakers-drops', isPremium: false },
      { name: 'sneakers-drops-premium', isPremium: true }
    ]
  },
  {
    category: 'GPUs',
    channels: [
      { name: 'gpus-drops', isPremium: false },
      { name: 'gpus-drops-premium', isPremium: true }
    ]
  },
  {
    category: 'Toys',
    channels: [
      { name: 'lego-drops', isPremium: false },
      { name: 'lego-drops-premium', isPremium: true }
    ]
  },
  {
    category: 'Collectibles',
    channels: [
      { name: 'funko-drops', isPremium: false },
      { name: 'funko-drops-premium', isPremium: true },
      { name: 'loungefly-drops', isPremium: false },
      { name: 'loungefly-drops-premium', isPremium: true }
    ]
  },
  {
    category: 'Trading Cards',
    channels: [
      { name: 'pokemon-drops', isPremium: false },
      { name: 'pokemon-drops-premium', isPremium: true },
      { name: 'magic-the-gathering-drops', isPremium: false },
      { name: 'magic-the-gathering-drops-premium', isPremium: true },
      { name: 'yugioh-drops', isPremium: false },
      { name: 'yugioh-drops-premium', isPremium: true },
      { name: 'one-piece-drops', isPremium: false },
      { name: 'one-piece-drops-premium', isPremium: true },
      { name: 'lorcana-drops', isPremium: false },
      { name: 'lorcana-drops-premium', isPremium: true }
    ]
  },
  {
    category: 'Streetwear',
    channels: [
      { name: 'streetwear-drops', isPremium: false },
      { name: 'streetwear-drops-premium', isPremium: true }
    ]
  },
  {
    category: 'Release Calendar',
    channels: [
      { name: 'release-calendar', isPremium: false }
    ]
  }
];

export const CONFIG = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN!,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID!,
  DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID!,
  PREMIUM_ROLE_NAME: process.env.PREMIUM_ROLE_NAME || 'Premium',
  FREE_DELAY_MINUTES: parseInt(process.env.FREE_DELAY_MINUTES || '12'),
  DATABASE_URL: process.env.DATABASE_URL!,
  REDIS_URL: process.env.REDIS_URL!
};

export function validateConfig() {
  const required = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'DISCORD_GUILD_ID', 'DATABASE_URL', 'REDIS_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

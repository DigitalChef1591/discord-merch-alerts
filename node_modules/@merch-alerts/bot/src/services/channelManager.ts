import { Client, Guild, CategoryChannel, TextChannel, ChannelType, PermissionFlagsBits } from 'discord.js';
import { logger } from '@merch-alerts/core';
import { CHANNEL_STRUCTURE, CONFIG } from '../config';
import { prisma } from '../database';

export class ChannelManager {
  private client: Client;
  private guild: Guild | null = null;

  constructor(client: Client) {
    this.client = client;
  }

  async initialize() {
    this.guild = await this.client.guilds.fetch(CONFIG.DISCORD_GUILD_ID);
    if (!this.guild) {
      throw new Error(`Guild ${CONFIG.DISCORD_GUILD_ID} not found`);
    }
    logger.info(`Initialized channel manager for guild: ${this.guild.name}`);
  }

  async syncChannelStructure() {
    if (!this.guild) {
      throw new Error('Guild not initialized');
    }

    logger.info('Starting channel structure sync');

    for (const categoryConfig of CHANNEL_STRUCTURE) {
      await this.createOrUpdateCategory(categoryConfig);
    }

    logger.info('Channel structure sync completed');
  }

  private async createOrUpdateCategory(categoryConfig: any) {
    if (!this.guild) return;

    // Find or create category
    let category = this.guild.channels.cache.find(
      channel => channel.type === ChannelType.GuildCategory && 
                 channel.name.toLowerCase() === categoryConfig.category.toLowerCase()
    ) as CategoryChannel;

    if (!category) {
      category = await this.guild.channels.create({
        name: categoryConfig.category,
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: this.guild.roles.everyone.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny: [PermissionFlagsBits.SendMessages]
          }
        ]
      });
      logger.info(`Created category: ${category.name}`);
    }

    // Create channels in category
    for (const channelConfig of categoryConfig.channels) {
      await this.createOrUpdateChannel(category, channelConfig);
    }
  }

  private async createOrUpdateChannel(category: CategoryChannel, channelConfig: any) {
    if (!this.guild) return;

    let channel = this.guild.channels.cache.find(
      ch => ch.type === ChannelType.GuildText && 
            ch.name === channelConfig.name &&
            ch.parentId === category.id
    ) as TextChannel;

    if (!channel) {
      const permissionOverwrites = [
        {
          id: this.guild.roles.everyone.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
          deny: [PermissionFlagsBits.SendMessages]
        }
      ];

      // Add premium role permissions if this is a premium channel
      if (channelConfig.isPremium) {
        const premiumRole = this.guild.roles.cache.find(role => role.name === CONFIG.PREMIUM_ROLE_NAME);
        if (premiumRole) {
          permissionOverwrites.push({
            id: premiumRole.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny: []
          });
          // Deny access to non-premium users
          permissionOverwrites[0].deny = [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ViewChannel
          ];
        }
      }

      channel = await this.guild.channels.create({
        name: channelConfig.name,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites
      });

      logger.info(`Created channel: ${channel.name} (premium: ${channelConfig.isPremium})`);
    }

    // Store channel in database
    await this.storeChannelInDatabase(channel, category.name, channelConfig.isPremium);
  }

  private async storeChannelInDatabase(channel: TextChannel, categoryName: string, isPremium: boolean) {
    if (!this.guild) return;

    try {
      await prisma.channel.upsert({
        where: { id: channel.id },
        update: {
          guildId: this.guild.id,
          category: categoryName,
          name: channel.name,
          isPremium
        },
        create: {
          id: channel.id,
          guildId: this.guild.id,
          category: categoryName,
          name: channel.name,
          isPremium
        }
      });
    } catch (error) {
      logger.error('Failed to store channel in database', { error, channelId: channel.id });
    }
  }

  async getChannelsByCategory(category: string, isPremium?: boolean) {
    const channels = await prisma.channel.findMany({
      where: {
        guildId: CONFIG.DISCORD_GUILD_ID,
        category,
        ...(isPremium !== undefined && { isPremium })
      }
    });

    return channels;
  }

  async getChannelById(channelId: string) {
    return await prisma.channel.findUnique({
      where: { id: channelId }
    });
  }

  async getAllChannels() {
    return await prisma.channel.findMany({
      where: {
        guildId: CONFIG.DISCORD_GUILD_ID
      }
    });
  }
}

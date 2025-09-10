import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { logger, EmbedData, EventType, affiliateManager, formatPrice } from '@merch-alerts/core';
import { CONFIG } from '../config';
import { prisma } from '../database';
import { ChannelManager } from './channelManager';

export class AlertManager {
  private client: Client;
  private channelManager: ChannelManager;
  private redis: Redis;
  private revealQueue: Queue;
  private revealWorker: Worker | null = null;

  constructor(client: Client, channelManager: ChannelManager) {
    this.client = client;
    this.channelManager = channelManager;
    this.redis = new Redis(CONFIG.REDIS_URL);
    this.revealQueue = new Queue('reveal-queue', { connection: this.redis });
    this.setupRevealWorker();
  }

  private setupRevealWorker() {
    this.revealWorker = new Worker('reveal-queue', async (job) => {
      const { alertId } = job.data;
      await this.revealFreeAlert(alertId);
    }, { connection: this.redis });

    this.revealWorker.on('completed', (job) => {
      logger.info(`Reveal job completed for alert: ${job.data.alertId}`);
    });

    this.revealWorker.on('failed', (job, err) => {
      logger.error(`Reveal job failed for alert: ${job?.data?.alertId}`, { error: err });
    });
  }

  async postAlert(embedData: EmbedData, category: string) {
    try {
      // Get channels for this category
      const premiumChannels = await this.channelManager.getChannelsByCategory(category, true);
      const freeChannels = await this.channelManager.getChannelsByCategory(category, false);

      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Post to premium channels immediately with full details
      const premiumEmbeds = this.createEmbed(embedData, false);
      const premiumMessageIds: string[] = [];

      for (const channelData of premiumChannels) {
        const channel = await this.client.channels.fetch(channelData.id) as TextChannel;
        if (channel) {
          const message = await channel.send({ embeds: [premiumEmbeds] });
          premiumMessageIds.push(message.id);
          logger.info(`Posted premium alert to ${channel.name}`, { alertId });
        }
      }

      // Post to free channels with locked content
      const freeEmbeds = this.createEmbed(embedData, true);
      const freeMessageIds: string[] = [];

      for (const channelData of freeChannels) {
        const channel = await this.client.channels.fetch(channelData.id) as TextChannel;
        if (channel) {
          const message = await channel.send({ embeds: [freeEmbeds] });
          freeMessageIds.push(message.id);
          logger.info(`Posted locked alert to ${channel.name}`, { alertId });
        }
      }

      // Schedule reveal job for free channels
      const delayMs = CONFIG.FREE_DELAY_MINUTES * 60 * 1000;
      await this.revealQueue.add('reveal', 
        { 
          alertId, 
          embedData, 
          freeMessageIds,
          freeChannels: freeChannels.map(c => c.id)
        }, 
        { delay: delayMs }
      );

      logger.info(`Scheduled reveal for alert ${alertId} in ${CONFIG.FREE_DELAY_MINUTES} minutes`);

      return {
        alertId,
        premiumMessageIds,
        freeMessageIds,
        revealAt: new Date(Date.now() + delayMs)
      };

    } catch (error) {
      logger.error('Failed to post alert', { error, category });
      throw error;
    }
  }

  private createEmbed(embedData: EmbedData, isLocked: boolean): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle(embedData.title)
      .setColor(this.getColorForStatus(embedData.status))
      .setTimestamp(embedData.timestamp)
      .setFooter({ text: `Source: ${embedData.source}` });

    if (embedData.image) {
      embed.setThumbnail(embedData.image);
    }

    if (embedData.brand) {
      embed.addFields({ name: 'Brand', value: embedData.brand, inline: true });
    }

    embed.addFields({ name: 'Status', value: embedData.status, inline: true });

    if (embedData.price) {
      embed.addFields({ name: 'Price', value: embedData.price, inline: true });
    }

    if (isLocked) {
      const unlockTime = new Date(Date.now() + CONFIG.FREE_DELAY_MINUTES * 60 * 1000);
      embed.addFields({ 
        name: '🔒 Locked Content', 
        value: `Details unlock at <t:${Math.floor(unlockTime.getTime() / 1000)}:t> PT`, 
        inline: false 
      });
    } else {
      if (embedData.url) {
        const affiliateResult = affiliateManager.applyAffiliate(embedData.url, embedData.brand);
        embed.addFields({ name: 'Link', value: `[Buy Now](${affiliateResult.url})`, inline: false });
        
        if (affiliateResult.codeMessage) {
          embed.addFields({ name: 'Discount Code', value: affiliateResult.codeMessage, inline: false });
        }
      }

      if (embedData.codeMessage) {
        embed.addFields({ name: 'Discount Code', value: embedData.codeMessage, inline: false });
      }
    }

    return embed;
  }

  private async revealFreeAlert(alertId: string) {
    try {
      // This would be called by the worker to reveal the locked content
      logger.info(`Revealing free alert: ${alertId}`);
      
      // In a real implementation, we'd need to store the job data and retrieve it here
      // For now, this is a placeholder for the reveal logic
      
    } catch (error) {
      logger.error('Failed to reveal free alert', { error, alertId });
    }
  }

  private getColorForStatus(status: string): number {
    switch (status.toUpperCase()) {
      case 'NEW':
        return 0x00ff00; // Green
      case 'RESTOCK':
        return 0x0099ff; // Blue
      case 'PRICE_DROP':
        return 0xff9900; // Orange
      case 'PREORDER':
        return 0x9900ff; // Purple
      default:
        return 0x666666; // Gray
    }
  }

  async testAlert(category: string, title: string, url: string) {
    const embedData: EmbedData = {
      title,
      brand: 'Test Brand',
      status: 'NEW',
      price: '$99.99',
      url,
      image: 'https://via.placeholder.com/150',
      source: 'test',
      timestamp: new Date()
    };

    return await this.postAlert(embedData, category);
  }

  async cleanup() {
    if (this.revealWorker) {
      await this.revealWorker.close();
    }
    await this.revealQueue.close();
    await this.redis.quit();
  }
}

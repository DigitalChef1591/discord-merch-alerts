"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertManager = void 0;
const discord_js_1 = require("discord.js");
const bullmq_1 = require("bullmq");
const ioredis_1 = require("ioredis");
const core_1 = require("@merch-alerts/core");
const config_1 = require("../config");
class AlertManager {
    constructor(client, channelManager) {
        this.revealWorker = null;
        this.client = client;
        this.channelManager = channelManager;
        this.redis = new ioredis_1.Redis(config_1.CONFIG.REDIS_URL);
        this.revealQueue = new bullmq_1.Queue('reveal-queue', { connection: this.redis });
        this.setupRevealWorker();
    }
    setupRevealWorker() {
        this.revealWorker = new bullmq_1.Worker('reveal-queue', async (job) => {
            const { alertId } = job.data;
            await this.revealFreeAlert(alertId);
        }, { connection: this.redis });
        this.revealWorker.on('completed', (job) => {
            core_1.logger.info(`Reveal job completed for alert: ${job.data.alertId}`);
        });
        this.revealWorker.on('failed', (job, err) => {
            core_1.logger.error(`Reveal job failed for alert: ${job?.data?.alertId}`, { error: err });
        });
    }
    async postAlert(embedData, category) {
        try {
            // Get channels for this category
            const premiumChannels = await this.channelManager.getChannelsByCategory(category, true);
            const freeChannels = await this.channelManager.getChannelsByCategory(category, false);
            const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            // Post to premium channels immediately with full details
            const premiumEmbeds = this.createEmbed(embedData, false);
            const premiumMessageIds = [];
            for (const channelData of premiumChannels) {
                const channel = await this.client.channels.fetch(channelData.id);
                if (channel) {
                    const message = await channel.send({ embeds: [premiumEmbeds] });
                    premiumMessageIds.push(message.id);
                    core_1.logger.info(`Posted premium alert to ${channel.name}`, { alertId });
                }
            }
            // Post to free channels with locked content
            const freeEmbeds = this.createEmbed(embedData, true);
            const freeMessageIds = [];
            for (const channelData of freeChannels) {
                const channel = await this.client.channels.fetch(channelData.id);
                if (channel) {
                    const message = await channel.send({ embeds: [freeEmbeds] });
                    freeMessageIds.push(message.id);
                    core_1.logger.info(`Posted locked alert to ${channel.name}`, { alertId });
                }
            }
            // Schedule reveal job for free channels
            const delayMs = config_1.CONFIG.FREE_DELAY_MINUTES * 60 * 1000;
            await this.revealQueue.add('reveal', {
                alertId,
                embedData,
                freeMessageIds,
                freeChannels: freeChannels.map(c => c.id)
            }, { delay: delayMs });
            core_1.logger.info(`Scheduled reveal for alert ${alertId} in ${config_1.CONFIG.FREE_DELAY_MINUTES} minutes`);
            return {
                alertId,
                premiumMessageIds,
                freeMessageIds,
                revealAt: new Date(Date.now() + delayMs)
            };
        }
        catch (error) {
            core_1.logger.error('Failed to post alert', { error, category });
            throw error;
        }
    }
    createEmbed(embedData, isLocked) {
        const embed = new discord_js_1.EmbedBuilder()
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
            const unlockTime = new Date(Date.now() + config_1.CONFIG.FREE_DELAY_MINUTES * 60 * 1000);
            embed.addFields({
                name: '🔒 Locked Content',
                value: `Details unlock at <t:${Math.floor(unlockTime.getTime() / 1000)}:t> PT`,
                inline: false
            });
        }
        else {
            if (embedData.url) {
                const affiliateResult = core_1.affiliateManager.applyAffiliate(embedData.url, embedData.brand);
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
    async revealFreeAlert(alertId) {
        try {
            // This would be called by the worker to reveal the locked content
            core_1.logger.info(`Revealing free alert: ${alertId}`);
            // In a real implementation, we'd need to store the job data and retrieve it here
            // For now, this is a placeholder for the reveal logic
        }
        catch (error) {
            core_1.logger.error('Failed to reveal free alert', { error, alertId });
        }
    }
    getColorForStatus(status) {
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
    async testAlert(category, title, url) {
        const embedData = {
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
exports.AlertManager = AlertManager;
//# sourceMappingURL=alertManager.js.map
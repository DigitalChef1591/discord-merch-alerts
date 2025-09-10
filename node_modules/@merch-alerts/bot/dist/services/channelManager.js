"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelManager = void 0;
const discord_js_1 = require("discord.js");
const core_1 = require("@merch-alerts/core");
const config_1 = require("../config");
const database_1 = require("../database");
class ChannelManager {
    constructor(client) {
        this.guild = null;
        this.client = client;
    }
    async initialize() {
        this.guild = await this.client.guilds.fetch(config_1.CONFIG.DISCORD_GUILD_ID);
        if (!this.guild) {
            throw new Error(`Guild ${config_1.CONFIG.DISCORD_GUILD_ID} not found`);
        }
        core_1.logger.info(`Initialized channel manager for guild: ${this.guild.name}`);
    }
    async syncChannelStructure() {
        if (!this.guild) {
            throw new Error('Guild not initialized');
        }
        core_1.logger.info('Starting channel structure sync');
        for (const categoryConfig of config_1.CHANNEL_STRUCTURE) {
            await this.createOrUpdateCategory(categoryConfig);
        }
        core_1.logger.info('Channel structure sync completed');
    }
    async createOrUpdateCategory(categoryConfig) {
        if (!this.guild)
            return;
        // Find or create category
        let category = this.guild.channels.cache.find(channel => channel.type === discord_js_1.ChannelType.GuildCategory &&
            channel.name.toLowerCase() === categoryConfig.category.toLowerCase());
        if (!category) {
            category = await this.guild.channels.create({
                name: categoryConfig.category,
                type: discord_js_1.ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: this.guild.roles.everyone.id,
                        allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.ReadMessageHistory],
                        deny: [discord_js_1.PermissionFlagsBits.SendMessages]
                    }
                ]
            });
            core_1.logger.info(`Created category: ${category.name}`);
        }
        // Create channels in category
        for (const channelConfig of categoryConfig.channels) {
            await this.createOrUpdateChannel(category, channelConfig);
        }
    }
    async createOrUpdateChannel(category, channelConfig) {
        if (!this.guild)
            return;
        let channel = this.guild.channels.cache.find(ch => ch.type === discord_js_1.ChannelType.GuildText &&
            ch.name === channelConfig.name &&
            ch.parentId === category.id);
        if (!channel) {
            const permissionOverwrites = [
                {
                    id: this.guild.roles.everyone.id,
                    allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.ReadMessageHistory],
                    deny: [discord_js_1.PermissionFlagsBits.SendMessages]
                }
            ];
            // Add premium role permissions if this is a premium channel
            if (channelConfig.isPremium) {
                const premiumRole = this.guild.roles.cache.find(role => role.name === config_1.CONFIG.PREMIUM_ROLE_NAME);
                if (premiumRole) {
                    permissionOverwrites.push({
                        id: premiumRole.id,
                        allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.ReadMessageHistory],
                        deny: []
                    });
                    // Deny access to non-premium users
                    permissionOverwrites[0].deny = [
                        discord_js_1.PermissionFlagsBits.SendMessages,
                        discord_js_1.PermissionFlagsBits.ViewChannel
                    ];
                }
            }
            channel = await this.guild.channels.create({
                name: channelConfig.name,
                type: discord_js_1.ChannelType.GuildText,
                parent: category.id,
                permissionOverwrites
            });
            core_1.logger.info(`Created channel: ${channel.name} (premium: ${channelConfig.isPremium})`);
        }
        // Store channel in database
        await this.storeChannelInDatabase(channel, category.name, channelConfig.isPremium);
    }
    async storeChannelInDatabase(channel, categoryName, isPremium) {
        if (!this.guild)
            return;
        try {
            await database_1.prisma.channel.upsert({
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
        }
        catch (error) {
            core_1.logger.error('Failed to store channel in database', { error, channelId: channel.id });
        }
    }
    async getChannelsByCategory(category, isPremium) {
        const channels = await database_1.prisma.channel.findMany({
            where: {
                guildId: config_1.CONFIG.DISCORD_GUILD_ID,
                category,
                ...(isPremium !== undefined && { isPremium })
            }
        });
        return channels;
    }
    async getChannelById(channelId) {
        return await database_1.prisma.channel.findUnique({
            where: { id: channelId }
        });
    }
    async getAllChannels() {
        return await database_1.prisma.channel.findMany({
            where: {
                guildId: config_1.CONFIG.DISCORD_GUILD_ID
            }
        });
    }
}
exports.ChannelManager = ChannelManager;
//# sourceMappingURL=channelManager.js.map
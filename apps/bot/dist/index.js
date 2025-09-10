"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const discord_js_1 = require("discord.js");
const core_1 = require("@merch-alerts/core");
const config_1 = require("./config");
const database_1 = require("./database");
const channelManager_1 = require("./services/channelManager");
const alertManager_1 = require("./services/alertManager");
const commands_1 = require("./commands");
class MerchDropBot {
    constructor() {
        this.client = new discord_js_1.Client({
            intents: [
                discord_js_1.GatewayIntentBits.Guilds,
                discord_js_1.GatewayIntentBits.GuildMessages,
                discord_js_1.GatewayIntentBits.MessageContent
            ]
        });
        this.channelManager = new channelManager_1.ChannelManager(this.client);
        this.alertManager = new alertManager_1.AlertManager(this.client, this.channelManager);
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.client.once('ready', async () => {
            if (!this.client.user)
                return;
            core_1.logger.info(`Bot logged in as ${this.client.user.tag}`);
            try {
                await this.channelManager.initialize();
                await this.registerCommands();
                core_1.logger.info('Bot initialization completed');
            }
            catch (error) {
                core_1.logger.error('Failed to initialize bot', { error });
                process.exit(1);
            }
        });
        this.client.on('interactionCreate', async (interaction) => {
            if (!interaction.isChatInputCommand())
                return;
            const command = commands_1.commands.find(cmd => cmd.data.name === interaction.commandName);
            if (!command)
                return;
            try {
                await command.execute(interaction, this.channelManager, this.alertManager);
            }
            catch (error) {
                core_1.logger.error('Command execution failed', {
                    error,
                    command: interaction.commandName,
                    userId: interaction.user.id
                });
                const errorMessage = 'There was an error executing this command!';
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: errorMessage, ephemeral: true });
                }
                else {
                    await interaction.reply({ content: errorMessage, ephemeral: true });
                }
            }
        });
        this.client.on('error', (error) => {
            core_1.logger.error('Discord client error', { error });
        });
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
    }
    async registerCommands() {
        try {
            const rest = new discord_js_1.REST().setToken(config_1.CONFIG.DISCORD_TOKEN);
            const commandData = commands_1.commands.map(command => command.data.toJSON());
            await rest.put(discord_js_1.Routes.applicationGuildCommands(config_1.CONFIG.DISCORD_CLIENT_ID, config_1.CONFIG.DISCORD_GUILD_ID), { body: commandData });
            core_1.logger.info(`Registered ${commandData.length} slash commands`);
        }
        catch (error) {
            core_1.logger.error('Failed to register commands', { error });
            throw error;
        }
    }
    async start() {
        try {
            (0, config_1.validateConfig)();
            await (0, database_1.connectDatabase)();
            await this.client.login(config_1.CONFIG.DISCORD_TOKEN);
        }
        catch (error) {
            core_1.logger.error('Failed to start bot', { error });
            process.exit(1);
        }
    }
    async shutdown() {
        core_1.logger.info('Shutting down bot...');
        try {
            await this.alertManager.cleanup();
            this.client.destroy();
            await (0, database_1.disconnectDatabase)();
            core_1.logger.info('Bot shutdown completed');
            process.exit(0);
        }
        catch (error) {
            core_1.logger.error('Error during shutdown', { error });
            process.exit(1);
        }
    }
}
// Start the bot
const bot = new MerchDropBot();
bot.start().catch((error) => {
    core_1.logger.error('Failed to start application', { error });
    process.exit(1);
});
//# sourceMappingURL=index.js.map
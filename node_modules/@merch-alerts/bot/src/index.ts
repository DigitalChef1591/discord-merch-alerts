import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { logger } from '@merch-alerts/core';
import { CONFIG, validateConfig } from './config';
import { connectDatabase, disconnectDatabase } from './database';
import { ChannelManager } from './services/channelManager';
import { AlertManager } from './services/alertManager';
import { commands } from './commands';

class MerchDropBot {
  private client: Client;
  private channelManager: ChannelManager;
  private alertManager: AlertManager;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });

    this.channelManager = new ChannelManager(this.client);
    this.alertManager = new AlertManager(this.client, this.channelManager);

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.once('ready', async () => {
      if (!this.client.user) return;
      
      logger.info(`Bot logged in as ${this.client.user.tag}`);
      
      try {
        await this.channelManager.initialize();
        await this.registerCommands();
        logger.info('Bot initialization completed');
      } catch (error) {
        logger.error('Failed to initialize bot', { error });
        process.exit(1);
      }
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const command = commands.find(cmd => cmd.data.name === interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, this.channelManager, this.alertManager);
      } catch (error) {
        logger.error('Command execution failed', { 
          error, 
          command: interaction.commandName,
          userId: interaction.user.id 
        });
        
        const errorMessage = 'There was an error executing this command!';
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        }
      }
    });

    this.client.on('error', (error) => {
      logger.error('Discord client error', { error });
    });

    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  private async registerCommands() {
    try {
      const rest = new REST().setToken(CONFIG.DISCORD_TOKEN);
      
      const commandData = commands.map(command => command.data.toJSON());
      
      await rest.put(
        Routes.applicationGuildCommands(CONFIG.DISCORD_CLIENT_ID, CONFIG.DISCORD_GUILD_ID),
        { body: commandData }
      );
      
      logger.info(`Registered ${commandData.length} slash commands`);
    } catch (error) {
      logger.error('Failed to register commands', { error });
      throw error;
    }
  }

  async start() {
    try {
      validateConfig();
      await connectDatabase();
      await this.client.login(CONFIG.DISCORD_TOKEN);
    } catch (error) {
      logger.error('Failed to start bot', { error });
      process.exit(1);
    }
  }

  private async shutdown() {
    logger.info('Shutting down bot...');
    
    try {
      await this.alertManager.cleanup();
      this.client.destroy();
      await disconnectDatabase();
      logger.info('Bot shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error });
      process.exit(1);
    }
  }
}

// Start the bot
const bot = new MerchDropBot();
bot.start().catch((error) => {
  logger.error('Failed to start application', { error });
  process.exit(1);
});

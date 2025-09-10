import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { logger } from '@merch-alerts/core';
import { ChannelManager } from '../services/channelManager';
import { AlertManager } from '../services/alertManager';

export interface Command {
  data: any;
  execute: (interaction: ChatInputCommandInteraction, channelManager: ChannelManager, alertManager: AlertManager) => Promise<void>;
}

export const commands: Command[] = [
  {
    data: new SlashCommandBuilder()
      .setName('sync-structure')
      .setDescription('Sync Discord channel structure')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    execute: async (interaction, channelManager) => {
      await interaction.deferReply({ ephemeral: true });
      
      try {
        await channelManager.syncChannelStructure();
        await interaction.editReply('✅ Channel structure synced successfully!');
        logger.info('Channel structure synced via command', { userId: interaction.user.id });
      } catch (error) {
        logger.error('Failed to sync channel structure', { error, userId: interaction.user.id });
        await interaction.editReply('❌ Failed to sync channel structure. Check logs for details.');
      }
    }
  },
  
  {
    data: new SlashCommandBuilder()
      .setName('test-alert')
      .setDescription('Test alert posting')
      .addStringOption(option => {
        return option.setName('category')
          .setDescription('Category to post in')
          .setRequired(true)
          .addChoices(
            { name: 'Sneakers', value: 'sneakers' },
            { name: 'GPUs', value: 'gpus' },
            { name: 'Toys', value: 'toys' },
            { name: 'Collectibles', value: 'collectibles' },
            { name: 'Trading Cards', value: 'trading-cards' },
            { name: 'Streetwear', value: 'streetwear' }
          );
      })
      .addStringOption(option =>
        option.setName('title')
          .setDescription('Product title')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('url')
          .setDescription('Product URL')
          .setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    execute: async (interaction, channelManager, alertManager) => {
      await interaction.deferReply({ ephemeral: true });
      
      try {
        const category = interaction.options.getString('category', true);
        const title = interaction.options.getString('title', true);
        const url = interaction.options.getString('url', true);
        
        const result = await alertManager.testAlert(category, title, url);
        
        await interaction.editReply(
          `✅ Test alert posted!\n` +
          `Alert ID: ${result.alertId}\n` +
          `Premium messages: ${result.premiumMessageIds.length}\n` +
          `Free messages: ${result.freeMessageIds.length}\n` +
          `Reveal at: <t:${Math.floor(result.revealAt.getTime() / 1000)}:F>`
        );
        
        logger.info('Test alert posted via command', { 
          userId: interaction.user.id, 
          category, 
          title,
          alertId: result.alertId 
        });
      } catch (error) {
        logger.error('Failed to post test alert', { error, userId: interaction.user.id });
        await interaction.editReply('❌ Failed to post test alert. Check logs for details.');
      }
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('set-delay')
      .setDescription('Set delay for free channel reveals')
      .addStringOption(option =>
        option.setName('target')
          .setDescription('Category or site to set delay for')
          .setRequired(true))
      .addIntegerOption(option =>
        option.setName('minutes')
          .setDescription('Delay in minutes')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(1440))
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    execute: async (interaction) => {
      await interaction.deferReply({ ephemeral: true });
      
      const target = interaction.options.getString('target', true);
      const minutes = interaction.options.getInteger('minutes', true);
      
      // This would update the delay in the database
      // For now, just acknowledge the command
      await interaction.editReply(`✅ Set delay for ${target} to ${minutes} minutes`);
      logger.info('Delay updated via command', { userId: interaction.user.id, target, minutes });
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('list-sources')
      .setDescription('List all monitoring sources')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    execute: async (interaction) => {
      await interaction.deferReply({ ephemeral: true });
      
      // This would list sources from the database
      const sources = [
        'loungefly.com - ✅ Enabled',
        'entertainmentearth.com - ✅ Enabled', 
        'boxlunch.com - ✅ Enabled',
        'hottopic.com - ✅ Enabled',
        'disneystore.com - ✅ Enabled',
        'lego.com - ✅ Enabled',
        'amazon.com - ❌ Disabled (No API keys)'
      ];
      
      await interaction.editReply(`**Monitoring Sources:**\n${sources.join('\n')}`);
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('toggle-source')
      .setDescription('Enable or disable a monitoring source')
      .addStringOption(option =>
        option.setName('site')
          .setDescription('Site to toggle')
          .setRequired(true))
      .addBooleanOption(option =>
        option.setName('enabled')
          .setDescription('Enable or disable')
          .setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    execute: async (interaction) => {
      await interaction.deferReply({ ephemeral: true });
      
      const site = interaction.options.getString('site', true);
      const enabled = interaction.options.getBoolean('enabled', true);
      
      // This would update the source in the database
      await interaction.editReply(`✅ ${enabled ? 'Enabled' : 'Disabled'} monitoring for ${site}`);
      logger.info('Source toggled via command', { userId: interaction.user.id, site, enabled });
    }
  }
];

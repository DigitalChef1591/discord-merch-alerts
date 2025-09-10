# Merch Drop Alerts Discord Bot

A production-ready 24/7 Discord bot system for monitoring merchandise drops with premium gating, affiliate links, and cloud deployment.

## Features

- **Discord Server Automation**: Automatically creates and manages channel structure
- **Premium Gating**: Immediate alerts for premium users, delayed reveals for free users
- **Affiliate Integration**: Automatic affiliate link injection with customizable strategies
- **Multi-Source Monitoring**: Supports multiple e-commerce platforms
- **Release Calendar**: Consolidated view of upcoming drops
- **Admin Commands**: Full control via Discord slash commands
- **Cloud Ready**: Docker + Railway deployment with health checks

## Architecture

```
/apps
  /bot                # Discord bot: commands, posting, gating, channel sync
  /monitors           # Source-specific monitors: schedule + fetch + emit
  /api                # Express admin & health endpoints
/packages
  /core               # Shared types, utils (affiliates, routing, dedupe, logging)
/infra
  Dockerfile
  railway.toml
prisma/schema.prisma  # Postgres schema
```

## Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `DISCORD_TOKEN`: Your Discord bot token
- `DISCORD_CLIENT_ID`: Your Discord application client ID
- `DISCORD_GUILD_ID`: Your Discord server ID
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string

### 2. Database Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:push
```

### 3. Development

```bash
# Start all services in development
npm run dev

# Or start individual services
npm run dev --workspace=@merch-alerts/bot
npm run dev --workspace=@merch-alerts/api
npm run dev --workspace=@merch-alerts/monitors
```

### 4. Discord Bot Setup

1. Create a Discord application at https://discord.com/developers/applications
2. Create a bot user and copy the token
3. Invite the bot to your server with these permissions:
   - Manage Channels
   - Manage Roles
   - Send Messages
   - Use Slash Commands
   - Read Message History
   - Embed Links

### 5. Initial Setup Commands

Once the bot is running and invited to your server:

```
/sync-structure    # Creates all channels and categories
/test-alert        # Test the alert system
/list-sources      # View monitoring sources
```

## Channel Structure

The bot automatically creates this structure:

- **Welcome**: #start-here, #rules, #faq, #announcements
- **Sneakers**: #sneakers-drops, #sneakers-drops-premium
- **GPUs**: #gpus-drops, #gpus-drops-premium
- **Toys**: #lego-drops, #lego-drops-premium
- **Collectibles**: #funko-drops, #funko-drops-premium, #loungefly-drops, #loungefly-drops-premium
- **Trading Cards**: #pokemon-drops, #pokemon-drops-premium, etc.
- **Streetwear**: #streetwear-drops, #streetwear-drops-premium
- **Release Calendar**: #release-calendar

## Premium System

- **Premium Role**: Users with "Premium" role get immediate alerts
- **Free Users**: Get alerts after a configurable delay (default: 12 minutes)
- **Timed Reveals**: Free channel messages are edited to show links after delay

## Affiliate System

Supports multiple affiliate strategies:

- **Append Parameter**: Amazon (tag=), Entertainment Earth (id=)
- **Code Message**: Loungefly, BoxLunch, Hot Topic, Disney, LEGO
- **Replace Domain**: For future use

Configure via slash commands:
```
/set-affiliate domain.com append_param tag
/set-code "Hot Topic" "SAVE20"
```

## Monitoring Sources

Currently supported:
- loungefly.com
- entertainmentearth.com
- boxlunch.com
- hottopic.com
- disneystore.com
- lego.com
- amazon.com (requires PA-API keys)

## Admin Commands

- `/sync-structure` - Create/update Discord channels
- `/test-alert <category> <title> <url>` - Test alert posting
- `/set-delay <target> <minutes>` - Configure reveal delays
- `/set-affiliate <domain> <strategy> <param>` - Configure affiliates
- `/set-code <brand> <code>` - Set discount codes
- `/list-sources` - View monitoring sources
- `/toggle-source <site> <enabled>` - Enable/disable sources

## Railway Deployment

### One-Click Deploy

1. Fork this repository
2. Connect to Railway: https://railway.app
3. Create a new project from GitHub
4. Add required environment variables in Railway dashboard
5. Deploy!

### Manual Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link

# Set environment variables
railway variables set DISCORD_TOKEN=your_token_here
railway variables set DISCORD_CLIENT_ID=your_client_id
railway variables set DISCORD_GUILD_ID=your_guild_id
railway variables set DATABASE_URL=your_postgres_url
railway variables set REDIS_URL=your_redis_url

# Deploy
railway up
```

### Required Railway Services

1. **PostgreSQL**: Add from Railway marketplace
2. **Redis**: Add from Railway marketplace
3. **Main App**: Your bot application

## Health Checks

The API service provides health check endpoints:

- `GET /healthz` - Basic health check
- `GET /readyz` - Readiness check
- `GET /metrics` - Basic metrics
- `GET /sources` - Source status
- `GET /alerts/recent` - Recent alerts

## Development

### Adding a New Monitor

1. Create a new monitor class extending `BaseMonitor`
2. Implement the `fetchProducts()` method
3. Register in the monitor scheduler
4. Add source configuration to database

Example:
```typescript
export class NewSiteMonitor extends BaseMonitor {
  async fetchProducts(): Promise<MonitorResult> {
    const response = await this.fetchWithRetry('https://newsite.com/api/products');
    // Process response and return products/events
  }
}
```

### Testing

```bash
# Run tests
npm test

# Run tests for specific package
npm test --workspace=@merch-alerts/core

# Run with coverage
npm test -- --coverage
```

### Code Quality

```bash
# Lint all packages
npm run lint

# Format code
npm run format

# Type check
npm run build
```

## Troubleshooting

### Bot Not Responding
1. Check bot permissions in Discord server
2. Verify `DISCORD_GUILD_ID` matches your server
3. Check logs for authentication errors

### Database Connection Issues
1. Verify `DATABASE_URL` format
2. Check network connectivity
3. Ensure database exists and is accessible

### Missing Affiliate Links
1. Check affiliate configuration with `/list-sources`
2. Verify environment variables are set
3. Check logs for affiliate processing errors

### Channels Not Created
1. Ensure bot has "Manage Channels" permission
2. Run `/sync-structure` command
3. Check for role hierarchy issues

## Environment Variables Reference

### Required
- `DISCORD_TOKEN` - Discord bot token
- `DISCORD_CLIENT_ID` - Discord application client ID  
- `DISCORD_GUILD_ID` - Discord server ID
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

### Optional
- `PREMIUM_ROLE_NAME` - Premium role name (default: "Premium")
- `FREE_DELAY_MINUTES` - Free user delay (default: 12)
- `LOG_LEVEL` - Logging level (default: "info")
- `NODE_ENV` - Environment (development/production)

### Affiliate Keys (Optional)
- `AMAZON_ASSOCIATE_TAG` - Amazon affiliate tag
- `AMAZON_PAAPI_ACCESS_KEY` - Amazon PA-API access key
- `AMAZON_PAAPI_SECRET_KEY` - Amazon PA-API secret key
- `ENTERTAINMENT_EARTH_AFFILIATE_ID` - Entertainment Earth affiliate ID
- `LOUNGEFLY_CODE` - Loungefly discount code
- `HOTTOPIC_CODE` - Hot Topic discount code
- `BOXLUNCH_CODE` - BoxLunch discount code
- `DISNEYSTORE_CODE` - Disney Store discount code
- `LEGO_CODE` - LEGO discount code

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review logs for error messages
3. Create an issue on GitHub with details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

Built with TypeScript, Discord.js v14, Prisma, BullMQ, and Railway.

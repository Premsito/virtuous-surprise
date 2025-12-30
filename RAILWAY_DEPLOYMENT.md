# Railway Deployment Guide

## Quick Start on Railway

### Step 1: Set Up PostgreSQL Database

1. In your Railway project, click "New" → "Database" → "Add PostgreSQL"
2. Railway will automatically create a `DATABASE_URL` environment variable

### Step 2: Add Environment Variables

In your Railway project settings, add the following environment variable:

- `DISCORD_TOKEN`: Your Discord bot token from the [Discord Developer Portal](https://discord.com/developers/applications)

The `DATABASE_URL` is automatically provided by Railway when you add PostgreSQL.

### Step 3: Deploy

1. Connect your GitHub repository to Railway
2. Railway will automatically detect the Node.js project and use the `nixpacks.toml` configuration
3. The bot will:
   - Install dependencies using `npm install --omit=dev` (production-only dependencies)
   - Start using the `npm start` command defined in `package.json`
   - Automatically initialize the PostgreSQL database tables on first run
   - Retry database connections with exponential backoff if initial connection fails
   - Handle restarts gracefully with automatic reconnection

### Step 4: Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application or select existing one
3. Go to "Bot" section and create a bot
4. Enable the following Privileged Gateway Intents:
   - **SERVER MEMBERS INTENT** (required for invite tracking)
   - **MESSAGE CONTENT INTENT** (required for command parsing)
5. Copy the bot token and add it to Railway as `DISCORD_TOKEN`
6. Go to OAuth2 → URL Generator:
   - Select scopes: `bot`
   - Select bot permissions:
     - Read Messages/View Channels
     - Send Messages
     - Embed Links
     - Read Message History
     - Manage Server (for invite tracking)
7. Use the generated URL to invite the bot to your server

### Step 5: Verify Deployment

Once deployed on Railway:
1. Check the logs to ensure the bot connected successfully
2. You should see the following log sequence:
   - "✅ Database connection verified"
   - "✅ Database tables initialized"
   - "✅ Bot is online!"
   - "✅ Cached invites for guild: [Your Server Name]"
   - "✅ Bot is fully ready!"
3. The logs should be clean without any npm warnings or database connection errors
4. Test the bot with `!help` in your Discord server

## Deployment Features

This bot includes several production-ready features:

- **Modern npm installation**: Uses `npm install --omit=dev` instead of deprecated `--production` flag
- **Automatic database initialization**: Tables are created automatically on first deployment
- **Connection retry logic**: Attempts to reconnect to the database with exponential backoff (up to 3 retries)
- **Connection pooling**: Optimized PostgreSQL connection pool with 20 max connections
- **Graceful shutdown**: Properly closes database connections and Discord client on shutdown
- **Error resilience**: Handles database disconnections and automatically reconnects

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | Yes | Bot token from Discord Developer Portal |
| `DATABASE_URL` | Yes | PostgreSQL connection string (auto-provided by Railway) |

## Troubleshooting

### Bot doesn't respond to commands
- Verify MESSAGE CONTENT INTENT is enabled in Discord Developer Portal
- Check that the bot has permission to read and send messages in the channel

### Invite tracking not working
- Verify SERVER MEMBERS INTENT is enabled in Discord Developer Portal
- Ensure the bot has "Manage Server" permission

### Database errors
- Verify PostgreSQL is properly added to your Railway project
- Check Railway logs for connection errors
- Ensure DATABASE_URL environment variable is set
- The bot will automatically retry database connections up to 3 times with exponential backoff
- If initialization fails after retries, check that the PostgreSQL service is running in Railway

### npm warnings during deployment
- The bot now uses `npm install --omit=dev` which is the modern replacement for `--production`
- If you see warnings about `--production` being deprecated, ensure the `nixpacks.toml` file is present in the repository
- Railway will automatically use this configuration file when deploying

### Bot crashes on startup
- Check Railway logs for error messages
- Verify DISCORD_TOKEN is correct
- Ensure all dependencies are installed (Railway does this automatically)

## Monitoring

Check your bot's health through Railway:
- View real-time logs in the Railway dashboard
- Monitor resource usage
- Set up alerts for downtime

## Scaling

Railway automatically handles:
- Auto-restart on crash
- Environment variable management
- SSL/TLS for database connections
- 24/7 uptime

For high-traffic servers, consider upgrading your Railway plan for more resources.

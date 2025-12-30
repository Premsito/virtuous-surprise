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
2. Railway will automatically detect the Node.js project
3. The bot will start using the `npm start` command defined in `package.json`

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
2. You should see: "✅ Bot is fully ready!"
3. Test the bot with `!help` in your Discord server

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

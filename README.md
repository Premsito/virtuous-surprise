# Virtuous Surprise - Discord Bot

A feature-rich Discord bot for managing virtual coins (LC), invite tracking, games, and moderation.

## Features

### 💰 LC (Virtual Coins)
- View your balance with `!lc`
- Transfer LC to other members with `!don @user [amount]`
- Earn 25 LC for each successful invite (both inviter and invited member)

### 📊 Invite Tracking
- Automatic detection of successful invites
- Check your invite count with `!invites`
- View the leaderboard with `!topinvites`

### 🎮 Games
- **Duel**: Challenge another member with `!jeu duel @user [amount]`
- **Roulette**: Join a roulette game with `!jeu roulette [amount]`

### 🛡️ Moderation (Admin Only)
- Manually adjust LC with `!setlc @user [amount]`
- Manually adjust invite stats with `!setinvites @user [amount]`

## Setup

### Prerequisites
- Node.js 16.x or higher
- PostgreSQL database
- Discord bot token
- System dependencies for canvas (see below)

**Canvas Dependencies:**
For local development, you may need to install system libraries for the `canvas` package:
- **Ubuntu/Debian**: `sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`
- **macOS**: `brew install pkg-config cairo pango libpng jpeg giflib librsvg`
- **Windows**: See [node-canvas wiki](https://github.com/Automattic/node-canvas/wiki/Installation:-Windows)

Note: Railway and most cloud platforms have these dependencies pre-installed.

### Environment Variables

Create a `.env` file or set these environment variables:

```env
DISCORD_TOKEN=your_discord_bot_token
DATABASE_URL=postgresql://user:password@host:port/database
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Premsito/virtuous-surprise.git
cd virtuous-surprise
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see above)

4. Start the bot:
```bash
npm start
```

## Deployment on Railway

This bot is designed to run on Railway with automatic deployment:

1. Connect your GitHub repository to Railway
2. Set the environment variables in Railway:
   - `DISCORD_TOKEN`: Your Discord bot token
   - `DATABASE_URL`: PostgreSQL connection string (automatically provided by Railway PostgreSQL)
3. Railway will automatically deploy the bot

The bot will:
- Automatically initialize the database tables on first run
- Restart automatically if it crashes
- Scale based on your Railway plan

## Database Structure

The bot uses PostgreSQL with the following tables:
- `users`: Stores user balances and invite counts
- `invite_tracking`: Tracks individual invites
- `transactions`: Records all LC transfers
- `game_history`: Stores game results

## Commands

### General Commands
- `!help` or `!aide` - Show all available commands
- `!lc` - View your LC balance
- `!don @user [amount]` - Transfer LC to another member
- `!invites` - Check your invite count
- `!topinvites` - Display invite leaderboard
- `!stats` - View your statistics
- `!stats @user` - View another user's statistics

### Game Commands
- `!jeu duel @user [amount]` - Challenge a member to a duel
- `!jeu roulette [amount]` - Join a roulette game

### Moderation Commands (Admin only)
- `!setlc @user [amount]` - Set a user's LC balance
- `!setinvites @user [amount]` - Set a user's invite count

## Configuration

### Bot Settings (config.json)

Edit `config.json` to customize:
- Command prefix
- Currency name and symbol
- Invite rewards
- Channel IDs (e.g., invite tracker channel)
- Custom emote names
- Game bet limits
- Colors for embeds

**Note**: The `inviteTracker` channel ID in `config.json` should be set to the Discord channel where invite tracking messages should be posted. Update this value to match your server's channel ID.

### Bot Responses (responses.json)

Edit `responses.json` to customize all bot text responses:
- Command messages and descriptions
- Error messages
- Game notifications
- Help text

All responses support placeholders (e.g., `{user}`, `{balance}`, `{amount}`) for dynamic content.

See [RESPONSES.md](RESPONSES.md) for detailed documentation on customizing responses.

## Project Structure

```
virtuous-surprise/
├── bot.js                 # Main bot file
├── config.json            # Configuration file
├── responses.json         # Text responses configuration
├── package.json           # Dependencies
├── .env.example           # Environment variables template
├── commands/              # Command modules
│   ├── lc.js             # LC management
│   ├── invites.js        # Invite tracking
│   ├── jeu.js            # Games
│   ├── stats.js          # User statistics
│   └── moderation.js     # Admin commands
├── utils/                # Utility modules
│   └── responseHelper.js # Response management
└── database/             # Database layer
    ├── init.sql          # Table schemas
    └── db.js             # Database queries
```

## License

MIT

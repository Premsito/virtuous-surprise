require('dotenv').config();
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const { db } = require('./database/db');
const config = require('./config.json');

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildInvites
    ]
});

// Load commands
client.commands = new Collection();
const lcCommand = require('./commands/lc');
const invitesCommand = require('./commands/invites');
const jeuCommand = require('./commands/jeu');
const moderationCommand = require('./commands/moderation');

client.commands.set(lcCommand.name, lcCommand);
client.commands.set(invitesCommand.name, invitesCommand);
client.commands.set(jeuCommand.name, jeuCommand);
client.commands.set(moderationCommand.name, moderationCommand);

// Store invites for tracking
const invites = new Map();

// Bot ready event
client.once('ready', async () => {
    console.log('🤖 Bot is online!');
    console.log(`📝 Logged in as ${client.user.tag}`);
    
    try {
        // Initialize database
        await db.initialize();
        
        // Cache invites for all guilds
        for (const guild of client.guilds.cache.values()) {
            const guildInvites = await guild.invites.fetch();
            invites.set(guild.id, new Map(guildInvites.map(invite => [invite.code, invite.uses])));
            console.log(`✅ Cached invites for guild: ${guild.name}`);
        }
        
        console.log('✅ Bot is fully ready!');
    } catch (error) {
        console.error('❌ Error during initialization:', error);
    }
});

// Guild member add event (invite tracking)
client.on('guildMemberAdd', async (member) => {
    try {
        const guildId = member.guild.id;
        const cachedInvites = invites.get(guildId);
        const newInvites = await member.guild.invites.fetch();
        
        // Find which invite was used
        let usedInvite = null;
        for (const [code, invite] of newInvites) {
            const cachedUses = cachedInvites.get(code) || 0;
            if (invite.uses > cachedUses) {
                usedInvite = invite;
                break;
            }
        }
        
        // Update cache
        invites.set(guildId, new Map(newInvites.map(invite => [invite.code, invite.uses])));
        
        if (usedInvite && usedInvite.inviter) {
            const inviterId = usedInvite.inviter.id;
            const invitedId = member.id;
            
            // Don't track bot invites
            if (member.user.bot) return;
            
            // Create or get inviter
            let inviter = await db.getUser(inviterId);
            if (!inviter) {
                inviter = await db.createUser(inviterId, usedInvite.inviter.username);
            }
            
            // Create or get invited user
            let invited = await db.getUser(invitedId);
            if (!invited) {
                invited = await db.createUser(invitedId, member.user.username, inviterId);
            }
            
            // Increment inviter's invite count
            await db.incrementInvites(inviterId);
            
            // Record the invite
            await db.recordInvite(inviterId, invitedId);
            
            // Reward both users with LC
            await db.updateBalance(inviterId, config.currency.inviteReward);
            await db.updateBalance(invitedId, config.currency.inviteReward);
            
            // Record transactions
            await db.recordTransaction(null, inviterId, config.currency.inviteReward, 'invite_reward', 'Reward for inviting a member');
            await db.recordTransaction(null, invitedId, config.currency.inviteReward, 'invite_reward', 'Reward for joining via invite');
            
            console.log(`✅ ${usedInvite.inviter.username} invited ${member.user.username}`);
            
            // Send notification (optional - you can customize this)
            const systemChannel = member.guild.systemChannel;
            if (systemChannel) {
                const embed = new EmbedBuilder()
                    .setColor(config.colors.success)
                    .setTitle('🎉 Nouvelle invitation!')
                    .setDescription(
                        `${member.user} a rejoint grâce à l'invitation de ${usedInvite.inviter}!\n\n` +
                        `Les deux ont reçu **${config.currency.inviteReward} LC** ${config.currency.symbol}`
                    )
                    .setTimestamp();
                
                systemChannel.send({ embeds: [embed] }).catch(console.error);
            }
        }
    } catch (error) {
        console.error('Error tracking invite:', error);
    }
});

// Message create event (command handling)
client.on('messageCreate', async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Check if message starts with prefix
    if (!message.content.startsWith(config.prefix)) return;
    
    // Parse command and arguments
    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    try {
        // Handle commands
        if (commandName === 'lc') {
            const command = client.commands.get('lc');
            await command.execute(message, args);
        } else if (commandName === 'invites') {
            const command = client.commands.get('invites');
            await command.execute(message, args, client);
        } else if (commandName === 'jeu') {
            const command = client.commands.get('jeu');
            await command.execute(message, args);
        } else if (commandName === 'don') {
            const command = client.commands.get('moderation');
            await command.execute(message, args, 'don');
        } else if (commandName === 'setlc') {
            const command = client.commands.get('moderation');
            await command.execute(message, args, 'setlc');
        } else if (commandName === 'setinvites') {
            const command = client.commands.get('moderation');
            await command.execute(message, args, 'setinvites');
        } else if (commandName === 'topinvites') {
            const command = client.commands.get('moderation');
            await command.execute(message, args, 'topinvites');
        } else if (commandName === 'help' || commandName === 'aide') {
            await showHelp(message);
        }
    } catch (error) {
        console.error('Error executing command:', error);
        message.reply('❌ Une erreur est survenue lors de l\'exécution de la commande.').catch(console.error);
    }
});

// Help command
async function showHelp(message) {
    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle('📚 Commandes disponibles')
        .setDescription('Voici toutes les commandes disponibles:')
        .addFields(
            {
                name: `${config.currency.symbol} LC (Virtual Coins)`,
                value: 
                    `\`${config.prefix}lc\` - Voir votre solde\n` +
                    `\`${config.prefix}don @user [montant]\` - Transférer des LC`,
                inline: false
            },
            {
                name: '📊 Invitations',
                value: 
                    `\`${config.prefix}invites\` - Voir vos invitations\n` +
                    `\`${config.prefix}topinvites\` - Classement des invitations`,
                inline: false
            },
            {
                name: '🎮 Jeux',
                value: 
                    `\`${config.prefix}jeu duel @user [montant]\` - Défier un joueur\n` +
                    `\`${config.prefix}jeu roulette [montant]\` - Jouer à la roulette`,
                inline: false
            },
            {
                name: '🛡️ Modération (Admin uniquement)',
                value: 
                    `\`${config.prefix}setlc @user [montant]\` - Définir le solde LC\n` +
                    `\`${config.prefix}setinvites @user [nombre]\` - Définir les invitations`,
                inline: false
            }
        )
        .setFooter({ text: `Préfixe: ${config.prefix}` })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

// Error handling
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('❌ Failed to login to Discord:', error);
    process.exit(1);
});

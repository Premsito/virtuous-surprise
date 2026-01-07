const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');
const { getResponse } = require('../utils/responseHelper');

// Active games storage
const activeQuizDuoGames = new Map();

// Quiz questions database
const quizQuestions = [
    {
        question: "Quelle est la capitale de la France ?",
        answers: ["Paris", "Londres", "Berlin", "Madrid"],
        correct: 0
    },
    {
        question: "Quel est le plus grand océan du monde ?",
        answers: ["Atlantique", "Indien", "Pacifique", "Arctique"],
        correct: 2
    },
    {
        question: "En quelle année a eu lieu la Révolution française ?",
        answers: ["1789", "1792", "1776", "1804"],
        correct: 0
    },
    {
        question: "Quelle planète est surnommée la 'planète rouge' ?",
        answers: ["Vénus", "Jupiter", "Mars", "Saturne"],
        correct: 2
    },
    {
        question: "Qui a peint la Joconde ?",
        answers: ["Van Gogh", "Picasso", "Leonardo da Vinci", "Monet"],
        correct: 2
    },
    {
        question: "Quel est le plus petit pays du monde ?",
        answers: ["Monaco", "Vatican", "San Marin", "Liechtenstein"],
        correct: 1
    },
    {
        question: "Combien de continents y a-t-il sur Terre ?",
        answers: ["5", "6", "7", "8"],
        correct: 2
    },
    {
        question: "Quel élément chimique a pour symbole 'O' ?",
        answers: ["Or", "Osmium", "Oxygène", "Oganesson"],
        correct: 2
    },
    {
        question: "Quelle est la langue la plus parlée au monde ?",
        answers: ["Anglais", "Chinois mandarin", "Espagnol", "Hindi"],
        correct: 1
    },
    {
        question: "Quel est le plus long fleuve du monde ?",
        answers: ["Nil", "Amazone", "Yangtsé", "Mississippi"],
        correct: 0
    },
    {
        question: "En quelle année l'homme a-t-il marché sur la Lune pour la première fois ?",
        answers: ["1965", "1967", "1969", "1971"],
        correct: 2
    },
    {
        question: "Quelle est la vitesse de la lumière dans le vide ?",
        answers: ["300 000 km/s", "150 000 km/s", "450 000 km/s", "200 000 km/s"],
        correct: 0
    },
    {
        question: "Qui a écrit 'Les Misérables' ?",
        answers: ["Émile Zola", "Victor Hugo", "Alexandre Dumas", "Gustave Flaubert"],
        correct: 1
    },
    {
        question: "Combien y a-t-il de joueurs dans une équipe de football ?",
        answers: ["10", "11", "12", "9"],
        correct: 1
    },
    {
        question: "Quelle est la capitale du Japon ?",
        answers: ["Séoul", "Pékin", "Tokyo", "Bangkok"],
        correct: 2
    },
    {
        question: "Quel est le symbole chimique de l'or ?",
        answers: ["Au", "Ag", "Or", "Go"],
        correct: 0
    },
    {
        question: "Quelle est la plus haute montagne du monde ?",
        answers: ["K2", "Mont Blanc", "Everest", "Kilimandjaro"],
        correct: 2
    },
    {
        question: "Combien de cordes a une guitare classique ?",
        answers: ["4", "5", "6", "7"],
        correct: 2
    },
    {
        question: "Quel est le plus grand désert du monde ?",
        answers: ["Sahara", "Gobi", "Antarctique", "Arabie"],
        correct: 2
    },
    {
        question: "Qui a inventé l'ampoule électrique ?",
        answers: ["Tesla", "Edison", "Bell", "Marconi"],
        correct: 1
    }
];

const ANSWER_EMOJIS = ['🅰', '🅱', '🅲', '🅳'];

module.exports = {
    name: 'quizduo',
    description: 'Duel de Quiz - competitive knowledge quiz between two players',
    
    async execute(message, args) {
        const challenger = message.author;
        const challengerId = challenger.id;
        
        // Get opponent
        const opponentMention = message.mentions.users.first();
        if (!opponentMention) {
            return message.reply(getResponse('quizduo.noOpponent'));
        }
        
        if (opponentMention.id === challengerId) {
            return message.reply(getResponse('quizduo.selfChallenge'));
        }
        
        if (opponentMention.bot) {
            return message.reply(getResponse('quizduo.botChallenge'));
        }
        
        const opponentId = opponentMention.id;
        
        // Ensure both users exist
        let challengerUser = await db.getUser(challengerId);
        if (!challengerUser) {
            challengerUser = await db.createUser(challengerId, challenger.username);
        }
        
        let opponentUser = await db.getUser(opponentId);
        if (!opponentUser) {
            opponentUser = await db.createUser(opponentId, opponentMention.username);
        }
        
        // Check if already in a game
        if (activeQuizDuoGames.has(challengerId) || activeQuizDuoGames.has(opponentId)) {
            return message.reply(getResponse('quizduo.alreadyInGame'));
        }
        
        // Create game request
        const gameId = `${challengerId}-${opponentId}-${Date.now()}`;
        activeQuizDuoGames.set(challengerId, gameId);
        activeQuizDuoGames.set(opponentId, gameId);
        
        const challengeEmbed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle(getResponse('quizduo.challenge.title'))
            .setDescription(getResponse('quizduo.challenge.description', {
                challenger: challenger,
                opponent: opponentMention,
                questionCount: config.games.quizduo.questionCount
            }))
            .setTimestamp();
        
        // Create buttons for acceptance
        const acceptButton = new ButtonBuilder()
            .setCustomId('quizduo_accept')
            .setLabel('Accepter')
            .setEmoji('✅')
            .setStyle(ButtonStyle.Success);
        
        const refuseButton = new ButtonBuilder()
            .setCustomId('quizduo_refuse')
            .setLabel('Refuser')
            .setEmoji('❌')
            .setStyle(ButtonStyle.Danger);
        
        const row = new ActionRowBuilder()
            .addComponents(acceptButton, refuseButton);
        
        const challengeMsg = await message.reply({ embeds: [challengeEmbed], components: [row] });
        
        // Wait for button interaction
        const filter = i => {
            return i.user.id === opponentId && (i.customId === 'quizduo_accept' || i.customId === 'quizduo_refuse');
        };
        
        try {
            const interaction = await challengeMsg.awaitMessageComponent({ filter, time: 30000 });
            
            // Disable buttons after interaction
            acceptButton.setDisabled(true);
            refuseButton.setDisabled(true);
            await challengeMsg.edit({ components: [row] });
            
            // Check if refused
            if (interaction.customId === 'quizduo_refuse') {
                await interaction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(config.colors.error)
                            .setTitle(getResponse('quizduo.refused.title'))
                            .setDescription(getResponse('quizduo.refused.description', {
                                opponent: opponentMention
                            }))
                            .setTimestamp()
                    ],
                    components: []
                });
                return;
            }
            
            // Accepted - acknowledge the interaction
            await interaction.update({
                embeds: [
                    new EmbedBuilder()
                        .setColor(config.colors.success)
                        .setTitle(getResponse('quizduo.accepted.title'))
                        .setDescription(getResponse('quizduo.accepted.description', {
                            opponent: opponentMention
                        }))
                        .setTimestamp()
                ],
                components: []
            });
            
            // Select random questions using Fisher-Yates shuffle
            const shuffled = [...quizQuestions];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            const selectedQuestions = shuffled.slice(0, config.games.quizduo.questionCount);
            
            // Track scores
            const scores = new Map([[challengerId, 0], [opponentId, 0]]);
            
            // Ask questions
            for (let i = 0; i < selectedQuestions.length; i++) {
                const question = selectedQuestions[i];
                const questionNumber = i + 1;
                
                const questionEmbed = new EmbedBuilder()
                    .setColor(config.colors.primary)
                    .setTitle(getResponse('quizduo.question.title', { number: questionNumber, total: selectedQuestions.length }))
                    .setDescription(`**${question.question}**\n\n${ANSWER_EMOJIS[0]} **A:** ${question.answers[0]}\n${ANSWER_EMOJIS[1]} **B:** ${question.answers[1]}\n${ANSWER_EMOJIS[2]} **C:** ${question.answers[2]}\n${ANSWER_EMOJIS[3]} **D:** ${question.answers[3]}\n\n⏱️ Vous avez 10 secondes pour répondre!`)
                    .setTimestamp();
                
                // Create answer buttons
                const answerButtons = question.answers.map((_, idx) => 
                    new ButtonBuilder()
                        .setCustomId(`quizduo_answer_${idx}`)
                        .setLabel(String.fromCharCode(65 + idx))
                        .setEmoji(ANSWER_EMOJIS[idx])
                        .setStyle(ButtonStyle.Primary)
                );
                
                const answerRow = new ActionRowBuilder()
                    .addComponents(answerButtons);
                
                const questionMsg = await message.channel.send({ embeds: [questionEmbed], components: [answerRow] });
                
                // Wait up to 10 seconds for players to answer
                const answers = new Map();
                const answerTimes = new Map();
                const questionStartTime = Date.now();
                
                const answerFilter = i => {
                    return (i.user.id === challengerId || i.user.id === opponentId) && 
                           i.customId.startsWith('quizduo_answer_');
                };
                
                const answerCollector = questionMsg.createMessageComponentCollector({ 
                    filter: answerFilter, 
                    time: 10000 
                });
                
                answerCollector.on('collect', async i => {
                    // Only allow one answer per player per question
                    if (answers.has(i.user.id)) {
                        await i.reply({ content: getResponse('quizduo.alreadyAnswered'), ephemeral: true });
                        return;
                    }
                    
                    const answerIndex = parseInt(i.customId.replace('quizduo_answer_', ''));
                    const responseTime = Date.now() - questionStartTime;
                    answers.set(i.user.id, answerIndex);
                    answerTimes.set(i.user.id, responseTime);
                    
                    await i.reply({ content: getResponse('quizduo.answerRecorded'), ephemeral: true });
                    
                    if (answers.size === 2) {
                        answerCollector.stop('both_answered');
                    }
                });
                
                await new Promise((resolve) => {
                    answerCollector.on('end', () => {
                        resolve();
                    });
                });
                
                // Disable all answer buttons
                answerButtons.forEach(btn => btn.setDisabled(true));
                await questionMsg.edit({ components: [answerRow] });
                
                // Check answers and update scores
                const challengerAnswer = answers.get(challengerId);
                const opponentAnswer = answers.get(opponentId);
                const challengerTime = answerTimes.get(challengerId);
                const opponentTime = answerTimes.get(opponentId);
                
                const challengerCorrect = challengerAnswer === question.correct;
                const opponentCorrect = opponentAnswer === question.correct;
                
                // Points awarded: 1 point for correct answer
                if (challengerCorrect) scores.set(challengerId, scores.get(challengerId) + 1);
                if (opponentCorrect) scores.set(opponentId, scores.get(opponentId) + 1);
                
                // Show results for this question
                const feedbackEmbed = new EmbedBuilder()
                    .setColor(config.colors.success)
                    .setTitle(getResponse('quizduo.feedback.title'))
                    .setDescription(`✅ **Bonne réponse:** ${ANSWER_EMOJIS[question.correct]} **${String.fromCharCode(65 + question.correct)}** - ${question.answers[question.correct]}`)
                    .addFields(
                        {
                            name: `${challenger.username}`,
                            value: challengerAnswer !== undefined 
                                ? `${ANSWER_EMOJIS[challengerAnswer]} ${question.answers[challengerAnswer]} ${challengerCorrect ? '✅' : '❌'} (${(challengerTime / 1000).toFixed(1)}s)`
                                : '⏱️ Pas de réponse',
                            inline: true
                        },
                        {
                            name: `${opponentMention.username}`,
                            value: opponentAnswer !== undefined
                                ? `${ANSWER_EMOJIS[opponentAnswer]} ${question.answers[opponentAnswer]} ${opponentCorrect ? '✅' : '❌'} (${(opponentTime / 1000).toFixed(1)}s)`
                                : '⏱️ Pas de réponse',
                            inline: true
                        }
                    )
                    .addFields({
                        name: '📊 Score actuel',
                        value: `${challenger.username}: **${scores.get(challengerId)} points**\n${opponentMention.username}: **${scores.get(opponentId)} points**`,
                        inline: false
                    })
                    .setTimestamp();
                
                await message.channel.send({ embeds: [feedbackEmbed] });
                
                // Wait before next question
                if (i < selectedQuestions.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
            
            // Determine winner
            const challengerScore = scores.get(challengerId);
            const opponentScore = scores.get(opponentId);
            
            const resultEmbed = new EmbedBuilder()
                .setTitle('🎉 Jeu terminé ! Résultats :')
                .setTimestamp();
            
            if (challengerScore === opponentScore) {
                // Draw
                resultEmbed
                    .setColor(config.colors.warning)
                    .setDescription(`🤝 **ÉGALITÉ !**\n\n${challenger} : ${challengerScore} points\n${opponentMention} : ${opponentScore} points\n\n🏆 Vainqueur : Aucun - Match nul !`);
            } else {
                // Someone won
                const winner = challengerScore > opponentScore ? challenger : opponentMention;
                
                resultEmbed
                    .setColor(config.colors.success)
                    .setDescription(`${challenger} : ${challengerScore} points\n${opponentMention} : ${opponentScore} points\n\n🏆 Vainqueur : ${winner}`);
            }
            
            await message.channel.send({ embeds: [resultEmbed] });
            
        } catch (error) {
            // Acceptance timeout or inactivity
            const timeoutEmbed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setTitle(getResponse('quizduo.timeout.title'))
                .setDescription(getResponse('quizduo.timeout.description'))
                .setTimestamp();
            
            await challengeMsg.edit({ embeds: [timeoutEmbed], components: [] });
        } finally {
            activeQuizDuoGames.delete(challengerId);
            activeQuizDuoGames.delete(opponentId);
        }
    }
};

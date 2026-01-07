const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');
const { getResponse } = require('../utils/responseHelper');

// Active games storage
const activeQuizGames = new Map();

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
    }
];

const ANSWER_EMOJIS = ['🅰️', '🅱️', '🅲', '🅳'];

module.exports = {
    name: 'quiz',
    description: 'Quiz duel between two players',
    
    async execute(message, args) {
        const challenger = message.author;
        const challengerId = challenger.id;
        
        // Get opponent
        const opponentMention = message.mentions.users.first();
        if (!opponentMention) {
            return message.reply(getResponse('quiz.noOpponent'));
        }
        
        if (opponentMention.id === challengerId) {
            return message.reply(getResponse('quiz.selfChallenge'));
        }
        
        if (opponentMention.bot) {
            return message.reply(getResponse('quiz.botChallenge'));
        }
        
        const opponentId = opponentMention.id;
        
        // Get bet amount
        const betAmount = parseInt(args[1]);
        if (!betAmount || betAmount < config.games.quiz.minBet || betAmount > config.games.quiz.maxBet) {
            return message.reply(getResponse('quiz.invalidBet', {
                minBet: config.games.quiz.minBet,
                maxBet: config.games.quiz.maxBet
            }));
        }
        
        // Ensure both users exist
        let challengerUser = await db.getUser(challengerId);
        if (!challengerUser) {
            challengerUser = await db.createUser(challengerId, challenger.username);
        }
        
        let opponentUser = await db.getUser(opponentId);
        if (!opponentUser) {
            opponentUser = await db.createUser(opponentId, opponentMention.username);
        }
        
        // Check balances
        if (challengerUser.balance < betAmount) {
            return message.reply(getResponse('quiz.insufficientBalanceChallenger', {
                balance: challengerUser.balance
            }));
        }
        
        if (opponentUser.balance < betAmount) {
            return message.reply(getResponse('quiz.insufficientBalanceOpponent', {
                opponent: opponentMention.username
            }));
        }
        
        // Check if already in a game
        if (activeQuizGames.has(challengerId) || activeQuizGames.has(opponentId)) {
            return message.reply(getResponse('quiz.alreadyInGame'));
        }
        
        // Create game request
        const gameId = `${challengerId}-${opponentId}-${Date.now()}`;
        activeQuizGames.set(challengerId, gameId);
        activeQuizGames.set(opponentId, gameId);
        
        const challengeEmbed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle(getResponse('quiz.challenge.title'))
            .setDescription(getResponse('quiz.challenge.description', {
                challenger: challenger,
                opponent: opponentMention,
                bet: betAmount,
                questionCount: config.games.quiz.questionCount
            }))
            .setTimestamp();
        
        // Create buttons for acceptance
        const acceptButton = new ButtonBuilder()
            .setCustomId('quiz_accept')
            .setLabel('Accepter')
            .setEmoji('✅')
            .setStyle(ButtonStyle.Success);
        
        const refuseButton = new ButtonBuilder()
            .setCustomId('quiz_refuse')
            .setLabel('Refuser')
            .setEmoji('❌')
            .setStyle(ButtonStyle.Danger);
        
        const row = new ActionRowBuilder()
            .addComponents(acceptButton, refuseButton);
        
        const challengeMsg = await message.reply({ embeds: [challengeEmbed], components: [row] });
        
        // Wait for button interaction
        const filter = i => {
            return i.user.id === opponentId && (i.customId === 'quiz_accept' || i.customId === 'quiz_refuse');
        };
        
        try {
            const interaction = await challengeMsg.awaitMessageComponent({ filter, time: 30000 });
            
            // Disable buttons after interaction
            acceptButton.setDisabled(true);
            refuseButton.setDisabled(true);
            await challengeMsg.edit({ components: [row] });
            
            // Check if refused
            if (interaction.customId === 'quiz_refuse') {
                await interaction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(config.colors.error)
                            .setTitle(getResponse('quiz.refused.title'))
                            .setDescription(getResponse('quiz.refused.description', {
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
                        .setTitle(getResponse('quiz.accepted.title'))
                        .setDescription(getResponse('quiz.accepted.description', {
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
            const selectedQuestions = shuffled.slice(0, config.games.quiz.questionCount);
            
            // Track scores
            const scores = new Map([[challengerId, 0], [opponentId, 0]]);
            
            // Ask questions
            for (let i = 0; i < selectedQuestions.length; i++) {
                const question = selectedQuestions[i];
                const questionNumber = i + 1;
                
                const questionEmbed = new EmbedBuilder()
                    .setColor(config.colors.primary)
                    .setTitle(getResponse('quiz.question.title', { number: questionNumber, total: selectedQuestions.length }))
                    .setDescription(question.question)
                    .addFields(
                        question.answers.map((answer, idx) => ({
                            name: `${ANSWER_EMOJIS[idx]} ${String.fromCharCode(65 + idx)}`,
                            value: answer,
                            inline: true
                        }))
                    )
                    .setTimestamp();
                
                // Create answer buttons
                const answerButtons = question.answers.map((_, idx) => 
                    new ButtonBuilder()
                        .setCustomId(`quiz_answer_${idx}`)
                        .setLabel(String.fromCharCode(65 + idx))
                        .setEmoji(ANSWER_EMOJIS[idx])
                        .setStyle(ButtonStyle.Primary)
                );
                
                const answerRow = new ActionRowBuilder()
                    .addComponents(answerButtons);
                
                const questionMsg = await message.channel.send({ embeds: [questionEmbed], components: [answerRow] });
                
                // Wait for both players to answer
                const answers = new Map();
                const answerFilter = i => {
                    return (i.user.id === challengerId || i.user.id === opponentId) && 
                           i.customId.startsWith('quiz_answer_');
                };
                
                const answerCollector = questionMsg.createMessageComponentCollector({ filter: answerFilter, time: 15000 });
                
                answerCollector.on('collect', async i => {
                    // Only allow one answer per player per question
                    if (answers.has(i.user.id)) {
                        await i.reply({ content: getResponse('quiz.alreadyAnswered'), ephemeral: true });
                        return;
                    }
                    
                    const answerIndex = parseInt(i.customId.replace('quiz_answer_', ''));
                    answers.set(i.user.id, answerIndex);
                    
                    await i.reply({ content: getResponse('quiz.answerRecorded'), ephemeral: true });
                    
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
                
                const challengerCorrect = challengerAnswer === question.correct;
                const opponentCorrect = opponentAnswer === question.correct;
                
                if (challengerCorrect) scores.set(challengerId, scores.get(challengerId) + 1);
                if (opponentCorrect) scores.set(opponentId, scores.get(opponentId) + 1);
                
                // Show results for this question
                const feedbackEmbed = new EmbedBuilder()
                    .setColor(config.colors.success)
                    .setTitle(getResponse('quiz.feedback.title'))
                    .setDescription(getResponse('quiz.feedback.description', {
                        correctAnswer: ANSWER_EMOJIS[question.correct],
                        correctAnswerLetter: String.fromCharCode(65 + question.correct),
                        correctAnswerText: question.answers[question.correct]
                    }))
                    .addFields(
                        {
                            name: `${challenger.username}`,
                            value: challengerAnswer !== undefined 
                                ? `${ANSWER_EMOJIS[challengerAnswer]} ${question.answers[challengerAnswer]} ${challengerCorrect ? '✅' : '❌'}`
                                : '⏱️ Pas de réponse',
                            inline: true
                        },
                        {
                            name: `${opponentMention.username}`,
                            value: opponentAnswer !== undefined
                                ? `${ANSWER_EMOJIS[opponentAnswer]} ${question.answers[opponentAnswer]} ${opponentCorrect ? '✅' : '❌'}`
                                : '⏱️ Pas de réponse',
                            inline: true
                        }
                    )
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
                .setTitle(getResponse('quiz.result.title'))
                .setTimestamp();
            
            if (challengerScore === opponentScore) {
                // Draw
                resultEmbed
                    .setColor(config.colors.warning)
                    .setDescription(getResponse('quiz.result.draw', {
                        challenger: challenger,
                        challengerScore: challengerScore,
                        opponent: opponentMention,
                        opponentScore: opponentScore
                    }));
            } else {
                // Someone won
                const winner = challengerScore > opponentScore ? challengerId : opponentId;
                const loser = challengerScore > opponentScore ? opponentId : challengerId;
                const winnerUser = challengerScore > opponentScore ? challenger : opponentMention;
                const loserUser = challengerScore > opponentScore ? opponentMention : challenger;
                const winnerScore = Math.max(challengerScore, opponentScore);
                const loserScore = Math.min(challengerScore, opponentScore);
                
                // Transfer LC
                await db.updateBalance(winner, betAmount);
                await db.updateBalance(loser, -betAmount);
                
                // Record game
                await db.recordGame('quiz', challengerId, opponentId, betAmount, winner === challengerId ? 'win' : 'loss', winner === challengerId ? betAmount : 0);
                await db.recordGame('quiz', opponentId, challengerId, betAmount, winner === opponentId ? 'win' : 'loss', winner === opponentId ? betAmount : 0);
                
                resultEmbed
                    .setColor(config.colors.success)
                    .setDescription(getResponse('quiz.result.description', {
                        winner: winnerUser,
                        winnerScore: winnerScore,
                        loser: loserUser,
                        loserScore: loserScore,
                        winnings: betAmount * 2
                    }));
            }
            
            await message.channel.send({ embeds: [resultEmbed] });
            
        } catch (error) {
            // Acceptance timeout
            const timeoutEmbed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setTitle(getResponse('quiz.refused.title'))
                .setDescription(getResponse('quiz.refused.description', {
                    opponent: opponentMention
                }))
                .setTimestamp();
            
            await challengeMsg.edit({ embeds: [timeoutEmbed], components: [] });
        } finally {
            activeQuizGames.delete(challengerId);
            activeQuizGames.delete(opponentId);
        }
    }
};

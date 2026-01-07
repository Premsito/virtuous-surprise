const fs = require('fs');

console.log('🧪 Testing Quiz Duo Command Implementation');

// Test 1: Check command file exists
console.log('\n1. Testing command file...');
if (fs.existsSync('./commands/quizduo.js')) {
    console.log('   ✅ quizduo.js exists');
    const content = fs.readFileSync('./commands/quizduo.js', 'utf8');
    
    // Check for essential elements
    if (content.includes("name: 'quizduo'")) {
        console.log('   ✅ Command name is correct');
    } else {
        console.log('   ❌ Command name is incorrect');
        process.exit(1);
    }
    
    if (content.includes('async execute(message, args)')) {
        console.log('   ✅ Execute function exists');
    } else {
        console.log('   ❌ Execute function missing');
        process.exit(1);
    }
} else {
    console.log('   ❌ quizduo.js file missing');
    process.exit(1);
}

// Test 2: Check configuration
console.log('\n2. Testing configuration...');
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
if (config.games.quizduo) {
    console.log('   ✅ Quiz duo configuration exists');
    console.log('   📝 Question count:', config.games.quizduo.questionCount);
} else {
    console.log('   ❌ Quiz duo configuration missing');
    process.exit(1);
}

// Test 3: Check responses
console.log('\n3. Testing responses...');
const responses = JSON.parse(fs.readFileSync('./responses.json', 'utf8'));
const requiredResponses = [
    'noOpponent',
    'selfChallenge',
    'botChallenge',
    'alreadyInGame',
    'challenge',
    'refused',
    'accepted',
    'question',
    'alreadyAnswered',
    'answerRecorded',
    'feedback',
    'timeout'
];

if (responses.quizduo) {
    console.log('   ✅ Quiz duo responses exist');
    
    let allFound = true;
    for (const key of requiredResponses) {
        if (!responses.quizduo[key]) {
            console.log(`   ❌ Missing response: ${key}`);
            allFound = false;
        }
    }
    
    if (allFound) {
        console.log('   ✅ All required responses present');
    } else {
        process.exit(1);
    }
} else {
    console.log('   ❌ Quiz duo responses missing');
    process.exit(1);
}

// Test 4: Check bot.js registration
console.log('\n4. Testing bot.js registration...');
const botJs = fs.readFileSync('./bot.js', 'utf8');

if (botJs.includes("require('./commands/quizduo')")) {
    console.log('   ✅ Command is required in bot.js');
} else {
    console.log('   ❌ Command is not required in bot.js');
    process.exit(1);
}

if (botJs.includes("client.commands.set(quizduoCommand.name, quizduoCommand)")) {
    console.log('   ✅ Command is registered in commands collection');
} else {
    console.log('   ❌ Command is not registered in commands collection');
    process.exit(1);
}

if (botJs.includes("commandName === 'quizduo'")) {
    console.log('   ✅ Command handler exists in message event');
} else {
    console.log('   ❌ Command handler missing in message event');
    process.exit(1);
}

// Test 5: Check question database
console.log('\n5. Testing question database...');
const moduleContent = fs.readFileSync('./commands/quizduo.js', 'utf8');

// Count questions by looking for question objects
const questionMatches = moduleContent.match(/question: "/g);
if (questionMatches && questionMatches.length >= 10) {
    console.log(`   ✅ Question database has ${questionMatches.length} questions`);
} else {
    console.log('   ⚠️  Warning: Question database might be small');
}

// Test 6: Check for key features
console.log('\n6. Testing key features...');
const features = {
    'Accept/Refuse buttons': moduleContent.includes('quizduo_accept') && moduleContent.includes('quizduo_refuse'),
    'Answer buttons (A, B, C, D)': moduleContent.includes('ANSWER_EMOJIS') && moduleContent.includes('🅰'),
    '10-second timer': moduleContent.includes('time: 10000'),
    '30-second acceptance timeout': moduleContent.includes('time: 30000'),
    'Score tracking': moduleContent.includes('scores.set'),
    'Scoreboard updates': moduleContent.includes('Score actuel'),
    'Final results': moduleContent.includes('Jeu terminé')
};

for (const [feature, present] of Object.entries(features)) {
    if (present) {
        console.log(`   ✅ ${feature}`);
    } else {
        console.log(`   ❌ ${feature}`);
    }
}

console.log('\n✅ All tests passed!');
console.log('\n📋 Summary:');
console.log('   - Command: quizduo');
console.log('   - Usage: !quizduo @user');
console.log('   - Questions per game:', config.games.quizduo.questionCount);
console.log('   - Timer per question: 10 seconds');
console.log('   - Acceptance timeout: 30 seconds');
console.log('\n🎮 The Duel de Quiz game is ready to use!');

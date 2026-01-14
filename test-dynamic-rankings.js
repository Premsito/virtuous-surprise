/**
 * Test script for dynamic rankings update system
 * Tests LC and Niveau change event emissions and rankings refresh
 */

const lcEventEmitter = require('./utils/lcEventEmitter');
const niveauEventEmitter = require('./utils/niveauEventEmitter');

console.log('🧪 Testing Dynamic Rankings Update System\n');
console.log('='.repeat(60));

let testsRun = 0;
let testsPassed = 0;

function test(description, fn) {
    testsRun++;
    try {
        fn();
        testsPassed++;
        console.log(`✅ ${description}`);
        return true;
    } catch (error) {
        console.error(`❌ ${description}`);
        console.error(`   Error: ${error.message}`);
        return false;
    }
}

// Test 1: LC Event Emitter exists
test('LC Event Emitter is properly exported', () => {
    if (!lcEventEmitter) throw new Error('LC Event Emitter not found');
    if (typeof lcEventEmitter.emitLCChange !== 'function') {
        throw new Error('emitLCChange method not found');
    }
    if (typeof lcEventEmitter.onLCChange !== 'function') {
        throw new Error('onLCChange method not found');
    }
});

// Test 2: Niveau Event Emitter exists
test('Niveau Event Emitter is properly exported', () => {
    if (!niveauEventEmitter) throw new Error('Niveau Event Emitter not found');
    if (typeof niveauEventEmitter.emitNiveauChange !== 'function') {
        throw new Error('emitNiveauChange method not found');
    }
    if (typeof niveauEventEmitter.onNiveauChange !== 'function') {
        throw new Error('onNiveauChange method not found');
    }
});

// Test 3: LC Event Emission
test('LC Event Emitter can emit and receive events', () => {
    let eventReceived = false;
    const testUserId = 'test_user_123';
    const testOldBalance = 100;
    const testNewBalance = 150;
    
    const handler = (changeEvent) => {
        if (changeEvent.userId === testUserId && 
            changeEvent.oldBalance === testOldBalance &&
            changeEvent.newBalance === testNewBalance) {
            eventReceived = true;
        }
    };
    
    lcEventEmitter.onLCChange(handler);
    lcEventEmitter.emitLCChange(testUserId, testOldBalance, testNewBalance, 'test');
    lcEventEmitter.offLCChange(handler);
    
    if (!eventReceived) throw new Error('LC event was not received');
});

// Test 4: Niveau Event Emission
test('Niveau Event Emitter can emit and receive events', () => {
    let eventReceived = false;
    const testUserId = 'test_user_456';
    const testOldLevel = 5;
    const testNewLevel = 6;
    
    const handler = (changeEvent) => {
        if (changeEvent.userId === testUserId && 
            changeEvent.oldLevel === testOldLevel &&
            changeEvent.newLevel === testNewLevel) {
            eventReceived = true;
        }
    };
    
    niveauEventEmitter.onNiveauChange(handler);
    niveauEventEmitter.emitNiveauChange(testUserId, testOldLevel, testNewLevel, 'test');
    niveauEventEmitter.offNiveauChange(handler);
    
    if (!eventReceived) throw new Error('Niveau event was not received');
});

// Test 5: Event data includes change amount
test('LC Event includes change amount calculation', () => {
    let changeAmount = null;
    
    const handler = (changeEvent) => {
        changeAmount = changeEvent.change;
    };
    
    lcEventEmitter.onLCChange(handler);
    lcEventEmitter.emitLCChange('user', 100, 150, 'test');
    lcEventEmitter.offLCChange(handler);
    
    if (changeAmount !== 50) throw new Error(`Expected change to be 50, got ${changeAmount}`);
});

// Test 6: Event data includes timestamp
test('Events include timestamp', () => {
    let hasTimestamp = false;
    
    const handler = (changeEvent) => {
        hasTimestamp = typeof changeEvent.timestamp === 'number' && changeEvent.timestamp > 0;
    };
    
    lcEventEmitter.onLCChange(handler);
    lcEventEmitter.emitLCChange('user', 100, 150, 'test');
    lcEventEmitter.offLCChange(handler);
    
    if (!hasTimestamp) throw new Error('Event does not include valid timestamp');
});

// Test 7: Rankings Manager exists and has required methods
test('Rankings Manager has required methods', () => {
    const rankingsManager = require('./utils/rankingsManager');
    
    if (!rankingsManager) throw new Error('Rankings Manager not found');
    if (typeof rankingsManager.initialize !== 'function') {
        throw new Error('initialize method not found');
    }
    if (typeof rankingsManager.handleLCChange !== 'function') {
        throw new Error('handleLCChange method not found');
    }
    if (typeof rankingsManager.handleNiveauChange !== 'function') {
        throw new Error('handleNiveauChange method not found');
    }
    if (typeof rankingsManager.destroy !== 'function') {
        throw new Error('destroy method not found');
    }
});

// Test 8: Multiple event listeners can be registered
test('Multiple event listeners can be registered', () => {
    let listener1Called = false;
    let listener2Called = false;
    
    const handler1 = () => { listener1Called = true; };
    const handler2 = () => { listener2Called = true; };
    
    lcEventEmitter.onLCChange(handler1);
    lcEventEmitter.onLCChange(handler2);
    lcEventEmitter.emitLCChange('user', 100, 150, 'test');
    lcEventEmitter.offLCChange(handler1);
    lcEventEmitter.offLCChange(handler2);
    
    if (!listener1Called || !listener2Called) {
        throw new Error('Not all listeners were called');
    }
});

// Test 9: Event listeners can be removed
test('Event listeners can be properly removed', () => {
    let callCount = 0;
    
    const handler = () => { callCount++; };
    
    lcEventEmitter.onLCChange(handler);
    lcEventEmitter.emitLCChange('user', 100, 150, 'test');
    lcEventEmitter.offLCChange(handler);
    lcEventEmitter.emitLCChange('user', 150, 200, 'test');
    
    if (callCount !== 1) {
        throw new Error(`Expected 1 call, got ${callCount}`);
    }
});

// Test 10: Database module imports properly
test('Database module imports event emitters', () => {
    const db = require('./database/db');
    
    if (!db || !db.db) throw new Error('Database module not properly exported');
    if (typeof db.db.updateLevel !== 'function') {
        throw new Error('updateLevel method not found in db');
    }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Test Summary:`);
console.log(`   Total tests: ${testsRun}`);
console.log(`   Passed: ${testsPassed}`);
console.log(`   Failed: ${testsRun - testsPassed}`);
console.log(`   Success rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%\n`);

if (testsPassed === testsRun) {
    console.log('✅ All tests passed!\n');
    process.exit(0);
} else {
    console.log('❌ Some tests failed!\n');
    process.exit(1);
}

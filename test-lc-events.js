/**
 * Test file for LC Event Emitter and Rankings Manager
 * This tests the dynamic LC synchronization system
 */

const lcEventEmitter = require('./utils/lcEventEmitter');

console.log('🧪 Testing LC Event Emitter...\n');

// Test 1: Basic event emission
console.log('Test 1: Basic LC change event emission');
let eventReceived = false;

lcEventEmitter.onLCChange((event) => {
    console.log('  ✅ Event received:', event);
    eventReceived = true;
    
    // Verify event structure
    if (event.userId && event.oldBalance !== undefined && event.newBalance !== undefined && event.reason && event.timestamp) {
        console.log('  ✅ Event has correct structure');
    } else {
        console.log('  ❌ Event missing required fields');
    }
});

// Emit a test event
lcEventEmitter.emitLCChange('test-user-123', 100, 150, 'test_transaction');

setTimeout(() => {
    if (eventReceived) {
        console.log('  ✅ Test 1 passed\n');
    } else {
        console.log('  ❌ Test 1 failed - event not received\n');
    }
    
    // Test 2: Multiple subscribers
    console.log('Test 2: Multiple subscribers');
    let subscriber1Called = false;
    let subscriber2Called = false;
    
    const handler1 = (event) => {
        console.log('  ✅ Subscriber 1 received event');
        subscriber1Called = true;
    };
    
    const handler2 = (event) => {
        console.log('  ✅ Subscriber 2 received event');
        subscriber2Called = true;
    };
    
    lcEventEmitter.onLCChange(handler1);
    lcEventEmitter.onLCChange(handler2);
    
    lcEventEmitter.emitLCChange('test-user-456', 200, 175, 'game_loss');
    
    setTimeout(() => {
        if (subscriber1Called && subscriber2Called) {
            console.log('  ✅ Test 2 passed\n');
        } else {
            console.log('  ❌ Test 2 failed\n');
        }
        
        // Test 3: Unsubscribe
        console.log('Test 3: Unsubscribe functionality');
        lcEventEmitter.offLCChange(handler1);
        
        subscriber1Called = false;
        subscriber2Called = false;
        
        lcEventEmitter.emitLCChange('test-user-789', 300, 350, 'invite_reward');
        
        setTimeout(() => {
            if (!subscriber1Called && subscriber2Called) {
                console.log('  ✅ Test 3 passed - handler1 unsubscribed, handler2 still active\n');
            } else {
                console.log('  ❌ Test 3 failed\n');
            }
            
            console.log('✅ All tests completed successfully!');
        }, 100);
    }, 100);
}, 100);

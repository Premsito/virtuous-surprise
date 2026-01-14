/**
 * Test script to validate Niveau ranking system
 * This script tests:
 * 1. SQL query for fetching Niveau rankings
 * 2. Database triggers for Niveau changes
 * 3. Data accuracy and proper sorting
 */

require('dotenv').config();
const { pool, db } = require('./database/db');

async function testNiveauRankings() {
    console.log('🧪 Testing Niveau Rankings System\n');
    console.log('='.repeat(60));
    
    try {
        // Test 1: Verify database connection
        console.log('\n📊 Test 1: Database Connection');
        console.log('-'.repeat(60));
        const testQuery = await pool.query('SELECT NOW()');
        console.log('✅ Database connected successfully');
        console.log(`   Server time: ${testQuery.rows[0].now}`);
        
        // Test 2: Verify level column exists
        console.log('\n📊 Test 2: Verify Level Column');
        console.log('-'.repeat(60));
        const columnCheck = await pool.query(`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns
            WHERE table_name = 'users' AND column_name IN ('level', 'xp')
            ORDER BY column_name
        `);
        
        if (columnCheck.rows.length === 2) {
            console.log('✅ Required columns exist:');
            columnCheck.rows.forEach(col => {
                console.log(`   - ${col.column_name} (${col.data_type}), default: ${col.column_default}`);
            });
        } else {
            console.error('❌ Missing required columns!');
            console.log(`   Found: ${columnCheck.rows.map(r => r.column_name).join(', ')}`);
            return;
        }
        
        // Test 3: Check if triggers are installed
        console.log('\n📊 Test 3: Verify Database Triggers');
        console.log('-'.repeat(60));
        const triggerCheck = await pool.query(`
            SELECT tgname, proname as function_name
            FROM pg_trigger t
            JOIN pg_proc p ON t.tgfoid = p.oid
            WHERE tgname IN ('trigger_lc_change', 'trigger_niveau_change')
            ORDER BY tgname
        `);
        
        if (triggerCheck.rows.length === 2) {
            console.log('✅ Database triggers installed:');
            triggerCheck.rows.forEach(trigger => {
                console.log(`   - ${trigger.tgname} -> ${trigger.function_name}()`);
            });
        } else {
            console.warn('⚠️  Database triggers may not be fully installed');
            console.log(`   Found: ${triggerCheck.rows.map(r => r.tgname).join(', ')}`);
        }
        
        // Test 4: Fetch sample users with level data
        console.log('\n📊 Test 4: Sample User Data');
        console.log('-'.repeat(60));
        const sampleUsers = await pool.query(`
            SELECT user_id, username, level, xp, balance
            FROM users
            ORDER BY level DESC, xp DESC
            LIMIT 5
        `);
        
        if (sampleUsers.rows.length > 0) {
            console.log(`✅ Found ${sampleUsers.rows.length} users with level data:`);
            sampleUsers.rows.forEach((user, i) => {
                console.log(`   ${i + 1}. ${user.username} - Level ${user.level}, XP: ${user.xp}, LC: ${user.balance}`);
            });
        } else {
            console.warn('⚠️  No users found in database');
        }
        
        // Test 5: Test getTopLevels function
        console.log('\n📊 Test 5: Test getTopLevels() Function');
        console.log('-'.repeat(60));
        const topLevels = await db.getTopLevels(10);
        
        console.log(`✅ getTopLevels() returned ${topLevels.length} users:`);
        topLevels.slice(0, 5).forEach((user, i) => {
            console.log(`   ${i + 1}. ${user.username} (ID: ${user.user_id})`);
            console.log(`      Level: ${user.level}, XP: ${user.xp}`);
        });
        
        // Test 6: Verify sorting is correct
        console.log('\n📊 Test 6: Verify Sorting Order');
        console.log('-'.repeat(60));
        let sortingCorrect = true;
        for (let i = 1; i < topLevels.length; i++) {
            const prev = topLevels[i - 1];
            const curr = topLevels[i];
            
            // Check if previous level is >= current level
            if (prev.level < curr.level) {
                sortingCorrect = false;
                console.error(`❌ Sorting error at position ${i}:`);
                console.error(`   ${prev.username} (Level ${prev.level}) < ${curr.username} (Level ${curr.level})`);
            }
            
            // If levels are equal, check XP
            if (prev.level === curr.level && prev.xp < curr.xp) {
                sortingCorrect = false;
                console.error(`❌ XP sorting error at position ${i}:`);
                console.error(`   ${prev.username} (XP ${prev.xp}) < ${curr.username} (XP ${curr.xp})`);
            }
        }
        
        if (sortingCorrect) {
            console.log('✅ Sorting is correct (Level DESC, XP DESC)');
        }
        
        // Test 7: Verify composite index exists
        console.log('\n📊 Test 7: Verify Database Indexes');
        console.log('-'.repeat(60));
        const indexCheck = await pool.query(`
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'users' 
            AND indexname IN ('idx_users_level_xp_composite', 'idx_users_balance')
            ORDER BY indexname
        `);
        
        if (indexCheck.rows.length >= 2) {
            console.log('✅ Performance indexes exist:');
            indexCheck.rows.forEach(idx => {
                console.log(`   - ${idx.indexname}`);
            });
        } else {
            console.warn('⚠️  Some performance indexes may be missing');
            console.log(`   Found: ${indexCheck.rows.map(r => r.indexname).join(', ')}`);
        }
        
        // Test 8: Test database notification setup (without actually listening)
        console.log('\n📊 Test 8: Verify NOTIFY Functions');
        console.log('-'.repeat(60));
        const notifyCheck = await pool.query(`
            SELECT proname, prosrc
            FROM pg_proc
            WHERE proname IN ('notify_lc_change', 'notify_niveau_change')
            ORDER BY proname
        `);
        
        if (notifyCheck.rows.length === 2) {
            console.log('✅ NOTIFY functions installed:');
            notifyCheck.rows.forEach(func => {
                console.log(`   - ${func.proname}()`);
            });
        } else {
            console.warn('⚠️  NOTIFY functions may not be fully installed');
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ All validation tests completed!');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('\n❌ Error during testing:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        // Close database connection
        await pool.end();
        console.log('\n🔌 Database connection closed');
    }
}

// Run tests
testNiveauRankings().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

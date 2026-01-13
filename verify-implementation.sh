#!/bin/bash

echo "🔍 Verifying !classement Command Implementation"
echo "================================================"
echo ""

# Check files exist
echo "📁 File Verification:"
if [ -f "commands/rankings.js" ]; then
    echo "   ✅ commands/rankings.js exists"
else
    echo "   ❌ commands/rankings.js missing"
fi

if [ -f "test-classement-fixes.js" ]; then
    echo "   ✅ test-classement-fixes.js exists"
else
    echo "   ❌ test-classement-fixes.js missing"
fi

if [ -f "CLASSEMENT_FIXES_SUMMARY.md" ]; then
    echo "   ✅ CLASSEMENT_FIXES_SUMMARY.md exists"
else
    echo "   ❌ CLASSEMENT_FIXES_SUMMARY.md missing"
fi

echo ""
echo "🔬 Code Analysis:"

# Check for enhanced logging
if grep -q "\[DATABASE\] Fetching top 10 LC rankings" commands/rankings.js; then
    echo "   ✅ Enhanced LC database logging present"
else
    echo "   ❌ Enhanced LC database logging missing"
fi

if grep -q "\[DATABASE\] Fetching top 10 Niveau rankings" commands/rankings.js; then
    echo "   ✅ Enhanced Niveau database logging present"
else
    echo "   ❌ Enhanced Niveau database logging missing"
fi

# Check for delete approach
if grep -q "await this.lastRankingsMessage.delete()" commands/rankings.js; then
    echo "   ✅ Delete-based message update present"
else
    echo "   ❌ Delete-based message update missing"
fi

# Check for error handling
if grep -q "error.code === 10003" commands/rankings.js; then
    echo "   ✅ Discord error code 10003 handling present"
else
    echo "   ❌ Discord error code 10003 handling missing"
fi

if grep -q "error.code === 50001" commands/rankings.js; then
    echo "   ✅ Discord error code 50001 handling present"
else
    echo "   ❌ Discord error code 50001 handling missing"
fi

if grep -q "error.code === 50013" commands/rankings.js; then
    echo "   ✅ Discord error code 50013 handling present"
else
    echo "   ❌ Discord error code 50013 handling missing"
fi

# Check for 5-minute interval in bot.js
if grep -q "5 \* 60 \* 1000" bot.js; then
    echo "   ✅ 5-minute interval configured in bot.js"
else
    echo "   ❌ 5-minute interval not found in bot.js"
fi

# Check for classement alias
if grep -q "commandName === 'classement'" bot.js; then
    echo "   ✅ !classement command alias present"
else
    echo "   ❌ !classement command alias missing"
fi

echo ""
echo "🧪 Running Test Suite:"
node test-classement-fixes.js

echo ""
echo "✅ Implementation Verification Complete!"

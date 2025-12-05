// analyze-simple.js
// Simple project analyzer that works without any issues
// Run: node analyze-simple.js

const fs = require('fs');
const path = require('path');

console.log('\n🔍 KHOZNA.com PROJECT ANALYZER');
console.log('='.repeat(60) + '\n');

// 1. Read package.json
console.log('📦 PROJECT INFO:\n');
try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log('   Name:', pkg.name);
    console.log('   Version:', pkg.version);
    console.log('\n   🚀 Available Scripts:');
    Object.keys(pkg.scripts || {}).forEach(s => {
        console.log(`      ${s}: ${pkg.scripts[s]}`);
    });
    console.log('\n   📚 Main Dependencies:');
    Object.keys(pkg.dependencies || {}).forEach(d => {
        console.log(`      ${d}`);
    });
} catch (e) {
    console.log('   ❌ Error reading package.json');
}

// 2. List React Components
console.log('\n\n⚛️  REACT COMPONENTS:\n');
try {
    const compPath = path.join('src', 'components');
    if (fs.existsSync(compPath)) {
        const files = fs.readdirSync(compPath).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
        files.forEach(f => {
            console.log(`   📄 ${f}`);
            try {
                const content = fs.readFileSync(path.join(compPath, f), 'utf8');
                if (content.includes('useState')) console.log('      ✓ Has State');
                if (content.includes('useEffect')) console.log('      ✓ Has Effects');
                if (content.includes('supabase')) console.log('      ✓ Uses Supabase');
            } catch (e) { }
        });
    }
} catch (e) {
    console.log('   ℹ️  No components folder found');
}

// 3. List SQL Files (Database Schemas)
console.log('\n\n🗄️  DATABASE SCHEMAS:\n');
try {
    const sqlFiles = fs.readdirSync('.').filter(f => f.endsWith('.sql'));
    sqlFiles.forEach(f => {
        console.log(`   📋 ${f}`);
        try {
            const content = fs.readFileSync(f, 'utf8');
            const tableMatches = content.match(/CREATE TABLE[^(]+/gi);
            if (tableMatches) {
                console.log(`      Tables: ${tableMatches.length}`);
            }
        } catch (e) { }
    });
} catch (e) {
    console.log('   ℹ️  No SQL files found');
}

// 4. Check Environment Setup
console.log('\n\n🔐 ENVIRONMENT:\n');
['.env', '.env.example', '.env.local'].forEach(envFile => {
    if (fs.existsSync(envFile)) {
        console.log(`   ✅ ${envFile} exists`);
        try {
            const content = fs.readFileSync(envFile, 'utf8');
            const vars = content.split('\n').filter(l => l.includes('=') && !l.startsWith('#'));
            console.log(`      Variables: ${vars.length}`);
            vars.slice(0, 5).forEach(v => {
                const key = v.split('=')[0];
                console.log(`      - ${key}`);
            });
        } catch (e) { }
    }
});

// 5. Detect Features
console.log('\n\n✨ DETECTED FEATURES:\n');
const features = [];

try {
    const compPath = path.join('src', 'components');
    if (fs.existsSync(compPath)) {
        const files = fs.readdirSync(compPath).map(f => f.toLowerCase());

        if (files.some(f => f.includes('chat'))) features.push('💬 Real-time Chat');
        if (files.some(f => f.includes('auth'))) features.push('🔐 Authentication');
        if (files.some(f => f.includes('listing'))) features.push('🏠 Property Listings');
        if (files.some(f => f.includes('kyc'))) features.push('📋 KYC Verification');
        if (files.some(f => f.includes('hero'))) features.push('🎨 Landing Page');
        if (files.some(f => f.includes('navbar'))) features.push('🧭 Navigation');
        if (files.some(f => f.includes('modal'))) features.push('🪟 Modal System');
        if (files.some(f => f.includes('report'))) features.push('📊 Reporting');
    }

    const sqlFiles = fs.readdirSync('.').filter(f => f.endsWith('.sql'));
    sqlFiles.forEach(f => {
        const content = fs.readFileSync(f, 'utf8').toLowerCase();
        if (content.includes('messages')) features.push('✉️ Messaging');
        if (content.includes('conversations')) features.push('💭 Conversations');
        if (content.includes('storage')) features.push('📦 File Storage');
        if (content.includes('sms')) features.push('📱 SMS Auth');
        if (content.includes('notification')) features.push('🔔 Notifications');
    });
} catch (e) { }

[...new Set(features)].forEach(f => console.log(`   ${f}`));

// 6. Tech Stack
console.log('\n\n🛠️  TECH STACK:\n');
try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps.react) console.log('   ⚛️  React');
    if (deps.vite) console.log('   ⚡ Vite');
    if (deps['@supabase/supabase-js']) console.log('   🔥 Supabase');
    if (deps.tailwindcss) console.log('   🎨 Tailwind CSS');
    if (deps.nodemailer) console.log('   📧 Nodemailer');
} catch (e) { }

// 7. Project Structure
console.log('\n\n📁 PROJECT STRUCTURE:\n');
const checkPaths = [
    ['src', 'Source Code'],
    ['src/components', 'React Components'],
    ['public', 'Static Assets'],
    ['api', 'API Routes'],
    ['hooks', 'Custom Hooks'],
    ['lib', 'Libraries'],
    ['dist', 'Build Output']
];

checkPaths.forEach(([p, desc]) => {
    const exists = fs.existsSync(p);
    console.log(`   ${exists ? '✅' : '❌'} ${p.padEnd(20)} - ${desc}`);
});

console.log('\n' + '='.repeat(60));
console.log('✅ Analysis Complete!\n');
console.log('💡 Next: Review the features and decide what to add/fix\n');
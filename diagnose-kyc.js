import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env file manually
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = {};
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            let value = parts.slice(1).join('=').trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            envConfig[key] = value;
        }
    });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnose() {
    console.log('--- Starting Diagnosis ---');

    // 1. Check if 'id' column exists (Old Schema check)
    console.log('Checking for "id" column (Old Schema marker)...');
    const { data: idCheck, error: idError } = await supabase
        .from('kyc_verifications')
        .select('id')
        .limit(1);

    if (!idError) {
        console.log('⚠️  "id" column EXISTS. You are likely using the OLD SCHEMA.');
        console.log('   Please run the updated schema.sql to drop and recreate the table.');
    } else {
        if (idError.message.includes('does not exist')) {
            console.log('✅ "id" column does not exist. You are likely using the NEW SCHEMA.');
        } else {
            console.log('❓ Unexpected error checking schema:', idError.message);
        }
    }

    // 2. Check RLS / Upsert
    // We need a user to test RLS. We can't easily get a user token here without login.
    // So we'll skip the active upsert test unless we have a service key (which we don't).
    // But the schema check is the most important indicator right now.

    console.log('--- Diagnosis Complete ---');
}

diagnose();

// kyc-upsert.test.js
// This test verifies that upserting a KYC record for the same user does not cause duplicate key errors.

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env file manually
const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading .env from:', envPath);
const envConfig = {};
if (fs.existsSync(envPath)) {
    console.log('.env file found');
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;

        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            let value = parts.slice(1).join('=').trim();
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            envConfig[key] = value;
        }
    });
    console.log('Found keys in .env:', Object.keys(envConfig));
} else {
    console.log('.env file NOT found');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || envConfig.VITE_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Key:', supabaseAnonKey ? 'Found' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to generate a random user id (UUID) for testing. In real tests you would use a test user.
function randomUuid() {
    // Simple UUID v4 generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

(async () => {
    const testUserId = randomUuid();
    console.log('Testing KYC upsert for user:', testUserId);

    // First upsert – should insert
    const first = await supabase
        .from('kyc_verifications')
        .upsert(
            {
                user_id: testUserId,
                citizenship_photo_url: 'https://example.com/front.jpg',
                citizenship_photo_back_url: 'https://example.com/back.jpg',
                citizenship_number: '123456789',
                status: 'pending',
            },
            { onConflict: 'user_id' }
        );

    if (first.error) {
        console.error('First upsert error:', first.error);
        process.exit(1);
    }
    console.log('First upsert succeeded');

    // Second upsert – should update, not duplicate
    const second = await supabase
        .from('kyc_verifications')
        .upsert(
            {
                user_id: testUserId,
                citizenship_photo_url: 'https://example.com/front2.jpg',
                citizenship_photo_back_url: 'https://example.com/back2.jpg',
                citizenship_number: '987654321',
                status: 'pending',
            },
            { onConflict: 'user_id' }
        );

    if (second.error) {
        console.error('Second upsert error:', second.error);
        process.exit(1);
    }
    console.log('Second upsert succeeded');

    // Verify only one row exists for this user
    const { data, error, count } = await supabase
        .from('kyc_verifications')
        .select('*', { count: 'exact' })
        .eq('user_id', testUserId);

    if (error) {
        console.error('Select error:', error);
        process.exit(1);
    }

    if (count !== 1) {
        console.error('Expected exactly 1 row, got', count);
        process.exit(1);
    }

    console.log('Test passed – only one row exists for the user.');
    process.exit(0);
})();

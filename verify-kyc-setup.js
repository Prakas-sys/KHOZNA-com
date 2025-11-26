import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Verification script to check and setup KYC storage bucket and tables
 * Run with: node verify-kyc-setup.js
 */

// Simple .env parser since we don't have dotenv
function loadEnv() {
    try {
        const envPath = path.join(__dirname, '.env');
        if (!fs.existsSync(envPath)) {
            console.error('❌ .env file not found!');
            return null;
        }
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        console.error('Error loading .env:', e);
        return null;
    }
}

async function verifyKYCSetup() {
    console.log('🔍 Verifying KYC Setup...\n');

    const env = loadEnv();
    if (!env) return;

    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials in .env');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // 1. Check if bucket exists
        console.log('1️⃣ Checking if kyc-documents bucket exists...');
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

        if (bucketsError) {
            console.error('❌ Error listing buckets:', bucketsError.message);
        } else {
            const kycBucket = buckets.find(b => b.id === 'kyc-documents');
            if (kycBucket) {
                console.log('✅ kyc-documents bucket exists!');
            } else {
                console.log('❌ kyc-documents bucket NOT found!');
            }
        }

        // 2. Check KYC table exists
        console.log('\n2️⃣ Checking kyc_verifications table...');
        // We try to select from the table. If it doesn't exist, it will throw an error.
        const { data: kycData, error: kycError } = await supabase
            .from('kyc_verifications')
            .select('count')
            .limit(1);

        if (kycError) {
            console.log('❌ kyc_verifications table error:', kycError.message);
            if (kycError.message.includes('relation "public.kyc_verifications" does not exist')) {
                console.log('   -> The table is definitely missing.');
            }
        } else {
            console.log('✅ kyc_verifications table exists');
        }

        // 3. Check Reports table exists
        console.log('\n3️⃣ Checking reports table...');
        const { data: reportsData, error: reportsError } = await supabase
            .from('reports')
            .select('count')
            .limit(1);

        if (reportsError) {
            console.log('❌ reports table error:', reportsError.message);
        } else {
            console.log('✅ reports table exists');
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err.message);
    }
}

// Run verification
verifyKYCSetup();

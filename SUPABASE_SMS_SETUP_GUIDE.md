# Supabase SMS Authentication Setup Guide

## Your Supabase Project
- **URL**: `https://hvcdptpuvlrigreenhxg.supabase.co`
- **Project Ref**: `hvcdptpuvlrigreenhxg`

## Step-by-Step Setup (5-10 minutes)

### Step 1: Access Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Login with your account
3. Select project: **hvcdptpuvlrigreenhxg**

### Step 2: Enable Phone Authentication
1. In your project dashboard, click **Authentication** (left sidebar)
2. Click **Providers** tab
3. Find **Phone** in the list
4. Toggle it **ON** (enable it)

### Step 3: Choose SMS Provider

You have several options. **Recommended for Nepal: Twilio**

#### Option A: Twilio (Recommended - Works in Nepal)
1. **Sign up**: https://www.twilio.com/try-twilio
2. **Get free trial credits** ($15-20 USD worth of SMS)
3. **Get your credentials**:
   - Account SID (looks like: `ACxxxxxxxxxxxxx`)
   - Auth Token (looks like: `xxxxxxxxxxxxxxxx`)
4. **Get a phone number**:
   - In Twilio Console → Phone Numbers → Buy a Number
   - Choose a number (free with trial)

#### Option B: MessageBird (Alternative)
1. Sign up: https://messagebird.com
2. Get API Key from dashboard

#### Option C: Vonage (Alternative)
1. Sign up: https://dashboard.nexmo.com/sign-up
2. Get API Key and Secret

### Step 4: Configure in Supabase

1. In Supabase → Authentication → Providers → Phone
2. Select your SMS provider (e.g., "Twilio")
3. Enter credentials:
   - **Twilio Account SID**: `ACxxxxxxxxxxxxx`
   - **Twilio Auth Token**: `xxxxxxxxxxxxxxxx`
   - **Twilio Phone Number**: `+1xxxxxxxxxx` (the number you got from Twilio)
4. Click **Save**

### Step 5: Test

1. Go to your website: http://localhost:5174
2. Click "Post Property"
3. Click "Sign Up"
4. Enter your phone: **9863590097**
5. Click "Send OTP"
6. **You will receive REAL SMS** on your phone!
7. Enter the OTP and login

## Cost Information

### Twilio Pricing (Nepal/India)
- **Free Trial**: $15-20 USD credit
- **SMS Cost**: ~$0.04-0.08 per SMS
- **Free credits** = ~200-500 SMS messages
- **After trial**: Pay as you go

### Production Costs (Estimated)
- 100 users/month = ~$4-8 USD
- 1000 users/month = ~$40-80 USD

## Troubleshooting

### "Unsupported phone provider" error
- Make sure you **saved** the configuration in Supabase
- Wait 1-2 minutes for changes to propagate
- Refresh your website

### SMS not received
- Check Twilio logs for delivery status
- Verify phone number format: `+9779863590097`
- Check if number is blocked/invalid

### "Invalid credentials" error
- Double-check Account SID and Auth Token
- Make sure there are no extra spaces
- Verify Twilio phone number format

## Need Help?

If you get stuck on any step, let me know which step and I'll help troubleshoot!

---

**Note**: The dev mode in the code is ONLY for local testing and will NOT work in production. Once you set up real SMS, it will automatically use that instead.

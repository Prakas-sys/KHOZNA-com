# KHOZNA Setup Instructions - Complete Guide

## Step 1: Database Migration (Supabase)

### What this does:
- Creates a table to track KYC edit requests
- Sets up automatic email notifications
- Secures data with permissions

### How to do it:

1. **Login to Supabase:**
   - Go to: https://app.supabase.com
   - Select your project "KHOZNA-com"

2. **Run the SQL Migration:**
   - Click on **SQL Editor** (left sidebar)
   - Click **New Query**
   - Copy & paste the contents of: `create-edit-requests-table.sql`
   - Click **Run**
   - Wait for success message

## Step 2: Gmail Setup (Email Notifications)

### What this does:
- Allows the app to send emails to users and admins

### How to do it:

1. **Create Gmail App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Sign in with your Gmail account
   - Select: **Mail** → **Windows (or your device)**
   - Generate
   - Copy the 16-character password (you'll need this)

2. **Add to .env file locally:**
   - Open: `.env` file in the root folder
   - Add these lines:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   EMAIL_USER=your_gmail@gmail.com
   EMAIL_PASSWORD=the_16_char_password_you_just_got
   ADMIN_EMAIL=admin@khozna.com
   ```

## Step 3: Vercel Environment Variables

### What this does:
- Adds secrets to your live website so emails work on production

### How to do it:

1. **Login to Vercel:**
   - Go to: https://vercel.com
   - Click your project "KHOZNA-com"

2. **Add Environment Variables:**
   - Click on **Settings**
   - Go to **Environment Variables**
   - Add each one:

   | Name | Value |
   |------|-------|
   | SUPABASE_SERVICE_ROLE_KEY | (from Supabase) |
   | EMAIL_USER | your_gmail@gmail.com |
   | EMAIL_PASSWORD | 16-char password |
   | ADMIN_EMAIL | admin@khozna.com |

3. **Deploy:**
   - Go back to **Deployments**
   - Click the three dots (•••) on latest deployment
   - Select **Redeploy**
   - Wait for deployment to complete

## Step 4: GitHub Push (If you made changes)

### What this does:
- Uploads your new files to GitHub
- Triggers automatic Vercel deployment

### How to do it:

1. **Open VS Code Terminal** (bottom panel)

2. **Run these commands:**
   ```powershell
   cd "d:\MY DASHBOARD\STARTUP\KHOZNA.com"
   git add .
   git commit -m "Add KYC edit request system with email notifications"
   git push
   ```

3. **Check Vercel:**
   - Go to https://vercel.com
   - Your project will start deploying automatically
   - Wait for "Production" status

## Step 5: Test Everything

### Test locally:
1. Keep dev server running: `npm run dev`
2. Go to: http://localhost:5173
3. Login
4. Click **Profile** → scroll to **KYC Verification**
5. Click **Request Document Edit**
6. Check your email (might take 2-3 seconds)

### Test on Vercel (Live):
1. Go to: https://khozna.vercel.app (or your domain)
2. Repeat steps 2-6

## Troubleshooting

### "Email not sending"
- Check Email User & Password are correct
- Gmail app password is 16 characters (with spaces)
- You enabled 2-factor authentication on Gmail

### "Database error"
- Make sure you ran the SQL migration
- Check Supabase is accessible

### "404 on Request Edit"
- Make sure you deployed to Vercel
- Check environment variables are added

## Questions?

Ask me anytime! I can help with:
- Getting your Service Role Key
- Running the SQL migration
- Setting up Gmail
- Deploying to Vercel

---

**Next Step:** Provide me with your **Service Role Key** from Supabase, and I'll help you complete all the setup!

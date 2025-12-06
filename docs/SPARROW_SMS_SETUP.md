# Sparrow SMS Setup Guide for KHOZNA

## Step 1: Sign Up for Sparrow SMS

1. Go to: https://sparrowsms.com
2. Click "Sign Up" or "Register"
3. Fill in your details:
   - Name: Prakash
   - Email: prakash2692@xavier.edu.np
   - Phone: 9863590097
   - Company: KHOZNA
4. Complete registration

## Step 2: Get API Token

1. Login to Sparrow SMS dashboard
2. Go to "API" or "Developer" section
3. Generate API Token
4. Copy the token (looks like: `xxxxxxxxxxxxxxxxxxxxxxxx`)

## Step 3: Add to Your .env File

Add this line to your `.env` file:
```
VITE_SPARROW_SMS_TOKEN=your_token_here
```

## Step 4: Get Sender ID (Optional but Recommended)

1. In Sparrow dashboard, request a Sender ID
2. Request "KHOZNA" as your sender ID
3. Wait for approval (usually 1-2 days)
4. Until approved, SMS will be sent from a default number

## Step 5: Add Credits

1. Go to "Recharge" or "Add Credits" in Sparrow dashboard
2. Minimum: NPR 500 (gets you ~500-1000 SMS)
3. Payment methods:
   - eSewa
   - Khalti
   - Bank transfer
   - Mobile banking

## Pricing

- **Per SMS**: ~NPR 0.50-1.00
- **Minimum recharge**: NPR 500
- **No monthly fees**
- **Pay as you go**

## Testing

Once you have the token:
1. Add it to `.env`
2. Restart your dev server (`npm run dev`)
3. Try signing up with a Nepal number
4. You'll receive REAL SMS!

## Cost Estimate

- 100 users = ~NPR 50-100
- 1000 users = ~NPR 500-1000
- Much cheaper than Twilio for Nepal!

## Support

- Sparrow Support: support@janakitech.com
- Phone: +977-1-5970017
- Documentation: https://sparrowsms.com/documentation.php

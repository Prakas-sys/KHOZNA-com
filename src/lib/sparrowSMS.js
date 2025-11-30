// Sparrow SMS Integration for Nepal
// API Documentation: https://sparrowsms.com/documentation.php

const SPARROW_API_URL = 'https://api.sparrowsms.com/v2/sms';

export async function sendOTPViaSparrow(phoneNumber, otp) {
    const sparrowToken = import.meta.env.VITE_SPARROW_SMS_TOKEN;

    if (!sparrowToken) {
        console.error('Sparrow SMS token not configured');
        throw new Error('SMS service not configured');
    }

    // Format phone number for Nepal (remove +977 if present)
    const formattedPhone = phoneNumber.replace(/^\+977/, '');

    const message = `Your KHOZNA verification code is: ${otp}. Valid for 10 minutes.`;

    try {
        const response = await fetch(SPARROW_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sparrowToken}`
            },
            body: JSON.stringify({
                to: formattedPhone,
                text: message,
                from: 'KHOZNA' // Your sender ID (needs approval from Sparrow)
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to send SMS');
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Sparrow SMS Error:', error);
        throw error;
    }
}

export function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

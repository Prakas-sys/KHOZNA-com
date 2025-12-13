import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;
const adminEmail = process.env.ADMIN_EMAIL || 'admin@khozna.com';

const supabase = createClient(supabaseUrl, supabaseKey);

// Email transporter setup (using Gmail or your email service)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPassword,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, email, fullName, citizenshipNo, requestType } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Send email to admin
    await transporter.sendMail({
      from: emailUser,
      to: adminEmail,
      subject: `🔔 KYC Edit Request from ${fullName || email}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0EA5E9;">KYC Edit Request</h2>
          <p>A user has requested to edit their KYC documents:</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>User Email:</strong> ${email}</p>
            <p><strong>Full Name:</strong> ${fullName || 'N/A'}</p>
            <p><strong>Citizenship No:</strong> ${citizenshipNo || 'N/A'}</p>
            <p><strong>Request Type:</strong> ${requestType}</p>
            <p><strong>Requested At:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <p>Please review and respond to the user within 24 hours.</p>
          
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            This is an automated message from KHOZNA Rental Platform
          </p>
        </div>
      `,
    });

    // Send confirmation email to user
    await transporter.sendMail({
      from: emailUser,
      to: email,
      subject: '📋 KYC Edit Request Received - KHOZNA',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0EA5E9;">Request Received ✓</h2>
          <p>Hi ${fullName || 'User'},</p>
          
          <p>We have received your request to edit your KYC documents. Our admin team will review your request and contact you within 24 hours.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Request Details:</strong></p>
            <p>📧 Email: ${email}</p>
            <p>📝 Request Type: KYC Document Edit</p>
            <p>⏰ Requested on: ${new Date().toLocaleString()}</p>
          </div>

          <p>You will receive an email update once your request is processed.</p>
          
          <div style="background: #dbeafe; border-left: 4px solid #0EA5E9; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #0284C7;"><strong>Need help?</strong> Contact our support team at support@khozna.com</p>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            KHOZNA Rental Platform - Broker Free Rental Solutions
          </p>
        </div>
      `,
    });

    // Create notification in database
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'KYC Edit Request Submitted',
        message: 'Your edit request has been sent to admin. You will be notified via email once reviewed.',
        type: 'info',
        is_read: false,
      });

    if (notifError) console.warn('Failed to create notification:', notifError.message || notifError);

    // Also log the request in a requests table for tracking
    await supabase
      .from('edit_requests')
      .insert({
        user_id: userId,
        email: email,
        request_type: requestType,
        citizenship_number: citizenshipNo,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .catch(err => {
        // If table doesn't exist yet, just log it
        console.log('Edit requests table not found, but notification sent');
      });

    return res.status(200).json({
      success: true,
      message: 'Edit request sent successfully. Check your email for confirmation.',
    });
  } catch (error) {
    console.error('Error sending edit request:', error);
    return res.status(500).json({
      error: 'Failed to send request',
      details: error.message,
    });
  }
}

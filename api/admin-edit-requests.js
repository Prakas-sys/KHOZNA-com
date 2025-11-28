import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;

const supabase = createClient(supabaseUrl, supabaseKey);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPassword,
  },
});

export default async function handler(req, res) {
  try {
    // Verify admin access
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !userData.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    if (req.method === 'GET') {
      // Get all pending edit requests
      const { data: requests, error } = await supabase
        .from('edit_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(requests);
    }

    if (req.method === 'PUT') {
      const { requestId, status, adminNotes } = req.body;

      if (!requestId || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get the edit request
      const { data: request, error: fetchError } = await supabase
        .from('edit_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Update the request
      const { error: updateError } = await supabase
        .from('edit_requests')
        .update({
          status,
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
          reviewed_by_admin_id: userData.user.id,
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Get user email and send notification
      const { data: user, error: userError } = await supabase.auth.admin.getUserById(request.user_id);
      if (!userError && user?.user?.email) {
        const statusMessage = status === 'approved'
          ? 'approved. You can now update your KYC documents.'
          : 'has been reviewed. Please contact us for more information.';

        await transporter.sendMail({
          from: emailUser,
          to: user.user.email,
          subject: `📋 Your KYC Edit Request ${status.toUpperCase()} - KHOZNA`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0EA5E9;">Request ${status.toUpperCase()}</h2>
              <p>Your KYC edit request has been ${statusMessage}</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Status:</strong> ${status.toUpperCase()}</p>
                ${adminNotes ? `<p><strong>Admin Notes:</strong> ${adminNotes}</p>` : ''}
              </div>

              <p>If you have any questions, please contact our support team at support@khozna.com</p>
              
              <p style="color: #666; font-size: 12px; margin-top: 20px;">
                KHOZNA Rental Platform
              </p>
            </div>
          `,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Request updated successfully',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in admin edit requests:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}

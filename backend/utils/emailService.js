const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send verification email
exports.sendVerificationEmail = async (email, name, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: `"CampusConnect" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🎓 Verify Your Email - CampusConnect',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 30px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 40px 30px; background: white; }
          .content h2 { color: #333; margin-top: 0; font-size: 22px; }
          .content p { color: #666; line-height: 1.8; margin: 15px 0; }
          .button-container { text-align: center; margin: 35px 0; }
          .button { 
            display: inline-block; 
            padding: 16px 40px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white !important; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: transform 0.2s;
          }
          .button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5); }
          .link-box { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .link-box p { margin: 5px 0; font-size: 12px; color: #666; word-break: break-all; }
          .link-box a { color: #667eea; text-decoration: none; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .warning p { margin: 0; color: #856404; font-size: 14px; }
          .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e9ecef; }
          .footer p { margin: 5px 0; color: #6c757d; font-size: 13px; }
          .icon { font-size: 48px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">🎓</div>
            <h1>Welcome to CampusConnect!</h1>
          </div>
          
          <div class="content">
            <h2>Hi ${name}! 👋</h2>
            <p>Thank you for registering with <strong>CampusConnect</strong>. We're excited to have you on board!</p>
            <p>To get started and access all our amazing campus events, please verify your email address by clicking the button below:</p>
            
            <div class="button-container">
              <a href="${verificationUrl}" class="button">✓ Verify Email Address</a>
            </div>
            
            <div class="link-box">
              <p><strong>Or copy and paste this link in your browser:</strong></p>
              <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            </div>
            
            <div class="warning">
              <p><strong>⏰ Important:</strong> This verification link will expire in 24 hours.</p>
            </div>
            
            <p style="margin-top: 30px;">If you didn't create an account with CampusConnect, please ignore this email and no account will be created.</p>
          </div>
          
          <div class="footer">
            <p><strong>CampusConnect</strong> - Your Campus Events Hub</p>
            <p>© ${new Date().getFullYear()} CampusConnect. All rights reserved.</p>
            <p style="margin-top: 10px; font-size: 11px;">This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent to:', email);
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

// Resend verification email
exports.resendVerificationEmail = async (email, name, verificationToken) => {
  return await exports.sendVerificationEmail(email, name, verificationToken);
};

// Send event reminder email
exports.sendEventReminderEmail = async (email, name, event, customMessage = null) => {
  const eventUrl = `${process.env.FRONTEND_URL}/event/${event._id}`;
  
  // Format event date
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-IN', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = eventDate.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  });

  const mailOptions = {
    from: `"CampusConnect" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🔔 Reminder: ${event.title} is Tomorrow!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 30px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 40px 30px; background: white; }
          .content h2 { color: #333; margin-top: 0; font-size: 22px; }
          .content p { color: #666; line-height: 1.8; margin: 15px 0; }
          .event-card { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; border-radius: 8px; margin: 25px 0; }
          .event-card h3 { margin: 0 0 15px 0; color: #333; font-size: 20px; }
          .event-detail { margin: 10px 0; color: #555; display: flex; align-items: center; }
          .event-detail strong { min-width: 80px; color: #667eea; }
          .button-container { text-align: center; margin: 35px 0; }
          .button { 
            display: inline-block; 
            padding: 16px 40px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white !important; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          }
          .button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5); }
          .reminder-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .reminder-box p { margin: 0; color: #856404; font-size: 14px; }
          .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e9ecef; }
          .footer p { margin: 5px 0; color: #6c757d; font-size: 13px; }
          .icon { font-size: 48px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">🔔</div>
            <h1>Event Reminder</h1>
          </div>
          
          <div class="content">
            <h2>Hi ${name}! 👋</h2>
            <p>This is a friendly reminder that you have an event coming up <strong>tomorrow</strong>!</p>
            
            <div class="event-card">
              <h3>${event.title}</h3>
              <div class="event-detail">
                <strong>📅 Date:</strong>
                <span>${formattedDate}</span>
              </div>
              <div class="event-detail">
                <strong>🕒 Time:</strong>
                <span>${formattedTime}</span>
              </div>
              <div class="event-detail">
                <strong>📍 Venue:</strong>
                <span>${event.venue}</span>
              </div>
              ${event.description ? `
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #dee2e6;">
                <p style="margin: 0; color: #666; font-size: 14px;">${event.description}</p>
              </div>
              ` : ''}
            </div>
            
            ${customMessage ? `
            <div class="event-card" style="background: #e7f3ff; border-left-color: #2196F3;">
              <h3 style="color: #1976D2; font-size: 16px; margin: 0 0 10px 0;">📢 Message from Organizer</h3>
              <p style="margin: 0; color: #333; line-height: 1.6;">${customMessage}</p>
            </div>
            ` : ''}
            
            <div class="reminder-box">
              <p><strong>⏰ Don't forget!</strong> Make sure to arrive on time. We're looking forward to seeing you there!</p>
            </div>
            
            <div class="button-container">
              <a href="${eventUrl}" class="button">View Event Details</a>
            </div>
            
            <p style="margin-top: 30px; color: #888; font-size: 13px;">If you can't attend, please let the organizers know in advance.</p>
          </div>
          
          <div class="footer">
            <p><strong>CampusConnect</strong> - Your Campus Events Hub</p>
            <p>© ${new Date().getFullYear()} CampusConnect. All rights reserved.</p>
            <p style="margin-top: 10px; font-size: 11px;">This is an automated reminder. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Reminder email sent to:', email);
  } catch (error) {
    console.error('❌ Error sending reminder email:', error);
    throw new Error('Failed to send reminder email');
  }
};

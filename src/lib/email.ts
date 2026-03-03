import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  await transporter.sendMail({
    from: `"Gamepad" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #171717; border-radius: 10px; padding: 30px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { color: #FFD700; font-size: 28px; font-weight: bold; }
        .content { margin-bottom: 30px; }
        .button { display: inline-block; background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #0a0a0a; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
        .footer { text-align: center; color: #737373; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎮 Gamepad</div>
        </div>
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>You have requested to reset your password. Click the button below to create a new password:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        </div>
        <div class="footer">
          <p>Powered by Gamepad Ltd</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Reset Your Gamepad Password',
    html,
  });
}

export async function sendWelcomeEmail(email: string, fullName: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #171717; border-radius: 10px; padding: 30px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { color: #FFD700; font-size: 28px; font-weight: bold; }
        .content { margin-bottom: 30px; }
        .highlight { color: #FFD700; }
        .footer { text-align: center; color: #737373; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎮 Gamepad</div>
        </div>
        <div class="content">
          <h2>Welcome, ${fullName}! 🎉</h2>
          <p>Your account has been successfully created. You're now ready to:</p>
          <ul>
            <li>💰 Deposit GP coins to your wallet</li>
            <li>🎮 Join game lobbies from 1,000 to 40,000 GP</li>
            <li>🏆 Spin the wheel and win big!</li>
          </ul>
          <p>Remember: <span class="highlight">1,000 GP = ₦500</span></p>
          <p>Good luck and may the games be in your favor!</p>
        </div>
        <div class="footer">
          <p>Powered by Gamepad Ltd</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to Gamepad!',
    html,
  });
}

import nodemailer from 'nodemailer';

/**
 * Email Service
 * Sends transactional emails via Gmail SMTP using Nodemailer.
 * Credentials are loaded from GMAIL_USER and GMAIL_APP_PASSWORD env vars.
 */
class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  /**
   * Send a welcome email to a newly registered user.
   * @param toEmail - The recipient's email address
   */
  async sendWelcomeEmail(toEmail: string): Promise<void> {
    const firstName = toEmail.split('@')[0];
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to Revisio</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      background-color: #1a1a1f;
      color: #e0e0e8;
      line-height: 1.6;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px;
    }
    .wrapper { 
      background-color: #232329;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #2d2d35;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    .header { 
      background-color: #1f5f5f;
      padding: 40px 32px;
      text-align: center;
      border-bottom: 1px solid #2d2d35;
    }
    .header-logo {
      display: inline-block;
      width: 48px;
      height: 48px;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      margin-bottom: 16px;
      font-size: 24px;
      line-height: 48px;
    }
    .header h1 { 
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .header p { 
      font-size: 14px;
      color: #b0b0c0;
    }
    .content { 
      padding: 40px 32px;
    }
    .greeting { 
      font-size: 18px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 16px;
    }
    .intro-text { 
      font-size: 14px;
      color: #a0a0b0;
      margin-bottom: 32px;
      line-height: 1.7;
    }
    .features-title {
      font-size: 16px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 20px;
    }
    .features { 
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 32px;
    }
    .feature { 
      background-color: #2d2d35;
      border: 1px solid #3a3a42;
      border-radius: 8px;
      padding: 16px;
      transition: all 0.2s ease;
    }
    .feature:hover {
      background-color: #333339;
      border-color: #4a4a52;
    }
    .feature-icon { 
      font-size: 20px;
      margin-bottom: 8px;
      display: block;
    }
    .feature-title { 
      font-size: 14px;
      font-weight: 600;
      color: #e0e0e8;
      margin-bottom: 4px;
    }
    .feature-desc { 
      font-size: 13px;
      color: #8080a0;
      line-height: 1.5;
    }
    .cta-section {
      text-align: center;
      margin-bottom: 32px;
    }
    .cta-button { 
      display: inline-block;
      background-color: #2d7f7f;
      color: #ffffff;
      text-decoration: none;
      padding: 14px 40px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 0.3px;
      transition: background-color 0.2s ease;
      border: 1px solid #3a9a9a;
    }
    .cta-button:hover {
      background-color: #3a9a9a;
    }
    .divider {
      height: 1px;
      background-color: #3a3a42;
      margin: 32px 0;
    }
    .secondary-text {
      font-size: 13px;
      color: #7080a0;
      text-align: center;
      margin-bottom: 24px;
      line-height: 1.6;
    }
    .footer { 
      background-color: #1f1f24;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #2d2d35;
      font-size: 12px;
      color: #606080;
    }
    .footer p {
      margin-bottom: 8px;
    }
    .footer a { 
      color: #2d7f7f;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="wrapper">
      <!-- Header -->
      <div class="header">
        <div class="header-logo">📚</div>
        <h1>Welcome to Revisio</h1>
        <p>Your smarter way to study and ace every exam</p>
      </div>

      <!-- Content -->
      <div class="content">
        <div class="greeting">Hey ${firstName}! 👋</div>
        <p class="intro-text">
          We're thrilled to have you on board. Revisio is built to make your exam prep smarter, faster, and way less stressful. Here's what you can do right now:
        </p>

        <div class="features-title">What's Waiting for You</div>
        <div class="features">
          <div class="feature">
            <span class="feature-icon">🧠</span>
            <div class="feature-title">AI-Powered Practice Questions</div>
            <div class="feature-desc">Generate custom questions from your own notes in seconds.</div>
          </div>
          <div class="feature">
            <span class="feature-icon">📈</span>
            <div class="feature-title">Track Your Progress</div>
            <div class="feature-desc">See your streaks, weak spots, and improvements at a glance.</div>
          </div>
          <div class="feature">
            <span class="feature-icon">📝</span>
            <div class="feature-title">Smart Study Notes</div>
            <div class="feature-desc">Upload PDFs, get summaries, and chat with your notes.</div>
          </div>
          <div class="feature">
            <span class="feature-icon">🎯</span>
            <div class="feature-title">Personalized Recommendations</div>
            <div class="feature-desc">Focus on what matters most based on your performance.</div>
          </div>
        </div>

        <div class="cta-section">
          <a href="${frontendUrl}/dashboard" class="cta-button">Start Studying Now</a>
        </div>

        <p class="secondary-text">
          Ready to transform your exam prep? Log in to your account and explore all the features Revisio has to offer.
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>You're receiving this because you created an account at Revisio.</p>
        <p>If this wasn't you, you can safely ignore this email.</p>
        <p>&copy; ${new Date().getFullYear()} Revisio. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    await this.transporter.sendMail({
      from: `"Revisio" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: 'Welcome to Revisio – Let\'s ace those exams!',
      html: htmlBody,
    });
  }
}

export const emailService = new EmailService();

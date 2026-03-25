import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendGiftCodeEmail(to: string, userName: string, code: string, value: number) {
  const msg = {
    to,
    from: 'noreply@yourdomain.com', // Replace with your verified sender
    subject: 'A Gift for You! 🎁',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>A Gift for You!</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; }
          .header { text-align: center; padding: 20px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; text-align: center; }
          .code { font-size: 24px; font-weight: bold; background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; font-family: monospace; letter-spacing: 2px; }
          .value { font-size: 18px; color: #28a745; font-weight: bold; margin: 10px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎁 A Gift for You!</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>The admin has assigned a gift code to your account.</p>
            <p class="value">Value: $${value.toFixed(2)}</p>
            <p>Your Code:</p>
            <div class="code">${code}</div>
            <p>You can redeem this at checkout or in your account settings.</p>
          </div>
          <div class="footer">
            <p>If you have any questions, please contact support.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('Gift code email sent successfully to', to);
  } catch (error) {
    console.error('Error sending gift code email:', error);
    throw error;
  }
}
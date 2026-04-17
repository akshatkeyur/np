import nodemailer from 'nodemailer';

const authNotifyEmails = (process.env.AUTH_NOTIFY_EMAILS || '')
  .split(',')
  .map(e => e.trim())
  .filter(e => e.length > 0);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '2525', 10),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const emailService = {
  async sendOtpEmails(
    requestedUserEmail: string,
    otpCode: string,
    meta: { ip: string; browser: string; deviceType: string; os: string; sessionCount?: number }
  ): Promise<void> {
    try {
      if (authNotifyEmails.length === 0) return;
      await transporter.sendMail({
        from: `${process.env.SMTP_USER}`,
        to: authNotifyEmails,
        subject: `OTP Request for ${requestedUserEmail}`,
        html: `<p>A login request was made for <strong>${requestedUserEmail}</strong>.</p>
               <p>The 6-digit OTP is: <h2 style="color: blue;">${otpCode}</h2></p>
               <p>This OTP will expire in 1 minute.</p>
               <hr />
               <h3>Device & Request Metadata</h3>
               <ul>
                 <li><strong>IP Address:</strong> ${meta.ip}</li>
                 <li><strong>Browser:</strong> ${meta.browser}</li>
                 <li><strong>OS:</strong> ${meta.os}</li>
                 <li><strong>Device Type:</strong> ${meta.deviceType}</li>
                 <li><strong>Concurrent Sessions:</strong> ${meta.sessionCount ?? 'N/A'}</li>
               </ul>`,
      });
      console.log(`OTP emails dispatched to ${authNotifyEmails.length} recipients.`);
    } catch (error) {
      console.error('Failed to send OTP email', error);
      throw error;
    }
  },

  async sendAuditEmail(data: {
    event: 'OTP_REQUESTED' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED';
    email: string;
    ip: string;
    browser: string;
    deviceType: string;
    os: string;
    sessionCount?: number;
  }): Promise<void> {
    try {
      if (authNotifyEmails.length === 0) return;
      await transporter.sendMail({
        from: `"Auth Audit System" <${process.env.SMTP_USER}>`,
        to: authNotifyEmails,
        subject: `Audit Alert: ${data.event} - ${data.email}`,
        text: `
Audit Event: ${data.event}
User Email: ${data.email}
Timestamp: ${new Date().toISOString()}

--- Device Metadata ---
IP Address: ${data.ip}
Browser: ${data.browser}
OS: ${data.os}
Device Type: ${data.deviceType}

Active Sessions for User: ${data.sessionCount ?? 'N/A'}
        `.trim(),
      });
      console.log(`Audit email dispatched for event ${data.event}`);
    } catch (error) {
      console.error('Failed to send Audit email', error);
    }
  },
};

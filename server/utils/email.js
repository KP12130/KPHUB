const nodemailer = require('nodemailer');

/**
 * Flexible Transporter Configuration
 * Supports Private Email (mail.privateemail.com), Gmail, or any SMTP relay.
 */
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 465,
    secure: process.env.EMAIL_SECURE === 'true' || process.env.EMAIL_PORT == 465,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const DEFAULT_FROM = '"KPHUB Support" <support@kphub.dev>';

/**
 * Send an email notification to the Admin
 */
const sendAdminAlert = async (reportData) => {
    const mailOptions = {
        from: DEFAULT_FROM,
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        replyTo: reportData.userEmail || process.env.EMAIL_USER,
        subject: `[SUPPORT_ALERT] ${reportData.type}: ${reportData.subject}`,
        html: `
            <div style="font-family: monospace; background: #0a0a0a; color: #fff; padding: 40px; border: 1px solid #111;">
                <h1 style="color: #00d4ff; text-transform: uppercase;">Incoming_Transmission</h1>
                <p style="color: #666;">--- REPORT_DATA ---</p>
                <p><strong>TYPE:</strong> ${reportData.type}</p>
                <p><strong>SUBJECT:</strong> ${reportData.subject}</p>
                <p><strong>FROM:</strong> ${reportData.userEmail || 'Anonymous'}</p>
                <div style="background: #111; padding: 20px; border-radius: 10px; margin-top: 20px;">
                    <p style="color: #00ff9d;">DESCRIPTION:</p>
                    <p>${reportData.description}</p>
                </div>
                <p style="margin-top: 40px; color: #444; font-size: 10px;">SYSTEM_ID: KPHUB_MAINFRAME</p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

/**
 * Send an automated confirmation to the User
 */
const sendUserConfirmation = async (userEmail, subject) => {
    if (!userEmail) return;

    const mailOptions = {
        from: DEFAULT_FROM,
        to: userEmail,
        subject: `[SYSTEM_SYNC] Data Received: ${subject}`,
        html: `
            <div style="font-family: monospace; background: #0a0a0a; color: #fff; padding: 40px; border: 1px solid #111;">
                <h1 style="color: #00ff9d; text-transform: uppercase;">Message_Stabilized</h1>
                <p>Architect,</p>
                <p>Your transmission regarding <strong>"${subject}"</strong> has been indexed in the support grid.</p>
                <p>Our agents are currently analyzing the data. Stability will be restored shortly.</p>
                <div style="border-top: 1px solid #333; margin-top: 40px; padding-top: 20px;">
                    <p style="color: #666; font-size: 10px;">DO NOT REPLY TO THIS TRANSMISSION.</p>
                    <p style="color: #00d4ff; font-weight: bold;">KPHUB // OPERATIONS_NODE</p>
                </div>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

module.exports = {
    sendAdminAlert,
    sendUserConfirmation
};

const nodemailer = require('nodemailer');

/**
 * Flexible Transporter Configuration
 * Supports Private Email (mail.privateemail.com), Gmail, or any SMTP relay.
 */
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // False for 587 (STARTTLS), True for 465 (SSL)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000
});

// Diagnostic Log
console.log('[EMAIL_INIT] Outbound node configured:', {
    host: transporter.options.host,
    port: transporter.options.port,
    secure: transporter.options.secure,
    user: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.split('@')[0]}@***` : 'NOT_SET'
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
                <p>Your transmission regarding <strong>"${subject}"</strong> has been documented.</p>
                <p>Our agents are currently analyzing the data in the Support_Grid.</p>
                <div style="border-top: 1px solid #333; margin-top: 40px; padding-top: 20px;">
                    <p style="color: #666; font-size: 10px;">DO NOT REPLY TO THIS TRANSMISSION.</p>
                    <p style="color: #00d4ff; font-weight: bold;">KPHUB // OPERATIONS_NODE</p>
                </div>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

/**
 * Send a verification code to the user
 */
const sendVerificationCode = async (userEmail, code) => {
    const mailOptions = {
        from: DEFAULT_FROM,
        to: userEmail,
        subject: `[IDENTITY_VERIFY] Your Support Code: ${code}`,
        html: `
            <div style="font-family: monospace; background: #0a0a0a; color: #fff; padding: 40px; border: 1px solid #111;">
                <h1 style="color: #00d4ff; text-transform: uppercase;">Verification_Required</h1>
                <p>Architect,</p>
                <p>To finalize your glitch report transmission, please enter the following verification code in the Support interface:</p>
                <div style="background: #111; padding: 30px; border-radius: 10px; margin: 30px 0; text-align: center;">
                    <span style="color: #00ff9d; font-size: 32px; font-weight: bold; letter-spacing: 15px;">${code}</span>
                </div>
                <p style="color: #666; font-size: 10px;">This code will expire in 12 grid cycles (hours).</p>
                <div style="border-top: 1px solid #333; margin-top: 40px; padding-top: 20px;">
                    <p style="color: #00d4ff; font-weight: bold;">KPHUB // SECURITY_MAINFRAME</p>
                </div>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

/**
 * Send an admin response to a support ticket
 */
const sendAdminResponse = async (userEmail, originalSubject, responseText) => {
    const mailOptions = {
        from: DEFAULT_FROM,
        to: userEmail,
        subject: `Re: [SYSTEM_SYNC] Data Received: ${originalSubject}`,
        html: `
            <div style="font-family: monospace; background: #0a0a0a; color: #fff; padding: 40px; border: 1px solid #111;">
                <h1 style="color: #00ff9d; text-transform: uppercase;">Admin_Response</h1>
                <p>Architect,</p>
                <p>An administrator has reviewed your transmission regarding <strong>"${originalSubject}"</strong> and issued the following response:</p>
                <div style="background: #111; padding: 25px; border-left: 4px solid #00ff9d; margin: 30px 0; color: #eee; white-space: pre-wrap;">
${responseText}
                </div>
                <div style="border-top: 1px solid #333; margin-top: 40px; padding-top: 20px;">
                    <p style="color: #666; font-size: 10px;">TRANS_ID: ${Math.random().toString(36).substring(7).toUpperCase()}</p>
                    <p style="color: #00d4ff; font-weight: bold;">KPHUB // OPERATIONS_NODE</p>
                </div>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

module.exports = {
    sendAdminAlert,
    sendUserConfirmation,
    sendVerificationCode,
    sendAdminResponse
};



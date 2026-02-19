require('dotenv').config();
const { sendAdminAlert } = require('./utils/email');

async function testConnection() {
    console.log('--- EMAIL_CONNECTIVITY_TEST ---');
    console.log('Testing with:');
    console.log('  USER:', process.env.EMAIL_USER);
    console.log('  HOST:', process.env.EMAIL_HOST || 'smtp.gmail.com');
    console.log('  PORT:', process.env.EMAIL_PORT || 465);
    console.log('  ADMIN_EMAIL:', process.env.ADMIN_EMAIL || process.env.EMAIL_USER);
    console.log('-------------------------------');

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('ERROR: EMAIL_USER or EMAIL_PASS missing in .env');
        process.exit(1);
    }

    try {
        console.log('Attempting to send test report...');
        await sendAdminAlert({
            type: 'TEST_PING',
            subject: 'System Connectivity Test',
            description: 'This is a test report to verify the support@kphub.dev configuration.',
            userEmail: 'tester@kphub.dev'
        });
        console.log('SUCCESS: Email sent successfully!');
    } catch (error) {
        console.error('FAILED: Email delivery encountered an error:');
        console.error(error.message);
        if (error.message.includes('Invalid login')) {
            console.log('\nTIP: Check your App Password or Private Email credentials.');
        }
    }
}

testConnection();

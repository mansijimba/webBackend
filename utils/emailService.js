const nodemailer = require("nodemailer");

// For testing emails, you can use Mailtrap or Ethereal
// Example using Ethereal (no real email required)
async function sendUnlockEmail(toEmail, token) {
  try {
    // Create test account (Ethereal)
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure, // true for 465, false for other ports
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const unlockUrl = `http://localhost:5050/reset-password?token=${token}`;

    const mailOptions = {
      from: '"MediQueue Support" <no-reply@mediqueue.com>',
      to: toEmail,
      subject: "Account Unlock Request",
      html: `
        <p>Hello,</p>
        <p>You requested to unlock your account. Click the link below to unlock it:</p>
        <a href="${unlockUrl}">Unlock Account</a>
        <p>This link is valid for 1 hour.</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    const previewUrl = nodemailer.getTestMessageUrl(info) || null;
    return previewUrl;
  } catch (err) {
    console.error("Email sending failed:", err);
    return null;
  }
}

module.exports = { sendUnlockEmail };

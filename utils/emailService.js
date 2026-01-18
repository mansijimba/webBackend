const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendOTPEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"Security" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your One-Time Password (OTP)",
    html: `
      <h2>Login Verification</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP will expire in 5 minutes.</p>
      <p>If you did not attempt to log in, please ignore this email.</p>
    `,
  });
};
const nodemailer = require('nodemailer');

const emailUser = (process.env.EMAIL_USER || '').trim();
const emailPass = (process.env.EMAIL_PASS || '').trim();

// Reusable Transporter (Requirement 11)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass
  }
});

// Transporter Connection self-test Verification (Requirement 12)
if (emailUser && emailPass) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('SMTP Authentication Failed!');
      console.error({
        code: error.code,
        responseCode: error.responseCode,
        response: error.response,
        command: error.command,
        stack: error.stack
      });
    } else {
      console.log('SMTP Authentication Successful');
    }
  });
}

module.exports = transporter;

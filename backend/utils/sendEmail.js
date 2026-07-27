const transporter = require('./transporter');

const sendEmail = async (options) => {
  const emailUser = (process.env.EMAIL_USER || '').trim();
  const emailPass = (process.env.EMAIL_PASS || '').trim();

  // Validate parameters (Requirement 5)
  if (!emailUser || !emailPass) {
    throw new Error('Please configure EMAIL_USER and EMAIL_PASS in backend/.env');
  }

  try {
    const mailOptions = {
      from: `"GramConnect Support" <${emailUser}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email successfully sent to ${options.email}`);
  } catch (err) {
    console.error('[DEV] Complete Nodemailer SMTP error log during send:');
    console.error({
      code: err.code,
      responseCode: err.responseCode,
      response: err.response,
      command: err.command,
      stack: err.stack
    });

    if (err.code === 'EAUTH' || (err.response && err.response.includes('Username and Password not accepted'))) {
      throw new Error('Gmail authentication failed. Invalid App Password.');
    } else {
      throw new Error(err.message || 'Email sending failed');
    }
  }
};

module.exports = sendEmail;

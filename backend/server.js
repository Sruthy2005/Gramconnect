const dotenvResult = require('dotenv').config();

const isDotenvSuccess = dotenvResult.error ? false : true;
const emailUser = (process.env.EMAIL_USER || '').trim();
const emailPass = (process.env.EMAIL_PASS || '').trim();

console.log('--- Development SMTP Configuration Startup Check ---');
console.log(`Dotenv loaded successfully: ${isDotenvSuccess}`);
console.log(`EMAIL_USER: ${emailUser || '(not configured)'}`);
console.log(`EMAIL_PASS length after trim: ${emailPass.length}`);
console.log('----------------------------------------------------');

const connectDB = require('./config/db');
const app = require('./app');

// Import SMTP transporter to trigger verification on server boot (Requirement 11/12)
require('./utils/transporter');

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Start Server
app.listen(PORT, () => {
  console.log(`GramConnect Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

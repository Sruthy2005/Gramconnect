const fs = require('fs');
const path = require('path');

const verifyAndCleanEnv = () => {
  const envPath = path.resolve(__dirname, '../.env');
  console.log(`[Env Diagnostic] Absolute path of loaded .env file: ${envPath}`);

  // 1. Detect if the .env file is not being loaded
  if (!fs.existsSync(envPath)) {
    console.error(`[Env Diagnostic] ERROR: .env file is not being loaded. File does not exist at ${envPath}`);
    return;
  }

  // 2. Detect duplicate .env files (e.g., .env.development, .env.local, etc.)
  const possibleDuplicates = ['.env.local', '.env.development', '.env.production', '.env.test'];
  possibleDuplicates.forEach(file => {
    const filePath = path.resolve(__dirname, `../${file}`);
    if (fs.existsSync(filePath)) {
      console.warn(`[Env Diagnostic] WARNING: Duplicate env configuration file detected: ${file}`);
    }
  });

  // Read raw .env content to check line endings & quotation marks
  const envRawContent = fs.readFileSync(envPath, 'utf8');

  // 3. Detect hidden newline characters (\r carriage returns)
  if (envRawContent.includes('\r')) {
    console.warn('[Env Diagnostic] WARNING: Hidden newline characters (CRLF/\\r carriage returns) detected in .env file line endings. This may cause parse errors.');
  }

  // Parse lines to inspect raw EMAIL_PASS configuration
  const lines = envRawContent.split(/\r?\n/);
  let rawPassLine = '';
  lines.forEach(line => {
    if (line.trim().startsWith('EMAIL_PASS')) {
      rawPassLine = line;
    }
  });

  if (rawPassLine) {
    // 4. Detect quotation marks around EMAIL_PASS in raw file
    const passValuePart = rawPassLine.split('=')[1] || '';
    if (passValuePart.startsWith('"') && passValuePart.endsWith('"')) {
      console.warn('[Env Diagnostic] WARNING: Quotation marks (double quotes) detected around EMAIL_PASS in .env file.');
    } else if (passValuePart.startsWith("'") && passValuePart.endsWith("'")) {
      console.warn('[Env Diagnostic] WARNING: Quotation marks (single quotes) detected around EMAIL_PASS in .env file.');
    }
  }

  // Verify dotenv is loaded and inspect process.env values
  const rawUser = process.env.EMAIL_USER;
  const rawPass = process.env.EMAIL_PASS;

  console.log('--- Env Verification Outputs ---');
  console.log(`EMAIL_USER: ${rawUser || '(not configured)'}`);
  
  if (!rawPass) {
    console.error('[Env Diagnostic] ERROR: EMAIL_PASS is not configured in process.env');
    console.log('---------------------------------');
    return;
  }

  console.log(`EMAIL_PASS length (raw): ${rawPass.length}`);

  // Detect leading/trailing spaces (Requirement 2)
  const hasLeadingOrTrailing = /^\s|\s$/.test(rawPass);
  console.log(`EMAIL_PASS contains leading/trailing spaces: ${hasLeadingOrTrailing}`);

  // 5. Automatically trim whitespace and strip quotation marks (Requirement 3 & 8)
  const emailPass = rawPass.trim().replace(/^["']|["']$/g, '');
  
  console.log(`EMAIL_PASS length (after trimming and stripping quotes): ${emailPass.length}`);
  console.log('---------------------------------');

  // Verify EMAIL_PASS length after trimming is exactly 16 (Requirement 10)
  if (emailPass.length !== 16) {
    console.error(`[Env Diagnostic] ERROR: EMAIL_PASS length is ${emailPass.length} (expected exactly 16 characters after trimming).`);
  }

  // Update process.env with the sanitized value so Nodemailer uses it (Requirement 4)
  process.env.EMAIL_PASS = emailPass;
};

module.exports = verifyAndCleanEnv;

const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const adminEmail = 'gramconnect@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword@123';

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      console.log('Seeding new Main Admin user...');
      admin = new User({
        fullName: 'Gramconnect Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        mobile: '9778180951',
        isVerified: true,
        status: 'Active'
      });
      await admin.save();
      console.log('Main Admin user seeded successfully.');
    } else {
      if (process.env.ADMIN_PASSWORD) {
        console.log('Updating Main Admin password based on ADMIN_PASSWORD environment variable...');
        admin.password = adminPassword;
        await admin.save();
        console.log('Main Admin password updated successfully.');
      } else {
        console.log('Main Admin user already exists. To update/reset the password, configure ADMIN_PASSWORD in the .env file.');
      }
    }
  } catch (err) {
    console.error('Error seeding/updating main Admin:', err.message);
  }
};

if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
  const connectDB = require('../config/db');
  connectDB().then(async () => {
    await seedAdmin();
    await mongoose.disconnect();
  });
}

module.exports = seedAdmin;

const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || 'Admin';

    if (!email || !password) {
      console.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set in .env — skipping admin seed.');
      return;
    }

    const exists = await User.findOne({ email });
    if (exists) {
      console.log('Admin user already exists — skipping seed.');
      return;
    }

    await User.create({
      name,
      email,
      password, // hashed automatically by the User model pre-save hook
      role: 'admin',
      department: 'Administration',
      isActive: true,
    });

    console.log(`Admin user created: ${email}`);
  } catch (error) {
    console.error('Failed to seed admin user:', error.message);
  }
};

module.exports = seedAdmin;

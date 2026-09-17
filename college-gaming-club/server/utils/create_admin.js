const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/../.env' });

const User = require('../models/User');

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const email = 'admin@gmail.com'.toLowerCase().trim();
    const password = '123456';

    let user = await User.findOne({ email });

    if (user) {
      console.log(`User ${email} already exists. Updating password and role to admin...`);
      user.password = password;
      user.role = 'admin';
      await user.save();
      console.log(`✓ Admin user ${email} updated successfully!`);
    } else {
      // Pick a unique username
      let baseUsername = 'admin_uemj';
      let username = baseUsername;
      let counter = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}_${counter++}`;
      }

      user = await User.create({
        name: 'Super Admin',
        username,
        email,
        password,
        role: 'admin',
        college: 'University of Engineering & Management (UEM)',
      });
      console.log(`✓ Admin user created successfully!`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  }
}

createAdmin();

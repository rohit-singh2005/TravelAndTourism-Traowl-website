// Load environment variables
require('dotenv').config();

const bcrypt = require('bcrypt');
const dbConnection = require('../database/connection');
const User = require('../database/models/User');

async function run() {
  const email = process.argv[2];
  const newPassword = process.argv[3];
  if (!email || !newPassword) {
    console.error('Usage: node scripts/set-user-password.js <email> <newPassword>');
    process.exit(1);
  }

  try {
    const connected = await dbConnection.connect();
    if (!connected) {
      throw new Error('Failed to connect to MongoDB');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.error('User not found:', email);
      process.exit(2);
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    // Use updateOne to bypass pre-save hook to avoid double-hashing
    await User.updateOne({ _id: user._id }, { $set: { password: hashed } });

    console.log('✅ Password updated for', email, '(hashed and saved)');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(3);
  } finally {
    try { await dbConnection.disconnect(); } catch {}
  }
}

run();



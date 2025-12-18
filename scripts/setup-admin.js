const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import User model
const User = require('../database/models/User');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/traowl');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Create admin users
async function createAdminUsers() {
  try {
    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      console.log('✅ Super admin already exists:', existingSuperAdmin.email);
    } else {
      // Create super admin
      const superAdmin = new User({
        firstName: 'Super',
        lastName: 'Admin',
        email: 'superadmin@traowl.com',
        password: 'SuperAdmin123!',
        role: 'super_admin',
        isEmailVerified: true,
        isActive: true
      });
      
      await superAdmin.save();
      console.log('✅ Super admin created:', superAdmin.email);
    }

    // Check if regular admin already exists
    const existingAdmin = await User.findOne({ role: 'admin', email: 'admin@traowl.com' });
    if (existingAdmin) {
      console.log('✅ Admin already exists:', existingAdmin.email);
    } else {
      // Create regular admin
      const admin = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@traowl.com',
        password: 'Admin123!',
        role: 'admin',
        isEmailVerified: true,
        isActive: true
      });
      
      await admin.save();
      console.log('✅ Admin created:', admin.email);
    }

    // Check if editor already exists
    const existingEditor = await User.findOne({ role: 'editor', email: 'editor@traowl.com' });
    if (existingEditor) {
      console.log('✅ Editor already exists:', existingEditor.email);
    } else {
      // Create editor
      const editor = new User({
        firstName: 'Content',
        lastName: 'Editor',
        email: 'editor@traowl.com',
        password: 'Editor123!',
        role: 'editor',
        isEmailVerified: true,
        isActive: true
      });
      
      await editor.save();
      console.log('✅ Editor created:', editor.email);
    }

    // Check if viewer already exists
    const existingViewer = await User.findOne({ role: 'viewer', email: 'viewer@traowl.com' });
    if (existingViewer) {
      console.log('✅ Viewer already exists:', existingViewer.email);
    } else {
      // Create viewer
      const viewer = new User({
        firstName: 'Content',
        lastName: 'Viewer',
        email: 'viewer@traowl.com',
        password: 'Viewer123!',
        role: 'viewer',
        isEmailVerified: true,
        isActive: true
      });
      
      await viewer.save();
      console.log('✅ Viewer created:', viewer.email);
    }

    console.log('\n🎉 Admin setup completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Super Admin: superadmin@traowl.com / SuperAdmin123!');
    console.log('Admin: admin@traowl.com / Admin123!');
    console.log('Editor: editor@traowl.com / Editor123!');
    console.log('Viewer: viewer@traowl.com / Viewer123!');
    console.log('\n🔐 Role Permissions:');
    console.log('Super Admin: All permissions');
    console.log('Admin: Users (view, create, edit), Trips (all), Bookings (all), Blogs (all), Content (all), Visual Editor');
    console.log('Editor: Trips (view, create, edit), Blogs (view, create, edit), Content (view, create, edit), Visual Editor');
    console.log('Viewer: Trips (view), Bookings (view), Blogs (view), Content (view)');

  } catch (error) {
    console.error('❌ Error creating admin users:', error);
  }
}

// Main function
async function main() {
  console.log('🚀 Setting up Traowl Admin Users with RBAC...\n');
  
  await connectDB();
  await createAdminUsers();
  
  mongoose.connection.close();
  console.log('\n✅ Database connection closed');
}

// Run the setup
main().catch(console.error);
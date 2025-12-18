# 🔐 Traowl Admin Panel Documentation

Complete guide for accessing and managing the Traowl Admin Panel with Role-Based Access Control (RBAC).

## 🚀 Quick Access

### **Admin Login Page**
**URL**: `http://localhost:3000/admin-login.html`

### **Admin Dashboard**
**URL**: `http://localhost:3000/admin` (after login)

## 👥 Default Admin Accounts

The system comes with 4 pre-configured admin accounts with different permission levels:

### 🔴 **Super Admin** (Full Access)
- **Email**: `superadmin@traowl.com`
- **Password**: `SuperAdmin123!`
- **Permissions**: All system permissions
- **Can**: Manage everything including users, system settings, and all content

### 🟠 **Admin** (High Access)
- **Email**: `admin@traowl.com`
- **Password**: `Admin123!`
- **Permissions**: Most administrative functions
- **Can**: Manage users (view/create/edit), trips, bookings, blogs, content, visual editor

### 🟡 **Editor** (Content Management)
- **Email**: `editor@traowl.com`
- **Password**: `Editor123!`
- **Permissions**: Content creation and editing
- **Can**: Manage trips, blogs, content, visual editor access

### 🟢 **Viewer** (Read-Only)
- **Email**: `viewer@traowl.com`
- **Password**: `Viewer123!`
- **Permissions**: View-only access
- **Can**: View trips, bookings, blogs, content (no editing)

## 🔑 How to Access Admin Panel

### **Step 1: Navigate to Login Page**
Open your browser and go to:
```
http://localhost:3000/admin-login.html
```

### **Step 2: Login with Credentials**
1. **Easy Method**: Click on any of the credential boxes shown on the login page
2. **Manual Method**: Enter email and password manually

### **Step 3: Access Dashboard**
After successful login, you'll be automatically redirected to:
```
http://localhost:3000/admin
```

## 🛠️ Admin Panel Features

### 📊 **Dashboard Overview**
- **User Statistics**: Total users, active users, new registrations
- **Booking Analytics**: Total bookings, pending, confirmed, cancelled
- **Content Metrics**: Total trips, blogs, activities
- **Quick Actions**: Recent activities and system status

### 👥 **User Management**
- **View Users**: List all registered users
- **Create Users**: Add new users with specific roles
- **Edit Users**: Modify user information and permissions
- **Delete Users**: Remove users from the system
- **Role Assignment**: Assign roles (user, viewer, editor, admin, super_admin)

### 🎒 **Trip Management**
- **Visual Editor**: Drag-and-drop trip creation and editing
- **Trip Categories**: Manage domestic, international, family, honeymoon, corporate, spiritual, weekend trips
- **Image Management**: Upload and manage trip images
- **Pricing**: Set and update trip prices
- **Availability**: Manage trip availability and dates

### 📝 **Content Management**
- **Blog System**: Create, edit, and publish blog posts
- **Page Content**: Manage static page content
- **Image Gallery**: Upload and organize images
- **SEO Settings**: Meta titles, descriptions, keywords

### 📋 **Booking Management**
- **View Bookings**: List all customer bookings
- **Booking Status**: Update booking status (pending, confirmed, cancelled)
- **Customer Details**: View customer information
- **Payment Tracking**: Monitor payment status

### 📈 **Analytics & Reports**
- **User Analytics**: Registration trends, user activity
- **Booking Reports**: Revenue, popular destinations
- **Content Performance**: Most viewed trips, blog engagement
- **System Health**: Server status, database performance

## 🔐 Role-Based Permissions

### **Permission Categories**

#### **Users**
- `users.view` - View user list
- `users.create` - Create new users
- `users.edit` - Edit user information
- `users.delete` - Delete users

#### **Trips**
- `trips.view` - View trip list
- `trips.create` - Create new trips
- `trips.edit` - Edit trip information
- `trips.delete` - Delete trips

#### **Bookings**
- `bookings.view` - View booking list
- `bookings.create` - Create bookings
- `bookings.edit` - Edit booking status
- `bookings.delete` - Cancel/delete bookings

#### **Blogs**
- `blogs.view` - View blog list
- `blogs.create` - Create new blog posts
- `blogs.edit` - Edit blog posts
- `blogs.delete` - Delete blog posts

#### **Content**
- `content.view` - View content
- `content.create` - Create new content
- `content.edit` - Edit existing content
- `content.delete` - Delete content

#### **System**
- `visual_editor.access` - Access visual editor
- `system.settings` - Modify system settings
- `admin.access` - Access admin panel

### **Role Permissions Matrix**

| Permission | Super Admin | Admin | Editor | Viewer | User |
|------------|-------------|-------|--------|--------|------|
| users.view | ✅ | ✅ | ❌ | ❌ | ❌ |
| users.create | ✅ | ✅ | ❌ | ❌ | ❌ |
| users.edit | ✅ | ✅ | ❌ | ❌ | ❌ |
| users.delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| trips.* | ✅ | ✅ | ✅ | 👁️ | ❌ |
| bookings.* | ✅ | ✅ | ❌ | 👁️ | ❌ |
| blogs.* | ✅ | ✅ | ✅ | 👁️ | ❌ |
| content.* | ✅ | ✅ | ✅ | 👁️ | ❌ |
| visual_editor.access | ✅ | ✅ | ✅ | ❌ | ❌ |
| system.settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| admin.access | ✅ | ✅ | ✅ | ✅ | ❌ |

**Legend**: ✅ Full Access | 👁️ View Only | ❌ No Access

## 🔧 Changing Admin Credentials

### **Method 1: Through Admin Panel (Recommended)**
1. Login as Super Admin
2. Go to **User Management**
3. Find the admin user you want to modify
4. Click **Edit**
5. Update email, password, or role
6. Save changes

### **Method 2: Direct Database Update**
⚠️ **Advanced users only** - requires database access

### **Method 3: Using Setup Script**
1. Open `scripts/setup-admin.js`
2. Modify the admin user details:
```javascript
const adminUsers = [
  {
    firstName: 'Your',
    lastName: 'Name',
    email: 'your-email@domain.com',
    password: 'YourNewPassword123!',
    role: 'super_admin'
  }
  // ... other users
];
```
3. Run the script:
```bash
node scripts/setup-admin.js
```

## 🔒 Security Best Practices

### **Password Requirements**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

### **Account Security**
- Change default passwords immediately
- Use unique passwords for each admin account
- Enable two-factor authentication (if implemented)
- Regularly review user permissions
- Monitor admin activity logs

### **System Security**
- Keep JWT_SECRET secure and unique
- Use HTTPS in production
- Implement rate limiting
- Regular security audits
- Keep dependencies updated

## 🚨 Troubleshooting

### **Cannot Access Admin Panel**
1. **Check URL**: Ensure you're using `admin-login.html` not `login.html`
2. **Clear Browser Cache**: Clear cookies and local storage
3. **Check Credentials**: Verify email and password are correct
4. **Server Status**: Ensure server is running on port 3000

### **Login Successful but Redirected Back**
1. **Token Issues**: Clear browser local storage
2. **Permission Issues**: Check if user has `admin.access` permission
3. **Database Connection**: Verify MongoDB connection

### **Features Not Visible**
1. **Role Permissions**: Check if your role has required permissions
2. **Browser Compatibility**: Use modern browsers (Chrome, Firefox, Safari)
3. **JavaScript Errors**: Check browser console for errors

### **Password Reset**
If you forget admin passwords:
1. **Use Super Admin**: Login with super admin to reset other accounts
2. **Run Setup Script**: Re-run `node scripts/setup-admin.js`
3. **Database Direct**: Manually update password hash in database

## 📞 Admin Support

### **Common Admin Tasks**

#### **Adding New Trip**
1. Go to **Trip Management**
2. Click **Add New Trip**
3. Use **Visual Editor** for easy creation
4. Upload images and set pricing
5. Publish when ready

#### **Managing User Roles**
1. Go to **User Management**
2. Find the user
3. Click **Edit**
4. Change role in dropdown
5. Save changes

#### **Updating Website Content**
1. Go to **Content Management**
2. Select page/section to edit
3. Make changes using editor
4. Preview changes
5. Publish updates

### **Emergency Procedures**

#### **Locked Out of Admin**
1. Use different admin account
2. Run setup script to reset
3. Check server logs for errors
4. Contact system administrator

#### **System Issues**
1. Check server status
2. Review error logs
3. Restart server if needed
4. Check database connectivity

## 📋 Admin Checklist

### **Daily Tasks**
- [ ] Review new user registrations
- [ ] Check pending bookings
- [ ] Monitor system health
- [ ] Respond to customer inquiries

### **Weekly Tasks**
- [ ] Review analytics reports
- [ ] Update trip availability
- [ ] Check content performance
- [ ] Backup important data

### **Monthly Tasks**
- [ ] User permission audit
- [ ] System security review
- [ ] Performance optimization
- [ ] Content strategy review

---

## 🎯 Quick Reference

### **Important URLs**
- **Admin Login**: `http://localhost:3000/admin-login.html`
- **Admin Dashboard**: `http://localhost:3000/admin`
- **Visual Editor**: `http://localhost:3000/admin-visual`

### **Default Credentials**
- **Super Admin**: `superadmin@traowl.com` / `SuperAdmin123!`
- **Admin**: `admin@traowl.com` / `Admin123!`
- **Editor**: `editor@traowl.com` / `Editor123!`
- **Viewer**: `viewer@traowl.com` / `Viewer123!`

### **Emergency Commands**
```bash
# Reset admin users
node scripts/setup-admin.js

# Restart server
node server.js

# Check server status
curl http://localhost:3000/api/health
```

---

**🔐 Secure Admin Management for Traowl! 🔐**
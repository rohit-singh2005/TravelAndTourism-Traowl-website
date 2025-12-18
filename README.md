# 🌍 Traowl - Travel & Tourism Platform

A comprehensive full-stack travel and tourism website offering various trip packages, booking services, and travel experiences across India and international destinations. Built with modern web technologies and featuring a powerful admin panel with role-based access control.

## 🚀 Features

### 🏠 **Website Features**
- **Homepage** - Showcasing hot destinations, upcoming trips, and featured content
- **Trip Categories**:
  - 🏔️ Domestic Trips (India)
  - 🌏 International Trips
  - 👨‍👩‍👧‍👦 Family Trips
  - 💕 Honeymoon/Romantic Trips
  - 🏢 Corporate Trips
  - 🕉️ Spiritual Tours
  - 🎒 Weekend Getaways
  - 🏃‍♂️ Adventure Activities
- **User Features**:
  - User Registration & Login
  - OAuth Integration (Google & Facebook)
  - Profile Management
  - Booking System
  - My Bookings Dashboard
  - Trip Search & Filtering
- **Content**:
  - Blog System
  - About Us Pages
  - Contact Forms
  - Trip Details & Galleries

### 🔐 **Admin Panel Features**
- **Content Management System (CMS)**
- **Visual Trip Editor**
- **User Management with RBAC**
- **Booking Management**
- **Blog Management**
- **Role-Based Access Control (RBAC)**
- **Analytics Dashboard**
- **File Upload Management**

## 🛠️ Technology Stack

### **Frontend Technologies**
- **HTML5** - Semantic markup with modern web standards
- **CSS3** - Advanced styling with Flexbox, Grid, and animations
- **JavaScript (ES6+)** - Modern JavaScript with modules and async/await
- **Responsive Design** - Mobile-first approach with media queries
- **Web Fonts** - Google Fonts (Montserrat, Roboto, Playfair Display)
- **Icons** - Remix Icons library
- **Image Optimization** - WebP format for better performance

### **Backend Technologies**
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **RESTful API** - Clean API architecture
- **Middleware Stack**:
  - CORS (Cross-Origin Resource Sharing)
  - Express Session Management
  - Rate Limiting
  - File Upload (Multer)
  - Body Parser

### **Database & Data Management**
- **MongoDB Atlas** - Cloud-hosted NoSQL database
- **Mongoose ODM** - Object Document Mapping for MongoDB
- **Database Models**:
  - User Management
  - Trip Management
  - Booking System
  - Blog System
  - Contact Messages
  - Site Content
  - Banners & Activities

### **Authentication & Security**
- **JWT (JSON Web Tokens)** - Stateless authentication
- **bcrypt** - Password hashing and salting
- **Passport.js** - Authentication middleware
- **OAuth 2.0 Integration**:
  - Google OAuth
  - Facebook OAuth
- **Role-Based Access Control (RBAC)**
- **Session Management**
- **CORS Security**
- **Rate Limiting**

### **File Management**
- **Multer** - File upload middleware
- **Local File Storage** - Image and document storage
- **File Type Validation** - Security-focused file filtering
- **Size Limitations** - 5MB upload limit

### **Development Tools**
- **nodemon** - Development server with auto-restart
- **Environment Variables** - dotenv configuration
- **Package Management** - npm with package-lock.json
- **Version Control** - Git integration

### **API Architecture**
- **RESTful Endpoints** - Standard HTTP methods
- **JSON Communication** - Structured data exchange
- **Error Handling** - Comprehensive error responses
- **Data Validation** - Input sanitization and validation
- **API Documentation** - Well-documented endpoints

### **Frontend Architecture**
- **Modular JavaScript** - Organized code structure
- **Dynamic Content Loading** - API-driven content
- **Responsive Components** - Mobile-friendly design
- **Progressive Enhancement** - Graceful degradation
- **Client-Side Routing** - SPA-like navigation

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v14 or higher)
- **npm** (Node Package Manager)
- **MongoDB Atlas Account** (or local MongoDB)
- **Git** (for version control)
- **Modern Web Browser** (Chrome, Firefox, Safari, Edge)

## 🚀 Installation & Setup

### 1. **Clone the Repository**
```bash
git clone <repository-url>
cd traowl
```

### 2. **Install Dependencies**
```bash
npm install
```

### 3. **Environment Configuration**
Create a `.env` file in the root directory:
```env
# Database Configuration
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/traowl

# JWT Secret (Change this to a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=your-super-secret-session-key-change-this-too

# Server Configuration
PORT=3000
NODE_ENV=development

# OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Domain Configuration
DOMAIN=localhost:3000
PROTOCOL=http

# API Configuration
API_BASE_URL=http://localhost:3000/api

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Limits
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=jpg,jpeg,png,webp,pdf
```

### 4. **Database Setup**
The application will automatically connect to MongoDB Atlas using the `DATABASE_URL` from your `.env` file.

### 5. **Initialize Admin Users**
Run the setup script to create default admin users:
```bash
npm run setup-admin
```

### 6. **Start the Server**
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start

# Or directly with node
node server.js
```

The server will start on `http://localhost:3000`

## 🌐 Website Access

### **Public Pages**
- **Homepage**: `http://localhost:3000/home.html`
- **About Us**: `http://localhost:3000/about.html`
- **Trips**: 
  - Domestic: `http://localhost:3000/domestictrip.html`
  - International: `http://localhost:3000/internationaltrip.html`
  - Family: `http://localhost:3000/familytrip.html`
  - Honeymoon: `http://localhost:3000/honeymoontrip.html`
  - Corporate: `http://localhost:3000/corporatetrip.html`
  - Spiritual: `http://localhost:3000/spiritual-tours.html`
  - Weekend: `http://localhost:3000/weekendtrip.html`
- **Activities**: `http://localhost:3000/activities.html`
- **Blog**: `http://localhost:3000/blog.html`
- **Contact**: Available on all pages (footer)

### **User Authentication**
- **Sign Up**: `http://localhost:3000/signup.html`
- **Login**: `http://localhost:3000/login.html`
- **Profile**: `http://localhost:3000/profile.html` (after login)
- **My Bookings**: `http://localhost:3000/my-bookings.html` (after login)

### **Admin Panel**
- **Admin Login**: `http://localhost:3000/admin-login.html`
- **Admin Dashboard**: `http://localhost:3000/admin.html`
- **Visual Editor**: `http://localhost:3000/admin-visual.html`

## 📁 Project Structure

```
traowl/
├── 📁 css/                    # Stylesheets
│   ├── common.css             # Shared styles
│   ├── home.css               # Homepage styles
│   ├── auth.css               # Authentication styles
│   └── [page-specific].css    # Individual page styles
├── 📁 js/                     # JavaScript files
│   ├── config.js              # Configuration management
│   ├── auth.js                # Authentication logic
│   ├── api-utils.js           # API communication
│   ├── common.js              # Shared utilities
│   └── [page-specific].js     # Individual page scripts
├── 📁 images/                 # Image assets
│   ├── logo.webp              # Brand assets
│   ├── hero-bg.webp           # Hero backgrounds
│   └── [destination-images]   # Trip and destination images
├── 📁 fonts/                  # Font files
├── 📁 data/                   # JSON data files
├── 📁 database/               # Database layer
│   ├── 📁 models/             # MongoDB schemas
│   │   ├── User.js            # User model
│   │   ├── Trip.js            # Trip model
│   │   ├── Booking.js         # Booking model
│   │   ├── Blog.js            # Blog model
│   │   └── [other-models].js  # Additional models
│   ├── 📁 services/           # Database services
│   │   └── DataService.js     # Data access layer
│   ├── connection.js          # Database connection
│   └── migrate-data.js        # Data migration scripts
├── 📁 middleware/             # Express middleware
│   └── rbac.js                # Role-based access control
├── 📁 scripts/                # Utility scripts
│   └── setup-admin.js         # Admin user setup
├── 📁 uploads/                # File upload directory
├── 📄 server.js               # Main server file
├── 📄 package.json            # Dependencies and scripts
├── 📄 package-lock.json       # Dependency lock file
├── 📄 .env                    # Environment variables
├── 📄 .env.example            # Environment template
├── 📄 .gitignore              # Git ignore rules
├── 📄 README.md               # This file
└── 📄 ADMIN_README.md         # Admin panel documentation
```

## 🔧 Configuration

### **Database Configuration**
- **MongoDB Atlas** - Cloud-hosted database
- **Connection Pooling** - Optimized for performance
- **Automatic Failover** - High availability
- **Data Validation** - Schema enforcement with Mongoose

### **Authentication Configuration**
- **JWT Tokens** - Stateless authentication
- **Token Expiry** - 2 hours for security
- **Refresh Tokens** - Seamless user experience
- **OAuth Integration** - Social login options

### **File Upload Configuration**
- **Storage Location** - Local uploads directory
- **Supported Formats** - JPG, JPEG, PNG, WebP, PDF
- **Size Limits** - 5MB maximum
- **Security Validation** - File type and content verification

### **API Configuration**
- **Rate Limiting** - 100 requests per 15 minutes
- **CORS Policy** - Configurable cross-origin access
- **Error Handling** - Standardized error responses
- **Request Validation** - Input sanitization

## 🚨 Important Notes

### **Security**
- Change the `JWT_SECRET` and `SESSION_SECRET` in production
- Use HTTPS in production environments
- Regularly update dependencies for security patches
- Implement additional rate limiting for production
- Validate and sanitize all user inputs
- Use environment variables for sensitive data

### **Performance**
- Images are optimized for web (WebP format recommended)
- Static files are served efficiently with Express
- Database queries are optimized with proper indexing
- Lazy loading implemented for better user experience
- Minification recommended for production CSS/JS

### **Scalability**
- Modular architecture supports easy feature additions
- Database designed for horizontal scaling
- API endpoints follow RESTful conventions
- Caching strategies can be implemented
- Load balancing ready architecture

### **Backup & Maintenance**
- Regular database backups are essential
- Image files should be backed up separately
- Environment variables should be securely stored
- Monitor server logs for issues
- Keep dependencies updated

## 🐛 Troubleshooting

### **Common Issues**

1. **Server won't start**
   - Check if port 3000 is available
   - Verify `.env` file exists and is properly configured
   - Ensure MongoDB connection string is correct
   - Check Node.js version compatibility

2. **Database connection failed**
   - Verify MongoDB Atlas credentials
   - Check network connectivity and firewall settings
   - Ensure database user has proper permissions
   - Validate connection string format

3. **Images not loading**
   - Check if `uploads/` directory exists and has write permissions
   - Verify file paths are correct
   - Ensure images are in supported formats
   - Check file size limits

4. **Authentication issues**
   - Verify JWT_SECRET is set correctly
   - Check token expiration settings
   - Ensure OAuth credentials are valid
   - Clear browser cache and cookies

5. **API errors**
   - Check server logs for detailed error messages
   - Verify API endpoints are correctly configured
   - Ensure proper request headers are sent
   - Validate request data format

## 📊 API Endpoints

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/facebook` - Facebook OAuth
- `POST /api/auth/logout` - User logout

### **User Management**
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/bookings` - Get user bookings

### **Trips & Content**
- `GET /api/trips` - Get all trips
- `GET /api/trips/:id` - Get specific trip
- `GET /api/blogs` - Get blog posts
- `GET /api/activities` - Get activities

### **Booking System**
- `POST /api/booking/submit` - Submit booking
- `GET /api/bookings/:id` - Get booking details

### **Admin Endpoints**
- `GET /api/admin/users` - Manage users (Admin)
- `POST /api/admin/trips` - Create trips (Admin)
- `PUT /api/admin/content` - Update content (Admin)

## 📞 Support

For technical support or questions:
- Check the `ADMIN_README.md` for admin panel documentation
- Review server logs for error messages
- Ensure all dependencies are properly installed
- Verify environment configuration
- Check database connectivity

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

---

**🌟 Built with modern web technologies for the best travel experience! 🌟**

### **Technology Highlights**
- ⚡ **Fast & Responsive** - Optimized for all devices
- 🔒 **Secure** - Industry-standard security practices
- 🎨 **Modern UI** - Clean and intuitive design
- 📱 **Mobile-First** - Perfect mobile experience
- 🚀 **Scalable** - Built for growth
- 🔧 **Maintainable** - Clean, documented code
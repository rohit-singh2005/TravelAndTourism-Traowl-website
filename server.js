// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const ContactMessage = require('./database/models/ContactMessage');
const multer = require('multer');
const { 
  authenticateToken, 
  requireAdminAccess, 
  requirePermission, 
  requireRole, 
  requireSuperAdmin,
  getUserPermissions 
} = require('./middleware/rbac');

const app = express();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Database imports
const dataService = require('./database/services/DataService');
const User = require('./database/models/User');
const SimpleBooking = require('./database/models/SimpleBooking');
const Trip = require('./database/models/Trip');
const SiteContent = require('./database/models/SiteContent');
const Blog = require('./database/models/Blog');
const Banner = require('./database/models/Banner');

// Environment Configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-please-change';
const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-session-secret-please-change';
const SALT_ROUNDS = 10;

// OAuth Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

// Domain Configuration
const DOMAIN = process.env.DOMAIN || 'localhost:3000';
const PROTOCOL = process.env.PROTOCOL || 'http';
const BASE_URL = `${PROTOCOL}://${DOMAIN}`;

// Validate required environment variables in production
if (NODE_ENV === 'production') {
  const requiredEnvVars = [
    'JWT_SECRET',
    'SESSION_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'FACEBOOK_APP_ID',
    'FACEBOOK_APP_SECRET'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    console.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }
}

// Express session (required for Passport)
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  const usersData = readJsonFile('users.json');
  const user = usersData && usersData.users.find(u => u.id === id);
  done(null, user || null);
});

// Google OAuth Strategy (only configure if credentials are provided)
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: `${BASE_URL}/api/auth/google/callback`,
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    const usersData = readJsonFile('users.json');
    let user = usersData.users.find(u => u.email === profile.emails[0].value);
    if (!user) {
      // Register new user
      user = {
        id: usersData.lastUserId + 1,
        firstName: profile.name.givenName || '',
        lastName: profile.name.familyName || '',
        email: profile.emails[0].value,
        password: '',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        oauthProvider: 'google',
        oauthId: profile.id
      };
      usersData.users.push(user);
      usersData.lastUserId = user.id;
      writeJsonFile('users.json', usersData);
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
  }));
} else {
  console.warn('⚠️  Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not provided');
}

// Facebook OAuth Strategy (only configure if credentials are provided)
if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: `${BASE_URL}/api/auth/facebook/callback`,
    profileFields: ['id', 'emails', 'name']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails && profile.emails[0] && profile.emails[0].value;
    const usersData = readJsonFile('users.json');
    let user = usersData.users.find(u => u.email === email);
    if (!user) {
      // Register new user
      user = {
        id: usersData.lastUserId + 1,
        firstName: profile.name.givenName || '',
        lastName: profile.name.familyName || '',
        email: email || '',
        password: '',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        oauthProvider: 'facebook',
        oauthId: profile.id
      };
      usersData.users.push(user);
      usersData.lastUserId = user.id;
      writeJsonFile('users.json', usersData);
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
  }));
} else {
  console.warn('⚠️  Facebook OAuth not configured - FACEBOOK_APP_ID and FACEBOOK_APP_SECRET not provided');
}

// Google OAuth routes (only if Google OAuth is configured)
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  app.get('/api/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login.html?oauth=fail' }), (req, res) => {
  // Issue JWT and send user info as JSON
  const user = req.user;
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '2h' });
  // Optionally, generate a refresh token as well
  res.redirect(`/login.html?oauth=success&token=${token}`);
  });
}

// Facebook OAuth routes (only if Facebook OAuth is configured)
if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET) {
  app.get('/api/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
  app.get('/api/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login.html?oauth=fail' }), (req, res) => {
    // Issue JWT and send user info as JSON
    const user = req.user;
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '2h' });
    res.redirect(`/login.html?oauth=success&token=${token}`);
  });
}

// Middleware
app.use(cors());
app.use(express.json());
// POST /api/contact - Get in Touch form
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
    }
    const contact = new ContactMessage({ name, email, phone, message, type: 'contact' });
    await contact.save();
    res.json({ success: true, message: 'Your message has been received. We will contact you soon.' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit message.' });
  }
});

// POST /api/support - Help and Support form
app.post('/api/support', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, subject, and message are required.' });
    }
    const support = new ContactMessage({ name, email, phone, subject, message, type: 'support' });
    await support.save();
    res.json({ success: true, message: 'Your support request has been received. We will help you soon.' });
  } catch (error) {
    console.error('Support form error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit support request.' });
  }
});

// POST /api/booking/submit - Submit booking form (requires authentication)
app.post('/api/booking/submit', authenticateToken, async (req, res) => {
  try {
    const { tripTitle, tripId, travelers, selectedDate, contactInfo, specialRequests } = req.body;
    
    // Validate required fields
    if (!tripTitle || !travelers || !contactInfo || !contactInfo.name || !contactInfo.email || !contactInfo.phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Trip title, number of travelers, and contact information (name, email, phone) are required.' 
      });
    }

    // Validate travelers count
    if (travelers < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Number of travelers must be at least 1.' 
      });
    }

    // Create new booking
    const bookingData = {
      tripTitle,
      tripId: tripId || null,
      travelers: parseInt(travelers),
      selectedDate: selectedDate ? new Date(selectedDate) : null,
      contactInfo: {
        name: contactInfo.name.trim(),
        email: contactInfo.email.trim().toLowerCase(),
        phone: contactInfo.phone.trim()
      },
      specialRequests: specialRequests || '',
      status: 'pending_confirmation',
      userId: req.user._id, // Store ObjectId
      userEmail: req.user.email // Add user email from authenticated user
    };

    const booking = new SimpleBooking(bookingData);
    await booking.save();

    // Return success response with booking details
    res.json({
      success: true,
      message: 'Your booking request has been submitted successfully!',
      bookingId: booking.bookingId,
      tripTitle: booking.tripTitle,
      travelers: booking.travelers,
      contactInfo: booking.contactInfo,
      selectedDate: booking.selectedDate,
      status: booking.status,
      createdAt: booking.createdAt
    });

  } catch (error) {
    console.error('Booking submission error:', error);
    
    // Handle duplicate booking ID (very rare but possible)
    if (error.code === 11000 && error.keyPattern && error.keyPattern.bookingId) {
      return res.status(500).json({ 
        success: false, 
        message: 'Booking ID conflict. Please try again.' 
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: `Validation error: ${messages.join(', ')}` 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit booking. Please try again.' 
    });
  }
});

// GET /api/bookings - Get all bookings (for admin/testing)
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await SimpleBooking.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve bookings.' 
    });
  }
});

// GET /api/bookings/:bookingId - Get specific booking (requires auth and ownership)
app.get('/api/bookings/:bookingId', authenticateToken, async (req, res) => {
  try {
    const booking = await SimpleBooking.findOne({ 
      bookingId: req.params.bookingId,
      userId: req.user._id // Ensure user can only access their own bookings
    });
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found.' 
      });
    }
    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve booking.' 
    });
  }
});

// GET /api/user/bookings - Get user's bookings (requires auth)
app.get('/api/user/bookings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const bookings = await SimpleBooking.find({ 
      userId: userId 
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve your bookings.' 
    });
  }
});

app.use(express.static('.')); // Serve static files from current directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files

// Security Headers Middleware
app.use((req, res, next) => {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 'default-src self; script-srcself \'unsafe-inline\' https://cdn.jsdelivr.net; style-srcself \'unsafe-inline\' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src \'self\' https://fonts.gstatic.com; img-src self\' data: https:; connect-srcself\'');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Frame options to prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=());');
  res.removeHeader('X-Powered-By');
  
  next();
});

// Rate Limiting Middleware
const rateLimit = require('express-rate-limit');

// General rate limiter - Production optimized
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 1000 : 500, // Higher limits for production
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for static assets and health checks
    return req.url.startsWith('/images/') || 
           req.url.startsWith('/css/') || 
           req.url.startsWith('/js/') ||
           req.url === '/api/health';
  }
});

// Auth-specific rate limiter (more strict but reasonable)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 50 : 25, // More reasonable for production
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// API-specific rate limiter for high-traffic endpoints
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: NODE_ENV === 'production' ? 200 : 100, // Per minute limit for API calls
  message: { error: 'API rate limit exceeded, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use(generalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter); // Apply API-specific limits to all API routes

// Basic Memory Cache for Performance
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedData(key, data) {
  cache.set(key, {
    data: data,
    timestamp: Date.now()
  });
  
  // Clean up old cache entries periodically
  if (cache.size > 100) {
    const now = Date.now();
    for (const [k, v] of cache.entries()) {
      if (now - v.timestamp > CACHE_TTL) {
        cache.delete(k);
      }
    }
  }
}

// Helper function to read JSON files with caching
function readJsonFile(filename) {
  try {
    // Check cache first
    const cacheKey = `json_${filename}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const filePath = path.join(__dirname, 'data', filename);
    const data = fs.readFileSync(filePath, 'utf8');
    const parsedData = JSON.parse(data);
    
    // Cache the parsed data
    setCachedData(cacheKey, parsedData);
    
    return parsedData;
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return null;
  }
}

// Helper function to write JSON files
function writeJsonFile(filename, data) {
  try {
    const filePath = path.join(__dirname, 'data', filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
}

// Initialize users file if it doesn't exist
function initializeUsersFile() {
  const usersFilePath = path.join(__dirname, 'data', 'users.json');
  if (!fs.existsSync(usersFilePath)) {
    const initialData = {
      users: [],
      lastUserId: 0,
      refreshTokens: []
    };
    writeJsonFile('users.json', initialData);
  }
}

// Initialize users file
initializeUsersFile();

// Authentication middleware
// Old authentication middleware - replaced by RBAC
function oldAuthenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// API Routes

// Authentication Routes (JSON fallback removed; Mongo-backed auth is defined later)

// Update User Profile (Protected)
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, newPassword } = req.body;
    const usersData = readJsonFile('users.json');
    if (!usersData) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    const user = usersData.users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }
    // Check for email conflict
    const emailConflict = usersData.users.find(u => u.email === email && u.id !== user.id);
    if (emailConflict) {
      return res.status(409).json({ error: 'Email already in use by another account' });
    }
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.phone = phone || '';
    if (newPassword && newPassword.length >= 6) {
      user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    }
    writeJsonFile('users.json', usersData);
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout (Protected) - Invalidate refresh token
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) { // Remove refresh token from storage
      const usersData = readJsonFile('users.json');
      if (usersData && usersData.refreshTokens) {
        usersData.refreshTokens = usersData.refreshTokens.filter(t => t.token !== refreshToken);
        writeJsonFile('users.json', usersData);
      }
    }
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Get all hot locations
app.get('/api/hot-locations', (req, res) => {
  const data = readJsonFile('homepage-hot-locations.json');
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: 'Failed to load hot locations data' });
  }
});

// Get hot location by ID
app.get('/api/hot-locations/:id', (req, res) => {
  const data = readJsonFile('homepage-hot-locations.json');
  if (data) {
    const location = data.hotLocations.find(loc => loc.id === parseInt(req.params.id));
    if (location) {
      res.json(location);
    } else {
      res.status(404).json({ error: 'Hot location not found' });
    }
  } else {
    res.status(500).json({ error: 'Failed to load hot locations data' });
  }
});

// Get all upcoming trips
app.get('/api/upcoming-trips', (req, res) => {
  const data = readJsonFile('upcoming-trips.json');
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: 'Failed to load upcoming trips data' });
  }
});

// Get upcoming trip by ID
app.get('/api/upcoming-trips/:id', (req, res) => {
  const data = readJsonFile('upcoming-trips.json');
  if (data) {
    const trip = data.upcomingTrips.find(trip => trip.id === parseInt(req.params.id));
    if (trip) {
      res.json(trip);
    } else {
      res.status(404).json({ error: 'Upcoming trip not found' });
    }
  } else {
    res.status(500).json({ error: 'Failed to load upcoming trips data' });
  }
});

// Get all top destinations
app.get('/api/top-destinations', (req, res) => {
  const data = readJsonFile('homepage-top-destinations.json');
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: 'Failed to load top destinations data' });
  }
});

// Get top destinations by category
app.get('/api/top-destinations/category/:category', (req, res) => {
  const data = readJsonFile('homepage-top-destinations.json');
  if (data) {
    const filteredDestinations = data.topDestinations.filter(
      dest => dest.category === req.params.category
    );
    res.json({ topDestinations: filteredDestinations });
  } else {
    res.status(500).json({ error: 'Failed to load top destinations data' });
  }
});

// Get top destination by ID
app.get('/api/top-destinations/:id', (req, res) => {
  const data = readJsonFile('homepage-top-destinations.json');
  if (data) {
    const destination = data.topDestinations.find(dest => dest.id === parseInt(req.params.id));
    if (destination) {
      res.json(destination);
    } else {
      res.status(404).json({ error: 'Top destination not found' });
    }
  } else {
    res.status(500).json({ error: 'Failed to load top destinations data' });
  }
});

// Get all activities (for homepage)
app.get('/api/activities', (req, res) => {
  const data = readJsonFile('homepage-activities.json');
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: 'Failed to load activities data' });
  }
});

// Get all activities (for activities page)
app.get('/api/activities-page', (req, res) => {
  const data = readJsonFile('activities.json');
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: 'Failed to load activities page data' });
  }
});

// Get activities by category
app.get('/api/activities/category/:category', (req, res) => {
  const data = readJsonFile('homepage-activities.json');
  if (data) {
    const filteredActivities = data.activities.filter(
      activity => activity.category === req.params.category
    );
    res.json({ activities: filteredActivities });
  } else {
    res.status(500).json({ error: 'Failed to load activities data' });
  }
});

// Get activity by ID
app.get('/api/activities/:id', (req, res) => {
  const data = readJsonFile('homepage-activities.json');
  if (data) {
    const activity = data.activities.find(act => act.id === parseInt(req.params.id));
    if (activity) {
      res.json(activity);
    } else {
      res.status(404).json({ error: 'Activity not found' });
    }
  } else {
    res.status(500).json({ error: 'Failed to load activities data' });
  }
});

// Activity details endpoint for booking options
app.get('/api/activity-details/:activity', (req, res) => {
  const data = readJsonFile('activity-details.json');
  if (data) {
    const activityName = req.params.activity;
    const bookingOptions = data[activityName];
    if (bookingOptions) {
      res.json({ activity: activityName, bookingOptions });
    } else {
      res.status(404).json({ error: 'Activity details not found' });
    }
  } else {
    res.status(500).json({ error: 'Failed to load activity details data' });
  }
});

// Booking Packages API
app.get('/api/booking-packages', (req, res) => {
  const data = readJsonFile('booking-packages.json');
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: 'Failed to load booking packages data' });
  }
});

app.get('/api/booking-packages/:id', (req, res) => {
  const data = readJsonFile('booking-packages.json');
  if (data) {
    const package = data.find(pkg => pkg.id === parseInt(req.params.id));
    if (package) {
      res.json(package);
    } else {
      res.status(404).json({ error: 'Booking package not found' });
    }
  } else {
    res.status(500).json({ error: 'Failed to load booking packages data' });
  }
});

app.get('/api/booking-packages/category/:category', (req, res) => {
  const data = readJsonFile('booking-packages.json');
  if (data) {
    const filteredPackages = data.filter(pkg => pkg.category === req.params.category);
    res.json(filteredPackages);
  } else {
    res.status(500).json({ error: 'Failed to load booking packages data' });
  }
});

// City Packages API
app.get('/api/city-packages', (req, res) => {
  const data = readJsonFile('city-packages.json');
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: 'Failed to load city packages data' });
  }
});

app.get('/api/city-packages/:id', (req, res) => {
  const data = readJsonFile('city-packages.json');
  if (data) {
    const package = data.find(pkg => pkg.id === parseInt(req.params.id));
    if (package) {
      res.json(package);
    } else {
      res.status(404).json({ error: 'City package not found' });
    }
  } else {
    res.status(500).json({ error: 'Failed to load city packages data' });
  }
});

app.get('/api/city-packages/category/:category', (req, res) => {
  const data = readJsonFile('city-packages.json');
  if (data) {
    const filteredPackages = data.filter(pkg => pkg.category === req.params.category);
    res.json(filteredPackages);
  } else {
    res.status(500).json({ error: 'Failed to load city packages data' });
  }
});

// Get all spiritual tours
app.get('/api/spiritual-tours', (req, res) => {
  const data = readJsonFile('spiritual-tours.json');
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: 'Failed to load spiritual tours data' });
  }
});

// Get spiritual tours by category
app.get('/api/spiritual-tours/category/:category', (req, res) => {
  const data = readJsonFile('spiritual-tours.json');
  if (data) {
    const filteredTours = data.spiritualTours.filter(
      tour => tour.category === req.params.category
    );
    res.json({ spiritualTours: filteredTours });
  } else {
    res.status(500).json({ error: 'Failed to load spiritual tours data' });
  }
});

// Get spiritual tour by ID
app.get('/api/spiritual-tours/:id', (req, res) => {
  const data = readJsonFile('spiritual-tours.json');
  if (data) {
    const tour = data.spiritualTours.find(tour => tour.id === parseInt(req.params.id));
    if (tour) {
      res.json(tour);
    } else {
      res.status(404).json({ error: 'Spiritual tour not found' });
    }
  } else {
    res.status(500).json({ error: 'Failed to load spiritual tours data' });
  }
});

// Weekend Trips API
app.get('/api/weekend-trips', (req, res) => {
  const data = readJsonFile('weekend-trips.json');
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: 'Failed to load weekend trips data' });
  }
});

app.get('/api/weekend-trips/:id', (req, res) => {
  const data = readJsonFile('weekend-trips.json');
  if (data) {
    const trip = data.weekendTrips.find(trip => trip.id === parseInt(req.params.id));
    if (trip) {
      res.json(trip);
    } else {
      res.status(404).json({ error: 'Weekend trip not found' });
    }
  } else {
    res.status(500).json({ error: 'Failed to load weekend trips data' });
  }
});

app.get('/api/weekend-trips/destination/:destination', (req, res) => {
  const data = readJsonFile('weekend-trips.json');
  if (data) {
    const filteredTrips = data.weekendTrips.filter(
      trip => trip.destination === req.params.destination
    );
    res.json({ weekendTrips: filteredTrips });
  } else {
    res.status(500).json({ error: 'Failed to load weekend trips data' });
  }
});

// Domestic Trips API
app.get('/api/domestic-trips', (req, res) => {
  const data = readJsonFile('domestic-trips.json');
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: 'Failed to load domestic trips data' });
  }
});

app.get('/api/domestic-trips/:id', (req, res) => {
  const data = readJsonFile('domestic-trips.json');
  if (data) {
    const trip = data.domesticTrips.find(trip => trip.id === parseInt(req.params.id));
    if (trip) {
      res.json(trip);
    } else {
      res.status(404).json({ error: 'Domestic trip not found' });
    }
  } else {
    res.status(500).json({ error: 'Failed to load domestic trips data' });
  }
});

app.get('/api/domestic-trips/destination/:destination', (req, res) => {
  const data = readJsonFile('domestic-trips.json');
  if (data) {
    const filteredTrips = data.domesticTrips.filter(
      trip => trip.destination === req.params.destination
    );
    res.json({ domesticTrips: filteredTrips });
  } else {
    res.status(500).json({ error: 'Failed to load domestic trips data' });
  }
});

// Family Trips API
app.get('/api/family-trips', (req, res) => {
  const data = readJsonFile('family-trips.json');
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: 'Failed to load family trips data' });
  }
});

app.get('/api/family-trips/:id', (req, res) => {
  const data = readJsonFile('family-trips.json');
  if (data) {
    const trip = data.familyTrips.find(trip => trip.id === parseInt(req.params.id));
    if (trip) {
      res.json(trip);
    } else {
      res.status(404).json({ error: 'Family trip not found' });
    }
  } else {
    res.status(500).json({ error: 'Failed to load family trips data' });
  }
});

app.get('/api/family-trips/destination/:destination', (req, res) => {
  const data = readJsonFile('family-trips.json');
  if (data) {
    const filteredTrips = data.familyTrips.filter(
      trip => trip.destination === req.params.destination
    );
    res.json({ familyTrips: filteredTrips });
  } else {
    res.status(500).json({ error: 'Failed to load family trips data' });
  }
});

// Romantic Trips API
app.get('/api/romantic-trips', (req, res) => {
  const data = readJsonFile('romantic-trips.json');
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: 'Failed to load romantic trips data' });
  }
});

app.get('/api/romantic-trips/:id', (req, res) => {
  const data = readJsonFile('romantic-trips.json');
  if (data) {
    const trip = data.romanticTrips.find(trip => trip.id === parseInt(req.params.id));
    if (trip) {
      res.json(trip);
    } else {
      res.status(404).json({ error: 'Romantic trip not found' });
    }
  } else {
    res.status(500).json({ error: 'Failed to load romantic trips data' });
  }
});

app.get('/api/romantic-trips/destination/:destination', (req, res) => {
  const data = readJsonFile('romantic-trips.json');
  if (data) {
    const filteredTrips = data.romanticTrips.filter(
      trip => trip.destination === req.params.destination
    );
    res.json({ romanticTrips: filteredTrips });
  } else {
    res.status(500).json({ error: 'Failed to load romantic trips data' });
  }
});

// Corporate Trips API
app.get('/api/corporate-trips', async (req, res) => {
  try {
    // Get corporate trips from MongoDB
    const corporateTrips = await Trip.find({ category: 'corporate-trip' }).sort({ id: 1 });
    
    // Get corporate page content from MongoDB
    const corporatePageContent = await SiteContent.findOne({ type: 'corporate-page' });
    
    if (corporateTrips.length > 0 && corporatePageContent) {
      // Structure the response to match the original JSON format
      const response = {
        corporateTrips: {
          hero: corporatePageContent.content.hero,
          partners: corporatePageContent.content.partners,
          features: corporatePageContent.content.features,
          destinations: corporateTrips.map(trip => ({
            id: trip.id - 1000, // Convert back to original ID range
            title: trip.title,
            duration: trip.duration,
            image: trip.image,
            price: trip.price,
            oldPrice: trip.oldPrice,
            currency: trip.currency,
            destination: trip.destination,
            groupSize: trip.additionalInfo?.groupSize || 'Corporate teams',
            description: trip.description,
            difficulty: trip.difficulty,
            maxAltitude: trip.additionalInfo?.maxAltitude || 'N/A',
            bestTime: trip.additionalInfo?.bestTime || 'Year round',
            highlights: trip.highlights,
            included: trip.included,
            excluded: trip.excluded,
            itinerary: trip.itinerary.map(item => ({
              day: item.day,
              title: item.title,
              activities: item.activities || [item.description]
            }))
          }))
        }
      };
      res.json(response);
    } else {
      // Fallback to JSON file
      console.log('📄 Corporate trips: Using JSON fallback');
      const data = readJsonFile('corporate-trips.json');
      if (data) {
        res.json(data);
      } else {
        res.status(500).json({ error: 'Failed to load corporate trips data' });
      }
    }
  } catch (error) {
    console.error('Corporate trips API error:', error);
    // Fallback to JSON file on error
    const data = readJsonFile('corporate-trips.json');
    if (data) {
      res.json(data);
    } else {
      res.status(500).json({ error: 'Failed to load corporate trips data' });
    }
  }
});

app.get('/api/corporate-trips/hero', (req, res) => {
  const data = readJsonFile('corporate-trips.json');
  if (data) {
    res.json(data.corporateTrips.hero);
  } else {
    res.status(500).json({ error: 'Failed to load corporate trips data' });
  }
});

app.get('/api/corporate-trips/partners', (req, res) => {
  const data = readJsonFile('corporate-trips.json');
  if (data) {
    res.json({ partners: data.corporateTrips.partners });
  } else {
    res.status(500).json({ error: 'Failed to load corporate trips data' });
  }
});

app.get('/api/corporate-trips/features', (req, res) => {
  const data = readJsonFile('corporate-trips.json');
  if (data) {
    res.json({ features: data.corporateTrips.features });
  } else {
    res.status(500).json({ error: 'Failed to load corporate trips data' });
  }
});

app.get('/api/corporate-trips/destinations', (req, res) => {
  const data = readJsonFile('corporate-trips.json');
  if (data) {
    res.json({ destinations: data.corporateTrips.destinations });
  } else {
    res.status(500).json({ error: 'Failed to load corporate trips data' });
  }
});

// International Trips API
app.get('/api/international-trips', (req, res) => {
  const data = readJsonFile('international-trips.json');
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: 'Failed to load international trips data' });
  }
});

app.get('/api/international-trips/:id', (req, res) => {
  const data = readJsonFile('international-trips.json');
  if (data) {
    const trip = data.internationalTrips.find(trip => trip.id === req.params.id);
    if (trip) {
      res.json(trip);
    } else {
      res.status(404).json({ error: 'International trip not found' });
    }
  } else {
    res.status(500).json({ error: 'Failed to load international trips data' });
  }
});

app.get('/api/international-trips/destination/:destination', (req, res) => {
  const data = readJsonFile('international-trips.json');
  if (data) {
    const destination = req.params.destination.toLowerCase();
    const filteredTrips = data.internationalTrips.filter(trip => 
      trip.category === destination || trip.destination.toLowerCase() === destination
    );
    res.json({ internationalTrips: filteredTrips });
  } else {
    res.status(500).json({ error: 'Failed to load international trips data' });
  }
});

// Activities API
app.get('/api/activities', (req, res) => {
  const data = readJsonFile('homepage-activities.json');
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: 'Failed to load activities data' });
  }
});

app.get('/api/activities-page', (req, res) => {
  const data = readJsonFile('activities.json');
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: 'Failed to load activities page data' });
  }
});

app.get('/api/activity-details/:activity', (req, res) => {
  const activityName = req.params.activity;
  const data = readJsonFile('activity-details.json');
  if (data) {
    const activityDetails = data[activityName];
    if (activityDetails) {
      res.json({ bookingOptions: activityDetails });
    } else {
      res.status(404).json({ error: 'Activity not found' });
    }
  } else {
    res.status(500).json({ error: 'Failed to load activity details data' });
  }
});

// About Us API
app.get('/api/about-us', (req, res) => {
  const data = readJsonFile('about-us.json');
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: 'Failed to load about us data' });
  }
});

// Get specific about us section
app.get('/api/about-us/:section', (req, res) => {
  const data = readJsonFile('about-us.json');
  if (data) {
    const section = data.aboutUs[req.params.section];
    if (section) {
      res.json(section);
    } else {
      res.status(404).json({ error: 'About us section not found' });
    }
  } else {
    res.status(500).json({ error: 'Failed to load about us data' });
  }
});

// Blog API - With caching for performance
app.get('/api/blogs', async (req, res) => {
  try {
    // Check cache first
    const cacheKey = 'public_blogs';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const blogs = await Blog.find({ isPublished: true })
      .select('title excerpt featuredImage category tags publishedAt readTime author viewCount')
      .sort({ publishedAt: -1 });
    
    // Transform to match frontend expectations
    const blogsData = {
      blogs: blogs.map(blog => ({
        id: blog._id,
        title: blog.title,
        date: blog.publishedAt.toLocaleDateString('en-GB') + ', ' + blog.publishedAt.toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: true 
        }),
        image: blog.featuredImage,
        summary: blog.excerpt,
        category: blog.category,
        tags: blog.tags,
        author: blog.author?.name || 'Traowl Team'
      }))
    };
    
    // Cache the result
    setCachedData(cacheKey, blogsData);
    
    res.json(blogsData);
  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({ error: 'Failed to load blogs data' });
  }
});

// Get all blogs for admin (includes drafts and unpublished)
app.get('/api/admin/blogs', authenticateToken, requirePermission('blogs.view'), async (req, res) => {
  try {
    const blogs = await Blog.find({})
      .select('title excerpt featuredImage category tags publishedAt createdAt updatedAt readTime author viewCount isPublished status')
      .sort({ updatedAt: -1 });
    
    // Transform to match admin expectations
    const blogsData = {
      blogs: blogs.map(blog => ({
        id: blog._id,
        title: blog.title,
        excerpt: blog.excerpt,
        image: blog.featuredImage,
        category: blog.category,
        tags: blog.tags || [],
        author: blog.author?.name || 'Traowl Team',
        status: blog.isPublished ? 'Published' : 'Draft',
        publishedAt: blog.publishedAt,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
        viewCount: blog.viewCount || 0,
        readTime: blog.readTime || '5 min read'
      }))
    };
    
    res.json(blogsData);
  } catch (error) {
    console.error('Get admin blogs error:', error);
    res.status(500).json({ error: 'Failed to load blogs data' });
  }
});

// Get blog by ID
app.get('/api/blogs/:id', async (req, res) => {
  try {
    const blogId = req.params.id;
    const blog = await Blog.findById(blogId);
    
    if (!blog || !blog.isPublished) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Increment view count
    await Blog.findByIdAndUpdate(blogId, { $inc: { viewCount: 1 } });
    
    // Transform to match frontend expectations
    const blogData = {
      id: blog._id,
      title: blog.title,
      date: blog.publishedAt.toLocaleDateString('en-GB') + ', ' + blog.publishedAt.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      }),
      image: blog.featuredImage,
      summary: blog.excerpt,
      detail: blog.content,
      category: blog.category,
      tags: blog.tags,
      author: blog.author?.name || 'Traowl Team',
      readTime: blog.readTime,
      viewCount: blog.viewCount + 1
    };
    
    res.json(blogData);
  } catch (error) {
    console.error('Get blog by ID error:', error);
    res.status(500).json({ error: 'Failed to load blog data' });
  }
});

// Get blogs by category
app.get('/api/blogs/category/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const blogs = await Blog.find({ category, isPublished: true })
      .select('title excerpt featuredImage category tags publishedAt readTime author viewCount')
      .sort({ publishedAt: -1 });
    
    // Transform to match frontend expectations
    const blogsData = {
      blogs: blogs.map(blog => ({
        id: blog._id,
        title: blog.title,
        date: blog.publishedAt.toLocaleDateString('en-GB') + ', ' + blog.publishedAt.toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: true 
        }),
        image: blog.featuredImage,
        summary: blog.excerpt,
        category: blog.category,
        tags: blog.tags,
        author: blog.author?.name || 'Traowl Team'
      }))
    };
    
    res.json(blogsData);
  } catch (error) {
    console.error('Get blogs by category error:', error);
    res.status(500).json({ error: 'Failed to load blogs data' });
  }
});

// Get blogs by tag
app.get('/api/blogs/tag/:tag', async (req, res) => {
  try {
    const tag = req.params.tag;
    const blogs = await Blog.find({ tags: tag, isPublished: true })
      .select('title excerpt featuredImage category tags publishedAt readTime author viewCount')
      .sort({ publishedAt: -1 });
    
    // Transform to match frontend expectations
    const blogsData = {
      blogs: blogs.map(blog => ({
        id: blog._id,
        title: blog.title,
        date: blog.publishedAt.toLocaleDateString('en-GB') + ', ' + blog.publishedAt.toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: true 
        }),
        image: blog.featuredImage,
        summary: blog.excerpt,
        category: blog.category,
        tags: blog.tags,
        author: blog.author?.name || 'Traowl Team'
      }))
    };
    
    res.json(blogsData);
  } catch (error) {
    console.error('Get blogs by tag error:', error);
    res.status(500).json({ error: 'Failed to load blogs data' });
  }
});

// Get blog details (if exists) - this endpoint can now redirect to /api/blogs/:id
app.get('/api/blog-details/:id', async (req, res) => {
  try {
    const blogId = req.params.id;
    const blog = await Blog.findById(blogId);
    
    if (!blog || !blog.isPublished) {
      return res.status(404).json({ error: 'Blog details not found' });
    }
    
    // Return detailed blog data
    const blogData = {
      id: blog._id,
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt,
      image: blog.featuredImage,
      category: blog.category,
      tags: blog.tags,
      author: blog.author?.name || 'Traowl Team',
      publishedAt: blog.publishedAt,
      readTime: blog.readTime,
      viewCount: blog.viewCount
    };
    
    res.json(blogData);
  } catch (error) {
    console.error('Get blog details error:', error);
    res.status(500).json({ error: 'Failed to load blog details data' });
  }
});

// Search endpoint
app.get('/api/search', async (req, res) => {
  const { q, type } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const searchTerm = q.toLowerCase();
  const results = [];

  // Search in hot locations
  if (!type || type === 'hot-locations') {
    const hotLocations = readJsonFile('homepage-hot-locations.json');
    if (hotLocations) {
      const matches = hotLocations.hotLocations.filter(location =>
        location.title.toLowerCase().includes(searchTerm) ||
        location.description.toLowerCase().includes(searchTerm) ||
        location.location.toLowerCase().includes(searchTerm)
      );
      results.push(...matches.map(item => ({ ...item, type: 'hot-location' })));
    }
  }

  // Search in upcoming trips
  if (!type || type === 'upcoming-trips') {
    const upcomingTrips = readJsonFile('homepage-upcoming-trips.json');
    if (upcomingTrips) {
      const matches = upcomingTrips.upcomingTrips.filter(trip =>
        trip.title.toLowerCase().includes(searchTerm) ||
        trip.description.toLowerCase().includes(searchTerm) ||
        trip.location.toLowerCase().includes(searchTerm)
      );
      results.push(...matches.map(item => ({ ...item, type: 'upcoming-trip' })));
    }
  }

  // Search in top destinations
  if (!type || type === 'top-destinations') {
    const topDestinations = readJsonFile('homepage-top-destinations.json');
    if (topDestinations) {
      const matches = topDestinations.topDestinations.filter(destination =>
        destination.title.toLowerCase().includes(searchTerm) ||
        destination.description.toLowerCase().includes(searchTerm)
      );
      results.push(...matches.map(item => ({ ...item, type: 'top-destination' })));
    }
  }

  // Search in activities
  if (!type || type === 'activities') {
    const activities = readJsonFile('homepage-activities.json');
    if (activities) {
      const matches = activities.activities.filter(activity =>
        activity.name.toLowerCase().includes(searchTerm) ||
        activity.description.toLowerCase().includes(searchTerm)
      );
      results.push(...matches.map(item => ({ ...item, type: 'activity' })));
    }
  }

  // Search in spiritual tours
  if (!type || type === 'spiritual-tours') {
    const spiritualTours = readJsonFile('spiritual-tours.json');
    if (spiritualTours) {
      const matches = spiritualTours.spiritualTours.filter(tour =>
        tour.title.toLowerCase().includes(searchTerm) ||
        tour.description.toLowerCase().includes(searchTerm) ||
        tour.location.toLowerCase().includes(searchTerm)
      );
      results.push(...matches.map(item => ({ ...item, type: 'spiritual-tour' })));
    }
  }

  // Search in weekend trips
  if (!type || type === 'weekend-trips') {
    const weekendTrips = readJsonFile('weekend-trips.json');
    if (weekendTrips) {
      const matches = weekendTrips.weekendTrips.filter(trip =>
        trip.title.toLowerCase().includes(searchTerm) ||
        trip.description.toLowerCase().includes(searchTerm) ||
        trip.destination.toLowerCase().includes(searchTerm)
      );
      results.push(...matches.map(item => ({ ...item, type: 'weekend-trip' })));
    }
  }

  // Search in domestic trips
  if (!type || type === 'domestic-trips') {
    const domesticTrips = readJsonFile('domestic-trips.json');
    if (domesticTrips) {
      const matches = domesticTrips.domesticTrips.filter(trip =>
        trip.title.toLowerCase().includes(searchTerm) ||
        trip.description.toLowerCase().includes(searchTerm) ||
        trip.destination.toLowerCase().includes(searchTerm)
      );
      results.push(...matches.map(item => ({ ...item, type: 'domestic-trip' })));
    }
  }

  // Search in family trips
  if (!type || type === 'family-trips') {
    const familyTrips = readJsonFile('family-trips.json');
    if (familyTrips) {
      const matches = familyTrips.familyTrips.filter(trip =>
        trip.title.toLowerCase().includes(searchTerm) ||
        trip.description.toLowerCase().includes(searchTerm) ||
        trip.destination.toLowerCase().includes(searchTerm)
      );
      results.push(...matches.map(item => ({ ...item, type: 'family-trip' })));
    }
  }

  // Search in romantic trips
  if (!type || type === 'romantic-trips') {
    const romanticTrips = readJsonFile('romantic-trips.json');
    if (romanticTrips) {
      const matches = romanticTrips.romanticTrips.filter(trip =>
        trip.title.toLowerCase().includes(searchTerm) ||
        trip.description.toLowerCase().includes(searchTerm) ||
        trip.destination.toLowerCase().includes(searchTerm)
      );
      results.push(...matches.map(item => ({ ...item, type: 'romantic-trip' })));
    }
  }

  // Search in corporate trips
  if (!type || type === 'corporate-trips') {
    const corporateTrips = readJsonFile('corporate-trips.json');
    if (corporateTrips) {
      const matches = corporateTrips.corporateTrips.destinations.filter(destination =>
        destination.title.toLowerCase().includes(searchTerm) ||
        destination.description.toLowerCase().includes(searchTerm)
      );
      results.push(...matches.map(item => ({ ...item, type: 'corporate-trip' })));
    }
  }

  // Search in blogs
  if (!type || type === 'blogs') {
    try {
      const blogs = await Blog.find({
        isPublished: true,
        $text: { $search: searchTerm }
      }).select('title excerpt featuredImage category tags publishedAt readTime author');
      
      const blogResults = blogs.map(blog => ({
        id: blog._id,
        title: blog.title,
        summary: blog.excerpt,
        image: blog.featuredImage,
        category: blog.category,
        tags: blog.tags,
        type: 'blog'
      }));
      
      results.push(...blogResults);
    } catch (error) {
      console.error('Blog search error:', error);
      // Fallback to simple search if text search fails
      try {
        const blogs = await Blog.find({
          isPublished: true,
          $or: [
            { title: new RegExp(searchTerm, 'i') },
            { excerpt: new RegExp(searchTerm, 'i') },
            { content: new RegExp(searchTerm, 'i') },
            { tags: { $in: [new RegExp(searchTerm, 'i')] } }
          ]
        }).select('title excerpt featuredImage category tags publishedAt readTime author');
        
        const blogResults = blogs.map(blog => ({
          id: blog._id,
          title: blog.title,
          summary: blog.excerpt,
          image: blog.featuredImage,
          category: blog.category,
          tags: blog.tags,
          type: 'blog'
        }));
        
        results.push(...blogResults);
      } catch (fallbackError) {
        console.error('Blog fallback search error:', fallbackError);
      }
    }
  }

  // Search in booking packages
  if (!type || type === 'booking-packages') {
    const bookingPackages = readJsonFile('booking-packages.json');
    if (bookingPackages) {
      const matches = bookingPackages.filter(pkg =>
        pkg.title.toLowerCase().includes(searchTerm) ||
        pkg.description.toLowerCase().includes(searchTerm) ||
        pkg.category.toLowerCase().includes(searchTerm) ||
        pkg.pickupLocation.toLowerCase().includes(searchTerm)
      );
      results.push(...matches.map(item => ({ ...item, type: 'booking-package' })));
    }
  }

  // Search in city packages
  if (!type || type === 'city-packages') {
    const cityPackages = readJsonFile('city-packages.json');
    if (cityPackages) {
      const matches = cityPackages.filter(pkg =>
        pkg.title.toLowerCase().includes(searchTerm) ||
        pkg.description.toLowerCase().includes(searchTerm) ||
        pkg.category.toLowerCase().includes(searchTerm) ||
        pkg.pickupLocation.toLowerCase().includes(searchTerm)
      );
      results.push(...matches.map(item => ({ ...item, type: 'city-package' })));
    }
  }

  // Search in activities
  if (!type || type === 'activities') {
    const activities = readJsonFile('activities.json');
    if (activities) {
      const matches = activities.activities.filter(activity =>
        activity.name.toLowerCase().includes(searchTerm) ||
        activity.description.toLowerCase().includes(searchTerm) ||
        activity.category.toLowerCase().includes(searchTerm)
      );
      results.push(...matches.map(item => ({ ...item, type: 'activity' })));
    }
  }

  // Search in about us
  if (!type || type === 'about-us') {
    const aboutUs = readJsonFile('about-us.json');
    if (aboutUs) {
      const aboutUsData = aboutUs.aboutUs;
      // Search in different sections
      const searchableContent = [
        { section: 'hero', content: `${aboutUsData.heroSection.title} ${aboutUsData.heroSection.subtitle} ${aboutUsData.heroSection.description}` },
        { section: 'mission', content: `${aboutUsData.mission.title} ${aboutUsData.mission.description}` },
        { section: 'vision', content: `${aboutUsData.vision.title} ${aboutUsData.vision.description}` },
        { section: 'story', content: `${aboutUsData.story.title} ${aboutUsData.story.description}` },
        { section: 'values', content: aboutUsData.values.map(v => `${v.title} ${v.description}`).join(' ') },
        { section: 'team', content: aboutUsData.team.map(t => `${t.name} ${t.position} ${t.description}`).join(' ') }
      ];
      
      searchableContent.forEach(item => {
        if (item.content.toLowerCase().includes(searchTerm)) {
          results.push({ section: item.section, content: item.content, type: 'about-us' });
        }
      });
    }
  }

  res.json({ results, total: results.length });
});

// Header endpoint
app.get('/api/header', async (req, res) => {
  try {
    const headerContent = await SiteContent.findOne({ type: 'header', isActive: true });
    if (headerContent) {
      res.json(headerContent.content);
    } else {
      // Return default header if none exists
      res.json({
        logo: 'Traowl',
        navigation: [],
        contactInfo: {}
      });
    }
  } catch (error) {
    console.error('Header endpoint error:', error);
    res.status(500).json({ error: 'Failed to load header data' });
  }
});

// Footer endpoint
app.get('/api/footer', async (req, res) => {
  try {
    const footerContent = await SiteContent.findOne({ type: 'footer', isActive: true });
    if (footerContent) {
      res.json(footerContent.content);
    } else {
      // Return default footer if none exists
      res.json({
        companyInfo: 'Traowl - Your Travel Partner',
        links: [],
        socialMedia: []
      });
    }
  } catch (error) {
    console.error('Footer endpoint error:', error);
    res.status(500).json({ error: 'Failed to load footer data' });
  }
});

// Booking endpoints
app.post('/api/booking/submit', async (req, res) => {
  try {
    const bookingData = req.body;
    
    // Validate required fields
    const requiredFields = ['tripTitle', 'travelers', 'contactInfo'];
    const missingFields = requiredFields.filter(field => !bookingData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields
      });
    }

    // Generate booking ID
    const now = new Date();
    const bookingId = `TRW${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    // Create booking object
    const booking = {
      bookingId,
      tripTitle: bookingData.tripTitle,
      tripId: bookingData.tripId || null,
      travelers: parseInt(bookingData.travelers),
      selectedDate: bookingData.selectedDate || null,
      contactInfo: {
        name: bookingData.contactInfo.name,
        email: bookingData.contactInfo.email,
        phone: bookingData.contactInfo.phone
      },
      specialRequests: bookingData.specialRequests || '',
      status: 'pending_confirmation',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    // Try to save to database first, fallback to JSON
    console.log('🔄 Attempting to save booking to database...');
    console.log('Database connected:', dataService.useDatabase);
    
    try {
      const savedBooking = await dataService.saveData('bookings', booking);
      console.log('✅ Booking saved to MongoDB Atlas:', savedBooking._id || 'success');
    } catch (dbError) {
      console.warn('❌ Database save failed, using JSON fallback:', dbError.message);
      console.error('Error details:', dbError);
      
      // Fallback: Save to JSON file
      const bookingsData = readJsonFile('bookings.json') || { bookings: [], lastBookingId: 0 };
      bookingsData.bookings.push(booking);
      writeJsonFile('bookings.json', bookingsData);
      console.log('💾 Booking saved to JSON fallback');
    }

    // Send confirmation response
    res.json({
      success: true,
      message: 'Booking submitted successfully! We will connect with you within 24 hours.',
      bookingId,
      booking: {
        bookingId,
        tripTitle: booking.tripTitle,
        travelers: booking.travelers,
        status: booking.status,
        createdAt: booking.createdAt
      }
    });

  } catch (error) {
    console.error('Booking submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit booking. Please try again.',
      error: error.message
    });
  }
});

// Get booking by ID
app.get('/api/booking/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Try database first, then JSON fallback
    let booking = null;
    
    try {
      const bookings = await dataService.getData('bookings', { 
        filter: { bookingId } 
      });
      booking = bookings.length > 0 ? bookings[0] : null;
    } catch (dbError) {
      console.warn('Database read failed, using JSON fallback:', dbError.message);
      
      const bookingsData = readJsonFile('bookings.json') || { bookings: [] };
      booking = bookingsData.bookings.find(b => b.bookingId === bookingId);
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      booking
    });

  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve booking',
      error: error.message
    });
  }
});

// Test MongoDB Atlas endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const SimpleBooking = require('./database/models/SimpleBooking');
    const User = require('./database/models/User');
    
    // Get all bookings from MongoDB
    const mongoBookings = await SimpleBooking.find({}).limit(10);
    
    // Get all users from MongoDB
    const mongoUsers = await User.find({}).select('-password').limit(10);
    
    // Get bookings from JSON fallback
    const jsonBookings = await dataService.getJsonData('bookings');
    
    // Get users from JSON fallback
    const jsonUsers = await dataService.getJsonData('users');
    
    res.json({
      success: true,
      mongodb: {
        connected: dataService.useDatabase,
        bookings: mongoBookings,
        bookingsCount: mongoBookings.length,
        users: mongoUsers,
        usersCount: mongoUsers.length
      },
      json: {
        bookings: jsonBookings,
        bookingsCount: jsonBookings.length,
        users: jsonUsers,
        usersCount: jsonUsers.length
      }
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// ========== AUTHENTICATION ENDPOINTS ==========

// User Registration (MongoDB + bcrypt + JWT)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const UserModel = require('./database/models/User');
    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const bcrypt = require('bcrypt');
    const hashed = await bcrypt.hash(password, 10);

    const user = await UserModel.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashed,
      isActive: true,
      role: 'user',
      profile: { phone: phone || '' }
    });

    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});



// Working User Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Import User model locally to avoid scope issues
    const UserModel = require('./database/models/User');
    
    // Find user in MongoDB
    const user = await UserModel.findOne({ email: email.toLowerCase(), isActive: true });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check password with bcrypt
    const bcrypt = require('bcrypt');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Create JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        userId: user._id.toString(), 
        email: user.email, 
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return success response
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      },
      token: token,
      canAccessAdmin: true
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// Auth verification endpoint
app.get('/api/auth/verify', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const permissions = getUserPermissions(user);
    
    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        permissions: permissions,
        canAccessAdmin: user.canAccessAdmin()
      }
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during verification' 
    });
  }
});

// Get User Profile (Protected)
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
});

// ========== END AUTHENTICATION ENDPOINTS ==========

// ========== DATA MIGRATION ENDPOINTS ==========

// Migrate all JSON data to MongoDB Atlas
app.post('/api/migrate/all', async (req, res) => {
  try {
    console.log('🚀 Starting complete migration to MongoDB Atlas...');
    
    const User = require('./database/models/User');
    const Trip = require('./database/models/Trip');
    const SimpleBooking = require('./database/models/SimpleBooking');
    
    const migrationResults = {
      users: { migrated: 0, errors: 0 },
      trips: { migrated: 0, errors: 0 },
      totalProcessed: 0
    };

    // ========== MIGRATE USERS ==========
    console.log('👥 Migrating users...');
    try {
      const jsonUsers = await dataService.getJsonData('users');
      console.log(`Found ${jsonUsers.length} users in JSON`);
      
      for (const userData of jsonUsers) {
        try {
          // Check if user already exists in MongoDB
          const existingUser = await User.findOne({ email: userData.email });
          if (existingUser) {
            console.log(`⚠️  User ${userData.email} already exists in MongoDB, skipping...`);
            continue;
          }

          // Create new user in MongoDB (with correct model structure)
          const mongoUser = new User({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email,
            password: userData.password, // Already hashed
            isActive: userData.isActive !== undefined ? userData.isActive : true,
            role: userData.role || 'user', // Correct enum value
            lastLogin: userData.lastLogin ? new Date(userData.lastLogin) : null,
            profile: {
              phone: userData.phone || ''
            }
          });
          
          // Set createdAt if it exists
          if (userData.createdAt) {
            mongoUser.createdAt = new Date(userData.createdAt);
          }

          await mongoUser.save();
          migrationResults.users.migrated++;
          console.log(`✅ Migrated user: ${userData.email}`);
          
        } catch (userError) {
          console.error(`❌ Error migrating user ${userData.email}:`, {
            message: userError.message,
            userData: userData,
            validationErrors: userError.errors
          });
          migrationResults.users.errors++;
        }
      }
    } catch (error) {
      console.error('❌ Error reading users JSON:', error);
    }

    // ========== MIGRATE TRIP DATA ==========
    console.log('🗺️  Migrating trip data...');
    
    const tripFiles = [
      { file: 'homepage-hot-locations', category: 'hot-location', key: 'hotLocations' },
      { file: 'homepage-upcoming-trips', category: 'upcoming-trip', key: 'upcomingTrips' },
      { file: 'homepage-weekend-trips', category: 'weekend-trip', key: 'weekendTrips' },
      { file: 'domestic-trips', category: 'domestic-trip', key: 'domesticTrips' },
      { file: 'international-trips', category: 'international-trip', key: 'internationalTrips' },
      { file: 'family-trips', category: 'family-trip', key: 'familyTrips' },
      { file: 'romantic-trips', category: 'romantic-trip', key: 'romanticTrips' },
      { file: 'corporate-trips', category: 'corporate-trip', key: 'corporateTrips' },
      { file: 'spiritual-tours', category: 'spiritual-tour', key: 'spiritualTours' }
    ];

    for (const tripConfig of tripFiles) {
      try {
        console.log(`📂 Processing ${tripConfig.file}...`);
        const jsonData = await dataService.getJsonData(tripConfig.file);
        const tripsArray = jsonData[tripConfig.key] || jsonData;
        
        if (!Array.isArray(tripsArray)) {
          console.log(`⚠️  No valid array found in ${tripConfig.file}`);
          continue;
        }

        console.log(`Found ${tripsArray.length} trips in ${tripConfig.file}`);
        
        for (const tripData of tripsArray) {
          try {
            // Check if trip already exists
            const existingTrip = await Trip.findOne({ 
              title: tripData.title,
              category: tripConfig.category 
            });
            
            if (existingTrip) {
              console.log(`⚠️  Trip "${tripData.title}" already exists, skipping...`);
              continue;
            }

            // Create new trip in MongoDB (with required field validation)
            const mongoTrip = new Trip({
              title: tripData.title || 'Untitled Trip',
              description: tripData.description || tripData.shortDescription || 'No description available',
              destination: tripData.destination || '',
              duration: tripData.duration || '',
              price: tripData.price || 0,
              oldPrice: tripData.oldPrice || null,
              currency: tripData.currency || '₹',
              image: tripData.image || 'images/default-trip.webp',
              images: tripData.images || [tripData.image].filter(Boolean),
              category: tripConfig.category,
              difficulty: tripData.difficulty || 'Moderate',
              maxAltitude: tripData.maxAltitude || '',
              suitableFor: tripData.suitableFor || 'All',
              highlights: tripData.highlights || [],
              inclusions: tripData.inclusions || [],
              exclusions: tripData.exclusions || [],
              joinDates: tripData.joinDates || [],
              isActive: true,
              featured: tripData.featured || false
            });

            await mongoTrip.save();
            migrationResults.trips.migrated++;
            console.log(`✅ Migrated trip: ${tripData.title}`);
            
          } catch (tripError) {
            console.error(`❌ Error migrating trip ${tripData.title}:`, tripError.message);
            migrationResults.trips.errors++;
          }
        }
      } catch (fileError) {
        console.error(`❌ Error processing ${tripConfig.file}:`, fileError.message);
      }
    }

    migrationResults.totalProcessed = migrationResults.users.migrated + migrationResults.trips.migrated;
    
    console.log('🎊 Migration completed!');
    console.log('📊 Results:', migrationResults);

    res.json({
      success: true,
      message: 'Migration completed successfully',
      results: migrationResults
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});

// Check migration status
app.get('/api/migrate/status', async (req, res) => {
  try {
    const User = require('./database/models/User');
    const Trip = require('./database/models/Trip');
    const SimpleBooking = require('./database/models/SimpleBooking');
    
    // Count records in MongoDB
    const mongoUsers = await User.countDocuments();
    const mongoTrips = await Trip.countDocuments();
    const mongoBookings = await SimpleBooking.countDocuments();
    
    // Count records in JSON
    const jsonUsers = await dataService.getJsonData('users');
    const jsonBookings = await dataService.getJsonData('bookings');
    
    // Count JSON trip records
    let jsonTripsTotal = 0;
    const tripFiles = [
      'homepage-hot-locations', 'homepage-upcoming-trips', 'homepage-weekend-trips',
      'domestic-trips', 'international-trips', 'family-trips', 
      'romantic-trips', 'corporate-trips', 'spiritual-tours'
    ];
    
    for (const file of tripFiles) {
      try {
        const data = await dataService.getJsonData(file);
        const tripsArray = Object.values(data)[0] || data;
        if (Array.isArray(tripsArray)) {
          jsonTripsTotal += tripsArray.length;
        }
      } catch (error) {
        // File might not exist, continue
      }
    }

    res.json({
      success: true,
      migration_status: {
        mongodb: {
          users: mongoUsers,
          trips: mongoTrips,
          bookings: mongoBookings,
          total: mongoUsers + mongoTrips + mongoBookings
        },
        json: {
          users: jsonUsers.length,
          trips: jsonTripsTotal,
          bookings: jsonBookings.length,
          total: jsonUsers.length + jsonTripsTotal + jsonBookings.length
        },
        database_connected: dataService.useDatabase
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Simple direct migration
app.post('/api/migrate/direct', async (req, res) => {
  try {
    const User = require('./database/models/User');
    const Trip = require('./database/models/Trip');
    
    const results = { users: 0, trips: 0, errors: [] };
    
    // ========== MIGRATE USERS DIRECTLY ==========
    console.log('👥 Starting direct user migration...');
    
    const jsonUsers = [
      {
        firstName: "rohit",
        lastName: "singh", 
        email: "rohitsdeopa@gmail.com",
        password: "$2b$10$F70RS..6gt/bWy3SdwBEJeuAWsJ/u9n2QLwxzG57Bo2trxOhuTiLq"
      },
      {
        firstName: "rohit",
        lastName: "singh",
        email: "rdeopa45@gmail.com", 
        password: "$2b$10$/ZQa1y8hZvagjjohF.tryOQxjN5XlvZQUQSG9qaNIwHd.MZhisFeW"
      },
      {
        firstName: "John",
        lastName: "Atlas",
        email: "john.atlas@example.com",
        password: "$2b$10$lbbHPYhgBrVWJHA03yMhheGWbx6e3hjNjz1TsDuHJyoAf5CoQdMGe"
      }
    ];
    
    for (const userData of jsonUsers) {
      try {
        // Check if user exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          console.log(`⚠️  User ${userData.email} already exists, skipping...`);
          continue;
        }
        
        // Create user directly
        const user = await User.create({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: userData.password,
          role: 'user',
          isActive: true
        });
        
        results.users++;
        console.log(`✅ Migrated user: ${userData.email}`);
        
      } catch (error) {
        console.error(`❌ Error migrating user ${userData.email}:`, error.message);
        results.errors.push(`User ${userData.email}: ${error.message}`);
      }
    }
    
    // ========== MIGRATE SAMPLE TRIPS ==========
    console.log('🗺️  Starting direct trip migration...');
    
    const sampleTrips = [
      {
        title: "Delhi Tour",
        description: "Explore the heart of India's capital with a comprehensive tour covering iconic landmarks, historical monuments, and vibrant culture.",
        image: "images/hot1.webp",
        price: 2500,
        currency: "₹",
        destination: "Delhi",
        duration: "2 Days, 1 Night",
        category: "hot-location"
      },
      {
        title: "Kerala Backwaters & Ayurveda", 
        description: "Experience the serene backwaters of Kerala with traditional Ayurvedic treatments",
        image: "images/Kerala backwaters and Ayurveda 1.webp",
        price: 22499,
        currency: "₹",
        destination: "kerala",
        duration: "6 Days, 5 Nights",
        category: "domestic-trip"
      }
    ];
    
    for (const tripData of sampleTrips) {
      try {
        // Check if trip exists
        const existingTrip = await Trip.findOne({ title: tripData.title });
        if (existingTrip) {
          console.log(`⚠️  Trip "${tripData.title}" already exists, skipping...`);
          continue;
        }
        
        // Create trip directly
        const trip = await Trip.create({
          title: tripData.title,
          description: tripData.description,
          image: tripData.image,
          price: tripData.price,
          currency: tripData.currency,
          destination: tripData.destination,
          duration: tripData.duration,
          category: tripData.category,
          isActive: true
        });
        
        results.trips++;
        console.log(`✅ Migrated trip: ${tripData.title}`);
        
      } catch (error) {
        console.error(`❌ Error migrating trip ${tripData.title}:`, error.message);
        results.errors.push(`Trip ${tripData.title}: ${error.message}`);
      }
    }
    
    console.log('🎊 Direct migration completed!');
    console.log('📊 Results:', results);
    
    res.json({
      success: true,
      message: 'Direct migration completed',
      results: results
    });
    
  } catch (error) {
    console.error('❌ Direct migration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug: Test single user migration
app.post('/api/migrate/test-user', async (req, res) => {
  try {
    const User = require('./database/models/User');
    const jsonUsers = await dataService.getJsonData('users');
    const firstUser = jsonUsers[0];
    
    console.log('📋 First user data from JSON:', firstUser);
    
    const mongoUser = new User({
      firstName: firstUser.firstName || '',
      lastName: firstUser.lastName || '',
      email: firstUser.email,
      password: firstUser.password,
      phone: firstUser.phone || '',
      isActive: true,
      role: 'customer',
      lastLogin: firstUser.lastLogin || null
    });
    
    const savedUser = await mongoUser.save();
    console.log('✅ Test user saved successfully');
    
    res.json({
      success: true,
      message: 'Test user migration successful',
      user: savedUser
    });
    
  } catch (error) {
    console.error('❌ Test user migration failed:', {
      message: error.message,
      errors: error.errors,
      stack: error.stack
    });
    
    res.json({
      success: false,
      error: error.message,
      validationErrors: error.errors
    });
  }
});

// ========== END DATA MIGRATION ENDPOINTS ==========

// Test users specifically
app.get('/api/test-users', async (req, res) => {
  try {
    const User = require('./database/models/User');
    
    // Get all users from MongoDB
    const mongoUsers = await User.find({}).select('-password').limit(10);
    
    // Get users from JSON fallback
    const jsonUsers = await dataService.getJsonData('users');
    
    res.json({
      success: true,
      mongodb: {
        connected: dataService.useDatabase,
        users: mongoUsers,
        count: mongoUsers.length
      },
      json: {
        users: jsonUsers,
        count: jsonUsers.length
      }
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Direct MongoDB user save test
app.post('/api/test-save-user', async (req, res) => {
  try {
    const User = require('./database/models/User');
    
    console.log('🧪 Testing direct MongoDB user save...');
    
    // Create test user
    const testUser = new User({
      firstName: 'Direct',
      lastName: 'Test User',
      email: 'direct.test@example.com',
      password: 'testpass123',
      phone: '8888777666',
      isActive: true,
      role: 'customer'
    });

    // Save directly to MongoDB
    const savedUser = await testUser.save();
    console.log('✅ Direct MongoDB user save successful:', savedUser._id);

    res.json({
      success: true,
      message: 'Direct MongoDB user save successful',
      user: {
        id: savedUser._id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email
      }
    });

  } catch (error) {
    console.error('❌ Direct MongoDB user save failed:', error);
    res.json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});

// Direct MongoDB save test
app.post('/api/test-save-mongo', async (req, res) => {
  try {
    const SimpleBooking = require('./database/models/SimpleBooking');
    
    console.log('🧪 Testing direct MongoDB save...');
    
    // Create test booking
    const testBooking = new SimpleBooking({
      tripTitle: 'Direct MongoDB Test',
      travelers: 1,
      contactInfo: {
        name: 'Direct Test User',
        email: 'directtest@example.com',
        phone: '9999999999'
      },
      specialRequests: 'Testing direct save',
      status: 'pending_confirmation'
    });

    // Save directly to MongoDB
    const savedBooking = await testBooking.save();
    console.log('✅ Direct MongoDB save successful:', savedBooking._id);

    res.json({
      success: true,
      message: 'Direct MongoDB save successful',
      booking: savedBooking,
      bookingId: savedBooking.bookingId
    });

  } catch (error) {
    console.error('❌ Direct MongoDB save failed:', error);
    res.json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});

// Health check endpoint (enhanced with database status)
app.get('/api/health', async (req, res) => {
  try {
    const healthStatus = await dataService.healthCheck();
    res.json({ 
      status: 'OK', 
      message: 'Traowl API is running',
      database: healthStatus.database,
      jsonFallback: healthStatus.jsonFallback,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({ 
      status: 'OK', 
      message: 'Traowl API is running (basic mode)',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Root route - redirect to home page
app.get('/', (req, res) => {
  res.redirect('/home.html');
});

// ========== ADMIN ENDPOINTS ==========

// Admin middleware is now imported from middleware/rbac.js
// Use requireAdminAccess for general admin access
// Use requirePermission('specific.permission') for granular control

// Admin: Update content files
app.put('/api/admin/content/:filename', authenticateToken, requirePermission('content.edit'), (req, res) => {
  try {
    const filename = req.params.filename;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Validate that filename is allowed (security check)
    const allowedFiles = [
      'upcoming-trips.json',
      'domestic-trips.json',
      'international-trips.json',
      'family-trips.json',
      'romantic-trips.json',
      'corporate-trips.json',
      'spiritual-tours.json',
      'activities.json',
      'homepage-hot-locations.json',
      'homepage-activities.json',
      'homepage-top-destinations.json',
      'weekend-trips.json',
      'blogs.json',
      'booking-packages.json'
    ];

    if (!allowedFiles.includes(filename)) {
      return res.status(400).json({ error: 'File not allowed for editing' });
    }

    const success = writeJsonFile(filename, content);
    if (success) {
      res.json({ 
        success: true, 
        message: `${filename} updated successfully`,
        updatedBy: req.user.email,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({ error: 'Failed to save file' });
    }
  } catch (error) {
    console.error('Admin content update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get dashboard statistics
app.get('/api/admin/stats', authenticateToken, requireAdminAccess, (req, res) => {
  try {
    const stats = {
      users: 0,
      bookings: 0,
      messages: 0,
      trips: 0,
      recentBookings: []
    };

    // Count users
    const usersData = readJsonFile('users.json');
    stats.users = usersData?.users?.length || 0;

    // Count trips from all categories
    const tripFiles = [
      'spiritual-tours.json',
      'domestic-trips.json', 
      'international-trips.json',
      'family-trips.json',
      'romantic-trips.json',
      'corporate-trips.json',
      'weekend-trips.json',
      'upcoming-trips.json'
    ];

    let totalTrips = 0;
    tripFiles.forEach(file => {
      const data = readJsonFile(file);
      if (data) {
        if (file === 'spiritual-tours.json') {
          totalTrips += data.spiritualTours?.length || 0;
        } else {
          totalTrips += data.trips?.length || 0;
        }
      }
    });
    stats.trips = totalTrips;

    // Count bookings
    const bookingsData = readJsonFile('bookings.json');
    stats.bookings = bookingsData?.bookings?.length || 0;
    stats.recentBookings = bookingsData?.bookings?.slice(-5) || [];

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to load statistics' });
  }
});

// Admin: Upload image
app.post('/api/admin/upload-image', authenticateToken, requirePermission('content.edit'), upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ 
      success: true, 
      imageUrl,
      message: 'Image uploaded successfully' 
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Admin: Update site settings
app.put('/api/admin/settings/:type', authenticateToken, requirePermission('system.settings'), (req, res) => {
  try {
    const type = req.params.type;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Validate that type is allowed
    const allowedTypes = ['header', 'footer', 'site-settings'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Settings type not allowed' });
    }

    const filename = `${type}.json`;
    const success = writeJsonFile(filename, content);
    
    if (success) {
      res.json({ 
        success: true, 
        message: `${type} settings updated successfully`,
        updatedBy: req.user.email,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({ error: 'Failed to save settings' });
    }
  } catch (error) {
    console.error('Admin settings update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get all users
app.get('/api/admin/users', authenticateToken, requirePermission('users.view'), (req, res) => {
  try {
    const usersData = readJsonFile('users.json');
    if (usersData) {
      // Remove passwords from response
      const safeUsers = usersData.users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      res.json({
        success: true,
        users: safeUsers,
        count: safeUsers.length
      });
    } else {
      res.status(500).json({ error: 'Failed to load users data' });
    }
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Update user
app.put('/api/admin/users/:userId', authenticateToken, requirePermission('users.edit'), async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { firstName, lastName, email, phone, isActive } = req.body;

    const usersData = readJsonFile('users.json');
    if (!usersData) {
      return res.status(500).json({ error: 'Failed to load users data' });
    }

    const userIndex = usersData.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user data
    const user = usersData.users[userIndex];
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    user.updatedAt = new Date().toISOString();

    const success = writeJsonFile('users.json', usersData);
    if (success) {
      const { password, ...safeUser } = user;
      res.json({
        success: true,
        message: 'User updated successfully',
        user: safeUser
      });
    } else {
      res.status(500).json({ error: 'Failed to save user data' });
    }
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Delete user
app.delete('/api/admin/users/:userId', authenticateToken, requirePermission('users.delete'), (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const usersData = readJsonFile('users.json');
    if (!usersData) {
      return res.status(500).json({ error: 'Failed to load users data' });
    }

    const userIndex = usersData.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove user
    const deletedUser = usersData.users.splice(userIndex, 1)[0];
    
    const success = writeJsonFile('users.json', usersData);
    if (success) {
      res.json({
        success: true,
        message: 'User deleted successfully',
        deletedUser: { id: deletedUser.id, email: deletedUser.email }
      });
    } else {
      res.status(500).json({ error: 'Failed to save users data' });
    }
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Update booking status
app.put('/api/admin/bookings/:bookingId/status', authenticateToken, requirePermission('bookings.edit'), async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const { status } = req.body;

    const allowedStatuses = ['pending_confirmation', 'confirmed', 'cancelled', 'completed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update booking in MongoDB
    const booking = await SimpleBooking.findOneAndUpdate(
      { bookingId: bookingId },
      { 
        status: status,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (booking) {
      res.json({
        success: true,
        message: 'Booking status updated successfully',
        booking: booking
      });
    } else {
      res.status(404).json({ error: 'Booking not found' });
    }
  } catch (error) {
    console.error('Admin update booking status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get all contact messages (placeholder - implement based on your contact message storage)
app.get('/api/admin/messages', authenticateToken, requireAdminAccess, async (req, res) => {
  try {
    // Get contact messages from MongoDB
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      messages: messages,
      count: messages.length
    });
  } catch (error) {
    console.error('Admin get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Mark message as read
app.put('/api/admin/messages/:messageId/read', authenticateToken, requireAdminAccess, async (req, res) => {
  try {
    const messageId = req.params.messageId;
    
    const message = await ContactMessage.findByIdAndUpdate(
      messageId,
      { 
        isRead: true,
        readAt: new Date(),
        readBy: req.user.email
      },
      { new: true }
    );

    if (message) {
      res.json({
        success: true,
        message: 'Message marked as read',
        data: message
      });
    } else {
      res.status(404).json({ error: 'Message not found' });
    }
  } catch (error) {
    console.error('Admin mark message read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Dashboard stats
app.get('/api/admin/stats', authenticateToken, requireAdminAccess, async (req, res) => {
  try {
    // Get users count
    const usersData = readJsonFile('users.json');
    const usersCount = usersData ? usersData.users.length : 0;

    // Get bookings count
    const bookingsCount = await SimpleBooking.countDocuments();

    // Get messages count
    const messagesCount = await ContactMessage.countDocuments();

    // Get recent bookings
    const recentBookings = await SimpleBooking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('bookingId tripTitle contactInfo.name status createdAt');

    res.json({
      success: true,
      stats: {
        users: usersCount,
        bookings: bookingsCount,
        messages: messagesCount,
        recentBookings: recentBookings
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Blog Management
app.get('/api/admin/blogs', authenticateToken, requirePermission('blogs.view'), async (req, res) => {
  try {
    const blogs = await Blog.find()
      .select('title category author readTime viewCount isPublished publishedAt createdAt featuredImage excerpt tags')
      .sort({ createdAt: -1 });
    
    // Transform for admin display
    const blogsForAdmin = blogs.map(blog => ({
      id: blog._id,
      title: blog.title,
      category: blog.category,
      author: blog.author?.name || 'Admin',
      status: blog.isPublished ? 'published' : 'draft',
      createdAt: blog.createdAt,
      publishedAt: blog.publishedAt,
      image: blog.featuredImage,
      excerpt: blog.excerpt,
      tags: blog.tags,
      viewCount: blog.viewCount
    }));
    
    res.json({
      success: true,
      blogs: blogsForAdmin
    });
  } catch (error) {
    console.error('Admin get blogs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/admin/blogs', authenticateToken, requirePermission('blogs.create'), async (req, res) => {
  try {
    const { title, content, category, tags, status, excerpt } = req.body;
    
    // Create blog document
    const blogData = {
      title,
      content,
      excerpt: excerpt || content.substring(0, 200) + '...',
      featuredImage: req.body.image || 'images/blog-default.webp',
      category: category || 'travel',
      tags: Array.isArray(tags) ? tags : [],
      isPublished: status === 'published',
      author: {
        name: 'Admin',
        bio: 'Traowl Content Team'
      },
      readTime: Math.ceil(content.length / 1000), // Rough estimate
      lastModifiedBy: 'admin'
    };
    
    const newBlog = new Blog(blogData);
    await newBlog.save();
    
    res.json({
      success: true,
      message: 'Blog created successfully',
      blog: {
        id: newBlog._id,
        title: newBlog.title,
        category: newBlog.category,
        status: newBlog.isPublished ? 'published' : 'draft',
        createdAt: newBlog.createdAt
      }
    });
  } catch (error) {
    console.error('Admin create blog error:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Blog with this title already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.put('/api/admin/blogs/:blogId', authenticateToken, requirePermission('blogs.edit'), async (req, res) => {
  try {
    const blogId = req.params.blogId;
    const { title, content, category, tags, status, excerpt } = req.body;
    
    // Find and update blog
    const updateData = {
      title,
      content,
      excerpt: excerpt || content.substring(0, 200) + '...',
      category: category || 'travel',
      tags: Array.isArray(tags) ? tags : [],
      isPublished: status === 'published',
      readTime: Math.ceil(content.length / 1000),
      lastModifiedBy: 'admin'
    };
    
    if (req.body.image) {
      updateData.featuredImage = req.body.image;
    }
    
    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedBlog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    res.json({
      success: true,
      message: 'Blog updated successfully',
      blog: {
        id: updatedBlog._id,
        title: updatedBlog.title,
        category: updatedBlog.category,
        status: updatedBlog.isPublished ? 'published' : 'draft',
        updatedAt: updatedBlog.updatedAt
      }
    });
  } catch (error) {
    console.error('Admin update blog error:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Blog with this title already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.delete('/api/admin/blogs/:blogId', authenticateToken, requirePermission('blogs.delete'), async (req, res) => {
  try {
    const blogId = req.params.blogId;
    
    const deletedBlog = await Blog.findByIdAndDelete(blogId);
    
    if (!deletedBlog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Admin delete blog error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single blog for editing
app.get('/api/admin/blogs/:blogId', authenticateToken, requirePermission('blogs.view'), async (req, res) => {
  try {
    const blogId = req.params.blogId;
    const blog = await Blog.findById(blogId);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    res.json({
      id: blog._id,
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt,
      category: blog.category,
      tags: blog.tags,
      image: blog.featuredImage,
      status: blog.isPublished ? 'published' : 'draft',
      author: blog.author?.name || 'Admin'
    });
  } catch (error) {
    console.error('Admin get single blog error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Page Content Management
app.get('/api/admin/pages/:pageType', authenticateToken, requirePermission('content.view'), async (req, res) => {
  try {
    const pageType = req.params.pageType;
    
    let siteContent = await SiteContent.findOne({ type: pageType });
    
    if (!siteContent) {
      // Create default content if it doesn't exist
      siteContent = new SiteContent({
        type: pageType,
        content: getDefaultContent(pageType),
        lastModifiedBy: 'admin'
      });
      await siteContent.save();
    }
    
    res.json({
      success: true,
      content: JSON.stringify(siteContent.content, null, 2)
    });
  } catch (error) {
    console.error('Admin get page content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to get default content
function getDefaultContent(pageType) {
  const defaults = {
    'about-us': {
      title: 'About Traowl',
      description: 'Your trusted travel companion for unforgettable journeys.',
      sections: []
    },
    'home-content': {
      hero: {
        title: 'Welcome to Traowl',
        subtitle: 'Discover Amazing Adventures'
      },
      features: []
    },
    'footer': {
      companyInfo: 'Traowl - Your Travel Partner',
      links: [],
      socialMedia: []
    },
    'header': {
      logo: 'Traowl',
      navigation: [],
      contactInfo: {}
    },
    'policies': {
      title: 'Terms and Policies',
      content: 'Terms and conditions content goes here.'
    }
  };
  
  return defaults[pageType] || {};
}

app.put('/api/admin/pages/:pageType', authenticateToken, requirePermission('content.edit'), async (req, res) => {
  try {
    const pageType = req.params.pageType;
    const { content } = req.body;
    
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid JSON content' });
    }
    
    // Update or create site content
    const updatedContent = await SiteContent.findOneAndUpdate(
      { type: pageType },
      { 
        content: parsedContent,
        lastModifiedBy: 'admin',
        version: { $inc: 1 }
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true 
      }
    );
    
    res.json({
      success: true,
      message: 'Page content updated successfully',
      version: updatedContent.version
    });
  } catch (error) {
    console.error('Admin update page content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Banner Management
app.get('/api/admin/banners', authenticateToken, requirePermission('content.view'), async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ displayOrder: 1 });
    
    // Transform to expected format
    const bannersData = {
      heroBanner: {},
      sectionBanners: {}
    };
    
    banners.forEach(banner => {
      if (banner.type === 'hero') {
        bannersData.heroBanner = {
          image: banner.image,
          text: banner.title || 'Welcome to Traowl',
          subtitle: banner.subtitle || 'Discover Amazing Adventures'
        };
      } else {
        bannersData.sectionBanners[banner.type] = banner.image;
      }
    });
    
    // Set defaults if no banners exist
    if (!bannersData.heroBanner.image) {
      bannersData.heroBanner = {
        image: 'images/bg.webp',
        text: 'Welcome to Traowl',
        subtitle: 'Discover Amazing Adventures'
      };
    }
    
    res.json(bannersData);
  } catch (error) {
    console.error('Admin get banners error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/admin/banners/hero', authenticateToken, requirePermission('content.edit'), async (req, res) => {
  try {
    const { text, subtitle } = req.body;
    
    // Update or create hero banner
    const heroBanner = await Banner.findOneAndUpdate(
      { type: 'hero' },
      {
        title: text,
        subtitle: subtitle,
        image: 'images/bg.webp', // Default image
        lastModifiedBy: 'admin'
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );
    
    res.json({
      success: true,
      message: 'Hero banner updated successfully'
    });
  } catch (error) {
    console.error('Admin update hero banner error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/admin/banners/sections', authenticateToken, requirePermission('content.edit'), async (req, res) => {
  try {
    const banners = req.body; // { about: 'url', services: 'url', 'trip-1': 'url', etc. }
    
    // Update each section banner
    const updatePromises = Object.entries(banners).map(([type, imageUrl]) => {
      let title = `${type.charAt(0).toUpperCase() + type.slice(1)} Section`;
      
      // Handle trip-specific banners
      if (type.startsWith('trip-')) {
        const tripId = type.replace('trip-', '');
        title = `Trip ${tripId} Banner`;
      }
      
      return Banner.findOneAndUpdate(
        { type: type },
        {
          image: imageUrl,
          title: title,
          lastModifiedBy: 'admin',
          isActive: true
        },
        {
          new: true,
          upsert: true,
          runValidators: true
        }
      );
    });
    
    await Promise.all(updatePromises);
    
    res.json({
      success: true,
      message: 'Section banners updated successfully',
      updatedBanners: Object.keys(banners).length
    });
  } catch (error) {
    console.error('Admin update section banners error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all trips (combined from all trip types) - for admin banner management
app.get('/api/trips', (req, res) => {
  try {
    const allTrips = [];
    let tripId = 1;
    
    // Get trips from all categories
    const tripCategories = [
      'upcoming-trips.json',
      'domestic-trips.json',
      'family-trips.json',
      'romantic-trips.json',
      'corporate-trips.json',
      'weekend-trips.json',
      'international-trips.json'
    ];
    
    tripCategories.forEach(category => {
      const data = readJsonFile(category);
      if (data) {
        // Handle different data structures
        const trips = data.trips || data.upcomingTrips || data.weekendTrips || data.domesticTrips || 
                     data.familyTrips || data.romanticTrips || data.corporateTrips || data.internationalTrips || [];
        
        if (Array.isArray(trips) && trips.length > 0) {
          trips.forEach(trip => {
            allTrips.push({
              id: tripId++,
              title: trip.title || trip.name || trip.destination,
              image: trip.image || trip.images?.[0] || trip.img,
              category: category.replace('-trips.json', '').replace('.json', ''),
              originalId: trip.id,
              price: trip.price,
              duration: trip.duration,
              location: trip.location || trip.destination
            });
          });
        }
      }
    });
    
    console.log(`Loaded ${allTrips.length} trips from ${tripCategories.length} categories`);
    res.json({ trips: allTrips });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({ error: 'Failed to load trips data' });
  }
});

// Get banner for specific section/trip (public endpoint)
app.get('/api/banners/:type', async (req, res) => {
  try {
    const bannerType = req.params.type;
    const banner = await Banner.findOne({ type: bannerType, isActive: true });
    
    if (banner) {
      res.json({
        success: true,
        banner: {
          type: banner.type,
          title: banner.title,
          subtitle: banner.subtitle,
          image: banner.image,
          overlay: banner.overlay
        }
      });
    } else {
      // Return default banner if specific one doesn't exist
      res.json({
        success: true,
        banner: {
          type: bannerType,
          title: `${bannerType.charAt(0).toUpperCase() + bannerType.slice(1)} Section`,
          image: 'images/bg.webp',
          overlay: { enabled: true, opacity: 0.5, color: '#000000' }
        }
      });
    }
  } catch (error) {
    console.error('Get banner error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save visual editor changes
app.post('/api/admin/save-visual-changes', authenticateToken, requireAdminAccess, async (req, res) => {
  try {
    const { file, changes, url } = req.body;
    
    if (!file || !changes) {
      return res.status(400).json({ error: 'File and changes are required' });
    }

    console.log(`Saving visual changes for ${file}:`, changes);

    // Read current data
    const currentData = readJsonFile(file);
    if (!currentData) {
      return res.status(404).json({ error: 'Data file not found' });
    }

    // Apply changes based on the content structure
    let updatedData = { ...currentData };
    
    // Process each change
    for (const [selector, change] of Object.entries(changes)) {
      try {
        if (change.type === 'text') {
          updatedData = applyTextChange(updatedData, selector, change.content, file);
        } else if (change.type === 'image') {
          updatedData = applyImageChange(updatedData, selector, change.src, file);
        } else if (change.type === 'link') {
          updatedData = applyLinkChange(updatedData, selector, change.text, change.href, file);
        }
      } catch (changeError) {
        console.warn(`Failed to apply change for selector ${selector}:`, changeError);
      }
    }

    // Save updated data
    const success = writeJsonFile(file, updatedData);
    if (!success) {
      return res.status(500).json({ error: 'Failed to save changes' });
    }

    // Log the change for audit
    console.log(`✅ Visual changes saved to ${file} by user ${req.user.email}`);

    res.json({ 
      success: true, 
      message: 'Changes saved successfully',
      changesApplied: Object.keys(changes).length
    });

  } catch (error) {
    console.error('Save visual changes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions for applying visual changes
function applyTextChange(data, selector, newContent, file) {
  if (file === 'about-us.json') {
    console.log(`Applying text change - Selector: ${selector}, Content: ${newContent.substring(0, 100)}...`);
    
    // Enhanced mapping for about page
    const mappings = {
      'about-hero-title': 'aboutUs.heroSection.title',
      'about-who-title': 'aboutUs.story.title',
      'about-mission-title': 'aboutUs.mission.title',
      'about-team-title': 'aboutUs.team.title',
      'h1': 'aboutUs.heroSection.title',
      '.hero-title': 'aboutUs.heroSection.title'
    };

    // Direct mapping
    if (mappings[selector]) {
      setNestedProperty(data, mappings[selector], newContent);
      console.log(`✅ Applied direct mapping: ${selector} -> ${mappings[selector]}`);
      return data;
    }

    // Section-based mapping for paragraphs
    if (selector.includes('who-paragraph-')) {
      const index = parseInt(selector.split('-').pop());
      // The about page has multiple paragraphs in the "who" section
      if (index === 0) {
        setNestedProperty(data, 'aboutUs.story.description', newContent);
      }
      console.log(`✅ Applied paragraph mapping: ${selector} -> story section`);
      return data;
    }

    if (selector.includes('mission-paragraph-')) {
      const index = parseInt(selector.split('-').pop());
      if (index === 0) {
        setNestedProperty(data, 'aboutUs.mission.description', newContent);
      }
      console.log(`✅ Applied paragraph mapping: ${selector} -> mission section`);
      return data;
    }

    // Fallback: try to match by content similarity
    const updated = updateContentByMatch(data, newContent, file);
    if (updated) {
      console.log(`✅ Applied content matching for: ${selector}`);
    } else {
      console.warn(`⚠️ No mapping found for selector: ${selector}`);
    }
  }
  
  return data;
}

function applyImageChange(data, selector, newSrc, file) {
  if (file === 'about-us.json') {
    // Update hero image or team images
    if (selector.includes('hero') || selector === 'img') {
      setNestedProperty(data, 'aboutUs.heroSection.image', newSrc);
    }
    // Could add more specific image mappings here
  }
  
  return data;
}

function applyLinkChange(data, selector, newText, newHref, file) {
  // Handle link changes - this would depend on the specific structure
  return data;
}

function updateContentByMatch(data, newContent, file) {
  // Try to find and update content by matching existing text
  function searchAndReplace(obj, target, path = '') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'string' && value.length > 10) {
        // Calculate similarity score
        const similarity = calculateSimilarity(value, target);
        
        // If similarity is high enough, or if it's a partial match, replace it
        if (similarity > 0.3 || value.includes(target.substring(0, Math.min(30, target.length)))) {
          console.log(`🔄 Content match found at ${currentPath} (similarity: ${similarity.toFixed(2)})`);
          console.log(`   Old: ${value.substring(0, 100)}...`);
          console.log(`   New: ${target.substring(0, 100)}...`);
          obj[key] = target;
          return true;
        }
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        if (searchAndReplace(value, target, currentPath)) return true;
      } else if (Array.isArray(value)) {
        // Handle arrays (like team members, testimonials, etc.)
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] === 'object' && searchAndReplace(value[i], target, `${currentPath}[${i}]`)) {
            return true;
          }
        }
      }
    }
    return false;
  }
  
  return searchAndReplace(data, newContent);
}

function calculateSimilarity(str1, str2) {
  // Simple similarity calculation based on common words
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);
  
  const commonWords = words1.filter(word => words2.includes(word));
  const totalWords = Math.max(words1.length, words2.length);
  
  return commonWords.length / totalWords;
}

function setNestedProperty(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current)) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
}

// ========== END ADMIN ENDPOINTS ==========

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database connection
    console.log('🔄 Initializing database connection...');
    await dataService.initialize();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Traowl API server running on http://localhost:${PORT}`);
  console.log(`API Documentation:`);
  console.log(`Authentication:`);
  console.log(`- POST /api/auth/register - Register new user`);
  console.log(`- POST /api/auth/login - Login user`);
  console.log(`- POST /api/auth/refresh - Refresh access token`);
  console.log(`- GET /api/auth/profile - Get user profile (protected)`);
  console.log(`- PUT /api/auth/profile - Update user profile (protected)`);
  console.log(`- POST /api/auth/logout - Logout user (protected)`);
  console.log(`- GET /api/auth/verify - Verify token (protected)`);
  console.log(`Data APIs:`);
  console.log(`- GET /api/hot-locations - Get all hot locations`);
  console.log(`- GET /api/upcoming-trips - Get all upcoming trips`);
  console.log(`- GET /api/top-destinations - Get all top destinations`);
  console.log(`- GET /api/activities - Get all activities (homepage)`);
  console.log(`- GET /api/activities-page - Get all activities (activities page)`);
  console.log(`- GET /api/spiritual-tours - Get all spiritual tours`);
  console.log(`- GET /api/weekend-trips - Get all weekend trips`);
  console.log(`- GET /api/domestic-trips - Get all domestic trips`);
  console.log(`- GET /api/family-trips - Get all family trips`);
  console.log(`- GET /api/romantic-trips - Get all romantic trips`);
  console.log(`- GET /api/corporate-trips - Get all corporate trips`);
  console.log(`- GET /api/about-us - Get about us content`);
  console.log(`- GET /api/about-us/:section - Get specific about us section`);
  console.log(`- GET /api/blogs - Get all blogs`);
  console.log(`- GET /api/blogs/:id - Get blog by ID`);
  console.log(`- GET /api/blogs/category/:category - Get blogs by category`);
  console.log(`- GET /api/blogs/tag/:tag - Get blogs by tag`);
  console.log(`- GET /api/search?q=<query> - Search across all data`);
  console.log(`- GET /api/header - Get header content`);
  console.log(`- GET /api/footer - Get footer content`);
  console.log(`- GET /api/health - Health check`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Middleware to check admin access for HTML pages
const checkAdminPageAccess = async (req, res, next) => {
  const token = req.query.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.redirect('/login.html?redirect=' + encodeURIComponent(req.originalUrl));
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive || !user.canAccessAdmin()) {
      return res.redirect('/login.html?error=access_denied');
    }
    
    next();
  } catch (error) {
    return res.redirect('/login.html?error=invalid_token');
  }
};

// Serve admin panels
app.get('/admin', checkAdminPageAccess, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/admin-visual', checkAdminPageAccess, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-new.html'));
});

// Start the server
startServer();
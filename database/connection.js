const mongoose = require('mongoose');

class DatabaseConnection {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    try {
      // Get database URL from environment or use default
      const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/traowl';
      
      // Connection options (optimized for Atlas)
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000, // Increased for Atlas
        socketTimeoutMS: 45000,
        family: 4, // Use IPv4, skip trying IPv6
        retryWrites: true,
        w: 'majority'
      };

      console.log('🔗 Connecting to MongoDB Atlas...');

      // Connect to MongoDB
      await mongoose.connect(DATABASE_URL, options);
      
      this.isConnected = true;
      console.log('✅ MongoDB connected successfully');
      console.log(`📊 Database: ${mongoose.connection.name}`);
      console.log(`🌐 Host: ${mongoose.connection.host}`);
      
      // Log if using Atlas
      if (DATABASE_URL.includes('mongodb+srv://')) {
        console.log('☁️  Using MongoDB Atlas (Cloud)');
      } else {
        console.log('💻 Using Local MongoDB');
      }
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
        this.isConnected = true;
      });

      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      console.log('📝 Falling back to JSON file storage...');
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('✅ MongoDB disconnected gracefully');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
    }
  }

  isReady() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  getConnectionState() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return states[mongoose.connection.readyState] || 'unknown';
  }
}

// Create singleton instance
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;
const fs = require('fs').promises;
const path = require('path');
const dbConnection = require('../connection');
const Trip = require('../models/Trip');
const User = require('../models/User');
const Booking = require('../models/Booking');
const SimpleBooking = require('../models/SimpleBooking');
const Activity = require('../models/Activity');
const Blog = require('../models/Blog');
const TopDestination = require('../models/TopDestination');
const SiteContent = require('../models/SiteContent');

class DataService {
  constructor() {
    this.useDatabase = false;
    this.dataPath = path.join(__dirname, '../../data');
  }

  async initialize() {
    // Try to connect to database
    this.useDatabase = await dbConnection.connect();
    
    if (!this.useDatabase) {
      console.log('📁 Using JSON file storage as fallback');
    }
    
    return this.useDatabase;
  }

  // Generic method to get data (database or JSON fallback)
  async getData(collection, options = {}) {
    if (this.useDatabase && dbConnection.isReady()) {
      return await this.getDatabaseData(collection, options);
    } else {
      return await this.getJsonData(collection, options);
    }
  }

  // Database operations
  async getDatabaseData(collection, options = {}) {
    try {
      switch (collection) {
        case 'users':
          return await User.find(options.filter || {})
            .select(options.select || '-password')
            .limit(options.limit || 0)
            .sort(options.sort || { createdAt: -1 });

        case 'trips':
        case 'hot-locations':
        case 'upcoming-trips':
        case 'weekend-trips':
        case 'domestic-trips':
        case 'international-trips':
        case 'family-trips':
        case 'romantic-trips':
        case 'corporate-trips':
        case 'spiritual-tours':
          const categoryMap = {
            'hot-locations': 'hot-location',
            'upcoming-trips': 'upcoming-trip',
            'weekend-trips': 'weekend-trip',
            'domestic-trips': 'domestic-trip',
            'international-trips': 'international-trip',
            'family-trips': 'family-trip',
            'romantic-trips': 'romantic-trip',
            'corporate-trips': 'corporate-trip',
            'spiritual-tours': 'spiritual-tour'
          };
          
          const filter = { isActive: true, ...options.filter };
          if (categoryMap[collection]) {
            filter.category = categoryMap[collection];
          }
          
          return await Trip.find(filter)
            .limit(options.limit || 0)
            .sort(options.sort || { createdAt: -1 });

        case 'activities':
          return await Activity.find({ isActive: true, ...options.filter })
            .limit(options.limit || 0)
            .sort(options.sort || { createdAt: -1 });

        case 'blogs':
          return await Blog.find({ isPublished: true, ...options.filter })
            .limit(options.limit || 0)
            .sort(options.sort || { publishedAt: -1 });

        case 'top-destinations':
          return await TopDestination.find({ isActive: true, ...options.filter })
            .limit(options.limit || 0)
            .sort(options.sort || { popularityScore: -1, createdAt: -1 });

        case 'header':
        case 'footer':
        case 'about-us':
          const siteContent = await SiteContent.findOne({ 
            type: collection, 
            isActive: true 
          });
          return siteContent ? siteContent.content : null;

        case 'bookings':
          return await Booking.find(options.filter || {})
            .populate('user', 'firstName lastName email')
            .populate('trip', 'title destination price')
            .limit(options.limit || 0)
            .sort(options.sort || { createdAt: -1 });

        default:
          throw new Error(`Unknown collection: ${collection}`);
      }
    } catch (error) {
      console.error(`Database error for ${collection}:`, error);
      // Fallback to JSON
      return await this.getJsonData(collection, options);
    }
  }

  // JSON file operations (fallback)
  async getJsonData(collection, options = {}) {
    try {
      // Map collection names to JSON files
      const fileMap = {
        'users': 'users.json',
        'bookings': 'bookings.json',
        'hot-locations': 'homepage-hot-locations.json',
        'upcoming-trips': 'homepage-upcoming-trips.json',
        'weekend-trips': 'homepage-weekend-trips.json',
        'domestic-trips': 'domestic-trips.json',
        'international-trips': 'international-trips.json',
        'family-trips': 'family-trips.json',
        'romantic-trips': 'romantic-trips.json',
        'corporate-trips': 'corporate-trips.json',
        'spiritual-tours': 'spiritual-tours.json',
        'activities': 'homepage-activities.json',
        'top-destinations': 'homepage-top-destinations.json',
        'blogs': 'blogs.json',
        'header': 'header.json',
        'footer': 'footer.json',
        'about-us': 'about-us.json'
      };

      const filename = fileMap[collection];
      if (!filename) {
        throw new Error(`No JSON file mapping for collection: ${collection}`);
      }

      const filePath = path.join(this.dataPath, filename);
      const data = await fs.readFile(filePath, 'utf8');
      const jsonData = JSON.parse(data);

      // Extract the main data array based on collection
      let result;
      if (collection === 'users') {
        result = jsonData.users || [];
      } else if (collection === 'bookings') {
        result = jsonData.bookings || [];
      } else if (collection === 'hot-locations') {
        result = jsonData.hotLocations || [];
      } else if (collection === 'upcoming-trips') {
        result = jsonData.upcomingTrips || [];
      } else if (collection === 'weekend-trips') {
        result = jsonData.weekendTrips || [];
      } else if (collection === 'activities') {
        result = jsonData.activities || [];
      } else if (collection === 'top-destinations') {
        result = jsonData.topDestinations || [];
      } else if (collection === 'blogs') {
        result = jsonData.blogs || [];
      } else if (['header', 'footer', 'about-us'].includes(collection)) {
        result = jsonData; // Return the whole object for site content
      } else {
        // For other collections, try to find the main array
        const keys = Object.keys(jsonData);
        const mainKey = keys.find(key => Array.isArray(jsonData[key]));
        result = mainKey ? jsonData[mainKey] : jsonData;
      }

      // Apply basic filtering and limiting
      if (options.limit && Array.isArray(result)) {
        result = result.slice(0, options.limit);
      }

      return result;
    } catch (error) {
      console.error(`JSON file error for ${collection}:`, error);
      return [];
    }
  }

  // Save data (database or JSON)
  async saveData(collection, data) {
    if (this.useDatabase && dbConnection.isReady()) {
      return await this.saveDatabaseData(collection, data);
    } else {
      return await this.saveJsonData(collection, data);
    }
  }

  async saveDatabaseData(collection, data) {
    try {
      switch (collection) {
        case 'users':
          if (Array.isArray(data)) {
            return await User.insertMany(data);
          } else {
            const user = new User(data);
            return await user.save();
          }

        case 'trips':
          if (Array.isArray(data)) {
            return await Trip.insertMany(data);
          } else {
            const trip = new Trip(data);
            return await trip.save();
          }

        case 'activities':
          if (Array.isArray(data)) {
            return await Activity.insertMany(data);
          } else {
            const activity = new Activity(data);
            return await activity.save();
          }

        case 'blogs':
          if (Array.isArray(data)) {
            return await Blog.insertMany(data);
          } else {
            const blog = new Blog(data);
            return await blog.save();
          }

        case 'top-destinations':
          if (Array.isArray(data)) {
            return await TopDestination.insertMany(data);
          } else {
            const destination = new TopDestination(data);
            return await destination.save();
          }

        case 'header':
        case 'footer':
        case 'about-us':
          // For site content, update or create
          const siteContent = await SiteContent.findOneAndUpdate(
            { type: collection },
            { 
              content: data, 
              $inc: { version: 1 },
              lastModifiedBy: 'admin',
              isActive: true
            },
            { upsert: true, new: true }
          );
          return siteContent;

        case 'bookings':
          if (Array.isArray(data)) {
            return await SimpleBooking.insertMany(data);
          } else {
            const booking = new SimpleBooking(data);
            return await booking.save();
          }

        default:
          throw new Error(`Cannot save to unknown collection: ${collection}`);
      }
    } catch (error) {
      console.error(`Database save error for ${collection}:`, error);
      throw error;
    }
  }

  async saveJsonData(collection, data) {
    // Fallback to existing JSON file write operations
    // This would use the existing readJsonFile/writeJsonFile functions
    console.log(`Saving to JSON file for ${collection}`);
    return data;
  }

  // Search functionality
  async search(query, options = {}) {
    if (this.useDatabase && dbConnection.isReady()) {
      return await Trip.find(
        { $text: { $search: query }, isActive: true },
        { score: { $meta: 'textScore' } }
      ).sort({ score: { $meta: 'textScore' } });
    } else {
      // Fallback to JSON-based search
      const collections = ['hot-locations', 'upcoming-trips', 'weekend-trips'];
      let results = [];
      
      for (const collection of collections) {
        const data = await this.getJsonData(collection);
        const filtered = data.filter(item => 
          item.title?.toLowerCase().includes(query.toLowerCase()) ||
          item.description?.toLowerCase().includes(query.toLowerCase()) ||
          item.destination?.toLowerCase().includes(query.toLowerCase())
        );
        results.push(...filtered);
      }
      
      return results;
    }
  }

  // Advanced search functionality
  async searchDatabase(query, type = null) {
    if (!this.useDatabase || !dbConnection.isReady()) {
      return await this.searchJson(query, type);
    }

    try {
      const results = [];
      
      if (!type || type === 'trips') {
        const trips = await Trip.find({
          $and: [
            { isActive: true },
            {
              $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { destination: { $regex: query, $options: 'i' } },
                { tags: { $regex: query, $options: 'i' } }
              ]
            }
          ]
        }).limit(20);
        results.push(...trips.map(trip => ({ ...trip.toObject(), type: 'trip' })));
      }

      if (!type || type === 'activities') {
        const activities = await Activity.find({
          $and: [
            { isActive: true },
            {
              $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { category: { $regex: query, $options: 'i' } },
                { location: { $regex: query, $options: 'i' } }
              ]
            }
          ]
        }).limit(10);
        results.push(...activities.map(activity => ({ ...activity.toObject(), type: 'activity' })));
      }

      if (!type || type === 'destinations') {
        const destinations = await TopDestination.find({
          $and: [
            { isActive: true },
            {
              $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { 'location.state': { $regex: query, $options: 'i' } },
                { 'location.city': { $regex: query, $options: 'i' } }
              ]
            }
          ]
        }).limit(10);
        results.push(...destinations.map(dest => ({ ...dest.toObject(), type: 'destination' })));
      }

      if (!type || type === 'blogs') {
        const blogs = await Blog.find({
          $and: [
            { isPublished: true },
            {
              $or: [
                { title: { $regex: query, $options: 'i' } },
                { excerpt: { $regex: query, $options: 'i' } },
                { tags: { $regex: query, $options: 'i' } }
              ]
            }
          ]
        }).limit(10);
        results.push(...blogs.map(blog => ({ ...blog.toObject(), type: 'blog' })));
      }

      return results;
    } catch (error) {
      console.error('Database search error:', error);
      return await this.searchJson(query, type);
    }
  }

  // Get specific item by ID
  async getById(collection, id) {
    if (this.useDatabase && dbConnection.isReady()) {
      try {
        switch (collection) {
          case 'trips':
            return await Trip.findById(id);
          case 'activities':
            return await Activity.findById(id);
          case 'blogs':
            return await Blog.findById(id);
          case 'destinations':
            return await TopDestination.findById(id);
          case 'users':
            return await User.findById(id).select('-password');
          default:
            throw new Error(`Unknown collection: ${collection}`);
        }
      } catch (error) {
        console.error(`Database getById error for ${collection}:`, error);
        return null;
      }
    }
    
    // Fallback to JSON search
    const data = await this.getJsonData(collection);
    return Array.isArray(data) ? data.find(item => item.id?.toString() === id) : null;
  }

  // Get popular/featured items
  async getFeaturedItems(collection, limit = 6) {
    const options = {
      filter: { isFeatured: true },
      limit,
      sort: { createdAt: -1 }
    };
    
    return await this.getData(collection, options);
  }

  // Get items by category
  async getByCategory(collection, category, limit = 12) {
    let filter = {};
    
    if (collection === 'trips') {
      filter.category = category;
    } else if (collection === 'activities') {
      filter.category = category;
    } else if (collection === 'destinations') {
      filter.category = category;
    } else if (collection === 'blogs') {
      filter.category = category;
    }
    
    const options = {
      filter,
      limit,
      sort: { createdAt: -1 }
    };
    
    return await this.getData(collection, options);
  }

  // Health check
  async healthCheck() {
    return {
      database: {
        connected: this.useDatabase && dbConnection.isReady(),
        state: dbConnection.getConnectionState()
      },
      jsonFallback: {
        available: true,
        path: this.dataPath
      }
    };
  }
}

// Create singleton instance
const dataService = new DataService();

module.exports = dataService;
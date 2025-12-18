// Load environment variables first
require('dotenv').config();

const fs = require('fs').promises;
const path = require('path');
const dbConnection = require('./connection');

// Import all models
const Trip = require('./models/Trip');
const Activity = require('./models/Activity');
const Blog = require('./models/Blog');
const TopDestination = require('./models/TopDestination');
const SiteContent = require('./models/SiteContent');
const User = require('./models/User');

class DataMigration {
  constructor() {
    this.dataPath = path.join(__dirname, '../data');
    this.successCount = 0;
    this.errorCount = 0;
    this.skippedCount = 0;
  }

  // Utility methods for data normalization
  normalizeDifficulty(difficulty, context = 'trip') {
    if (context === 'activity') {
      const normalizedMap = {
        'Easy': 'easy',
        'easy': 'easy',
        'Moderate': 'moderate',
        'moderate': 'moderate',
        'Difficult': 'difficult',
        'difficult': 'difficult',
        'Easy to Moderate': 'moderate',
        'Moderate to Difficult': 'difficult',
        'beginner': 'beginner',
        'intermediate': 'intermediate',
        'expert': 'expert'
      };
      return normalizedMap[difficulty] || 'easy';
    } else {
      const normalizedMap = {
        'Easy': 'Easy',
        'easy': 'Easy',
        'Moderate': 'Moderate',
        'moderate': 'Moderate',
        'Difficult': 'Difficult',
        'difficult': 'Difficult',
        'Easy to Moderate': 'Moderate',
        'Moderate to Difficult': 'Difficult',
        'beginner': 'Easy',
        'intermediate': 'Moderate',
        'expert': 'Difficult'
      };
      return normalizedMap[difficulty] || 'Easy';
    }
  }

  normalizeCategory(category, type) {
    if (type === 'activity') {
      const categoryMap = {
        'safari': 'adventure',
        'wildlife': 'nature',
        'temple': 'cultural'
      };
      return categoryMap[category] || category;
    }
    
    if (type === 'blog') {
      const categoryMap = {
        'trekking': 'adventure',
        'destination': 'destinations',
        'pilgrimage': 'spiritual'
      };
      return categoryMap[category] || category;
    }
    
    if (type === 'destination') {
      const categoryMap = {
        'uttarakhand': 'mountain',
        'himachal': 'mountain',
        'kashmir': 'mountain',
        'leh': 'mountain',
        'goa': 'beach',
        'jaipur': 'city'
      };
      return categoryMap[category] || 'popular';
    }
    
    return category;
  }

  parseDate(dateString) {
    if (!dateString) return new Date();
    
    // Handle format: "14/06/2023, 04:41 pm"
    try {
      const cleanDate = dateString.replace(/,.*/, ''); // Remove time part
      const [day, month, year] = cleanDate.split('/');
      return new Date(year, month - 1, day);
    } catch (error) {
      return new Date();
    }
  }

  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async initialize() {
    console.log('🚀 Starting Data Migration to MongoDB...\n');
    
    // Connect to database
    const connected = await dbConnection.connect();
    if (!connected) {
      throw new Error('Failed to connect to MongoDB');
    }
    
    console.log('✅ Connected to MongoDB successfully\n');
    return true;
  }

  async loadJsonFile(filename) {
    try {
      const filePath = path.join(this.dataPath, filename);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`❌ Error loading ${filename}:`, error.message);
      return null;
    }
  }

  async migrateTrips() {
    console.log('📦 Migrating Trip Data...');
    
    const tripFiles = [
      { file: 'homepage-hot-locations.json', category: 'hot-location', key: 'hotLocations' },
      { file: 'homepage-upcoming-trips.json', category: 'upcoming-trip', key: 'upcomingTrips' },
      { file: 'homepage-weekend-trips.json', category: 'weekend-trip', key: 'weekendTrips' },
      { file: 'domestic-trips.json', category: 'domestic-trip', key: 'domesticTrips' },
      { file: 'international-trips.json', category: 'international-trip', key: 'internationalTrips' },
      { file: 'family-trips.json', category: 'family-trip', key: 'familyTrips' },
      { file: 'romantic-trips.json', category: 'romantic-trip', key: 'romanticTrips' },
      { file: 'corporate-trips.json', category: 'corporate-trip', key: 'corporateTrips' },
      { file: 'spiritual-tours.json', category: 'spiritual-tour', key: 'spiritualTours' }
    ];

    for (const tripFile of tripFiles) {
      try {
        const jsonData = await this.loadJsonFile(tripFile.file);
        if (!jsonData) continue;

        let trips = jsonData[tripFile.key] || [];
        if (!Array.isArray(trips)) {
          // Handle different JSON structures
          trips = Object.values(jsonData).find(val => Array.isArray(val)) || [];
        }

        console.log(`  📄 Processing ${tripFile.file}: ${trips.length} trips`);

        for (const tripData of trips) {
          try {
            // Map JSON structure to MongoDB structure
            const mappedTrip = {
              title: tripData.title,
              description: tripData.description,
              image: tripData.image,
              images: tripData.images || [],
              price: tripData.price,
              oldPrice: tripData.oldPrice,
              currency: tripData.currency || '₹',
              destination: tripData.destination || tripData.location, // Handle both field names
              duration: tripData.duration,
              category: tripFile.category,
              subCategory: tripData.category, // Original category becomes subcategory
              difficulty: this.normalizeDifficulty(tripData.difficulty || 'Easy', 'trip'),
              suitableFor: tripData.suitableFor || 'All ages',
              maxGroupSize: tripData.maxGroupSize || 50,
              minGroupSize: tripData.minGroupSize || 4,
              joinDates: tripData.joinDates || [],
              highlights: tripData.highlights || [],
              included: tripData.included || [],
              excluded: tripData.excluded || [],
              itinerary: tripData.itinerary || [],
              location: {
                country: tripData.location?.country || tripData.country || 'India',
                state: tripData.location?.state || tripData.state,
                city: tripData.location?.city || tripData.city,
                coordinates: tripData.location?.coordinates || {}
              },
              isActive: true,
              isFeatured: tripData.isFeatured || false,
              tags: tripData.tags || []
            };

            // Check if trip already exists
            const existingTrip = await Trip.findOne({ 
              title: mappedTrip.title, 
              category: mappedTrip.category 
            });

            if (existingTrip) {
              this.skippedCount++;
              continue;
            }

            // Create new trip
            const trip = new Trip(mappedTrip);
            await trip.save();
            this.successCount++;

          } catch (error) {
            console.error(`    ❌ Error saving trip "${tripData.title}":`, error.message);
            this.errorCount++;
          }
        }
      } catch (error) {
        console.error(`❌ Error processing ${tripFile.file}:`, error.message);
        this.errorCount++;
      }
    }
  }

  async migrateActivities() {
    console.log('\n🎯 Migrating Activities...');
    
    try {
      const jsonData = await this.loadJsonFile('homepage-activities.json');
      if (!jsonData) return;

      const activities = jsonData.activities || [];
      console.log(`  📄 Processing activities: ${activities.length} items`);

      for (const activityData of activities) {
        try {
          // Check if activity already exists
          const existingActivity = await Activity.findOne({ name: activityData.name });
          if (existingActivity) {
            this.skippedCount++;
            continue;
          }

          const mappedActivity = {
            name: activityData.name,
            image: activityData.image,
            description: activityData.description,
            category: this.normalizeCategory(activityData.category, 'activity'),
            difficulty: this.normalizeDifficulty(activityData.difficulty, 'activity'),
            duration: activityData.duration,
            price: activityData.price || 0,
            currency: activityData.currency || '₹',
            location: activityData.location,
            isActive: true,
            isFeatured: activityData.isFeatured || false,
            tags: activityData.tags || []
          };

          const activity = new Activity(mappedActivity);
          await activity.save();
          this.successCount++;

        } catch (error) {
          console.error(`    ❌ Error saving activity "${activityData.name}":`, error.message);
          this.errorCount++;
        }
      }
    } catch (error) {
      console.error('❌ Error processing activities:', error.message);
      this.errorCount++;
    }
  }

  async migrateBlogs() {
    console.log('\n📝 Migrating Blogs...');
    
    try {
      const jsonData = await this.loadJsonFile('blogs.json');
      if (!jsonData) return;

      const blogs = jsonData.blogs || [];
      console.log(`  📄 Processing blogs: ${blogs.length} items`);

      for (const blogData of blogs) {
        try {
          // Check if blog already exists
          const existingBlog = await Blog.findOne({ title: blogData.title });
          if (existingBlog) {
            this.skippedCount++;
            continue;
          }

          const mappedBlog = {
            title: blogData.title,
            slug: this.generateSlug(blogData.title),
            content: blogData.detail || blogData.content || blogData.summary,
            excerpt: blogData.summary || blogData.excerpt || (blogData.detail || '').substring(0, 200) + '...',
            featuredImage: blogData.image || blogData.featuredImage,
            images: blogData.images || [],
            category: this.normalizeCategory(blogData.category, 'blog'),
            tags: blogData.tags || [],
            author: blogData.author || {
              name: 'Traowl Team',
              avatar: 'images/author-default.webp',
              bio: 'Travel enthusiast and expert guide'
            },
            readTime: blogData.readTime || 5,
            isPublished: true,
            isFeatured: blogData.isFeatured || false,
            publishedAt: this.parseDate(blogData.date)
          };

          const blog = new Blog(mappedBlog);
          await blog.save();
          this.successCount++;

        } catch (error) {
          console.error(`    ❌ Error saving blog "${blogData.title}":`, error.message);
          this.errorCount++;
        }
      }
    } catch (error) {
      console.error('❌ Error processing blogs:', error.message);
      this.errorCount++;
    }
  }

  async migrateTopDestinations() {
    console.log('\n🏔️ Migrating Top Destinations...');
    
    try {
      const jsonData = await this.loadJsonFile('homepage-top-destinations.json');
      if (!jsonData) return;

      const destinations = jsonData.topDestinations || [];
      console.log(`  📄 Processing destinations: ${destinations.length} items`);

      for (const destData of destinations) {
        try {
          // Check if destination already exists
          const existingDest = await TopDestination.findOne({ name: destData.name || destData.title });
          if (existingDest) {
            this.skippedCount++;
            continue;
          }

          const mappedDest = {
            name: destData.name || destData.title,
            image: destData.image,
            images: destData.images || [],
            description: destData.description,
            category: this.normalizeCategory(destData.category, 'destination'),
            location: {
              country: destData.location?.country || destData.country || 'India',
              state: destData.location?.state || destData.state,
              city: destData.location?.city || destData.city,
              coordinates: destData.location?.coordinates || {}
            },
            price: {
              startingFrom: destData.price || destData.startingPrice || 5000,
              currency: destData.currency || '₹'
            },
            duration: {
              min: destData.duration?.min || 3,
              max: destData.duration?.max || 7
            },
            highlights: destData.highlights || [],
            activities: destData.activities || [],
            isActive: true,
            isFeatured: destData.isFeatured || false,
            isPopular: destData.isPopular || false,
            tags: destData.tags || []
          };

          const destination = new TopDestination(mappedDest);
          await destination.save();
          this.successCount++;

        } catch (error) {
          console.error(`    ❌ Error saving destination "${destData.name || destData.title}":`, error.message);
          this.errorCount++;
        }
      }
    } catch (error) {
      console.error('❌ Error processing destinations:', error.message);
      this.errorCount++;
    }
  }

  async migrateUsers() {
    console.log('\n👤 Migrating Users...');
    try {
      const jsonData = await this.loadJsonFile('users.json');
      if (!jsonData || !Array.isArray(jsonData.users)) {
        console.log('  ⚠️  No users.json data found or invalid format');
        return;
      }

      const docsToInsert = [];
      for (const u of jsonData.users) {
        try {
          const existing = await User.findOne({ email: (u.email || '').toLowerCase() });
          if (existing) {
            this.skippedCount++;
            continue;
          }

          // Use existing bcrypt hash from JSON as-is. Bypass save middleware using insertMany later.
          const doc = {
            firstName: u.firstName || 'User',
            lastName: u.lastName || '',
            email: (u.email || '').toLowerCase(),
            password: u.password, // already hashed in JSON
            oauthProvider: null,
            isEmailVerified: false,
            lastLogin: u.lastLogin ? new Date(u.lastLogin) : null,
            isActive: true,
            role: 'user',
            permissions: [],
            profile: {
              phone: u.phone || '',
              dateOfBirth: null,
              gender: undefined,
              address: {},
              preferences: { newsletter: true, sms: false, language: 'en' }
            },
            createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
            updatedAt: new Date()
          };
          docsToInsert.push(doc);
        } catch (err) {
          console.error('    ❌ Error preparing user', u && u.email, ':', err.message);
          this.errorCount++;
        }
      }

      if (docsToInsert.length > 0) {
        try {
          await User.insertMany(docsToInsert, { ordered: false });
          this.successCount += docsToInsert.length;
          console.log(`  ✅ Inserted ${docsToInsert.length} users`);
        } catch (bulkErr) {
          console.error('  ❌ Bulk insert users error:', bulkErr.message);
          // Some may have inserted; count conservatively
        }
      } else {
        console.log('  ⏭️  No new users to insert');
      }
    } catch (error) {
      console.error('❌ Error processing users:', error.message);
      this.errorCount++;
    }
  }

  async migrateSiteContent() {
    console.log('\n🏗️ Migrating Site Content...');
    
    const contentFiles = [
      { file: 'header.json', type: 'header' },
      { file: 'footer.json', type: 'footer' },
      { file: 'about-us.json', type: 'about-us' }
    ];

    for (const contentFile of contentFiles) {
      try {
        const jsonData = await this.loadJsonFile(contentFile.file);
        if (!jsonData) continue;

        console.log(`  📄 Processing ${contentFile.file}`);

        // Check if content already exists
        const existingContent = await SiteContent.findOne({ type: contentFile.type });
        if (existingContent) {
          // Update existing content
          existingContent.content = jsonData;
          existingContent.version += 1;
          await existingContent.save();
          this.successCount++;
        } else {
          // Create new content
          const siteContent = new SiteContent({
            type: contentFile.type,
            content: jsonData,
            isActive: true
          });
          await siteContent.save();
          this.successCount++;
        }

      } catch (error) {
        console.error(`❌ Error processing ${contentFile.file}:`, error.message);
        this.errorCount++;
      }
    }
  }

  async run() {
    try {
      await this.initialize();
      
      // Run all migrations
      await this.migrateTrips();
      await this.migrateActivities();
      await this.migrateBlogs();
      await this.migrateTopDestinations();
      await this.migrateUsers();
      await this.migrateSiteContent();
      
      // Print summary
      console.log('\n' + '='.repeat(50));
      console.log('📊 MIGRATION SUMMARY');
      console.log('='.repeat(50));
      console.log(`✅ Successfully migrated: ${this.successCount} records`);
      console.log(`⏭️  Skipped (duplicates): ${this.skippedCount} records`);
      console.log(`❌ Errors: ${this.errorCount} records`);
      console.log('='.repeat(50));
      
      if (this.errorCount === 0) {
        console.log('🎉 Migration completed successfully!');
      } else {
        console.log('⚠️  Migration completed with some errors. Check logs above.');
      }
      
    } catch (error) {
      console.error('💥 Migration failed:', error.message);
      process.exit(1);
    } finally {
      await dbConnection.disconnect();
      process.exit(0);
    }
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  const migration = new DataMigration();
  migration.run().catch(console.error);
}

module.exports = DataMigration;
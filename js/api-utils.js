// Dynamic API Base URL - automatically detects environment
const API_BASE_URL = (() => {
  // Detect if we're in development or production
  const isDevelopment = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('dev');
  
  // Return appropriate API URL
  return isDevelopment 
    ? 'http://localhost:3000/api'
    : `${window.location.protocol}//${window.location.host}/api`;
})();

// Utility class for API calls
class TraowlAPI {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Generic fetch method with error handling
  async fetchData(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Hot Locations API
  async getHotLocations() {
    return this.fetchData('/hot-locations');
  }

  async getHotLocationById(id) {
    return this.fetchData(`/hot-locations/${id}`);
  }

  // Upcoming Trips API
  async getUpcomingTrips() {
    return this.fetchData('/upcoming-trips');
  }

  async getUpcomingTripById(id) {
    return this.fetchData(`/upcoming-trips/${id}`);
  }

  // Top Destinations API
  async getTopDestinations() {
    return this.fetchData('/top-destinations');
  }

  async getTopDestinationsByCategory(category) {
    return this.fetchData(`/top-destinations/category/${category}`);
  }

  async getTopDestinationById(id) {
    return this.fetchData(`/top-destinations/${id}`);
  }

  // Activities API
  async getActivities() {
    return this.fetchData('/activities');
  }

  async getActivitiesPage() {
    return this.fetchData('/activities-page');
  }

  async getActivitiesByCategory(category) {
    return this.fetchData(`/activities/category/${category}`);
  }

  async getActivityById(id) {
    return this.fetchData(`/activities/${id}`);
  }

  // Spiritual Tours API
  async getSpiritualTours() {
    return this.fetchData('/spiritual-tours');
  }

  async getSpiritualToursByCategory(category) {
    return this.fetchData(`/spiritual-tours/category/${category}`);
  }

  async getSpiritualTourById(id) {
    return this.fetchData(`/spiritual-tours/${id}`);
  }

  // Weekend Trips API
  async getWeekendTrips() {
    return this.fetchData('/weekend-trips');
  }

  async getWeekendTripById(id) {
    return this.fetchData(`/weekend-trips/${id}`);
  }

  async getWeekendTripsByDestination(destination) {
    return this.fetchData(`/weekend-trips/destination/${destination}`);
  }

  // Domestic Trips API
  async getDomesticTrips() {
    return this.fetchData('/domestic-trips');
  }

  async getDomesticTripById(id) {
    return this.fetchData(`/domestic-trips/${id}`);
  }

  async getDomesticTripsByDestination(destination) {
    return this.fetchData(`/domestic-trips/destination/${destination}`);
  }

  // Corporate Trips API
  async getCorporateTrips() {
    return this.fetchData('/corporate-trips');
  }

  async getCorporateTripsHero() {
    return this.fetchData('/corporate-trips/hero');
  }

  async getCorporateTripsPartners() {
    return this.fetchData('/corporate-trips/partners');
  }

  async getCorporateTripsFeatures() {
    return this.fetchData('/corporate-trips/features');
  }

  async getCorporateTripsDestinations() {
    return this.fetchData('/corporate-trips/destinations');
  }

  // Blogs API
  async getBlogs() {
    return this.fetchData('/blogs');
  }

  async getBlogById(id) {
    return this.fetchData(`/blogs/${id}`);
  }

  async getBlogsByCategory(category) {
    return this.fetchData(`/blogs/category/${category}`);
  }

  // Search API
  async search(query, type = null) {
    const params = new URLSearchParams({ q: query });
    if (type) {
      params.append('type', type);
    }
    return this.fetchData(`/search?${params.toString()}`);
  }

  // Header and Footer API
  async getHeader() {
    return this.fetchData('/header');
  }

  async getFooter() {
    return this.fetchData('/footer');
  }

  // Health check
  async healthCheck() {
    return this.fetchData('/health');
  }
}

// Create a global instance
const traowlAPI = new TraowlAPI();

// Utility functions for common operations

// Load hot locations and populate the grid
async function loadHotLocations() {
  try {
    const data = await traowlAPI.getHotLocations();
    return data.hotLocations;
  } catch (error) {
    console.error('Failed to load hot locations:', error);
    return [];
  }
}

// Load upcoming trips and populate the grid
async function loadUpcomingTrips() {
  try {
    const data = await traowlAPI.getUpcomingTrips();
    return data.upcomingTrips;
  } catch (error) {
    console.error('Failed to load upcoming trips:', error);
    return [];
  }
}

// Load top destinations and populate the grid
async function loadTopDestinations() {
  try {
    const data = await traowlAPI.getTopDestinations();
    return data.topDestinations;
  } catch (error) {
    console.error('Failed to load top destinations:', error);
    return [];
  }
}

// Load activities and populate the grid
async function loadActivities() {
  try {
    const data = await traowlAPI.getActivities();
    return data.activities || [];
  } catch (error) {
    console.error('Failed to load activities:', error);
    return [];
  }
}

// Load activities for activities page
async function loadActivitiesPage() {
  try {
    const data = await traowlAPI.getActivitiesPage();
    return data.activities || [];
  } catch (error) {
    console.error('Failed to load activities page data:', error);
    return [];
  }
}

// Load spiritual tours and populate the grid
async function loadSpiritualTours() {
  try {
    const data = await traowlAPI.getSpiritualTours();
    return data.spiritualTours;
  } catch (error) {
    console.error('Failed to load spiritual tours:', error);
    return [];
  }
}

// Load weekend trips and populate the grid
async function loadWeekendTrips() {
  try {
    const data = await traowlAPI.getWeekendTrips();
    return data.weekendTrips;
  } catch (error) {
    console.error('Failed to load weekend trips:', error);
    return [];
  }
}

// Load domestic trips and populate the grid
async function loadDomesticTrips() {
  try {
    const data = await traowlAPI.getDomesticTrips();
    return data.domesticTrips;
  } catch (error) {
    console.error('Failed to load domestic trips:', error);
    return [];
  }
}

// Load corporate trips and populate the grid
async function loadCorporateTrips() {
  try {
    const data = await traowlAPI.getCorporateTrips();
    return data.corporateTrips;
  } catch (error) {
    console.error('Failed to load corporate trips:', error);
    return [];
  }
}

// Load blogs and populate the grid
async function loadBlogs() {
  try {
    const data = await traowlAPI.getBlogs();
    return data.blogs || [];
  } catch (error) {
    console.error('Failed to load blogs:', error);
    return [];
  }
}

// Load header content
async function loadHeader() {
  try {
    const data = await traowlAPI.getHeader();
    return data.header;
  } catch (error) {
    console.error('Failed to load header:', error);
    return null;
  }
}

// Load footer content
async function loadFooter() {
  try {
    const data = await traowlAPI.getFooter();
    return data.footer;
  } catch (error) {
    console.error('Failed to load footer:', error);
    return null;
  }
}

// Search functionality
async function performSearch(query, type = null) {
  try {
    const data = await traowlAPI.search(query, type);
    return data.results;
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
}

// Helper function to create HTML elements from data
function createHotLocationCard(location) {
  // Use optimized image with generation logic
  const optimizedImage = window.ImageUtils ? 
      window.ImageUtils.getOptimizedImage(location.image, 'images/hot1.webp') : 
      { url: location.image ? encodeURI(location.image) : 'images/hot1.webp' };
  
  return `
    <div class="hot-location-card">
      <img src="${optimizedImage.url}" alt="${location.title}" 
           onerror="this.onerror=null; this.src='images/hot1.webp'; console.warn('Image failed to load: ${location.image}');" />
      <div class="hot-location-info">
        <h3>${location.title}</h3>
        <p>${location.description}</p>
        <div class="trip-price">
          <span>${location.currency}${location.price}</span>/Person
        </div>
        <button class="book-now-btn">Book Now</button>
      </div>
    </div>
  `;
}

function createUpcomingTripCard(trip) {
  const monthsFromDates = trip.joinDates.map(d => d.split(' ')[1]).filter(m => m).join(',').toLowerCase();
  // Use optimized image with generation logic
  const optimizedImage = window.ImageUtils ? 
      window.ImageUtils.getOptimizedImage(trip.image, 'images/upcomingMain.webp') : 
      { url: trip.image ? encodeURI(trip.image) : 'images/upcomingMain.webp' };
  return `
    <div class="tour-card" data-duration="${trip.duration.split(' ')[0]}" data-destination="${trip.destination}" data-triptype="group" data-price="${trip.price}" data-months="${monthsFromDates}">
      <div class="card-img" style="background-image: url(${optimizedImage.url});"></div>
      <div class="card-content">
        <div class="card-info">
          <span><i class="ri-time-line"></i> ${trip.duration}</span>
        </div>
        <div class="card-title">${trip.title}</div>
        <div class="card-description">${trip.description}</div>
        <div class="card-price">${trip.currency} ${trip.price.toLocaleString()}/- <span>per person</span></div>
        ${trip.oldPrice ? `<div class="old-price">${trip.currency} ${trip.oldPrice.toLocaleString()}/-</div>` : ''}
        <div class="card-join">Join on : ${trip.joinDates.join(', ')}</div>
        <div class="card-difficulty">Difficulty: <strong>${trip.difficulty}</strong></div>
        <div class="card-suitable">Best Time: <strong>${trip.bestTime}</strong></div>
        ${trip.highlights ? `
          <div class="card-highlights">
            <strong>Highlights:</strong>
            <ul>
              ${trip.highlights.map(highlight => `<li>${highlight}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        <a class="book-btn" href="trip-detail.html?type=upcoming&id=${trip.id}">Book Now</a>
      </div>
    </div>
  `;
}

function createTopDestinationCard(destination) {
  // Use optimized image with generation logic
  const optimizedImage = window.ImageUtils ? 
      window.ImageUtils.getOptimizedImage(destination.image, 'images/top1.webp') : 
      { url: destination.image ? encodeURI(destination.image) : 'images/top1.webp' };
  
  return `
    <div class="top-destination-card ${destination.cardClass}" data-category="${destination.category}">
      <img src="${optimizedImage.url}" alt="${destination.title} - ${destination.description}" 
           onerror="this.onerror=null; this.src='images/top1.webp'; console.warn('Image failed to load: ${destination.image}');" />
      <div class="top-destination-overlay">
        <div class="top-destination-title">${destination.title}</div>
        <div class="top-destination-desc">${destination.description}</div>
      </div>
    </div>
  `;
}

function createActivityCard(activity) {
  // Encode image URL to handle spaces in filenames
  const encodedImageUrl = activity.image ? encodeURI(activity.image) : 'images/adventure1.webp';
  
  return `
    <a href="activity-detail.html?activity=${encodeURIComponent(activity.name)}" class="activity-category-card">
      <img src="${encodedImageUrl}" alt="${activity.name}" class="activity-category-card-img">
      <div class="activity-category-card-overlay"></div>
      <h3 class="activity-category-card-title">${activity.name}</h3>
    </a>
  `;
}

function createSpiritualTourCard(tour) {
  // Encode image URL to handle spaces in filenames
  const encodedImageUrl = tour.image ? encodeURI(tour.image) : 'images/spiritual-hero.webp';
  
  return `
    <div class="tour-card">
      <div class="card-img" style="background-image: url(${encodedImageUrl});"></div>
      <div class="card-content">
        <div class="card-info">
          <span><i class="ri-time-line"></i> ${tour.duration}</span>
          ${tour.location ? `<span><i class="ri-map-pin-line"></i> ${tour.location}</span>` : ''}
        </div>
        <div class="card-title">${tour.title}</div>
        <div class="card-description">${tour.description}</div>
        <div class="card-price">${tour.currency}${tour.price}/- <span>per person</span></div>
        <a class="book-btn" href="trip-detail.html?type=spiritual&id=${tour.id || ''}">Book Now</a>
      </div>
    </div>
  `;
}

function createWeekendTripCard(trip) {
  // Encode image URL to handle spaces in filenames
  const encodedImageUrl = trip.image ? encodeURI(trip.image) : 'images/weekendMain.webp';
  return `
    <div class="tour-card" data-duration="${trip.duration.split(',')[0].split(' ')[0]}" data-destination="${trip.destination}">
      <div class="card-img" style="background-image: url(${encodedImageUrl});"></div>
      <div class="card-content">
        <div class="card-info">
          <span><i class="ri-time-line"></i> ${trip.duration}</span>
        </div>
        <div class="card-title">${trip.title}</div>
        <div class="card-price">${trip.currency} ${trip.price.toLocaleString()}/- <span>per person</span></div>
        <div class="card-join">Join on : ${trip.joinDates.join(', ')}</div>
        <a class="book-btn">Book Now</a>
      </div>
    </div>
  `;
}

function createDomesticTripCard(trip) {
  // Encode image URL to handle spaces in filenames
  const encodedImageUrl = trip.image ? encodeURI(trip.image) : 'images/domesticMain.webp';
  
  return `
    <div class="tour-card" data-duration="${trip.duration.split(',')[0].split(' ')[0]}" data-destination="${trip.destination}">
      <div class="card-img" style="background-image: url(${encodedImageUrl});"></div>
      <div class="card-content">
        <div class="card-info">
          <span><i class="ri-time-line"></i> ${trip.duration}</span>
        </div>
        <div class="card-title">${trip.title}</div>
        <div class="card-price">${trip.currency} ${trip.price.toLocaleString()}/- <span>per person</span></div>
        <div class="card-join">Join on : ${trip.joinDates.join(', ')}</div>
        <a class="book-btn">Book Now</a>
      </div>
    </div>
  `;
}

function createCorporateTripCard(destination) {
  // Encode image URL to handle spaces in filenames
  const encodedImageUrl = destination.image ? encodeURI(destination.image) : 'images/corpoImg.webp';
  
  return `
    <div class="corporate-destination-card">
      <img src="${encodedImageUrl}" alt="${destination.title}" />
      <div class="corporate-destination-info">
        <h3>${destination.title}</h3>
        <p>${destination.description}</p>
        <div class="trip-details">
          <span class="duration">${destination.duration}</span>
        </div>
        <div class="trip-price">
          <span>${destination.currency}${destination.price.toLocaleString()}</span>/Person
        </div>
        <button class="book-now-btn">Book Now</button>
      </div>
    </div>
  `;
}

function createBlogCard(blog) {
  // Encode image URL to handle spaces in filenames
  const encodedImageUrl = blog.image ? encodeURI(blog.image) : 'images/blog1.webp';
  
  return `
    <div class="blog-card">
      <img src="${encodedImageUrl}" alt="${blog.title}" class="blog-card-img">
      <div class="blog-info">
        <h3>${blog.title}</h3>
        <span class="blog-date">${blog.date}</span>
        <p>${blog.summary}</p>
        <button class="read-more" data-id="${blog.id}">Read More</button>
      </div>
    </div>
  `;
}

// Function to fetch blog details
async function fetchBlogDetails(blogId) {
  try {
    const response = await fetch(`${API_BASE_URL}/blog-details/${blogId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch blog details');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching blog details:', error);
    throw error;
  }
}

// Function to render blog details
function renderBlogDetails(blog, heroContainerId, contentContainerId) {
  const heroContainer = document.getElementById(heroContainerId);
  const contentContainer = document.getElementById(contentContainerId);
  
  if (heroContainer) {
    // Encode image URL to handle spaces in filenames
    const encodedImageUrl = blog.image ? encodeURI(blog.image) : 'images/blog1.webp';
    
    heroContainer.innerHTML = `
      <div class="blog-detail-hero" style="background-image:url('${encodedImageUrl}')">
        <div class="blog-detail-hero-overlay"></div>
        <div class="blog-detail-hero-content">
          <h1>${blog.title}</h1>
          <div class="blog-meta">
            <span class="blog-date">${blog.date}</span>
            <span class="blog-author">By ${blog.author}</span>
            <span class="blog-read-time">${blog.readTime}</span>
          </div>
          <div class="blog-tags">
            ${blog.tags ? blog.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
          </div>
        </div>
      </div>
    `;
  }
  
  if (contentContainer) {
    contentContainer.innerHTML = `
      <div class="blog-detail-content">
        <div class="blog-content-text">
          ${blog.content.split('\n\n').map(paragraph => `<p>${paragraph}</p>`).join('')}
        </div>
        <div class="blog-sidebar">
          <div class="blog-info">
            <h3>Blog Information</h3>
            <p><strong>Category:</strong> ${blog.category}</p>
            <p><strong>Author:</strong> ${blog.author}</p>
            <p><strong>Read Time:</strong> ${blog.readTime}</p>
            <p><strong>Published:</strong> ${blog.date}</p>
          </div>
        </div>
      </div>
    `;
  }
}

// Function to fetch activity details
async function fetchActivityDetails(activityName) {
  try {
    const response = await fetch(`${API_BASE_URL}/activity-details/${activityName}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch activity details');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching activity details:', error);
    throw error;
  }
}

// Function to render activity details
function renderActivityDetails(activityData, heroContainerId, gridContainerId) {
  const heroContainer = document.getElementById(heroContainerId);
  const gridContainer = document.getElementById(gridContainerId);
  
  if (heroContainer) {
    const mainImage = activityData.bookingOptions.length > 0 ? activityData.bookingOptions[0].image : '';
    // Encode image URL to handle spaces in filenames
    const encodedMainImage = mainImage ? encodeURI(mainImage) : 'images/adventure1.webp';
    heroContainer.style.backgroundImage = `url('${encodedMainImage}')`;
    
    const titleElement = heroContainer.querySelector('h1') || heroContainer.querySelector('#activityTitle');
    if (titleElement) {
      titleElement.textContent = activityData.activity;
    }
  }
  
  if (gridContainer) {
    if (activityData.bookingOptions.length > 0) {
      gridContainer.innerHTML = activityData.bookingOptions.map(option => {
        // Encode image URL to handle spaces in filenames
        const encodedImageUrl = option.image ? encodeURI(option.image) : 'images/adventure1.webp';
        
        return `
          <div class="booking-card">
            <img src="${encodedImageUrl}" alt="${option.location}" class="booking-card-img">
            <div class="booking-card-info">
              <h3>${option.location}</h3>
              <p>${option.details}</p>
              <div class="booking-details">
                <span class="duration">${option.duration}</span>
                <span class="difficulty">${option.difficulty}</span>
                <span class="best-time">${option.bestTime}</span>
              </div>
              <div class="inclusions">
                <strong>Included:</strong> ${option.inclusions.join(', ')}
              </div>
              <div class="booking-card-footer">
                <span class="booking-price">₹${option.price}</span>
                <button class="btn-book" data-location="${option.location}" data-price="${option.price}">Book Now</button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    } else {
      gridContainer.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">No booking options currently available for this activity. Please check back soon!</p>';
    }
  }
}

// Function to fetch booking package details
async function fetchBookingPackage(packageId) {
  try {
    const response = await fetch(`${API_BASE_URL}/booking-packages/${packageId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch booking package');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching booking package:', error);
    throw error;
  }
}

// Function to render booking package details
function renderBookingPackage(package, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = `
    <div class="booking-package-details">
      <div class="package-header">
        <h1>${package.title}</h1>
        <div class="package-meta">
          <span class="duration">${package.duration}</span>
          <span class="pickup">Pickup: ${package.pickupLocation}</span>
          <span class="difficulty">${package.difficulty}</span>
        </div>
        <div class="package-price">
          <span class="old-price">${package.currency}${package.oldPrice}</span>
          <span class="new-price">${package.currency}${package.price}</span>
        </div>
      </div>
      
      <div class="package-description">
        <p>${package.description}</p>
      </div>
      
      <div class="package-features">
        <h3>What's Included</h3>
        <ul>
          ${package.included.map(item => `<li>${item}</li>`).join('')}
        </ul>
        
        <h3>What's Not Included</h3>
        <ul>
          ${package.excluded.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
      
      <div class="package-itinerary">
        <h3>Itinerary</h3>
        ${package.itinerary.map(day => `
          <div class="day-item">
            <h4>Day ${day.day}: ${day.title}</h4>
            <ul>
              ${day.activities.map(activity => `<li>${activity}</li>`).join('')}
            </ul>
            <div class="day-details">
              <span class="stay">Stay: ${day.stay}</span>
              <span class="meals">Meals: ${day.meals}</span>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="package-highlights">
        <h3>Highlights</h3>
        <ul>
          ${package.highlights.map(highlight => `<li>${highlight}</li>`).join('')}
        </ul>
      </div>
      
      <div class="package-info">
        <h3>Important Information</h3>
        <ul>
          ${package.importantInfo.map(info => `<li>${info}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
}

// Function to fetch city package details
async function fetchCityPackage(packageId) {
  try {
    const response = await fetch(`${API_BASE_URL}/city-packages/${packageId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch city package');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching city package:', error);
    throw error;
  }
}

// Function to render city package details
function renderCityPackage(package, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = `
    <div class="city-package-details">
      <div class="package-header">
        <h1>${package.title}</h1>
        <div class="package-meta">
          <span class="duration">${package.duration}</span>
          <span class="pickup">Pickup: ${package.pickupLocation}</span>
          <span class="difficulty">${package.difficulty}</span>
        </div>
        <div class="package-price">
          <span class="old-price">${package.currency}${package.oldPrice}</span>
          <span class="new-price">${package.currency}${package.price}</span>
        </div>
      </div>
      
      <div class="package-description">
        <p>${package.description}</p>
      </div>
      
      <div class="package-features">
        <h3>Package Features</h3>
        <div class="features-grid">
          <div class="feature-item">
            <span class="feature-icon">🚌</span>
            <h4>Transportation</h4>
            <p>${package.features.transportation}</p>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🍽️</span>
            <h4>Meals</h4>
            <p>${package.features.meals}</p>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🛏️</span>
            <h4>Stay</h4>
            <p>${package.features.stay}</p>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🔭</span>
            <h4>Sightseeing</h4>
            <p>${package.features.sightseeing}</p>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📞</span>
            <h4>24x7 Assistance</h4>
            <p>${package.features.assistance}</p>
          </div>
        </div>
      </div>
      
      <div class="package-itinerary">
        <h3>Itinerary</h3>
        ${package.itinerary.map(day => `
          <div class="day-item">
            <h4>Day ${day.day}: ${day.title}</h4>
            <ul>
              ${day.activities.map(activity => `<li>${activity}</li>`).join('')}
            </ul>
            <div class="day-details">
              <span class="stay">Stay: ${day.stay}</span>
              <span class="meals">Meals: ${day.meals}</span>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="package-highlights">
        <h3>Highlights</h3>
        <ul>
          ${package.highlights.map(highlight => `<li>${highlight}</li>`).join('')}
        </ul>
      </div>
      
      <div class="package-other-info">
        <h3>Other Information</h3>
        <div class="info-grid">
          <div class="info-item">
            <strong>Best Time:</strong> ${package.otherInfo.bestTime}
          </div>
          <div class="info-item">
            <strong>Weather:</strong> ${package.otherInfo.weather}
          </div>
          <div class="info-item">
            <strong>Altitude:</strong> ${package.otherInfo.altitude}
          </div>
          <div class="info-item">
            <strong>Clothing:</strong> ${package.otherInfo.clothing}
          </div>
          <div class="info-item">
            <strong>Medical:</strong> ${package.otherInfo.medical}
          </div>
          <div class="info-item">
            <strong>Photography:</strong> ${package.otherInfo.photography}
          </div>
        </div>
      </div>
      
      <div class="package-info">
        <h3>Important Information</h3>
        <ul>
          ${package.importantInfo.map(info => `<li>${info}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TraowlAPI,
    traowlAPI,
    loadHotLocations,
    loadUpcomingTrips,
    loadTopDestinations,
    loadActivities,
  loadActivitiesPage,
    loadSpiritualTours,
    loadWeekendTrips,
    loadDomesticTrips,
    loadCorporateTrips,
    loadBlogs,
    performSearch,
    createHotLocationCard,
    createUpcomingTripCard,
    createTopDestinationCard,
    createActivityCard,
    createSpiritualTourCard,
    createWeekendTripCard,
    createDomesticTripCard,
    createCorporateTripCard,
    createBlogCard,
    fetchBlogDetails,
    renderBlogDetails,
    fetchActivityDetails,
    renderActivityDetails
  };
} 
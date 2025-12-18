// Family trips data - will be loaded from API
let familyTrips = [];

// Load family trips from API
async function loadFamilyTrips() {
  try {
    console.log('Loading family trips from API...');
    const response = await fetch('/api/family-trips');
    console.log('API Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API Data received:', data);
    
    familyTrips = data.familyTrips || [];
    console.log('Family trips loaded:', familyTrips.length, 'trips');
    
    if (familyTrips.length === 0) {
      console.log('No family trips found in API data, using fallback');
      throw new Error('No family trips data available');
    }
    
    renderTrips(familyTrips, '.tour-cards');
  } catch (error) {
    console.error('Error loading family trips:', error);
    console.log('API failed, showing error message...');
    // Show error message instead of fallback data
    const cardsContainer = document.querySelector('.tour-cards');
    if (cardsContainer) {
      cardsContainer.innerHTML = '<div class="error-text">Failed to load family trips. Please try again later.</div>';
    }
  }
}



// Enhanced render function for API data
function renderTrips(trips, containerSelector) {
  const cardsContainer = document.querySelector(containerSelector);
  if (!cardsContainer) return;
  
  // Show loading with typewriter effect
  cardsContainer.innerHTML = '<div class="loading-text"><span class="typewriter">Loading trips...</span></div>';
  
  if (!trips || trips.length === 0) {
    cardsContainer.innerHTML = '<div class="loading-text">No family trips available at the moment.</div>';
    return;
  }
  
  // Trip type is always family for this page
  const tripType = 'family';
  
  cardsContainer.innerHTML = '';
  trips.forEach(trip => {
    const card = document.createElement('div');
    card.className = 'tour-card';
    card.setAttribute('data-duration', trip.duration ? parseInt(trip.duration.split(' ')[0]) : 3);
    
    // Format price for display
    const price = trip.price ? `₹ ${trip.price.toLocaleString()}/-` : '₹ 15,000/-';
    const oldPrice = trip.oldPrice ? `₹ ${trip.oldPrice.toLocaleString()}/-` : '';
    
    // Highlights section removed to reduce card size
    
    // Difficulty section removed to reduce card size
    // Suitable for section removed
    
    // Determine the correct link for the book button
    const bookLink = trip.id ? 
      `trip-detail.html?type=${tripType}&id=${trip.id}` : 
      (trip.bookLink || 'booking.html');
    
    // Debug image loading
    console.log('Family Trip:', trip.title, 'Image:', trip.image);
    
    // Use optimized image with generation logic
    const fallbackImage = 'images/familytripMain.webp';
    const optimizedImage = window.ImageUtils ? 
        window.ImageUtils.getOptimizedImage(trip.image, fallbackImage) : 
        { url: trip.image ? encodeURI(trip.image) : fallbackImage };
    
    card.innerHTML = `
      <div class="card-img" style="background-image: url(${optimizedImage.url});"></div>
      <div class="card-content">
        <div class="card-info">
          <span><i class="ri-time-line"></i> ${trip.duration || '3 Days, 2 Nights'}</span>
          ${trip.destination ? `<span><i class="ri-map-pin-line"></i> ${trip.destination}</span>` : ''}
        </div>
        <div class="card-title">${trip.title}</div>
        <div class="card-description">${trip.description || 'Amazing family adventure awaits!'}</div>
        <div class="card-price">
          ${price} <span>per person</span>
          ${oldPrice ? `<div class="old-price">${oldPrice}</div>` : ''}
        </div>
        <div class="card-join">Join on: ${trip.joinDates ? trip.joinDates.join(', ') : 'Flexible dates'}</div>
        <a class="book-btn" href="${bookLink}">Book Now</a>
      </div>
    `;
    cardsContainer.appendChild(card);
  });
}

// Show more/less for about section
const showMoreBtn = document.getElementById('showMoreBtn');
const moreContent = document.getElementById('moreContent');

showMoreBtn.addEventListener('click', function(e) {
    e.preventDefault();
    if (moreContent.style.display === 'none' || moreContent.style.display === '') {
        moreContent.style.display = 'inline';
        showMoreBtn.textContent = 'Show less';
    } else {
        moreContent.style.display = 'none';
        showMoreBtn.textContent = 'Show more';
        window.scrollTo({ top: document.querySelector('.about-section').offsetTop, behavior: 'smooth' });
    }
});

// Destination filter for family trips
const destinationSelect = document.getElementById('destination-select');
destinationSelect.addEventListener('change', function() {
  const selectedDestination = this.value;
  if (!selectedDestination) {
    renderTrips(familyTrips, '.tour-cards');
  } else {
    const filtered = familyTrips.filter(tour => 
      tour.destination && tour.destination.toLowerCase().includes(selectedDestination.toLowerCase())
    );
    renderTrips(filtered, '.tour-cards');
  }
});

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  if (window.commonComponents) {
    window.commonComponents.init();
  }
  loadFamilyTrips();
}); 
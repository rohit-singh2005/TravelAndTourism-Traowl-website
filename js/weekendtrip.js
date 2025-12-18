// Show more/less functionality for about section
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

// Load weekend trips from API
async function loadWeekendTrips() {
  try {
    const response = await fetch('/api/weekend-trips');
    const data = await response.json();
    console.log('Loaded weekend trips:', data);
    return data.weekendTrips || [];
  } catch (error) {
    console.error('Error loading weekend trips:', error);
    return [];
  }
}

// Enhanced render function for API data
function renderTrips(trips, containerSelector) {
  const cardsContainer = document.querySelector(containerSelector);
  if (!cardsContainer) return;
  
  // Show loading spinner
  cardsContainer.innerHTML = '<div class="loading-spinner">Loading trips...</div>';
  
  if (!trips || trips.length === 0) {
    cardsContainer.innerHTML = '<div class="no-trips">No trips available at the moment.</div>';
    return;
  }
  
  cardsContainer.innerHTML = '';
  trips.forEach(trip => {
    const card = document.createElement('div');
    card.className = 'tour-card';
    card.setAttribute('data-duration', trip.duration ? parseInt(trip.duration.split(' ')[0]) : 3);
    card.setAttribute('data-destination', trip.destination || '');
    
    // Format price for display
    const price = trip.price ? `₹ ${trip.price.toLocaleString()}/-` : '₹ 15,000/-';
    const oldPrice = trip.oldPrice ? `₹ ${trip.oldPrice.toLocaleString()}/-` : '';
    
    // Highlights section removed to reduce card size
    
    // Difficulty section removed to reduce card size
    const suitableFor = trip.suitableFor ? `<div class="card-suitable"><strong>Suitable for:</strong> ${trip.suitableFor}</div>` : '';
    
    // Determine the correct link for the book button
    const bookLink = trip.id ? 
      `trip-detail.html?type=weekend&id=${trip.id}` : 
      'booking.html';
    
    // Use optimized image with generation logic
    const optimizedImage = window.ImageUtils ? 
        window.ImageUtils.getOptimizedImage(trip.image, 'images/weekendMain.webp') : 
        { url: trip.image ? encodeURI(trip.image) : 'images/weekendMain.webp' };
    
    card.innerHTML = `
      <div class="card-img" style="background-image: url(${optimizedImage.url});"></div>
      <div class="card-content">
        <div class="card-content-wrapper">
          <div class="card-info">
            <span><i class="ri-time-line"></i> ${trip.duration || '3 Days, 2 Nights'}</span>
            ${trip.destination ? `<span><i class="ri-map-pin-line"></i> ${trip.destination}</span>` : ''}
          </div>
          <div class="card-title">${trip.title}</div>
          <div class="card-description">${trip.description || 'Perfect weekend getaway awaits!'}</div>
          <div class="card-price">
            ${price} <span>per person</span>
            ${oldPrice ? `<div class="old-price">${oldPrice}</div>` : ''}
          </div>
          <div class="card-join">Join on: ${trip.joinDates ? trip.joinDates.join(', ') : 'Flexible dates'}</div>
          ${suitableFor}
        </div>
        <a class="book-btn" href="${bookLink}">Book Now</a>
      </div>
    `;
    cardsContainer.appendChild(card);
  });
}

// Load and display weekend trips from API
async function displayWeekendTrips() {
    try {
        const weekendTrips = await loadWeekendTrips();
        console.log('Displaying weekend trips:', weekendTrips.length);
        renderTrips(weekendTrips, '#weekendTripsGrid');
        
        // Initialize filtering after cards are loaded
        initializeWeekendTripsFilters();
        
    } catch (error) {
        console.error('Error loading weekend trips:', error);
        document.getElementById('weekendTripsGrid').innerHTML = 
            '<p style="text-align: center; grid-column: 1/-1;">Failed to load weekend trips. Please try again later.</p>';
    }
}

// Initialize destination filtering
function initializeWeekendTripsFilters() {
    const destinationSelect = document.getElementById('destination-select');
    const allTourCards = document.querySelectorAll('.tour-card');

    function showFilteredTours(destination) {
        allTourCards.forEach(card => {
            if (!destination || card.getAttribute('data-destination') === destination) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Destination filter
    destinationSelect.addEventListener('change', function() {
        const selectedDestination = this.value;
        showFilteredTours(selectedDestination);
    });
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  if (window.commonComponents) {
    window.commonComponents.init();
  }
  displayWeekendTrips();
});


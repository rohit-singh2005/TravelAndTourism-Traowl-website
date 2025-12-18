// Double-thumb price range slider logic
const priceMinRange = document.getElementById('priceMinRange');
const priceMaxRange = document.getElementById('priceMaxRange');
const priceMinValue = document.getElementById('priceMin');
const priceMaxValue = document.getElementById('priceMax');

function updatePriceSlider() {
    let min = parseInt(priceMinRange.value);
    let max = parseInt(priceMaxRange.value);
    if (min > max) {
        min = max;
        priceMinRange.value = min;
    }
    if (max < min) {
        max = min;
        priceMaxRange.value = max;
    }
    priceMinValue.textContent = '₹' + (min === 0 ? '0' : min.toLocaleString());
    priceMaxValue.textContent = '₹' + (max === 100000 ? '1,00,000' : max.toLocaleString());
    updatePriceSliderTrack();
}

function updatePriceSliderTrack() {
    const min = parseInt(priceMinRange.value);
    const max = parseInt(priceMaxRange.value);
    const range = priceMaxRange.max - priceMinRange.min;
    const minPercent = ((min - parseInt(priceMinRange.min)) / range) * 100;
    const maxPercent = ((max - parseInt(priceMinRange.min)) / range) * 100;
    const gradient = `linear-gradient(to right, #e0e0e0 0%, #e0e0e0 ${minPercent}%, #f6b21b ${minPercent}%, #f6b21b ${maxPercent}%, #e0e0e0 ${maxPercent}%, #e0e0e0 100%)`;
    priceMinRange.setAttribute('style', `background: ${gradient} !important`);
    priceMaxRange.setAttribute('style', `background: ${gradient} !important`);
}

if (priceMinRange && priceMaxRange) {
    priceMinRange.addEventListener('input', updatePriceSlider);
    priceMaxRange.addEventListener('input', updatePriceSlider);
    updatePriceSlider();
}

window.addEventListener('load', function() {
  if (typeof updatePriceSlider === 'function') updatePriceSlider();
});

// Single price range slider value update with dynamic color
const priceRange = document.getElementById('priceRange');
const priceValue = document.getElementById('priceValue');
if (priceRange && priceValue) {
    priceRange.addEventListener('input', function() {
        priceValue.textContent = '₹' + (this.value == 100000 ? '1,00,000' : Number(this.value).toLocaleString());
        updateSliderColor(this, 0, 100000);
    });
    // Initialize color
    updateSliderColor(priceRange, 0, 100000);
}

// Duration slider with dynamic color
const durationRange = document.getElementById('durationRange');
const durationValue = document.getElementById('durationValue');
if (durationRange && durationValue) {
    durationRange.addEventListener('input', function() {
        durationValue.textContent = this.value + (this.value == 1 ? ' Day' : ' Days');
        updateSliderColor(this, 1, 15);
    });
    // Initialize color
    updateSliderColor(durationRange, 1, 15);
}

// Function to update slider background color dynamically
function updateSliderColor(slider, min, max) {
    if (!slider) return;
    
    const value = parseInt(slider.value);
    const percentage = ((value - min) / (max - min)) * 100;
    
    // Create gradient where yellow intensity INCREASES as value increases
    // At 0%: Light yellow (basic options)
    // At 100%: Strong yellow (premium/longer options)
    const startOpacity = 0.2 + (percentage / 100) * 0.7; // From 0.2 to 0.9
    const endOpacity = 0.1 + (percentage / 100) * 0.4;   // From 0.1 to 0.5
    
    const gradient = `linear-gradient(to right, 
        rgba(246, 178, 27, ${Math.max(0.1, endOpacity)}) 0%, 
        rgba(246, 178, 27, ${Math.max(0.2, startOpacity)}) ${percentage}%, 
        #e8e8e8 ${percentage}%, 
        #e8e8e8 100%)`;
    
    // Use setProperty with important to override CSS
    slider.style.setProperty('background', gradient, 'important');
}

// Load and display upcoming trips from API
async function displayUpcomingTrips() {
    try {
        const upcomingTrips = await loadUpcomingTrips();
        const upcomingTripsGrid = document.getElementById('upcomingTripsGrid');
        
        if (!upcomingTrips || upcomingTrips.length === 0) {
            upcomingTripsGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No upcoming trips available at the moment.</p>';
            return;
        }
        
        // Store trips globally for filtering
        allTrips = upcomingTrips;
        
        // Clear existing content
        upcomingTripsGrid.innerHTML = '';
        
        // Render upcoming trips with image generation
        renderUpcomingTrips(upcomingTrips, '#upcomingTripsGrid');
        
        // Initialize filtering after cards are loaded
        initializeUpcomingTripsFilters();
        
    } catch (error) {
        console.error('Error loading upcoming trips:', error);
        document.getElementById('upcomingTripsGrid').innerHTML = 
            '<p style="text-align: center; grid-column: 1/-1;">Failed to load upcoming trips. Please try again later.</p>';
    }
}

// Initialize filtering functionality
function initializeUpcomingTripsFilters() {
    // Initialize all the existing filter functionality here
    // This will be called after the cards are loaded
}

function renderCards(data) {
  const container = document.querySelector('.tour-cards');
  if (!container) return;
  
  if (data.length === 0) {
    container.innerHTML = '<div style="padding:2em;text-align:center;color:#888;">No trips match your filters.</div>';
    return;
  }
  
  renderUpcomingTrips(data, '.tour-cards');
}

function getSelectedRadio(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : 'any';
}

// Global variable to store loaded trips
let allTrips = [];

// Enhanced render function for upcoming trips with image generation
function renderUpcomingTrips(trips, containerSelector) {
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
    card.setAttribute('data-duration', trip.duration ? parseInt(trip.duration.split(' ')[0]) : 8);
    card.setAttribute('data-destination', trip.destination || '');
    card.setAttribute('data-triptype', 'group');
    card.setAttribute('data-price', trip.price || 0);
    
    const monthsFromDates = trip.joinDates.map(d => d.split(' ')[1]).filter(m => m).join(',').toLowerCase();
    card.setAttribute('data-months', monthsFromDates);
    
    // Format price for display
    const price = trip.price ? `${trip.currency} ${trip.price.toLocaleString()}/-` : '₹ 25,000/-';
    const oldPrice = trip.oldPrice ? `${trip.currency} ${trip.oldPrice.toLocaleString()}/-` : '';
    
    // Highlights section removed to reduce card size
    
    // Difficulty section removed to reduce card size
    const suitableInfo = trip.bestTime ? `<div class="card-suitable">Best Time: <strong>${trip.bestTime}</strong></div>` : '';
    
    // Determine the correct link for the book button
    const bookLink = trip.id ? 
      `trip-detail.html?type=upcoming&id=${trip.id}` : 
      'booking.html';
    
    // Debug image loading
    console.log('Upcoming Trip:', trip.title, 'Image:', trip.image);
    
    // Use optimized image with generation logic
    const optimizedImage = window.ImageUtils ? 
        window.ImageUtils.getOptimizedImage(trip.image, 'images/upcomingMain.webp') : 
        { url: trip.image ? encodeURI(trip.image) : 'images/upcomingMain.webp' };
    
    card.innerHTML = `
      <div class="card-img" style="background-image: url(${optimizedImage.url});"></div>
      <div class="card-content">
        <div class="card-info">
          <span><i class="ri-time-line"></i> ${trip.duration || '8 Days, 7 Nights'}</span>
          ${trip.destination ? `<span><i class="ri-map-pin-line"></i> ${trip.destination}</span>` : ''}
        </div>
        <div class="card-title">${trip.title}</div>
        <div class="card-description">${trip.description || 'Amazing adventure awaits!'}</div>
        <div class="card-price">
          ${price} <span>per person</span>
          ${oldPrice ? `<div class="old-price">${oldPrice}</div>` : ''}
        </div>
        <div class="card-join">Join on: ${trip.joinDates ? trip.joinDates.join(', ') : 'Flexible dates'}</div>
        ${suitableInfo}
        <a class="book-btn" href="${bookLink}">Book Now</a>
      </div>
    `;
    cardsContainer.appendChild(card);
  });
}

function filterCards() {
  const search = document.getElementById('search-input').value.trim().toLowerCase();
  const destinationType = getSelectedRadio('destination');
  const triptype = getSelectedRadio('triptype');
  const month = getSelectedRadio('month');
  const duration = parseInt(document.getElementById('durationRange').value, 10);
  const price = parseInt(document.getElementById('priceRange').value, 10);

  const filtered = allTrips.filter(trip => {
    let show = true;
    if (search && !trip.title.toLowerCase().includes(search)) show = false;
    if (destinationType !== 'any' && trip.destination !== destinationType) show = false;
    if (triptype !== 'any' && 'group' !== triptype) show = false; // All upcoming trips are group trips
    if (month !== 'any' && !trip.joinDates.some(date => {
      const dateMonth = date.split(' ')[1]; // Get month from "20 July" format
      return dateMonth && dateMonth.toLowerCase() === month;
    })) show = false;
    if (parseInt(trip.duration.split(' ')[0]) > duration) show = false;
    if (trip.price > price) show = false;
    return show;
  });
  renderCards(filtered);
}

document.querySelectorAll('.filter-sidebar input').forEach(input => {
  input.addEventListener('input', filterCards);
  input.addEventListener('change', filterCards);
});
document.getElementById('search-input').addEventListener('input', filterCards);

const resetBtn = document.querySelector('.reset-filters-btn');
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    document.querySelector('input[name="destination"][value="any"]').checked = true;
    document.querySelector('input[name="triptype"][value="any"]').checked = true;
    document.querySelector('input[name="month"][value="any"]').checked = true;
    
    // Reset sliders and update their colors
    const durationSlider = document.getElementById('durationRange');
    const priceSlider = document.getElementById('priceRange');
    
    if (durationSlider) {
      durationSlider.value = 15;
      document.getElementById('durationValue').textContent = '15 Days';
      updateSliderColor(durationSlider, 1, 15);
    }
    
    if (priceSlider) {
      priceSlider.value = 100000;
      document.getElementById('priceValue').textContent = '₹1,00,000';
      updateSliderColor(priceSlider, 0, 100000);
    }
    
    filterCards();
  });
}

// Show More/Less functionality
const showMoreBtn = document.getElementById('showMoreBtn');
const moreContent = document.getElementById('moreContent');

if (showMoreBtn && moreContent) {
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
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  displayUpcomingTrips();
  
  // Initialize slider colors on page load with a small delay to ensure DOM is ready
  setTimeout(() => {
    const durationSlider = document.getElementById('durationRange');
    const priceSlider = document.getElementById('priceRange');
    
    if (durationSlider) {
      updateSliderColor(durationSlider, 1, 15);
    }
    
    if (priceSlider) {
      updateSliderColor(priceSlider, 0, 100000);
    }
  }, 100);
});

// Modal functionality for Sign In/Login
document.addEventListener('DOMContentLoaded', function() {
  const signInBtn = document.getElementById('signInBtn');
  const authModal = document.getElementById('authModal');
  const modalClose = document.getElementById('modalClose');

  // Open modal
  if (signInBtn) {
    signInBtn.addEventListener('click', function() {
      authModal.classList.add('active');
    });
  }

  // Close modal
  if (modalClose) {
    modalClose.addEventListener('click', function() {
      authModal.classList.remove('active');
    });
  }

  // Close modal when clicking outside
  if (authModal) {
    authModal.addEventListener('click', function(e) {
      if (e.target === authModal) {
        authModal.classList.remove('active');
      }
    });
  }

  // Close modal with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && authModal.classList.contains('active')) {
      authModal.classList.remove('active');
    }
  });
});

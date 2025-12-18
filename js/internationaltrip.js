// Initialize common components for header and footer
const commonComponents = new CommonComponents();

// Load header and footer when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
  await commonComponents.init();
  await loadInternationalTrips();
});

// Load international trips from API
async function loadInternationalTrips() {
  try {
    const response = await fetch('/api/international-trips');
    const data = await response.json();
    
    if (data && data.internationalTrips) {
      renderInternationalTrips(data.internationalTrips);
    }
  } catch (error) {
    console.error('Error loading international trips:', error);
  }
}

// Render international trips
function renderInternationalTrips(trips) {
  const tourCardsContainer = document.querySelector('.tour-cards');
  if (!tourCardsContainer) return;

  tourCardsContainer.innerHTML = trips.map(trip => {
    // Format price for display
    const price = trip.price ? `${trip.currency} ${trip.price.toLocaleString()}/-` : '₹ 25,000/-';
    const oldPrice = trip.originalPrice ? `${trip.currency} ${trip.originalPrice.toLocaleString()}/-` : '';
    
    // Use optimized image with generation logic
    const optimizedImage = window.ImageUtils ? 
        window.ImageUtils.getOptimizedImage(trip.image, 'images/background1.webp') : 
        { url: trip.image ? encodeURI(trip.image) : 'images/background1.webp' };

    return `
      <div class="tour-card" data-duration="${trip.duration.split(' ')[0]}" data-destination="${trip.category}" data-trip-id="${trip.id}">
        <div class="card-img" style="background-image: url('${optimizedImage.url}');"></div>
        <div class="card-content">
          <div class="card-info">
            <span><i class="ri-time-line"></i> ${trip.duration}</span>
            ${trip.destination ? `<span><i class="ri-map-pin-line"></i> ${trip.destination}</span>` : ''}
          </div>
          <div class="card-title">${trip.title}</div>
          <div class="card-description">${trip.description || 'Amazing international adventure awaits!'}</div>
          <div class="card-price">
            ${price} <span>per person</span>
            ${oldPrice ? `<div class="old-price">${oldPrice}</div>` : ''}
          </div>
          <div class="card-join">Join on: ${trip.joinDates ? trip.joinDates.join(', ') : 'Flexible dates'}</div>
          <a class="book-btn" href="trip-detail.html?id=${trip.id}&type=international">Book Now</a>
        </div>
      </div>
    `;
  }).join('');

  // Add click event listeners to cards
  const tourCards = document.querySelectorAll('.tour-card');
  tourCards.forEach(card => {
    card.addEventListener('click', function(e) {
      if (!e.target.classList.contains('book-btn')) {
        const tripId = this.getAttribute('data-trip-id');
        window.location.href = `trip-detail.html?id=${tripId}&type=international`;
      }
    });
  });
}

// Filter trips by destination
function showFilteredTours(destination) {
  const allTourCards = document.querySelectorAll('.tour-card');
  allTourCards.forEach(card => {
    if (!destination || card.getAttribute('data-destination') === destination) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// Show more/less functionality
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

// Destination filter
const destinationSelect = document.getElementById('destination-select');
if (destinationSelect) {
  destinationSelect.addEventListener('change', function() {
    const selectedDestination = this.value;
    showFilteredTours(selectedDestination);
  });
}
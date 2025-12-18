// Tabs logic
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', function() {
    // Remove 'active' from all tabs
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    // Add 'active' to clicked tab
    this.classList.add('active');
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    // Show the content for the clicked tab
    const tabId = this.dataset.tab;
    const content = document.getElementById(tabId);
    if (content) content.classList.add('active');
  });
});

// Read More toggle (expand/collapse for each day)
document.querySelectorAll('.read-more').forEach(btn => {
  btn.addEventListener('click', function() {
    const ul = this.previousElementSibling;
    if (ul && ul.style) {
      if (ul.style.maxHeight) {
        ul.style.maxHeight = null;
        this.textContent = 'Read More';
      } else {
        ul.style.maxHeight = ul.scrollHeight + 'px';
        this.textContent = 'Read Less';
      }
    }
  });
});

// Enquiry form submit (dummy)
const enquiryForm = document.querySelector('.enquiry-form form');
if (enquiryForm) {
  enquiryForm.addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Thank you for your enquiry! We will contact you soon.');
    this.reset();
  });
}

// Feature tab logic
document.querySelectorAll('.feature-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    // Remove active from all tabs
    document.querySelectorAll('.feature-tab').forEach(t => t.classList.remove('active'));
    // Add active to clicked tab
    this.classList.add('active');
    // Hide all info boxes
    document.querySelectorAll('.feature-info').forEach(info => info.classList.remove('active'));
    // Show the info box for the clicked tab
    const feature = this.getAttribute('data-feature');
    const infoBox = document.getElementById('feature-' + feature);
    if (infoBox) infoBox.classList.add('active');
  });
});

// Image Slider
document.addEventListener('DOMContentLoaded', function() {
  const slider = document.querySelector('.slider');
  const slides = document.querySelectorAll('.slide');
  const prevBtn = document.querySelector('.slider-btn.prev');
  const nextBtn = document.querySelector('.slider-btn.next');
  
  let currentSlide = 0;
  const slideCount = slides.length;

  // Get the computed style for gap from the slider
  const computedSliderStyle = window.getComputedStyle(slider);
  const gapString = computedSliderStyle.getPropertyValue('gap');
  const gap = parseFloat(gapString); // Extract pixel value from gapString, e.g., "20px" -> 20

  // Calculate the effective width to move for one slide
  // Use getBoundingClientRect().width for more accurate rendered width
  const slideEffectiveWidth = slides[0].getBoundingClientRect().width + gap;

  const visibleSlides = 3; // Number of slides visible at once

  function updateSlider() {
    // Calculate the offset to show multiple images in line
    slider.style.transform = `translateX(-${currentSlide * slideEffectiveWidth}px)`;
  }

  function nextSlide() {
    if (currentSlide < slideCount - visibleSlides + 1) { // Allow showing the last partial set
      currentSlide++;
    } else {
      currentSlide = 0; // Loop back to the start
    }
    updateSlider();
  }

  function prevSlide() {
    if (currentSlide > 0) {
      currentSlide--;
    } else {
      currentSlide = slideCount - visibleSlides + 1; // Loop back to the end
    }
    updateSlider();
  }

  // Event listeners
  nextBtn.addEventListener('click', nextSlide);
  prevBtn.addEventListener('click', prevSlide);

  // Auto slide every 5 seconds
  let slideInterval = setInterval(nextSlide, 5000);

  // Pause auto slide on hover
  slider.addEventListener('mouseenter', () => {
    clearInterval(slideInterval);
  });

  slider.addEventListener('mouseleave', () => {
    slideInterval = setInterval(nextSlide, 5000);
  });

  // Initialize slider position
  updateSlider();
});

// Day card toggle logic (accordion)
document.querySelectorAll('.day-card').forEach(dayCard => {
  dayCard.addEventListener('click', function(e) {
    // Ensure the click is on the day-header to toggle
    if (e.target.closest('.day-header')) {
      // Close any other open day cards
      document.querySelectorAll('.day-card.active').forEach(activeCard => {
        if (activeCard !== this) {
          activeCard.classList.remove('active');
        }
      });
      // Toggle the active class on the clicked day card
      this.classList.toggle('active');
    }
  });
});

// --- Pop-up message system (copied from spiritual-tours.js) ---
(function() {
  const style = document.createElement('style');
  style.textContent = `
    .spiritual-message {
      position: fixed;
      top: 100px;
      left: 50%;
      transform: translate(-50%, -20px);
      background: #ffe066 !important;
      color: #333 !important;
      padding: 15px 20px;
      border-radius: 25px;
      box-shadow: 0 8px 24px #FFE0B3;
      z-index: 10000;
      opacity: 0;
      transition: transform 0.5s ease, opacity 0.5s ease;
      font-weight: 600;
      max-width: 450px;
      text-align: center;
    }
    .spiritual-message.show {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  `;
  document.head.appendChild(style);

  function showSpiritualMessage(message) {
    const existingMessage = document.querySelector('.spiritual-message');
    if (existingMessage) existingMessage.remove();
    const spiritualMsg = document.createElement('div');
    spiritualMsg.className = 'spiritual-message';
    spiritualMsg.textContent = message;
    document.body.appendChild(spiritualMsg);
    setTimeout(() => {
      spiritualMsg.classList.add('show');
    }, 100);
    setTimeout(() => {
      spiritualMsg.classList.remove('show');
      setTimeout(() => spiritualMsg.remove(), 500);
    }, 3000);
  }

  showSpiritualMessage('Welcome to City Page');
})();

// --- Update scroll-to-top button to fully yellow with black arrow ---
(function() {
  const style = document.createElement('style');
  style.textContent = `
    .scroll-to-top {
      background: #ffe066 !important;
      color: #222 !important;
      box-shadow: 0 0 0 16px #ffe06655, 0 4px 16px #FFE0B3;
    }
    .scroll-to-top svg circle {
      fill: #ffe066 !important;
    }
    .scroll-to-top svg path {
      stroke: #222 !important;
    }
    .scroll-to-top:hover {
      box-shadow: 0 0 0 24px #ffe06655, 0 6px 24px #ffe066, 0 0 20px #FFE0B3 !important;
    }
  `;
  document.head.appendChild(style);
  // If using text arrow instead of SVG, also set color
  const btn = document.querySelector('.scroll-to-top');
  if (btn && btn.textContent.trim() === '↑') {
    btn.style.color = '#222';
  }
})();

// Modal functionality for Sign In/Login
// Copied from upcomingtrip.js for consistency

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

// API Base URL is defined in api-utils.js

// Function to load package details from URL parameter or default to first package
async function loadPackageDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const packageId = urlParams.get('id') || '1'; // Default to package ID 1 if none specified
  
  try {
    const response = await fetch(`${API_BASE_URL}/city-packages/${packageId}`);
    const package = await response.json();
    
    if (!response.ok) {
      throw new Error(package.error || 'Failed to fetch package details');
    }
    
    renderPackageDetails(package);
    loadSimilarPackages(package.category, package.id);
  } catch (error) {
    console.error('Error loading package details:', error);
    showErrorMessage('Failed to load package details. Please try again later.');
  }
}

// Function to render package details
function renderPackageDetails(package) {
  // Update page title
  document.title = `${package.title} | Traowl`;
  
  // Update breadcrumb
  const breadcrumbCategory = document.getElementById('breadcrumb-category');
  const breadcrumbTitle = document.getElementById('breadcrumb-title');
  if (breadcrumbCategory) breadcrumbCategory.textContent = package.category;
  if (breadcrumbTitle) breadcrumbTitle.textContent = package.title;
  
  // Update package title
  const packageTitle = document.getElementById('package-title');
  if (packageTitle) packageTitle.textContent = package.title;
  
  // Update prices
  const oldPrice = document.getElementById('package-old-price');
  const newPrice = document.getElementById('package-new-price');
  if (oldPrice) oldPrice.textContent = `${package.currency}${package.oldPrice.toLocaleString()}`;
  if (newPrice) newPrice.textContent = `${package.currency}${package.price.toLocaleString()}`;
  
  // Update duration and pickup
  const duration = document.getElementById('package-duration');
  const pickup = document.getElementById('package-pickup');
  if (duration) duration.textContent = package.duration;
  if (pickup) pickup.textContent = package.pickupLocation;
  
  // Update feature information
  const transportationInfo = document.getElementById('transportation-info');
  const mealsInfo = document.getElementById('meals-info');
  const stayInfo = document.getElementById('stay-info');
  const sightseeingInfo = document.getElementById('sightseeing-info');
  const assistanceInfo = document.getElementById('assistance-info');
  
  if (transportationInfo) transportationInfo.textContent = package.features.transportation;
  if (mealsInfo) mealsInfo.textContent = package.features.meals;
  if (stayInfo) stayInfo.textContent = package.features.stay;
  if (sightseeingInfo) sightseeingInfo.textContent = package.features.sightseeing;
  if (assistanceInfo) assistanceInfo.textContent = package.features.assistance;
  
  // Update images slider
  renderImageSlider(package.images);
  
  // Update itinerary
  renderItinerary(package.itinerary);
  
  // Update highlights
  renderHighlights(package.highlights);
  
  // Update other info
  renderOtherInfo(package.otherInfo);
  
  // Update inclusions and exclusions
  renderInclusionsExclusions(package.included, package.excluded);
  
  // Update book now button
  const bookNowBtn = document.getElementById('book-now-btn');
  if (bookNowBtn) {
    bookNowBtn.href = `booking.html?package=${package.id}`;
  }
  
  // Hide loading spinner and show content
  const loadingSpinner = document.getElementById('loading-spinner');
  const packageContent = document.getElementById('package-content');
  if (loadingSpinner) loadingSpinner.style.display = 'none';
  if (packageContent) packageContent.style.display = 'block';
}

// Function to render image slider
function renderImageSlider(images) {
  const slider = document.getElementById('package-slider');
  if (!slider || !images) return;
  
  slider.innerHTML = images.map((image, index) => {
    // Encode image URL to handle spaces in filenames
    const encodedImageUrl = image ? encodeURI(image) : 'images/top1.webp';
    
    return `
      <div class="slide">
        <img src="${encodedImageUrl}" alt="Package Image ${index + 1}" />
      </div>
    `;
  }).join('');
}

// Function to render itinerary
function renderItinerary(itinerary) {
  const container = document.getElementById('itinerary-content');
  if (!container || !itinerary) return;
  
  container.innerHTML = itinerary.map(day => `
    <div class="day-card">
      <div class="day-header">
        <div class="day-circle">${day.day}</div>
        <div class="day-content-header">
          <h3>${day.title}</h3>
          <span class="day-arrow">&#9662;</span>
        </div>
      </div>
      <ul>
        ${day.activities.map(activity => `<li>${activity}</li>`).join('')}
      </ul>
      <div class="day-body">
        <div class="day-icons">
          <div class="icon-card"><b>Stay</b><br>${day.stay}</div>
          <div class="icon-card"><b>Meals</b><br>${day.meals}</div>
        </div>
      </div>
    </div>
  `).join('');
}

// Function to render highlights
function renderHighlights(highlights) {
  const container = document.getElementById('highlights-content');
  if (!container || !highlights) return;
  
  container.innerHTML = `
    <ul class="highlight-content">
      ${highlights.map(highlight => `<li>${highlight}</li>`).join('')}
    </ul>
  `;
}

// Function to render other info
function renderOtherInfo(otherInfo) {
  const container = document.getElementById('other-info-content');
  if (!container || !otherInfo) return;
  
  container.innerHTML = `
    <div class="other-info-grid">
      <div class="info-item">
        <strong>Best Time:</strong> ${otherInfo.bestTime}
      </div>
      <div class="info-item">
        <strong>Weather:</strong> ${otherInfo.weather}
      </div>
      <div class="info-item">
        <strong>Altitude:</strong> ${otherInfo.altitude}
      </div>
      <div class="info-item">
        <strong>Clothing:</strong> ${otherInfo.clothing}
      </div>
      <div class="info-item">
        <strong>Medical:</strong> ${otherInfo.medical}
      </div>
      <div class="info-item">
        <strong>Photography:</strong> ${otherInfo.photography}
      </div>
    </div>
  `;
}

// Function to render inclusions and exclusions
function renderInclusionsExclusions(included, excluded) {
  const inclusionsList = document.getElementById('inclusions-list');
  const exclusionsList = document.getElementById('exclusions-list');
  
  if (inclusionsList && included) {
    inclusionsList.innerHTML = included.map(item => `<li>${item}</li>`).join('');
  }
  
  if (exclusionsList && excluded) {
    exclusionsList.innerHTML = excluded.map(item => `<li>${item}</li>`).join('');
  }
}

// Function to load similar packages
async function loadSimilarPackages(category, currentPackageId) {
  try {
    const response = await fetch(`${API_BASE_URL}/city-packages/category/${category}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch similar packages');
    }
    
    const similarPackages = data.filter(pkg => pkg.id !== parseInt(currentPackageId)).slice(0, 4);
    renderSimilarPackages(similarPackages);
  } catch (error) {
    console.error('Error loading similar packages:', error);
  }
}

// Function to render similar packages
function renderSimilarPackages(packages) {
  const container = document.getElementById('similar-packages-container');
  if (!container) return;
  
  if (packages.length === 0) {
    container.innerHTML = '<p>No similar packages available at the moment.</p>';
    return;
  }
  
  container.innerHTML = packages.map(package => {
    // Encode image URL to handle spaces in filenames
    const encodedImageUrl = package.images[0] ? encodeURI(package.images[0]) : 'images/top1.webp';
    
    return `
      <div class="similar-card">
        <img src="${encodedImageUrl}" alt="${package.title}" />
        <div class="similar-info">
          <span class="badge green">Save ${package.currency}${(package.oldPrice - package.price).toLocaleString()}</span>
          <div class="duration">${package.duration}</div>
          <div class="location">${package.pickupLocation} - India</div>
          <div class="title">${package.title}</div>
          <div class="price-row">
            <span class="old-price">${package.currency}${package.oldPrice.toLocaleString()}</span>
            <span class="new-price">${package.currency}${package.price.toLocaleString()}</span>
          </div>
          <button class="btn yellow" onclick="window.location.href='traowl-city-page.html?id=${package.id}'">Book Now</button>
        </div>
      </div>
    `;
  }).join('');
}

// Function to show error message
function showErrorMessage(message) {
  const loadingSpinner = document.getElementById('loading-spinner');
  if (loadingSpinner) {
    loadingSpinner.innerHTML = `
      <div class="error-message">
        <h2>Error</h2>
        <p>${message}</p>
        <button onclick="loadPackageDetails()">Try Again</button>
      </div>
    `;
  }
}

// Load package details when page loads
document.addEventListener('DOMContentLoaded', function() {
  loadPackageDetails();
});
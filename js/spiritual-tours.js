// Show more/less functionality for about section
const showMoreBtn = document.getElementById('showMoreBtn');
const moreContent = document.getElementById('moreContent');

showMoreBtn.addEventListener('click', function(e) {
    e.preventDefault();
    if (moreContent.style.display === 'none' || moreContent.style.display === '') {
        moreContent.style.display = 'inline';
        showMoreBtn.textContent = 'Show less';
        // Add spiritual animation
        showMoreBtn.innerHTML = 'Show less';
    } else {
        moreContent.style.display = 'none';
        showMoreBtn.textContent = 'Show more';
        showMoreBtn.innerHTML = 'Show more';
        window.scrollTo({ top: document.querySelector('.about-section').offsetTop, behavior: 'smooth' });
    }
});

// Load spiritual tours from API
async function loadSpiritualTours() {
  try {
    const response = await fetch('/api/spiritual-tours');
    const data = await response.json();
    return data.spiritualTours || [];
  } catch (error) {
    console.error('Error loading spiritual tours:', error);
    return [];
  }
}

// Enhanced render function for API data with spiritual styling
function renderTrips(trips, containerSelector) {
  const cardsContainer = document.querySelector(containerSelector);
  if (!cardsContainer) return;
  
  // Show loading spinner
  cardsContainer.innerHTML = '<div class="loading-spinner">Loading spiritual tours...</div>';
  
  if (!trips || trips.length === 0) {
    cardsContainer.innerHTML = '<div class="no-trips">No spiritual tours available at the moment.</div>';
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
      `trip-detail.html?type=spiritual&id=${trip.id}` : 
      'booking.html';
    
    // Debug image loading
    console.log('Spiritual Trip:', trip.title, 'Image:', trip.image);
    
    // Encode image URL to handle spaces in filenames
    const encodedImageUrl = trip.image ? encodeURI(trip.image) : 'images/spiritual-hero.webp';
    const fallbackImage = 'images/spiritual-hero.webp';
    
    card.innerHTML = `
      <div class="card-img" style="background-image: url(${encodedImageUrl});"></div>
      <div class="card-content">
        <div class="card-info">
          <span><i class="ri-time-line"></i> ${trip.duration || '3 Days, 2 Nights'}</span>
          ${trip.destination ? `<span><i class="ri-map-pin-line"></i> ${trip.destination}</span>` : ''}
        </div>
        <div class="card-title">${trip.title}</div>
        <div class="card-description">${trip.description || 'Sacred spiritual journey awaits!'}</div>
        <div class="card-price">
          ${price} <span>per person</span>
          ${oldPrice ? `<div class="old-price">${oldPrice}</div>` : ''}
        </div>
        <div class="card-join">Join on: ${trip.joinDates ? trip.joinDates.join(', ') : 'Flexible dates'}</div>
        ${suitableFor}
        <div class="card-actions">
          <a class="book-btn" href="${bookLink}">Book Now</a>
        </div>
      </div>
    `;
    cardsContainer.appendChild(card);
  });

  // Add spiritual animations to cards
  const tourCards = document.querySelectorAll('.tour-card');
  tourCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-8px) scale(1.02)';
      this.style.animation = 'spiritualGlow 2s infinite';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
      this.style.animation = 'none';
    });
  });

  // Add loading animation for images with spiritual theme
  const cardImages = document.querySelectorAll('.card-img');
  cardImages.forEach(img => {
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.5s ease-in-out';
    
    // Simulate image loading with spiritual delay
    setTimeout(() => {
      img.style.opacity = '1';
      // Add subtle spiritual glow
      img.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.1)';
    }, Math.random() * 1500 + 500);
  });
}

// Load and display spiritual tours from API
async function displaySpiritualTours() {
    try {
        const spiritualTours = await loadSpiritualTours();
        renderTrips(spiritualTours, '#spiritualToursGrid');
        
        // Initialize filtering after cards are loaded with a small delay to ensure DOM is ready
        setTimeout(() => {
            initializeSpiritualToursFilters();
        }, 100);
        
    } catch (error) {
        console.error('Error loading spiritual tours:', error);
        document.getElementById('spiritualToursGrid').innerHTML = 
            '<p style="text-align: center; grid-column: 1/-1;">Failed to load spiritual tours. Please try again later.</p>';
    }
}

// Initialize destination filtering
function initializeSpiritualToursFilters() {
    const destinationSelect = document.getElementById('destination-select');
    const tourCards = document.querySelectorAll('.tour-card');
    
    // Debug: Check if elements are found
    if (!destinationSelect) {
        console.error('Destination select element not found');
        return;
    }
    
    if (tourCards.length === 0) {
        console.warn('No tour cards found for filtering');
        return;
    }
    
    console.log(`Filter initialized with ${tourCards.length} tour cards`);

    // Create mapping between filter values and actual destination values
    const regionMapping = {
        'north': ['uttarakhand', 'himachal pradesh', 'jammu & kashmir', 'uttar pradesh'],
        'south': ['andhra pradesh', 'tamil nadu', 'kerala', 'karnataka', 'telangana'],
        'east': ['west bengal', 'odisha', 'jharkhand', 'bihar'],
        'west': ['rajasthan', 'gujarat', 'maharashtra', 'goa', 'madhya pradesh']
    };

    destinationSelect.addEventListener('change', function() {
        const selectedRegion = this.value;
        
        tourCards.forEach(card => {
            const cardDestination = card.getAttribute('data-destination');
            let shouldShow = false;
            
            if (selectedRegion === '') {
                // Show all cards when "All Sacred Destinations" is selected
                shouldShow = true;
            } else {
                // Check if the card's destination belongs to the selected region
                const destinationsInRegion = regionMapping[selectedRegion] || [];
                shouldShow = destinationsInRegion.includes(cardDestination);
            }
            
            if (shouldShow) {
                card.style.display = 'block';
                card.style.animation = 'spiritualFadeIn 0.8s ease-in-out';
            } else {
                card.style.display = 'none';
            }
        });
        
        // Add spiritual feedback
        if (selectedRegion !== '') {
            const regionNames = {
                'north': 'North India (Himalayan Sacred Sites)',
                'south': 'South India (Ancient Temples)',
                'east': 'East India (Spiritual Heritage)',
                'west': 'West India (Sacred Pilgrimages)'
            };
            showSpiritualMessage(`Showing sacred destinations in ${regionNames[selectedRegion]}`);
        }
    });
}

// Add spiritual fade-in animation for cards
const style = document.createElement('style');
style.textContent = `
    @keyframes spiritualFadeIn {
        0% {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
        }
        50% {
            opacity: 0.7;
            transform: translateY(15px) scale(0.98);
        }
        100% {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    @keyframes spiritualGlow {
        0%, 100% {
            box-shadow: 0 8px 24px #FFE0B3;
        }
        50% {
            box-shadow: 0 12px 40px #FF9933, 0 0 20px #FFE0B3;
        }
    }
    
    .tour-card {
        animation: spiritualFadeIn 0.8s ease-in-out;
    }
    
    .spiritual-message {
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translate(-50%, -20px);
        background: linear-gradient(135deg, #FF9933 0%, #FF7700 100%);
        color: white;
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

// Spiritual message function
function showSpiritualMessage(message) {
    const existingMessage = document.querySelector('.spiritual-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const spiritualMsg = document.createElement('div');
    spiritualMsg.className = 'spiritual-message';
    spiritualMsg.textContent = message;
    document.body.appendChild(spiritualMsg);
    
    setTimeout(() => {
        spiritualMsg.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        spiritualMsg.classList.remove('show');
        setTimeout(() => {
            spiritualMsg.remove();
        }, 500);
    }, 3000);
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  if (window.commonComponents) {
    window.commonComponents.init();
  }
  displaySpiritualTours();
});

// Enhanced scroll-to-top functionality with spiritual theme
const scrollToTopBtn = document.createElement('button');
scrollToTopBtn.innerHTML = '↑';
scrollToTopBtn.className = 'scroll-to-top';
scrollToTopBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #FF9933 0%, #FF7700 100%);
    color: white;
    border: none;
    cursor: pointer;
    display: none;
    z-index: 1000;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px #FFE0B3;
    font-size: 1.5rem;
`;

scrollToTopBtn.addEventListener('mouseenter', function() {
    this.style.transform = 'scale(1.1)';
    this.style.boxShadow = '0 6px 24px #FF9933, 0 0 20px #FFE0B3';
});

scrollToTopBtn.addEventListener('mouseleave', function() {
    this.style.transform = 'scale(1)';
    this.style.boxShadow = '0 4px 16px #FFE0B3';
});

scrollToTopBtn.addEventListener('click', function() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    // Add spiritual feedback
    showSpiritualMessage('Returning to the beginning of your spiritual journey');
});

document.body.appendChild(scrollToTopBtn);

// Show/hide scroll-to-top button
window.addEventListener('scroll', function() {
    if (window.pageYOffset > 300) {
        scrollToTopBtn.style.display = 'block';
    } else {
        scrollToTopBtn.style.display = 'none';
    }
});

// Enhanced booking button click tracking with spiritual theme
document.querySelectorAll('.book-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        const tourTitle = this.closest('.tour-card').querySelector('.card-title').textContent;
        console.log(`Booking requested for: ${tourTitle}`);
        
        // Add spiritual booking confirmation
        showSpiritualMessage(`Blessings for your journey to ${tourTitle}`);
        
        // You can add analytics tracking here
        // Example: gtag('event', 'booking_click', { tour_name: tourTitle });
    });
});

// Add spiritual page load animation
window.addEventListener('load', function() {
    showSpiritualMessage('Welcome to your spiritual journey');
    
    // Add subtle background animation
    document.body.style.animation = 'spiritualGlow 4s ease-in-out';
});

// Add responsive navigation toggle for mobile with spiritual theme
const createMobileMenu = () => {
    if (window.innerWidth <= 768) {
        const nav = document.querySelector('.main-nav');
        const headerContent = document.querySelector('.header-content');
        
        if (!document.querySelector('.mobile-menu-toggle')) {
            const mobileToggle = document.createElement('button');
            mobileToggle.className = 'mobile-menu-toggle';
            mobileToggle.innerHTML = '☰';
            mobileToggle.style.cssText = `
                background: linear-gradient(135deg, #FF9933 0%, #FF7700 100%);
                border: none;
                font-size: 1.5rem;
                color: white;
                cursor: pointer;
                display: block;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                box-shadow: 0 4px 12px #FFE0B3;
                transition: all 0.3s ease;
            `;
            
            mobileToggle.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.1)';
            });
            
            mobileToggle.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
            
            mobileToggle.addEventListener('click', function() {
                nav.style.display = nav.style.display === 'block' ? 'none' : 'block';
                nav.style.cssText = `
                    display: ${nav.style.display === 'block' ? 'none' : 'block'};
                    position: absolute;
                    top: 100%;
                    left: 0;
                    width: 100%;
                    background: linear-gradient(135deg, #FFF6E5 0%, #FFE0B3 100%);
                    box-shadow: 0 8px 24px #FFE0B3;
                    padding: 20px;
                    flex-direction: column;
                    gap: 15px;
                    backdrop-filter: blur(10px);
                    border: 2px solid #FF9933;
                `;
            });
            
            headerContent.appendChild(mobileToggle);
        }
    }
};

// Initialize mobile menu
createMobileMenu();
window.addEventListener('resize', createMobileMenu);

// Add spiritual search functionality
const addSearchFunctionality = () => {
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '🔍 Search spiritual destinations...';
    searchInput.className = 'spiritual-search';
    searchInput.style.cssText = `
        padding: 12px 20px;
        border: 2px solid #FF9933;
        border-radius: 25px;
        margin: 20px 0;
        width: 100%;
        max-width: 400px;
        font-size: 1rem;
        background: linear-gradient(135deg, #FFF6E5 0%, #FFE0B3 100%);
        color: #2c1810;
        outline: none;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px #FFE0B3;
    `;
    
    searchInput.addEventListener('focus', function() {
        this.style.borderColor = '#FF7700';
        this.style.boxShadow = '0 6px 20px #FFE0B3';
        this.style.transform = 'translateY(-2px)';
    });
    
    searchInput.addEventListener('blur', function() {
        this.style.borderColor = '#FF9933';
        this.style.boxShadow = '0 4px 12px #FFE0B3';
        this.style.transform = 'translateY(0)';
    });
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        tourCards.forEach(card => {
            const title = card.querySelector('.card-title').textContent.toLowerCase();
            const shouldShow = title.includes(searchTerm);
            
            if (shouldShow) {
                card.style.display = 'block';
                card.style.animation = 'spiritualFadeIn 0.5s ease-in-out';
            } else {
                card.style.display = 'none';
            }
        });
        
        if (searchTerm.length > 2) {
            showSpiritualMessage(`Searching for "${searchTerm}" in sacred destinations`);
        }
    });
    
    // Insert search before the cards section
    const cardsSection = document.querySelector('.cards-section');
    cardsSection.parentNode.insertBefore(searchInput, cardsSection);
};

// Initialize search functionality
// Uncomment the line below to enable search
// addSearchFunctionality();

// Force orange gradient background for modal
document.addEventListener('DOMContentLoaded', function() {
    const authModal = document.getElementById('authModal');
    if (authModal) {
        const modalContent = authModal.querySelector('.modal-content');
        if (modalContent) {
            // Force orange gradient background
            modalContent.style.setProperty('background', 'linear-gradient(135deg, #FF9933 0%, #FF7700 50%, #FF5722 100%)', 'important');
            
            // Force white text for header
            const modalHeader = modalContent.querySelector('.modal-header h2');
            if (modalHeader) {
                modalHeader.style.setProperty('color', '#fff', 'important');
                modalHeader.style.setProperty('text-shadow', '0 2px 4px rgba(0, 0, 0, 0.2)', 'important');
            }
            
            // Force white color for close button
            const modalClose = modalContent.querySelector('.modal-close');
            if (modalClose) {
                modalClose.style.setProperty('color', '#fff', 'important');
            }
            
            // Force border color for header
            const modalHeaderDiv = modalContent.querySelector('.modal-header');
            if (modalHeaderDiv) {
                modalHeaderDiv.style.setProperty('border-bottom', '1px solid rgba(255, 255, 255, 0.3)', 'important');
            }
        }
    }
    
    // Also apply when modal becomes active
    const signInBtn = document.getElementById('signInBtn');
    if (signInBtn && authModal) {
        signInBtn.addEventListener('click', function() {
            setTimeout(() => {
                const modalContent = authModal.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.style.setProperty('background', 'linear-gradient(135deg, #FF9933 0%, #FF7700 50%, #FF5722 100%)', 'important');
                }
            }, 50);
        });
    }
});

console.log('Spiritual Tours page loaded successfully!'); 
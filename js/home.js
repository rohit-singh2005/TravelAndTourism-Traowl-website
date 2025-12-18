document.addEventListener('DOMContentLoaded', async function() {
    // Load hot locations and upcoming trips from API
    await displayHotLocations();
    await displayUpcomingTrips();
    await displayTopDestinations();
    await displayWeekendTrips();
    await displayAdventures();
    await loadAllTripsForSearch();
    
    // Wait a bit to ensure all data is loaded
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Initialize search system after data is loaded
    window.searchSystem = new TravelSearchSystem();
    
    // Initialize navigation arrows
    initializeNavigation();
});

// Load and display hot locations
async function displayHotLocations() {
    try {
        const hotLocations = await loadHotLocations();
        const hotLocationsGrid = document.getElementById('hotLocationsGrid');
        
        if (!hotLocations || hotLocations.length === 0) {
            hotLocationsGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No hot locations available at the moment.</p>';
            return;
        }
        
        // Clear existing content
        hotLocationsGrid.innerHTML = '';
        
        // Add each hot location
        hotLocations.forEach(location => {
            const locationCard = createHotLocationCard(location);
            hotLocationsGrid.insertAdjacentHTML('beforeend', locationCard);
        });
        
    } catch (error) {
        console.error('Error loading hot locations:', error);
        document.getElementById('hotLocationsGrid').innerHTML = 
            '<p style="text-align: center; grid-column: 1/-1;">Failed to load hot locations. Please try again later.</p>';
    }
}

// Load and display upcoming trips
async function displayUpcomingTrips() {
    try {
        const upcomingTrips = await loadUpcomingTrips();
        const upcomingTripsGrid = document.getElementById('upcomingTripsGrid');
        
        if (!upcomingTrips || upcomingTrips.length === 0) {
            upcomingTripsGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No upcoming trips available at the moment.</p>';
            return;
        }
        
        // Clear existing content
        upcomingTripsGrid.innerHTML = '';
        
        // Add each upcoming trip
        upcomingTrips.forEach(trip => {
            const tripCard = createUpcomingTripCard(trip);
            upcomingTripsGrid.insertAdjacentHTML('beforeend', tripCard);
        });
        
    } catch (error) {
        console.error('Error loading upcoming trips:', error);
        document.getElementById('upcomingTripsGrid').innerHTML = 
            '<p style="text-align: center; grid-column: 1/-1;">Failed to load upcoming trips. Please try again later.</p>';
    }
}

// Function to limit text to specified word count
function limitWords(text, maxWords = 15) {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
}

// Create hot location card HTML
function createHotLocationCard(location) {
    // Format price for display
    const price = location.price ? `₹ ${location.price.toLocaleString()}/-` : '₹ 15,000/-';
    // Removed oldPrice

    // Highlights section removed to reduce card size

    // Removed difficulty and suitable for

    // Determine the correct link for the book button
    const bookLink = location.id ? 
      `trip-detail.html?type=location&id=${location.id}` : 
      'booking.html';

    // Use optimized image with generation logic
    const optimizedImage = window.ImageUtils ? 
        window.ImageUtils.getOptimizedImage(location.image, 'images/hot1.webp') : 
        { url: location.image ? encodeURI(location.image) : 'images/hot1.webp' };

    return `
        <div class="hot-location-card" data-id="${location.id || ''}" onclick="window.location.href='${bookLink}'" style="cursor: pointer;">
            <img src="${optimizedImage.url}" alt="${location.title}" 
                 onerror="this.onerror=null; this.src='images/hot1.webp'; console.warn('Image failed to load: ${location.image}');" />
            <div class="hot-location-info">
                <div class="card-info">
                    <span><i class="ri-time-line"></i> ${location.duration || '3 Days, 2 Nights'}</span>
                    ${location.destination ? `<span><i class="ri-map-pin-line"></i> ${location.destination}</span>` : ''}
                </div>
                <h3>${limitWords(location.title, 6)}</h3>
                <p>${limitWords(location.description, 15)}</p>
                <div class="trip-price">
                    ${price} <span class="per-person">per person</span>
                </div>
                ${location.joinDates ? `<div class="card-join">Join on: ${location.joinDates.join(', ')}</div>` : ''}
                <a href="${bookLink}" class="book-btn" onclick="event.stopPropagation()">Book Now</a>
            </div>
        </div>
    `;
}

// Create upcoming trip card HTML
function createUpcomingTripCard(trip) {
    // Format price for display
    const price = trip.price ? `₹ ${trip.price.toLocaleString()}/-` : '₹ 15,000/-';
    // Removed oldPrice

    // Highlights section removed to reduce card size

    // Removed difficulty and suitable for

    // Determine the correct link for the book button
    const bookLink = trip.id ? 
      `trip-detail.html?type=upcoming&id=${trip.id}` : 
      'booking.html';

    // Create standardized description for upcoming trips
    const description = trip.description || `${trip.country} - ${trip.duration} tour`;
    const standardizedDescription = limitWords(description, 15);

    // Use optimized image with generation logic
    const optimizedImage = window.ImageUtils ? 
        window.ImageUtils.getOptimizedImage(trip.image, 'images/upcoming1.webp') : 
        { url: trip.image ? encodeURI(trip.image) : 'images/upcoming1.webp' };

    return `
        <div class="upcoming-trip-card" data-id="${trip.id || ''}" onclick="window.location.href='${bookLink}'" style="cursor: pointer;">
            <img src="${optimizedImage.url}" alt="${trip.title}" 
                 onerror="this.onerror=null; this.src='images/upcoming1.webp'; console.warn('Image failed to load: ${trip.image}');" />
            <div class="upcoming-trip-info">
                <div class="card-info">
                    <span><i class="ri-time-line"></i> ${trip.duration || '3 Days, 2 Nights'}</span>
                    ${trip.destination ? `<span><i class="ri-map-pin-line"></i> ${trip.destination}</span>` : ''}
                </div>
                <h3>${limitWords(trip.title, 6)}</h3>
                <p>${standardizedDescription}</p>
                <div class="trip-price">
                    ${price} <span class="per-person">per person</span>
                </div>
                ${trip.joinDates ? `<div class="card-join">Join on: ${trip.joinDates.join(', ')}</div>` : ''}
                <a href="${bookLink}" class="book-btn" onclick="event.stopPropagation()">Book Now</a>
            </div>
        </div>
    `;
}

// Book location function (kept for backward compatibility)
function bookLocation(locationId) {
    window.location.href = `trip-detail.html?type=hot-location&id=${locationId}`;
}

// Book trip function (kept for backward compatibility)
function bookTrip(tripId) {
    window.location.href = `trip-detail.html?type=upcoming&id=${tripId}`;
}

// Load all trip types for search functionality
async function loadAllTripsForSearch() {
    try {
        // Load all trip types
        const tripTypes = [
            { name: 'international', endpoint: '/api/international-trips', dataKey: 'internationalTrips' },
            { name: 'upcoming', endpoint: '/api/upcoming-trips', dataKey: 'upcomingTrips' },
            { name: 'domestic', endpoint: '/api/domestic-trips', dataKey: 'domesticTrips' },
            { name: 'family', endpoint: '/api/family-trips', dataKey: 'familyTrips' },
            { name: 'weekend', endpoint: '/api/weekend-trips', dataKey: 'weekendTrips' },
            { name: 'romantic', endpoint: '/api/romantic-trips', dataKey: 'romanticTrips' },
            { name: 'corporate', endpoint: '/api/corporate-trips', dataKey: 'corporateTrips' },
            { name: 'spiritual', endpoint: '/api/spiritual-tours', dataKey: 'spiritualTours' }
        ];

        // Store all trip data globally for search
        window.allTripsData = {};

        for (const tripType of tripTypes) {
            try {
                const response = await fetch(tripType.endpoint);
                const data = await response.json();
                
                if (data && data[tripType.dataKey]) {
                    window.allTripsData[tripType.name] = data[tripType.dataKey];
                }
            } catch (error) {
                console.error(`Error loading ${tripType.name} trips for search:`, error);
                window.allTripsData[tripType.name] = [];
            }
        }

        // Keep backward compatibility
        window.internationalTripsData = window.allTripsData.international || [];
        
    } catch (error) {
        console.error('Error loading trips for search:', error);
        window.allTripsData = {};
        window.internationalTripsData = [];
    }
}

// Load and display top destinations
async function displayTopDestinations() {
    try {
        const topDestinations = await loadTopDestinations();
        const topDestinationsGrid = document.querySelector('.top-destinations-grid');
        
        if (!topDestinations || topDestinations.length === 0) {
            topDestinationsGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No top destinations available at the moment.</p>';
            return;
        }
        
        // Clear existing content
        topDestinationsGrid.innerHTML = '';
        
        // Add each top destination
        topDestinations.forEach(destination => {
            const destinationCard = createTopDestinationCard(destination);
            topDestinationsGrid.insertAdjacentHTML('beforeend', destinationCard);
        });
        
        // Initialize filter functionality after cards are loaded
        initializeTopDestinationsFilters();
        
    } catch (error) {
        console.error('Error loading top destinations:', error);
        document.querySelector('.top-destinations-grid').innerHTML = 
            '<p style="text-align: center; grid-column: 1/-1;">Failed to load top destinations. Please try again later.</p>';
    }
}

// Create top destination card HTML
function createTopDestinationCard(destination) {
    // Use optimized image with generation logic
    const optimizedImage = window.ImageUtils ? 
        window.ImageUtils.getOptimizedImage(destination.image, 'images/top1.webp') : 
        { url: destination.image ? encodeURI(destination.image) : 'images/top1.webp' };
    
    // Determine the correct link for the destination
    const destinationLink = destination.id ? 
      `trip-detail.html?type=top-destination&id=${destination.id}` : 
      `trip-detail.html?type=top-destination&title=${encodeURIComponent(destination.title)}`;
    
    return `
        <div class="top-destination-card ${destination.cardClass}" data-category="${destination.category}" 
             onclick="window.location.href='${destinationLink}'" style="cursor: pointer;">
            <img src="${optimizedImage.url}" alt="${destination.title} - ${destination.description}" 
                 onerror="this.onerror=null; this.src='images/top1.webp'; console.warn('Image failed to load: ${destination.image}');" />
            <div class="top-destination-overlay">
                <div class="top-destination-title">${destination.title}</div>
                <div class="top-destination-desc">${destination.description}</div>
            </div>
        </div>
    `;
}

// Initialize top destinations filters
function initializeTopDestinationsFilters() {
    const filterButtons = document.querySelectorAll('.top-destinations-filters .filter-btn');
    const destinationCards = document.querySelectorAll('.top-destinations-grid .top-destination-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active', 'selected'));
            // Add active class to clicked button
            button.classList.add('active', 'selected');
            
            const filterValue = button.getAttribute('data-filter');
            
            // Show/hide cards based on filter
            destinationCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                
                if (filterValue === 'all' || cardCategory === filterValue) {
                    card.classList.remove('hide');
                    card.style.display = 'block';
                } else {
                    card.classList.add('hide');
                    card.style.display = 'none';
                }
            });
        });
    });
}

// Load and display weekend trips
async function displayWeekendTrips() {
    try {
        const weekendTrips = await loadWeekendTrips();
        const weekendTripsGrid = document.getElementById('weekendTripsGrid');
        
        if (!weekendTrips || weekendTrips.length === 0) {
            weekendTripsGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No weekend trips available at the moment.</p>';
            return;
        }
        
        // Clear existing content
        weekendTripsGrid.innerHTML = '';
        
        // Add each weekend trip
        weekendTrips.forEach(trip => {
            const tripCard = createWeekendTripCard(trip);
            weekendTripsGrid.insertAdjacentHTML('beforeend', tripCard);
        });
        
    } catch (error) {
        console.error('Error loading weekend trips:', error);
        document.getElementById('weekendTripsGrid').innerHTML = 
            '<p style="text-align: center; grid-column: 1/-1;">Failed to load weekend trips. Please try again later.</p>';
    }
}

// Create weekend trip card HTML
function createWeekendTripCard(trip) {
    // Format price for display
    const price = trip.price ? `₹ ${trip.price.toLocaleString()}/-` : '₹ 15,000/-';
    // Removed oldPrice

    // Highlights section removed to reduce card size

    // Removed difficulty and suitable for

    // Determine the correct link for the book button
    const bookLink = trip.id ? 
      `trip-detail.html?type=weekend&id=${trip.id}` : 
      'booking.html';

    // Use optimized image with generation logic
    const optimizedImage = window.ImageUtils ? 
        window.ImageUtils.getOptimizedImage(trip.image, 'images/weekend1.webp') : 
        { url: trip.image ? encodeURI(trip.image) : 'images/weekend1.webp' };

    return `
        <div class="weekend-trip-card" data-id="${trip.id || ''}" onclick="window.location.href='${bookLink}'" style="cursor: pointer;">
            <img src="${optimizedImage.url}" alt="${trip.title}" 
                 onerror="this.onerror=null; this.src='images/weekend1.webp'; console.warn('Image failed to load: ${trip.image}');" />
            <div class="weekend-trip-info">
                <div class="card-info">
                    <span><i class="ri-time-line"></i> ${trip.duration || '3 Days, 2 Nights'}</span>
                    ${trip.destination ? `<span><i class="ri-map-pin-line"></i> ${trip.destination}</span>` : ''}
                </div>
                <h3 class="weekend-trip-title">${limitWords(trip.title, 6)}</h3>
                <p>${limitWords(trip.description, 15)}</p>
                <div class="trip-price">
                    ${price} <span class="per-person">per person</span>
                </div>
                ${trip.joinDates ? `<div class="card-join">Join on: ${trip.joinDates.join(', ')}</div>` : ''}
                <a href="${bookLink}" class="book-now-btn" onclick="event.stopPropagation()">Book Now</a>
            </div>
        </div>
    `;
}

// Book weekend trip function (kept for backward compatibility)
function bookWeekendTrip(tripId) {
    window.location.href = `trip-detail.html?type=weekend&id=${tripId}`;
}

// Load and display adventures/activities
async function displayAdventures() {
    try {
        const adventures = await loadActivities();
        const adventuresGrid = document.getElementById('adventuresGrid');
        
        if (!adventures || adventures.length === 0) {
            adventuresGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No adventures available at the moment.</p>';
            return;
        }
        
        // Clear existing content
        adventuresGrid.innerHTML = '';
        
        // Add each adventure
        adventures.forEach(adventure => {
            const adventureCard = createAdventureCard(adventure);
            adventuresGrid.insertAdjacentHTML('beforeend', adventureCard);
        });
        
    } catch (error) {
        console.error('Error loading adventures:', error);
        document.getElementById('adventuresGrid').innerHTML = 
            '<p style="text-align: center; grid-column: 1/-1;">Failed to load adventures. Please try again later.</p>';
    }
}

// Create adventure card HTML
function createAdventureCard(adventure) {
    // Encode image URL to handle spaces in filenames
    const encodedImageUrl = adventure.image ? encodeURI(adventure.image) : 'images/adventure1.webp';
    
    // Determine the correct link for the adventure
    const adventureLink = adventure.id ? 
      `activity-detail.html?id=${adventure.id}` : 
      'activities.html';
    
    return `
        <a href="${adventureLink}" class="adventure-card">
            <img src="${encodedImageUrl}" alt="${adventure.name}" />
            <div class="adventure-overlay">
                <h3>${adventure.name}</h3>
                <p>${adventure.description}</p>
            </div>
        </a>
    `;
}

// Initialize navigation arrows
function initializeNavigation() {
    // Hot locations navigation
    const hotLocationsLeftArrow = document.querySelector('.hot-locations-section .left-arrow');
    const hotLocationsRightArrow = document.querySelector('.hot-locations-section .right-arrow');
    const hotLocationsGrid = document.getElementById('hotLocationsGrid');
    
    if (hotLocationsLeftArrow && hotLocationsRightArrow) {
        hotLocationsLeftArrow.addEventListener('click', () => scrollGrid(hotLocationsGrid, 'left'));
        hotLocationsRightArrow.addEventListener('click', () => scrollGrid(hotLocationsGrid, 'right'));
    }
    
    // Upcoming trips navigation
    const upcomingTripsLeftArrow = document.querySelector('.upcoming-trips-section .left-arrow');
    const upcomingTripsRightArrow = document.querySelector('.upcoming-trips-section .right-arrow');
    const upcomingTripsGrid = document.getElementById('upcomingTripsGrid');
    
    if (upcomingTripsLeftArrow && upcomingTripsRightArrow) {
        upcomingTripsLeftArrow.addEventListener('click', () => scrollGrid(upcomingTripsGrid, 'left'));
        upcomingTripsRightArrow.addEventListener('click', () => scrollGrid(upcomingTripsGrid, 'right'));
    }
    
    // Weekend trips navigation
    const weekendTripsLeftArrow = document.querySelector('.weekend-trips-section .left-arrow');
    const weekendTripsRightArrow = document.querySelector('.weekend-trips-section .right-arrow');
    const weekendTripsGrid = document.getElementById('weekendTripsGrid');
    
    if (weekendTripsLeftArrow && weekendTripsRightArrow) {
        weekendTripsLeftArrow.addEventListener('click', () => scrollGrid(weekendTripsGrid, 'left'));
        weekendTripsRightArrow.addEventListener('click', () => scrollGrid(weekendTripsGrid, 'right'));
    }
}

// Scroll grid function for navigation
function scrollGrid(grid, direction) {
    const scrollAmount = 300;
    if (direction === 'left') {
        grid.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
        grid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
}

// Enhanced Search System
class TravelSearchSystem {
  constructor() {
    this.searchData = this.initializeSearchData();
    this.init();
  }

  initializeSearchData() {
    // Extract data from existing cards for search
    const destinations = [];
    
    // Get hot locations
    document.querySelectorAll('.hot-location-card').forEach(card => {
      const title = card.querySelector('h3')?.textContent;
      const description = card.querySelector('p')?.textContent;
      const priceElement = card.querySelector('.trip-price');
      const price = priceElement ? priceElement.childNodes[0]?.textContent?.trim() : '';
      const cardId = card.getAttribute('data-id') || card.querySelector('a')?.getAttribute('href')?.match(/id=(\d+)/)?.[1] || '';
      
      if (title) {
        destinations.push({
          type: 'hot-location',
          title: title,
          description: description || '',
          price: price || '',
          element: card,
          category: 'destination',
          id: cardId
        });
      }
    });
    
    // Get upcoming trips
    document.querySelectorAll('.upcoming-trip-card').forEach(card => {
      const title = card.querySelector('h3')?.textContent;
      const description = card.querySelector('p')?.textContent;
      const priceElement = card.querySelector('.trip-price');
      const price = priceElement ? priceElement.childNodes[0]?.textContent?.trim() : '';
      const cardId = card.getAttribute('data-id') || card.querySelector('a')?.getAttribute('href')?.match(/id=(\d+)/)?.[1] || '';
      
      if (title) {
        destinations.push({
          type: 'upcoming-trip',
          title: title,
          description: description || '',
          price: price || '',
          element: card,
          category: 'trip',
          id: cardId
        });
      }
    });
    
    // Get weekend trips from DOM (if any)
    document.querySelectorAll('.weekend-trip-card').forEach(card => {
      const title = card.querySelector('.weekend-trip-title')?.textContent;
      const description = card.querySelector('p')?.textContent;
      const priceElement = card.querySelector('.trip-price');
      const price = priceElement ? priceElement.childNodes[0]?.textContent?.trim() : '';
      const cardId = card.getAttribute('data-id') || card.querySelector('a')?.getAttribute('href')?.match(/id=(\d+)/)?.[1] || '';
      
      if (title) {
        destinations.push({
          type: 'weekend-trip',
          title: title,
          description: description || '',
          price: price || '',
          element: card,
          category: 'trip',
          id: cardId
        });
      }
    });
    
    // Top destinations are excluded from search as requested
    
    // Add all trip types data from API
    if (window.allTripsData) {
      Object.entries(window.allTripsData).forEach(([tripType, trips]) => {
        if (Array.isArray(trips)) {
          trips.forEach(trip => {
            const searchItem = {
              type: `${tripType}-trip`,
              title: trip.title,
              description: trip.description || '',
              price: trip.price ? `₹ ${trip.price.toLocaleString()}/- per person` : '',
              element: null, // No DOM element for API trips on home page
              category: tripType,
              destination: trip.destination,
              id: trip.id,
              duration: trip.duration,
              joinDates: trip.joinDates
            };
            
            // Add additional fields based on trip type
            if (tripType === 'international') {
              searchItem.category = 'international';
            } else if (tripType === 'spiritual') {
              searchItem.category = 'spiritual';
              searchItem.type = 'spiritual-tour';
            }
            
            destinations.push(searchItem);
          });
        }
      });
    }
    
    return destinations;
  }

  init() {
    // Handle floating search bar
    const floatingSearchBar = document.querySelector('.floating-search-bar');
    if (floatingSearchBar) {
      floatingSearchBar.addEventListener('submit', (e) => this.handleSearch(e));
    }
    
    // Add real-time search suggestions
    const destinationInput = document.getElementById('animated-search-input');
    if (destinationInput) {
      destinationInput.addEventListener('input', (e) => this.showSuggestions(e));
      destinationInput.addEventListener('blur', () => {
        setTimeout(() => this.hideSuggestions(), 200); // Delay to allow clicking suggestions
      });
      this.createSuggestionsDropdown(destinationInput);
    }
    
    // Handle "Start your search" button
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
      ctaButton.addEventListener('click', (e) => {
        e.preventDefault();
        const searchBar = document.querySelector('.floating-search-bar');
        if (searchBar) {
          searchBar.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const input = searchBar.querySelector('input[type="text"]');
          if (input) {
            setTimeout(() => input.focus(), 500);
          }
        }
      });
    }
  }



  handleSearch(e) {
    e.preventDefault();
    
    const destination = e.target.querySelector('input[type="text"]')?.value || '';
    const travelers = e.target.querySelector('select')?.value || '';
    
    console.log('Search params:', { destination, travelers });
    
    if (destination.trim()) {
      this.performSearch(destination, '', travelers, '');
    } else {
      this.showSearchMessage('Please enter a destination to search');
    }
  }

  performSearch(destination, dates, travelers, duration) {
    const searchTerm = destination.toLowerCase().trim();
    console.log('Searching for:', searchTerm);
    console.log('Search data available:', this.searchData.length);
    
    const results = this.searchData.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(searchTerm);
      const descMatch = item.description.toLowerCase().includes(searchTerm);
      const categoryMatch = item.category.toLowerCase().includes(searchTerm);
      const destMatch = item.destination && item.destination.toLowerCase().includes(searchTerm);
      
      if (titleMatch || descMatch || categoryMatch || destMatch) {
        console.log('Match found:', item.title, 'Type:', item.type);
      }
      
      return titleMatch || descMatch || categoryMatch || destMatch;
    });
    
    console.log('Search results:', results);
    
    if (results.length > 0) {
      // Clear any existing error messages first
      this.hideSearchMessage();
      this.displaySearchResults(results, destination, dates, travelers, duration);
      this.highlightSearchResults(results);
    } else {
      // Only show error message if no results found
      this.showSearchMessage('No results found.');
    }
  }

  displaySearchResults(results, destination, dates, travelers, duration) {
    // Clear any existing search notifications first
    this.hideSearchMessage();
    
    // Create or update search results modal
    let modal = document.getElementById('search-results-modal');
    if (!modal) {
      modal = this.createSearchModal();
    }
    
    const resultsHtml = `
      <div class="search-results-header">
        <h3>Search Results for "${destination}"</h3>
        <p>Found ${results.length} result(s) ${travelers ? `• ${travelers} traveler${travelers !== '1' ? 's' : ''}` : ''}</p>
        <button class="close-modal" onclick="this.closest('.search-modal').style.display='none'">&times;</button>
      </div>
      <div class="search-results-list">
        ${results.map(result => {
          const isTripType = result.type.includes('-trip') || result.type.includes('-tour');
          const isHotLocation = result.type === 'hot-location';
          let buttonText = 'View Details';
          if (isTripType) {
            buttonText = 'View Trip Details';
          } else if (isHotLocation) {
            buttonText = 'View Location Details';
          }
          
          let additionalInfo = '';
          if (result.destination || result.duration || result.joinDates) {
            additionalInfo = `<div class="result-info">
              ${result.destination ? `<span><i class="ri-map-pin-line"></i> ${result.destination}</span>` : ''}
              ${result.duration ? `<span><i class="ri-time-line"></i> ${result.duration}</span>` : ''}
              ${result.joinDates ? `<span><i class="ri-calendar-line"></i> ${result.joinDates.join(', ')}</span>` : ''}
            </div>`;
          }
          
          const categoryBadge = result.category ? `<div class="result-category">${result.category}</div>` : '';
          
          return `
            <div class="search-result-item" data-type="${result.type}">
              <div class="result-header">
                <h4>${result.title}</h4>
                ${categoryBadge}
              </div>
              <p>${result.description}</p>
              ${additionalInfo}
              ${result.price ? `<div class="result-price">${result.price}</div>` : ''}
              <button class="view-result-btn" onclick="window.searchSystem.scrollToResult('${result.type}', '${result.title}')">
                ${buttonText}
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;
    
    modal.querySelector('.search-modal-content').innerHTML = resultsHtml;
    modal.style.display = 'flex';
    
    // Auto-close after 10 seconds
    setTimeout(() => {
      if (modal.style.display === 'flex') {
        modal.style.display = 'none';
      }
    }, 10000);
  }

  createSearchModal() {
    const modal = document.createElement('div');
    modal.id = 'search-results-modal';
    modal.className = 'search-modal';
    modal.innerHTML = '<div class="search-modal-content"></div>';
    document.body.appendChild(modal);
    
    // Add modal styles
    const modalStyles = `
      .search-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        z-index: 1000;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
      }
      .search-modal-content {
        background: white;
        border-radius: 20px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        width: 100%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        animation: modalSlideIn 0.3s ease-out;
      }
      @keyframes modalSlideIn {
        from { opacity: 0; transform: translateY(-50px) scale(0.9); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .search-results-header {
        padding: 2rem 2rem 1rem 2rem;
        border-bottom: 1px solid #e5e7eb;
        position: relative;
      }
      .search-results-header h3 {
        margin: 0 0 0.5rem 0;
        color: #22223b;
        font-size: 1.5rem;
      }
      .search-results-header p {
        margin: 0;
        color: #666;
      }
      .close-modal {
        position: absolute;
        top: 1rem;
        right: 1.5rem;
        background: none;
        border: none;
        font-size: 2rem;
        color: #999;
        cursor: pointer;
        line-height: 1;
      }
      .close-modal:hover {
        color: #333;
      }
      .search-results-list {
        padding: 1rem 2rem 2rem 2rem;
      }
      .search-result-item {
        padding: 1.5rem;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        margin-bottom: 1rem;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .search-result-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      }
      .search-result-item .result-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.5rem;
      }
      .search-result-item h4 {
        margin: 0;
        color: #22223b;
        font-size: 1.2rem;
        flex: 1;
      }
      .search-result-item .result-category {
        background: #f3f4f6;
        color: #374151;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 500;
        text-transform: capitalize;
        margin-left: 0.5rem;
      }
      .search-result-item p {
        margin: 0 0 1rem 0;
        color: #666;
        line-height: 1.5;
      }
      .result-price {
        font-size: 1.3rem;
        font-weight: 700;
        color: #fbbf24;
        margin: 0.5rem 0;
      }
      .result-info {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin: 0.5rem 0;
        font-size: 0.9rem;
        color: #666;
      }
      .result-info span {
        display: flex;
        align-items: center;
        gap: 0.3rem;
      }
      .result-info i {
        color: #fbbf24;
        font-size: 1rem;
      }
      .view-result-btn {
        background: #fbbf24;
        color: #22223b;
        border: none;
        padding: 0.7rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }
      .view-result-btn:hover {
        background: #f59e0b;
      }
      @media (max-width: 768px) {
        .search-modal-content {
          margin: 20px;
          max-height: 90vh;
        }
        .search-results-header, .search-results-list {
          padding: 1rem;
        }
      }
    `;
    
    if (!document.getElementById('search-modal-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'search-modal-styles';
      styleSheet.textContent = modalStyles;
      document.head.appendChild(styleSheet);
    }
    
    return modal;
  }

  showSuggestions(e) {
    const input = e.target;
    const query = input.value.toLowerCase().trim();
    
    if (query.length < 2) {
      this.hideSuggestions();
      return;
    }
    
    const suggestions = this.searchData
      .filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        (item.destination && item.destination.toLowerCase().includes(query))
      )
      .slice(0, 8) // Increased to show more suggestions
      .map(item => ({
        text: item.title,
        category: item.category,
        destination: item.destination || '',
        type: item.type
      }));
    
    this.displaySuggestions(suggestions, input);
  }

  createSuggestionsDropdown(input) {
    const dropdown = document.createElement('div');
    dropdown.id = 'search-suggestions';
    dropdown.className = 'search-suggestions-dropdown';
    input.parentNode.appendChild(dropdown);
    
    // Add suggestions styles
    const suggestionsStyles = `
      .search-suggestions-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        z-index: 100;
        display: none;
        max-height: 200px;
        overflow-y: auto;
      }
      .suggestion-item {
        padding: 0.8rem 1rem;
        cursor: pointer;
        border-bottom: 1px solid #f3f4f6;
        transition: background 0.2s;
      }
      .suggestion-item:hover {
        background: #f9fafb;
      }
      .suggestion-item:last-child {
        border-bottom: none;
      }
      .suggestion-text {
        font-weight: 600;
        color: #22223b;
      }
      .suggestion-category {
        font-size: 0.8rem;
        color: #666;
        text-transform: capitalize;
      }
    `;
    
    if (!document.getElementById('suggestions-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'suggestions-styles';
      styleSheet.textContent = suggestionsStyles;
      document.head.appendChild(styleSheet);
    }
  }

  displaySuggestions(suggestions, input) {
    const dropdown = document.getElementById('search-suggestions');
    if (!dropdown) return;
    
    if (suggestions.length === 0) {
      dropdown.style.display = 'none';
      return;
    }
    
    dropdown.innerHTML = suggestions.map(suggestion => {
      let categoryText = suggestion.category;
      if (suggestion.destination) {
        categoryText += ` • ${suggestion.destination}`;
      }
      if (suggestion.type && suggestion.type !== 'hot-location') {
        categoryText += ` • ${suggestion.type.replace('-trip', '').replace('-tour', '')}`;
      }
      
      return `
        <div class="suggestion-item" onclick="window.searchSystem.selectSuggestion('${suggestion.text}')">
          <div class="suggestion-text">${suggestion.text}</div>
          <div class="suggestion-category">${categoryText}</div>
        </div>
      `;
    }).join('');
    
    dropdown.style.display = 'block';
  }

  selectSuggestion(text) {
    const input = document.querySelector('input[placeholder*="Goa"]');
    if (input) {
      input.value = text;
      this.hideSuggestions();
      // Trigger input event to update any listeners
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  hideSuggestions() {
    const dropdown = document.getElementById('search-suggestions');
    if (dropdown) {
      dropdown.style.display = 'none';
    }
  }

  scrollToResult(type, title) {
    const modal = document.getElementById('search-results-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    
    // Find the search result item
    const searchItem = this.searchData.find(item => 
      item.type === type && item.title === title
    );
    
    if (!searchItem) return;
    
    // Handle all trip types that should redirect to trip detail pages
    const tripTypes = ['international-trip', 'upcoming-trip', 'domestic-trip', 'family-trip', 'weekend-trip', 'romantic-trip', 'corporate-trip', 'spiritual-tour'];
    
    // For API-based trips with IDs, navigate to trip detail page
    if (tripTypes.includes(type) && searchItem.id) {
      const tripType = type.replace('-trip', '').replace('-tour', '');
      window.location.href = `trip-detail.html?type=${tripType}&id=${searchItem.id}`;
      return;
    }
    
    // For hot locations, upcoming trips, and weekend trips from DOM, navigate to trip detail page
    if (type === 'hot-location' || type === 'upcoming-trip' || type === 'weekend-trip') {
      let tripType;
      if (type === 'hot-location') {
        tripType = 'location'; // Use 'location' for API endpoint
      } else if (type === 'upcoming-trip') {
        tripType = 'upcoming';
      } else if (type === 'weekend-trip') {
        tripType = 'weekend';
      }
      
      // If we have an ID, use it; otherwise use title
      if (searchItem.id) {
        window.location.href = `trip-detail.html?type=${tripType}&id=${searchItem.id}`;
      } else {
        const encodedTitle = encodeURIComponent(title);
        window.location.href = `trip-detail.html?type=${tripType}&title=${encodedTitle}`;
      }
      return;
    }
    
    // For other types, scroll to the actual element
    const element = searchItem.element;
    
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Highlight the element briefly
      element.style.transform = 'scale(1.05)';
      element.style.boxShadow = '0 8px 30px rgba(251, 191, 36, 0.4)';
      element.style.transition = 'all 0.3s ease';
      
      setTimeout(() => {
        element.style.transform = '';
        element.style.boxShadow = '';
      }, 2000);
    }
  }

  highlightSearchResults(results) {
    // Remove previous highlights
    document.querySelectorAll('.search-highlight').forEach(el => {
      el.classList.remove('search-highlight');
    });
    
    // Add highlights to found results
    results.forEach(result => {
      if (result.element) {
        result.element.classList.add('search-highlight');
      }
    });
    
    // Add highlight styles
    if (!document.getElementById('highlight-styles')) {
      const highlightStyles = `
        .search-highlight {
          border: 2px solid #fbbf24 !important;
          box-shadow: 0 0 20px rgba(251, 191, 36, 0.3) !important;
          animation: searchPulse 2s ease-in-out;
        }
        @keyframes searchPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `;
      const styleSheet = document.createElement('style');
      styleSheet.id = 'highlight-styles';
      styleSheet.textContent = highlightStyles;
      document.head.appendChild(styleSheet);
    }
    
    // Remove highlights after 5 seconds
    setTimeout(() => {
      document.querySelectorAll('.search-highlight').forEach(el => {
        el.classList.remove('search-highlight');
      });
    }, 5000);
  }

  hideSearchMessage() {
    const notification = document.getElementById('search-notification');
    if (notification) {
      notification.classList.remove('show');
    }
  }

  showSearchMessage(message) {
    // Create a simple notification
    let notification = document.getElementById('search-notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'search-notification';
      notification.className = 'search-notification';
      document.body.appendChild(notification);
      
      // Add notification styles
      const notificationStyles = `
        .search-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #fbbf24;
          color: #22223b;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          z-index: 1001;
          font-weight: 600;
          max-width: 350px;
          transform: translateX(400px);
          transition: transform 0.3s ease;
        }
        .search-notification.show {
          transform: translateX(0);
        }
        @media (max-width: 768px) {
          .search-notification {
            top: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
          }
        }
      `;
      
      if (!document.getElementById('notification-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'notification-styles';
        styleSheet.textContent = notificationStyles;
        document.head.appendChild(styleSheet);
      }
    }
    
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, 4000);
  }
}

// Newsletter form functionality
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
  newsletterForm.addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Thank you for subscribing!');
    newsletterForm.reset();
  });
}

// Top Destinations Filtering & Animation
const filterButtons = document.querySelectorAll('.top-destinations-filters .filter-btn');
const destinationCards = document.querySelectorAll('.top-destinations-grid .top-destination-card');

filterButtons.forEach(btn => {
  btn.addEventListener('click', function() {
    // Remove active/selected from all
    filterButtons.forEach(b => b.classList.remove('active', 'selected'));
    this.classList.add('active', 'selected');
    const filter = this.getAttribute('data-filter');
    destinationCards.forEach(card => {
      if (filter === 'all' || card.getAttribute('data-category') === filter) {
        card.classList.remove('hide');
      } else {
        card.classList.add('hide');
      }
    });
  });
});

// Animate cards on load
window.addEventListener('DOMContentLoaded', () => {
  destinationCards.forEach((card, i) => {
    card.style.opacity = 0;
    card.style.transform = 'translateY(30px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.6s, transform 0.6s';
      card.style.opacity = 1;
      card.style.transform = 'translateY(0)';
    }, 200 + i * 120);
  });
});

// Generic Slider Functionality with Looping
function setupSlider(gridId, leftArrowSelector, rightArrowSelector, cardWidth, gap) {
  const grid = document.getElementById(gridId);
  const leftArrow = document.querySelector(leftArrowSelector);
  const rightArrow = document.querySelector(rightArrowSelector);

  if (grid && leftArrow && rightArrow) {
    const scrollAmount = cardWidth + gap;

    // Left arrow click handler
    leftArrow.addEventListener('click', () => {
      const maxScroll = grid.scrollWidth - grid.clientWidth;
      if (grid.scrollLeft <= 0) {
        grid.scrollTo({
          left: maxScroll,
          behavior: 'auto' // Instant jump to the end
        });
      } else {
        const targetScroll = Math.max(0, grid.scrollLeft - scrollAmount);
        grid.scrollTo({
          left: targetScroll,
          behavior: 'smooth'
        });
      }
    });

    // Right arrow click handler
    rightArrow.addEventListener('click', () => {
      const maxScroll = grid.scrollWidth - grid.clientWidth;
      if (grid.scrollLeft >= maxScroll - 10) { // Added a small threshold for floating point errors
        grid.scrollTo({
          left: 0,
          behavior: 'auto' // Instant jump to the beginning
        });
      } else {
        const targetScroll = Math.min(maxScroll, grid.scrollLeft + scrollAmount);
        grid.scrollTo({
          left: targetScroll,
          behavior: 'smooth'
        });
      }
    });

    // Add hover effects (no opacity change as arrows are always active)
    [leftArrow, rightArrow].forEach(arrow => {
      arrow.addEventListener('mouseenter', () => {
        arrow.style.transform = 'scale(1.1)';
      });

      arrow.addEventListener('mouseleave', () => {
        arrow.style.transform = 'scale(1)';
      });
    });
  }
}

// Initialize sliders for each section
// Note: Adjust cardWidth and gap if different sections have different card sizes/gaps
setupSlider('hotLocationsGrid', '.hot-locations-section .left-arrow', '.hot-locations-section .right-arrow', 300, 32);
setupSlider('upcomingTripsGrid', '.upcoming-trips-section .left-arrow', '.upcoming-trips-section .right-arrow', 300, 32); // Assuming same card width and gap as hot locations
setupSlider('weekendTripsGrid', '.weekend-trips-section .left-arrow', '.weekend-trips-section .right-arrow', 300, 32); // Assuming same card width and gap as hot locations

// Smooth scrolling for anchor links (optional, if you have any)
// document.querySelectorAll('a[href^="#"]').forEach(anchor => {
//   anchor.addEventListener('click', function (e) {
//     e.preventDefault();

//     document.querySelector(this.getAttribute('href')).scrollIntoView({
//       behavior: 'smooth'
//     });
//   });
// });

document.addEventListener('DOMContentLoaded', () => {
  // Handle dropdown toggling on click
  document.querySelectorAll('.main-nav li.has-dropdown > a').forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault(); // Prevent default link behavior
      const parentLi = link.closest('.has-dropdown');

      // Close other open dropdowns
      document.querySelectorAll('.main-nav li.has-dropdown.active').forEach(openDropdown => {
        if (openDropdown !== parentLi) {
          openDropdown.classList.remove('active');
        }
      });

      // Toggle the active class on the clicked dropdown's parent li
      parentLi.classList.toggle('active');
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (event) => {
    document.querySelectorAll('.main-nav li.has-dropdown.active').forEach(openDropdown => {
      if (!openDropdown.contains(event.target)) {
        openDropdown.classList.remove('active');
      }
    });
  });

  // Keep dropdown open when clicked inside (already implemented, but re-confirming here for clarity)
  document.querySelectorAll('.main-nav .dropdown-menu').forEach(dropdown => {
    dropdown.addEventListener('click', (event) => {
      event.stopPropagation();
    });
  });

  // Optional: If you want to prevent the default link behavior for dropdown items
  document.querySelectorAll('.dropdown-column a').forEach(link => {
    link.addEventListener('click', (event) => {
      // event.preventDefault(); // Uncomment if you want to handle navigation via JS
      // Add your logic here to load content based on the clicked link
      console.log('Dropdown link clicked:', event.target.textContent);
      // The dropdown will now stay open unless you click outside or click the main nav item again.
    });
  });
});

// Authentication Modal Functionality
document.addEventListener('DOMContentLoaded', () => {
  const signInBtn = document.getElementById('signInBtn');
  const authModal = document.getElementById('authModal');
  const modalClose = document.getElementById('modalClose');

  // Open modal when sign-in button is clicked
  if (signInBtn && authModal) {
    signInBtn.addEventListener('click', (e) => {
      e.preventDefault();
      authModal.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    });
  }

  // Close modal when close button is clicked
  if (modalClose && authModal) {
    modalClose.addEventListener('click', () => {
      authModal.classList.remove('active');
      document.body.style.overflow = 'auto'; // Restore scrolling
    });
  }

  // Close modal when clicking outside the modal content
  if (authModal) {
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) {
        authModal.classList.remove('active');
        document.body.style.overflow = 'auto';
      }
    });
  }

  // Close modal on Escape key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && authModal && authModal.classList.contains('active')) {
      authModal.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  });
});

// Community Banner Slider
document.addEventListener('DOMContentLoaded', () => {
  const bannerImages = document.querySelectorAll('.community-banner-img');
  const bannerTextTop = document.getElementById('banner-text-top');
  const bannerTextMain = document.getElementById('banner-text-main');
  const bannerTextBottom = document.getElementById('banner-text-bottom');
  const communityBannerOverlay = document.querySelector('.community-banner-overlay');
  const bannerLines = document.querySelectorAll('.banner-line');
  let currentImageIndex = 0;

  function updateBannerText(imageElement) {
    // Hide current text and lines
    bannerTextTop.style.opacity = 0;
    bannerTextMain.style.opacity = 0;
    bannerTextBottom.style.opacity = 0;
    bannerTextTop.style.transform = 'translateY(10px)';
    bannerTextMain.style.transform = 'translateY(10px)';
    bannerTextBottom.style.transform = 'translateY(10px)';
    bannerLines.forEach(line => line.classList.remove('active'));

    // Remove previous alignment class
    communityBannerOverlay.classList.remove('align-left', 'align-right', 'align-center');

    setTimeout(() => {
      // Update text content
      bannerTextTop.textContent = imageElement.dataset.textTop;
      bannerTextMain.textContent = imageElement.dataset.textMain;
      bannerTextBottom.textContent = imageElement.dataset.textBottom;

      // Apply new alignment class
      const alignment = imageElement.dataset.align;
      if (alignment) {
        communityBannerOverlay.classList.add(`align-${alignment}`);
      }

      // Show text
      bannerTextTop.style.opacity = 1;
      bannerTextMain.style.opacity = 1;
      bannerTextBottom.style.opacity = 1;
      bannerTextTop.style.transform = 'translateY(0)';
      bannerTextMain.style.transform = 'translateY(0)';
      bannerTextBottom.style.transform = 'translateY(0)';

      // Show lines if main text is "Corporate"
      if (imageElement.dataset.textMain === 'Corporate') {
        bannerLines.forEach(line => line.classList.add('active'));
      }
    }, 500); // Half of the image transition time
  }

  function showNextImage() {
    const currentImage = bannerImages[currentImageIndex];
    currentImage.classList.remove('active');
    currentImage.classList.add('prev');
    
    currentImageIndex = (currentImageIndex + 1) % bannerImages.length;
    const nextImage = bannerImages[currentImageIndex];
    nextImage.classList.add('active');
    
    // Reset the previous image's transform after animation
    setTimeout(() => {
      currentImage.classList.remove('prev');
    }, 1000);
    
    updateBannerText(nextImage);
  }

  // Initial text load
  updateBannerText(bannerImages[currentImageIndex]);

  // Set interval for auto-rotation (e.g., every 5 seconds)
  setInterval(showNextImage, 5000);
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

  // Show welcome message logic
  const hasVisited = localStorage.getItem('traowl_home_visited');
  if (!hasVisited) {
    showSpiritualMessage('Welcome to Traowl!');
    localStorage.setItem('traowl_home_visited', 'yes');
  } else {
    showSpiritualMessage('Welcome to Traowl!');
  }
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

// --- Scroll-to-top button system (copied from spiritual-tours.js) ---
(function() {
  // Add button styles
  const style = document.createElement('style');
  style.textContent = `
    .scroll-to-top {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #ffe066 !important;
      color: #333 !important;
      border: none;
      cursor: pointer;
      display: none;
      z-index: 1000;
      transition: all 0.3s ease;
      box-shadow: 0 4px 16px #FFE0B3;
      font-size: 2rem;
      outline: none;
    }
    .scroll-to-top:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 24px #ffe066, 0 0 20px #FFE0B3;
    }
  `;
  document.head.appendChild(style);

  // Create button
  const scrollToTopBtn = document.createElement('button');
  scrollToTopBtn.innerHTML = '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="16" fill="url(#paint0_linear)"/><path d="M16 22V10M16 10L10 16M16 10L22 16" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><defs><linearGradient id="paint0_linear" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop stop-color="#FF9933"/><stop offset="1" stop-color="#FF7700"/></linearGradient></defs></svg>';
  scrollToTopBtn.className = 'scroll-to-top';
  document.body.appendChild(scrollToTopBtn);

  // Show/hide button on scroll
  window.addEventListener('scroll', function() {
    if (window.scrollY > 200) {
      scrollToTopBtn.style.display = 'block';
    } else {
      scrollToTopBtn.style.display = 'none';
    }
  });

  // Scroll to top and show pop-up on click
  scrollToTopBtn.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof showSpiritualMessage === 'function') {
      showSpiritualMessage('You are at the top!');
    }
  });
})(); 

// Typewriter animated search placeholder
function initializeAnimatedPlaceholder() {
  const searchInput = document.getElementById('animated-search-input');
  if (!searchInput) return;

  const destinations = [
    'Goa',
    'Bali',
    'Kashmir',
    'Manali',
    'Rishikesh',
    'Shimla',
    'Ladakh',
    'Varanasi',
    'Jaipur',
    'Udaipur'
  ];

  const prefix = 'Search for ';
  const suffix = '...';
  
  let currentIndex = 0;
  let currentDestination = '';
  let charIndex = 0;
  let isDeleting = false;
  let typingSpeed = 100; // milliseconds per character

  function typeWriter() {
    const fullDestination = destinations[currentIndex];
    
    if (isDeleting) {
      // Deleting effect - only delete the destination part
      currentDestination = fullDestination.substring(0, currentDestination.length - 1);
      typingSpeed = 50; // Faster deletion
    } else {
      // Typing effect - only type the destination part
      currentDestination = fullDestination.substring(0, charIndex + 1);
      typingSpeed = 100; // Normal typing speed
    }

    // Combine prefix + current destination + suffix
    searchInput.placeholder = prefix + currentDestination + suffix;

    if (!isDeleting && charIndex < fullDestination.length) {
      // Still typing destination
      charIndex++;
      setTimeout(typeWriter, typingSpeed);
    } else if (isDeleting && currentDestination === '') {
      // Finished deleting destination, move to next destination
      isDeleting = false;
      currentIndex = (currentIndex + 1) % destinations.length;
      charIndex = 0;
      setTimeout(typeWriter, 1000); // Pause before next destination
    } else if (!isDeleting && charIndex === fullDestination.length) {
      // Finished typing destination, start deleting after pause
      setTimeout(() => {
        isDeleting = true;
        typeWriter();
      }, 2000); // Pause at end of destination
    } else {
      // Continue current action
      setTimeout(typeWriter, typingSpeed);
    }
  }

  // Start the typewriter effect
  typeWriter();
}

// After header loads, inject the shared modal
window.addEventListener('DOMContentLoaded', function() {
  if (typeof CommonComponents !== 'undefined') {
    (new CommonComponents()).addModalHTML();
  }
  
  // Initialize animated placeholder
  initializeAnimatedPlaceholder();
  
  // Re-initialize search data after all content is loaded
  setTimeout(() => {
    if (window.searchSystem) {
      window.searchSystem.searchData = window.searchSystem.initializeSearchData();
    }
  }, 2000); // Wait for all cards to be loaded
}); 
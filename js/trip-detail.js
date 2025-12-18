// Get URL parameters
function getUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    type: urlParams.get('type'),
    id: urlParams.get('id'),
    title: urlParams.get('title'),
    trip: urlParams.get('trip')
  };
}

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
function initializeSlider() {
  const slider = document.querySelector('.slider');
  const slides = document.querySelectorAll('.slide');
  const prevBtn = document.querySelector('.slider-btn.prev');
  const nextBtn = document.querySelector('.slider-btn.next');
  
  if (!slides.length) return;
  
  let currentSlide = 0;
  const slideCount = slides.length;

  // Get the computed style for gap from the slider
  const computedSliderStyle = window.getComputedStyle(slider);
  const gapString = computedSliderStyle.getPropertyValue('gap');
  const gap = parseFloat(gapString);

  // Calculate the effective width to move for one slide
  const slideEffectiveWidth = slides[0].getBoundingClientRect().width + gap;
  const visibleSlides = 3;

  function updateSlider() {
    slider.style.transform = `translateX(-${currentSlide * slideEffectiveWidth}px)`;
  }

  function nextSlide() {
    if (currentSlide < slideCount - visibleSlides + 1) {
      currentSlide++;
    } else {
      currentSlide = 0;
    }
    updateSlider();
  }

  function prevSlide() {
    if (currentSlide > 0) {
      currentSlide--;
    } else {
      currentSlide = slideCount - visibleSlides + 1;
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
}

// Render image slider with image generation
function renderImageSlider(images, type, tripTitle) {
  const sliderContainer = document.getElementById('trip-slider');
  if (!sliderContainer) return;
  
  // Clear existing content
  sliderContainer.innerHTML = '';
  
  // If no images provided, generate based on trip title
  if (!images || images.length === 0) {
    const generatedImage = `images/${tripTitle} 1.webp`;
    images = [generatedImage];
  }
  
  // Use image generation logic if available
  let allImages = [];
  if (images && images.length > 0) {
    images.forEach(image => {
      allImages.push(image);
      
      // Generate sequence using ImageUtils if available
      if (window.ImageUtils) {
        const generatedImages = window.ImageUtils.generateImageSequence(image);
        allImages = allImages.concat(generatedImages);
      }
    });
  }
  
  // Fallback images in case nothing loads
  const fallbackImages = [
    'images/weekendMain.webp',
    'images/familytripMain.webp',
    'images/upcomingMain.webp',
    'images/romanticMain.webp',
    'images/spiritualMain.webp',
    'images/domesticMain.webp'
  ];
  
  // If still no images, use fallback
  if (allImages.length === 0) {
    allImages = fallbackImages;
  }
  
  // Create slider slides
  allImages.forEach((imageUrl, index) => {
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.innerHTML = `<img src="${imageUrl}" alt="${tripTitle} ${index + 1}" onerror="this.src='${fallbackImages[index % fallbackImages.length]}'">`;
    sliderContainer.appendChild(slide);
  });
  
  console.log('Slider rendered with', allImages.length, 'images');
}

// Find trip by title from API
async function findTripByTitle(type, title) {
  try {
    let endpoint;
    
    // Map type to API endpoint
    switch (type) {
      case 'family':
        endpoint = '/api/family-trips';
        break;
      case 'romantic':
        endpoint = '/api/romantic-trips';
        break;
      case 'weekend':
        endpoint = '/api/weekend-trips';
        break;
      case 'domestic':
        endpoint = '/api/domestic-trips';
        break;
      case 'spiritual':
        endpoint = '/api/spiritual-tours';
        break;
      case 'corporate':
        endpoint = '/api/corporate-trips';
        break;
      case 'upcoming':
        endpoint = '/api/upcoming-trips';
        break;
      case 'international':
        endpoint = '/api/international-trips';
        break;
      case 'location':
        endpoint = '/api/hot-locations';
        break;
      default:
        return null;
    }
    
    const response = await fetch(endpoint);
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    // Find the trip by title (case-insensitive)
    const searchTitle = title.toLowerCase().trim();
    let foundTrip = null;
    
    // Handle different data structures
    if (data.hotLocations) {
      foundTrip = data.hotLocations.find(trip => 
        trip.title.toLowerCase().trim() === searchTitle
      );
    } else if (data.familyTrips) {
      foundTrip = data.familyTrips.find(trip => 
        trip.title.toLowerCase().trim() === searchTitle
      );
    } else if (data.romanticTrips) {
      foundTrip = data.romanticTrips.find(trip => 
        trip.title.toLowerCase().trim() === searchTitle
      );
    } else if (data.weekendTrips) {
      foundTrip = data.weekendTrips.find(trip => 
        trip.title.toLowerCase().trim() === searchTitle
      );
    } else if (data.domesticTrips) {
      foundTrip = data.domesticTrips.find(trip => 
        trip.title.toLowerCase().trim() === searchTitle
      );
    } else if (data.spiritualTours) {
      foundTrip = data.spiritualTours.find(trip => 
        trip.title.toLowerCase().trim() === searchTitle
      );
    } else if (data.corporateTrips) {
      foundTrip = data.corporateTrips.find(trip => 
        trip.title.toLowerCase().trim() === searchTitle
      );
    } else if (data.upcomingTrips) {
      foundTrip = data.upcomingTrips.find(trip => 
        trip.title.toLowerCase().trim() === searchTitle
      );
    } else if (data.internationalTrips) {
      foundTrip = data.internationalTrips.find(trip => 
        trip.title.toLowerCase().trim() === searchTitle
      );
    } else if (Array.isArray(data)) {
      foundTrip = data.find(trip => 
        trip.title.toLowerCase().trim() === searchTitle
      );
    }
    
    return foundTrip || null;
    
  } catch (error) {
    console.error('Error finding trip by title:', error);
    return null;
  }
}

// Load trip details based on URL parameters
async function loadTripDetails() {
  const params = getUrlParams();
  const { type, id, title, trip } = params;
  
  if (!type || (!id && !title)) {
    showErrorMessage('Invalid trip parameters');
    return;
  }

  try {
    let response;
    let tripData;
    
    // If we have a title, search by title first
    if (title) {
      tripData = await findTripByTitle(type, title);
      if (tripData) {
        renderTripDetails(tripData, type);
        return;
      }
    }
    
    // Load trip data based on type and ID
    switch (type) {
      case 'family':
        response = await fetch(`/api/family-trips/${id}`);
        break;
      case 'romantic':
        response = await fetch(`/api/romantic-trips/${id}`);
        break;
      case 'weekend':
        response = await fetch(`/api/weekend-trips/${id}`);
        break;
      case 'domestic':
        response = await fetch(`/api/domestic-trips/${id}`);
        break;
      case 'spiritual':
        response = await fetch(`/api/spiritual-tours/${id}`);
        break;
      case 'corporate':
        response = await fetch(`/api/corporate-trips/${id}`);
        break;
      case 'upcoming':
        response = await fetch(`/api/upcoming-trips/${id}`);
        break;
      case 'international':
        response = await fetch(`/api/international-trips/${id}`);
        break;
      case 'location':
        response = await fetch(`/api/hot-locations/${id}`);
        break;

      default:
        showErrorMessage('Invalid trip type');
        return;
    }

    if (!response.ok) {
      throw new Error('Failed to load trip data');
    }

    tripData = await response.json();
    renderTripDetails(tripData, type);
    
  } catch (error) {
    console.error('Error loading trip details:', error);
    showErrorMessage('Failed to load trip details');
  }
}

// Render trip details
function renderTripDetails(trip, type) {
  // Hide loading spinner and show content
  document.getElementById('loading-spinner').style.display = 'none';
  document.getElementById('trip-content').style.display = 'block';

  // Update page title and breadcrumb
  document.title = `Traowl | ${trip.title}`;
  document.getElementById('breadcrumb-title').textContent = trip.title;
  
  // Update breadcrumb category with proper link
  const breadcrumbCategory = document.getElementById('breadcrumb-category');
  breadcrumbCategory.textContent = getCategoryName(type);
  breadcrumbCategory.href = getCategoryPageUrl(type);

  // Update main trip information
  document.getElementById('trip-title').textContent = trip.title;
  document.getElementById('trip-duration').textContent = trip.duration;
  document.getElementById('trip-destination').textContent = trip.destination;
  document.getElementById('trip-difficulty').textContent = trip.difficulty || 'Easy';

  // Update pricing
  const price = trip.price ? `₹ ${trip.price.toLocaleString()}/-` : '₹ 15,000/-';
  const oldPrice = trip.oldPrice ? `₹ ${trip.oldPrice.toLocaleString()}/-` : '';
  
  document.getElementById('trip-new-price').textContent = price;
  if (oldPrice) {
    document.getElementById('trip-old-price').textContent = oldPrice;
  } else {
    document.getElementById('trip-old-price').style.display = 'none';
  }

  // Update feature information
  updateFeatureInfo(trip);

  // Render image slider
  console.log('Trip image:', trip.image);
  console.log('Trip has image:', !!trip.image);
  
  // Handle cases where trip.image might be undefined, null, or empty
  const imageToPass = trip.image && trip.image.trim() !== '' ? trip.image : null;
  console.log('Image to pass to slider:', imageToPass);
  
  renderImageSlider(imageToPass ? [imageToPass] : [], type, trip.title);

  // Render itinerary
  if (trip.itinerary) {
    renderItinerary(trip.itinerary);
  }

  // Render highlights
  if (trip.highlights) {
    renderHighlights(trip.highlights);
  }

  // Render other information
  renderOtherInfo(trip);

  // Render inclusions and exclusions
  if (trip.included && trip.excluded) {
    renderInclusionsExclusions(trip.included, trip.excluded);
  }

  // Load similar trips
  loadSimilarTrips(type, trip.id);

  // Initialize book now button
  handleBookNowClick(trip);

  // Initialize sidebar box
  updateSidebarBox(trip);

  // Initialize slider after content is loaded
  setTimeout(initializeSlider, 100);
}

// Update feature information
function updateFeatureInfo(trip) {
  // Transportation info
  const transportationInfo = document.getElementById('transportation-info');
  transportationInfo.textContent = trip.included ? 
    trip.included.filter(item => item.toLowerCase().includes('flight') || item.toLowerCase().includes('transport')).join(', ') || 
    'Flight tickets and local transportation included' : 
    'Flight tickets and local transportation included';

  // Meals info
  const mealsInfo = document.getElementById('meals-info');
  mealsInfo.textContent = trip.included ? 
    trip.included.filter(item => item.toLowerCase().includes('meal') || item.toLowerCase().includes('breakfast') || item.toLowerCase().includes('dinner')).join(', ') || 
    'All meals included' : 
    'All meals included';

  // Stay info
  const stayInfo = document.getElementById('stay-info');
  stayInfo.textContent = trip.included ? 
    trip.included.filter(item => item.toLowerCase().includes('hotel') || item.toLowerCase().includes('accommodation') || item.toLowerCase().includes('stay')).join(', ') || 
    'Hotel accommodation included' : 
    'Hotel accommodation included';

  // Sightseeing info
  const sightseeingInfo = document.getElementById('sightseeing-info');
  sightseeingInfo.textContent = trip.highlights ? 
    trip.highlights.slice(0, 3).join(', ') : 
    'Local sightseeing and activities included';

  // Assistance info
  const assistanceInfo = document.getElementById('assistance-info');
  assistanceInfo.textContent = '24/7 customer support and guide assistance throughout the trip';
}

// Generate trip-specific image names based on trip title
function getTripSpecificImages(tripTitle, count = 5) {
  if (!tripTitle) return [];
  
  const images = [];
  
  // Clean the trip title for file naming (remove special characters, spaces, etc.)
  const cleanTitle = tripTitle
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim(); // Remove leading/trailing spaces
  
  // Generate image names based on the trip title
  for (let i = 1; i <= count; i++) {
    const imageName = `images/${cleanTitle}${i}.webp`;
    // URL encode the image name to handle spaces
    const encodedImageName = encodeURI(imageName);
    images.push(encodedImageName);
  }
  
  return images;
}

// Fallback images in case trip-specific images don't exist
function getFallbackImages(count = 5) {
  const fallbackImages = [
    'images/hero-bg.webp',
    'images/adventure1.webp',
    'images/adventure2.webp',
    'images/manali.webp',
    'images/nainital.webp',
    'images/spiritual-hero.webp',
    'images/weekend1.webp',
    'images/top1.webp',
    'images/kasol.webp',
    'images/gulmarg.webp'
  ];
  
  // Shuffle and return the requested count
  const shuffled = fallbackImages.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Generate image sequence based on base image name
function generateImageSequence(baseImage) {
  console.log('generateImageSequence called with:', baseImage);
  
  // Remove the file extension first
  let baseName = baseImage.replace(/\.webp$/i, '');
  console.log('Base name after removing extension:', baseName);
  
  // Analyze the naming pattern
  const imagePattern = analyzeImagePattern(baseName);
  console.log('Detected image pattern:', imagePattern);
  
  if (!imagePattern.hasNumber && !imagePattern.couldHaveSequence) {
    console.log('Image appears to be standalone (no number pattern), checking for possible sequences');
    // Try to find if there are numbered versions anyway
    return tryGenerateSequenceFromStandalone(baseName);
  }
  
  // Generate images based on detected pattern
  const generatedImages = [];
  const startIndex = imagePattern.hasNumber ? 2 : 1;
  
  for (let i = startIndex; i <= 6; i++) {
    const imageName = constructImageName(imagePattern.baseName, i, imagePattern);
    generatedImages.push(imageName);
    console.log(`Generated image ${i}: ${imageName}`);
  }
  
  return generatedImages;
}

// Analyze the image naming pattern
function analyzeImagePattern(baseName) {
  console.log('Analyzing pattern for:', baseName);
  
  const pattern = {
    originalName: baseName,
    baseName: baseName,
    hasNumber: false,
    numberSeparator: '',
    couldHaveSequence: true,
    caseStyle: 'mixed' // 'lower', 'upper', 'title', 'mixed'
  };
  
  // Detect case style
  if (baseName === baseName.toLowerCase()) {
    pattern.caseStyle = 'lower';
  } else if (baseName === baseName.toUpperCase()) {
    pattern.caseStyle = 'upper';
  } else if (baseName.split(/[\s\-_]+/).every(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() === word)) {
    pattern.caseStyle = 'title';
  }
  
  console.log('Detected case style:', pattern.caseStyle);
  
  // Check for numbers at the end with various separators
  const patterns = [
    /^(.+)(\s+)(\d+)$/,           // "Kerala backwaters and Ayurveda 1"
    /^(.+)(-+)(\d+)$/,            // "kerala-backwaters-and-ayurveda-1"
    /^(.+)(_+)(\d+)$/,            // "kerala_backwaters_and_ayurveda_1"
    /^(.+)(\.)(\d+)$/,            // "kerala.backwaters.and.ayurveda.1"
    /^(.+)()(\d+)$/               // "keralbackwatersandayurveda1"
  ];
  
  for (const regex of patterns) {
    const match = baseName.match(regex);
    if (match) {
      pattern.hasNumber = true;
      pattern.baseName = match[1];
      pattern.numberSeparator = match[2];
      pattern.currentNumber = parseInt(match[3]);
      console.log(`Found number pattern: base="${pattern.baseName}", separator="${pattern.numberSeparator}", number=${pattern.currentNumber}`);
      break;
    }
  }
  
  return pattern;
}

// Try to generate sequence from standalone image
function tryGenerateSequenceFromStandalone(baseName) {
  console.log('Trying to generate sequence from standalone:', baseName);
  
  const generatedImages = [];
  
  // Try different naming patterns that might exist
  const patterns = [
    (base, i) => `${base} ${i}.webp`,          // "hampta 1.webp"
    (base, i) => `${base}-${i}.webp`,          // "hampta-1.webp"  
    (base, i) => `${base}_${i}.webp`,          // "hampta_1.webp"
    (base, i) => `${base}${i}.webp`,           // "hampta1.webp"
    (base, i) => `${base}.${i}.webp`           // "hampta.1.webp"
  ];
  
  // Generate using the most common pattern first (space separator)
  for (let i = 2; i <= 6; i++) {
    const imageName = `${baseName} ${i}.webp`;
    generatedImages.push(imageName);
    console.log(`Generated from standalone ${i}: ${imageName}`);
  }
  
  return generatedImages;
}

// Construct image name based on pattern
function constructImageName(baseName, number, pattern) {
  const separator = pattern.numberSeparator || ' ';
  return `${baseName}${separator}${number}.webp`;
}

// Render image slider
function renderImageSlider(images, tripType = 'general', tripTitle = '') {
  const slider = document.getElementById('trip-slider');
  slider.innerHTML = '';
  
  let imagesToUse = [];
  
  console.log('renderImageSlider called with:', { images, tripType, tripTitle });
  console.log('First image:', images?.[0]);
  console.log('Images array length:', images?.length);
  
  // If we have provided images, use them first
  if (images && images.length > 0 && images[0] && images[0].trim() !== '') {
    // Get the base image name
    const baseImage = images[0];
    console.log('Processing base image:', baseImage);
    
    // First, try to use the exact image provided
    imagesToUse.push(baseImage);
    console.log('Added exact image:', baseImage);
    
    // Extract the base name and generate multiple images
    const generatedImages = generateImageSequence(baseImage);
    if (generatedImages.length > 0) {
      imagesToUse.push(...generatedImages);
      console.log('Generated images:', generatedImages);
    }
    
    console.log('Images to use after generation:', imagesToUse);
  }
  
  // If no images found, generate trip-specific images based on trip title
  if (imagesToUse.length === 0) {
    console.log('No provided images, generating trip-specific images for:', tripTitle);
    imagesToUse = getTripSpecificImages(tripTitle, 5);
  }
  
  // If still no images, use fallback images
  if (imagesToUse.length === 0) {
    console.log('No trip-specific images found, using fallback images');
    imagesToUse = getFallbackImages(5);
  }
  
  // Get a reliable fallback image for error handling
  const fallbackImage = getFallbackImages(1)[0];
  
  console.log('Rendering slider for trip:', tripTitle);
  console.log('Images to use:', imagesToUse);
  console.log('Fallback image:', fallbackImage);
  
  imagesToUse.forEach((image, index) => {
    const slide = document.createElement('div');
    slide.className = 'slide';
    
    // Encode image URL to handle spaces and special characters in filenames
    const encodedImageUrl = image ? encodeURI(image) : fallbackImage;
    const encodedFallbackImage = fallbackImage ? encodeURI(fallbackImage) : 'images/top1.webp';
    
    console.log(`Rendering slide ${index + 1}:`, {
      original: image,
      encoded: encodedImageUrl
    });
    
    // Add error handling for missing images
    slide.innerHTML = `
      <img src="${encodedImageUrl}" 
           alt="${tripTitle} - Image ${index + 1}" 
           loading="lazy"
           onerror="this.onerror=null; this.src='${encodedFallbackImage}'; console.log('Image failed to load:', '${encodedImageUrl}');">
    `;
    slider.appendChild(slide);
  });
}

// Render itinerary
function renderItinerary(itinerary) {
  const container = document.getElementById('itinerary-content');
  container.innerHTML = '';
  
  itinerary.forEach(day => {
    const dayCard = document.createElement('div');
    dayCard.className = 'day-card';
    
    // Handle different itinerary formats
    let activitiesHtml = '';
    if (day.activities && Array.isArray(day.activities)) {
      // Format: { day: 1, title: "...", activities: ["activity1", "activity2"] }
      activitiesHtml = day.activities.map(activity => `<li>${activity}</li>`).join('');
    } else if (day.description) {
      // Format: { day: 1, title: "...", description: "activity description" }
      activitiesHtml = `<li>${day.description}</li>`;
    } else if (day.activities && typeof day.activities === 'string') {
      // Format: { day: 1, title: "...", activities: "activity description" }
      activitiesHtml = `<li>${day.activities}</li>`;
    }
    
    dayCard.innerHTML = `
      <div class="day-header">
        <div class="day-circle">${day.day}</div>
        <div class="day-content-header">
          <h3>${day.title}</h3>
          <span class="day-arrow">&#9662;</span>
        </div>
      </div>
      <ul>
        ${activitiesHtml}
      </ul>
    `;
    container.appendChild(dayCard);
  });

  // Add click event for day cards
  document.querySelectorAll('.day-card').forEach(dayCard => {
    const arrow = dayCard.querySelector('.day-arrow');
    if (arrow) {
      arrow.addEventListener('click', function(e) {
        e.stopPropagation();
        document.querySelectorAll('.day-card.active').forEach(activeCard => {
          if (activeCard !== dayCard) {
            activeCard.classList.remove('active');
          }
        });
        dayCard.classList.toggle('active');
      });
    }
  });
}

// Render highlights
function renderHighlights(highlights) {
  const container = document.getElementById('highlights-content');
  container.innerHTML = `
    <div class="highlights-grid">
      ${highlights.map(highlight => `
        <div class="highlight-item">
          <span class="highlight-icon">✨</span>
          <p>${highlight}</p>
        </div>
      `).join('')}
    </div>
  `;
}

// Render other information
function renderOtherInfo(trip) {
  const container = document.getElementById('other-info-content');
  container.innerHTML = `
    <div class="other-info-grid">
      ${trip.maxAltitude ? `
        <div class="info-item">
          <strong>Maximum Altitude:</strong> ${trip.maxAltitude}
        </div>
      ` : ''}
      ${trip.bestTime ? `
        <div class="info-item">
          <strong>Best Time to Visit:</strong> ${trip.bestTime}
        </div>
      ` : ''}
      ${trip.suitableFor ? `
        <div class="info-item">
          <strong>Suitable For:</strong> ${trip.suitableFor}
        </div>
      ` : ''}
      ${trip.description ? `
        <div class="info-item">
          <strong>Description:</strong> ${trip.description}
        </div>
      ` : ''}
    </div>
  `;
}

// Render inclusions and exclusions
function renderInclusionsExclusions(included, excluded) {
  const inclusionsList = document.getElementById('inclusions-list');
  const exclusionsList = document.getElementById('exclusions-list');
  
  inclusionsList.innerHTML = included.map(item => `<li>${item}</li>`).join('');
  exclusionsList.innerHTML = excluded.map(item => `<li>${item}</li>`).join('');
}

// Load similar trips
async function loadSimilarTrips(type, currentTripId) {
  try {
    let response;
    let similarTrips = [];
    
    // Load similar trips based on type
    switch (type) {
      case 'family':
        response = await fetch('/api/family-trips');
        if (response.ok) {
          const data = await response.json();
          similarTrips = data.familyTrips.filter(trip => trip.id !== currentTripId).slice(0, 3);
        }
        break;
      case 'romantic':
        response = await fetch('/api/romantic-trips');
        if (response.ok) {
          const data = await response.json();
          similarTrips = data.romanticTrips.filter(trip => trip.id !== currentTripId).slice(0, 3);
        }
        break;
      case 'upcoming':
        response = await fetch('/api/upcoming-trips');
        if (response.ok) {
          const data = await response.json();
          similarTrips = data.upcomingTrips.filter(trip => trip.id !== currentTripId).slice(0, 3);
        }
        break;
      case 'weekend':
        response = await fetch('/api/weekend-trips');
        if (response.ok) {
          const data = await response.json();
          similarTrips = data.weekendTrips.filter(trip => trip.id !== currentTripId).slice(0, 3);
        }
        break;
      case 'domestic':
        response = await fetch('/api/domestic-trips');
        if (response.ok) {
          const data = await response.json();
          similarTrips = data.domesticTrips.filter(trip => trip.id !== currentTripId).slice(0, 3);
        }
        break;
      case 'spiritual':
        response = await fetch('/api/spiritual-tours');
        if (response.ok) {
          const data = await response.json();
          similarTrips = data.spiritualTours.filter(trip => trip.id !== currentTripId).slice(0, 3);
        }
        break;
      case 'corporate':
        response = await fetch('/api/corporate-trips');
        if (response.ok) {
          const data = await response.json();
          similarTrips = data.corporateTrips.filter(trip => trip.id !== currentTripId).slice(0, 3);
        }
        break;
      case 'international':
        response = await fetch('/api/international-trips');
        if (response.ok) {
          const data = await response.json();
          similarTrips = data.internationalTrips.filter(trip => trip.id !== currentTripId).slice(0, 3);
        }
        break;
      case 'location':
        response = await fetch('/api/hot-locations');
        if (response.ok) {
          const data = await response.json();
          similarTrips = data.hotLocations.filter(trip => trip.id !== currentTripId).slice(0, 3);
        }
        break;

      // Add other cases as needed
    }
    
    renderSimilarTrips(similarTrips, type);
    
  } catch (error) {
    console.error('Error loading similar trips:', error);
  }
}

// Render similar trips
function renderSimilarTrips(trips, type) {
  const container = document.getElementById('similar-trips-container');
  
  if (!trips.length) {
    container.innerHTML = '<p>No similar trips available at the moment.</p>';
    return;
  }
  
  container.innerHTML = trips.map(trip => {
    // Encode image URL to handle spaces in filenames
    const encodedImageUrl = trip.image ? encodeURI(trip.image) : 'images/top1.webp';
    
    return `
      <div class="similar-card">
        <img src="${encodedImageUrl}" alt="${trip.title}">
        <div class="similar-info">
          <div class="badge green">${trip.difficulty || 'Easy'}</div>
          <div class="duration">${trip.duration}</div>
          <div class="location">${trip.destination}</div>
          <div class="title">${trip.title}</div>
          <div class="price-row">
            ${trip.oldPrice ? `<span class="old-price">₹ ${trip.oldPrice.toLocaleString()}/-</span>` : ''}
            <span class="new-price">₹ ${trip.price.toLocaleString()}/-</span>
          </div>
          <a href="trip-detail.html?type=${type}&id=${trip.id}" class="btn yellow">View Details</a>
        </div>
      </div>
    `;
  }).join('');
}

// Get category name
function getCategoryName(type) {
  const categories = {
    'family': 'Family Trips',
    'romantic': 'Romantic Trips',
    'weekend': 'Weekend Trips',
    'domestic': 'Domestic Trips',
    'international': 'International Trips',
    'spiritual': 'Spiritual Tours',
    'corporate': 'Corporate Trips',
    'upcoming': 'Upcoming Trips',
    'location': 'Hot Locations',

  };
  return categories[type] || 'Trip Details';
}

// Get category page URL
function getCategoryPageUrl(type) {
  const categoryPages = {
    'family': 'familytrip.html',
    'romantic': 'domestictrip.html?filter=romantic', // Romantic trips with filter parameter
    'weekend': 'weekendtrip.html',
    'domestic': 'domestictrip.html',
    'international': 'internationaltrip.html',
    'spiritual': 'spiritual-tours.html',
    'corporate': 'corporatetrip.html',
    'upcoming': 'upcomingtrip.html',
    'location': 'home.html#hot-locations', // Hot locations with hash to jump to section
  };
  return categoryPages[type] || 'home.html';
}

// Show error message
function showErrorMessage(message) {
  const loadingSpinner = document.getElementById('loading-spinner');
  loadingSpinner.innerHTML = `
    <div class="error-message">
      <h3>Error</h3>
      <p>${message}</p>
      <a href="home.html" class="btn yellow">Go to Home</a>
    </div>
  `;
}

// Enquiry form submit
const enquiryForm = document.querySelector('.enquiry-form form');
if (enquiryForm) {
  enquiryForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(this);
    const name = this.querySelector('input[type="text"]').value.trim();
    const email = this.querySelector('input[type="email"]').value.trim();
    const phone = this.querySelector('input[type="tel"]').value.trim();
    const pickupLocation = this.querySelector('.input-icon-wrapper input').value.trim();
    const remarks = this.querySelector('textarea').value.trim();
    
    // Validate required fields
    if (!name || !email || !phone) {
      alert('Please fill in all required fields (Name, Email, Phone)');
      return;
    }
    
    // Create message content including pickup location and remarks
    let message = `Trip Enquiry from: ${window.location.href}\n\n`;
    if (pickupLocation) {
      message += `Pickup Location: ${pickupLocation}\n`;
    }
    if (remarks) {
      message += `Remarks: ${remarks}\n`;
    }
    if (!pickupLocation && !remarks) {
      message += 'No additional remarks provided.';
    }
    
    try {
      // Submit to contact API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          email: email,
          phone: phone,
          message: message
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        alert('Thank you for your enquiry! We will contact you soon.');
        this.reset();
      } else {
        alert(result.message || 'Failed to submit enquiry. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting enquiry:', error);
      alert('Failed to submit enquiry. Please check your internet connection and try again.');
    }
  });
}

// Handle book now button click
function handleBookNowClick(tripData) {
  const bookNowBtn = document.getElementById('book-now-btn');
  if (bookNowBtn) {
    bookNowBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Prepare trip data for booking page
      const bookingData = {
        id: tripData.id,
        type: tripData.type,
        title: tripData.title,
        duration: tripData.duration,
        price: tripData.price,
        oldPrice: tripData.oldPrice,
        destination: tripData.destination,
        joinDates: tripData.joinDates,
        pickupLocation: tripData.pickupLocation || 'Delhi',
        difficulty: tripData.difficulty,
        image: tripData.images?.[0] || tripData.image
      };
      
      // Create URL with trip data as query parameters
      const params = new URLSearchParams();
      Object.keys(bookingData).forEach(key => {
        if (bookingData[key] !== undefined && bookingData[key] !== null) {
          if (Array.isArray(bookingData[key])) {
            params.append(key, JSON.stringify(bookingData[key]));
          } else {
            params.append(key, bookingData[key]);
          }
        }
      });
      
      // Navigate to booking page with trip data
      window.location.href = `booking.html?${params.toString()}`;
    });
  }
}

// Update sidebar price and buttons
function updateSidebarBox(trip) {
  // Set price
  const priceElem = document.getElementById('sidebar-trip-price');
  const oldPriceElem = document.getElementById('sidebar-old-price');
  if (priceElem) {
    priceElem.textContent = trip.price ? `₹ ${trip.price.toLocaleString()}/-` : '₹ 15,000/-';
  }
  if (oldPriceElem) {
    if (trip.oldPrice && trip.oldPrice > trip.price) {
      oldPriceElem.textContent = `₹ ${trip.oldPrice.toLocaleString()}/-`;
      oldPriceElem.style.display = '';
    } else {
      oldPriceElem.style.display = 'none';
    }
  }

  // Itinerary button download
  const itineraryBtn = document.getElementById('sidebar-itinerary-btn');
  if (itineraryBtn) {
    itineraryBtn.onclick = function(e) {
      e.preventDefault();
      if (trip.itinerary && Array.isArray(trip.itinerary)) {
        let text = `Itinerary for ${trip.title}\n\n`;
        trip.itinerary.forEach(day => {
          text += `Day ${day.day}: ${day.title}\n`;
          if (day.activities && day.activities.length) {
            day.activities.forEach(activity => {
              text += `- ${activity}\n`;
            });
          }
          text += '\n';
        });
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${trip.title.replace(/[^a-zA-Z0-9]/g, '_')}_Itinerary.txt`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      }
    };
  }

  // WhatsApp button
  const whatsappBtn = document.getElementById('sidebar-whatsapp-btn');
  if (whatsappBtn) {
    const message = encodeURIComponent(`Hi, I'm interested in the trip: ${trip.title} (${trip.destination})`);
    whatsappBtn.href = `https://wa.me/?text=${message}`;
  }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  if (window.commonComponents) {
    window.commonComponents.init();
  }
  // Load trip details
  loadTripDetails();
}); 
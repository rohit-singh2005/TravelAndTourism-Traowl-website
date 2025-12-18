// Image Utils - Robust image generation logic for all pages
// This utility provides consistent image handling across the entire application

// Generate image sequence based on base image name
function generateImageSequence(baseImage, count = 6) {
    if (!baseImage || typeof baseImage !== 'string') {
        return [];
    }
    
    console.log('generateImageSequence called with:', baseImage);
    
    // Remove the file extension first
    let baseName = baseImage.replace(/\.webp$/i, '');
    console.log('Base name after removing extension:', baseName);
    
    // Analyze the naming pattern
    const imagePattern = analyzeImagePattern(baseName);
    console.log('Detected image pattern:', imagePattern);
    
    if (!imagePattern.hasNumber && !imagePattern.couldHaveSequence) {
        console.log('Image appears to be standalone (no number pattern), checking for possible sequences');
        return tryGenerateSequenceFromStandalone(baseName, count);
    }
    
    // Generate images based on detected pattern
    const generatedImages = [];
    const startIndex = imagePattern.hasNumber ? 2 : 1;
    const endIndex = Math.min(startIndex + count - 1, 6);
    
    for (let i = startIndex; i <= endIndex; i++) {
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
function tryGenerateSequenceFromStandalone(baseName, count = 6) {
    console.log('Trying to generate sequence from standalone:', baseName);
    
    const generatedImages = [];
    
    // Generate using the most common pattern first (space separator)
    for (let i = 2; i <= count; i++) {
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

// Get optimized image with fallback
function getOptimizedImage(imageUrl, fallbackImage = 'images/default-trip.webp') {
    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
        return {
            url: encodeURI(fallbackImage),
            hasSequence: false,
            sequence: []
        };
    }
    
    // Generate sequence for this image
    const sequence = generateImageSequence(imageUrl);
    
    return {
        url: encodeURI(imageUrl),
        hasSequence: sequence.length > 0,
        sequence: sequence.map(img => encodeURI(img))
    };
}

// Create image element with error handling and fallback
function createImageElement(imageUrl, altText = '', fallbackImage = 'images/default-trip.webp') {
    const optimizedImage = getOptimizedImage(imageUrl, fallbackImage);
    
    const img = document.createElement('img');
    img.src = optimizedImage.url;
    img.alt = altText;
    img.loading = 'lazy';
    
    // Add error handling
    img.onerror = function() {
        console.warn(`Image failed to load: ${imageUrl}, falling back to: ${fallbackImage}`);
        this.onerror = null; // Prevent infinite loop
        this.src = encodeURI(fallbackImage);
    };
    
    return img;
}

// Create image slider for multiple images
function createImageSlider(images, containerId, itemTitle = '', sliderClass = 'image-slider') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID '${containerId}' not found`);
        return;
    }
    
    let imagesToUse = [];
    
    // If we have provided images, use them first
    if (images && images.length > 0 && images[0] && images[0].trim() !== '') {
        const baseImage = images[0];
        imagesToUse.push(baseImage);
        
        // Generate additional images
        const generatedImages = generateImageSequence(baseImage);
        if (generatedImages.length > 0) {
            imagesToUse.push(...generatedImages);
        }
    }
    
    // Create slider HTML
    const sliderHTML = `
        <div class="${sliderClass}">
            <div class="slider-container">
                ${imagesToUse.map((imageUrl, index) => `
                    <div class="slide ${index === 0 ? 'active' : ''}">
                        <img src="${encodeURI(imageUrl)}" 
                             alt="${itemTitle} - Image ${index + 1}" 
                             loading="lazy"
                             onerror="this.onerror=null; this.src='images/default-trip.webp'; console.warn('Image failed to load: ${imageUrl}');">
                    </div>
                `).join('')}
            </div>
            ${imagesToUse.length > 1 ? `
                <div class="slider-controls">
                    <button class="slider-btn prev" onclick="previousSlide('${containerId}')">❮</button>
                    <button class="slider-btn next" onclick="nextSlide('${containerId}')">❯</button>
                </div>
                <div class="slider-indicators">
                    ${imagesToUse.map((_, index) => `
                        <button class="indicator ${index === 0 ? 'active' : ''}" 
                                onclick="goToSlide('${containerId}', ${index})"></button>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
    
    container.innerHTML = sliderHTML;
    
    // Store current slide index
    container.dataset.currentSlide = '0';
    container.dataset.totalSlides = imagesToUse.length;
}

// Slider navigation functions
function nextSlide(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const currentSlide = parseInt(container.dataset.currentSlide);
    const totalSlides = parseInt(container.dataset.totalSlides);
    const nextSlideIndex = (currentSlide + 1) % totalSlides;
    
    goToSlide(containerId, nextSlideIndex);
}

function previousSlide(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const currentSlide = parseInt(container.dataset.currentSlide);
    const totalSlides = parseInt(container.dataset.totalSlides);
    const prevSlideIndex = (currentSlide - 1 + totalSlides) % totalSlides;
    
    goToSlide(containerId, prevSlideIndex);
}

function goToSlide(containerId, slideIndex) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const slides = container.querySelectorAll('.slide');
    const indicators = container.querySelectorAll('.indicator');
    
    // Remove active class from all slides and indicators
    slides.forEach(slide => slide.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));
    
    // Add active class to current slide and indicator
    if (slides[slideIndex]) {
        slides[slideIndex].classList.add('active');
    }
    if (indicators[slideIndex]) {
        indicators[slideIndex].classList.add('active');
    }
    
    // Update current slide index
    container.dataset.currentSlide = slideIndex;
}

// Auto-initialize sliders on page load
document.addEventListener('DOMContentLoaded', function() {
    // Auto-initialize any existing sliders
    const autoSliders = document.querySelectorAll('[data-auto-slider]');
    autoSliders.forEach(slider => {
        const images = slider.dataset.images ? JSON.parse(slider.dataset.images) : [];
        const title = slider.dataset.title || '';
        createImageSlider(images, slider.id, title);
    });
});

// Export functions for use in other files
window.ImageUtils = {
    generateImageSequence,
    analyzeImagePattern,
    tryGenerateSequenceFromStandalone,
    constructImageName,
    getOptimizedImage,
    createImageElement,
    createImageSlider,
    nextSlide,
    previousSlide,
    goToSlide
};
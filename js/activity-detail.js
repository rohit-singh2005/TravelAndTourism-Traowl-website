document.addEventListener('DOMContentLoaded', function() {
    // Get elements from the page
    const params = new URLSearchParams(window.location.search);
    const activityId = params.get('id');
    const activityName = params.get('activity');
    const heroSection = document.getElementById('detailHero');
    const titleElement = document.getElementById('activityTitle');
    const grid = document.getElementById('bookingGrid');
    const modalBg = document.getElementById('bookingModalBg');
    const modalContent = document.getElementById('bookingModalContent');
    const modalClose = document.getElementById('bookingModalClose');

    // Check for either ID or activity name
    if (!activityId && !activityName) {
        showError('Activity ID or name not provided');
        return;
    }

    // Load activity details from API
    loadActivityDetails(activityId || activityName);

    // --- Function to redirect to booking page ---
    function redirectToBooking(data) {
        // Build URL parameters for booking page
        const params = new URLSearchParams({
            type: 'activity',
            id: data.id || activityId || '',
            title: data.location,
            activityName: activityName || data.name || activityIdentifier,
            price: data.price,
            duration: data.duration || '',
            difficulty: data.difficulty || '',
            bestTime: data.bestTime || '',
            details: data.details || '',
            inclusions: data.inclusions ? data.inclusions.join(', ') : '',
            pickupLocation: 'To be decided'
        });

        // Redirect to booking page
        window.location.href = `booking.html?${params.toString()}`;
    }
    
    // --- Function to close the booking modal ---
    function closeBookingModal() {
        modalBg.style.display = 'none';
    }

    // --- Event listeners for modal ---
    if (modalClose) {
        modalClose.addEventListener('click', closeBookingModal);
    }
    if (modalBg) {
        modalBg.addEventListener('click', e => { if (e.target === modalBg) closeBookingModal(); });
    }

    // --- Event listener for the "Book Now" buttons on the grid ---
    if (grid) {
        grid.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-book')) {
                const card = e.target.closest('.booking-card');
                const location = card.querySelector('h3').textContent;
                const price = parseFloat(e.target.dataset.price);
                const duration = card.querySelector('.duration')?.textContent || '';
                const difficulty = card.querySelector('.difficulty')?.textContent || '';
                const bestTime = card.querySelector('.best-time')?.textContent || '';
                const details = card.querySelector('p')?.textContent || '';
                const inclusions = card.querySelector('.inclusions')?.textContent.replace('Included: ', '') || '';
                
                redirectToBooking({ 
                    location, 
                    price, 
                    duration, 
                    difficulty, 
                    bestTime, 
                    details,
                    inclusions: inclusions.split(', ').filter(item => item.trim() !== '')
                });
            }
        });
    }

    // Function to load activity details from API
    async function loadActivityDetails(activityIdentifier) {
        try {
            // Try to fetch by ID first, then by name
            const endpoint = activityId ? `/api/activities/${activityId}` : `/api/activity-details/${activityIdentifier}`;
            const response = await fetch(endpoint);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Activity not found');
            }

            // Update page title
            const displayName = data.name || activityName || activityIdentifier;
            document.title = `${displayName} | Traowl India`;
            
            // Update hero section
            if (titleElement) {
                titleElement.textContent = displayName;
            }

            const bookingOptions = data.bookingOptions || [];
            
            // Update hero background image
            if (heroSection && bookingOptions.length > 0) {
                const mainImage = bookingOptions[0].image;
                // Encode image URL to handle spaces in filenames
                const encodedMainImage = mainImage ? encodeURI(mainImage) : 'images/adventure1.webp';
                heroSection.style.backgroundImage = `url('${encodedMainImage}')`;
            }
            
            // Populate booking grid
            if (grid) {
                if (bookingOptions.length > 0) {
                    grid.innerHTML = bookingOptions.map(option => {
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
                                        <span class="booking-price">Price on request</span>
                                        <button class="btn-book" data-location="${option.location}" data-price="${option.price}">Book Now</button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');
                } else {
                    grid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">No booking options currently available for this activity. Please check back soon!</p>';
                }
            }
            
        } catch (error) {
            console.error('Error loading activity details:', error);
            // Show fallback content for testing
            const displayName = activityName || activityIdentifier || 'Unknown Activity';
            document.title = `${displayName} | Traowl India`;
            
            if (titleElement) {
                titleElement.textContent = displayName;
            }
            
            if (grid) {
                grid.innerHTML = `
                    <div class="booking-card">
                        <img src="images/adventure1.webp" alt="${displayName}" class="booking-card-img">
                        <div class="booking-card-info">
                            <h3>Sample Location</h3>
                            <p>This is a sample activity option. The API server is not running, so we're showing demo content.</p>
                            <div class="booking-details">
                                <span class="duration">Half Day</span>
                                <span class="difficulty">Easy</span>
                                <span class="best-time">Morning</span>
                            </div>
                            <div class="inclusions">
                                <strong>Included:</strong> Guide, Equipment, Refreshments
                            </div>
                            <div class="booking-card-footer">
                                <span class="booking-price">Price on request</span>
                                <button class="btn-book" data-location="Sample Location" data-price="1999">Book Now</button>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    }

    // Function to show error message
    function showError(message) {
        if (grid) {
            grid.innerHTML = `
                <div class="error-message" style="grid-column: 1 / -1; text-align: center;">
                    <h2>Error</h2>
                    <p>${message}</p>
                    <a href="activities.html" class="back-link">← Back to Activities</a>
                </div>
            `;
        }
    }
});
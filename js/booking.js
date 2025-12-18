// Header and footer loading is handled by common.js

// Function to load trip details from URL parameters
async function loadTripDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Check if trip data is passed via URL parameters
  const tripId = urlParams.get('id');
  const tripType = urlParams.get('type');
  const tripTitle = urlParams.get('title');
  
  if (tripTitle) {
    // Trip data is passed via URL parameters
    const tripData = {
      id: tripId,
      type: tripType,
      title: tripTitle,
      duration: urlParams.get('duration'),
      price: urlParams.get('price'),
      oldPrice: urlParams.get('oldPrice'),
      destination: urlParams.get('destination'),
      joinDates: urlParams.get('joinDates') ? JSON.parse(urlParams.get('joinDates')) : [],
      pickupLocation: urlParams.get('pickupLocation') || 'Delhi',
      difficulty: urlParams.get('difficulty'),
      image: urlParams.get('image'),
      // Activity-specific fields
      activityName: urlParams.get('activityName'),
      details: urlParams.get('details'),
      bestTime: urlParams.get('bestTime'),
      inclusions: urlParams.get('inclusions')
    };
    
    if (tripType === 'activity') {
      renderActivityDetails(tripData);
    } else {
      renderTripDetails(tripData);
    }
  } else {
    // Fallback to API call if no parameters are provided
    try {
      const packageId = urlParams.get('package') || '1';
      const response = await fetch(`${API_BASE_URL}/city-packages/${packageId}`);
      const packageData = await response.json();
      
      if (!response.ok) {
        throw new Error(packageData.error || 'Failed to fetch package details');
      }
      
      renderPackageDetails(packageData);
    } catch (error) {
      console.error('Error loading package details:', error);
      showErrorMessage('Failed to load trip details. Please try again later.');
    }
  }
}

// Function to render activity details (for activities from activity detail page)
function renderActivityDetails(activity) {
  // Update page title
  document.title = `Book ${activity.title} | Traowl`;
  
  // Update package title
  const packageTitle = document.getElementById('package-title');
  if (packageTitle) packageTitle.textContent = `${activity.activityName} - ${activity.title}`;
  
  // Update summary section
  const summaryTripName = document.getElementById('summary-trip-name');
  const summaryDuration = document.getElementById('summary-duration');
  const summaryPickupDropoff = document.getElementById('summary-pickup-dropoff');
  
  if (summaryTripName) summaryTripName.textContent = `${activity.activityName} - ${activity.title}`;
  if (summaryDuration) summaryDuration.textContent = activity.duration || 'Check with us';
  if (summaryPickupDropoff) summaryPickupDropoff.textContent = activity.pickupLocation || 'To be decided';
  
  // Update pickup location in form
  const pickupDropoffInput = document.getElementById('pickupDropoff');
  if (pickupDropoffInput) {
    pickupDropoffInput.value = activity.pickupLocation || 'To be decided';
  }
  
  // Add activity-specific information to the booking form
  addActivitySpecificInfo(activity);
  
  // Hide batch selection for activities and show custom date by default
  const batchSection = document.getElementById('batch-selection-section');
  const customDateSection = document.getElementById('custom-date-section');
  const customRadio = document.querySelector('input[name="travel_option"][value="custom"]');
  
  if (batchSection) batchSection.style.display = 'none';
  if (customDateSection) customDateSection.style.display = 'flex';
  if (customRadio) customRadio.checked = true;
  
  // Update the travel option text for activities
  const customLabel = document.querySelector('input[name="travel_option"][value="custom"]').parentElement.querySelector('h4');
  if (customLabel) customLabel.textContent = 'Choose Your Preferred Date';
  
  // Hide loading spinner and show content
  const loadingSpinner = document.getElementById('loading-spinner');
  const bookingContent = document.getElementById('booking-content');
  if (loadingSpinner) loadingSpinner.style.display = 'none';
  if (bookingContent) bookingContent.style.display = 'block';
}

// Function to render trip details (for trips from trip detail page)
function renderTripDetails(trip) {
  // Update page title
  document.title = `Book ${trip.title} | Traowl`;
  
  // Update package title
  const packageTitle = document.getElementById('package-title');
  if (packageTitle) packageTitle.textContent = trip.title;
  
  // Update summary section
  const summaryTripName = document.getElementById('summary-trip-name');
  const summaryDuration = document.getElementById('summary-duration');
  const summaryPickupDropoff = document.getElementById('summary-pickup-dropoff');
  
  if (summaryTripName) summaryTripName.textContent = trip.title;
  if (summaryDuration) summaryDuration.textContent = trip.duration || 'Check with us';
  if (summaryPickupDropoff) summaryPickupDropoff.textContent = `${trip.pickupLocation} → ${trip.pickupLocation}`;
  
  // Update pickup location in form
  const pickupDropoffInput = document.getElementById('pickupDropoff');
  if (pickupDropoffInput) {
    pickupDropoffInput.value = `${trip.pickupLocation} / ${trip.pickupLocation}`;
  }
  
  // Update batch information if join dates are available
  if (trip.joinDates && trip.joinDates.length > 0) {
    updateBatchOptions(trip.joinDates);
  }
  
  // Hide loading spinner and show content
  const loadingSpinner = document.getElementById('loading-spinner');
  const bookingContent = document.getElementById('booking-content');
  if (loadingSpinner) loadingSpinner.style.display = 'none';
  if (bookingContent) bookingContent.style.display = 'block';
}

// Function to render package details (for legacy support)
function renderPackageDetails(package) {
  // Update page title
  document.title = `Book ${package.title} | Traowl`;
  
  // Update package title
  const packageTitle = document.getElementById('package-title');
  if (packageTitle) packageTitle.textContent = package.title;
  
  // Update summary section
  const summaryTripName = document.getElementById('summary-trip-name');
  const summaryDuration = document.getElementById('summary-duration');
  const summaryPickupDropoff = document.getElementById('summary-pickup-dropoff');
  
  if (summaryTripName) summaryTripName.textContent = package.title;
  if (summaryDuration) summaryDuration.textContent = package.duration;
  if (summaryPickupDropoff) summaryPickupDropoff.textContent = `${package.pickupLocation} → ${package.pickupLocation}`;
  
  // Update pickup location in form
  const pickupDropoffInput = document.getElementById('pickupDropoff');
  if (pickupDropoffInput) {
    pickupDropoffInput.value = `${package.pickupLocation} / ${package.pickupLocation}`;
  }
  
  // Hide loading spinner and show content
  const loadingSpinner = document.getElementById('loading-spinner');
  const bookingContent = document.getElementById('booking-content');
  if (loadingSpinner) loadingSpinner.style.display = 'none';
  if (bookingContent) bookingContent.style.display = 'block';
}

// Function to add activity-specific information to the booking page
function addActivitySpecificInfo(activity) {
  // Find the personal information section
  const personalInfoSection = document.querySelector('.booking-personal-info');
  if (!personalInfoSection) return;

  // Create activity details section
  const activityDetailsHTML = `
    <div class="activity-details-section">
      <div class="option-header">
        <i class="ri-information-line"></i>
        <h3>Activity Details</h3>
      </div>
      <div class="activity-details-content">
        ${activity.details ? `<p><strong>Description:</strong> ${activity.details}</p>` : ''}
        ${activity.difficulty ? `<p><strong>Difficulty:</strong> ${activity.difficulty}</p>` : ''}
        ${activity.bestTime ? `<p><strong>Best Time:</strong> ${activity.bestTime}</p>` : ''}
        ${activity.inclusions ? `<p><strong>Inclusions:</strong> ${activity.inclusions}</p>` : ''}
        <p><strong>Price:</strong> <span class="price-on-request">Price on Request</span></p>
      </div>
    </div>
  `;

  // Insert the activity details before the personal information section
  personalInfoSection.insertAdjacentHTML('beforebegin', activityDetailsHTML);
}

// Function to update batch options based on join dates
function updateBatchOptions(joinDates) {
  const batchContainer = document.querySelector('.option-group');
  if (!batchContainer || !joinDates || joinDates.length === 0) return;
  
  batchContainer.innerHTML = '';
  
  joinDates.forEach((date, index) => {
    const isChecked = index === 0 ? 'checked' : '';
    
    const batchOption = `
      <label class="radio-card">
        <input type="radio" name="batch_option" value="batch${index + 1}" ${isChecked}>
        <div class="radio-content">
          <div class="radio-info">
            <div class="batch-info">
              <span class="batch-date"><i class="ri-calendar-line"></i> ${date}</span>
              <span class="batch-day">Available Batch</span>
            </div>
          </div>
          <div class="radio-badge">
            <!-- seats left removed -->
          </div>
        </div>
      </label>
    `;
    
    batchContainer.insertAdjacentHTML('beforeend', batchOption);
  });
}

// Function to show error message
function showErrorMessage(message) {
  const loadingSpinner = document.getElementById('loading-spinner');
  if (loadingSpinner) {
    loadingSpinner.innerHTML = `
      <div class="error-message">
        <h2>Error</h2>
        <p>${message}</p>
        <button onclick="loadTripDetails()">Try Again</button>
      </div>
    `;
  }
}

// Function to show notification messages
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.booking-notification');
  existingNotifications.forEach(n => n.remove());

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `booking-notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="ri-${type === 'error' ? 'error-warning' : type === 'success' ? 'check-circle' : 'information'}-line"></i>
      <span>${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
        <i class="ri-close-line"></i>
      </button>
    </div>
  `;

  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    background: ${type === 'error' ? '#fee' : type === 'success' ? '#efe' : '#eef'};
    border: 1px solid ${type === 'error' ? '#fcc' : type === 'success' ? '#cfc' : '#ccf'};
    color: ${type === 'error' ? '#c00' : type === 'success' ? '#0c0' : '#00c'};
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    max-width: 400px;
    animation: slideInRight 0.3s ease;
  `;

  // Add to document
  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// Function to show booking confirmation
function showBookingConfirmation(result) {
  // Create modal overlay with blur background
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'booking-confirmation-modal';
  modalOverlay.id = 'bookingConfirmationModal';
  
  // Create confirmation content
  const confirmationHTML = `
    <div class="booking-confirmation-overlay">
      <div class="booking-confirmation-modal-content">
        <div class="confirmation-card">
          <div class="confirmation-header">
            <i class="ri-check-circle-fill success-icon"></i>
            <h2>Booking Submitted Successfully!</h2>
            <p class="booking-id">Booking ID: <strong>${result.bookingId}</strong></p>
          </div>
          
          <div class="confirmation-content">
            <div class="confirmation-message">
              <h3>What happens next?</h3>
              <div class="next-steps">
                <div class="step">
                  <i class="ri-phone-line"></i>
                  <div>
                    <h4>We'll contact you within 24 hours</h4>
                    <p>Our travel expert will call you to confirm your booking details and discuss the itinerary.</p>
                  </div>
                </div>
                <div class="step">
                  <i class="ri-calendar-check-line"></i>
                  <div>
                    <h4>Finalize your travel dates</h4>
                    <p>We'll help you select the perfect dates and customize your trip according to your preferences.</p>
                  </div>
                </div>
                <div class="step">
                  <i class="ri-secure-payment-line"></i>
                  <div>
                    <h4>Complete the payment</h4>
                    <p>After confirmation, we'll provide secure payment options to finalize your booking.</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="booking-summary">
              <h3>Booking Details</h3>
              <div class="summary-item">
                <span>Trip:</span>
                <strong>${result.tripTitle}</strong>
              </div>
              <div class="summary-item">
                <span>Travelers:</span>
                <strong>${result.travelers} ${result.travelers === 1 ? 'person' : 'people'}</strong>
              </div>

              <div class="summary-item">
                <span>Submitted:</span>
                <strong>${new Date(result.createdAt).toLocaleDateString('en-IN', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</strong>
              </div>
            </div>
          </div>

          <div class="confirmation-actions">
            <button class="btn-primary" onclick="closeBookingModal(); window.location.href='home.html'">
              <i class="ri-home-line"></i>
              Back to Home
            </button>

            <button class="btn-secondary" onclick="window.print()">
              <i class="ri-printer-line"></i>
              Print Details
            </button>
            <button class="modal-close-btn" onclick="closeBookingModal()" title="Close">
              <i class="ri-close-line"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Set modal content
  modalOverlay.innerHTML = confirmationHTML;
  
  // Add improved confirmation styles
  const confirmationStyles = `
    <style>
      .booking-confirmation-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }
      
      .booking-confirmation-modal.active {
        opacity: 1;
        visibility: visible;
      }
      
      .booking-confirmation-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        overflow-y: auto;
      }
      
      .booking-confirmation-modal-content {
        position: relative;
        max-width: 700px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        transform: scale(0.8) translateY(-20px);
        transition: all 0.3s ease;
      }
      
      .booking-confirmation-modal.active .booking-confirmation-modal-content {
        transform: scale(1) translateY(0);
      }
      
      .confirmation-card {
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        overflow: hidden;
        position: relative;
      }
      
      .confirmation-header {
        text-align: center;
        padding: 3rem 2rem 2rem;
        background: linear-gradient(135deg, #4CAF50, #2E7D32);
        color: white;
        position: relative;
      }
      
      .success-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        animation: bounce 1s ease-in-out;
      }
      
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        60% { transform: translateY(-5px); }
      }
      
      .confirmation-header h2 {
        margin: 0 0 1rem 0;
        font-size: 2rem;
        font-weight: 700;
      }
      
      .booking-id {
        font-size: 1.2rem;
        opacity: 0.95;
        background: rgba(255,255,255,0.2);
        padding: 0.5rem 1rem;
        border-radius: 25px;
        display: inline-block;
      }
      
      .confirmation-content {
        padding: 2rem;
      }
      
      .confirmation-message h3 {
        color: #333;
        margin-bottom: 1.5rem;
        font-size: 1.3rem;
      }
      
      .step {
        display: flex;
        align-items: flex-start;
        margin: 1.5rem 0;
        padding: 1.5rem;
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        border-radius: 12px;
        border-left: 4px solid #4CAF50;
        transition: transform 0.2s ease;
      }
      
      .step:hover {
        transform: translateX(5px);
      }
      
      .step i {
        font-size: 1.8rem;
        color: #4CAF50;
        margin-right: 1.5rem;
        margin-top: 0.2rem;
        flex-shrink: 0;
      }
      
      .step h4 {
        margin: 0 0 0.75rem 0;
        color: #333;
        font-size: 1.1rem;
        font-weight: 600;
      }
      
      .step p {
        margin: 0;
        color: #666;
        line-height: 1.6;
        font-size: 0.95rem;
      }
      
      .booking-summary {
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        padding: 2rem;
        border-radius: 12px;
        margin-top: 2rem;
        border: 1px solid #dee2e6;
      }
      
      .booking-summary h3 {
        margin: 0 0 1.5rem 0;
        color: #333;
        font-size: 1.3rem;
      }
      
      .summary-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 1rem 0;
        padding: 0.75rem 0;
        border-bottom: 1px solid #dee2e6;
      }
      
      .summary-item:last-child {
        border-bottom: none;
      }
      
      .summary-item span {
        color: #666;
        font-weight: 500;
      }
      
      .summary-item strong {
        color: #333;
        font-weight: 600;
      }
      
      .status-pending {
        color: #FF9800;
        background: rgba(255, 152, 0, 0.1);
        padding: 0.25rem 0.75rem;
        border-radius: 15px;
        font-size: 0.9rem;
      }
      
      .confirmation-actions {
        padding: 2rem;
        background: #f8f9fa;
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
        position: relative;
      }
      
      .modal-close-btn {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: rgba(0,0,0,0.1);
        border: none;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        color: #666;
        font-size: 1.2rem;
      }
      
      .modal-close-btn:hover {
        background: rgba(0,0,0,0.2);
        color: #333;
        transform: scale(1.1);
      }
      
      .btn-primary, .btn-secondary {
        padding: 0.875rem 1.75rem;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        text-decoration: none;
        transition: all 0.3s ease;
        min-width: 140px;
        justify-content: center;
      }
      .btn-primary {
        background: #4CAF50;
        color: white;
      }
      .btn-primary:hover {
        background: #2E7D32;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
      }
      .btn-secondary {
        background: white;
        color: #333;
        border: 2px solid #ddd;
      }
      .btn-secondary:hover {
        background: #f5f5f5;
        border-color: #bbb;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      @media (max-width: 768px) {
        .booking-confirmation-overlay {
          padding: 1rem;
        }
        .confirmation-header {
          padding: 2rem 1rem 1.5rem;
        }
        .confirmation-content {
          padding: 1.5rem;
        }
        .confirmation-actions {
          flex-direction: column;
          gap: 0.75rem;
        }
        .success-icon {
          font-size: 3rem;
        }
        .confirmation-header h2 {
          font-size: 1.5rem;
        }
      }
    </style>
  `;

  // Add styles to head if not already present
  if (!document.getElementById('booking-confirmation-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'booking-confirmation-styles';
    styleElement.innerHTML = confirmationStyles.replace('<style>', '').replace('</style>', '');
    document.head.appendChild(styleElement);
  }

  // Add modal to body
  document.body.appendChild(modalOverlay);

  // Animate modal appearance
  setTimeout(() => {
    modalOverlay.classList.add('active');
  }, 100);

  // Add escape key listener
  function handleEscapeKey(e) {
    if (e.key === 'Escape') {
      closeBookingModal();
    }
  }
  document.addEventListener('keydown', handleEscapeKey);

  // Add click outside to close
  modalOverlay.addEventListener('click', function(e) {
    if (e.target === modalOverlay || e.target.classList.contains('booking-confirmation-overlay')) {
      closeBookingModal();
    }
  });

  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

// Function to close booking modal
function closeBookingModal() {
  const modal = document.getElementById('bookingConfirmationModal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.remove();
      document.body.style.overflow = 'auto';
    }, 300);
  }
}

// Check if user is authenticated for booking
function checkAuthenticationForBooking() {
  const authManager = new AuthManager();
  
  if (!authManager.isAuthenticated()) {
    // Show authentication required message
    showAuthenticationRequiredModal();
    return false;
  }
  
  return true;
}

// Show authentication required modal
function showAuthenticationRequiredModal() {
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'auth-required-modal';
  modalOverlay.id = 'authRequiredModal';
  
  const modalHTML = `
    <div class="auth-required-overlay">
      <div class="auth-required-modal-content">
        <div class="auth-required-card">
          <div class="auth-required-header">
            <i class="ri-lock-line auth-icon"></i>
            <h2>Sign In Required</h2>
            <p>You need to sign in to your account to make a booking</p>
          </div>
          
          <div class="auth-required-content">
            <div class="auth-required-message">
              <h3>Why do I need to sign in?</h3>
              <div class="auth-benefits">
                <div class="benefit">
                  <i class="ri-check-circle-line"></i>
                  <div>
                    <h4>Track Your Bookings</h4>
                    <p>View and manage all your bookings in one place</p>
                  </div>
                </div>
                <div class="benefit">
                  <i class="ri-check-circle-line"></i>
                  <div>
                    <h4>Secure Booking Process</h4>
                    <p>Your personal information is protected and secure</p>
                  </div>
                </div>
                <div class="benefit">
                  <i class="ri-check-circle-line"></i>
                  <div>
                    <h4>Quick Rebooking</h4>
                    <p>Save time with auto-filled information for future bookings</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="auth-required-actions">
              <button class="btn-primary" onclick="redirectToLogin()">
                <i class="ri-login-circle-line"></i>
                Sign In to Continue
              </button>
              <button class="btn-secondary" onclick="redirectToSignup()">
                <i class="ri-user-add-line"></i>
                Create New Account
              </button>
              <button class="btn-tertiary" onclick="goBackToHome()">
                <i class="ri-arrow-left-line"></i>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Set modal content
  modalOverlay.innerHTML = modalHTML;
  
  // Add styles for auth required modal
  const authRequiredStyles = `
    <style>
      .auth-required-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 1;
        visibility: visible;
      }
      
      .auth-required-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        overflow-y: auto;
      }
      
      .auth-required-modal-content {
        position: relative;
        max-width: 600px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
      }
      
      .auth-required-card {
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        overflow: hidden;
        position: relative;
      }
      
      .auth-required-header {
        text-align: center;
        padding: 3rem 2rem 2rem;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        position: relative;
      }
      
      .auth-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.9;
      }
      
      .auth-required-header h2 {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }
      
      .auth-required-header p {
        font-size: 1.1rem;
        opacity: 0.9;
      }
      
      .auth-required-content {
        padding: 2rem;
      }
      
      .auth-required-message h3 {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
        color: #1f2937;
      }
      
      .auth-benefits {
        margin-bottom: 2rem;
      }
      
      .benefit {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      
      .benefit i {
        color: #10b981;
        font-size: 1.5rem;
        margin-top: 0.25rem;
      }
      
      .benefit h4 {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #1f2937;
      }
      
      .benefit p {
        color: #6b7280;
        font-size: 0.95rem;
        line-height: 1.5;
      }
      
      .auth-required-actions {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      
      .btn-primary, .btn-secondary, .btn-tertiary {
        padding: 0.875rem 1.5rem;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        text-decoration: none;
        border: none;
      }
      
      .btn-primary {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
      }
      
      .btn-primary:hover {
        background: linear-gradient(135deg, #1d4ed8, #1e40af);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }
      
      .btn-secondary {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
      }
      
      .btn-secondary:hover {
        background: linear-gradient(135deg, #059669, #047857);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }
      
      .btn-tertiary {
        background: #f3f4f6;
        color: #6b7280;
        border: 1px solid #d1d5db;
      }
      
      .btn-tertiary:hover {
        background: #e5e7eb;
        color: #374151;
      }
      
      @media (max-width: 640px) {
        .auth-required-modal-content {
          margin: 1rem;
        }
        
        .auth-required-header {
          padding: 2rem 1.5rem 1.5rem;
        }
        
        .auth-required-content {
          padding: 1.5rem;
        }
        
        .benefit {
          flex-direction: column;
          gap: 0.5rem;
          align-items: flex-start;
        }
        
        .benefit i {
          margin-top: 0;
        }
      }
    </style>
  `;
  
  // Add styles to document
  document.head.insertAdjacentHTML('beforeend', authRequiredStyles);
  
  // Add to document
  document.body.appendChild(modalOverlay);
  
  // Animate in
  setTimeout(() => {
    modalOverlay.classList.add('active');
  }, 100);
}

// Redirect functions
function redirectToLogin() {
  // Store current trip details in sessionStorage for after login
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.toString()) {
    sessionStorage.setItem('traowl_booking_redirect', window.location.href);
  }
  window.location.href = 'login.html';
}

function redirectToSignup() {
  // Store current trip details in sessionStorage for after signup
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.toString()) {
    sessionStorage.setItem('traowl_booking_redirect', window.location.href);
  }
  window.location.href = 'signup.html';
}

function goBackToHome() {
  window.location.href = 'home.html';
}

document.addEventListener('DOMContentLoaded', function () {
  // Load trip details - header/footer loading is handled by common.js auto-initialization
  loadTripDetails();

  const form = document.querySelector('.booking-form');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault(); // Always prevent default form submission
      
      // Check authentication first - show popup if not authenticated
      if (!checkAuthenticationForBooking()) {
        return; // Authentication popup will be shown
      }
      
      try {
        // Get form data
        const formData = new FormData(this);
        const name = this.querySelector('input[type="text"]').value.trim();
        const email = this.querySelector('input[type="email"]').value.trim();
        const phone = this.querySelector('input[type="tel"]').value.trim();
        const travelers = this.querySelector('input[type="number"]').value.trim();
        const specialRequests = this.querySelector('textarea')?.value.trim() || '';
        
        // Validate required fields
        if (!name || !email || !phone || !travelers) {
          showNotification('Please fill all required fields.', 'error');
          return;
        }

        // Get trip details from URL or form
        const urlParams = new URLSearchParams(window.location.search);
        const tripTitle = urlParams.get('title') || document.getElementById('package-title')?.textContent || 'Unknown Trip';
        const tripId = urlParams.get('id') || null;
        
        // Get selected date
        let selectedDate = null;
        const customDateRadio = document.querySelector('input[name="travel_option"][value="custom"]');
        if (customDateRadio && customDateRadio.checked) {
          const customDateInput = document.querySelector('input[type="date"]');
          selectedDate = customDateInput ? customDateInput.value : null;
        } else {
          const selectedBatch = document.querySelector('input[name="batch"]:checked');
          if (selectedBatch) {
            selectedDate = selectedBatch.value;
          }
        }

        // Prepare booking data
        const bookingData = {
          tripTitle,
          tripId,
          travelers: parseInt(travelers),
          selectedDate,
          contactInfo: {
            name,
            email,
            phone
          },
          specialRequests
        };

        // Show loading state
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        // Get authentication token
        const authManager = new AuthManager();
        const token = authManager.getToken();

        // Submit booking
        const response = await fetch(`${API_BASE_URL}/booking/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(bookingData)
        });

        const result = await response.json();

        if (result.success) {
          // Show success message
          showBookingConfirmation(result);
        } else {
          showNotification(result.message || 'Failed to submit booking. Please try again.', 'error');
        }

      } catch (error) {
        console.error('Booking submission error:', error);
        showNotification('Network error. Please check your connection and try again.', 'error');
      } finally {
        // Reset button state
        const submitBtn = this.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  }

  // Initialize travel option toggle with delay to ensure DOM is ready
  setTimeout(() => {
    const travelOptions = document.querySelectorAll('input[name="travel_option"]');
    const customDate = document.getElementById('custom-date-section');

  function toggleCustomDateSection() {
    const selected = document.querySelector('input[name="travel_option"]:checked');
    const batchSection = document.getElementById('batch-selection-section'); // Select Your Batch section
    
    console.log('Toggle called. Selected option:', selected ? selected.value : 'none');
    console.log('Batch section found:', !!batchSection);
    console.log('Custom date section found:', !!customDate);
    
    if (selected && selected.value === 'custom') {
      // Show custom date section, hide batch selection
      if (customDate) customDate.style.display = 'flex';
      if (batchSection) batchSection.style.display = 'none';
      console.log('Showing custom date section, hiding batch selection');
    } else {
      // Hide custom date section, show batch selection
      if (customDate) customDate.style.display = 'none';
      if (batchSection) batchSection.style.display = 'block';
      console.log('Hiding custom date section, showing batch selection');
    }
  }

  // Initialize batch/custom date toggling
  function initializeTravelOptionToggle() {
    const batchSection = document.getElementById('batch-selection-section');
    
    if (!customDate) {
      console.warn('Custom date section not found');
      return;
    }
    
    if (!batchSection) {
      console.warn('Batch selection section not found');
      return;
    }
    
    if (travelOptions.length === 0) {
      console.warn('No travel option radio buttons found');
      return;
    }
    
    // Add event listeners to all travel option radio buttons
    travelOptions.forEach(option => {
      option.addEventListener('change', toggleCustomDateSection);
    });
    
    // Set initial state based on default selected option
    toggleCustomDateSection();
    
    console.log('Travel option toggle initialized successfully');
  }
  
    // Initialize the toggle functionality
    initializeTravelOptionToggle();
  }, 100); // Small delay to ensure DOM is ready

  const modal = document.getElementById('authModal');
  const signInBtn = document.getElementById('signInBtn');
  const modalClose = document.getElementById('modalClose');

  if (modal && signInBtn && modalClose) {
    signInBtn.addEventListener('click', function (e) {
      e.preventDefault();
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    modalClose.addEventListener('click', function () {
      modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    });

    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
      }
    });
  }

  // After header loads, inject the shared modal
  if (typeof CommonComponents !== 'undefined') {
    (new CommonComponents()).addModalHTML();
  }
});

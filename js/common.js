// Common functionality for header and footer loading
class CommonComponents {
  constructor() {
    this.headerLoaded = false;
    this.footerLoaded = false;
    this.loadingFailed = false;
  }

  // Create typewriter effect
  createTypewriterEffect(element, text, callback) {
    element.innerHTML = `<span class="typewriter">${text}</span>`;
    if (callback) {
      setTimeout(callback, 2000); // Wait for typewriter animation
    }
  }

  // Show error message
  showError(element, message) {
    element.innerHTML = `<div class="error-text">${message}</div>`;
    this.loadingFailed = true;
  }

  // Load and render header
  async loadHeader() {
    const headerElement = document.querySelector('.main-header');
    if (!headerElement) {
      console.error('Header element not found');
      this.loadingFailed = true;
      return false;
    }

    try {
      // Show loading with typewriter effect
      this.createTypewriterEffect(headerElement, 'Loading header...');
      
      const headerData = await loadHeader();
      if (!headerData) {
        this.showError(headerElement, 'Failed to load header. Please refresh the page.');
        return false;
      }

      headerElement.innerHTML = this.createHeaderHTML(headerData);
      this.addModalHTML();
      this.addProfileModalHTML();
      this.addBookingsModalHTML();
      this.addHelpModalHTML();
      this.initializeHeaderEvents();
      this.updateAuthSection(); // Update auth section based on login state
      this.headerLoaded = true;
      return true;
    } catch (error) {
      console.error('Error loading header:', error);
      this.showError(headerElement, 'Failed to load header. Please refresh the page.');
      return false;
    }
  }

  // Load and render footer
  async loadFooter() {
    const footerElement = document.querySelector('.main-footer');
    if (!footerElement) {
      console.error('Footer element not found');
      this.loadingFailed = true;
      return false;
    }

    try {
      // Show loading with typewriter effect
      this.createTypewriterEffect(footerElement, 'Loading footer...');
      
      const footerData = await loadFooter();
      if (!footerData) {
        this.showError(footerElement, 'Failed to load footer. Please refresh the page.');
        return false;
      }

      footerElement.innerHTML = this.createFooterHTML(footerData);
      this.footerLoaded = true;
      return true;
    } catch (error) {
      console.error('Error loading footer:', error);
      this.showError(footerElement, 'Failed to load footer. Please refresh the page.');
      return false;
    }
  }

  // Initialize page loading
  async init() {
    // Add loading class to body
    document.body.classList.add('loading');
    
    // Show page loading screen
    const pageLoader = document.createElement('div');
    pageLoader.className = 'page-loading';
    pageLoader.innerHTML = '<span class="typewriter">Loading Traowl...</span>';
    document.body.appendChild(pageLoader);

    try {
      // Load header and footer simultaneously
      const [headerSuccess, footerSuccess] = await Promise.all([
        this.loadHeader(),
        this.loadFooter()
      ]);

      // Check if both loaded successfully
      if (!headerSuccess || !footerSuccess) {
        // Show error and don't load the page
        pageLoader.innerHTML = '<div class="error-text">Failed to load essential components. Please refresh the page.</div>';
        return;
      }

      // Remove loading screen and show page
      setTimeout(() => {
        document.body.removeChild(pageLoader);
        document.body.classList.remove('loading');
      }, 1000);

    } catch (error) {
      console.error('Critical loading error:', error);
      pageLoader.innerHTML = '<div class="error-text">Failed to load page. Please refresh and try again.</div>';
    }
  }

  // Create header HTML
  createHeaderHTML(headerData) {
    const dropdownHTML = (dropdown) => {
      return dropdown.map(item => 
        `<div class="dropdown-column">
          <h3><a href="${item.url}">${item.title}</a></h3>
        </div>`
      ).join('');
    };

    const navigationHTML = headerData.navigation.map(item => {
      if (item.hasDropdown) {
        return `
          <li class="has-dropdown">
            <a href="${item.url}">${item.title} <i class="ri-arrow-down-s-fill"></i></a>
            <div class="dropdown-menu">
              ${dropdownHTML(item.dropdown)}
            </div>
          </li>
        `;
      } else {
        const classes = item.highlight ? 'spiritual-highlight' : '';
        const activeClass = item.active ? 'active' : '';
        return `
          <li class="${activeClass}">
            <a class="${classes}" href="${item.url}">${item.title}</a>
          </li>
        `;
      }
    }).join('');

    return `
      <div class="container nav-container">
        <div class="logo-and-contact">
          <div class="logo-area">
            <img src="${headerData.logo.src}" alt="${headerData.logo.alt}" class="logo" />
          </div>
          <div class="header-contact">
            <a href="tel:${headerData.contact.phone}">
              <i class="${headerData.contact.icon}"></i> ${headerData.contact.phone}
            </a>
          </div>
        </div>
        <div class="nav-and-actions">
          <nav class="main-nav">
            <ul>
              ${navigationHTML}
            </ul>
          </nav>
          <div class="nav-actions">
            <div class="auth-section" id="authSection">
              <button class="sign-in-btn" id="signInBtn">
                ${headerData.authButton.text} <span class="${headerData.authButton.icon}"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Create footer HTML
  createFooterHTML(footerData) {
    const featuresHTML = footerData.features.map(feature => `
      <div class="footer-feature">
        <div class="feature-percentage">${feature.percentage}</div>
        <div class="feature-title">${feature.title}</div>
        <div class="feature-underline"></div>
        <div class="feature-list">
          ${feature.items.map(item => `<div class="feature-item">${item}</div>`).join('')}
        </div>
      </div>
    `).join('');

    const quickLinksHTML = footerData.content.quickLinks.columns.map(column => `
      <ul>
        ${column.map(link => `<li><a href="${link.url}">${link.title}</a></li>`).join('')}
      </ul>
    `).join('');

    const socialMediaHTML = footerData.content.contact.socialMedia.map(social => `
      <a href="${social.url}" target="_blank">
        <img src="${social.icon}" alt="${social.name}" style="height:28px;width:28px;">
      </a>
    `).join('');

    return `
      <div class="footer-features-row">
        ${featuresHTML}
      </div>
      <div class="footer-content-wrapper">
        <div class="container">
          <div class="footer-columns custom-footer-layout">
            <div class="footer-col">
              <h3>${footerData.content.vision.title}</h3>
              <p>${footerData.content.vision.description} <a href="${footerData.content.vision.readMoreLink}" style="font-size:0.95em; text-decoration:underline;">..read more</a></p>
            </div>
            <div class="footer-col">
              <h3>${footerData.content.quickLinks.title}</h3>
              <div class="quick-links-wrapper">
                ${quickLinksHTML}
              </div>
            </div>
            <div class="footer-col footer-contact">
              <h3>${footerData.content.contact.title}</h3>
              <address>
                ${footerData.content.contact.address.replace(/\n/g, '<br>')}
              </address>
              <a href="mailto:${footerData.content.contact.email}">${footerData.content.contact.email}</a>
              <div class="footer-social-icons">
                ${socialMediaHTML}
              </div>
            </div>
          </div>
          <div class="footer-bottom custom-footer-bottom">
            <p>${footerData.copyright}</p>
          </div>
        </div>
      </div>
    `;
  }

  // Add modal HTML to the page
  addModalHTML() {
    const modalHTML = `
      <!-- Login/Signup Modal -->
      <div id="authModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Welcome to Traowl</h2>
            <button class="modal-close" id="modalClose">&times;</button>
          </div>
          <div class="modal-body">
            <div class="auth-options">
              <a href="login.html" class="auth-option login-option">
                <div class="auth-icon">🫂</div>
                <h3>Login</h3>
                <p>Access your existing account</p>
              </a>
              <a href="signup.html" class="auth-option signup-option">
                <div class="auth-icon">✈️</div>
                <h3>Sign Up</h3>
                <p>Create a new account</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Insert modal after header
    const headerElement = document.querySelector('.main-header');
    if (headerElement) {
      headerElement.insertAdjacentHTML('afterend', modalHTML);
    }
  }

  // Add Profile Modal HTML
  addProfileModalHTML() {
    const modalHTML = `
      <div id="profileModal" class="profile-modal" style="display:none;">
        <div class="profile-modal-overlay"></div>
        <div class="profile-modal-content">
          <button class="profile-modal-close" id="profileModalClose" title="Close">&times;</button>
          <div id="profileModalInner"></div>
        </div>
      </div>
    `;
    const headerElement = document.querySelector('.main-header');
    if (headerElement) {
      headerElement.insertAdjacentHTML('afterend', modalHTML);
    }
  }

  addBookingsModalHTML() {
    const modalHTML = `
      <div id="bookingsModal" class="bookings-modal" style="display:none;">
        <div class="bookings-modal-overlay"></div>
        <div class="bookings-modal-content">
          <div class="bookings-modal-header">
            <h2><i class="ri-calendar-check-line"></i> My Bookings</h2>
            <button class="bookings-modal-close" id="bookingsModalClose" title="Close">&times;</button>
          </div>
          <div class="bookings-modal-body">
            <div id="bookingsLoading" class="bookings-loading">
              <div class="loading-spinner"></div>
              <p>Loading your bookings...</p>
            </div>
            <div id="bookingsContent" class="bookings-content" style="display: none;">
              <!-- Bookings will be loaded here -->
            </div>
            <div id="noBookings" class="no-bookings" style="display: none;">
              <div class="no-bookings-icon">
                <i class="ri-calendar-line"></i>
              </div>
              <h3>No Bookings Found</h3>
              <p>You haven't made any bookings yet. Start planning your next adventure!</p>
              <a href="home.html" class="explore-btn">
                <i class="ri-compass-line"></i>
                Explore Trips
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
    const headerElement = document.querySelector('.main-header');
    if (headerElement) {
      headerElement.insertAdjacentHTML('afterend', modalHTML);
    }
  }

  addHelpModalHTML() {
    const modalHTML = `
      <div id="helpModal" class="help-modal" style="display:none;">
        <div class="help-modal-overlay"></div>
        <div class="help-modal-content">
          <button class="help-modal-close" id="helpModalClose" title="Close">&times;</button>
          <div class="help-modal-header">
            <div class="help-icon">
              <i class="ri-customer-service-2-line"></i>
            </div>
            <h2>Help & Support</h2>
            <p>We're here to help! Tell us about your issue and we'll get back to you soon.</p>
          </div>
          <form class="help-form" id="helpForm">
            <div class="form-group">
              <label for="helpName">Full Name *</label>
              <input type="text" id="helpName" name="name" required placeholder="Enter your full name">
            </div>
            <div class="form-group">
              <label for="helpEmail">Email Address *</label>
              <input type="email" id="helpEmail" name="email" required placeholder="Enter your email address">
            </div>
            <div class="form-group">
              <label for="helpPhone">Phone Number</label>
              <input type="tel" id="helpPhone" name="phone" placeholder="Enter your phone number (optional)">
            </div>
            <div class="form-group">
              <label for="helpSubject">Subject *</label>
              <select id="helpSubject" name="subject" required>
                <option value="">Select a subject</option>
                <option value="booking">Booking Issues</option>
                <option value="payment">Payment Problems</option>
                <option value="trip">Trip Information</option>
                <option value="cancellation">Cancellation/Refund</option>
                <option value="technical">Technical Issues</option>
                <option value="general">General Inquiry</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label for="helpDescription">Description *</label>
              <textarea id="helpDescription" name="description" required rows="5" placeholder="Please describe your issue or question in detail..."></textarea>
            </div>
            <button type="submit" class="help-submit-btn">
              <i class="ri-send-plane-line"></i>
              Submit Request
            </button>
          </form>
        </div>
      </div>
    `;
    const headerElement = document.querySelector('.main-header');
    if (headerElement) {
      headerElement.insertAdjacentHTML('afterend', modalHTML);
    }
  }

  // Initialize header events (like modal functionality)
  initializeHeaderEvents() {
    this.updateAuthSection();
    this.setupModalEvents();
  }

  // Update auth section based on user login status
  updateAuthSection() {
    const authSection = document.getElementById('authSection');
    if (!authSection) return;

    // Check if user is logged in
    const authManager = new AuthManager();
    if (authManager.isAuthenticated()) {
      const user = authManager.getCurrentUser();
      const firstLetter = user.firstName.charAt(0).toUpperCase();
      authSection.innerHTML = `
        <div class="user-menu">
          <button class="user-btn" id="userBtn">
            <div class="profile-avatar">
              <span class="avatar-letter">${firstLetter}</span>
            </div>
            <span class="user-name">Hi, ${user.firstName}</span>
            <i class="ri-arrow-down-s-line dropdown-arrow"></i>
          </button>
          <div class="user-dropdown" id="userDropdown">
            <div class="dropdown-header">
              <div class="profile-avatar-large">
                <span class="avatar-letter-large">${firstLetter}</span>
              </div>
              <div class="user-info">
                <div class="user-full-name">${user.firstName} ${user.lastName}</div>
                <div class="user-email">${user.email}</div>
              </div>
            </div>
            <div class="dropdown-divider"></div>
            <a href="#" class="dropdown-item" id="profileBtn">
              <i class="ri-user-line"></i> My Profile
            </a>
            <a href="#" class="dropdown-item" id="bookingsBtn">
              <i class="ri-bookmark-line"></i> My Bookings
            </a>
            <a href="#" class="dropdown-item" id="wishlistBtn">
              <i class="ri-heart-line"></i> Wishlist
            </a>
            ${user.role === 'admin' ? `
            <div class="dropdown-divider"></div>
            <a href="admin.html" class="dropdown-item admin-item" id="adminBtn">
              <i class="ri-settings-3-line"></i> Admin Panel
            </a>` : ''}
            <div class="dropdown-divider"></div>
            <a href="#" class="dropdown-item" id="helpBtn">
              <i class="ri-question-line"></i> Help & Support
            </a>
            <a href="#" class="dropdown-item logout-item" id="logoutBtn">
              <i class="ri-logout-circle-line"></i> Logout
            </a>
          </div>
        </div>
      `;
      
      this.setupUserMenu();
    } else {
      authSection.innerHTML = `
        <button class="sign-in-btn" id="signInBtn">
          Sign In <span class="ri-user-line"></span>
        </button>
      `;
      
      this.setupSignInButton();
    }
  }

  // Setup user menu functionality
  setupUserMenu() {
    const userBtn = document.getElementById('userBtn');
    const userDropdown = document.getElementById('userDropdown');
    const profileBtn = document.getElementById('profileBtn');
    const bookingsBtn = document.getElementById('bookingsBtn');
    const wishlistBtn = document.getElementById('wishlistBtn');
    const helpBtn = document.getElementById('helpBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (userBtn && userDropdown) {
      userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('show');
        
        // Rotate arrow icon
        const arrow = userBtn.querySelector('.dropdown-arrow');
        if (arrow) {
          arrow.style.transform = userDropdown.classList.contains('show') ? 'rotate(180deg)' : 'rotate(0deg)';
        }
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        userDropdown.classList.remove('show');
        const arrow = userBtn.querySelector('.dropdown-arrow');
        if (arrow) {
          arrow.style.transform = 'rotate(0deg)';
        }
      });

      userDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    // Profile button
    if (profileBtn) {
      profileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        userDropdown.classList.remove('show');
        // Show profile modal
        const modal = document.getElementById('profileModal');
        if (modal) {
          modal.style.display = 'flex';
          setTimeout(() => { modal.classList.add('show'); }, 10);
        }
        // Load profile form into modal
        fetch('profile.html')
          .then(res => res.text())
          .then(html => {
            // Extract only the form from profile.html
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const form = tempDiv.querySelector('.profile-container');
            document.getElementById('profileModalInner').innerHTML = '';
            if (form) document.getElementById('profileModalInner').appendChild(form);
            // Load profile.js logic
            if (!window.profileScriptLoaded) {
              const script = document.createElement('script');
              script.src = 'js/profile.js';
              script.onload = () => { window.profileScriptLoaded = true; };
              document.body.appendChild(script);
            }
          });
      });
    }

    // Bookings button
    if (bookingsBtn) {
      bookingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        userDropdown.classList.remove('show');
        this.showBookingsModal();
      });
    }

    // Wishlist button
    if (wishlistBtn) {
      wishlistBtn.addEventListener('click', (e) => {
        e.preventDefault();
        userDropdown.classList.remove('show');
        const authManager = new AuthManager();
        authManager.showMessage('Wishlist feature coming soon!', 'info');
      });
    }

    // Help button
    if (helpBtn) {
      helpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        userDropdown.classList.remove('show');
        // Show help modal
        const modal = document.getElementById('helpModal');
        if (modal) {
          modal.style.display = 'flex';
          setTimeout(() => { modal.classList.add('show'); }, 10);
        }
      });
    }

    // Logout button
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        userDropdown.classList.remove('show');
        const authManager = new AuthManager();
        await authManager.logout();
        authManager.showMessage('You have been logged out successfully', 'success');
        this.updateAuthSection();
      });
    }

    // Profile modal close
    document.addEventListener('click', function(e) {
      const modal = document.getElementById('profileModal');
      if (!modal) return;
      if (e.target.classList.contains('profile-modal-close') || e.target.classList.contains('profile-modal-overlay')) {
        modal.classList.remove('show');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
      }
    });

    // Help modal close and overlay
    document.addEventListener('click', function(e) {
      const modal = document.getElementById('helpModal');
      if (!modal) return;
      if (e.target.classList.contains('help-modal-close') || e.target.classList.contains('help-modal-overlay')) {
        modal.classList.remove('show');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
      }
    });
    // Help form submit
    document.addEventListener('submit', function(e) {
      const form = e.target;
      if (form && form.id === 'helpForm') {
        e.preventDefault();
        const authManager = new AuthManager();
        authManager.showMessage('Thank you for contacting us! We will reach out to you soon.', 'success');
        form.reset();
        // Close modal after short delay
        const modal = document.getElementById('helpModal');
        if (modal) {
          setTimeout(() => {
            modal.classList.remove('show');
            setTimeout(() => { modal.style.display = 'none'; }, 300);
          }, 1200);
        }
      }
    });
  }

  // Setup sign in button
  setupSignInButton() {
    const signInBtn = document.getElementById('signInBtn');
    const authModal = document.getElementById('authModal');

    if (signInBtn && authModal) {
      signInBtn.addEventListener('click', () => {
        authModal.classList.add('active');
      });
    }
  }

  // Setup modal events
  setupModalEvents() {
    const authModal = document.getElementById('authModal');
    const modalClose = document.getElementById('modalClose');

    if (modalClose && authModal) {
      modalClose.addEventListener('click', () => {
        authModal.classList.remove('active');
      });
    }

    if (authModal) {
      authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
          authModal.classList.remove('active');
        }
      });
    }
  }

  // Show bookings modal
  async showBookingsModal() {
    const modal = document.getElementById('bookingsModal');
    if (!modal) return;

    // Show modal
    modal.style.display = 'flex';
    setTimeout(() => { modal.classList.add('show'); }, 10);

    // Add bookings modal styles
    this.addBookingsModalStyles();

    // Setup modal close events
    this.setupBookingsModalEvents();

    // Load user bookings
    await this.loadUserBookings();
  }

  // Add styles for bookings modal
  addBookingsModalStyles() {
    if (document.getElementById('bookings-modal-styles')) return;
    
    const styles = `
      <style id="bookings-modal-styles">
        .bookings-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10000;
          display: none;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .bookings-modal.show {
          opacity: 1;
        }
        
        .bookings-modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
        }
        
        .bookings-modal-content {
          position: relative;
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          transform: translateY(20px);
          transition: transform 0.3s ease;
        }
        
        .bookings-modal.show .bookings-modal-content {
          transform: translateY(0);
        }
        
        .bookings-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: white;
        }
        
        .bookings-modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .bookings-modal-close {
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
        }
        
        .bookings-modal-close:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .bookings-modal-body {
          padding: 2rem;
          max-height: 60vh;
          overflow-y: auto;
        }
        
        .bookings-loading {
          text-align: center;
          padding: 3rem 0;
        }
        
        .bookings-loading .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f4f6;
          border-top: 3px solid #fbbf24;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }
        
        .bookings-loading p {
          color: #6b7280;
          font-size: 1rem;
        }
        
        .booking-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1rem;
          transition: all 0.2s ease;
        }
        
        .booking-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
        
        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }
        
        .booking-title h4 {
          margin: 0 0 0.25rem 0;
          color: #22223b;
          font-size: 1.1rem;
          font-weight: 600;
        }
        
        .booking-id {
          color: #6b7280;
          font-size: 0.85rem;
          font-weight: 500;
        }
        
        .booking-status {
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }
        
        .status-pending-confirmation {
          background: rgba(255, 152, 0, 0.1);
          color: #f59e0b;
          border: 1px solid rgba(255, 152, 0, 0.2);
        }
        
        .status-confirmed {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }
        
        .status-cancelled {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        
        .booking-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .booking-detail {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .booking-detail i {
          color: #fbbf24;
          font-size: 1.1rem;
        }
        
        .booking-detail-content {
          flex: 1;
        }
        
        .booking-detail-label {
          font-size: 0.8rem;
          color: #6b7280;
          font-weight: 500;
        }
        
        .booking-detail-value {
          font-size: 0.95rem;
          color: #22223b;
          font-weight: 600;
        }
        
        .booking-requests {
          background: #f0f9ff;
          border: 1px solid #e0f2fe;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        
        .booking-requests .requests-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #374151;
        }
        
        .booking-requests .requests-header i {
          color: #0284c7;
        }
        
        .booking-requests p {
          margin: 0;
          color: #6b7280;
          line-height: 1.5;
        }
        
        .booking-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        
        .booking-btn {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          border: none;
        }
        
        .btn-view {
          background: #e0f2fe;
          color: #0277bd;
        }
        
        .btn-view:hover {
          background: #b3e5fc;
        }
        
        .btn-contact {
          background: #f3e8ff;
          color: #7c3aed;
        }
        
        .btn-contact:hover {
          background: #e9d5ff;
        }
        
        .no-bookings {
          text-align: center;
          padding: 3rem 0;
        }
        
        .no-bookings-icon {
          font-size: 4rem;
          color: #d1d5db;
          margin-bottom: 1rem;
        }
        
        .no-bookings h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }
        
        .no-bookings p {
          color: #6b7280;
          margin-bottom: 2rem;
        }
        
        .explore-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        
        .explore-btn:hover {
          background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .bookings-modal-content {
            width: 95%;
            margin: 1rem;
          }
          
          .bookings-modal-header {
            padding: 1rem 1.5rem;
          }
          
          .bookings-modal-body {
            padding: 1.5rem;
          }
          
          .booking-details {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          
          .booking-actions {
            flex-direction: column;
          }
        }
      </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
  }

  // Setup bookings modal events
  setupBookingsModalEvents() {
    const modal = document.getElementById('bookingsModal');
    const closeBtn = document.getElementById('bookingsModalClose');
    const overlay = modal?.querySelector('.bookings-modal-overlay');

    // Close modal events
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
      });
    }

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
        modal.classList.remove('show');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
      }
    });
  }

  // Load user bookings
  async loadUserBookings() {
    const loadingElement = document.getElementById('bookingsLoading');
    const contentElement = document.getElementById('bookingsContent');
    const noBookingsElement = document.getElementById('noBookings');
    
    // Show loading state
    if (loadingElement) loadingElement.style.display = 'block';
    if (contentElement) contentElement.style.display = 'none';
    if (noBookingsElement) noBookingsElement.style.display = 'none';
    
    try {
      const authManager = new AuthManager();
      const token = authManager.getToken();
      if (!token) {
        this.showNoBookings('Please login to view your bookings.');
        return;
      }

      const response = await fetch('http://localhost:3000/api/user/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.displayUserBookings(data.bookings);
      } else {
        console.error('Failed to load bookings');
        this.showNoBookings('Failed to load bookings. Please try again later.');
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      this.showNoBookings('Network error. Please check your connection.');
    } finally {
      // Hide loading state
      if (loadingElement) loadingElement.style.display = 'none';
    }
  }

  // Display user bookings
  displayUserBookings(bookings) {
    const contentElement = document.getElementById('bookingsContent');
    const noBookingsElement = document.getElementById('noBookings');
    
    if (bookings.length === 0) {
      if (contentElement) contentElement.style.display = 'none';
      if (noBookingsElement) noBookingsElement.style.display = 'block';
      return;
    }

    if (noBookingsElement) noBookingsElement.style.display = 'none';
    if (contentElement) {
      contentElement.style.display = 'block';
      contentElement.innerHTML = bookings.map(booking => `
        <div class="booking-card">
          <div class="booking-header">
            <div class="booking-title">
              <h4>${booking.tripTitle}</h4>
              <span class="booking-id">#${booking.bookingId}</span>
            </div>
            <div class="booking-status status-${booking.status.replace('_', '-')}">
              <i class="ri-${this.getStatusIcon(booking.status)}-line"></i>
              ${this.formatStatus(booking.status)}
            </div>
          </div>
          <div class="booking-details">
            <div class="booking-detail">
              <i class="ri-group-line"></i>
              <div class="booking-detail-content">
                <div class="booking-detail-label">Travelers</div>
                <div class="booking-detail-value">${booking.travelers} traveler${booking.travelers !== 1 ? 's' : ''}</div>
              </div>
            </div>
            <div class="booking-detail">
              <i class="ri-calendar-line"></i>
              <div class="booking-detail-content">
                <div class="booking-detail-label">Travel Date</div>
                <div class="booking-detail-value">${booking.selectedDate ? this.formatDate(booking.selectedDate) : 'To be confirmed'}</div>
              </div>
            </div>
            <div class="booking-detail">
              <i class="ri-time-line"></i>
              <div class="booking-detail-content">
                <div class="booking-detail-label">Booked On</div>
                <div class="booking-detail-value">${this.formatDate(booking.createdAt)}</div>
              </div>
            </div>
          </div>
          ${booking.specialRequests ? `
            <div class="booking-requests">
              <div class="requests-header">
                <i class="ri-chat-3-line"></i>
                <strong>Special Requests:</strong>
              </div>
              <p>${booking.specialRequests}</p>
            </div>
          ` : ''}
          <div class="booking-actions">
            <button class="booking-btn btn-view" onclick="window.commonComponents.viewBookingDetails('${booking.bookingId}')">
              <i class="ri-eye-line"></i> View Details
            </button>
            <button class="booking-btn btn-contact" onclick="window.commonComponents.contactSupport('${booking.bookingId}')">
              <i class="ri-customer-service-line"></i> Contact Support
            </button>
          </div>
        </div>
      `).join('');
    }
  }

  // Show no bookings message
  showNoBookings(message = null) {
    const contentElement = document.getElementById('bookingsContent');
    const noBookingsElement = document.getElementById('noBookings');
    const loadingElement = document.getElementById('bookingsLoading');
    
    if (loadingElement) loadingElement.style.display = 'none';
    if (contentElement) contentElement.style.display = 'none';
    if (noBookingsElement) {
      noBookingsElement.style.display = 'block';
      if (message) {
        const messageElement = noBookingsElement.querySelector('p');
        if (messageElement) messageElement.textContent = message;
      }
    }
  }

  // Helper functions for bookings
  getStatusIcon(status) {
    switch (status) {
      case 'pending_confirmation': return 'time';
      case 'confirmed': return 'check-circle';
      case 'cancelled': return 'close-circle';
      case 'completed': return 'check-double';
      default: return 'information';
    }
  }

  formatStatus(status) {
    switch (status) {
      case 'pending_confirmation': return 'Pending Confirmation';
      case 'confirmed': return 'Confirmed';
      case 'cancelled': return 'Cancelled';
      case 'completed': return 'Completed';
      default: return status;
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  // View booking details
  viewBookingDetails(bookingId) {
    // Create a detailed view modal or redirect to booking details page
    const authManager = new AuthManager();
    authManager.showMessage('Booking details feature coming soon!', 'info');
  }

  // Contact support for booking
  contactSupport(bookingId) {
    // Show help modal with booking ID pre-filled
    const helpModal = document.getElementById('helpModal');
    if (helpModal) {
      helpModal.style.display = 'flex';
      setTimeout(() => { helpModal.classList.add('show'); }, 10);
      
      // Pre-fill booking ID in description
      const descriptionField = document.getElementById('helpDescription');
      if (descriptionField) {
        descriptionField.value = `Regarding booking #${bookingId}: `;
      }
    }
  }

}

// Create global instance
window.commonComponents = new CommonComponents();

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if we're not on sign-in or sign-up pages
  const currentPage = window.location.pathname.toLowerCase();
  const excludePages = ['/login.html', '/signup.html', '/sign-in.html', '/sign-up.html'];
  
  const shouldLoadCommon = !excludePages.some(page => currentPage.includes(page.replace('/', '')));
  
  if (shouldLoadCommon) {
    window.commonComponents.init();
  }
});

// Listen for authentication changes
window.addEventListener('authStateChanged', () => {
  if (window.commonComponents) {
    window.commonComponents.updateAuthSection();
  }
});
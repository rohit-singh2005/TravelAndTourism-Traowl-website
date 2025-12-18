// Authentication utility module
class AuthManager {
  constructor() {
    this.baseUrl = 'http://localhost:3000/api/auth';
    this.token = localStorage.getItem('traowl_token');
    this.user = JSON.parse(localStorage.getItem('traowl_user') || null);
    this.refreshToken = localStorage.getItem('traowl_refresh_token');
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  // Get current user
  getCurrentUser() {
    return this.user;
  }

  // Get auth token
  getToken() {
    return this.token;
  }

  // Set authentication data
  setAuthData(token, user, refreshToken = null) {
    this.token = token;
    this.user = user;
    if (refreshToken) {
      this.refreshToken = refreshToken;
      localStorage.setItem('traowl_refresh_token', refreshToken);
    }
    localStorage.setItem('traowl_token', token);
    localStorage.setItem('traowl_user', JSON.stringify(user));
    
    // Dispatch authentication change event
    window.dispatchEvent(new CustomEvent('authStateChanged', {
      detail: { authenticated: true, user }
    }));
  }

  // Clear authentication data
  clearAuthData() {
    this.token = null;
    this.user = null;
    this.refreshToken = null;
    localStorage.removeItem('traowl_token');
    localStorage.removeItem('traowl_user');
    localStorage.removeItem('traowl_refresh_token');
    
    // Dispatch authentication change event
    window.dispatchEvent(new CustomEvent('authStateChanged', {
      detail: { authenticated: false, user: null }
    }));
  }

  // Refresh authentication token
  async refreshAuthToken() {
    if (!this.refreshToken) return false;
    try {
      const response = await fetch(`${this.baseUrl}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      if (response.ok) {
        const data = await response.json();
        this.setAuthData(data.accessToken || data.token, data.user, this.refreshToken);
        return true;
      } else {
        this.clearAuthData();
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuthData();
      return false;
    }
  }

  // Enhanced password validation
  validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: this.calculatePasswordStrength(password)
    };
  }

  // Calculate password strength
  calculatePasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    if (score <= 5) return 'strong';
    return 'very-strong';
  }

  // Enhanced email validation
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    // Check for common disposable email domains
    const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
    const domain = email.split('@')[1];
    if (disposableDomains.includes(domain)) {
      return { isValid: false, error: 'Please use a valid email address' };
    }
    return { isValid: true };
  }

  // Show message
  showMessage(message, type = 'success') {
    // Remove existing message
    const existingMessage = document.querySelector('.auth-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `auth-message ${type}`;
    messageDiv.style.cssText = `
      position: fixed;
      top: 32px;
      right: 32px;
      padding: 18px 28px;
      border-radius: 14px;
      color: #22223b;
      font-weight: 700;
      font-size: 1.08rem;
      z-index: 99999;
      animation: slideInRight 0.35s cubic-bezier(0.4,0,0.2,1);
      min-width: 320px;
      max-width: 420px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      display: flex;
      align-items: center;
      gap: 14px;
      background: #fff;
      border-left: 6px solid #fbbf24;
      border: 1.5px solid #f3f3f3;
      letter-spacing: 0.01em;
    `;

    // Add icon and color based on message type
    let icon = '';
    let borderColor = '#fbbf24';
    let iconColor = '#fbbf24';
    switch (type) {
      case 'success':
        borderColor = '#22c55e';
        iconColor = '#22c55e';
        icon = '✓';
        break;
      case 'error':
        borderColor = '#ef4444';
        iconColor = '#ef4444';
        icon = '✕';
        break;
      case 'warning':
        borderColor = '#f59e0b';
        iconColor = '#f59e0b';
        icon = '⚠';
        break;
      case 'info':
        borderColor = '#2563eb';
        iconColor = '#2563eb';
        icon = 'ℹ';
        break;
      default:
        borderColor = '#fbbf24';
        iconColor = '#fbbf24';
        icon = 'ℹ';
    }
    messageDiv.style.borderLeft = `6px solid ${borderColor}`;
    messageDiv.innerHTML = `<span style="font-size:1.4em;font-weight:bold;color:${iconColor};">${icon}</span><span style="color:#22223b;">${message}</span>`;
    document.body.appendChild(messageDiv);

    // Auto remove after 4 seconds
    setTimeout(() => {
      messageDiv.style.animation = 'slideOutRight 0.3s cubic-bezier(0.4,0,0.2,1)';
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.remove();
        }
      }, 300);
    }, 4000);
  }

  // Show loading state
  showLoading(element, text = 'Loading...') {
    const originalText = element.textContent;
    const originalHTML = element.innerHTML;
    
    element.innerHTML = `
      <span class="loading-spinner"></span>
      <span>${text}</span>
    `;
    element.disabled = true;
    element.style.opacity = '0.7';
    element.style.cursor = 'not-allowed';
    
    return () => {
      element.innerHTML = originalHTML;
      element.disabled = false;
      element.style.opacity = '1';
      element.style.cursor = 'pointer';
    };
  }

  // Register user with enhanced validation
  async register(userData) {
    try {
      // Enhanced validation
      const emailValidation = this.validateEmail(userData.email);
      if (!emailValidation.isValid) {
        return { success: false, error: emailValidation.error };
      }

      const passwordValidation = this.validatePassword(userData.password);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.errors[0] };
      }

      const response = await fetch(`${this.baseUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        this.setAuthData(data.accessToken || data.token, data.user, data.refreshToken);
        return { success: true, data };
      } else {
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Login user with enhanced validation
  async login(credentials) {
    try {
      const emailValidation = this.validateEmail(credentials.email);
      if (!emailValidation.isValid) {
        return { success: false, error: emailValidation.error };
      }

      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        this.setAuthData(data.accessToken || data.token, data.user, data.refreshToken);
        return { success: true, data };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Logout user
  async logout() {
    try {
      if (this.token && this.refreshToken) {
        await fetch(`${this.baseUrl}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
    }
  }

  // Verify token
  async verifyToken() {
    if (!this.token) return false;

    try {
      const response = await fetch(`${this.baseUrl}/verify`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (response.ok) {
        return true;
      } else if (response.status === 419) {
        // Try to refresh token
        const refreshResult = await this.refreshAuthToken();
        return refreshResult;
      } else {
        this.clearAuthData();
        return false;
      }
    } catch (error) {
      console.error('Token verification error:', error);
      this.clearAuthData();
      return false;
    }
  }

  // Get user profile
  async getUserProfile() {
    if (!this.token) return null;

    try {
      const response = await fetch(`${this.baseUrl}/profile`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.user = data.user;
        localStorage.setItem('traowl_user', JSON.stringify(data.user));
        return data.user;
      } else {
        this.clearAuthData();
        return null;
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      this.clearAuthData();
      return null;
    }
  }

  // Request password reset
  async requestPasswordReset(email) {
    try {
      const response = await fetch(`${this.baseUrl}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return { success: response.ok, message: data.message || data.error };
    } catch (error) {
      console.error('Password reset request error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  // Reset password with token
  async resetPassword(token, newPassword) {
    try {
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.errors[0] };
      }

      const response = await fetch(`${this.baseUrl}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();
      return { success: response.ok, message: data.message || data.error };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Add CSS animations and styles
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      
      .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s ease-in-out infinite;
        margin-right: 8px;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg) }
      }
      
      .auth-message {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        min-width: 300px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      }
      
      .password-strength {
        margin-top:5px;
        font-size: 0.8em;
        padding: 5px;
        border-radius:4px;
        text-align: center;
        font-weight: 600;
      }
      
      .password-strength.weak {
        background: #fee2e2;
        color: #dc2626;
      }
      
      .password-strength.medium {
        background: #fef3c7;
        color: #d97706;
      }
      
      .password-strength.strong {
        background: #d1fae5;
        color: #059669;
      }
      
      .password-strength.very-strong {
        background: #dbeafe;
        color: #2563eb;
      }
    `;
    document.head.appendChild(style);
  }
}

// Create global instance
window.authManager = new AuthManager();

// Add styles when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.authManager.addStyles();
});

// Auto-verify token on page load
window.addEventListener('load', async () => {
  if (window.authManager.isAuthenticated()) {
    const isValid = await window.authManager.verifyToken();
    if (!isValid) {
      window.authManager.showMessage('Your session has expired. Please login again.', 'warning');
    }
  }
});
// profile.js
const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('.profile-form');
  const firstNameInput = document.getElementById('firstName');
  const lastNameInput = document.getElementById('lastName');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  
  // Initialize Auth Manager
  window.authManager = new AuthManager();
  
  // Check authentication
  if (!authManager.isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }
  
  // Initialize profile functionality
  initializeProfile();

  // Load user data
  async function loadProfile() {
    if (!window.authManager || !authManager.isAuthenticated()) {
      window.location.href = 'login.html';
      return;
    }
    const user = authManager.getCurrentUser();
    firstNameInput.value = user.firstName || '';
    lastNameInput.value = user.lastName || '';
    emailInput.value = user.email || '';
    phoneInput.value = user.phone || '';
  }

  loadProfile();

  // Handle form submit
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!authManager.isAuthenticated()) {
      window.location.href = 'login.html';
      return;
    }
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!firstName || !lastName || !email) {
      authManager.showMessage('First name, last name, and email are required.', 'error');
      return;
    }
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        authManager.showMessage('Passwords do not match.', 'error');
        return;
      }
      if (newPassword.length > 0 && newPassword.length < 6) {
        authManager.showMessage('New password must be at least 6 characters.', 'error');
        return;
      }
    }

    // Prepare update payload
    const updateData = {
      firstName,
      lastName,
      email,
      phone,
    };
    if (newPassword) {
      updateData.newPassword = newPassword;
    }

    try {
      const response = await fetch('http://localhost:3000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authManager.getToken()}`,
        },
        body: JSON.stringify(updateData),
      });
      const data = await response.json();
      if (response.ok) {
        authManager.showMessage('Profile updated successfully!', 'success');
        // Update local user data
        authManager.setAuthData(authManager.getToken(), data.user, authManager.refreshToken);
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
      } else {
        authManager.showMessage(data.error || 'Failed to update profile.', 'error');
      }
    } catch (err) {
      authManager.showMessage('Network error. Please try again.', 'error');
    }
  });
});

// Initialize profile with user data
async function initializeProfile() {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return; // Let existing auth manager handle this
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}
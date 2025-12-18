document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('.login-form');
    const loginBtn = document.querySelector('.login-btn');
    const usernameInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    const rememberMeCheckbox = document.querySelector('input[type="checkbox"]');

    // Check if user is already logged in
    if (authManager.isAuthenticated()) {
        authManager.showMessage('You are already logged in. Redirecting...', 'info');
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 2000);
        return;
    }

    // Add form validation
    function validateForm() {
        const email = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!email || !password) {
            authManager.showMessage('Please fill in all fields', 'error');
            return false;
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            authManager.showMessage('Please enter a valid email address', 'error');
            return false;
        }
        
        return true;
    }

    // Handle form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        const hideLoading = authManager.showLoading(loginBtn, 'Logging in...');
        
        try {
            const credentials = {
                email: usernameInput.value.trim(),
                password: passwordInput.value.trim()
            };
            
            const result = await authManager.login(credentials);
            
            if (result.success) {
                authManager.showMessage(`Welcome back, ${result.data.user.firstName}!`, 'success');
                
                // Clear form
                loginForm.reset();
                
                // Check if there's a booking redirect URL
                const bookingRedirect = sessionStorage.getItem('traowl_booking_redirect');
                
                // Redirect after showing success message
                setTimeout(() => {
                    if (bookingRedirect) {
                        sessionStorage.removeItem('traowl_booking_redirect');
                        window.location.href = bookingRedirect;
                    } else {
                        window.location.href = 'home.html';
                    }
                }, 1500);
            } else {
                authManager.showMessage(result.error, 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            authManager.showMessage('An unexpected error occurred. Please try again.', 'error');
        } finally {
            hideLoading();
        }
    });

    // Handle social login buttons
    const socialButtons = document.querySelectorAll('.social-btn');
    socialButtons.forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.preventDefault();
            const provider = this.classList.contains('facebook') ? 'Facebook' : 'Google';
            
            if (provider === 'Google') {
                const result = await authManager.loginWithGoogle();
                if (!result.success) {
                    authManager.showMessage(result.message || result.error, 'info');
                }
            } else if (provider === 'Facebook') {
                const result = await authManager.loginWithFacebook();
                if (!result.success) {
                    authManager.showMessage(result.message || result.error, 'info');
                }
            }
        });
    });

    // Password visibility toggle functionality
    function setupPasswordToggle() {
        const passwordToggleBtn = document.querySelector('.password-toggle-btn');
        
        if (passwordToggleBtn) {
            passwordToggleBtn.addEventListener('click', function() {
                const passwordInput = document.querySelector('input[type="password"], input[type="text"][placeholder="Password"]');
                const icon = this.querySelector('i');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.className = 'ri-eye-off-line';
                    this.setAttribute('aria-label', 'Hide password');
                } else {
                    passwordInput.type = 'password';
                    icon.className = 'ri-eye-line';
                    this.setAttribute('aria-label', 'Show password');
                }
            });
        }
    }

    // Initialize password toggle functionality
    setupPasswordToggle();

    // Forgot password modal logic
    const forgotModal = document.getElementById('forgot-password-modal');
    const forgotLink = document.querySelector('.forgot-link');
    const closeForgotModal = document.querySelector('.close-forgot-modal');
    const forgotForm = document.querySelector('.forgot-password-form');
    const forgotEmail = document.querySelector('.forgot-email');
    const forgotSubmitBtn = document.querySelector('.forgot-submit-btn');
    const forgotMsg = document.querySelector('.forgot-password-message');

    if (forgotLink && forgotModal) {
        forgotLink.addEventListener('click', function(e) {
            e.preventDefault();
            forgotModal.style.display = 'flex';
            forgotMsg.textContent = '';
            forgotEmail.value = '';
        });
    }
    if (closeForgotModal && forgotModal) {
        closeForgotModal.addEventListener('click', function() {
            forgotModal.style.display = 'none';
        });
    }
    if (forgotForm) {
        forgotForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            forgotSubmitBtn.disabled = true;
            forgotSubmitBtn.textContent = 'Sending...';
            forgotMsg.textContent = '';
            try {
                const email = forgotEmail.value.trim();
                const result = await authManager.requestPasswordReset(email);
                if (result.success) {
                    forgotMsg.style.color = '#059669';
                    forgotMsg.textContent = 'Reset link sent! Check your email.';
                    setTimeout(() => {
                        forgotModal.style.display = 'none';
                    }, 2000);
                } else {
                    forgotMsg.style.color = '#dc2626';
                    forgotMsg.textContent = result.message || 'Failed to send reset link.';
                }
            } catch (err) {
                forgotMsg.style.color = '#dc2626';
                forgotMsg.textContent = 'Network error. Please try again.';
            } finally {
                forgotSubmitBtn.disabled = false;
                forgotSubmitBtn.textContent = 'Send Reset Link';
            }
        });
    }

    // Focus on first input
    usernameInput.focus();
});

// After header loads, inject the shared modal
if (typeof CommonComponents !== undefined) {
  (new CommonComponents()).addModalHTML();
}

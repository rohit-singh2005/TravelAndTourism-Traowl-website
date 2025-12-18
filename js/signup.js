document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.querySelector('.signup-form');
    const signupBtn = document.querySelector('.signup-btn');
    const firstNameInput = document.querySelector('input[placeholder="First Name"]');
    const lastNameInput = document.querySelector('input[placeholder="Last Name"]');
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[placeholder="Enter Password"]');
    const confirmPasswordInput = document.querySelector('input[placeholder="Confirm Password"]');
    const passwordStrengthMeter = document.querySelector('.password-strength-meter');

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
        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        
        // Check if all fields are filled
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            authManager.showMessage('Please fill in all fields', 'error');
            return false;
        }
        
        // Validate names
        if (firstName.length < 2) {
            authManager.showMessage('First name must be at least 2 characters long', 'error');
            return false;
        }
        
        if (lastName.length < 2) {
            authManager.showMessage('Last name must be at least 2 characters long', 'error');
            return false;
        }
        
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            authManager.showMessage('Please enter a valid email address', 'error');
            return false;
        }
        
        // Validate password
        if (password.length < 6) {
            authManager.showMessage('Password must be at least 6 characters long', 'error');
            return false;
        }
        
        // Check if passwords match
        if (password !== confirmPassword) {
            authManager.showMessage('Passwords do not match!', 'error');
            return false;
        }
        
        return true;
    }

    // Handle form submission
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        const hideLoading = authManager.showLoading(signupBtn, 'Creating account...');
        
        try {
            const userData = {
                firstName: firstNameInput.value.trim(),
                lastName: lastNameInput.value.trim(),
                email: emailInput.value.trim(),
                password: passwordInput.value.trim()
            };
            
            const result = await authManager.register(userData);
            
            if (result.success) {
                authManager.showMessage(`Welcome to Traowl, ${result.data.user.firstName}! Account created successfully.`, 'success');
                
                // Clear form
                signupForm.reset();
                
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
                }, 2000);
            } else {
                authManager.showMessage(result.error, 'error');
            }
        } catch (error) {
            console.error('Signup error:', error);
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

    // Focus on first input
    firstNameInput.focus();

    // Password visibility toggle functionality
    function setupPasswordToggle() {
        const passwordToggleBtns = document.querySelectorAll('.password-toggle-btn');
        
        passwordToggleBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const passwordContainer = this.parentElement;
                const passwordInput = passwordContainer.querySelector('input');
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
        });
    }

    // Initialize password toggle functionality
    setupPasswordToggle();

    passwordInput.addEventListener('input', function() {
        const password = passwordInput.value;
        const result = authManager.validatePassword(password);
        let strengthText = '';
        let strengthClass = '';
        switch (result.strength) {
            case 'very-strong':
                strengthText = 'Very Strong';
                strengthClass = 'very-strong';
                break;
            case 'strong':
                strengthText = 'Strong';
                strengthClass = 'strong';
                break;
            case 'medium':
                strengthText = 'Medium';
                strengthClass = 'medium';
                break;
            default:
                strengthText = 'Weak';
                strengthClass = 'weak';
        }
        let errorHtml = '';
        if (!result.isValid && password.length > 0) {
            errorHtml = '<ul style="margin:6px 0 0 0;padding-left:18px;color:#dc2626;font-size:0.95em;">' + result.errors.map(e => `<li>${e}</li>`).join('') + '</ul>';
        }
        passwordStrengthMeter.innerHTML = `<div class="password-strength ${strengthClass}">${strengthText}</div>${errorHtml}`;
    });
});

// After header loads, inject the shared modal
if (typeof CommonComponents !== 'undefined') {
  (new CommonComponents()).addModalHTML();
}
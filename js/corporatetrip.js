

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  if (window.commonComponents) {
    window.commonComponents.init();
  }
    
    // Modal functionality
    const signInBtn = document.getElementById('signInBtn');
    const authModal = document.getElementById('authModal');
    const modalClose = document.getElementById('modalClose');

    // Open modal
    if (signInBtn && authModal) {
        signInBtn.addEventListener('click', function(e) {
            e.preventDefault();
            authModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    // Close modal with close button
    if (modalClose && authModal) {
        modalClose.addEventListener('click', function() {
            authModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    // Close modal when clicking outside modal content
    if (authModal) {
        authModal.addEventListener('click', function(e) {
            if (e.target === authModal) {
                authModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && authModal && authModal.classList.contains('active')) {
            authModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
});
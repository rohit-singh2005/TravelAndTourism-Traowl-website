window.addEventListener('DOMContentLoaded', function() {
  if (typeof CommonComponents !== 'undefined') {
    (new CommonComponents()).addModalHTML();
  }
});

document.addEventListener('DOMContentLoaded', async function() {
    const blogCards = document.getElementById('blogCards');

    // Load blogs from API
    async function loadBlogsFromAPI() {
        try {
            const blogs = await loadBlogs();
            return blogs;
        } catch (error) {
            console.error('Failed to load blogs:', error);
            // Fallback to empty array if API fails
            return [];
        }
    }

    async function displayBlogs() {
        try {
            const blogs = await loadBlogsFromAPI();
            
            if (blogs.length === 0) {
                blogCards.innerHTML = '<p style="text-align: center; font-size: 1.2em;">No blogs found. Please try again later.</p>';
                return;
            }

            blogs.forEach(blog => {
                const cardHTML = createBlogCard(blog);
                blogCards.insertAdjacentHTML('beforeend', cardHTML);
            });
        } catch (error) {
            console.error('Error displaying blogs:', error);
            blogCards.innerHTML = '<p style="text-align: center; font-size: 1.2em;">Failed to load blogs. Please try again later.</p>';
        }
    }

    // Add click event listener for read more buttons
    blogCards.addEventListener('click', function(e) {
        if (e.target.classList.contains('read-more')) {
            const blogId = e.target.getAttribute('data-id');
            window.location.href = `blog-detail.html?id=${blogId}`;
        }
    });

    // Initial display of all blogs
    await displayBlogs();
});

// Modal functionality
document.addEventListener('DOMContentLoaded', function() {
    const signInBtn = document.getElementById('signInBtn');
    const authModal = document.getElementById('authModal');
    const modalClose = document.getElementById('modalClose');

    // Open modal
    signInBtn.addEventListener('click', function() {
        authModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Close modal
    modalClose.addEventListener('click', function() {
        authModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    // Close modal when clicking outside
    authModal.addEventListener('click', function(e) {
        if (e.target === authModal) {
            authModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && authModal.classList.contains('active')) {
            authModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
});
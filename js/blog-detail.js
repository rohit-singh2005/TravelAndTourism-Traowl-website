// Function to get query parameter from URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Function to handle blog detail page
async function loadBlogDetail() {
  const blogId = getQueryParam('id');
  
  if (!blogId) {
    showError('Blog ID not provided');
    return;
  }

  try {
    // Fetch blog details from API
    const response = await fetch(`/api/blog-details/${blogId}`);
    const blog = await response.json();
    
    if (!response.ok) {
      throw new Error(blog.error || 'Blog not found');
    }

    // Update page title
    document.title = `${blog.title} | Traowl`;
    
    // Render blog details
    renderBlogDetail(blog);
    
  } catch (error) {
    console.error('Error loading blog details:', error);
    showError('Failed to load blog details. Please try again later.');
  }
}

// Function to render blog detail
function renderBlogDetail(blog) {
  const blogDetailHero = document.getElementById('blogDetailHero');
  const blogDetailContent = document.getElementById('blogDetailContent');

  if (blogDetailHero) {
    // Encode image URL to handle spaces in filenames
    const encodedImageUrl = blog.image ? encodeURI(blog.image) : 'images/blog1.webp';
    
    blogDetailHero.innerHTML = `
      <div class="blog-detail-hero" style="background-image:url('${encodedImageUrl}')">
        <div class="blog-detail-hero-overlay"></div>
        <div class="blog-detail-hero-content">
          <h1>${blog.title}</h1>
          <div class="blog-meta">
            <span class="blog-date">${blog.date}</span>
            <span class="blog-author">By ${blog.author}</span>
            <span class="blog-read-time">${blog.readTime}</span>
          </div>
          <div class="blog-tags">
            ${blog.tags ? blog.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
          </div>
        </div>
      </div>
    `;
  }

  if (blogDetailContent) {
    blogDetailContent.innerHTML = `
      <div class="blog-detail-content">
        <div class="blog-content-text">
          ${blog.content.split('\n\n').map(paragraph => `<p>${paragraph}</p>`).join('')}
        </div>
        <div class="blog-sidebar">
          <div class="blog-info">
            <h3>Blog Information</h3>
            <p><strong>Category:</strong> ${blog.category}</p>
            <p><strong>Author:</strong> ${blog.author}</p>
            <p><strong>Read Time:</strong> ${blog.readTime}</p>
            <p><strong>Published:</strong> ${blog.date}</p>
          </div>
          <div class="related-blogs">
            <h3>Related Blogs</h3>
            <div id="relatedBlogsContainer">
              <p>Loading related blogs...</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Load related blogs
    loadRelatedBlogs(blog.category, blog.id);
  }
}

// Function to load related blogs
async function loadRelatedBlogs(category, currentBlogId) {
  try {
    const response = await fetch(`/api/blogs/category/${category}`);
    const data = await response.json();
    
    if (response.ok && data.blogs) {
      const relatedBlogs = data.blogs
        .filter(blog => blog.id !== currentBlogId)
        .slice(0, 3); // Show max 3 related blogs
      
      const container = document.getElementById('relatedBlogsContainer');
      if (container && relatedBlogs.length > 0) {
        container.innerHTML = relatedBlogs.map(blog => {
          // Encode image URL to handle spaces in filenames
          const encodedImageUrl = blog.image ? encodeURI(blog.image) : 'images/blog1.webp';
          
          return `
            <div class="related-blog-item">
              <img src="${encodedImageUrl}" alt="${blog.title}" class="related-blog-image">
              <div class="related-blog-info">
                <h4>${blog.title}</h4>
                <p class="blog-date">${blog.date}</p>
                <a href="blog-detail.html?id=${blog.id}" class="read-more">Read More</a>
              </div>
            </div>
          `;
        }).join('');
      } else if (container) {
        container.innerHTML = '<p>No related blogs found.</p>';
      }
    }
  } catch (error) {
    console.error('Error loading related blogs:', error);
    const container = document.getElementById('relatedBlogsContainer');
    if (container) {
      container.innerHTML = '<p>Unable to load related blogs.</p>';
    }
  }
}

// Function to show error message
function showError(message) {
  const blogDetailContent = document.getElementById('blogDetailContent');
  if (blogDetailContent) {
    blogDetailContent.innerHTML = `
      <div class="error-message">
        <h2>Error</h2>
        <p>${message}</p>
        <a href="blog.html" class="back-link">← Back to Blogs</a>
      </div>
    `;
  }
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', loadBlogDetail);
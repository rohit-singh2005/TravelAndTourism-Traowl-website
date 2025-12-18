class VisualAdminDashboard {
    constructor() {
        this.currentUser = null;
        this.currentPage = null;
        this.currentTripCategory = 'spiritual-tours';
        this.editMode = false;
        this.trips = [];
        this.editingTripId = null;
        this.init();
    }

    init() {
        this.checkAuth();
        this.loadDashboardStats();
        this.loadTrips();
        this.setupEventListeners();
    }

    checkAuth() {
        const token = localStorage.getItem('traowl_token');
        if (!token) {
            alert('Admin access required. Please login first.');
            window.location.href = '/login.html';
            return;
        }

        // Verify token
        fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Invalid authentication');
            }
            return response.json();
        })
        .then(data => {
            this.currentUser = data.user;
            document.getElementById('admin-user').textContent = data.user.firstName + ' ' + data.user.lastName;
        })
        .catch(error => {
            console.error('Auth error:', error);
            alert('Authentication failed. Please login again.');
            localStorage.removeItem('traowl_token');
            window.location.href = '/login.html';
        });
    }

    setupEventListeners() {
        // Trip category change
        document.getElementById('trip-category').addEventListener('change', () => {
            this.currentTripCategory = document.getElementById('trip-category').value;
            this.loadTrips();
        });

        // Listen for messages from visual editor
        window.addEventListener('message', (event) => {
            if (event.data.action === 'pageChanges') {
                this.handlePageChanges(event.data.changes, event.data.url);
            }
        });
    }

    async loadDashboardStats() {
        try {
            // Load trip counts from multiple categories
            const tripCategories = [
                'spiritual-tours.json',
                'domestic-trips.json',
                'international-trips.json',
                'family-trips.json',
                'romantic-trips.json',
                'corporate-trips.json',
                'weekend-trips.json',
                'upcoming-trips.json'
            ];

            let totalTrips = 0;
            
            for (const category of tripCategories) {
                try {
                    const response = await fetch(`/data/${category}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (category === 'spiritual-tours.json') {
                            totalTrips += data.spiritualTours?.length || 0;
                        } else {
                            totalTrips += data.trips?.length || 0;
                        }
                    }
                } catch (err) {
                    console.warn(`Could not load ${category}:`, err);
                }
            }
            
            document.getElementById('total-trips').textContent = totalTrips;

            // Try to load bookings count (may not exist yet)
            try {
                const bookingsResponse = await fetch('/api/admin/stats', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('traowl_token')}`
                    }
                });
                
                if (bookingsResponse.ok) {
                    const statsData = await bookingsResponse.json();
                    document.getElementById('total-bookings').textContent = statsData.stats?.bookings || 0;
                } else {
                    document.getElementById('total-bookings').textContent = '0';
                }
            } catch (err) {
                console.warn('Could not load booking stats:', err);
                document.getElementById('total-bookings').textContent = '0';
            }

        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            // Set default values on error
            document.getElementById('total-trips').textContent = '0';
            document.getElementById('total-bookings').textContent = '0';
        }
    }

    async loadPagePreview() {
        const selectedPage = document.getElementById('page-selector').value;
        if (!selectedPage) return;

        this.currentPage = selectedPage;
        const previewContainer = document.getElementById('page-preview');
        
        try {
            // Create preview with admin injection
            previewContainer.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4>Preview: ${selectedPage}</h4>
                    <div>
                        <button class="btn btn-primary btn-sm" onclick="admin.openPageInEditMode('${selectedPage}')">
                            <i class="fas fa-edit me-1"></i>Edit Page
                        </button>
                        <button class="btn btn-info btn-sm" onclick="admin.openPageInNewTab('${selectedPage}')">
                            <i class="fas fa-external-link-alt me-1"></i>Open in New Tab
                        </button>
                        <button class="btn btn-success btn-sm" onclick="admin.savePageChanges()">
                            <i class="fas fa-save me-1"></i>Save Changes
                        </button>
                    </div>
                </div>
                <div style="border: 2px solid #ddd; border-radius: 8px; overflow: hidden;">
                    <iframe id="page-iframe" src="/${selectedPage}?admin=true" style="width: 100%; height: 600px; border: none;"></iframe>
                </div>
                <div class="mt-3">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        <strong>Visual Editing:</strong> Click "Edit Page" to open the page in a new tab with visual editing enabled. 
                        You can click on any text, image, or link to edit it directly.
                    </div>
                </div>
            `;

            // Load content editor
            this.loadContentEditor(selectedPage);

        } catch (error) {
            console.error('Error loading page preview:', error);
            previewContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error loading page preview: ${error.message}
                </div>
            `;
        }
    }

    openPageInEditMode(page) {
        const editUrl = `/${page}?admin=true&edit=true`;
        window.open(editUrl, '_blank');
    }

    openPageInNewTab(page) {
        window.open(`/${page}`, '_blank');
    }

    async loadContentEditor(page) {
        const contentEditor = document.getElementById('content-editor');
        
        // Map pages to their content files
        const contentMapping = {
            'index.html': ['header.json', 'homepage-activities.json', 'homepage-hot-locations.json'],
            'spiritual-tours.html': ['spiritual-tours.json'],
            'domestic-trips.html': ['domestic-trips.json'],
            'international-trips.html': ['international-trips.json'],
            'family-trips.html': ['family-trips.json'],
            'romantic-trips.html': ['romantic-trips.json'],
            'corporate-trips.html': ['corporate-trips.json'],
            'weekend-trips.html': ['weekend-trips.json'],
            'activities.html': ['activities.json'],
            'about.html': ['about-us.json'],
            'contact.html': ['footer.json']
        };

        const contentFiles = contentMapping[page] || [];
        
        if (contentFiles.length === 0) {
            contentEditor.innerHTML = '<p class="text-muted">No editable content found for this page.</p>';
            return;
        }

        let editorHTML = '<div class="content-sections">';
        
        for (const file of contentFiles) {
            try {
                const response = await fetch(`/data/${file}`);
                const data = await response.json();
                
                editorHTML += `
                    <div class="content-section mb-4">
                        <h5>${file.replace('.json', '').replace(/-/g, ' ').toUpperCase()}</h5>
                        <div class="content-fields" data-file="${file}">
                `;
                
                // Create editable fields based on content type
                if (file === 'header.json' && data.header) {
                    editorHTML += this.createHeaderEditor(data.header);
                } else if (file.includes('trips') || file.includes('tours')) {
                    editorHTML += '<p class="text-info">Use the Trips tab to manage trip content.</p>';
                } else {
                    editorHTML += this.createGenericEditor(data);
                }
                
                editorHTML += '</div></div>';
                
            } catch (error) {
                console.error(`Error loading ${file}:`, error);
                editorHTML += `<div class="alert alert-warning">Error loading ${file}</div>`;
            }
        }
        
        editorHTML += '</div>';
        contentEditor.innerHTML = editorHTML;
    }

    createHeaderEditor(header) {
        return `
            <div class="form-group">
                <label>Logo Text</label>
                <input type="text" class="form-control" value="${header.logo || 'Traowl'}" 
                       onchange="admin.updateContent('header.json', 'logo', this.value)">
            </div>
            <div class="form-group">
                <label>Navigation Items</label>
                <div id="nav-items">
                    ${header.navigation?.map((item, index) => `
                        <div class="input-group mb-2">
                            <input type="text" class="form-control" value="${item.text}" 
                                   onchange="admin.updateNavItem(${index}, 'text', this.value)">
                            <input type="text" class="form-control" value="${item.href}" 
                                   onchange="admin.updateNavItem(${index}, 'href', this.value)">
                            <button class="btn btn-danger" onclick="admin.removeNavItem(${index})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `).join('') || ''}
                </div>
                <button class="btn btn-success btn-sm" onclick="admin.addNavItem()">
                    <i class="fas fa-plus me-1"></i>Add Navigation Item
                </button>
            </div>
        `;
    }

    createGenericEditor(data) {
        let html = '';
        
        const traverse = (obj, path = '') => {
            for (const [key, value] of Object.entries(obj)) {
                const currentPath = path ? `${path}.${key}` : key;
                
                if (typeof value === 'string') {
                    html += `
                        <div class="form-group">
                            <label>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                            ${value.length > 100 ? 
                                `<textarea class="form-control" rows="3" onchange="admin.updateGenericContent('${currentPath}', this.value)">${value}</textarea>` :
                                `<input type="text" class="form-control" value="${value}" onchange="admin.updateGenericContent('${currentPath}', this.value)">`
                            }
                        </div>
                    `;
                } else if (typeof value === 'object' && !Array.isArray(value)) {
                    html += `<h6>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h6>`;
                    traverse(value, currentPath);
                }
            }
        };
        
        traverse(data);
        return html;
    }

    async loadTrips() {
        const category = this.currentTripCategory;
        const tripsList = document.getElementById('trips-list');
        
        try {
            const response = await fetch(`/data/${category}.json`);
            const data = await response.json();
            
            // Get the trips array based on category
            let trips = [];
            if (category === 'spiritual-tours') {
                trips = data.spiritualTours || [];
            } else {
                trips = data.trips || [];
            }
            
            this.trips = trips;
            
            if (trips.length === 0) {
                tripsList.innerHTML = '<p class="text-muted">No trips found in this category.</p>';
                return;
            }
            
            let html = '<div class="trip-grid">';
            trips.forEach((trip, index) => {
                html += `
                    <div class="trip-item" data-trip-id="${trip.id || index}">
                        <img src="${trip.image || 'images/default-trip.jpg'}" alt="${trip.title}" class="trip-image" 
                             onerror="this.src='images/default-trip.jpg'">
                        <div class="trip-content">
                            <div class="trip-title">${trip.title}</div>
                            <div class="trip-price">₹${trip.price?.toLocaleString() || '0'}</div>
                            <div class="text-muted small">${trip.duration || 'Duration not specified'}</div>
                            <div class="text-muted small">${trip.destination || 'Destination not specified'}</div>
                        </div>
                        <div class="trip-actions">
                            <button class="btn-admin btn-edit" onclick="admin.editTrip(${trip.id || index})" title="Edit Trip">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-admin btn-delete" onclick="admin.deleteTrip(${trip.id || index})" title="Delete Trip">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            
            tripsList.innerHTML = html;
            
        } catch (error) {
            console.error('Error loading trips:', error);
            tripsList.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error loading trips: ${error.message}
                </div>
            `;
        }
    }

    showAddTripModal() {
        this.editingTripId = null;
        document.getElementById('tripModalTitle').textContent = 'Add New Trip';
        document.getElementById('tripForm').reset();
        document.getElementById('trip-image-preview').style.display = 'none';
        
        const modal = new bootstrap.Modal(document.getElementById('tripModal'));
        modal.show();
    }

    editTrip(tripId) {
        const trip = this.trips.find(t => (t.id || this.trips.indexOf(t)) == tripId);
        if (!trip) return;
        
        this.editingTripId = tripId;
        document.getElementById('tripModalTitle').textContent = 'Edit Trip';
        
        // Fill form with trip data
        document.getElementById('trip-title').value = trip.title || '';
        document.getElementById('trip-duration').value = trip.duration || '';
        document.getElementById('trip-price').value = trip.price || '';
        document.getElementById('trip-old-price').value = trip.oldPrice || '';
        document.getElementById('trip-destination').value = trip.destination || '';
        document.getElementById('trip-description').value = trip.description || '';
        document.getElementById('trip-join-dates').value = trip.joinDates?.join(', ') || '';
        document.getElementById('trip-difficulty').value = trip.difficulty || 'Easy';
        document.getElementById('trip-best-time').value = trip.bestTime || '';
        document.getElementById('trip-highlights').value = trip.highlights?.join('\n') || '';
        
        if (trip.image) {
            const preview = document.getElementById('trip-image-preview');
            preview.src = trip.image;
            preview.style.display = 'block';
        }
        
        const modal = new bootstrap.Modal(document.getElementById('tripModal'));
        modal.show();
    }

    async saveTrip() {
        const form = document.getElementById('tripForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const tripData = {
            title: document.getElementById('trip-title').value,
            duration: document.getElementById('trip-duration').value,
            price: parseInt(document.getElementById('trip-price').value),
            oldPrice: document.getElementById('trip-old-price').value ? parseInt(document.getElementById('trip-old-price').value) : null,
            destination: document.getElementById('trip-destination').value,
            description: document.getElementById('trip-description').value,
            joinDates: document.getElementById('trip-join-dates').value.split(',').map(d => d.trim()).filter(d => d),
            difficulty: document.getElementById('trip-difficulty').value,
            bestTime: document.getElementById('trip-best-time').value,
            highlights: document.getElementById('trip-highlights').value.split('\n').filter(h => h.trim()),
            currency: '₹'
        };
        
        // Handle image upload
        const imageInput = document.getElementById('trip-image-input');
        if (imageInput.files[0]) {
            try {
                const uploadedImageUrl = await this.uploadImage(imageInput.files[0]);
                tripData.image = uploadedImageUrl;
            } catch (error) {
                console.error('Error uploading image:', error);
                alert('Error uploading image. Trip will be saved without image.');
            }
        } else if (this.editingTripId !== null) {
            // Keep existing image if editing
            const existingTrip = this.trips.find(t => (t.id || this.trips.indexOf(t)) == this.editingTripId);
            if (existingTrip) {
                tripData.image = existingTrip.image;
            }
        }
        
        try {
            let updatedTrips;
            
            if (this.editingTripId !== null) {
                // Edit existing trip
                const tripIndex = this.trips.findIndex(t => (t.id || this.trips.indexOf(t)) == this.editingTripId);
                if (tripIndex !== -1) {
                    tripData.id = this.trips[tripIndex].id || this.editingTripId;
                    this.trips[tripIndex] = tripData;
                }
                updatedTrips = this.trips;
            } else {
                // Add new trip
                tripData.id = Date.now(); // Simple ID generation
                this.trips.push(tripData);
                updatedTrips = this.trips;
            }
            
            // Save to server
            const dataToSave = {};
            if (this.currentTripCategory === 'spiritual-tours') {
                dataToSave.spiritualTours = updatedTrips;
            } else {
                dataToSave.trips = updatedTrips;
            }
            
            const response = await fetch(`/api/admin/content/${this.currentTripCategory}.json`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('traowl_token')}`
                },
                body: JSON.stringify({ content: dataToSave })
            });
            
            if (response.ok) {
                this.showSaveIndicator();
                bootstrap.Modal.getInstance(document.getElementById('tripModal')).hide();
                this.loadTrips();
            } else {
                throw new Error('Failed to save trip');
            }
            
        } catch (error) {
            console.error('Error saving trip:', error);
            alert('Error saving trip. Please try again.');
        }
    }

    async deleteTrip(tripId) {
        if (!confirm('Are you sure you want to delete this trip?')) return;
        
        try {
            const tripIndex = this.trips.findIndex(t => (t.id || this.trips.indexOf(t)) == tripId);
            if (tripIndex === -1) return;
            
            this.trips.splice(tripIndex, 1);
            
            const dataToSave = {};
            if (this.currentTripCategory === 'spiritual-tours') {
                dataToSave.spiritualTours = this.trips;
            } else {
                dataToSave.trips = this.trips;
            }
            
            const response = await fetch(`/api/admin/content/${this.currentTripCategory}.json`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('traowl_token')}`
                },
                body: JSON.stringify({ content: dataToSave })
            });
            
            if (response.ok) {
                this.showSaveIndicator();
                this.loadTrips();
            } else {
                throw new Error('Failed to delete trip');
            }
            
        } catch (error) {
            console.error('Error deleting trip:', error);
            alert('Error deleting trip. Please try again.');
        }
    }

    enableEditMode() {
        this.editMode = true;
        document.body.classList.add('admin-mode');
        
        // Add edit overlays to content elements
        const iframe = document.getElementById('page-iframe');
        if (iframe) {
            iframe.contentWindow.postMessage({ action: 'enableEditMode' }, '*');
        }
    }

    async handlePageChanges(changes, url) {
        console.log('Received page changes:', changes, 'for URL:', url);
        
        try {
            // Map URL to content file
            const contentFile = this.getContentFileForUrl(url);
            if (!contentFile) {
                console.warn('No content file mapped for URL:', url);
                return;
            }

            // Save changes to backend
            const response = await fetch('/api/admin/save-visual-changes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('traowl_token')}`
                },
                body: JSON.stringify({
                    file: contentFile,
                    changes: changes,
                    url: url
                })
            });

            if (response.ok) {
                this.showNotification('Changes saved successfully!', 'success');
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save changes');
            }
        } catch (error) {
            console.error('Error saving page changes:', error);
            this.showNotification('Error saving changes: ' + error.message, 'error');
        }
    }

    getContentFileForUrl(url) {
        // Map URLs to their corresponding data files
        const urlMapping = {
            '/about.html': 'about-us.json',
            '/index.html': 'header.json', // Could be multiple files
            '/home.html': 'header.json',
            '/spiritual-tours.html': 'spiritual-tours.json',
            '/domestic-trips.html': 'domestic-trips.json',
            '/international-trips.html': 'international-trips.json',
            '/family-trips.html': 'family-trips.json',
            '/romantic-trips.html': 'romantic-trips.json',
            '/corporate-trips.html': 'corporate-trips.json',
            '/weekend-trips.html': 'weekend-trips.json',
            '/activities.html': 'activities.json'
        };

        return urlMapping[url] || null;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} alert-dismissible fade show`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    async savePageChanges() {
        // Send message to iframe to trigger save
        const iframe = document.getElementById('page-iframe');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ action: 'saveChanges' }, '*');
        } else {
            this.showNotification('No page loaded for saving changes', 'warning');
        }
    }

    async saveSettings() {
        const settings = {
            siteTitle: document.getElementById('site-title').value,
            contactEmail: document.getElementById('contact-email').value,
            contactPhone: document.getElementById('contact-phone').value
        };
        
        try {
            // Save settings (implement API endpoint)
            this.showSaveIndicator();
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error saving settings. Please try again.');
        }
    }

    showSaveIndicator() {
        const indicator = document.getElementById('saveIndicator');
        indicator.style.display = 'block';
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 2000);
    }

    updateContent(file, key, value) {
        // Implementation for updating content
        console.log(`Updating ${file} - ${key}: ${value}`);
    }

    updateNavItem(index, property, value) {
        // Implementation for updating navigation items
        console.log(`Updating nav item ${index} - ${property}: ${value}`);
    }

    addNavItem() {
        // Implementation for adding navigation items
        console.log('Adding new navigation item');
    }

    removeNavItem(index) {
        // Implementation for removing navigation items
        console.log(`Removing nav item ${index}`);
    }

    updateGenericContent(path, value) {
        // Implementation for updating generic content
        console.log(`Updating ${path}: ${value}`);
    }

    async uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch('/api/admin/upload-image', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('traowl_token')}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to upload image');
        }
        
        const result = await response.json();
        return result.imageUrl;
    }
}

// Global functions
function toggleAdminPanel() {
    const panel = document.getElementById('adminPanel');
    panel.classList.toggle('active');
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.admin-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

function previewImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('trip-image-preview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function logout() {
    localStorage.removeItem('traowl_token');
    window.location.href = '/login.html';
}

// Initialize admin dashboard
const admin = new VisualAdminDashboard();
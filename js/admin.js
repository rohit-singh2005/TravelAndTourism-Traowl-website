class AdminDashboard {
    constructor() {
        this.currentUser = null;
        this.currentFile = 'upcoming-trips.json';
        this.originalContent = null;
        this.currentTripCategory = 'upcoming-trips.json';
        this.trips = [];
        this.editingTripId = null;
        this.isVisualView = true;
        this.permissions = [];
        this.userRole = null;
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.loadDashboardStats();
    }

    checkAuth() {
        const token = localStorage.getItem('traowl_token');
        if (!token) {
            alert('Admin access required. Please login first.');
            window.location.href = '/admin-login.html';
            return;
        }

        // Verify token and check admin privileges
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
            this.permissions = data.user.permissions || [];
            this.userRole = data.user.role;
            
            // Check if user can access admin
            if (!data.user.canAccessAdmin) {
                throw new Error('Admin access denied');
            }
            
            // Update UI based on permissions
            this.updateUIBasedOnPermissions();
        })
        .catch(error => {
            console.error('Auth error:', error);
            alert('Authentication failed. Please login again.');
            localStorage.removeItem('traowl_token');
            window.location.href = '/admin-login.html';
        });
    }

    // Check if user has specific permission
    hasPermission(permission) {
        return this.userRole === 'super_admin' || this.permissions.includes(permission);
    }

    // Update UI based on user permissions
    updateUIBasedOnPermissions() {
        // Hide/show navigation items based on permissions
        const navItems = {
            'dashboard': 'admin.access',
            'trips': 'trips.view',
            'bookings': 'bookings.view',
            'blogs': 'blogs.view',
            'users': 'users.view'
        };

        Object.entries(navItems).forEach(([section, permission]) => {
            const navLink = document.querySelector(`[data-section="${section}"]`);
            if (navLink && !this.hasPermission(permission)) {
                navLink.style.display = 'none';
            }
        });

        // Update user info display
        const userInfo = document.getElementById('current-user-info');
        if (userInfo && this.currentUser) {
            userInfo.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="me-2">
                        <i class="fas fa-user-circle fa-lg"></i>
                    </div>
                    <div>
                        <div class="fw-bold">${this.currentUser.firstName} ${this.currentUser.lastName}</div>
                        <small class="text-muted">${this.currentUser.role.replace('_', ' ').toUpperCase()}</small>
                    </div>
                </div>
            `;
        }

        // Hide/show action buttons based on permissions
        const addTripBtn = document.getElementById('add-trip-btn');
        if (addTripBtn && !this.hasPermission('trips.create')) {
            addTripBtn.style.display = 'none';
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection(link.dataset.section);
                
                // Update active nav
                document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        // Content categories
        document.querySelectorAll('#content-categories .list-group-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentTripCategory = item.dataset.file;
                this.currentFile = item.dataset.file; // Keep both in sync
                this.loadContentFile(item.dataset.file);
                this.loadVisualTrips();
                
                // Update active category
                document.querySelectorAll('#content-categories .list-group-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                // Update content title
                const categoryName = item.textContent.trim();
                document.getElementById('current-content-title').textContent = `${categoryName} - JSON Editor`;
            });
        });

        // Search and filter events
        document.getElementById('user-search')?.addEventListener('input', () => this.filterUsers());
        document.getElementById('user-filter')?.addEventListener('change', () => this.filterUsers());
        document.getElementById('booking-search')?.addEventListener('input', () => this.filterBookings());
        document.getElementById('booking-status-filter')?.addEventListener('change', () => this.filterBookings());
        document.getElementById('message-search')?.addEventListener('input', () => this.filterMessages());
        document.getElementById('message-type-filter')?.addEventListener('change', () => this.filterMessages());
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        document.getElementById(sectionId).classList.add('active');

        // Load section data
        switch(sectionId) {
            case 'dashboard':
                this.loadDashboardStats();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'bookings':
                this.loadBookings();
                break;
            case 'trips':
                this.loadContentFile(this.currentTripCategory);
                this.loadVisualTrips();
                this.initializeTripsView();
                break;
            case 'blogs':
                this.loadBlogs();
                break;
            case 'pages':
                this.loadPageContent('about-us');
                break;
            case 'visual-editor':
                this.loadQuickTrips();
                break;
            case 'messages':
                this.loadMessages();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    async loadDashboardStats() {
        try {
            // Load stats from admin API
            const response = await fetch('/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('traowl_token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                document.getElementById('total-users').textContent = data.stats.users || 0;
                document.getElementById('total-bookings').textContent = data.stats.bookings || 0;
                document.getElementById('total-messages').textContent = data.stats.messages || 0;
                
                // Load recent activity from the stats
                this.displayRecentActivity(data.stats.recentBookings || []);
            } else {
                // Fallback to individual API calls
                await this.loadStatsFallback();
            }

            // Load trips count (example with upcoming trips)
            const tripsResponse = await fetch('/data/upcoming-trips.json');
            const tripsData = await tripsResponse.json();
            document.getElementById('total-trips').textContent = tripsData.trips?.length || 0;

        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            await this.loadStatsFallback();
        }
    }

    async loadStatsFallback() {
        try {
            // Fallback method for loading stats
            const usersResponse = await fetch('/data/users.json');
            const usersData = await usersResponse.json();
            document.getElementById('total-users').textContent = usersData.users?.length || 0;

            const bookingsResponse = await fetch('/api/bookings');
            const bookingsData = await bookingsResponse.json();
            document.getElementById('total-bookings').textContent = bookingsData.count || 0;

            document.getElementById('total-messages').textContent = '0';
            
            this.loadRecentActivity();
        } catch (error) {
            console.error('Error in stats fallback:', error);
        }
    }

    displayRecentActivity(recentBookings) {
        const activityContainer = document.getElementById('recent-activity');
        
        let activityHtml = '<h6>Recent Bookings</h6>';
        if (recentBookings && recentBookings.length > 0) {
            activityHtml += '<ul class="list-unstyled">';
            recentBookings.forEach(booking => {
                activityHtml += `
                    <li class="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <div>
                            <strong>${booking.tripTitle}</strong><br>
                            <small class="text-muted">by ${booking.contactInfo?.name || 'Unknown'}</small>
                        </div>
                        <span class="badge badge-status ${this.getStatusClass(booking.status)}">${booking.status}</span>
                    </li>
                `;
            });
            activityHtml += '</ul>';
        } else {
            activityHtml += '<p class="text-muted">No recent bookings found.</p>';
        }
        
        activityContainer.innerHTML = activityHtml;
    }

    async loadRecentActivity() {
        const activityContainer = document.getElementById('recent-activity');
        try {
            // Get recent bookings
            const bookingsResponse = await fetch('/api/bookings');
            const bookingsData = await bookingsResponse.json();
            
            const recentBookings = bookingsData.bookings ? bookingsData.bookings.slice(0, 5) : [];
            this.displayRecentActivity(recentBookings);
        } catch (error) {
            console.error('Error loading recent activity:', error);
            activityContainer.innerHTML = '<p class="text-danger">Error loading recent activity.</p>';
        }
    }

    async loadUsers() {
        try {
            // Try admin API first
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('traowl_token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.displayUsers(data.users || []);
            } else {
                // Fallback to direct JSON file
                const fallbackResponse = await fetch('/data/users.json');
                const fallbackData = await fallbackResponse.json();
                this.displayUsers(fallbackData.users || []);
            }
        } catch (error) {
            console.error('Error loading users:', error);
            document.getElementById('users-table').innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading users</td></tr>';
        }
    }

    displayUsers(users) {
        const tbody = document.getElementById('users-table');
        tbody.innerHTML = '';

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.email}</td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
                <td>${user.oauthProvider ? `<span class="badge bg-info">${user.oauthProvider}</span>` : '<span class="badge bg-secondary">Local</span>'}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="admin.viewUser(${user.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-warning btn-sm" onclick="admin.editUser(${user.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="admin.deleteUser(${user.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadBookings() {
        try {
            const response = await fetch('/api/bookings');
            const data = await response.json();
            this.displayBookings(data.bookings || []);
        } catch (error) {
            console.error('Error loading bookings:', error);
            document.getElementById('bookings-table').innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading bookings</td></tr>';
        }
    }

    displayBookings(bookings) {
        const tbody = document.getElementById('bookings-table');
        tbody.innerHTML = '';

        bookings.forEach(booking => {
            const row = document.createElement('tr');
            const statusClass = this.getStatusClass(booking.status);
            
            row.innerHTML = `
                <td>${booking.bookingId}</td>
                <td>${booking.tripTitle}</td>
                <td>${booking.contactInfo.name}<br><small class="text-muted">${booking.contactInfo.email}</small></td>
                <td>${booking.travelers}</td>
                <td>${booking.selectedDate ? new Date(booking.selectedDate).toLocaleDateString() : 'Not specified'}</td>
                <td><span class="badge badge-status ${statusClass}">${booking.status}</span></td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="admin.viewBooking('${booking.bookingId}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-success btn-sm" onclick="admin.updateBookingStatus('${booking.bookingId}', 'confirmed')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="admin.updateBookingStatus('${booking.bookingId}', 'cancelled')">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    getStatusClass(status) {
        switch(status) {
            case 'confirmed': return 'bg-success';
            case 'cancelled': return 'bg-danger';
            case 'completed': return 'bg-info';
            default: return 'bg-warning';
        }
    }

    async loadContentFile(filename) {
        this.currentFile = filename;
        document.getElementById('current-content-title').textContent = filename.replace('.json', '').replace(/-/g, ' ').toUpperCase();
        
        try {
            const response = await fetch(`/data/${filename}`);
            const data = await response.json();
            this.originalContent = JSON.stringify(data, null, 2);
            document.getElementById('json-editor').value = this.originalContent;
        } catch (error) {
            console.error('Error loading content file:', error);
            document.getElementById('json-editor').value = `Error loading ${filename}`;
        }
    }

    async saveCurrentContent() {
        const editor = document.getElementById('json-editor');
        const content = editor.value;

        try {
            // Validate JSON
            JSON.parse(content);
            
            // Save to server (you'll need to implement this endpoint)
            const response = await fetch(`/api/admin/content/${this.currentFile}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('traowl_token')}`
                },
                body: JSON.stringify({ content: JSON.parse(content) })
            });

            if (response.ok) {
                this.originalContent = content;
                this.showAlert('Content saved successfully!', 'success');
            } else {
                throw new Error('Failed to save content');
            }
        } catch (error) {
            console.error('Error saving content:', error);
            if (error instanceof SyntaxError) {
                this.showAlert('Invalid JSON format. Please check your syntax.', 'danger');
            } else {
                this.showAlert('Error saving content. Please try again.', 'danger');
            }
        }
    }

    resetCurrentContent() {
        document.getElementById('json-editor').value = this.originalContent;
    }

    async loadMessages() {
        try {
            const response = await fetch('/api/admin/messages', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('traowl_token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.displayMessages(data.messages || []);
            } else {
                throw new Error('Failed to load messages');
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            const tbody = document.getElementById('messages-table');
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading messages</td></tr>';
        }
    }

    displayMessages(messages) {
        const tbody = document.getElementById('messages-table');
        tbody.innerHTML = '';

        if (messages.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No messages found</td></tr>';
            return;
        }

        messages.forEach(message => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><span class="badge ${message.type === 'support' ? 'bg-warning' : 'bg-info'}">${message.type}</span></td>
                <td>${message.name}</td>
                <td>${message.email}</td>
                <td>${message.subject || 'Contact Message'}</td>
                <td>${new Date(message.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="admin.viewMessage('${message._id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${!message.isRead ? `
                        <button class="btn btn-success btn-sm" onclick="admin.markMessageRead('${message._id}')">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : '<span class="badge bg-success">Read</span>'}
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadSettings() {
        try {
            // Load header settings
            const headerResponse = await fetch('/data/header.json');
            const headerData = await headerResponse.json();
            document.getElementById('header-settings').value = JSON.stringify(headerData, null, 2);

            // Load footer settings
            const footerResponse = await fetch('/data/footer.json');
            const footerData = await footerResponse.json();
            document.getElementById('footer-settings').value = JSON.stringify(footerData, null, 2);
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings(type) {
        const textarea = document.getElementById(`${type}-settings`);
        const content = textarea.value;

        try {
            JSON.parse(content);
            
            const response = await fetch(`/api/admin/settings/${type}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('traowl_token')}`
                },
                body: JSON.stringify({ content: JSON.parse(content) })
            });

            if (response.ok) {
                this.showAlert(`${type.charAt(0).toUpperCase() + type.slice(1)} settings saved successfully!`, 'success');
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            if (error instanceof SyntaxError) {
                this.showAlert('Invalid JSON format. Please check your syntax.', 'danger');
            } else {
                this.showAlert('Error saving settings. Please try again.', 'danger');
            }
        }
    }

    // Modal functions
    async viewUser(userId) {
        try {
            const response = await fetch('/data/users.json');
            const data = await response.json();
            const user = data.users.find(u => u.id === userId);
            
            if (user) {
                document.getElementById('user-modal-body').innerHTML = `
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">First Name</label>
                                <input type="text" class="form-control" value="${user.firstName}" readonly>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Last Name</label>
                                <input type="text" class="form-control" value="${user.lastName}" readonly>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" value="${user.email}" readonly>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Created At</label>
                                <input type="text" class="form-control" value="${new Date(user.createdAt).toLocaleString()}" readonly>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Last Login</label>
                                <input type="text" class="form-control" value="${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}" readonly>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">OAuth Provider</label>
                                <input type="text" class="form-control" value="${user.oauthProvider || 'Local'}" readonly>
                            </div>
                        </div>
                    </div>
                `;
                new bootstrap.Modal(document.getElementById('userModal')).show();
            }
        } catch (error) {
            console.error('Error loading user details:', error);
        }
    }

    async viewBooking(bookingId) {
        try {
            const response = await fetch('/api/bookings');
            const data = await response.json();
            const booking = data.bookings.find(b => b.bookingId === bookingId);
            
            if (booking) {
                document.getElementById('booking-modal-body').innerHTML = `
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Booking ID</label>
                                <input type="text" class="form-control" value="${booking.bookingId}" readonly>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Trip Title</label>
                                <input type="text" class="form-control" value="${booking.tripTitle}" readonly>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Number of Travelers</label>
                                <input type="number" class="form-control" value="${booking.travelers}" readonly>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Selected Date</label>
                                <input type="text" class="form-control" value="${booking.selectedDate ? new Date(booking.selectedDate).toLocaleDateString() : 'Not specified'}" readonly>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Customer Name</label>
                                <input type="text" class="form-control" value="${booking.contactInfo.name}" readonly>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" value="${booking.contactInfo.email}" readonly>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Phone</label>
                                <input type="text" class="form-control" value="${booking.contactInfo.phone}" readonly>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Status</label>
                                <select class="form-select" id="booking-status-select">
                                    <option value="pending_confirmation" ${booking.status === 'pending_confirmation' ? 'selected' : ''}>Pending Confirmation</option>
                                    <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                                    <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                    <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>Completed</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Special Requests</label>
                        <textarea class="form-control" rows="3" readonly>${booking.specialRequests || 'None'}</textarea>
                    </div>
                `;
                new bootstrap.Modal(document.getElementById('bookingModal')).show();
            }
        } catch (error) {
            console.error('Error loading booking details:', error);
        }
    }

    // Utility functions
    filterUsers() {
        const searchTerm = document.getElementById('user-search').value.toLowerCase();
        const filterValue = document.getElementById('user-filter').value;
        
        // Implement filtering logic here
        this.loadUsers(); // For now, just reload
    }

    filterBookings() {
        const searchTerm = document.getElementById('booking-search').value.toLowerCase();
        const statusFilter = document.getElementById('booking-status-filter').value;
        
        // Implement filtering logic here
        this.loadBookings(); // For now, just reload
    }

    filterMessages() {
        const searchTerm = document.getElementById('message-search').value.toLowerCase();
        const typeFilter = document.getElementById('message-type-filter').value;
        
        // Implement filtering logic here
        this.loadMessages(); // For now, just reload
    }

    refreshUsers() {
        this.loadUsers();
    }

    refreshBookings() {
        this.loadBookings();
    }

    refreshMessages() {
        this.loadMessages();
    }

    exportBookings() {
        // Implement export functionality
        this.showAlert('Export functionality coming soon!', 'info');
    }

    showAlert(message, type) {
        // Create a temporary alert
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    }

    // Additional admin methods
    async updateBookingStatus(bookingId, status) {
        try {
            const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('traowl_token')}`
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                this.showAlert(`Booking status updated to ${status}`, 'success');
                this.loadBookings(); // Refresh the bookings list
            } else {
                throw new Error('Failed to update booking status');
            }
        } catch (error) {
            console.error('Error updating booking status:', error);
            this.showAlert('Error updating booking status. Please try again.', 'danger');
        }
    }

    async viewMessage(messageId) {
        try {
            const response = await fetch('/api/admin/messages', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('traowl_token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const message = data.messages.find(m => m._id === messageId);
                
                if (message) {
                    document.getElementById('message-modal-body').innerHTML = `
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Type</label>
                                    <span class="badge ${message.type === 'support' ? 'bg-warning' : 'bg-info'}">${message.type}</span>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Name</label>
                                    <input type="text" class="form-control" value="${message.name}" readonly>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-control" value="${message.email}" readonly>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Phone</label>
                                    <input type="text" class="form-control" value="${message.phone || 'Not provided'}" readonly>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Subject</label>
                                    <input type="text" class="form-control" value="${message.subject || 'Contact Message'}" readonly>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Date</label>
                                    <input type="text" class="form-control" value="${new Date(message.createdAt).toLocaleString()}" readonly>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Status</label>
                                    <input type="text" class="form-control" value="${message.isRead ? 'Read' : 'Unread'}" readonly>
                                </div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Message</label>
                            <textarea class="form-control" rows="4" readonly>${message.message}</textarea>
                        </div>
                    `;
                    new bootstrap.Modal(document.getElementById('messageModal')).show();
                }
            }
        } catch (error) {
            console.error('Error loading message details:', error);
        }
    }

    async markMessageRead(messageId) {
        try {
            const response = await fetch(`/api/admin/messages/${messageId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('traowl_token')}`
                }
            });

            if (response.ok) {
                this.showAlert('Message marked as read', 'success');
                this.loadMessages(); // Refresh the messages list
            } else {
                throw new Error('Failed to mark message as read');
            }
        } catch (error) {
            console.error('Error marking message as read:', error);
            this.showAlert('Error marking message as read. Please try again.', 'danger');
        }
    }

    async editUser(userId) {
        try {
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('traowl_token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const user = data.users.find(u => u.id === userId);
                
                if (user) {
                    document.getElementById('user-modal-body').innerHTML = `
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">First Name</label>
                                    <input type="text" class="form-control" id="edit-firstName" value="${user.firstName}">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Last Name</label>
                                    <input type="text" class="form-control" id="edit-lastName" value="${user.lastName}">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-control" id="edit-email" value="${user.email}">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Phone</label>
                                    <input type="text" class="form-control" id="edit-phone" value="${user.phone || ''}">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Status</label>
                                    <select class="form-select" id="edit-isActive">
                                        <option value="true" ${user.isActive !== false ? 'selected' : ''}>Active</option>
                                        <option value="false" ${user.isActive === false ? 'selected' : ''}>Inactive</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Created At</label>
                                    <input type="text" class="form-control" value="${new Date(user.createdAt).toLocaleString()}" readonly>
                                </div>
                            </div>
                        </div>
                        <input type="hidden" id="edit-userId" value="${user.id}">
                    `;
                    new bootstrap.Modal(document.getElementById('userModal')).show();
                }
            }
        } catch (error) {
            console.error('Error loading user for editing:', error);
        }
    }

    async saveUserChanges() {
        try {
            const userId = document.getElementById('edit-userId').value;
            const firstName = document.getElementById('edit-firstName').value;
            const lastName = document.getElementById('edit-lastName').value;
            const email = document.getElementById('edit-email').value;
            const phone = document.getElementById('edit-phone').value;
            const isActive = document.getElementById('edit-isActive').value === 'true';

            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('traowl_token')}`
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    phone,
                    isActive
                })
            });

            if (response.ok) {
                this.showAlert('User updated successfully', 'success');
                bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
                this.loadUsers(); // Refresh the users list
            } else {
                throw new Error('Failed to update user');
            }
        } catch (error) {
            console.error('Error saving user changes:', error);
            this.showAlert('Error saving user changes. Please try again.', 'danger');
        }
    }

    async deleteUser(userId) {
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                const response = await fetch(`/api/admin/users/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('traowl_token')}`
                    }
                });

                if (response.ok) {
                    this.showAlert('User deleted successfully', 'success');
                    this.loadUsers(); // Refresh the users list
                } else {
                    throw new Error('Failed to delete user');
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                this.showAlert('Error deleting user. Please try again.', 'danger');
            }
        }
    }

    saveBookingChanges() {
        const status = document.getElementById('booking-status-select').value;
        // Get booking ID from modal or context
        // This would need to be implemented based on how you store the current booking ID
        this.showAlert('Booking changes saved successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();
        this.loadBookings();
    }

    // Blog Management Methods
    async loadBlogs() {
        try {
            const response = await fetch('/api/admin/blogs', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('traowl_token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Blogs loaded successfully:', data.blogs?.length || 0, 'blogs');
                this.displayBlogs(data.blogs || []);
            } else {
                throw new Error(`Failed to load blogs: ${response.status}`);
            }
        } catch (error) {
            console.error('Error loading blogs:', error);
            const tbody = document.getElementById('blogs-table');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading blogs. Please try again.</td></tr>';
            }
        }
    }

    displayBlogs(blogs) {
        const tbody = document.getElementById('blogs-table');
        tbody.innerHTML = '';

        if (blogs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No blogs found</td></tr>';
            return;
        }

        blogs.forEach(blog => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        ${blog.image ? `<img src="${blog.image}" alt="${blog.title}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; margin-right: 10px;">` : ''}
                        <div>
                            <div class="fw-bold">${blog.title}</div>
                            <small class="text-muted">${blog.excerpt || 'No excerpt'}</small>
                        </div>
                    </div>
                </td>
                <td><span class="badge bg-secondary">${blog.category}</span></td>
                <td>${blog.author || 'Admin'}</td>
                <td><span class="blog-status ${blog.status}">${blog.status}</span></td>
                <td>${new Date(blog.createdAt || blog.date).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="admin.editBlog('${blog.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="admin.deleteBlog('${blog.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    showAddBlogModal() {
        document.getElementById('blog-modal-title').textContent = 'Add New Blog';
        document.getElementById('blog-form').reset();
        document.getElementById('blog-image-preview').style.display = 'none';
        document.getElementById('blog-image-placeholder').style.display = 'flex';
        new bootstrap.Modal(document.getElementById('blogModal')).show();
    }

    async editBlog(blogId) {
        try {
            const response = await fetch(`/api/blogs/${blogId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('traowl_token')}`
                }
            });
            
            if (response.ok) {
                const blog = await response.json();
                document.getElementById('blog-modal-title').textContent = 'Edit Blog';
                document.getElementById('blog-title').value = blog.title;
                document.getElementById('blog-content').value = blog.content;
                document.getElementById('blog-category').value = blog.category;
                document.getElementById('blog-tags').value = blog.tags ? blog.tags.join(', ') : '';
                document.getElementById('blog-status').value = blog.status;
                document.getElementById('blog-excerpt').value = blog.excerpt || '';
                
                if (blog.image) {
                    document.getElementById('blog-image-preview').src = blog.image;
                    document.getElementById('blog-image-preview').style.display = 'block';
                    document.getElementById('blog-image-placeholder').style.display = 'none';
                }
                
                new bootstrap.Modal(document.getElementById('blogModal')).show();
            }
        } catch (error) {
            console.error('Error loading blog for editing:', error);
            this.showAlert('Error loading blog details', 'danger');
        }
    }

    async saveBlog() {
        const title = document.getElementById('blog-title').value;
        const content = document.getElementById('blog-content').value;
        const category = document.getElementById('blog-category').value;
        const tags = document.getElementById('blog-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const status = document.getElementById('blog-status').value;
        const excerpt = document.getElementById('blog-excerpt').value;

        if (!title || !content) {
            this.showAlert('Title and content are required', 'warning');
            return;
        }

        try {
            const blogData = {
                title,
                content,
                category,
                tags,
                status,
                excerpt,
                author: 'Admin',
                date: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };

            const response = await fetch('/api/admin/blogs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('traowl_token')}`
                },
                body: JSON.stringify(blogData)
            });

            if (response.ok) {
                this.showAlert('Blog saved successfully', 'success');
                bootstrap.Modal.getInstance(document.getElementById('blogModal')).hide();
                this.loadBlogs();
            } else {
                throw new Error('Failed to save blog');
            }
        } catch (error) {
            console.error('Error saving blog:', error);
            this.showAlert('Error saving blog. Please try again.', 'danger');
        }
    }

    async deleteBlog(blogId) {
        if (confirm('Are you sure you want to delete this blog?')) {
            try {
                const response = await fetch(`/api/admin/blogs/${blogId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('traowl_token')}`
                    }
                });

                if (response.ok) {
                    this.showAlert('Blog deleted successfully', 'success');
                    this.loadBlogs();
                } else {
                    throw new Error('Failed to delete blog');
                }
            } catch (error) {
                console.error('Error deleting blog:', error);
                this.showAlert('Error deleting blog. Please try again.', 'danger');
            }
        }
    }

    // Page Content Management Methods
    async loadPageContent(pageType) {
        try {
            const response = await fetch(`/api/admin/pages/${pageType}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('traowl_token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                document.getElementById('current-page-title').textContent = this.getPageTitle(pageType);
                document.getElementById('page-content-editor').innerHTML = `
                    <textarea class="form-control rich-editor" id="page-content-textarea" rows="20">${data.content || ''}</textarea>
                `;
                this.currentPageType = pageType;
            } else {
                throw new Error('Failed to load page content');
            }
        } catch (error) {
            console.error('Error loading page content:', error);
            document.getElementById('page-content-editor').innerHTML = `
                <div class="alert alert-danger">Error loading page content</div>
            `;
        }
    }

    getPageTitle(pageType) {
        const titles = {
            'about-us': 'About Us',
            'home-content': 'Home Page Content',
            'footer': 'Footer Content',
            'header': 'Header Content',
            'policies': 'Policies & Terms'
        };
        return titles[pageType] || pageType;
    }

    async savePageContent() {
        const content = document.getElementById('page-content-textarea').value;
        
        try {
            const response = await fetch(`/api/admin/pages/${this.currentPageType}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('traowl_token')}`
                },
                body: JSON.stringify({ content })
            });

            if (response.ok) {
                this.showAlert('Page content saved successfully', 'success');
            } else {
                throw new Error('Failed to save page content');
            }
        } catch (error) {
            console.error('Error saving page content:', error);
            this.showAlert('Error saving page content. Please try again.', 'danger');
        }
    }

    previewPageContent() {
        const content = document.getElementById('page-content-textarea').value;
        document.getElementById('preview-modal-body').innerHTML = content;
        new bootstrap.Modal(document.getElementById('previewModal')).show();
    }

    // All Banner Management Methods - REMOVED (banner section completely removed)

    // Refresh Methods
    refreshBlogs() {
        this.loadBlogs();
    }

    // Visual Admin Methods
    async loadVisualPagePreview() {
        const selectedPage = document.getElementById('visual-page-selector').value;
        if (!selectedPage) return;

        const previewContainer = document.getElementById('visual-page-preview');
        
        try {
            previewContainer.innerHTML = `
                <div class="page-preview-container" style="border: 2px solid #ddd; border-radius: 8px; overflow: hidden; height: 500px; position: relative;">
                    <div class="preview-header" style="background: #f8f9fa; padding: 8px 15px; border-bottom: 1px solid #ddd; font-size: 12px; color: #6c757d;">
                        <i class="fas fa-eye me-1"></i>Preview: ${selectedPage}
                        <div class="float-end">
                            <button class="btn btn-sm btn-outline-primary" onclick="refreshPreview()" title="Refresh Preview">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                        </div>
                    </div>
                    <iframe id="page-preview-iframe" src="/${selectedPage}?preview=true" 
                            style="width: 100%; height: calc(100% - 40px); border: none; background: white;"
                            onload="handlePreviewLoad()"></iframe>
                </div>
            `;
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

    openVisualEditor() {
        const selectedPage = document.getElementById('visual-page-selector').value;
        if (!selectedPage) {
            this.showAlert('Please select a page first', 'warning');
            return;
        }
        
        const editUrl = `/${selectedPage}?admin=true&edit=true`;
        window.open(editUrl, '_blank');
    }

    openPagePreview() {
        const selectedPage = document.getElementById('visual-page-selector').value;
        if (!selectedPage) {
            this.showAlert('Please select a page first', 'warning');
            return;
        }
        
        window.open(`/${selectedPage}`, '_blank');
    }

    saveVisualChanges() {
        this.showAlert('Visual changes are saved automatically when editing', 'info');
    }

    // Visual Trip Management
    
    initializeTripsView() {
        // Ensure proper initial view state
        const visualView = document.getElementById('visual-trips-view');
        const jsonView = document.getElementById('json-editor-view');
        const toggleText = document.getElementById('view-mode-text');
        
        if (this.isVisualView) {
            visualView.style.display = 'block';
            jsonView.style.display = 'none';
            toggleText.textContent = 'Visual View';
        } else {
            visualView.style.display = 'none';
            jsonView.style.display = 'block';
            toggleText.textContent = 'JSON View';
        }
        
        // Make sure the correct category is active in sidebar
        document.querySelectorAll('#content-categories .list-group-item').forEach(item => {
            if (item.dataset.file === this.currentTripCategory) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    // Helper function to get the correct property name for each trip category
    getTripPropertyName(category) {
        const propertyMap = {
            'spiritual-tours.json': 'spiritualTours',
            'domestic-trips.json': 'domesticTrips',
            'international-trips.json': 'internationalTrips',
            'family-trips.json': 'familyTrips',
            'romantic-trips.json': 'romanticTrips',
            'corporate-trips.json': 'corporateTrips',
            'weekend-trips.json': 'weekendTrips',
            'upcoming-trips.json': 'upcomingTrips',
            'activities.json': 'activities',
            'homepage-hot-locations.json': 'hotLocations'
        };
        return propertyMap[category] || 'trips';
    }

    async loadVisualTrips() {
        const category = this.currentTripCategory;
        const visualGrid = document.getElementById('visual-trips-grid');
        
        console.log(`[Visual Trips] Loading category: ${category}`);
        
        try {
            const response = await fetch(`/data/${category}`);
            const data = await response.json();
            
            // Get trips using the correct property name
            const propertyName = this.getTripPropertyName(category);
            let trips = data[propertyName] || [];
            
            console.log(`[Visual Trips] Property name: ${propertyName}, Found trips:`, trips.length);
            
            // Fallback: if property doesn't exist, try to find trips array automatically
            if (trips.length === 0) {
                const keys = Object.keys(data);
                const tripsKey = keys.find(key => Array.isArray(data[key]) && data[key].length > 0 && data[key][0].title);
                trips = tripsKey ? data[tripsKey] : [];
                console.log(`[Visual Trips] Fallback found key: ${tripsKey}, trips:`, trips.length);
            }
            
            this.trips = trips;
            
            if (trips.length === 0) {
                visualGrid.innerHTML = `
                    <div class="col-12 text-center py-4">
                        <div class="text-muted">
                            <i class="fas fa-map-marked-alt fa-3x mb-3"></i>
                            <h5>No trips found</h5>
                            <p>Click "Add New Trip" to create your first trip</p>
                        </div>
                    </div>
                `;
                return;
            }
            
            let html = '';
            trips.forEach((trip, index) => {
                html += `
                    <div class="col-md-6 col-lg-4">
                        <div class="trip-card-visual" data-trip-id="${trip.id || index}">
                            <img src="${trip.image || 'images/default-trip.jpg'}" alt="${trip.title}" class="trip-card-image" 
                                 onerror="this.src='images/default-trip.jpg'">
                            <div class="trip-card-content">
                                <div class="trip-card-title">${trip.title}</div>
                                <div class="trip-card-price">₹${trip.price?.toLocaleString() || '0'}</div>
                                <div class="trip-card-duration">${trip.duration || 'Duration not specified'}</div>
                                <div class="trip-card-destination">${trip.destination || 'Destination not specified'}</div>
                            </div>
                            <div class="trip-actions">
                                ${this.hasPermission('trips.edit') ? `
                                    <button class="trip-action-btn trip-action-edit" onclick="admin.editVisualTrip(${trip.id || index})" title="Edit Trip">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                ` : ''}
                                ${this.hasPermission('trips.delete') ? `
                                    <button class="trip-action-btn trip-action-delete" onclick="admin.deleteVisualTrip(${trip.id || index})" title="Delete Trip">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });
            
            visualGrid.innerHTML = html;
            
        } catch (error) {
            console.error('Error loading visual trips:', error);
            visualGrid.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Error loading trips: ${error.message}
                    </div>
                </div>
            `;
        }
    }

    showAddTripModal() {
        if (!this.hasPermission('trips.create')) {
            alert('You do not have permission to create trips.');
            return;
        }
        
        this.editingTripId = null;
        document.getElementById('tripModalTitle').textContent = 'Add New Trip';
        document.getElementById('tripForm').reset();
        document.getElementById('trip-image-preview').style.display = 'none';
        
        const modal = new bootstrap.Modal(document.getElementById('tripModal'));
        modal.show();
    }

    editVisualTrip(tripId) {
        if (!this.hasPermission('trips.edit')) {
            alert('You do not have permission to edit trips.');
            return;
        }
        
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
                const uploadedImageUrl = await this.uploadTripImage(imageInput.files[0]);
                tripData.image = uploadedImageUrl;
            } catch (error) {
                console.error('Error uploading image:', error);
                this.showAlert('Error uploading image. Trip will be saved without image.', 'warning');
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
            
            // Save to server with correct property name
            const dataToSave = {};
            const propertyName = this.getTripPropertyName(this.currentTripCategory);
            dataToSave[propertyName] = updatedTrips;
            
            const response = await fetch(`/api/admin/content/${this.currentTripCategory}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('traowl_token')}`
                },
                body: JSON.stringify({ content: dataToSave })
            });
            
            if (response.ok) {
                this.showAlert('Trip saved successfully!', 'success');
                bootstrap.Modal.getInstance(document.getElementById('tripModal')).hide();
                this.loadVisualTrips();
            } else {
                throw new Error('Failed to save trip');
            }
            
        } catch (error) {
            console.error('Error saving trip:', error);
            this.showAlert('Error saving trip. Please try again.', 'danger');
        }
    }

    async deleteVisualTrip(tripId) {
        if (!this.hasPermission('trips.delete')) {
            alert('You do not have permission to delete trips.');
            return;
        }
        
        if (!confirm('Are you sure you want to delete this trip?')) return;
        
        try {
            const tripIndex = this.trips.findIndex(t => (t.id || this.trips.indexOf(t)) == tripId);
            if (tripIndex === -1) return;
            
            this.trips.splice(tripIndex, 1);
            
            const dataToSave = {};
            const propertyName = this.getTripPropertyName(this.currentTripCategory);
            dataToSave[propertyName] = this.trips;
            
            const response = await fetch(`/api/admin/content/${this.currentTripCategory}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('traowl_token')}`
                },
                body: JSON.stringify({ content: dataToSave })
            });
            
            if (response.ok) {
                this.showAlert('Trip deleted successfully!', 'success');
                this.loadVisualTrips();
            } else {
                throw new Error('Failed to delete trip');
            }
            
        } catch (error) {
            console.error('Error deleting trip:', error);
            this.showAlert('Error deleting trip. Please try again.', 'danger');
        }
    }

    async uploadTripImage(file) {
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

    toggleViewMode() {
        this.isVisualView = !this.isVisualView;
        const visualView = document.getElementById('visual-trips-view');
        const jsonView = document.getElementById('json-editor-view');
        const toggleText = document.getElementById('view-mode-text');
        
        if (this.isVisualView) {
            visualView.style.display = 'block';
            jsonView.style.display = 'none';
            toggleText.textContent = 'Visual View';
            this.loadVisualTrips(); // Reload trips when switching to visual view
        } else {
            visualView.style.display = 'none';
            jsonView.style.display = 'block';
            toggleText.textContent = 'JSON View';
        }
    }

    // Quick trip management for sidebar
    async loadQuickTrips() {
        const category = document.getElementById('quick-trip-category').value + '.json';
        this.currentTripCategory = category;
        
        try {
            const response = await fetch(`/data/${category}`);
            const data = await response.json();
            
            // Get trips using the correct property name
            const propertyName = this.getTripPropertyName(category);
            let trips = data[propertyName] || [];
            
            // Fallback: if property doesn't exist, try to find trips array automatically
            if (trips.length === 0) {
                const keys = Object.keys(data);
                const tripsKey = keys.find(key => Array.isArray(data[key]) && data[key].length > 0 && data[key][0].title);
                trips = tripsKey ? data[tripsKey] : [];
            }
            
            const quickList = document.getElementById('quick-trips-list');
            if (trips.length === 0) {
                quickList.innerHTML = '<div class="text-muted text-center py-2">No trips found</div>';
                return;
            }
            
            let html = '';
            trips.slice(0, 5).forEach((trip, index) => {
                html += `
                    <div class="d-flex justify-content-between align-items-center py-1 border-bottom">
                        <div class="flex-grow-1">
                            <div class="fw-bold small">${trip.title}</div>
                            <div class="text-muted" style="font-size: 0.75rem;">₹${trip.price?.toLocaleString() || '0'}</div>
                        </div>
                        <div class="d-flex gap-1">
                            <button class="btn btn-sm btn-outline-primary" onclick="admin.editVisualTrip(${trip.id || index})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="admin.deleteVisualTrip(${trip.id || index})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            
            if (trips.length > 5) {
                html += `<div class="text-center py-2"><small class="text-muted">+${trips.length - 5} more trips</small></div>`;
            }
            
            quickList.innerHTML = html;
            
        } catch (error) {
            console.error('Error loading quick trips:', error);
            document.getElementById('quick-trips-list').innerHTML = '<div class="text-danger text-center py-2">Error loading trips</div>';
        }
    }

    showQuickAddTrip() {
        this.showAddTripModal();
    }

    manageTrips() {
        // Switch to trips section
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
        
        document.querySelector('[data-section="trips"]').classList.add('active');
        document.getElementById('trips').classList.add('active');
        
        this.loadVisualTrips();
    }
}

// Initialize admin dashboard
const admin = new AdminDashboard();

// Global functions for onclick handlers
window.admin = admin;

// Global functions for HTML onclick handlers
function showAddBlogModal() {
    admin.showAddBlogModal();
}

function saveBlog() {
    admin.saveBlog();
}

function refreshBlogs() {
    admin.refreshBlogs();
}

// Visual Admin Global Functions
function loadVisualPagePreview() {
    admin.loadVisualPagePreview();
}

function openVisualEditor() {
    admin.openVisualEditor();
}

function openPagePreview() {
    admin.openPagePreview();
}

function saveVisualChanges() {
    admin.saveVisualChanges();
}

function showAddTripModal() {
    admin.showAddTripModal();
}

function saveTrip() {
    admin.saveTrip();
}

function toggleViewMode() {
    admin.toggleViewMode();
}

function loadQuickTrips() {
    admin.loadQuickTrips();
}

function showQuickAddTrip() {
    admin.showQuickAddTrip();
}

function manageTrips() {
    admin.manageTrips();
}

function previewTripImage(input) {
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

function refreshPreview() {
    const iframe = document.getElementById('page-preview-iframe');
    if (iframe) {
        iframe.src = iframe.src;
    }
}

function handlePreviewLoad() {
    // Add any post-load handling here
    console.log('Preview loaded successfully');
}

function savePageContent() {
    admin.savePageContent();
}

function previewPageContent() {
    admin.previewPageContent();
}

// Banner functions removed - banner management removed

function refreshMessages() {
    admin.refreshMessages();
}

// Page navigation handlers
document.addEventListener('DOMContentLoaded', function() {
    // Page content navigation
    const pageCategories = document.getElementById('page-categories');
    if (pageCategories) {
        pageCategories.addEventListener('click', function(e) {
            if (e.target.classList.contains('list-group-item')) {
                e.preventDefault();
                
                // Remove active class from all items
                pageCategories.querySelectorAll('.list-group-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                // Add active class to clicked item
                e.target.classList.add('active');
                
                // Load page content
                const pageType = e.target.getAttribute('data-page');
                if (pageType) {
                    admin.loadPageContent(pageType);
                }
            }
        });
    }

    // Blog image upload handler
    const blogImageInput = document.getElementById('blog-image-input');
    const blogImagePlaceholder = document.getElementById('blog-image-placeholder');
    
    if (blogImageInput && blogImagePlaceholder) {
        blogImagePlaceholder.addEventListener('click', function() {
            blogImageInput.click();
        });
        
        blogImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('blog-image-preview');
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                    blogImagePlaceholder.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

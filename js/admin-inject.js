// Admin injection script - adds visual editing capabilities to any page
(function() {
    // Check if we're in preview mode (just for iframe preview)
    const isPreviewMode = window.location.search.includes('preview=true');
    
    // Check if we're in admin mode (has admin token and is accessed from admin panel)
    const isAdminMode = localStorage.getItem('traowl_token') && 
                       (window.location.search.includes('admin=true') || 
                        window.location.search.includes('edit=true') ||
                        document.referrer.includes('admin') ||
                        sessionStorage.getItem('admin_mode') === 'true');
    
    // If it's just preview mode, don't load admin tools
    if (isPreviewMode && !window.location.search.includes('edit=true')) {
        // Add a subtle preview indicator
        const previewIndicator = document.createElement('div');
        previewIndicator.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(23, 162, 184, 0.9);
            color: white;
            text-align: center;
            padding: 2px 0;
            font-size: 11px;
            z-index: 9999;
            font-family: Arial, sans-serif;
        `;
        previewIndicator.textContent = '👁️ PREVIEW MODE';
        document.body.prepend(previewIndicator);
        return;
    }
    
    if (!isAdminMode) return;
    
    // Set admin mode in session storage for persistence
    sessionStorage.setItem('admin_mode', 'true');

    // Load visual editor script
    const script = document.createElement('script');
    script.src = '/js/visual-editor.js';
    script.onload = function() {
        console.log('Visual editor loaded');
        
        // Add admin toolbar
        addAdminToolbar();
        
        // Listen for admin panel messages
        window.addEventListener('message', function(event) {
            if (event.data.action === 'enableEditMode') {
                window.visualEditor.enableEditMode();
            } else if (event.data.action === 'disableEditMode') {
                window.visualEditor.disableEditMode();
            } else if (event.data.action === 'saveChanges') {
                window.visualEditor.saveChanges();
            }
        });
    };
    document.head.appendChild(script);

    function addAdminToolbar() {
        const toolbar = document.createElement('div');
        toolbar.id = 'admin-toolbar';
        toolbar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #2c3e50, #34495e);
            color: white;
            padding: 10px 20px;
            z-index: 10000;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;

        toolbar.innerHTML = `
            <div>
                <span style="font-weight: 600; margin-right: 20px;">
                    <i class="fas fa-edit" style="margin-right: 8px;"></i>Admin Edit Mode
                </span>
                <span style="opacity: 0.8;">Click on any element to edit</span>
            </div>
            <div>
                <button id="toggle-edit-mode" style="
                    background: #ff6b35;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    margin-right: 10px;
                    cursor: pointer;
                    font-size: 12px;
                ">Enable Edit Mode</button>
                <button id="save-changes" style="
                    background: #27ae60;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    margin-right: 10px;
                    cursor: pointer;
                    font-size: 12px;
                ">Save Changes</button>
                <button id="close-admin" style="
                    background: #e74c3c;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                ">Exit Admin</button>
            </div>
        `;

        document.body.appendChild(toolbar);

        // Adjust body padding to account for toolbar
        document.body.style.paddingTop = '50px';

        // Add event listeners
        let editModeEnabled = false;
        
        document.getElementById('toggle-edit-mode').addEventListener('click', function() {
            editModeEnabled = !editModeEnabled;
            if (editModeEnabled) {
                window.visualEditor.enableEditMode();
                this.textContent = 'Disable Edit Mode';
                this.style.background = '#e74c3c';
            } else {
                window.visualEditor.disableEditMode();
                this.textContent = 'Enable Edit Mode';
                this.style.background = '#ff6b35';
            }
        });

        document.getElementById('save-changes').addEventListener('click', function() {
            window.visualEditor.saveChanges();
        });

        document.getElementById('close-admin').addEventListener('click', function() {
            if (confirm('Exit admin mode? Any unsaved changes will be lost.')) {
                window.location.href = window.location.pathname;
            }
        });
    }

    // Add Font Awesome for icons if not already present
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fontAwesome = document.createElement('link');
        fontAwesome.rel = 'stylesheet';
        fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
        document.head.appendChild(fontAwesome);
    }
})();
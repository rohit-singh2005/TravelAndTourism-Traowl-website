// Visual Editor for Admin Panel
class VisualEditor {
    constructor() {
        this.isEditMode = false;
        this.editableElements = [];
        this.changes = {};
        this.init();
    }

    init() {
        // Listen for messages from admin panel
        window.addEventListener('message', (event) => {
            if (event.data.action === 'enableEditMode') {
                this.enableEditMode();
            } else if (event.data.action === 'disableEditMode') {
                this.disableEditMode();
            } else if (event.data.action === 'saveChanges') {
                this.saveChanges();
            }
        });

        // Add visual editor styles
        this.addStyles();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .visual-edit-overlay {
                position: absolute;
                border: 2px dashed #ff6b35;
                background: rgba(255, 107, 53, 0.1);
                cursor: pointer;
                z-index: 10000;
                pointer-events: none;
            }

            .visual-edit-overlay.active {
                pointer-events: all;
            }

            .visual-edit-tooltip {
                position: absolute;
                top: -30px;
                left: 0;
                background: #ff6b35;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                white-space: nowrap;
                z-index: 10001;
            }

            .visual-edit-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                z-index: 10002;
                min-width: 400px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
            }

            .visual-edit-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 10001;
            }

            .visual-edit-header {
                background: #ff6b35;
                color: white;
                padding: 15px 20px;
                border-radius: 10px 10px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .visual-edit-body {
                padding: 20px;
            }

            .visual-edit-footer {
                padding: 15px 20px;
                border-top: 1px solid #eee;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }

            .visual-edit-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s ease;
            }

            .visual-edit-btn-primary {
                background: #ff6b35;
                color: white;
            }

            .visual-edit-btn-secondary {
                background: #6c757d;
                color: white;
            }

            .visual-edit-btn:hover {
                opacity: 0.8;
            }

            .visual-edit-form-group {
                margin-bottom: 15px;
            }

            .visual-edit-label {
                display: block;
                margin-bottom: 5px;
                font-weight: 600;
                color: #333;
            }

            .visual-edit-input,
            .visual-edit-textarea {
                width: 100%;
                padding: 8px 12px;
                border: 2px solid #ddd;
                border-radius: 5px;
                font-size: 14px;
                transition: border-color 0.3s ease;
            }

            .visual-edit-input:focus,
            .visual-edit-textarea:focus {
                outline: none;
                border-color: #ff6b35;
            }

            .visual-edit-textarea {
                resize: vertical;
                min-height: 100px;
            }

            .editable-highlight {
                position: relative;
                transition: all 0.3s ease;
            }

            .editable-highlight:hover {
                background: rgba(255, 107, 53, 0.1) !important;
                cursor: pointer;
            }

            .editable-highlight::after {
                content: '✏️ Click to edit';
                position: absolute;
                top: -25px;
                left: 0;
                background: #ff6b35;
                color: white;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 11px;
                white-space: nowrap;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
                z-index: 1000;
            }

            .editable-highlight:hover::after {
                opacity: 1;
            }

            .admin-mode .editable-highlight {
                border: 1px dashed rgba(255, 107, 53, 0.5);
                margin: 2px;
                padding: 2px;
            }
        `;
        document.head.appendChild(style);
    }

    enableEditMode() {
        this.isEditMode = true;
        document.body.classList.add('admin-mode');
        this.identifyEditableElements();
        this.addEditableHighlights();
    }

    disableEditMode() {
        this.isEditMode = false;
        document.body.classList.remove('admin-mode');
        this.removeEditableHighlights();
    }

    identifyEditableElements() {
        this.editableElements = [];

        // Text content elements - expanded selectors for all pages
        const textSelectors = [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'span', 'div.card-title', 'div.card-description',
            '.about-desc', '.hero-overlay h1', '.card-price',
            '.hero-title', '.hero-subtitle', '.section-title',
            '.card-text', '.description', '.content-text',
            '.blog-title', '.blog-content', '.activity-title',
            '.trip-title', '.trip-description', '.price-text',
            '.destination-name', '.duration-text', '.feature-title',
            '.feature-description', '.testimonial-text', '.quote-text'
        ];

        textSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (this.isEditableText(el)) {
                    this.editableElements.push({
                        element: el,
                        type: 'text',
                        selector: this.getElementSelector(el),
                        originalContent: el.textContent || el.innerHTML
                    });
                }
            });
        });

        // Image elements - expanded for all image types
        const imageSelectors = [
            'img', '.card-img', '.hero-section', '.hero-image',
            '.trip-image', '.activity-image', '.blog-image',
            '.gallery-image', '.feature-image', '.testimonial-image',
            '.background-image', '.banner-image'
        ];
        
        imageSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(img => {
                if (img.tagName === 'IMG' || img.style.backgroundImage) {
                    this.editableElements.push({
                        element: img,
                        type: 'image',
                        selector: this.getElementSelector(img),
                        originalSrc: img.src || this.extractBackgroundImageUrl(img.style.backgroundImage)
                    });
                }
            });
        });

        // Links - improved detection
        const links = document.querySelectorAll('a');
        links.forEach(link => {
            if (link.textContent.trim() && !link.querySelector('img') && link.href !== '#') {
                this.editableElements.push({
                    element: link,
                    type: 'link',
                    selector: this.getElementSelector(link),
                    originalText: link.textContent,
                    originalHref: link.href
                });
            }
        });
    }

    extractBackgroundImageUrl(backgroundImage) {
        if (!backgroundImage || backgroundImage === 'none') return '';
        const match = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
        return match ? match[1] : '';
    }

    isEditableText(element) {
        const text = element.textContent.trim();
        if (!text || text.length < 3) return false;
        
        // Skip elements that are likely navigation or functional
        const skipClasses = ['btn', 'button', 'nav', 'menu', 'close', 'toggle'];
        const skipTags = ['SCRIPT', 'STYLE', 'NOSCRIPT'];
        
        if (skipTags.includes(element.tagName)) return false;
        
        for (const className of skipClasses) {
            if (element.className.includes(className)) return false;
        }
        
        return true;
    }

    getElementSelector(element) {
        // Try to create a more specific selector
        if (element.id) {
            return `#${element.id}`;
        }
        
        // Look for data attributes that might help identify the content
        if (element.dataset.section) {
            return `[data-section="${element.dataset.section}"]`;
        }
        
        // Check parent sections to create context-aware selectors
        const section = element.closest('section');
        if (section && section.id) {
            const tagName = element.tagName.toLowerCase();
            const elementIndex = Array.from(section.querySelectorAll(tagName)).indexOf(element);
            return `#${section.id} ${tagName}:nth-of-type(${elementIndex + 1})`;
        }
        
        // Use class-based selector with content context
        if (element.className) {
            const classes = element.className.split(' ').filter(c => c.trim() && !c.includes('editable'));
            if (classes.length > 0) {
                return `.${classes[0]}`;
            }
        }
        
        // Create a selector based on content and position
        const tagName = element.tagName.toLowerCase();
        const textContent = element.textContent.trim();
        
        // For about page, create more specific selectors
        if (window.location.pathname.includes('about')) {
            if (tagName === 'h1' && textContent.toLowerCase().includes('about')) {
                return 'about-hero-title';
            } else if (tagName === 'h2') {
                if (textContent.toLowerCase().includes('who')) {
                    return 'about-who-title';
                } else if (textContent.toLowerCase().includes('mission') || textContent.toLowerCase().includes('purpose')) {
                    return 'about-mission-title';
                } else if (textContent.toLowerCase().includes('team')) {
                    return 'about-team-title';
                }
            } else if (tagName === 'p') {
                const parentSection = element.closest('section');
                if (parentSection && parentSection.id) {
                    const pIndex = Array.from(parentSection.querySelectorAll('p')).indexOf(element);
                    return `${parentSection.id}-paragraph-${pIndex}`;
                }
            }
        }
        
        return tagName;
    }

    addEditableHighlights() {
        this.editableElements.forEach(item => {
            item.element.classList.add('editable-highlight');
            item.element.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openEditModal(item);
            });
        });
    }

    removeEditableHighlights() {
        this.editableElements.forEach(item => {
            item.element.classList.remove('editable-highlight');
            item.element.removeEventListener('click', this.openEditModal);
        });
    }

    openEditModal(item) {
        const modal = this.createEditModal(item);
        document.body.appendChild(modal);
    }

    createEditModal(item) {
        const backdrop = document.createElement('div');
        backdrop.className = 'visual-edit-backdrop';
        
        const modal = document.createElement('div');
        modal.className = 'visual-edit-modal';
        
        let modalContent = '';
        
        if (item.type === 'text') {
            modalContent = `
                <div class="visual-edit-header">
                    <h5>Edit Text Content</h5>
                    <button class="visual-edit-btn visual-edit-btn-secondary" onclick="this.closest('.visual-edit-backdrop').remove()">×</button>
                </div>
                <div class="visual-edit-body">
                    <div class="visual-edit-form-group">
                        <label class="visual-edit-label">Content:</label>
                        <textarea class="visual-edit-textarea" id="edit-content">${item.originalContent}</textarea>
                    </div>
                </div>
                <div class="visual-edit-footer">
                    <button class="visual-edit-btn visual-edit-btn-secondary" onclick="this.closest('.visual-edit-backdrop').remove()">Cancel</button>
                    <button class="visual-edit-btn visual-edit-btn-primary" onclick="visualEditor.saveTextEdit('${item.selector}', document.getElementById('edit-content').value); this.closest('.visual-edit-backdrop').remove();">Save</button>
                </div>
            `;
        } else if (item.type === 'image') {
            modalContent = `
                <div class="visual-edit-header">
                    <h5>Edit Image</h5>
                    <button class="visual-edit-btn visual-edit-btn-secondary" onclick="this.closest('.visual-edit-backdrop').remove()">×</button>
                </div>
                <div class="visual-edit-body">
                    <div class="visual-edit-form-group">
                        <label class="visual-edit-label">Image URL:</label>
                        <input type="text" class="visual-edit-input" id="edit-image-url" value="${item.originalSrc}" placeholder="Enter image URL">
                    </div>
                    <div class="visual-edit-form-group">
                        <label class="visual-edit-label">Upload New Image:</label>
                        <input type="file" class="visual-edit-input" id="edit-image-file" accept="image/*">
                    </div>
                </div>
                <div class="visual-edit-footer">
                    <button class="visual-edit-btn visual-edit-btn-secondary" onclick="this.closest('.visual-edit-backdrop').remove()">Cancel</button>
                    <button class="visual-edit-btn visual-edit-btn-primary" onclick="visualEditor.saveImageEdit('${item.selector}'); this.closest('.visual-edit-backdrop').remove();">Save</button>
                </div>
            `;
        } else if (item.type === 'link') {
            modalContent = `
                <div class="visual-edit-header">
                    <h5>Edit Link</h5>
                    <button class="visual-edit-btn visual-edit-btn-secondary" onclick="this.closest('.visual-edit-backdrop').remove()">×</button>
                </div>
                <div class="visual-edit-body">
                    <div class="visual-edit-form-group">
                        <label class="visual-edit-label">Link Text:</label>
                        <input type="text" class="visual-edit-input" id="edit-link-text" value="${item.originalText}">
                    </div>
                    <div class="visual-edit-form-group">
                        <label class="visual-edit-label">Link URL:</label>
                        <input type="text" class="visual-edit-input" id="edit-link-url" value="${item.originalHref}">
                    </div>
                </div>
                <div class="visual-edit-footer">
                    <button class="visual-edit-btn visual-edit-btn-secondary" onclick="this.closest('.visual-edit-backdrop').remove()">Cancel</button>
                    <button class="visual-edit-btn visual-edit-btn-primary" onclick="visualEditor.saveLinkEdit('${item.selector}'); this.closest('.visual-edit-backdrop').remove();">Save</button>
                </div>
            `;
        }
        
        modal.innerHTML = modalContent;
        backdrop.appendChild(modal);
        
        // Close on backdrop click
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                backdrop.remove();
            }
        });
        
        return backdrop;
    }

    saveTextEdit(selector, newContent) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            // Preserve HTML structure if the element contains HTML
            if (el.innerHTML !== el.textContent) {
                // Element has HTML content, try to preserve structure
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = el.innerHTML;
                const textNodes = this.getTextNodes(tempDiv);
                if (textNodes.length > 0) {
                    textNodes[0].textContent = newContent;
                    el.innerHTML = tempDiv.innerHTML;
                } else {
                    el.textContent = newContent;
                }
            } else {
                el.textContent = newContent;
            }
        });
        
        this.changes[selector] = {
            type: 'text',
            content: newContent,
            originalContent: this.editableElements.find(item => item.selector === selector)?.originalContent
        };
        
        this.showSaveNotification('Text updated successfully!');
    }

    getTextNodes(element) {
        const textNodes = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.trim()) {
                textNodes.push(node);
            }
        }
        
        return textNodes;
    }

    async saveImageEdit(selector) {
        const imageUrl = document.getElementById('edit-image-url').value;
        const imageFile = document.getElementById('edit-image-file').files[0];
        
        let finalImageUrl = imageUrl;
        
        if (imageFile) {
            try {
                // Show loading indicator
                this.showSaveNotification('Uploading image...');
                finalImageUrl = await this.uploadImage(imageFile);
            } catch (error) {
                alert('Error uploading image: ' + error.message);
                return;
            }
        }
        
        // Update images immediately
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            if (el.tagName === 'IMG') {
                // Force immediate image load
                el.src = finalImageUrl;
                el.onload = () => {
                    this.showSaveNotification('Image updated successfully!');
                };
                el.onerror = () => {
                    this.showSaveNotification('Image loaded with fallback', 'warning');
                };
            } else if (el.style.backgroundImage || this.hasBackgroundImage(el)) {
                el.style.backgroundImage = `url(${finalImageUrl})`;
                // Force repaint
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
                this.showSaveNotification('Background image updated successfully!');
            }
        });
        
        this.changes[selector] = {
            type: 'image',
            src: finalImageUrl
        };
        
        // Force page repaint
        document.body.style.display = 'none';
        document.body.offsetHeight; // Trigger reflow
        document.body.style.display = '';
    }

    hasBackgroundImage(element) {
        const computedStyle = window.getComputedStyle(element);
        return computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none';
    }

    saveLinkEdit(selector) {
        const linkText = document.getElementById('edit-link-text').value;
        const linkUrl = document.getElementById('edit-link-url').value;
        
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            el.textContent = linkText;
            el.href = linkUrl;
        });
        
        this.changes[selector] = {
            type: 'link',
            text: linkText,
            href: linkUrl
        };
        
        this.showSaveNotification('Link updated successfully!');
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
            throw new Error('Failed to upload image');
        }
        
        const result = await response.json();
        return result.imageUrl;
    }

    showSaveNotification(message, type = 'success') {
        const notification = document.createElement('div');
        
        let backgroundColor = '#28a745'; // success
        if (type === 'warning') backgroundColor = '#ffc107';
        if (type === 'error') backgroundColor = '#dc3545';
        if (type === 'info') backgroundColor = '#17a2b8';
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${backgroundColor};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10003;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
        `;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        if (!document.querySelector('style[data-visual-editor]')) {
            style.setAttribute('data-visual-editor', 'true');
            document.head.appendChild(style);
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    async saveChanges() {
        if (Object.keys(this.changes).length === 0) {
            this.showSaveNotification('No changes to save');
            return;
        }
        
        try {
            // Send changes to parent window (admin panel)
            window.parent.postMessage({
                action: 'pageChanges',
                changes: this.changes,
                url: window.location.pathname
            }, '*');
            
            this.changes = {};
            this.showSaveNotification('All changes saved successfully!');
        } catch (error) {
            console.error('Error saving changes:', error);
            alert('Error saving changes: ' + error.message);
        }
    }
}

// Initialize visual editor
const visualEditor = new VisualEditor();

// Export for global access
window.visualEditor = visualEditor;
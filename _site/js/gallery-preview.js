class GalleryPreviewController {
    constructor() {
        console.log('Initializing GalleryPreviewController');
        
        // Core elements
        this.elements = {
            previewGrid: document.querySelector('#gallery-preview .gallery-grid'),
            albumModal: document.getElementById('album-modal'),
            lightbox: document.getElementById('lightbox'),
            dataScript: document.getElementById('gallery-preview-data'),
            lightboxContent: document.querySelector('.lightbox-content'),
        };

        console.log('Found elements:', {
            previewGrid: !!this.elements.previewGrid,
            albumModal: !!this.elements.albumModal,
            lightbox: !!this.elements.lightbox,
            dataScript: !!this.elements.dataScript,
            lightboxContent: !!this.elements.lightboxContent
        });

        // Initialize sub-elements
        if (this.elements.previewGrid) {
            this.elements.items = this.elements.previewGrid.querySelectorAll('.gallery-item');
            console.log('Found gallery items:', this.elements.items.length);
        }

        if (this.elements.albumModal) {
            this.elements.modalTitle = this.elements.albumModal.querySelector('.modal-title');
            this.elements.photosGrid = this.elements.albumModal.querySelector('.photos-grid');
            this.elements.backButton = this.elements.albumModal.querySelector('.back-button');
        }

        // Add state for drag handling
        this.state = {
            currentAlbum: null,
            currentPhotoIndex: -1,
            isDragging: false,
            dragStart: null,
            dragPosition: null,
            scrollPosition: 0
        };

        if (this.elements.lightbox) {
            this.elements.lightboxImage = this.elements.lightbox.querySelector('img');
            this.elements.closeButton = this.elements.lightbox.querySelector('.close-button');
            this.elements.prevButton = this.elements.lightbox.querySelector('.nav-button.prev');
            this.elements.nextButton = this.elements.lightbox.querySelector('.nav-button.next');
            
            console.log('Found lightbox elements:', {
                image: !!this.elements.lightboxImage,
                closeButton: !!this.elements.closeButton,
                prevButton: !!this.elements.prevButton,
                nextButton: !!this.elements.nextButton
            });
        }

        // Initialize gallery data
        this.galleryData = this.parseGalleryData();
        console.log('Gallery data parsed:', !!this.galleryData);

        // Set initial state of lightbox
        if (this.elements.lightbox) {
            this.elements.lightbox.setAttribute('hidden', '');
        }

        // Initialize if we have preview items
        if (this.elements.previewGrid) {
            this.initializeEventListeners();
            console.log('Event listeners initialized');
        }
    }

    parseGalleryData() {
        try {
            return this.elements.dataScript 
                ? JSON.parse(this.elements.dataScript.textContent)
                : null;
        } catch (error) {
            console.error('Error parsing gallery data:', error);
            return null;
        }
    }

    initializeEventListeners() {
        // Album clicks
        this.elements.items?.forEach(item => {
            item.addEventListener('click', () => {
                console.log('Album clicked:', item.dataset.albumId);
                const albumId = item.dataset.albumId;
                const album = this.galleryData.albums.find(a => a.id === albumId);
                if (album) {
                    console.log('Opening album:', album.title);
                    this.openAlbumView(album);
                }
            });
        });

        // Modal back button
        this.elements.backButton?.addEventListener('click', () => {
            this.closeAlbumView();
        });

        // Close modal when clicking outside content
        this.elements.albumModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.albumModal) {
                this.closeAlbumView();
            }
        });

        // Add touch and mouse events for lightbox
        if (this.elements.lightboxContent) {
            // Touch events
            this.elements.lightboxContent.addEventListener('touchstart', (e) => this.handleDragStart(e));
            this.elements.lightboxContent.addEventListener('touchmove', (e) => this.handleDragMove(e));
            this.elements.lightboxContent.addEventListener('touchend', (e) => this.handleDragEnd(e));

            // Mouse events
            this.elements.lightboxContent.addEventListener('mousedown', (e) => this.handleDragStart(e));
            this.elements.lightboxContent.addEventListener('mousemove', (e) => this.handleDragMove(e));
            this.elements.lightboxContent.addEventListener('mouseup', (e) => this.handleDragEnd(e));
            this.elements.lightboxContent.addEventListener('mouseleave', (e) => this.handleDragEnd(e));
        }

        // Lightbox controls
        this.elements.closeButton?.addEventListener('click', () => this.closeLightbox());
        this.elements.prevButton?.addEventListener('click', () => this.showPrevPhoto());
        this.elements.nextButton?.addEventListener('click', () => this.showNextPhoto());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.elements.lightbox.hidden) {
                switch(e.key) {
                    case 'Escape': this.closeLightbox(); break;
                    case 'ArrowLeft': this.showPrevPhoto(); break;
                    case 'ArrowRight': this.showNextPhoto(); break;
                }
            }
        });
    }

    handleDragStart(e) {
        if (!this.elements.lightboxImage) return;
        
        const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        
        this.state.dragStart = clientX;
        this.state.dragPosition = clientX;
        this.state.isDragging = true;
        
        this.elements.lightboxContent.classList.add('swiping');
        this.elements.lightboxImage.style.transition = 'none';
        
        // Prevent image dragging
        e.preventDefault();
    }

    handleDragMove(e) {
        if (!this.state.isDragging || !this.elements.lightboxImage) return;
        
        e.preventDefault();
        const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        this.state.dragPosition = clientX;
        
        const delta = this.state.dragPosition - this.state.dragStart;
        const maxDrag = window.innerWidth * 0.4; // 40% of screen width
        const dragPercent = Math.min(Math.abs(delta) / maxDrag, 1);
        
        // Apply transform with resistance
        const transform = delta * (1 - dragPercent * 0.6);
        this.elements.lightboxImage.style.transform = `translateX(${transform}px)`;
    }

    handleDragEnd(e) {
        if (!this.state.isDragging || !this.elements.lightboxImage) return;
        
        const delta = this.state.dragPosition - this.state.dragStart;
        const threshold = window.innerWidth * 0.2; // 20% of screen width
        
        this.elements.lightboxContent.classList.remove('swiping');
        this.elements.lightboxImage.style.transition = 'transform 0.3s ease';
        this.elements.lightboxImage.style.transform = '';
        
        if (Math.abs(delta) > threshold) {
            if (delta > 0 && this.state.currentPhotoIndex > 0) {
                this.showPrevPhoto();
            } else if (delta < 0 && this.state.currentPhotoIndex < this.state.currentAlbum.photos.length - 1) {
                this.showNextPhoto();
            }
        }
        
        this.state.isDragging = false;
        this.state.dragStart = null;
        this.state.dragPosition = null;
    }

    openAlbumView(album) {
        if (!this.elements.albumModal) {
            console.error('Album modal not found');
            return;
        }
        
        // Store the current scroll position
        this.state.scrollPosition = window.scrollY;
        
        console.log('Opening album view:', album.title);
        
        this.state.currentAlbum = album;
        this.elements.modalTitle.textContent = album.title;
        
        if (this.elements.photosGrid) {
            this.elements.photosGrid.innerHTML = album.photos.map((photo, index) => `
                <div class="photo-item" data-index="${index}">
                    <img src="${photo.url}" alt="${photo.alt || ''}" loading="lazy">
                    ${photo.caption ? `<div class="photo-caption">${photo.caption}</div>` : ''}
                </div>
            `).join('');

            // Add click handlers for lightbox
            this.elements.photosGrid.querySelectorAll('.photo-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.openLightbox(parseInt(item.dataset.index));
                });
            });
        }

        // Add modal-open class and set the scroll position
        document.body.classList.add('modal-open');
        document.body.style.top = `-${this.state.scrollPosition}px`;
        this.elements.albumModal.removeAttribute('hidden');
    }

    closeAlbumView() {
        if (!this.elements.albumModal) return;
        
        // Add a closing class to handle animation
        this.elements.albumModal.classList.add('modal-closing');
        
        // First, restore the scroll position instantly
        document.body.classList.remove('modal-open');
        document.body.style.top = '';
        window.scrollTo({
            top: this.state.scrollPosition,
            behavior: 'instant'  // Even more explicit than 'auto'
        });
        
        // Then hide the modal after a brief delay
        setTimeout(() => {
            this.elements.albumModal.classList.remove('modal-closing');
            this.elements.albumModal.hidden = true;
        }, 50); // Small delay to ensure scroll is restored first
    }

    openLightbox(index) {
        if (!this.elements.lightbox || !this.state.currentAlbum) return;
        
        this.state.currentPhotoIndex = index;
        this.showPhoto(index);
        
        // Use the same modal-open class for lightbox
        document.body.classList.add('modal-open');
        this.elements.lightbox.removeAttribute('hidden');
    }

    initializeLightboxControls() {
        // Close button
        const closeButton = this.elements.lightbox.querySelector('.close-button');
        closeButton?.addEventListener('click', () => this.closeLightbox());
        
        // Navigation buttons
        const prevButton = this.elements.lightbox.querySelector('.nav-button.prev');
        const nextButton = this.elements.lightbox.querySelector('.nav-button.next');
        
        prevButton?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.navigatePhoto('prev');
        });
        
        nextButton?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.navigatePhoto('next');
        });
        
        // Close on background click
        this.elements.lightbox.addEventListener('click', (e) => {
            if (e.target === this.elements.lightbox) {
                this.closeLightbox();
            }
        });
    }

    closeLightbox() {
        if (!this.elements.lightbox) return;
        
        // Remove modal-open class when closing lightbox
        document.body.classList.remove('modal-open');
        this.elements.lightbox.hidden = true;
    }

    navigatePhoto(direction) {
        if (!this.state.currentAlbum) return;
        
        const totalPhotos = this.state.currentAlbum.photos.length;
        let newIndex = this.state.currentPhotoIndex;
        
        if (direction === 'prev') {
            newIndex = (newIndex - 1 + totalPhotos) % totalPhotos;
        } else {
            newIndex = (newIndex + 1) % totalPhotos;
        }
        
        this.openLightbox(newIndex);
    }

    showPrevPhoto() {
        this.navigatePhoto('prev');
    }

    showNextPhoto() {
        this.navigatePhoto('next');
    }

    showPhoto(index) {
        const photo = this.state.currentAlbum.photos[index];
        if (!photo || !this.elements.lightboxImage) return;

        // Add fade out class
        this.elements.lightboxImage.classList.add('fade-out');

        // Wait for fade out transition
        setTimeout(() => {
            // Change source
            this.elements.lightboxImage.classList.add('fade-in');
            this.elements.lightboxImage.classList.remove('fade-out');
            this.elements.lightboxImage.src = photo.url;
            this.elements.lightboxImage.alt = photo.alt || '';

            // Once image is loaded, fade it in
            this.elements.lightboxImage.onload = () => {
                requestAnimationFrame(() => {
                    this.elements.lightboxImage.classList.remove('fade-in');
                });
            };
        }, 300); // Match transition duration

        this.updateNavigationButtons();
    }

    updateNavigationButtons() {
        if (this.elements.prevButton) {
            this.elements.prevButton.disabled = this.state.currentPhotoIndex === 0;
        }
        if (this.elements.nextButton) {
            this.elements.nextButton.disabled = 
                this.state.currentPhotoIndex === this.state.currentAlbum.photos.length - 1;
        }
    }
}

// Initialize preview when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('#gallery-preview')) {
        new GalleryPreviewController();
    }
});
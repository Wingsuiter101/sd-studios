// Utility function
const debounce = (func, wait) => {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

class GalleryController {
    constructor() {
        // Core elements
        this.elements = {
            mainGallery: document.querySelector('.photo-grid'),
            albumModal: document.getElementById('album-modal'),
            lightbox: document.getElementById('lightbox'),
            filterButtons: document.querySelectorAll('.photo-filter__btn'),
            heroImages: document.querySelectorAll('.hero-background-image'),
            dataScript: document.getElementById('photo-data'),
            footer: document.querySelector('footer'),
            filter: document.querySelector('.photo-filter'),
            lightboxContent: document.querySelector('.lightbox-content'),
            paginationContainer: document.querySelector('.pagination'),
        };

        // Initialize sub-elements
        if (this.elements.mainGallery) {
            this.elements.grid = this.elements.mainGallery;
            this.elements.items = this.elements.mainGallery.querySelectorAll('.photo-grid__item');
        }

        if (this.elements.albumModal) {
            this.elements.modalTitle = this.elements.albumModal.querySelector('.modal-title');
            this.elements.photosGrid = this.elements.albumModal.querySelector('.photos-grid');
            this.elements.backButton = this.elements.albumModal.querySelector('.back-button');
        }

        if (this.elements.lightbox) {
            this.elements.lightboxImage = this.elements.lightbox.querySelector('img');
            this.elements.closeButton = this.elements.lightbox.querySelector('.close-button');
            this.elements.prevButton = this.elements.lightbox.querySelector('.nav-button.prev');
            this.elements.nextButton = this.elements.lightbox.querySelector('.nav-button.next');
        }

        // State
        this.state = {
            currentAlbum: null,
            currentPhotoIndex: -1,
            currentHeroIndex: 0,
            heroRotationInterval: null,
            isMasonryLayout: window.innerWidth >= 1024,
            dragStart: null,
            dragPosition: null,
            isDragging: false,
            currentPage: 1,
            itemsPerPage: window.innerWidth >= 768 ? 8 : 5,
            scrollPosition: 0,
        };

        // Initialize gallery data
        this.galleryData = this.parseGalleryData();

        if (this.elements.mainGallery) {
            this.init();
        }

        // Add resize listener to update itemsPerPage
        window.addEventListener('resize', debounce(() => {
            const newItemsPerPage = window.innerWidth >= 768 ? 8 : 5;
            if (newItemsPerPage !== this.state.itemsPerPage) {
                this.state.itemsPerPage = newItemsPerPage;
                this.setupPagination();
            }
        }, 250));
    }

    parseGalleryData() {
        try {
            return this.elements.dataScript ? 
                JSON.parse(this.elements.dataScript.textContent) : 
                { albums: [] };
        } catch (error) {
            console.error('Error parsing gallery data:', error);
            return { albums: [] };
        }
    }

    init() {
        this.initializeLoadingState();
        this.initializeEventListeners();
        this.initializeFilters();
        this.initializeMasonryLayout();
        this.setupPagination();

        if (this.elements.heroImages.length > 1) {
            this.startHeroRotation();
        }
    }

    initializeLoadingState() {
        const images = this.elements.grid.querySelectorAll('img');
        let loadedImages = 0;

        const onImageLoad = () => {
            loadedImages++;
            if (loadedImages === images.length) {
                this.elements.grid.classList.add('loaded');
            }
        };

        images.forEach(img => {
            if (img.complete) {
                onImageLoad();
            } else {
                img.addEventListener('load', onImageLoad);
                img.addEventListener('error', onImageLoad);
            }
        });

        // Fallback
        setTimeout(() => {
            this.elements.grid.classList.add('loaded');
        }, 5000);
    }

    initializeEventListeners() {
        // Album clicks
        this.elements.items?.forEach(item => {
            item.addEventListener('click', () => {
                const albumId = item.dataset.albumId;
                const album = this.galleryData.albums.find(a => a.id === albumId);
                if (album) {
                    this.openAlbumView(album);
                }
            });
        });

        // Modal controls
        this.elements.backButton?.addEventListener('click', () => this.closeAlbumView());
        this.elements.closeButton?.addEventListener('click', () => this.closeLightbox());
        this.elements.prevButton?.addEventListener('click', () => this.showPrevPhoto());
        this.elements.nextButton?.addEventListener('click', () => this.showNextPhoto());

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.elements.lightbox?.hidden) return;
            
            switch(e.key) {
                case 'Escape': this.closeLightbox(); break;
                case 'ArrowLeft': this.showPrevPhoto(); break;
                case 'ArrowRight': this.showNextPhoto(); break;
            }
        });

        // Resize handler
        window.addEventListener('resize', debounce(() => {
            const wasDesktop = this.state.isMasonryLayout;
            this.state.isMasonryLayout = window.innerWidth >= 1024;
            
            if (wasDesktop !== this.state.isMasonryLayout) {
                this.initializeMasonryLayout();
            }
        }, 250));

        // Filter visibility
        const handleFilterVisibility = () => {
            if (!this.elements.filter || !this.elements.footer || window.innerWidth < 1024) {
                return;
            }

            const filterRect = this.elements.filter.getBoundingClientRect();
            const footerRect = this.elements.footer.getBoundingClientRect();
            const distance = footerRect.top - filterRect.bottom;
            const threshold = 100;
            
            const opacity = Math.max(0, distance / threshold);
            this.elements.filter.style.opacity = opacity;
            this.elements.filter.style.pointerEvents = opacity < 0.1 ? 'none' : 'auto';
        };

        const debouncedHandleVisibility = debounce(handleFilterVisibility, 10);
        window.addEventListener('scroll', debouncedHandleVisibility);
        window.addEventListener('resize', debouncedHandleVisibility);

        // Update modal click-outside handler with more specific handling
        this.elements.albumModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.albumModal) {
                e.preventDefault(); // Prevent any default scrolling
                e.stopPropagation(); // Stop event bubbling
                this.closeAlbumView();
            }
        });

        // Add scroll prevention on modal
        this.elements.albumModal?.addEventListener('scroll', (e) => {
            if (!this.elements.albumModal.contains(e.target)) {
                e.preventDefault();
            }
        });

        // Add both touch and mouse event listeners for lightbox
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

        // Add click outside handler for lightbox
        this.elements.lightbox?.addEventListener('click', (e) => {
            // Close only if clicking the backdrop (not the image or controls)
            if (e.target === this.elements.lightbox) {
                this.closeLightbox();
            }
        });

        // Prevent clicks on the image from closing the lightbox
        this.elements.lightboxContent?.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Prevent clicks on the controls from closing the lightbox
        this.elements.closeButton?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeLightbox();
        });

        this.elements.prevButton?.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        this.elements.nextButton?.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    openAlbumView(album) {
        if (!this.elements.albumModal) return;
        
        // Store the current scroll position
        this.state.scrollPosition = window.scrollY;
        
        this.state.currentAlbum = album;
        this.elements.modalTitle.textContent = album.title;
        
        if (this.elements.photosGrid) {
            this.elements.photosGrid.innerHTML = album.photos.map((photo, index) => `
                <div class="photo-item" data-index="${index}">
                    <img src="${photo.url}" alt="${photo.alt || ''}" loading="lazy">
                    ${photo.caption ? `<div class="photo-caption">${photo.caption}</div>` : ''}
                </div>
            `).join('');

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
        
        this.elements.lightbox.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeLightbox() {
        if (!this.elements.lightbox) return;
        this.elements.lightbox.hidden = true;
        document.body.style.overflow = '';
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

    showPrevPhoto() {
        if (this.state.currentPhotoIndex > 0) {
            this.showPhoto(this.state.currentPhotoIndex - 1);
            this.state.currentPhotoIndex--;
        }
    }

    showNextPhoto() {
        if (this.state.currentPhotoIndex < this.state.currentAlbum.photos.length - 1) {
            this.showPhoto(this.state.currentPhotoIndex + 1);
            this.state.currentPhotoIndex++;
        }
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

    startHeroRotation() {
        const visibleHeroImages = Array.from(this.elements.heroImages)
            .filter(img => img.offsetParent !== null && img.src && !img.src.endsWith('#'));

        if (visibleHeroImages.length > 1) {
            // Make first image active immediately
            visibleHeroImages[0].classList.add('active');
            
            // Reset the state
            this.state.currentHeroIndex = 0;
            
            // Clear any existing interval
            if (this.state.heroRotationInterval) {
                clearInterval(this.state.heroRotationInterval);
            }
            
            // Start new rotation with longer interval (8 seconds)
            this.state.heroRotationInterval = setInterval(() => {
                const currentIndex = this.state.currentHeroIndex;
                const nextIndex = (currentIndex + 1) % visibleHeroImages.length;
                
                visibleHeroImages[nextIndex].classList.add('active');
                
                setTimeout(() => {
                    visibleHeroImages[currentIndex].classList.remove('active');
                }, 1000);
                
                this.state.currentHeroIndex = nextIndex;
            }, 8000); // Increased from 5000 to 8000
        }
    }

    initializeFilters() {
        this.elements.filterButtons?.forEach(button => {
            button.addEventListener('click', () => {
                this.elements.filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                this.filterGallery(button.dataset.filter);
            });
        });
    }

    filterGallery(category) {
        if (!this.elements.items) return;

        this.elements.grid = this.elements.mainGallery;
        this.elements.items = this.elements.grid.querySelectorAll('.photo-grid__item');

        this.elements.grid.classList.add('filtering');
        
        // Reset to first page when filtering
        this.state.currentPage = 1;
        
        // Fade out all items first
        this.elements.items.forEach(item => {
            item.classList.add('fade-out');
        });

        // Wait for fade out
        setTimeout(() => {
            // Update visibility based on both filter and pagination
            this.elements.items.forEach((item, index) => {
                const matchesFilter = category === 'all' || category === item.dataset.category;
                item.classList.toggle('filter-hidden', !matchesFilter);
                
                // Only count visible items for pagination
                if (matchesFilter) {
                    const visibleIndex = Array.from(this.elements.items)
                        .filter(i => !i.classList.contains('filter-hidden'))
                        .indexOf(item);
                    
                    const startIndex = (this.state.currentPage - 1) * this.state.itemsPerPage;
                    const endIndex = startIndex + this.state.itemsPerPage;
                    
                    const isInPage = visibleIndex >= startIndex && visibleIndex < endIndex;
                    item.classList.toggle('hidden', !isInPage);
                    
                    if (isInPage) {
                        setTimeout(() => {
                            item.classList.remove('fade-out');
                        }, 50 * visibleIndex);
                    }
                } else {
                    item.classList.add('hidden');
                }
            });

            // Update masonry layout
            if (this.state.isMasonryLayout) {
                requestAnimationFrame(() => {
                    this.updateMasonryLayout();
                });
            }

            // Update pagination based on filtered items
            this.setupPagination();
        }, 300);

        // Cleanup
        setTimeout(() => {
            this.elements.grid.classList.remove('filtering');
        }, 600);
    }

    initializeMasonryLayout() {
        if (!this.elements.grid) return;

        if (this.state.isMasonryLayout) {
            this.elements.grid.style.display = 'block';
            
            const images = this.elements.grid.querySelectorAll('img');
            images.forEach(img => {
                if (img.complete) {
                    this.updateMasonryLayout();
                } else {
                    img.addEventListener('load', () => this.updateMasonryLayout());
                }
            });
        } else {
            this.elements.grid.style.removeProperty('display');
        }
    }

    updateMasonryLayout() {
        if (!this.state.isMasonryLayout) return;
        
        requestAnimationFrame(() => {
            this.elements.grid.style.columnCount = '2';
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

    setupPagination() {
        if (!this.galleryData.albums) return;

        // Count only visible (not filtered out) items
        const visibleItems = Array.from(this.elements.items)
            .filter(item => !item.classList.contains('filter-hidden')).length;
        
        const totalPages = Math.ceil(visibleItems / this.state.itemsPerPage);

        if (totalPages <= 1) {
            this.elements.paginationContainer.innerHTML = '';
            return;
        }

        this.elements.paginationContainer.innerHTML = `
            <button class="pagination__btn prev" ${this.state.currentPage === 1 ? 'disabled' : ''}>
                Previous
            </button>
            <span class="pagination__info">Page ${this.state.currentPage} of ${totalPages}</span>
            <button class="pagination__btn next" ${this.state.currentPage === totalPages ? 'disabled' : ''}>
                Next
            </button>
        `;

        // Add event listeners
        this.elements.paginationContainer.querySelector('.prev')?.addEventListener('click', () => {
            if (this.state.currentPage > 1) {
                this.changePage(this.state.currentPage - 1);
            }
        });

        this.elements.paginationContainer.querySelector('.next')?.addEventListener('click', () => {
            if (this.state.currentPage < totalPages) {
                this.changePage(this.state.currentPage + 1);
            }
        });

        this.updateGalleryView();
    }

    changePage(newPage) {
        // Prevent default scroll behavior
        event?.preventDefault();
        
        this.state.currentPage = newPage;
        
        // Fade out current items
        const currentItems = Array.from(this.elements.items)
            .filter(item => !item.classList.contains('hidden'));
        
        currentItems.forEach(item => {
            item.classList.add('fade-out');
        });

        // Smooth scroll to gallery heading instead
        document.querySelector('.gallery-heading').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });

        // Wait for fade out, then update view
        setTimeout(() => {
            this.updateGalleryView();
            this.setupPagination();
        }, 300);
    }

    updateGalleryView() {
        const visibleItems = Array.from(this.elements.items)
            .filter(item => !item.classList.contains('filter-hidden'));
        
        const startIndex = (this.state.currentPage - 1) * this.state.itemsPerPage;
        const endIndex = startIndex + this.state.itemsPerPage;
        
        visibleItems.forEach((item, index) => {
            if (index >= startIndex && index < endIndex) {
                item.classList.add('hidden');
                item.classList.add('fade-out');
                
                // Stagger the animations
                setTimeout(() => {
                    item.classList.remove('hidden');
                    requestAnimationFrame(() => {
                        item.classList.remove('fade-out');
                    });
                }, 50 * (index % this.state.itemsPerPage));
            } else {
                item.classList.add('hidden');
            }
        });

        // Update masonry layout
        if (this.state.isMasonryLayout) {
            requestAnimationFrame(() => {
                this.updateMasonryLayout();
            });
        }
    }
}

// Initialize gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GalleryController();
});
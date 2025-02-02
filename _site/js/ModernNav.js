class Navigation {
  constructor() {
    // Core elements
    this.header = document.querySelector('.main-header');
    this.mobileToggle = document.querySelector('.main-header__mobile-toggle');
    this.navWrapper = document.querySelector('.main-header__nav-wrapper');
    
    // Carousel specific elements
    this.carousel = document.querySelector('.main-header__carousel');
    this.carouselList = this.carousel?.querySelector('.main-header__carousel-list');
    this.carouselItems = document.querySelectorAll('.main-header__carousel-item:not(.main-header__clone)');
    this.upArrow = document.querySelector('.main-header__scroll-up');
    this.downArrow = document.querySelector('.main-header__scroll-down');
    
    // State
    this.isOpen = false;
    this.isScrolling = false;
    this.currentIndex = 2;
    this.itemHeight = 100;
    this.totalItems = document.querySelectorAll('.main-header__carousel-item:not(.main-header__clone)').length;
    this.visibleItems = 3;
    this.transitionDuration = 600;
    
    this.touchStartY = 0;
    this.touchEndY = 0;
    this.touchMoveY = 0;
    this.isDragging = false;
    this.dragThreshold = 50;

    this.mediaQuery = window.matchMedia('(min-width: 1024px)');

    // Check if device has touch capability
    this.isTouchDevice = window.matchMedia('(hover: none)').matches;

    this.init();
  }

  init() {
    if (!this.header || !this.mobileToggle) return;
    this.bindEvents();
    
    if (this.carousel) {
      this.initCarousel();
      this.initTouchEvents();
    }

    // Initial check for screen size
    this.handleResize();
  }

  bindEvents() {
    // Mobile menu toggle
    this.mobileToggle.addEventListener('click', () => this.toggleMenu());

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeMenu();
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.header.contains(e.target)) {
        this.closeMenu();
      }
    });

    // Carousel navigation
    if (this.upArrow && this.downArrow) {
      this.upArrow.addEventListener('click', () => this.scroll('up'));
      this.downArrow.addEventListener('click', () => this.scroll('down'));
    }

    // Add resize handler
    window.addEventListener('resize', () => {
      this.handleResize();
    });

    // Add media query change handler
    this.mediaQuery.addListener(() => {
      this.handleResize();
    });
  }

  initCarousel() {
    const firstItem = this.carouselItems[0];
    if (firstItem) {
      this.itemHeight = firstItem.offsetHeight;
      this.updateCarouselPosition();
    }

    // Add click handler for all carousel links
    this.carouselItems.forEach(item => {
      const link = item.querySelector('.main-header__carousel-link');
      if (link) {
        // For touch devices
        if (this.isTouchDevice) {
          let touchStartTime = 0;
          let touchEndTime = 0;
          let touchStartY = 0;
          let touchEndY = 0;
          
          link.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            touchStartY = e.touches[0].clientY;
          });
          
          link.addEventListener('touchend', (e) => {
            touchEndTime = Date.now();
            touchEndY = e.changedTouches[0].clientY;
            
            const touchDuration = touchEndTime - touchStartTime;
            const touchDistance = Math.abs(touchEndY - touchStartY);
            
            // Only treat as a tap if:
            // 1. Touch duration is short (< 200ms)
            // 2. Touch distance is small (< 10px)
            // 3. Menu is open
            if (touchDuration < 200 && touchDistance < 10 && this.isOpen) {
              e.preventDefault();
              e.stopPropagation();
              
              // Double check we're using the correct href
              const actualHref = e.currentTarget.getAttribute('href');
              window.location = actualHref;
            }
          });
        } else {
          // For non-touch devices
          link.addEventListener('click', (e) => {
            if (this.isOpen) {
              e.preventDefault();
              const actualHref = e.currentTarget.getAttribute('href');
              window.location = actualHref;
            }
          });
        }
      }
    });

    // Ensure correct active state on page load
    this.carouselItems.forEach(item => {
      const link = item.querySelector('.main-header__carousel-link');
      if (link) {
        const href = link.getAttribute('href');
        const currentPath = window.location.pathname;
        
        // More precise path matching
        const normalizedHref = href.replace('/index.html', '/');
        const normalizedPath = currentPath.replace('/index.html', '/');
        
        if (normalizedHref === normalizedPath) {
          item.classList.add('active');
          this.activeIndex = Array.from(this.carouselItems).indexOf(item);
          this.updateCarouselPosition();
        }
      }
    });
  }

  initTouchEvents() {
    // Touch/mouse events only for touch devices
    if (this.isTouchDevice) {
      this.carousel.addEventListener('touchstart', this.handleTouchStart.bind(this));
      this.carousel.addEventListener('touchmove', this.handleTouchMove.bind(this));
      this.carousel.addEventListener('touchend', this.handleTouchEnd.bind(this));
      
      // Optional: Support for mouse events on touch devices
      this.carousel.addEventListener('mousedown', this.handleTouchStart.bind(this));
      document.addEventListener('mousemove', this.handleTouchMove.bind(this));
      document.addEventListener('mouseup', this.handleTouchEnd.bind(this));
    }
  }

  handleTouchStart(e) {
    // Only proceed if it's a touch device
    if (!this.isTouchDevice) return;
    
    if (this.isScrolling) return;
    this.isDragging = true;
    this.touchStartY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
    this.carousel.style.cursor = 'grabbing';
    
    // Remove transition during drag
    this.carouselList.style.transition = 'none';
  }

  handleTouchMove(e) {
    if (!this.isTouchDevice || !this.isDragging) return;
    
    e.preventDefault();
    
    this.touchMoveY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
    const diff = this.touchMoveY - this.touchStartY;
    
    // Calculate drag percentage (0 to 1)
    const dragPercent = Math.min(Math.abs(diff) / this.itemHeight, 1);
    
    // Update positions based on drag
    const allItems = document.querySelectorAll('.main-header__carousel-item');
    allItems.forEach((item, index) => {
      const normalizedIndex = index - 2;
      const distance = normalizedIndex - (this.currentIndex - 2);
      
      if (Math.abs(distance) <= 1) {
        item.classList.add('visible');
        const offset = (distance * this.itemHeight) + (diff * dragPercent);
        
        // Set z-index based on drag direction and position
        if (diff > 0) { // Dragging upwards
          item.style.zIndex = distance <= 0 ? 2 : 1;
        } else { // Dragging downwards
          item.style.zIndex = distance >= 0 ? 2 : 1;
        }
        
        // For the active item (distance === 0)
        if (distance === 0) {
          const scale = 1 - (Math.abs(diff) / (this.itemHeight * 2));
          const transform = `
            translateY(${diff * dragPercent}px) 
            scale(${Math.max(scale, 0.8)})
          `;
          item.style.transform = transform;
          item.style.opacity = Math.max(1 - (Math.abs(diff) / (this.itemHeight)), 0.4);
        } else {
          item.style.setProperty('--offset', `${offset}px`);
          
          const progressToCenter = 1 - Math.abs(offset) / this.itemHeight;
          if (progressToCenter > 0) {
            const scale = 0.8 + (progressToCenter * 0.2);
            const opacity = 0.4 + (progressToCenter * 0.6);
            const fontSize = 2 + (progressToCenter * 1.5);
            
            item.style.transform = `scale(${scale})`;
            item.style.opacity = opacity;
            item.querySelector('.main-header__carousel-link').style.fontSize = `${fontSize}rem`;
          }
        }
      }
    });
  }

  handleTouchEnd(e) {
    if (!this.isTouchDevice || !this.isDragging) return;
    this.isDragging = false;
    this.carousel.style.cursor = '';
    
    // Reset all styles
    const items = document.querySelectorAll('.main-header__carousel-item');
    items.forEach(item => {
      item.style.transform = '';
      item.style.opacity = '';
      item.style.zIndex = ''; // Reset z-index
      const link = item.querySelector('.main-header__carousel-link');
      if (link) link.style.fontSize = '';
    });
    
    // Restore transition
    this.carouselList.style.transition = '';
    
    const diff = this.touchMoveY - this.touchStartY;
    
    if (Math.abs(diff) > this.dragThreshold) {
      // Complete the scroll in the drag direction
      this.scroll(diff > 0 ? 'up' : 'down');
    } else {
      // Snap back to original position
      this.updateCarouselPosition();
    }
  }

  async scroll(direction) {
    if (this.isScrolling) return;
    this.isScrolling = true;
    
    // Handle loop points
    if (direction === 'up' && this.currentIndex <= 2) {
      // Going up from Home
      this.carouselList.style.transition = 'none';
      this.currentIndex = this.totalItems + 2;
      this.updateCarouselPosition();
      
      // Force reflow
      this.carouselList.offsetHeight;
      
      this.carouselList.style.transition = `transform ${this.transitionDuration}ms cubic-bezier(0.33, 1, 0.68, 1)`;
      this.currentIndex--;
      this.updateCarouselPosition();
      
    } else if (direction === 'down' && this.currentIndex >= this.totalItems + 1) {
      // Going down from Connect
      this.carouselList.style.transition = 'none';
      this.currentIndex = 1;
      this.updateCarouselPosition();
      
      // Force reflow
      this.carouselList.offsetHeight;
      
      this.carouselList.style.transition = `transform ${this.transitionDuration}ms cubic-bezier(0.33, 1, 0.68, 1)`;
      this.currentIndex++;
      this.updateCarouselPosition();
      
    } else {
      // Normal scroll
      this.carouselList.style.transition = `transform ${this.transitionDuration}ms cubic-bezier(0.33, 1, 0.68, 1)`;
      if (direction === 'up') {
        this.currentIndex--;
      } else {
        this.currentIndex++;
      }
      this.updateCarouselPosition();
    }

    // Reset scrolling state after everything is complete
    setTimeout(() => {
      this.isScrolling = false;
      this.carouselList.style.transition = `transform ${this.transitionDuration}ms cubic-bezier(0.33, 1, 0.68, 1)`;
    }, this.transitionDuration + 50);
  }

  toggleMenu() {
    this.isOpen = !this.isOpen;
    this.header.classList.add('is-animating');
    this.header.classList.toggle('menu-open');
    document.body.classList.toggle('menu-open');
    this.mobileToggle.setAttribute('aria-expanded', this.isOpen);
    
    // Set active item when opening menu
    if (this.isOpen && this.carousel) {
      // Find the current page URL path
      const currentPath = window.location.pathname;
      
      // Find matching carousel item
      const matchingItem = Array.from(this.carouselItems).findIndex(item => {
        const link = item.querySelector('a');
        return link && link.getAttribute('href') === currentPath;
      });
      
      // If found, update the carousel position
      if (matchingItem !== -1) {
        this.currentIndex = matchingItem + 2; // Add 2 to account for clones
        this.updateCarouselPosition();
      }
    }
    
    setTimeout(() => {
      this.header.classList.remove('is-animating');
    }, 300);
  }

  closeMenu() {
    this.isOpen = false;
    this.header.classList.remove('menu-open');
    document.body.classList.remove('menu-open');
    this.mobileToggle.setAttribute('aria-expanded', 'false');
  }

  handleResize() {
    // Add transition blocker
    this.header.classList.add('resize-transition-block');

    if (this.mediaQuery.matches) {
      // Desktop view
      this.header.classList.remove('is-animating');
      this.isOpen = false;
      this.closeMenu();
    } else {
      // Mobile view - reset state
      this.isOpen = false;
      this.header.classList.remove('menu-open');
      document.body.classList.remove('menu-open');
      this.mobileToggle.setAttribute('aria-expanded', 'false');
    }

    // Recalculate carousel item height if needed
    if (this.carousel) {
      const firstItem = this.carouselItems[0];
      if (firstItem) {
        this.itemHeight = firstItem.offsetHeight;
        this.updateCarouselPosition();
      }
    }

    // Remove transition blocker after a short delay
    setTimeout(() => {
      this.header.classList.remove('resize-transition-block');
    }, 100);
  }

  updateCarouselPosition() {
    if (!this.carousel || !this.carouselList) return;
    
    const allItems = document.querySelectorAll('.main-header__carousel-item');
    allItems.forEach((item, index) => {
      item.classList.remove('visible', 'active');
      item.style.zIndex = '';
      item.style.setProperty('--offset', '0');
      
      const normalizedIndex = index - 2;
      const distance = normalizedIndex - (this.currentIndex - 2);
      
      // Handle loop points
      if (this.currentIndex === 2) { // At "Home"
        if (index === this.totalItems + 1) { // Connect above
          item.classList.add('visible');
          item.style.setProperty('--offset', `${-this.itemHeight}px`);
          item.style.zIndex = '1';
        } else if (index === 2) { // Home (active)
          item.classList.add('visible', 'active');
          item.style.setProperty('--offset', '0');
          item.style.zIndex = '2';
        } else if (index === 3) { // About below
          item.classList.add('visible');
          item.style.setProperty('--offset', `${this.itemHeight}px`);
          item.style.zIndex = '1';
        }
      } else if (this.currentIndex === this.totalItems + 1) { // At "Connect"
        if (index === this.totalItems) { // Gallery above
          item.classList.add('visible');
          item.style.setProperty('--offset', `${-this.itemHeight}px`);
          item.style.zIndex = '1';
        } else if (index === this.totalItems + 1) { // Connect (active)
          item.classList.add('visible', 'active');
          item.style.setProperty('--offset', '0');
          item.style.zIndex = '2';
        } else if (index === 2) { // Home below
          item.classList.add('visible');
          item.style.setProperty('--offset', `${this.itemHeight}px`);
          item.style.zIndex = '1';
        }
      } else {
        // Normal visibility handling - only show 3 items
        if (Math.abs(distance) <= 1) {
          item.classList.add('visible');
          item.style.setProperty('--offset', `${distance * this.itemHeight}px`);
          
          if (distance === 0) {
            item.classList.add('active');
            item.style.zIndex = '2';
          } else {
            item.style.zIndex = '1';
          }
        }
      }
    });
  }

  updateActiveItem(index) {
    this.carouselItems.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  const navigation = new Navigation();
});
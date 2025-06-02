const header = document.querySelector('.main-header');
const menuToggle = document.querySelector('.nav__menu-toggle i');
const navContainer = document.querySelector('.nav__container');

// Set active nav link based on current URL
function setActivePage() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav__link').forEach(link => {
        // Remove current from all links
        link.removeAttribute('aria-current');
        
        // Get the link's path
        const linkPath = link.getAttribute('href');
        
        // Check if this link matches current path
        if (linkPath === currentPath || 
            (currentPath === '/' && linkPath === '/') ||
            (linkPath !== '/' && currentPath.includes(linkPath))) {
            link.setAttribute('aria-current', 'page');
        }
    });
}

// Run setActivePage on load
setActivePage();

// Scroll handler
if (header) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// Add animation triggers for elements that should animate on scroll
document.addEventListener('DOMContentLoaded', () => {
    // Check if the page has the hero section (homepage)
    const heroSection = document.querySelector('.sd-hero');
    
    if (heroSection) {
        // We're on the homepage, initialize the scroll animations
        initScrollAnimations();
    }

    // Add parallax effect to the hero image
    const heroImage = document.querySelector('.sd-hero__image');
    if (heroImage) {
        addParallaxEffect(heroImage);
    }
});

// Initialize scroll-triggered animations
function initScrollAnimations() {
    // Create an Intersection Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // If the element is in view
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                // Unobserve after animation is triggered
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15, // Trigger when at least 15% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Adjust trigger point to be slightly above the bottom of viewport
    });

    // Elements to observe
    const animatedSections = [
        '#about',
        '#projects',
        '#resources-banner',
        '#gallery-preview',
        '.footer'
    ];

    // Observe each element
    animatedSections.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => observer.observe(el));
    });
}

// Add a parallax effect to the hero image
function addParallaxEffect(element) {
    const speedFactor = 0.15;
    
    window.addEventListener('scroll', () => {
        // Only apply parallax effect if not on mobile
        if (window.innerWidth >= 768) {
            const scrollY = window.scrollY;
            const translateY = scrollY * speedFactor;
            
            // Apply transform with a max limit
            if (translateY < 100) {
                element.style.transform = `translateY(${translateY}px)`;
            }
        } else {
            // Reset transform on mobile
            element.style.transform = 'none';
        }
    });
}

// Add subtle hover effect to project cards
document.addEventListener('DOMContentLoaded', () => {
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            // Skip effect on mobile
            if (window.innerWidth < 1024) return;
            
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element
            const y = e.clientY - rect.top;  // y position within the element
            
            // Calculate rotation based on mouse position
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Limit the rotation to a subtle amount
            const rotateX = ((y - centerY) / centerY) * 3;  // max 3 degrees
            const rotateY = ((centerX - x) / centerX) * 3;  // max 3 degrees
            
            // Apply the transformation
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        
        card.addEventListener('mouseleave', () => {
            // Reset the transform when mouse leaves the card
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
        });
    });
});

// Check for reduced motion preference
document.addEventListener('DOMContentLoaded', () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
        // Add a class to the body to disable animations in CSS
        document.body.classList.add('reduced-motion');
    }
});



document.addEventListener('DOMContentLoaded', function() {
    // Find all images and iframes
    const mediaElements = document.querySelectorAll('img, iframe');
    
    const loadingPlaceholder = `
        <div class="loading-placeholder">
            <div class="loading-spinner"></div>
        </div>
    `;

    // Create IntersectionObserver
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                
                // If it's an image that needs lazy loading
                if (element.tagName.toLowerCase() === 'img' && !element.hasAttribute('loading')) {
                    element.setAttribute('loading', 'lazy');
                    
                    // Add loading class for animation
                    element.classList.add('loading');
                    
                    // When image loads, remove loading class
                    element.onload = () => {
                        element.classList.remove('loading');
                        element.classList.add('loaded');
                    };
                }
                
                // If it's an iframe that needs lazy loading
                if (element.tagName.toLowerCase() === 'iframe' && !element.hasAttribute('loading')) {
                    element.setAttribute('loading', 'lazy');
                    
                    // Add placeholder if parent doesn't have one
                    if (!element.parentElement.querySelector('.loading-placeholder')) {
                        const wrapper = document.createElement('div');
                        wrapper.className = 'iframe-container';
                        element.parentNode.insertBefore(wrapper, element);
                        wrapper.appendChild(element);
                        wrapper.insertAdjacentHTML('afterbegin', loadingPlaceholder);
                    }
                    
                    // When iframe loads, add loaded class to container
                    element.onload = () => {
                        element.parentElement.classList.add('loaded');
                    };
                }
                
                // Stop observing after handling
                observer.unobserve(element);
            }
        });
    }, {
        rootMargin: '50px 0px', // Start loading slightly before element comes into view
        threshold: 0.1
    });

    // Observe all media elements
    mediaElements.forEach(element => {
        observer.observe(element);
    });
});
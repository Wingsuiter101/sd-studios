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



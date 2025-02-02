document.addEventListener('DOMContentLoaded', () => {
    const galleryImages = document.querySelectorAll('.gallery-img');
    
    galleryImages.forEach(img => {
      img.addEventListener('click', () => {
        const fullImg = img.getAttribute('data-full-img');
        const overlay = document.createElement('div');
        overlay.className = 'image-overlay';
        overlay.innerHTML = `
          <div class="overlay-content">
            <button class="close-overlay">×</button>
            <img src="${fullImg}" alt="${img.alt}">
          </div>
        `;
        
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        
        overlay.addEventListener('click', (e) => {
          if (e.target.classList.contains('image-overlay') || 
              e.target.classList.contains('close-overlay')) {
            document.body.removeChild(overlay);
            document.body.style.overflow = '';
          }
        });
      });
    });
  });
document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.querySelector('.projects-carousel');
    const track = document.querySelector('.projects-track');
    const slides = Array.from(document.querySelectorAll('.project-slide'));
    const dotsNav = document.querySelector('.carousel-dots');
    const prevButton = document.querySelector('.carousel-prev');
    const nextButton = document.querySelector('.carousel-next');

    // Clone slides for infinite loop on desktop
    if (window.innerWidth >= 768) {
        // Clone first three slides and append to end
        slides.slice(0, 3).forEach(slide => {
            const clone = slide.cloneNode(true);
            track.appendChild(clone);
        });
        
        // Clone last three slides and prepend to start
        slides.slice(-3).reverse().forEach(slide => {
            const clone = slide.cloneNode(true);
            track.insertBefore(clone, track.firstChild);
        });
    }

    // Re-query slides after cloning
    const allSlides = Array.from(document.querySelectorAll('.project-slide'));
    let currentIndex = window.innerWidth >= 768 ? 3 : 0; // Start at index 3 (first real slide) on desktop

    // Create dots (only for original slides)
    slides.forEach((_, idx) => {
        const dot = document.createElement('button');
        dot.classList.add('carousel-dot');
        dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
        dotsNav.appendChild(dot);
    });

    const dots = Array.from(document.querySelectorAll('.carousel-dot'));
    
    // Mobile touch events
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let isDragging = false;

    if (window.innerWidth < 768) {
        track.addEventListener('pointerdown', pointerDown);
        track.addEventListener('pointermove', pointerMove);
        track.addEventListener('pointerup', pointerUp);
        track.addEventListener('pointerleave', pointerUp);
    }

    function pointerDown(event) {
        isDragging = true;
        startX = event.clientX;
        event.target.closest('.project-slide')?.classList.add('is-dragging');
    }

    function pointerMove(event) {
        if (!isDragging) return;

        const currentX = event.clientX;
        const diff = currentX - startX;
        const slideWidth = allSlides[0].offsetWidth;
        const movePercent = (diff / slideWidth) * 100;
        
        currentTranslate = prevTranslate + movePercent;
        updateSlidePosition(currentTranslate);
    }

    function pointerUp(event) {
        if (!isDragging) return;
        isDragging = false;
        
        allSlides.forEach(slide => slide.classList.remove('is-dragging'));
        
        const moveDistance = event.clientX - startX;
        const slideWidth = allSlides[0].offsetWidth;
        const moveThreshold = slideWidth * 0.2;

        if (Math.abs(moveDistance) > moveThreshold) {
            if (moveDistance > 0 && currentIndex > 0) {
                navigate('prev');
            } else if (moveDistance < 0 && currentIndex < allSlides.length - 1) {
                navigate('next');
            }
        }

        goToSlide(currentIndex);
    }

    function updateSlidePosition(percent) {
        const isDesktop = window.innerWidth >= 768;
        track.style.transform = `translateX(${percent}%)`;
        
        if (isDesktop) {
            allSlides.forEach((slide, index) => {
                slide.classList.remove('active');
            });
            
            // Calculate center slide index
            const centerIndex = currentIndex + 1;
            if (allSlides[centerIndex]) {
                allSlides[centerIndex].classList.add('active');
            }
        }

        // Update dots based on visible slides (not clones)
        const actualIndex = Math.max(0, Math.min(slides.length - 1, 
            isDesktop ? currentIndex - 3 : currentIndex));
        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === actualIndex);
        });
    }

    function navigate(direction) {
        const isDesktop = window.innerWidth >= 768;
        
        if (direction === 'prev') {
            currentIndex--;
            if (isDesktop && currentIndex < 2) { // Loop to end
                currentIndex = allSlides.length - 4;
                track.style.transition = 'none';
                const percent = -(currentIndex * (isDesktop ? 33.333 : 100));
                updateSlidePosition(percent);
                // Force reflow
                track.offsetHeight;
                track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            }
        } else {
            currentIndex++;
            if (isDesktop && currentIndex > allSlides.length - 4) { // Loop to start
                currentIndex = 3;
                track.style.transition = 'none';
                const percent = -(currentIndex * (isDesktop ? 33.333 : 100));
                updateSlidePosition(percent);
                // Force reflow
                track.offsetHeight;
                track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            }
        }
        
        goToSlide(currentIndex);
    }

    function goToSlide(index) {
        currentIndex = index;
        const isDesktop = window.innerWidth >= 768;
        const slideWidth = isDesktop ? 33.333 : 100;
        const percent = -(currentIndex * slideWidth);
        
        track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        updateSlidePosition(percent);
        prevTranslate = percent;
    }

    // Event Listeners
    if (prevButton && nextButton) {
        prevButton.addEventListener('click', () => navigate('prev'));
        nextButton.addEventListener('click', () => navigate('next'));
    }

    dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => {
            const isDesktop = window.innerWidth >= 768;
            goToSlide(isDesktop ? idx + 3 : idx);
        });
    });

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const isDesktop = window.innerWidth >= 768;
            currentIndex = isDesktop ? 3 : 0;
            goToSlide(currentIndex);
        }, 250);
    });

    // Initialize
    goToSlide(currentIndex);
});
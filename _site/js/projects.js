document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.projects-carousel');
    const track = carousel.querySelector('.projects-track');
    const slides = carousel.querySelectorAll('.project-slide');
    const prevButton = carousel.querySelector('.carousel-prev');
    const nextButton = carousel.querySelector('.carousel-next');
    const dotsNav = carousel.querySelector('.carousel-dots');
  
    let currentIndex = 0;
    let startX;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let isDragging = false;
    let startPos = 0;
  
    // Calculate slides per view
    const getSlidesPerView = () => window.innerWidth >= 768 ? 2 : 1;
  
    // Calculate total number of slides and possible positions
    const getTotalSlides = () => slides.length;
    const getMaxIndex = () => Math.max(0, getTotalSlides() - getSlidesPerView());
  
    // Initialize dots
    const updateDots = () => {
      dotsNav.innerHTML = '';
      const numDots = Math.ceil(getTotalSlides() / getSlidesPerView());
  
      for (let i = 0; i < numDots; i++) {
        const dot = document.createElement('button');
        dot.setAttribute('aria-label', `Go to slide group ${i + 1}`);
        dot.classList.add('carousel-dot');
        const slideIndex = i * getSlidesPerView();
        if (slideIndex <= currentIndex && currentIndex < slideIndex + getSlidesPerView()) {
          dot.classList.add('active');
        }
        dot.addEventListener('click', () => {
          currentIndex = slideIndex;
          updateCarousel();
        });
        dotsNav.appendChild(dot);
      }
    };
  
    function getPositionX(event) {
      return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
    }
  
    function setSliderPosition() {
      track.style.transform = `translateX(${currentTranslate}%)`;
    }
  
    function setPositionByIndex() {
      const slideWidth = 100 / getSlidesPerView();
      currentTranslate = currentIndex * -slideWidth;
      prevTranslate = currentTranslate;
      setSliderPosition();
    }
  
    // Update carousel state
    const updateCarousel = () => {
      setPositionByIndex();
  
      // Update slide visibility
      slides.forEach((slide, index) => {
        const slidesPerView = getSlidesPerView();
        if (index < currentIndex || index >= currentIndex + slidesPerView) {
          slide.classList.add('hide-upcoming');
        } else {
          slide.classList.remove('hide-upcoming');
        }
      });
  
      // Update dots
      const dots = dotsNav.querySelectorAll('.carousel-dot');
      dots.forEach((dot, index) => {
        const slideIndex = index * getSlidesPerView();
        dot.classList.toggle('active', slideIndex <= currentIndex && currentIndex < slideIndex + getSlidesPerView());
      });
  
      // Update button states
      if (prevButton) {
        prevButton.disabled = currentIndex === 0;
      }
      if (nextButton) {
        nextButton.disabled = currentIndex >= getMaxIndex();
      }
    };
  
    // Touch events
    function touchStart(event) {
      startPos = getPositionX(event);
      isDragging = true;
      startX = getPositionX(event);
  
      track.classList.add('grabbing');
      track.style.cursor = 'grabbing';
      track.style.transition = 'none';
    }
  
    function touchMove(event) {
      if (isDragging) {
        const currentPosition = getPositionX(event);
        const diff = (startPos - currentPosition) / carousel.offsetWidth * 100;
        currentTranslate = prevTranslate - diff;
  
        // Add resistance at edges
        if (currentTranslate > 0) {
          currentTranslate = currentTranslate * 0.3;
        } else {
          const maxTranslate = -getMaxIndex() * (100 / getSlidesPerView());
          if (currentTranslate < maxTranslate) {
            const overflow = currentTranslate - maxTranslate;
            currentTranslate = maxTranslate + overflow * 0.3;
          }
        }
  
        setSliderPosition();
      }
    }
  
    function touchEnd() {
      isDragging = false;
      const movedBy = currentTranslate - prevTranslate;
  
      track.classList.remove('grabbing');
      track.style.cursor = 'grab';
      track.style.transition = 'transform 0.3s ease-out';
  
      // Determine if slide should advance
      if (Math.abs(movedBy) > 20) { // 20% threshold for slide advance
        if (movedBy > 0 && currentIndex > 0) {
          currentIndex--;
        } else if (movedBy < 0 && currentIndex < getMaxIndex()) {
          currentIndex++;
        }
      }
  
      updateCarousel();
    }
  
    // Event Listeners
    track.addEventListener('mousedown', touchStart);
    track.addEventListener('touchstart', touchStart);
    track.addEventListener('mousemove', touchMove);
    track.addEventListener('touchmove', touchMove);
    track.addEventListener('mouseup', touchEnd);
    track.addEventListener('touchend', touchEnd);
    track.addEventListener('mouseleave', touchEnd);
  
    // Navigation buttons
    if (prevButton) {
      prevButton.addEventListener('click', () => {
        if (currentIndex > 0) {
          currentIndex--;
          updateCarousel();
        }
      });
    }
  
    if (nextButton) {
      nextButton.addEventListener('click', () => {
        if (currentIndex < getMaxIndex()) {
          currentIndex++;
          updateCarousel();
        }
      });
    }
  
    // Handle window resize
    window.addEventListener('resize', () => {
      updateDots();
      // Ensure current index is valid after resize
      currentIndex = Math.min(currentIndex, getMaxIndex());
      updateCarousel();
    });
  
    // Initialize carousel
    updateDots();
    updateCarousel();
  });
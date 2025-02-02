// ProjectsCarousel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ProjectsCarousel = () => {
  const [projects, setProjects] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slidesToShow, setSlidesToShow] = useState(1);
  const trackRef = useRef(null);
  const transitionRef = useRef(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        console.log('Loading projects...');
        const response = await window.fs.readFile('projects.json', { encoding: 'utf8' });
        console.log('Response received:', response.slice(0, 100) + '...'); // Log first 100 chars
        const data = JSON.parse(response);
        console.log('Parsed data:', data.length + ' projects found');
        setProjects(data.slice(0, 6));
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };
    loadProjects();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSlidesToShow(3);
      } else if (window.innerWidth >= 768) {
        setSlidesToShow(2);
      } else {
        setSlidesToShow(1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNext = () => {
    if (!isTransitioning && projects.length > 0) {
      setIsTransitioning(true);
      setCurrentIndex((prevIndex) => (prevIndex + 1) % projects.length);
      setTimeout(() => setIsTransitioning(false), 500);
    }
  };

  const handlePrev = () => {
    if (!isTransitioning && projects.length > 0) {
      setIsTransitioning(true);
      setCurrentIndex((prevIndex) => 
        prevIndex === 0 ? projects.length - 1 : prevIndex - 1
      );
      setTimeout(() => setIsTransitioning(false), 500);
    }
  };

  const handleDotClick = (index) => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex(index);
      setTimeout(() => setIsTransitioning(false), 500);
    }
  };

  // Add a loading state
  if (!projects.length) {
    return <div className="projects-carousel-loading">Loading projects...</div>;
  }

  const offset = -currentIndex * (100 / slidesToShow);

  return (
    <div className="projects-carousel">
      <div 
        ref={trackRef}
        className="carousel-track"
        style={{
          transform: `translateX(${offset}%)`,
          width: `${(projects.length) * (100 / slidesToShow)}%`,
        }}
      >
        {projects.map((project, idx) => (
          <div
            key={`${project.title}-${idx}`}
            className="carousel-slide"
            style={{
              width: `${100 / projects.length}%`,
            }}
          >
            <div className="project-card">
              <div className="project-image">
                <img
                  src={project.image || "/api/placeholder/400/225"}
                  alt={project.title}
                />
              </div>
              <div className="project-content">
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <div className="project-footer">
                  <span className="project-category">{project.category}</span>
                  <a 
                    href={project.link}
                    className="project-link"
                  >
                    Explore
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {projects.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="carousel-nav carousel-prev"
            aria-label="Previous project"
          >
            <ChevronLeft />
          </button>

          <button
            onClick={handleNext}
            className="carousel-nav carousel-next"
            aria-label="Next project"
          >
            <ChevronRight />
          </button>

          <div className="carousel-dots">
            {projects.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleDotClick(idx)}
                className={`carousel-dot ${idx === currentIndex ? 'active' : ''}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectsCarousel;
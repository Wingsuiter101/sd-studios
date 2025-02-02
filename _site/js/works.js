// works.js
function initializeFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const worksItems = document.querySelectorAll('.works-item');
    const worksGrid = document.querySelector('.works-grid');
    let isAnimating = false;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isAnimating) return;
            isAnimating = true;

            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');
            worksGrid.classList.add('filtering');

            // Simultaneous fade out for all items
            worksItems.forEach(item => {
                item.style.transitionDelay = '0ms';
                item.classList.add('fade-out');
            });

            // Wait for fade out to complete
            setTimeout(() => {
                // Update visibility
                worksItems.forEach(item => {
                    if (filterValue === 'all' || filterValue === item.getAttribute('data-category')) {
                        item.classList.remove('hidden');
                    } else {
                        item.classList.add('hidden');
                    }
                });

                const visibleItems = Array.from(worksItems).filter(item => 
                    !item.classList.contains('hidden')
                );

                // Staggered fade in for visible items
                visibleItems.forEach((item, index) => {
                    setTimeout(() => {
                        item.style.transitionDelay = `${index * 50}ms`;
                        item.classList.remove('fade-out');
                    }, 25);
                });

                // Cleanup
                setTimeout(() => {
                    worksGrid.classList.remove('filtering');
                    worksItems.forEach(item => {
                        item.style.transitionDelay = '0ms';
                    });
                    isAnimating = false;
                }, 50 + (visibleItems.length * 50));
            }, 300); // Single fade-out duration
        });
    });
}

initializeFilters();
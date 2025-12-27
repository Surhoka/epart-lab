// Home Page JavaScript
window.initHomePage = function() {
    console.log('Initializing Home Page...');
    
    // Add required CSS for slider
    addSliderCSS();
    
    // Initialize Hero Slider
    initHeroSlider();
    
    // Initialize Category Sidebar
    initCategorySidebar();
    
    // Initialize Product Interactions
    initProductInteractions();
    
    // Initialize Newsletter Forms
    initNewsletterForms();
};

// Add CSS for slider functionality
function addSliderCSS() {
    const css = `
        <style>
        .hero-slide {
            display: none;
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
        }
        
        .hero-slide.active {
            display: block;
            opacity: 1;
        }
        
        .slider-dot.active {
            background-color: white !important;
        }
        
        .category-item {
            transition: all 0.2s ease;
        }
        
        .category-item.active {
            background-color: rgb(239 246 255) !important;
            color: rgb(37 99 235) !important;
        }
        
        .dark .category-item.active {
            background-color: rgb(30 58 138 / 0.3) !important;
            color: rgb(96 165 250) !important;
        }
        
        .hero-title, .hero-description, .hero-price {
            transition: opacity 0.3s ease;
        }
        
        .hero-image {
            transition: opacity 0.3s ease;
        }
        </style>
    `;
    
    // Add CSS to head if not already added
    if (!document.querySelector('#slider-css')) {
        const styleElement = document.createElement('div');
        styleElement.id = 'slider-css';
        styleElement.innerHTML = css;
        document.head.appendChild(styleElement);
    }
}

// Hero Slider Functionality
function initHeroSlider() {
    const heroSlider = document.querySelector('#hero-slider');
    if (!heroSlider) return;
    
    const slides = heroSlider.querySelectorAll('.hero-slide');
    const dots = heroSlider.querySelectorAll('.slider-dot');
    const prevBtn = heroSlider.querySelector('.slider-prev');
    const nextBtn = heroSlider.querySelector('.slider-next');
    
    let currentSlide = 0;
    const totalSlides = slides.length;
    
    // Auto-play interval
    let autoPlayInterval;
    
    function showSlide(index) {
        // Hide all slides
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        
        // Update dots
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        
        currentSlide = index;
    }
    
    function nextSlide() {
        const next = (currentSlide + 1) % totalSlides;
        showSlide(next);
    }
    
    function prevSlide() {
        const prev = (currentSlide - 1 + totalSlides) % totalSlides;
        showSlide(prev);
    }
    
    function startAutoPlay() {
        autoPlayInterval = setInterval(nextSlide, 5000); // 5 seconds
    }
    
    function stopAutoPlay() {
        clearInterval(autoPlayInterval);
    }
    
    // Event listeners
    if (nextBtn) nextBtn.addEventListener('click', () => {
        nextSlide();
        stopAutoPlay();
        startAutoPlay();
    });
    
    if (prevBtn) prevBtn.addEventListener('click', () => {
        prevSlide();
        stopAutoPlay();
        startAutoPlay();
    });
    
    // Dot navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            stopAutoPlay();
            startAutoPlay();
        });
    });
    
    // Pause on hover
    heroSlider.addEventListener('mouseenter', stopAutoPlay);
    heroSlider.addEventListener('mouseleave', startAutoPlay);
    
    // Touch/swipe support for mobile
    let startX = 0;
    let endX = 0;
    
    heroSlider.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    });
    
    heroSlider.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].clientX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = startX - endX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
            stopAutoPlay();
            startAutoPlay();
        }
    }
    
    // Initialize
    showSlide(0);
    startAutoPlay();
}

// Category Sidebar Functionality
function initCategorySidebar() {
    const categoryItems = document.querySelectorAll('.category-item');
    
    categoryItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all items
            categoryItems.forEach(cat => cat.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Get category data
            const category = this.dataset.category;
            const categoryName = this.textContent.trim();
            
            // Update hero content based on category
            updateHeroContent(category, categoryName);
            
            // Optional: Navigate to category page
            // window.navigate('shop', { category: category });
        });
        
        // Hover effects
        item.addEventListener('mouseenter', function() {
            if (!this.classList.contains('active')) {
                this.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
            }
        });
        
        item.addEventListener('mouseleave', function() {
            if (!this.classList.contains('active')) {
                this.style.backgroundColor = '';
            }
        });
    });
}

// Update Hero Content based on category
function updateHeroContent(category, categoryName) {
    const heroTitle = document.querySelector('.hero-title');
    const heroDescription = document.querySelector('.hero-description');
    const heroPrice = document.querySelector('.hero-price');
    const heroImage = document.querySelector('.hero-image');
    
    // Category-specific content
    const categoryContent = {
        'air-fuel': {
            title: 'Air, Fuel & Emission Parts',
            description: 'High-quality air filters, fuel pumps, and emission control components for optimal engine performance.',
            price: '$45.99',
            image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop'
        },
        'accessories': {
            title: 'Accessories & Body Parts',
            description: 'Premium accessories and body parts to enhance your vehicle\'s appearance and functionality.',
            price: '$89.99',
            image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=600&fit=crop'
        },
        'battery': {
            title: 'Battery & Electrical Systems',
            description: 'Reliable batteries and electrical components to keep your vehicle running smoothly.',
            price: '$129.99',
            image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'
        },
        'brakes': {
            title: 'Brakes & Suspension',
            description: 'Professional-grade brake pads, rotors, and suspension components for safety and comfort.',
            price: '$199.99',
            image: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&h=600&fit=crop'
        },
        'cooling': {
            title: 'Cooling & Heating Systems',
            description: 'Efficient cooling and heating components to maintain optimal engine temperature.',
            price: '$159.99',
            image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop'
        },
        'electronics': {
            title: 'Electronics & Navigation',
            description: 'Modern electronics and navigation systems for enhanced driving experience.',
            price: '$299.99',
            image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop'
        },
        'engines': {
            title: 'Engines & Ignition',
            description: 'High-performance engine parts and ignition systems for maximum power output.',
            price: '$599.99',
            image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop'
        },
        'tools': {
            title: 'Tools & Garage Equipment',
            description: 'Professional tools and garage equipment for maintenance and repairs.',
            price: '$79.99',
            image: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&h=600&fit=crop'
        },
        'transmission': {
            title: 'Transmission & Drivetrain',
            description: 'Durable transmission and drivetrain components for smooth power delivery.',
            price: '$449.99',
            image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=600&fit=crop'
        }
    };
    
    const content = categoryContent[category] || categoryContent['accessories'];
    
    // Animate content change
    if (heroTitle) {
        heroTitle.style.opacity = '0';
        setTimeout(() => {
            heroTitle.textContent = content.title;
            heroTitle.style.opacity = '1';
        }, 200);
    }
    
    if (heroDescription) {
        heroDescription.style.opacity = '0';
        setTimeout(() => {
            heroDescription.textContent = content.description;
            heroDescription.style.opacity = '1';
        }, 300);
    }
    
    if (heroPrice) {
        heroPrice.style.opacity = '0';
        setTimeout(() => {
            heroPrice.textContent = content.price;
            heroPrice.style.opacity = '1';
        }, 400);
    }
    
    if (heroImage) {
        heroImage.style.opacity = '0';
        setTimeout(() => {
            heroImage.src = content.image;
            heroImage.style.opacity = '1';
        }, 100);
    }
}

// Product Interactions
function initProductInteractions() {
    // Wishlist buttons
    const wishlistBtns = document.querySelectorAll('.wishlist-btn');
    wishlistBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const heart = this.querySelector('span');
            if (heart.textContent === '♡') {
                heart.textContent = '♥';
                heart.style.color = '#ef4444';
                this.classList.add('active');
                showToast('Added to wishlist!', 'success');
            } else {
                heart.textContent = '♡';
                heart.style.color = '';
                this.classList.remove('active');
                showToast('Removed from wishlist!', 'info');
            }
        });
    });
    
    // Add to cart buttons
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const productName = this.closest('.product-card')?.querySelector('h3')?.textContent || 'Product';
            
            // Add loading state
            const originalText = this.textContent;
            this.textContent = 'Adding...';
            this.disabled = true;
            
            // Simulate API call
            setTimeout(() => {
                this.textContent = originalText;
                this.disabled = false;
                showToast(`${productName} added to cart!`, 'success');
            }, 1000);
        });
    });
    
    // Vehicle search form
    const vehicleSearchForm = document.querySelector('#vehicle-search-form');
    if (vehicleSearchForm) {
        vehicleSearchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const searchData = {
                make: formData.get('make'),
                model: formData.get('model'),
                year: formData.get('year'),
                engine: formData.get('engine')
            };
            
            // Validate form
            if (!searchData.make || !searchData.model || !searchData.year) {
                showToast('Please fill in all required fields', 'error');
                return;
            }
            
            // Show loading
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Searching...';
            submitBtn.disabled = true;
            
            // Simulate search
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                
                // Navigate to search results
                const query = `${searchData.make} ${searchData.model} ${searchData.year}`;
                showToast(`Searching for parts for ${query}...`, 'info');
                
                // Optional: Navigate to search results page
                // window.navigate('search', searchData);
            }, 1500);
        });
    }
}

// Newsletter Forms
function initNewsletterForms() {
    const newsletterForms = document.querySelectorAll('.newsletter-form');
    
    newsletterForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const emailInput = this.querySelector('input[type="email"]');
            const submitBtn = this.querySelector('button[type="submit"]');
            const email = emailInput.value.trim();
            
            // Validate email
            if (!email || !isValidEmail(email)) {
                showToast('Please enter a valid email address', 'error');
                emailInput.focus();
                return;
            }
            
            // Show loading
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Subscribing...';
            submitBtn.disabled = true;
            
            // Simulate API call
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                emailInput.value = '';
                
                showToast('Successfully subscribed to newsletter!', 'success');
            }, 1500);
        });
    });
}

// Utility Functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white transform translate-x-full transition-transform duration-300 ${getToastColor(type)}`;
    toast.textContent = message;
    
    // Add to container
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(container);
    }
    
    container.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function getToastColor(type) {
    switch (type) {
        case 'success': return 'bg-green-500';
        case 'error': return 'bg-red-500';
        case 'warning': return 'bg-yellow-500';
        default: return 'bg-blue-500';
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initHomePage);
} else {
    window.initHomePage();
}

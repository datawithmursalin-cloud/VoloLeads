/* ============================================
   VoloLeads Application Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    updateCopyrightYear();
    initDarkMode();
    initContactForm();
    initFormSecurity();
    initCounterAnimation();
    initRevealOnScroll();
    initScrollAnimations();
    initScrollToTop();
    initCounters();
    initAccordions();
    initMobilePlansCarousel();

    // Cookie consent banner initialization
    initCookieConsentBanner();

    // Check if consent already given
    const existingConsent = getCookie('cookie_consent');
    const banner = document.getElementById('cookie-consent-banner');

    if (!existingConsent && banner) {
        banner.style.display = 'block';
    } else if (banner) {
        banner.style.display = 'none';
    }

    // Set current year in footer
    const currentYearEl = document.getElementById('current-year');
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }

    // Update visit counter if returning visitor
    const lastVisit = getCookie('last_visit');
    if (lastVisit && getCookie('cookie_consent') === 'accepted') {
        setCookie('last_visit', new Date().toISOString(), 365);
    }
});

/* --- Dark Mode Logic --- */
function initDarkMode() {
    const html = document.documentElement;

    // Check for saved dark mode preference or default to light mode
    const isDarkMode = localStorage.getItem('dark-mode') === 'true';

    if (isDarkMode) {
        html.classList.add('dark');
    }

    // Helper function to update icon
    const updateIcon = (icon, isDark) => {
        if (isDark) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    };

    // Helper function to toggle dark mode
    const toggleDarkMode = () => {
        html.classList.toggle('dark');
        const isNowDark = html.classList.contains('dark');

        // Update all toggle button icons
        const darkModeIcon = document.getElementById('dark-mode-icon');
        const mobileDarkModeIcon = document.getElementById('mobile-dark-mode-icon');

        if (darkModeIcon) updateIcon(darkModeIcon, isNowDark);
        if (mobileDarkModeIcon) updateIcon(mobileDarkModeIcon, isNowDark);

        // Save preference to localStorage
        localStorage.setItem('dark-mode', isNowDark);
    };

    // Attach click handlers to all dark mode toggle buttons
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const mobileDarkModeToggle = document.getElementById('mobile-dark-mode-toggle');

    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }

    if (mobileDarkModeToggle) {
        mobileDarkModeToggle.addEventListener('click', toggleDarkMode);
    }
}

/* --- Mobile Menu Logic --- */
function initMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = document.getElementById('menu-icon');
    const menuLinks = mobileMenu.querySelectorAll('a'); // Select all links inside menu

    if (!menuBtn || !mobileMenu || !menuIcon) return;

    // Toggle Menu Function
    const toggleMenu = () => {
        const isHidden = mobileMenu.classList.contains('hidden');

        if (isHidden) {
            // Open Menu
            mobileMenu.classList.remove('hidden');
            menuIcon.classList.remove('fa-bars');
            menuIcon.classList.add('fa-xmark');
        } else {
            // Close Menu
            mobileMenu.classList.add('hidden');
            menuIcon.classList.remove('fa-xmark');
            menuIcon.classList.add('fa-bars');
        }
    };

    // Event Listener for Button
    menuBtn.addEventListener('click', toggleMenu);

    // Close menu when a link is clicked
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            menuIcon.classList.remove('fa-xmark');
            menuIcon.classList.add('fa-bars');
        });
    });
}

/* --- Audio Player Logic --- */
// Global variables to track state
let currentAudio = null;
let currentButton = null;

// Attached to window so HTML onclick attributes can find it
window.toggleAudio = function(audioId, btn) {
    const audio = document.getElementById(audioId);
    const icon = btn.querySelector('i');

    if (!audio) {
        console.error(`Audio file not found: ${audioId}`);
        return;
    }

    // 1. If we click a new audio while one is playing, stop the old one
    if (currentAudio && currentAudio !== audio) {
        currentAudio.pause();
        currentAudio.currentTime = 0; 
        if (currentButton) {
            const oldIcon = currentButton.querySelector('i');
            if (oldIcon) {
                oldIcon.classList.remove('fa-pause');
                oldIcon.classList.add('fa-play', 'ml-0.5');
            }
        }
    }

    // 2. Toggle the clicked audio
    if (audio.paused) {
        // Attempt to play
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                // Play started successfully
                icon.classList.remove('fa-play', 'ml-0.5');
                icon.classList.add('fa-pause');
                
                currentAudio = audio;
                currentButton = btn;
            })
            .catch(error => {
                console.error("Playback failed. Check if audio file exists.", error);
                alert("Audio file not found or browser blocked autoplay.");
            });
        }
    } else {
        // Pause
        audio.pause();
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play', 'ml-0.5');
        currentAudio = null;
        currentButton = null;
    }
};

// Reset icon when audio finishes naturally
window.resetIcon = function(audioElement) {
    if (currentButton) {
        const icon = currentButton.querySelector('i');
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play', 'ml-0.5');
        currentAudio = null;
        currentButton = null;
    }
};

/* --- Utilities --- */
function updateCopyrightYear() {
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
}

/* --- Services Slider Logic --- */
window.scrollServices = function(direction) {
    const slider = document.getElementById('services-slider');
    if (!slider) return;

    // Scroll width roughly equal to card width + gap
    const scrollAmount = 420; 
    const currentScroll = slider.scrollLeft;
    
    if (direction === 'left') {
        slider.scrollTo({
            left: currentScroll - scrollAmount,
            behavior: 'smooth'
        });
    } else {
        slider.scrollTo({
            left: currentScroll + scrollAmount,
            behavior: 'smooth'
        });
    }
};

/* --- Pricing Slider Logic --- */
window.scrollPricing = function(direction) {
    const slider = document.getElementById('pricing-slider');
    if (!slider) return;

    // Scroll width roughly equal to card width + gap
    const scrollAmount = 400; 
    const currentScroll = slider.scrollLeft;
    
    if (direction === 'left') {
        slider.scrollTo({
            left: currentScroll - scrollAmount,
            behavior: 'smooth'
        });
    } else {
        slider.scrollTo({
            left: currentScroll + scrollAmount,
            behavior: 'smooth'
        });
    }
};

/* --- Contact Form Logic --- */
function initContactForm() {
    const serviceSelect = document.getElementById('service-select');
    const dateInput = document.getElementById('preferred-date');
    
    // 1. Service Selection -> Toggle Quantity Dropdown
    if (serviceSelect) {
        serviceSelect.addEventListener('change', function() {
            const service = this.value;
            const quantityRow = document.getElementById('quantity-row');
            const quantitySelect = document.getElementById('quantity-select');
            
            if (!quantityRow || !quantitySelect) return;

            // Logic: If they pick a service that needs agents...
            if (service === "Essential" || service === "Premium" || service === "Custom+") {
                quantityRow.classList.remove("hidden");
                quantitySelect.setAttribute("required", "true");
            } else {
                quantityRow.classList.add("hidden");
                quantitySelect.removeAttribute("required");
                quantitySelect.value = "";
            }
        });
    }

    // 2. Date Picker Logic
    if (dateInput) {
        // Set min date to tomorrow (not today)
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');
        dateInput.min = `${yyyy}-${mm}-${dd}`;

        // Handle Date Change -> Show Time Slots
        dateInput.addEventListener('change', function() {
            const timeRow = document.getElementById('time-row');
            const timeSelect = document.getElementById('preferred-time');
            
            if (!this.value) {
                if (timeRow) timeRow.classList.add('hidden');
                if (timeSelect) { 
                    timeSelect.removeAttribute('required'); 
                    timeSelect.value = ''; 
                }
                return;
            }

            // Populate time slots (9:00 AM - 4:30 PM EST)
            if (timeSelect && timeSelect.options.length <= 1) {
                const startHour = 9; 
                const endHour = 16; 
                
                for (let h = startHour; h <= endHour; h++) {
                    for (let m = 0; m < 60; m += 30) {
                        // Stop loop after 4:30 PM
                        if (h === 16 && m > 30) continue;

                        const hour = h;
                        const minute = m;
                        // Format Value (24h)
                        const value = String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0');
                        // Format Display (12h)
                        const ampm = hour < 12 ? 'AM' : 'PM';
                        const displayHour = ((hour + 11) % 12) + 1; 
                        const text = `${displayHour}:${String(minute).padStart(2, '0')} ${ampm} EST`;
                        
                        const opt = document.createElement('option');
                        opt.value = value;
                        opt.text = text;
                        timeSelect.appendChild(opt);
                    }
                }
            }

            if (timeRow) timeRow.classList.remove('hidden');
            if (timeSelect) timeSelect.setAttribute('required', 'true');
        });
    }
}

/* ============================================
   COUNTER ANIMATION
   ============================================ */
function initCounterAnimation() {
    const counters = document.querySelectorAll('.counter-animate');

    const animateCounter = (counter) => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000; // 2 seconds
        const increment = target / (duration / 50);
        let current = 0;

        const interval = setInterval(() => {
            current += increment;
            if (current >= target) {
                counter.textContent = target.toLocaleString();
                clearInterval(interval);
            } else {
                counter.textContent = Math.floor(current).toLocaleString();
            }
        }, 50);
    };

    // Intersection Observer for triggering animations on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                animateCounter(counter);
                observer.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}

/* ============================================
   REVEAL ON SCROLL ANIMATION
   ============================================ */
function initRevealOnScroll() {
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    const revealOnScroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                revealOnScroll.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    revealElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';

        // Apply delay based on CSS class
        if (element.classList.contains('delay-100')) {
            element.style.transitionDelay = '0.1s';
        } else if (element.classList.contains('delay-200')) {
            element.style.transitionDelay = '0.2s';
        } else if (element.classList.contains('delay-300')) {
            element.style.transitionDelay = '0.3s';
        } else if (element.classList.contains('delay-400')) {
            element.style.transitionDelay = '0.4s';
        }

        revealOnScroll.observe(element);
    });
}

/* ============================================
   FUTURE-PROOFING: INTERACTIVE FEATURES
   ============================================ */

/* --- 1. Reveal Elements on Scroll --- */
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1, // Trigger when 10% of element is visible
        rootMargin: "0px 0px -50px 0px" // Offset slightly so it doesn't trigger too early
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach(el => observer.observe(el));
}

/* --- 2. Scroll to Top Button Logic --- */
function initScrollToTop() {
    const btn = document.getElementById('scroll-top-btn');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            btn.classList.add('show');
        } else {
            btn.classList.remove('show');
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* --- 3. Number Counter Animation --- */
function initCounters() {
    const counters = document.querySelectorAll('.counter-animate');
    const speed = 200; // The lower the slower

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = +counter.getAttribute('data-target');
                const count = +counter.innerText;
                const inc = target / speed;

                const updateCount = () => {
                    const c = +counter.innerText;
                    if (c < target) {
                        counter.innerText = Math.ceil(c + inc);
                        setTimeout(updateCount, 20);
                    } else {
                        counter.innerText = target;
                    }
                };
                updateCount();
                observer.unobserve(counter);
            }
        });
    });

    counters.forEach(counter => observer.observe(counter));
}

/* --- 4. Simple Accordion Logic --- */
function initAccordions() {
    const triggers = document.querySelectorAll('.accordion-trigger');
    
    triggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const content = trigger.nextElementSibling;
            const icon = trigger.querySelector('i');
            
            // Toggle Open Class
            content.classList.toggle('open');
            
            // Calculate height for smooth animation
            if (content.classList.contains('open')) {
                content.style.maxHeight = content.scrollHeight + "px";
                if(icon) icon.style.transform = "rotate(180deg)";
            } else {
                content.style.maxHeight = null;
                if(icon) icon.style.transform = "rotate(0deg)";
            }
        });
    });
}

function updateCountdown(audio) {
    // 1. Find the timer span that matches this audio player
    // We look for an ID like "timer-" + "audio-richard"
    const timerSpan = document.getElementById(`timer-${audio.id}`);

    // 2. Ensure we have a valid number to work with
    if (audio.duration) {
        // Calculate remaining time
        const remaining = audio.duration - audio.currentTime;

        // Math to convert seconds into Minutes:Seconds
        const minutes = Math.floor(remaining / 60);
        const seconds = Math.floor(remaining % 60);

        // Add a "0" if seconds are single digit (e.g. "5:09" instead of "5:9")
        const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        // Update the text on screen
        timerSpan.textContent = formattedTime;
    }
}

// Optional: Resets the timer back to original text when audio finishes
function resetPlayer(audio) {
    const timerSpan = document.getElementById(`timer-${audio.id}`);
    const minutes = Math.floor(audio.duration / 60);
    const seconds = Math.floor(audio.duration % 60);
    timerSpan.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    // Reset icon to Play
    const btn = audio.nextElementSibling;
    btn.querySelector('i').className = 'fa-solid fa-play ml-0.5';
}

/* --- Flip Card Function --- */
function flipCard(cardWrapper) {
    // Finds the inner div that holds the front/back faces and toggles the class
    const innerCard = cardWrapper.querySelector('.transform-style-3d');
    if (innerCard) {
        innerCard.classList.toggle('is-flipped');
    }
}

/* ========== MOBILE PLANS CAROUSEL FUNCTIONALITY ========== */
function initMobilePlansCarousel() {
    // Find the plans grid - it has the class "grid grid-cols-1 md:grid-cols-3"
    const plansGrid = document.querySelector('#plans .grid.grid-cols-1');
    if (!plansGrid) return;

    let touchStartX = 0;
    let touchEndX = 0;

    const updatePlansLayout = () => {
        if (window.innerWidth <= 768) {
            // Mobile: Convert grid to horizontal scroll carousel
            plansGrid.style.display = 'flex';
            plansGrid.style.gap = '1.5rem';
            plansGrid.style.overflowX = 'auto';
            plansGrid.style.overflowY = 'hidden';
            plansGrid.style.scrollBehavior = 'smooth';
            plansGrid.style.padding = '1rem 0';
            plansGrid.style.WebkitOverflowScrolling = 'touch';
            plansGrid.style.scrollSnapType = 'x mandatory';
            plansGrid.style.paddingLeft = '0.5rem';
            plansGrid.style.paddingRight = '0.5rem';
            plansGrid.style.marginLeft = '-0.5rem';
            plansGrid.style.marginRight = '-0.5rem';

            // Hide the scrollbar
            plansGrid.classList.add('scrollbar-hide');
            plansGrid.classList.remove('grid', 'grid-cols-1', 'md:grid-cols-3', 'gap-8');

            // Update each card for carousel layout
            const cards = plansGrid.querySelectorAll('.perspective-1000');
            cards.forEach(card => {
                card.style.flex = '0 0 calc(100% - 2rem)';
                card.style.minWidth = 'calc(100% - 2rem)';
                card.style.scrollSnapAlign = 'start';
                card.style.scrollSnapStop = 'always';
                card.style.height = '680px';
            });

            // Add touch event listeners for swipe
            plansGrid.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, false);

            plansGrid.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
            }, false);

        } else {
            // Desktop: Restore grid layout
            plansGrid.style.display = 'grid';
            plansGrid.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
            plansGrid.style.gap = '2rem';
            plansGrid.style.overflowX = 'visible';
            plansGrid.style.scrollBehavior = 'auto';
            plansGrid.style.padding = '1.5rem 0';
            plansGrid.style.marginLeft = '0';
            plansGrid.style.marginRight = '0';
            plansGrid.classList.remove('scrollbar-hide');
            plansGrid.classList.add('grid', 'grid-cols-1', 'md:grid-cols-3', 'gap-8');

            const cards = plansGrid.querySelectorAll('.perspective-1000');
            cards.forEach(card => {
                card.style.flex = 'none';
                card.style.minWidth = 'auto';
                card.style.scrollSnapAlign = 'none';
                card.style.scrollSnapStop = 'none';
                card.style.height = '660px';
            });

            // Remove touch listeners on desktop
            plansGrid.removeEventListener('touchstart', null);
            plansGrid.removeEventListener('touchend', null);
        }
    };

    function handleSwipe() {
        const difference = touchStartX - touchEndX;

        // Only trigger if swipe distance is significant (more than 50px)
        if (Math.abs(difference) > 50) {
            if (difference > 0) {
                // Swipe left - scroll right to see next card (with boundary check)
                const maxScroll = plansGrid.scrollWidth - plansGrid.clientWidth;
                const currentScroll = plansGrid.scrollLeft;

                // Only allow swiping left if not at the end
                if (currentScroll < maxScroll) {
                    plansGrid.scrollBy({ left: 350, behavior: 'smooth' });
                }
            } else {
                // Swipe right - scroll left to see previous card (with boundary check)
                const currentScroll = plansGrid.scrollLeft;

                // Only allow swiping right if not at the beginning
                if (currentScroll > 0) {
                    plansGrid.scrollBy({ left: -350, behavior: 'smooth' });
                }
            }
        }
    }

    // Initial call
    updatePlansLayout();

    // Update on resize
    window.addEventListener('resize', updatePlansLayout);
}

/* --- Form Security & Anti-Bot Checks --- */
function initFormSecurity() {
    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        // SECURITY LAYER 3: Time-Lock
        const loadTime = Date.now();
        const submitBtn = document.getElementById('submit-btn');
        const btnText = document.getElementById('btn-text');
        const btnLoader = document.getElementById('btn-loader');
        const honeyTrap = document.getElementById('website_honeypot');

        contactForm.addEventListener('submit', function(e) {
            const submitTime = Date.now();
            const timeDifference = submitTime - loadTime;

            // Check 1: Honey Trap (Must remain empty)
            if (honeyTrap && honeyTrap.value !== "") {
                e.preventDefault();
                console.warn("Bot detected: Honey trap triggered.");
                return false;
            }

            // Check 2: Time Trap (Must take > 3 seconds)
            if (timeDifference < 3000) {
                e.preventDefault();
                console.warn("Bot detected: Form filled too fast.");
                alert("Please wait a moment before submitting to verify you are human.");
                return false;
            }

            // Check 3: UI Feedback (Prevent Double Submit)
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-75', 'cursor-not-allowed');

                if (btnText) btnText.classList.add('hidden');
                if (btnLoader) btnLoader.classList.remove('hidden');
            }

            return true;
        });
    }
}

/* ========== VISITOR TRACKING SYSTEM WITH COOKIE CONSENT ========== */

// ========== COOKIE MANAGEMENT FUNCTIONS ==========
function setCookie(name, value, days = 365) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    const secure = window.location.protocol === 'https:' ? 'Secure' : '';
    const sameSite = 'SameSite=Strict';

    const encodedValue = encodeURIComponent(value);
    document.cookie = `${name}=${encodedValue}; ${expires}; ${sameSite}; ${secure}; path=/`;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.indexOf(nameEQ) === 0) {
            try {
                return decodeURIComponent(cookie.substring(nameEQ.length));
            } catch (e) {
                return cookie.substring(nameEQ.length);
            }
        }
    }
    return null;
}

function deleteCookie(name) {
    setCookie(name, '', -1);
}

// ========== FORM VALIDATION FUNCTIONS ==========
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function clearValidationErrors() {
    const nameError = document.getElementById('name-error');
    const emailError = document.getElementById('email-error');
    if (nameError) nameError.style.display = 'none';
    if (emailError) emailError.style.display = 'none';
    if (nameError) nameError.textContent = '';
    if (emailError) emailError.textContent = '';
}

function showValidationError(field, message) {
    const errorEl = document.getElementById(`${field}-error`);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

function validateForm() {
    clearValidationErrors();

    const nameInput = document.getElementById('cookie-consent-name');
    const emailInput = document.getElementById('cookie-consent-email');

    if (!nameInput || !emailInput) return { isValid: false };

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    let isValid = true;

    if (!name) {
        showValidationError('name', 'Name is required');
        isValid = false;
    }

    if (!email) {
        showValidationError('email', 'Email is required');
        isValid = false;
    } else if (!validateEmail(email)) {
        showValidationError('email', 'Please enter a valid email');
        isValid = false;
    }

    return { isValid, name, email };
}

// ========== VISITOR DATA CAPTURE ==========
function captureVisitorData(name, email) {
    const now = new Date().toISOString();

    // Check if this is a return visit
    const lastVisit = getCookie('last_visit');
    let visitCount = 1;

    if (lastVisit) {
        const currentCount = getCookie('visits');
        visitCount = currentCount ? parseInt(currentCount) + 1 : 2;
    }

    // Set cookies
    setCookie('visitor_name', name, 365);
    setCookie('visitor_email', email, 365);
    setCookie('cookie_consent', 'accepted', 365);

    if (!getCookie('visit_date')) {
        setCookie('visit_date', now, 365);
    }

    setCookie('visits', visitCount.toString(), 365);
    setCookie('last_visit', now, 365);

    return {
        visitor_name: name,
        visitor_email: email,
        visit_count: visitCount,
        visit_date: getCookie('visit_date'),
        last_visit: now
    };
}

// ========== DATA SUBMISSION FUNCTIONS ==========
async function submitToWeb3Forms(visitorData) {
    const payload = {
        access_key: '13abc37b-f6ed-4d4c-99cc-94b2aade3d6e',
        visitor_name: visitorData.visitor_name,
        visitor_email: visitorData.visitor_email,
        visit_page: window.location.pathname,
        visit_timestamp: new Date().toISOString(),
        referrer: document.referrer || 'Direct',
        user_agent: navigator.userAgent.substring(0, 100),
        visit_count: visitorData.visit_count
    };

    try {
        const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log('✓ Visitor data submitted successfully');
            return true;
        } else {
            console.warn('⚠ Failed to submit visitor data:', response.status);
            return false;
        }
    } catch (error) {
        console.error('✗ Error submitting visitor data:', error);
        return false;
    }
}

// ========== PAGE BEHAVIOR TRACKING ==========
let pageLoadTime = new Date().getTime();
let timeSpentOnPage = 0;

function trackExitEvent() {
    const currentTime = new Date().getTime();
    timeSpentOnPage = Math.round((currentTime - pageLoadTime) / 1000);

    const visitorName = getCookie('visitor_name');
    const visitorEmail = getCookie('visitor_email');

    if (visitorName && visitorEmail) {
        const exitData = {
            access_key: '13abc37b-f6ed-4d4c-99cc-94b2aade3d6e',
            event_type: 'page_exit',
            visitor_name: visitorName,
            visitor_email: visitorEmail,
            page_url: window.location.href,
            time_spent_seconds: timeSpentOnPage,
            exit_timestamp: new Date().toISOString()
        };

        // Use sendBeacon for reliability on page unload
        navigator.sendBeacon('https://api.web3forms.com/submit', JSON.stringify(exitData));
    }
}

// ========== COOKIE CONSENT HANDLERS ==========
function acceptCookieConsent() {
    const validation = validateForm();

    if (!validation.isValid) {
        return;
    }

    // Capture visitor data
    const visitorData = captureVisitorData(validation.name, validation.email);

    // Submit to Web3Forms
    submitToWeb3Forms(visitorData).then(() => {
        // Hide banner
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.style.display = 'none';
        }
        clearValidationErrors();

        console.log('✓ Visitor consent accepted and data saved');
    });
}

function declineCookieConsent() {
    // Store rejection
    setCookie('cookie_consent', 'rejected', 365);

    // Hide banner
    const banner = document.getElementById('cookie-consent-banner');
    if (banner) {
        banner.style.display = 'none';
    }

    console.log('Visitor declined cookie consent');
}

// ========== COOKIE CONSENT BANNER UI ==========
function initCookieConsentBanner() {
    // Create banner HTML
    const bannerHTML = `
        <div id="cookie-consent-banner" class="cookie-consent-banner" style="
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 9999;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            border-top: 2px solid #f97316;
            padding: 20px;
            box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: none;
        ">
            <div style="max-width: 1200px; margin: 0 auto;">
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <!-- Headline -->
                    <div style="color: #fff; font-size: 16px; font-weight: 600;">
                        🔥 Get instant access to off-market deals & exclusive market insights delivered daily!
                    </div>

                    <!-- Form inputs -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr auto auto; gap: 12px; align-items: flex-end;">
                        <!-- Name input -->
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <input
                                type="text"
                                id="cookie-consent-name"
                                placeholder="Your Name"
                                style="
                                    padding: 10px 12px;
                                    border: 1px solid #475569;
                                    background-color: #1e293b;
                                    color: #fff;
                                    border-radius: 6px;
                                    font-size: 14px;
                                    outline: none;
                                    transition: all 0.2s;
                                "
                                onmouseover="this.style.borderColor='#f97316'"
                                onmouseout="this.style.borderColor='#475569'"
                                onfocus="this.style.borderColor='#f97316'; this.style.boxShadow='0 0 0 2px rgba(249, 115, 22, 0.2)'"
                                onblur="this.style.borderColor='#475569'; this.style.boxShadow='none'"
                            >
                            <span id="name-error" style="color: #ef4444; font-size: 12px; display: none;"></span>
                        </div>

                        <!-- Email input -->
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <input
                                type="email"
                                id="cookie-consent-email"
                                placeholder="Your Email"
                                style="
                                    padding: 10px 12px;
                                    border: 1px solid #475569;
                                    background-color: #1e293b;
                                    color: #fff;
                                    border-radius: 6px;
                                    font-size: 14px;
                                    outline: none;
                                    transition: all 0.2s;
                                "
                                onmouseover="this.style.borderColor='#f97316'"
                                onmouseout="this.style.borderColor='#475569'"
                                onfocus="this.style.borderColor='#f97316'; this.style.boxShadow='0 0 0 2px rgba(249, 115, 22, 0.2)'"
                                onblur="this.style.borderColor='#475569'; this.style.boxShadow='none'"
                            >
                            <span id="email-error" style="color: #ef4444; font-size: 12px; display: none;"></span>
                        </div>

                        <!-- Accept button -->
                        <button
                            id="cookie-accept-btn"
                            style="
                                padding: 10px 20px;
                                background-color: #f97316;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                font-weight: 600;
                                font-size: 14px;
                                cursor: pointer;
                                transition: all 0.2s;
                                white-space: nowrap;
                            "
                            onmouseover="this.style.backgroundColor='#ea580c'; this.style.transform='translateY(-1px)'"
                            onmouseout="this.style.backgroundColor='#f97316'; this.style.transform='translateY(0)'"
                            onclick="acceptCookieConsent()"
                        >
                            Accept & Save
                        </button>

                        <!-- Decline button -->
                        <button
                            id="cookie-decline-btn"
                            style="
                                padding: 10px 20px;
                                background-color: transparent;
                                color: white;
                                border: 1px solid white;
                                border-radius: 6px;
                                font-weight: 600;
                                font-size: 14px;
                                cursor: pointer;
                                transition: all 0.2s;
                                white-space: nowrap;
                            "
                            onmouseover="this.style.backgroundColor='rgba(255, 255, 255, 0.1)'"
                            onmouseout="this.style.backgroundColor='transparent'"
                            onclick="declineCookieConsent()"
                        >
                            Decline
                        </button>
                    </div>

                    <!-- Mobile responsive view -->
                    <style>
                        @media (max-width: 768px) {
                            #cookie-consent-banner {
                                padding: 16px !important;
                            }
                            #cookie-consent-banner > div > div:last-child {
                                display: grid !important;
                                grid-template-columns: 1fr !important;
                            }
                            #cookie-consent-banner input {
                                width: 100% !important;
                            }
                            #cookie-consent-banner button {
                                width: 100% !important;
                            }
                        }
                    </style>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', bannerHTML);
}

// ========== EXIT DETECTION ==========
window.addEventListener('beforeunload', trackExitEvent);

// Also track when user navigates away
window.addEventListener('unload', trackExitEvent);

// Track visibility changes (tab closed, etc)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        trackExitEvent();
    }
});
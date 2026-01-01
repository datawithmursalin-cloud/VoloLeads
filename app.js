/* ============================================
   VoloLeads Application Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    updateCopyrightYear();
});

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
document.addEventListener('DOMContentLoaded', () => {
    initContactForm();
});

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
            if (service === "Cold Calling VA" || service === "Virtual Drivers" || service === "Both Services") {
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
        // Set min date to today
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
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
   FUTURE-PROOFING: INTERACTIVE FEATURES
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initScrollToTop();
    initCounters();
    initAccordions();
});

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
/* ============================================
   VoloLeads Application Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initPageLoadAnimation();
    initMobileMenu();
    renderUniversalFooter();
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
    initFlipCards();
    initMobilePlansCarousel();
    initSubscriptionCheckout();
    initManageSubscriptionForm();
    initScheduleOnboardingPage();
    initSubscriptionSuccessPage();
    initTurnstileLoader();
    initAudioSeekBars();
    initDecorativeIcons();

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

    // If consent was already given, load third-party widgets now
    if (existingConsent === 'accepted') {
        loadThirdPartyScriptsOnConsent();
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

    // Attach loadedmetadata handlers to audio elements to initialize timers safely
    const audios = document.querySelectorAll('audio');
    audios.forEach(a => {
        a.addEventListener('loadedmetadata', () => {
            try {
                const timerSpan = document.getElementById(`timer-${a.id}`);
                if (timerSpan && isFinite(a.duration) && !isNaN(a.duration)) {
                    const minutes = Math.floor(a.duration / 60);
                    const seconds = Math.floor(a.duration % 60);
                    timerSpan.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
                }
            } catch (e) {
                console.warn('Failed to initialize audio timer', e);
            }
        });

        a.addEventListener('error', () => handleAudioError(a));
    });
});

function ensureAudioSource(audio) {
    if (!audio || audio.src) return;

    const audioSrc = audio.dataset.src;
    if (!audioSrc) {
        console.error(`Audio source not configured: ${audio.id}`);
        return;
    }

    audio.src = audioSrc;
    audio.load();
}

function initPageLoadAnimation() {
    const body = document.body;
    if (!body) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        body.classList.remove('site-preload');
        return;
    }

    requestAnimationFrame(() => {
        body.classList.add('site-loaded');
        body.classList.remove('site-preload');
    });
}

/* --- Dark Mode Logic --- */
function initDarkMode() {
    const html = document.documentElement;

    // Check for saved dark mode preference or default to light mode
    let isDarkMode = false;
    try {
        isDarkMode = localStorage.getItem('dark-mode') === 'true';
    } catch (error) {
        console.warn('Dark mode preference unavailable', error);
    }

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
        if (window.renderSiteIcons) window.renderSiteIcons();

        try {
            localStorage.setItem('dark-mode', isNowDark);
        } catch (error) {
            console.warn('Could not save dark mode preference', error);
        }
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

    if (!menuBtn || !mobileMenu || !menuIcon) return;

    const menuLinks = mobileMenu.querySelectorAll('a');

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

function setInlineIcon(icon, name) {
    if (!icon) return;

    const paths = {
        play: '<path d="M8 5v14l11-7L8 5Z" fill="currentColor" stroke="none"/>',
        pause: '<path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor" stroke="none"/>',
        warning: '<path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5M12 17h.01"/>'
    };

    icon.innerHTML = `<svg class="site-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name] || paths.play}</svg>`;
    delete icon.dataset.renderedIcon;
}

// Attached to window so HTML onclick attributes can find it
window.toggleAudio = function(audioId, btn) {
    const audio = document.getElementById(audioId);
    const icon = btn.querySelector('i');

    if (!audio) {
        console.error(`Audio file not found: ${audioId}`);
        return;
    }

    ensureAudioSource(audio);

    // 1. If we click a new audio while one is playing, stop the old one
    if (currentAudio && currentAudio !== audio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        if (currentButton) {
            const oldIcon = currentButton.querySelector('i');
            if (oldIcon) {
                oldIcon.classList.remove('fa-pause');
                oldIcon.classList.add('fa-play', 'ml-0.5');
                setInlineIcon(oldIcon, 'play');
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
                setInlineIcon(icon, 'pause');
                if (window.renderSiteIcons) window.renderSiteIcons(btn);

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
        setInlineIcon(icon, 'play');
        if (window.renderSiteIcons) window.renderSiteIcons(btn);
        currentAudio = null;
        currentButton = null;
    }
};

// Handle audio errors
window.handleAudioError = function(audioElement) {
    console.error(`Audio error for ${audioElement.id}:`, audioElement.error?.message);
    const btn = audioElement.nextElementSibling;
    if (btn) {
        const icon = btn.querySelector('i');
        if (icon) {
            icon.classList.add('fa-exclamation-triangle');
            icon.classList.remove('fa-play', 'fa-pause');
            setInlineIcon(icon, 'warning');
            if (window.renderSiteIcons) window.renderSiteIcons(btn);
        }
        btn.disabled = true;
        btn.title = 'Audio file unavailable';
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    }
};

// Reset icon when audio finishes naturally
window.resetIcon = function(audioElement) {
    if (currentButton) {
        const icon = currentButton.querySelector('i');
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play', 'ml-0.5');
        setInlineIcon(icon, 'play');
        if (window.renderSiteIcons && currentButton) window.renderSiteIcons(currentButton);
        currentAudio = null;
        currentButton = null;
    }
};

/* --- Utilities --- */
function renderUniversalFooter() {
    const footer = document.querySelector('footer');
    if (!footer) return;

    footer.className = 'bg-brand-navy text-slate-400 py-12 border-t border-slate-800 scroll-mt-32';
    footer.innerHTML = `
        <div class="container mx-auto px-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
                <div class="lg:col-span-2">
                    <a href="index.html#home" class="flex items-center space-x-2 mb-4">
                        <i class="fa-solid fa-bolt text-brand-orange"></i>
                        <span class="text-white text-xl font-bold">VoloLeads</span>
                    </a>
                    <p class="text-sm max-w-sm">High-velocity virtual assistants for real estate wholesalers. We hunt, you close.</p>
                </div>
                <div>
                    <h4 class="text-white font-bold mb-4">Navigate</h4>
                    <ul class="space-y-2 text-sm">
                        <li><a href="index.html#about" class="hover:text-brand-orange transition-colors">About Us</a></li>
                        <li><a href="index.html#services" class="hover:text-brand-orange transition-colors">Services</a></li>
                        <li><a href="index.html#plans" class="hover:text-brand-orange transition-colors">Plans</a></li>
                        <li><a href="index.html#insights" class="hover:text-brand-orange transition-colors">Insights</a></li>
                        <li><a href="index.html#testimonials" class="hover:text-brand-orange transition-colors">Testimonials</a></li>
                        <li><a href="index.html#contact" class="hover:text-brand-orange transition-colors">Contact</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="text-white font-bold mb-4">Legal</h4>
                    <ul class="space-y-2 text-sm">
                        <li><a href="privacy-policy.html" class="hover:text-brand-orange transition-colors">Privacy Policy</a></li>
                        <li><a href="terms-condition.html" class="hover:text-brand-orange transition-colors">Terms of Service</a></li>
                        <li><a href="refund-policy.html" class="hover:text-brand-orange transition-colors">Refund Policy</a></li>
                        <li><a href="manage-subscription.html" class="hover:text-brand-orange transition-colors">Manage Subscription</a></li>
                        <li><a href="faqs.html" class="hover:text-brand-orange transition-colors">FAQs</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="text-white font-bold mb-4">Contact</h4>
                    <ul class="space-y-2 text-sm">
                        <li>
                            <a href="mailto:syed@vololeads.com" class="hover:text-brand-orange transition-colors">
                                <i class="fa-regular fa-envelope mr-2 text-brand-orange"></i> syed@vololeads.com
                            </a>
                        </li>
                        <li>
                            <a href="https://wa.me/15551234567" class="hover:text-brand-orange transition-colors">
                                <i class="fa-brands fa-whatsapp mr-2 text-brand-orange"></i> WhatsApp Support
                            </a>
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 class="text-white font-bold mb-4">Follow Us</h4>
                    <div class="flex gap-3">
                        <a href="https://www.linkedin.com/company/vololeads" aria-label="LinkedIn" class="w-10 h-10 rounded-full bg-slate-800 hover:bg-brand-orange flex items-center justify-center transition-colors"><i class="fa-brands fa-linkedin-in"></i></a>
                        <a href="https://www.facebook.com/vololeads" aria-label="Facebook" class="w-10 h-10 rounded-full bg-slate-800 hover:bg-brand-orange flex items-center justify-center transition-colors"><i class="fa-brands fa-facebook-f"></i></a>
                        <a href="https://www.instagram.com/vololeads" aria-label="Instagram" class="w-10 h-10 rounded-full bg-slate-800 hover:bg-brand-orange flex items-center justify-center transition-colors"><i class="fa-brands fa-instagram"></i></a>
                        <a href="https://x.com/vololeads" aria-label="X" class="w-10 h-10 rounded-full bg-slate-800 hover:bg-brand-orange flex items-center justify-center transition-colors"><i class="fa-brands fa-x-twitter"></i></a>
                    </div>
                </div>
            </div>
            <div class="border-t border-slate-800 pt-6 text-sm">
                <p>&copy; <span id="current-year"></span> VoloLeads Agency. All rights reserved.</p>
            </div>
        </div>
    `;

    if (window.renderSiteIcons) {
        window.renderSiteIcons(footer);
    }
}

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

    const card = slider.querySelector('.perspective-1000');
    const gap = parseFloat(window.getComputedStyle(slider).columnGap) || 32;
    const scrollAmount = card ? card.getBoundingClientRect().width + gap : 400;
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
    const referralSelect = document.getElementById('referral-source');
    const referralOtherRow = document.getElementById('referral-other-row');
    const referralOtherInput = document.getElementById('referral-source-other');
    
    // 1. Service Selection -> Toggle Quantity Dropdown
    if (serviceSelect) {
        serviceSelect.addEventListener('change', function() {
            const service = this.value;
            const quantityRow = document.getElementById('quantity-row');
            const quantitySelect = document.getElementById('quantity-select');
            
            if (!quantityRow || !quantitySelect) return;

            // Logic: If they pick a service that needs agents...
            if (service === "Starter" || service === "Growth" || service === "Scale") {
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

    // 3. Referral Source -> Toggle Other Details Input
    if (referralSelect) {
        const syncReferralOtherField = function() {
            const isOther = this.value === 'Other';

            if (referralOtherRow) {
                referralOtherRow.classList.toggle('hidden', !isOther);
            }

            if (referralOtherInput) {
                if (isOther) {
                    referralOtherInput.setAttribute('required', 'true');
                } else {
                    referralOtherInput.removeAttribute('required');
                    referralOtherInput.value = '';
                }
            }
        };

        referralSelect.addEventListener('change', syncReferralOtherField);
        syncReferralOtherField.call(referralSelect);
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
                entry.target.classList.add('is-visible');
                revealOnScroll.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealElements.forEach(element => {
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

    let ticking = false;
    const updateScrollButton = () => {
        btn.classList.toggle('show', window.scrollY > 500);
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateScrollButton);
            ticking = true;
        }
    }, { passive: true });

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
    // Guard: timer span must exist
    if (!timerSpan) return;

    // Ensure duration is available and finite
    if (!isFinite(audio.duration) || isNaN(audio.duration)) return;

    // Calculate remaining time
    const remaining = Math.max(0, audio.duration - audio.currentTime);

    // Math to convert seconds into Minutes:Seconds
    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);

    // Add a "0" if seconds are single digit (e.g. "5:09" instead of "5:9")
    const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    // Update the text on screen
    timerSpan.textContent = formattedTime;

    updateAudioSeekBar(audio);
}

function updateAudioSeekBar(audio) {
    const seek = document.querySelector(`.audio-seek[data-audio-id="${audio.id}"]`);
    if (!seek || seek.dataset.seeking === 'true') return;

    if (!isFinite(audio.duration) || isNaN(audio.duration) || audio.duration <= 0) {
        seek.value = '0';
        seek.style.setProperty('--seek-progress', '0%');
        return;
    }

    const progress = Math.min(100, Math.max(0, (audio.currentTime / audio.duration) * 100));
    seek.value = String(progress);
    seek.style.setProperty('--seek-progress', `${progress}%`);
}

function initAudioSeekBars() {
    document.querySelectorAll('.audio-seek').forEach(seek => {
        const audio = document.getElementById(seek.dataset.audioId);
        if (!audio) return;

        audio.addEventListener('loadedmetadata', () => updateAudioSeekBar(audio));
        audio.addEventListener('ended', () => updateAudioSeekBar(audio));

        seek.addEventListener('pointerdown', () => {
            seek.dataset.seeking = 'true';
        });

        seek.addEventListener('input', () => {
            seek.style.setProperty('--seek-progress', `${seek.value}%`);
        });

        seek.addEventListener('change', () => {
            const applySeek = () => {
                if (isFinite(audio.duration) && !isNaN(audio.duration) && audio.duration > 0) {
                    audio.currentTime = (Number(seek.value) / 100) * audio.duration;
                    updateCountdown(audio);
                }
                seek.dataset.seeking = 'false';
            };

            ensureAudioSource(audio);
            if (isFinite(audio.duration) && !isNaN(audio.duration) && audio.duration > 0) {
                applySeek();
            } else {
                audio.addEventListener('loadedmetadata', applySeek, { once: true });
            }
        });
    });
}

// Optional: Resets the timer back to original text when audio finishes
function resetPlayer(audio) {
    const timerSpan = document.getElementById(`timer-${audio.id}`);
    if (timerSpan && isFinite(audio.duration) && !isNaN(audio.duration)) {
        const minutes = Math.floor(audio.duration / 60);
        const seconds = Math.floor(audio.duration % 60);
        timerSpan.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    // Reset icon to Play (safely)
    const btn = audio.nextElementSibling;
    if (btn) {
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = 'fa-solid fa-play ml-0.5';
            setInlineIcon(icon, 'play');
            if (window.renderSiteIcons) window.renderSiteIcons(btn);
        }
    }

    updateAudioSeekBar(audio);
}

/* --- Flip Card Function --- */
function flipCard(cardWrapper) {
    if (!cardWrapper) return;

    // Finds the inner div that holds the front/back faces and toggles the class
    const innerCard = cardWrapper.querySelector('.transform-style-3d');
    if (innerCard) {
        innerCard.classList.toggle('is-flipped');
        const isFlipped = innerCard.classList.contains('is-flipped');
        if (cardWrapper.hasAttribute('aria-pressed')) {
            cardWrapper.setAttribute('aria-pressed', String(isFlipped));
        }
    }
}

function initFlipCards() {
    document.querySelectorAll('.perspective-1000[role="button"]').forEach(card => {
        card.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            flipCard(card);
        });
    });
}

function initDecorativeIcons() {
    document.querySelectorAll('i[class*="fa-"]').forEach(icon => {
        if (!icon.hasAttribute('aria-hidden')) {
            icon.setAttribute('aria-hidden', 'true');
        }
    });
}

/* --- Subscription Checkout Logic --- */
function initSubscriptionCheckout() {
    const subscribeButtons = document.querySelectorAll('.subscribe-btn[data-plan]');
    if (!subscribeButtons.length) return;

    subscribeButtons.forEach(button => {
        button.addEventListener('click', async event => {
            event.stopPropagation();

            const plan = button.dataset.plan;
            if (!plan) {
                alert('Please choose a valid subscription plan.');
                return;
            }

            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = 'Redirecting…';
            button.classList.add('opacity-75', 'cursor-not-allowed');

            try {
                const response = await fetch('/api/create-checkout-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ plan })
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok || !data.url) {
                    throw new Error(data.message || 'Unable to start checkout.');
                }

                window.location.href = data.url;
            } catch (error) {
                console.error('Subscription checkout error:', error);
                alert('We could not start checkout right now. Please try again or contact support.');
                button.disabled = false;
                button.textContent = originalText;
                button.classList.remove('opacity-75', 'cursor-not-allowed');
            }
        });
    });
}

/* --- Manage Subscription Request Logic --- */
function initManageSubscriptionForm() {
    const form = document.getElementById('manage-subscription-form');
    if (!form) return;

    const emailInput = document.getElementById('manage-email');
    const submitButton = document.getElementById('manage-submit-btn');
    const message = document.getElementById('manage-subscription-message');

    form.addEventListener('submit', async event => {
        event.preventDefault();

        const email = emailInput ? emailInput.value.trim() : '';
        const turnstileToken = getTurnstileToken(form);
        if (!email) {
            if (message) {
                message.textContent = 'Please enter the email address used for your subscription.';
                message.className = 'mt-4 text-sm font-semibold text-red-600 dark:text-red-400';
            }
            return;
        }

        if (!turnstileToken) {
            if (message) {
                message.textContent = 'Please complete the security check before continuing.';
                message.className = 'mt-4 text-sm font-semibold text-red-600 dark:text-red-400';
            }
            return;
        }

        const originalText = submitButton ? submitButton.textContent : '';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Sending…';
            submitButton.classList.add('opacity-75', 'cursor-not-allowed');
        }
        if (message) {
            message.textContent = '';
            message.className = 'mt-4 text-sm font-semibold';
        }

        try {
            const response = await fetch('/api/request-manage-link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    'cf-turnstile-response': turnstileToken
                })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || 'Unable to request manage link.');
            }

            form.reset();
            if (message) {
                message.textContent = 'Check your email for a secure manage subscription link.';
                message.className = 'mt-4 text-sm font-semibold text-green-600 dark:text-green-400';
            }
        } catch (error) {
            console.error('Manage subscription request error:', error);
            if (message) {
                message.textContent = 'We could not send the manage link right now. Please try again or contact support.';
                message.className = 'mt-4 text-sm font-semibold text-red-600 dark:text-red-400';
            }
        } finally {
            resetTurnstile(form);
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
                submitButton.classList.remove('opacity-75', 'cursor-not-allowed');
            }
        }
    });
}

function populateSubscriberTimeSlots(timeSelect) {
    if (!timeSelect || timeSelect.options.length > 1) return;

    const startHour = 9;
    const endHour = 16;

    for (let h = startHour; h <= endHour; h += 1) {
        for (let m = 0; m < 60; m += 30) {
            if (h === 16 && m > 30) continue;

            const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            const ampm = h < 12 ? 'AM' : 'PM';
            const displayHour = ((h + 11) % 12) + 1;
            const text = `${displayHour}:${String(m).padStart(2, '0')} ${ampm} EST`;

            const opt = document.createElement('option');
            opt.value = value;
            opt.text = text;
            timeSelect.appendChild(opt);
        }
    }
}

function initScheduleOnboardingPage() {
    const loading = document.getElementById('schedule-access-loading');
    const denied = document.getElementById('schedule-access-denied');
    const deniedMessage = document.getElementById('schedule-access-denied-message');
    const complete = document.getElementById('schedule-access-complete');
    const shell = document.getElementById('schedule-onboarding-shell');
    const form = document.getElementById('schedule-onboarding-form');

    if (!loading || !denied || !shell || !form) return;

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    let bookingToken = null;

    const showDenied = (message) => {
        loading.classList.add('hidden');
        shell.classList.add('hidden');
        complete.classList.add('hidden');
        denied.classList.remove('hidden');
        if (deniedMessage && message) {
            deniedMessage.textContent = message;
        }
    };

    const showComplete = () => {
        loading.classList.add('hidden');
        denied.classList.add('hidden');
        shell.classList.add('hidden');
        complete.classList.remove('hidden');
    };

    const showForm = (data) => {
        loading.classList.add('hidden');
        denied.classList.add('hidden');
        complete.classList.add('hidden');
        shell.classList.remove('hidden');

        const emailInput = document.getElementById('subscriber-email');
        const planBadge = document.getElementById('schedule-plan-badge');
        const dateInput = document.getElementById('subscriber-date');
        const timeRow = document.getElementById('subscriber-time-row');
        const timeSelect = document.getElementById('subscriber-time');

        if (emailInput) emailInput.value = data.email || '';
        if (planBadge) planBadge.textContent = `Plan: ${data.planDisplayName || 'Subscriber'}`;

        if (dateInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateInput.min = tomorrow.toISOString().slice(0, 10);

            dateInput.addEventListener('change', function handleDateChange() {
                if (!this.value) {
                    if (timeRow) timeRow.classList.add('hidden');
                    if (timeSelect) {
                        timeSelect.removeAttribute('required');
                        timeSelect.value = '';
                    }
                    return;
                }

                populateSubscriberTimeSlots(timeSelect);
                if (timeRow) timeRow.classList.remove('hidden');
                if (timeSelect) timeSelect.setAttribute('required', 'true');
            });
        }
    };

    const verifyAccess = async () => {
        if (!sessionId) {
            showDenied('This page requires a valid checkout session. Use the link from your subscription confirmation email.');
            return;
        }

        try {
            const response = await fetch(`/api/verify-subscriber-access?session_id=${encodeURIComponent(sessionId)}`);
            const data = await response.json().catch(() => ({}));

            if (response.status === 409) {
                showComplete();
                return;
            }

            if (!response.ok || !data.data?.bookingToken) {
                throw new Error(data.message || 'Unable to verify subscription access.');
            }

            bookingToken = data.data.bookingToken;
            showForm(data.data);
        } catch (error) {
            console.error('Subscriber access verification error:', error);
            showDenied(error.message || 'Unable to verify subscription access.');
        }
    };

    const submitButton = document.getElementById('schedule-submit-btn');
    const btnText = document.getElementById('schedule-btn-text');
    const btnLoader = document.getElementById('schedule-btn-loader');
    const message = document.getElementById('schedule-onboarding-message');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!bookingToken) {
            if (message) {
                message.textContent = 'Subscription access has expired. Please reopen the link from your confirmation email.';
                message.className = 'text-sm font-semibold text-red-600 dark:text-red-400 text-center';
            }
            return;
        }

        const turnstileToken = getTurnstileToken(form);
        if (!turnstileToken) {
            if (message) {
                message.textContent = 'Please complete the security check before scheduling.';
                message.className = 'text-sm font-semibold text-red-600 dark:text-red-400 text-center';
            }
            return;
        }

        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());
        payload['cf-turnstile-response'] = turnstileToken;

        if (submitButton) submitButton.disabled = true;
        if (btnText) btnText.classList.add('hidden');
        if (btnLoader) btnLoader.classList.remove('hidden');
        if (message) {
            message.textContent = '';
            message.className = 'text-sm font-semibold text-center';
        }

        try {
            const response = await fetch('/api/subscriber/schedule-meeting', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${bookingToken}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || 'Unable to schedule onboarding call.');
            }

            showComplete();
        } catch (error) {
            console.error('Schedule onboarding error:', error);
            if (message) {
                message.textContent = error.message || 'We could not schedule your call right now. Please try again or contact support.';
                message.className = 'text-sm font-semibold text-red-600 dark:text-red-400 text-center';
            }
        } finally {
            resetTurnstile(form);
            if (submitButton) submitButton.disabled = false;
            if (btnText) btnText.classList.remove('hidden');
            if (btnLoader) btnLoader.classList.add('hidden');
        }
    });

    verifyAccess();
}

function initSubscriptionSuccessPage() {
    const scheduleLink = document.getElementById('schedule-onboarding-link');
    if (!scheduleLink) return;

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (!sessionId) {
        scheduleLink.classList.add('hidden');
        return;
    }

    scheduleLink.href = `schedule-onboarding.html?session_id=${encodeURIComponent(sessionId)}`;
}

function getTurnstileToken(scope) {
    const tokenInput = scope ? scope.querySelector('[name="cf-turnstile-response"]') : null;
    return tokenInput ? tokenInput.value : '';
}

function resetTurnstile(scope) {
    if (!window.turnstile || !scope) return;

    const widget = scope.querySelector('.cf-turnstile');
    if (widget) {
        window.turnstile.reset(widget);
    }
}

function initTurnstileLoader() {
    const widgets = document.querySelectorAll('.cf-turnstile');
    if (!widgets.length || window.turnstile) return;

    const loadTurnstile = () => {
        if (document.querySelector('script[data-turnstile-api]')) return;

        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
        script.async = true;
        script.defer = true;
        script.dataset.turnstileApi = 'true';
        document.head.appendChild(script);
    };

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) {
                observer.disconnect();
                loadTurnstile();
            }
        }, { rootMargin: '400px 0px' });

        widgets.forEach(widget => observer.observe(widget));
    } else {
        loadTurnstile();
    }
}

/* ========== PLANS VISIBILITY HELPERS ========== */
function equalizePlanCardHeights() {
    const plansRoot = document.getElementById('plans');
    const plansGrid = document.getElementById('pricing-slider') || document.querySelector('#plans .plans-pricing-grid');
    if (!plansRoot || !plansGrid) return;

    const cards = [...plansGrid.querySelectorAll(':scope > .perspective-1000')];
    let maxContentHeight = 0;

    cards.forEach(card => {
        card.style.setProperty('height', 'auto', 'important');
        card.style.setProperty('min-height', '0', 'important');

        const frontFace = card.querySelector('.transform-style-3d > .backface-hidden:first-child');
        if (frontFace) {
            frontFace.style.setProperty('position', 'static', 'important');
            frontFace.style.setProperty('min-height', '0', 'important');
            frontFace.style.setProperty('height', 'auto', 'important');
        }
    });

    cards.forEach(card => {
        const frontFace = card.querySelector('.transform-style-3d > .backface-hidden:first-child');
        if (!frontFace) return;
        maxContentHeight = Math.max(maxContentHeight, frontFace.scrollHeight);
    });

    cards.forEach(card => {
        card.style.removeProperty('height');
        card.style.removeProperty('min-height');

        const frontFace = card.querySelector('.transform-style-3d > .backface-hidden:first-child');
        if (frontFace) {
            frontFace.style.removeProperty('position');
            frontFace.style.removeProperty('min-height');
            frontFace.style.removeProperty('height');
        }
    });

    if (maxContentHeight <= 0) return;

    const cardHeight = Math.ceil(maxContentHeight + 40);
    plansRoot.style.setProperty('--plan-card-height', `${cardHeight}px`);
}

function initMobilePlansCarousel() {
    const plansGrid = document.getElementById('pricing-slider') || document.querySelector('#plans .plans-pricing-grid');
    if (!plansGrid) return;

    plansGrid.classList.add('scrollbar-hide');
    plansGrid.querySelectorAll('.perspective-1000').forEach(card => {
        card.classList.add('is-visible');
    });

    equalizePlanCardHeights();

    if (!window.__planCardHeightResizeBound) {
        window.__planCardHeightResizeBound = true;
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(equalizePlanCardHeights, 150);
        });
    }
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

        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const submitTime = Date.now();
            const timeDifference = submitTime - loadTime;

            // Check 1: Honey Trap (Must remain empty)
            if (honeyTrap && honeyTrap.value !== "") {
                console.warn("Bot detected: Honey trap triggered.");
                return false;
            }

            // Check 2: Time Trap (Must take > 3 seconds)
            if (timeDifference < 3000) {
                console.warn("Bot detected: Form filled too fast.");
                alert("Please wait a moment before submitting to verify you are human.");
                return false;
            }

            if (!getTurnstileToken(contactForm)) {
                alert('Please complete the security check before submitting.');
                return false;
            }

            // Check 3: UI Feedback (Prevent Double Submit)
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-75', 'cursor-not-allowed');

                if (btnText) btnText.classList.add('hidden');
                if (btnLoader) btnLoader.classList.remove('hidden');
            }

            // Collect form data
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);

            try {
                // Send to backend API (stores submission and emails admin via cPanel SMTP)
                const response = await fetch('/api/contact-form', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    // Redirect to thank you page
                    window.location.href = '/thank-you.html';
                } else {
                    console.error('Form submission failed:', response.status);
                    alert('Failed to submit form. Please try again.');

                    // Re-enable button
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
                    }
                    if (btnText) btnText.classList.remove('hidden');
                    if (btnLoader) btnLoader.classList.add('hidden');
                    resetTurnstile(contactForm);
                }
            } catch (error) {
                console.error('Form submission error:', error);
                alert('An error occurred. Please try again.');

                // Re-enable button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
                }
                if (btnText) btnText.classList.remove('hidden');
                if (btnLoader) btnLoader.classList.add('hidden');
                resetTurnstile(contactForm);
            }

            return false;
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
async function submitVisitorData(visitorData) {
    const payload = {
        visitor_name: visitorData.visitor_name,
        visitor_email: visitorData.visitor_email,
        visit_page: window.location.pathname,
        visit_timestamp: new Date().toISOString(),
        referrer: document.referrer || 'Direct',
        user_agent: navigator.userAgent.substring(0, 100),
        visit_count: visitorData.visit_count
    };

    try {
        const response = await fetch('/api/visitors', {
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
            event_type: 'page_exit',
            visitor_name: visitorName,
            visitor_email: visitorEmail,
            page_url: window.location.href,
            time_spent_seconds: timeSpentOnPage,
            exit_timestamp: new Date().toISOString()
        };

        // Use sendBeacon to submit to your backend endpoint
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/events', JSON.stringify(exitData));
        }
    }
}

// ========== COOKIE CONSENT HANDLERS ==========
function acceptCookieConsent() {
    // Set consent flag only (do NOT collect PII here)
    setCookie('cookie_consent', 'accepted', 365);

    // Hide banner
    const banner = document.getElementById('cookie-consent-banner');
    if (banner) banner.style.display = 'none';

    // Load only the third-party scripts that require consent
    loadThirdPartyScriptsOnConsent();

    console.log('Visitor consent accepted (no PII collected in banner)');
}

function declineCookieConsent() {
    // Store rejection and remove any existing visitor PII cookies
    setCookie('cookie_consent', 'rejected', 365);
    deleteCookie('visitor_name');
    deleteCookie('visitor_email');

    // Hide banner
    const banner = document.getElementById('cookie-consent-banner');
    if (banner) banner.style.display = 'none';

    console.log('Visitor declined cookie consent');
}

// ========== COOKIE CONSENT BANNER UI ==========
function initCookieConsentBanner() {
    // Create a minimal, GDPR-friendly banner (no PII collection)
    const bannerHTML = `
        <div id="cookie-consent-banner" style="position: fixed;bottom:0;left:0;right:0;z-index:9999;background:#0f172a;color:#fff;padding:16px;display:none;">
            <div style="max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                <div style="flex:1;min-width:240px;font-size:15px;">We use cookies for analytics and to improve your experience. Do you consent to optional cookies and third-party widgets?</div>
                <div style="display:flex;gap:8px;">
                    <button id="cookie-decline-btn" style="background:transparent;border:1px solid #fff;color:#fff;padding:10px 14px;border-radius:6px;font-weight:600;">Decline</button>
                    <button id="cookie-accept-btn" style="background:#f97316;color:#fff;padding:10px 14px;border-radius:6px;border:none;font-weight:700;">Accept</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', bannerHTML);

    // Attach handlers
    const acceptBtn = document.getElementById('cookie-accept-btn');
    const declineBtn = document.getElementById('cookie-decline-btn');
    if (acceptBtn) acceptBtn.addEventListener('click', acceptCookieConsent);
    if (declineBtn) declineBtn.addEventListener('click', declineCookieConsent);
}

// Lazy-load third-party scripts only after consent
function loadThirdPartyScriptsOnConsent() {
    // Example: Crisp chat loader ONLY if window.CRISP_WEBSITE_ID is provided by server-side template or env
    if (window.CRISP_WEBSITE_ID) {
        (function() {
            window.$crisp = []; window.CRISP_WEBSITE_ID = window.CRISP_WEBSITE_ID;
            var d = document; var s = d.createElement("script"); s.src = "https://client.crisp.chat/l.js"; s.async = 1;
            d.getElementsByTagName("head")[0].appendChild(s);
        })();
    }

    // Potentially enable analytics or other widgets here when consented
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

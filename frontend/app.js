/* ============================================
   VoloLeads Application Logic
   ============================================ */

function initializeVoloLeadsPage() {
    initPageLoadAnimation();
    initMobileMenu();
    renderUniversalFooter();
    updateCopyrightYear();
    initDarkMode();
    initContactForm();
    initFormSecurity();
    initCounterAnimation();
    initRevealOnScroll();
    initMotionSequences();
    initStickyMobileCta();
    initPremiumMotion();
    initScrollToTop();
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
    initGuidedHowItWorks();
    initPlanRecommender();
    initTrustpilotCarousel();
    initDeliverablePreviews();
    initAudioBreakdowns();
    initBookingSummary();
    initWhatsAppWidget();

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
}

window.initializeVoloLeadsPage = initializeVoloLeadsPage;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeVoloLeadsPage, { once: true });
} else if (!window.__VOLOLEADS_MANAGED_BY_NEXT__) {
    initializeVoloLeadsPage();
}

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
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const mobileDarkModeToggle = document.getElementById('mobile-dark-mode-toggle');

    let savedTheme = null;
    try {
        savedTheme = localStorage.getItem('dark-mode');
        if (savedTheme === null && localStorage.getItem('darkMode') === 'true') {
            savedTheme = 'true';
            localStorage.setItem('dark-mode', 'true');
        }
    } catch (error) {
        console.warn('Dark mode preference unavailable', error);
    }

    // Keep first visits in the readable day theme; a user's explicit choice
    // still wins on every subsequent visit.
    const initialDarkMode = savedTheme === 'true';

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

    const applyTheme = (isDark, persist = false) => {
        html.classList.toggle('dark', isDark);
        html.style.colorScheme = isDark ? 'dark' : 'light';

        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
            themeColorMeta.setAttribute('content', isDark ? '#020617' : '#f8fafc');
        }

        const darkModeIcon = document.getElementById('dark-mode-icon');
        const mobileDarkModeIcon = document.getElementById('mobile-dark-mode-icon');

        if (darkModeIcon) updateIcon(darkModeIcon, isDark);
        if (mobileDarkModeIcon) updateIcon(mobileDarkModeIcon, isDark);

        [darkModeToggle, mobileDarkModeToggle].filter(Boolean).forEach(toggle => {
            const nextTheme = isDark ? 'light' : 'dark';
            toggle.setAttribute('aria-checked', String(isDark));
            toggle.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
            toggle.setAttribute('title', `Switch to ${nextTheme} mode`);
        });

        if (window.renderSiteIcons) window.renderSiteIcons();

        if (persist) {
            try {
                localStorage.setItem('dark-mode', String(isDark));
            } catch (error) {
                console.warn('Could not save dark mode preference', error);
            }
        }
    };

    const toggleDarkMode = () => applyTheme(!html.classList.contains('dark'), true);

    applyTheme(initialDarkMode);

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
        currentButton?.closest('.audio-player-panel')?.classList.remove('is-playing');
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
                btn.closest('.audio-player-panel')?.classList.add('is-playing');
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
        btn.closest('.audio-player-panel')?.classList.remove('is-playing');
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
        currentButton.closest('.audio-player-panel')?.classList.remove('is-playing');
        currentAudio = null;
        currentButton = null;
    }
};

/* --- Utilities --- */
function renderUniversalFooter() {
    const footer = document.querySelector('body > footer');
    if (!footer) return;

    footer.className = 'bg-brand-navy text-slate-400 py-12 border-t border-slate-800 scroll-mt-32';
    footer.innerHTML = `
        <div class="container mx-auto px-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
                <div class="lg:col-span-2">
                    <a href="index.html#home" class="flex items-center space-x-2 mb-4">
                        <img src="./png/logo.webp" alt="" aria-hidden="true" class="site-brand-logo site-brand-logo-sm">
                        <span class="text-white text-xl font-bold">VoloLeads</span>
                    </a>
                    <p class="text-sm max-w-sm">Managed acquisition teams for real estate wholesalers. We run the pipeline; you close.</p>
                </div>
                <div>
                    <h4 class="text-white font-bold mb-4">Navigate</h4>
                    <ul class="space-y-2 text-sm">
                        <li><a href="index.html#about" class="hover:text-brand-orange transition-colors">About Us</a></li>
                        <li><a href="index.html#plans" class="hover:text-brand-orange transition-colors">Services</a></li>
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
                        <li><a href="disclaimer.html" class="hover:text-brand-orange transition-colors">Disclaimer</a></li>
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
                            <a href="https://wa.me/8801793716608" class="hover:text-brand-orange transition-colors">
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

/* --- WhatsApp Support Widget --- */
function initWhatsAppWidget() {
    if (document.querySelector('[data-whatsapp-widget]')) return;

    const phoneNumber = '8801793716608';
    const salesMessage = encodeURIComponent("Hi VoloLeads, I'd like to discuss a lead generation plan.");
    const supportMessage = encodeURIComponent('Hi VoloLeads, I need help with my account or active campaign.');
    const widget = document.createElement('div');
    widget.className = 'whatsapp-widget';
    widget.classList.toggle('whatsapp-widget--with-sticky-cta', Boolean(document.querySelector('.mobile-sticky-cta')));
    widget.dataset.whatsappWidget = '';
    widget.innerHTML = `
        <aside id="whatsapp-support-panel" class="whatsapp-support-panel" role="dialog" aria-modal="false" aria-labelledby="whatsapp-support-title" aria-hidden="true" inert>
            <header class="whatsapp-support-header">
                <span class="whatsapp-support-mark" aria-hidden="true"><i class="fa-brands fa-whatsapp"></i></span>
                <div>
                    <p>DIRECT SUPPORT</p>
                    <h2 id="whatsapp-support-title">Start a conversation</h2>
                    <span>Choose the right team and message us on WhatsApp.</span>
                </div>
                <button type="button" class="whatsapp-panel-close" aria-label="Close WhatsApp support">
                    <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
            </header>
            <div class="whatsapp-support-body">
                <p class="whatsapp-response-note"><span aria-hidden="true"></span> We typically reply within a few minutes.</p>
                <div class="whatsapp-support-routes">
                    <a class="whatsapp-support-route" href="https://wa.me/${phoneNumber}?text=${salesMessage}" target="_blank" rel="noopener noreferrer">
                        <span class="whatsapp-route-avatar whatsapp-route-avatar--brand"><img src="./png/logo.webp" alt=""></span>
                        <span class="whatsapp-route-copy">
                            <strong>Sales &amp; Strategy</strong>
                            <small><span aria-hidden="true"></span> Online now</small>
                            <em>Plans, pricing, and campaign fit</em>
                        </span>
                        <span class="whatsapp-route-action" aria-hidden="true"><i class="fa-brands fa-whatsapp"></i></span>
                    </a>
                    <a class="whatsapp-support-route" href="https://wa.me/${phoneNumber}?text=${supportMessage}" target="_blank" rel="noopener noreferrer">
                        <span class="whatsapp-route-avatar whatsapp-route-avatar--support" aria-hidden="true"><i class="fa-solid fa-headset"></i></span>
                        <span class="whatsapp-route-copy">
                            <strong>Client Support</strong>
                            <small><span aria-hidden="true"></span> Online now</small>
                            <em>Accounts and active campaigns</em>
                        </span>
                        <span class="whatsapp-route-action" aria-hidden="true"><i class="fa-brands fa-whatsapp"></i></span>
                    </a>
                </div>
                <p class="whatsapp-privacy-note"><i class="fa-solid fa-lock" aria-hidden="true"></i> Opens a private chat with VoloLeads</p>
            </div>
        </aside>
        <button type="button" class="whatsapp-launcher" aria-controls="whatsapp-support-panel" aria-expanded="false">
            <span class="whatsapp-launcher-icon" aria-hidden="true"><i class="fa-brands fa-whatsapp"></i></span>
            <span class="whatsapp-launcher-label"><small>Questions?</small><strong>Chat with us</strong></span>
            <span class="whatsapp-launcher-status" aria-hidden="true"></span>
        </button>
    `;

    document.body.appendChild(widget);
    if (window.renderSiteIcons) window.renderSiteIcons(widget);

    const panel = widget.querySelector('.whatsapp-support-panel');
    const launcher = widget.querySelector('.whatsapp-launcher');
    const closeButton = widget.querySelector('.whatsapp-panel-close');
    let isOpen = false;

    const setOpen = (open, restoreFocus = true) => {
        isOpen = open;
        widget.classList.toggle('is-open', open);
        launcher.setAttribute('aria-expanded', String(open));
        panel.setAttribute('aria-hidden', String(!open));

        if (open) {
            panel.removeAttribute('inert');
            window.requestAnimationFrame(() => closeButton.focus({ preventScroll: true }));
        } else {
            panel.setAttribute('inert', '');
            if (restoreFocus) launcher.focus({ preventScroll: true });
        }
    };

    launcher.addEventListener('click', () => setOpen(!isOpen));
    closeButton.addEventListener('click', () => setOpen(false));

    widget.querySelectorAll('.whatsapp-support-route').forEach(route => {
        route.addEventListener('click', () => setOpen(false, false));
    });

    document.addEventListener('pointerdown', event => {
        if (isOpen && !widget.contains(event.target)) setOpen(false, false);
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && isOpen) setOpen(false);
    });
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
function formatMeetingSlotLabel(value) {
    const [hourPart, minutePart] = value.split(':');
    const hour = Number(hourPart);
    const minute = Number(minutePart);
    const ampm = hour < 12 ? 'AM' : 'PM';
    const displayHour = ((hour + 11) % 12) + 1;
    return `${displayHour}:${String(minute).padStart(2, '0')} EST`;
}

function resetTimeSelect(timeSelect, placeholder) {
    if (!timeSelect) return;
    timeSelect.innerHTML = '';
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = placeholder || 'Select a time';
    timeSelect.appendChild(placeholderOption);
}

function addMeetingCalendarDays(dateValue, days) {
    const [year, month, day] = dateValue.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day + days));
    return date.toISOString().slice(0, 10);
}

function isSundayMeetingDate(dateValue) {
    const [year, month, day] = dateValue.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 0;
}

function getMinimumMeetingDate() {
    const cutoff = new Date(Date.now() + (24 * 60 * 60 * 1000));
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23'
        })
            .formatToParts(cutoff)
            .filter((part) => part.type !== 'literal')
            .map((part) => [part.type, part.value])
    );
    let minimumDate = `${parts.year}-${parts.month}-${parts.day}`;
    const cutoffMinutes = (Number(parts.hour || 0) * 60) + Number(parts.minute || 0);
    if (cutoffMinutes > (9 * 60) || (cutoffMinutes === (9 * 60) && Number(parts.second || 0) > 0)) {
        minimumDate = addMeetingCalendarDays(minimumDate, 1);
    }
    while (isSundayMeetingDate(minimumDate)) {
        minimumDate = addMeetingCalendarDays(minimumDate, 1);
    }
    return minimumDate;
}

function validateMeetingDateInput(dateInput) {
    if (!dateInput?.value) return true;
    const isSunday = isSundayMeetingDate(dateInput.value);
    dateInput.setCustomValidity(isSunday ? 'Meetings are not available on Sundays.' : '');
    if (isSunday) dateInput.reportValidity();
    return !isSunday;
}

async function loadAvailableMeetingSlots({
    date,
    timeSelect,
    timeRow,
    timezone = 'EST',
    timezoneInput
}) {
    const preferredTimezone = timezoneInput?.value || timezone;

    resetTimeSelect(timeSelect, 'Loading times...');
    if (timeRow) timeRow.classList.remove('hidden');
    if (timeSelect) timeSelect.setAttribute('required', 'true');

    try {
        const response = await fetch(
            `/api/meeting-availability?date=${encodeURIComponent(date)}&timezone=${encodeURIComponent(preferredTimezone)}`
        );
        const payload = await response.json().catch(() => ({}));
        const slots = payload.data?.slots || [];

        resetTimeSelect(timeSelect, slots.length ? 'Select a time' : 'No times available');

        slots.forEach((slot) => {
            const opt = document.createElement('option');
            opt.value = slot;
            opt.textContent = formatMeetingSlotLabel(slot);
            timeSelect.appendChild(opt);
        });

        if (!slots.length && timeSelect) {
            timeSelect.removeAttribute('required');
        }
    } catch (error) {
        console.error('Meeting availability error:', error);
        resetTimeSelect(timeSelect, 'Unable to load times');
        if (timeSelect) timeSelect.removeAttribute('required');
    }
}

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
            if (service === "Essential" || service === "Growth" || service === "Scale") {
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
        dateInput.min = getMinimumMeetingDate();

        // Handle Date Change -> Show available time slots
        dateInput.addEventListener('change', function() {
            const timeRow = document.getElementById('time-row');
            const timeSelect = document.getElementById('preferred-time');
            const timezoneInput = document.getElementById('preferred-timezone');
            
            if (!this.value) {
                if (timeRow) timeRow.classList.add('hidden');
                if (timeSelect) { 
                    timeSelect.removeAttribute('required'); 
                    timeSelect.value = ''; 
                }
                return;
            }

            if (!validateMeetingDateInput(this)) {
                if (timeRow) timeRow.classList.add('hidden');
                if (timeSelect) timeSelect.removeAttribute('required');
                return;
            }

            loadAvailableMeetingSlots({
                date: this.value,
                timeSelect,
                timeRow,
                timezoneInput
            });
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
    if (!counters.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const setCounterValue = (counter, value) => {
        counter.textContent = Math.round(value).toLocaleString();
    };

    const animateCounter = (counter) => {
        const target = Number(counter.getAttribute('data-target')) || 0;
        counter.closest('.kpi-motion-card')?.classList.add('is-active');
        if (reduceMotion) {
            setCounterValue(counter, target);
            return;
        }

        const duration = Number(counter.dataset.duration) || 1200;
        const startTime = performance.now();

        const update = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCounterValue(counter, target * eased);
            if (progress < 1) requestAnimationFrame(update);
        };

        requestAnimationFrame(update);
    };

    if (reduceMotion) {
        counters.forEach(animateCounter);
        return;
    }

    if (!('IntersectionObserver' in window)) {
        counters.forEach(animateCounter);
        return;
    }

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
    if (!revealElements.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
        revealElements.forEach(element => element.classList.add('is-visible'));
        return;
    }

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

function initMotionSequences() {
    const groups = [
        document.querySelector('.proof-strip-grid'),
        document.querySelector('.how-grid'),
        ...document.querySelectorAll('.comparison-table-wrap')
    ].filter(Boolean);

    if (!groups.length) return;

    document.documentElement.classList.add('motion-ready');

    groups.forEach(group => {
        const items = group.matches('.comparison-table-wrap')
            ? group.querySelectorAll('tbody tr')
            : group.children;

        [...items].forEach((item, index) => {
            item.style.setProperty('--motion-order', index);
        });
    });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
        groups.forEach(group => group.classList.add('is-motion-visible'));
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-motion-visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

    groups.forEach(group => observer.observe(group));
}

function initStickyMobileCta() {
    const hero = document.getElementById('home');
    const cta = document.querySelector('.mobile-sticky-cta');
    const contact = document.getElementById('contact');
    if (!hero || !cta) return;

    const label = cta.querySelector('[data-sticky-cta-label]');
    const contextLabel = cta.querySelector('.sticky-cta-context');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const defaultContext = {
        label: 'Book a Strategy Call',
        context: "LET'S TALK"
    };
    const sectionContexts = [
        { section: document.getElementById('plans'), label: 'Help Me Choose a Plan', context: 'PRICING' },
        { section: document.getElementById('insights'), label: 'Discuss Your Campaign', context: 'CALLS' },
        { section: document.getElementById('testimonials'), label: 'Get Similar Results', context: 'RESULTS' },
        { section: document.getElementById('faq-preview'), label: 'Ask a Question', context: 'FAQ' }
    ].filter(item => item.section);

    document.documentElement.classList.add('sticky-cta-ready');
    let pendingLabel = defaultContext.label;
    let frameRequested = false;

    const commitContext = context => {
        pendingLabel = context.label;
        if (label) label.textContent = context.label;
        if (contextLabel) contextLabel.textContent = context.context;
        cta.setAttribute('aria-label', `${context.label} — opens the strategy call form`);
        cta.dataset.ctaContext = context.context.toLowerCase();
    };

    const changeContext = context => {
        if (context.label === pendingLabel) return;
        commitContext(context);
        if (reduceMotion) return;

        cta.classList.add('is-context-changing');
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => cta.classList.remove('is-context-changing'));
        });
    };

    const update = () => {
        frameRequested = false;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
        const readingPosition = scrollTop + (viewportHeight * 0.44);
        const heroBottom = hero.getBoundingClientRect().top + scrollTop + hero.offsetHeight;
        const contactTop = contact ? contact.getBoundingClientRect().top + scrollTop : Number.POSITIVE_INFINITY;
        const heroHasPassed = readingPosition > heroBottom;
        const contactAhead = readingPosition < contactTop;
        cta.classList.toggle('is-visible', heroHasPassed && contactAhead);

        const activeContext = sectionContexts.find(item => {
            const sectionTop = item.section.getBoundingClientRect().top + scrollTop;
            const sectionBottom = sectionTop + item.section.offsetHeight;
            return readingPosition >= sectionTop && readingPosition < sectionBottom;
        });
        changeContext(activeContext || defaultContext);
    };

    const requestUpdate = () => {
        if (frameRequested) return;
        frameRequested = true;
        window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    update();
}

function initPremiumMotion() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    initCompressedNavbar();
    initHeadingReveals(reduceMotion);
    initKeywordUnderlineHighlights(reduceMotion);
    initGrowthCardEmphasis(reduceMotion);
    initAudioWaveforms();
    initKpiStorytelling();
    initPremiumButtons();
    initAnimatedFaqDetails(reduceMotion);
    initInternalPageTransitions(reduceMotion);
    initInsightScrollProgress();
}

function initKeywordUnderlineHighlights(reduceMotion) {
    if (reduceMotion) return;

    const selector = [
        ':is(h1, h2, h3) span[class*="bg-gradient-to-r"]',
        ':is(h1, h2, h3)[class*="bg-gradient-to-r"]',
        '.section-heading-row h2 > span',
        '.daily-deliverables-card h2 > span',
        '.plans-partnership-heading .plans-partnership-name'
    ].join(',');

    const keywords = [...document.querySelectorAll(selector)].filter(keyword => (
        !keyword.matches('#home h1 > span, .plans-partnership-name--cow')
    ));
    if (!keywords.length) return;

    const headingGroups = new Map();
    keywords.forEach(keyword => {
        const heading = keyword.closest('h1, h2, h3');
        if (!heading) return;
        if (!headingGroups.has(heading)) headingGroups.set(heading, []);
        headingGroups.get(heading).push(keyword);
    });

    if (!('IntersectionObserver' in window)) {
        headingGroups.forEach(group => group.forEach((keyword, index) => {
            keyword.style.setProperty('--keyword-order', index);
            keyword.classList.add('keyword-highlight-active');
        }));
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const group = headingGroups.get(entry.target) || [];
            group.forEach((keyword, index) => {
                keyword.style.setProperty('--keyword-order', index);
                keyword.classList.add('keyword-highlight-active');
            });
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.42, rootMargin: '0px 0px -6% 0px' });

    headingGroups.forEach((_, heading) => observer.observe(heading));
}

function initCompressedNavbar() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    let ticking = false;
    const update = () => {
        nav.classList.toggle('nav-compressed', window.scrollY > 72);
        ticking = false;
    };

    update();
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
    }, { passive: true });
}

function initHeadingReveals(reduceMotion) {
    const headings = document.querySelectorAll(
        'main section h2, main section > div > h3, .insight-article h2, .insight-article h3'
    );
    if (!headings.length) return;

    headings.forEach(heading => heading.classList.add('motion-heading'));

    if (reduceMotion || !('IntersectionObserver' in window)) {
        headings.forEach(heading => heading.classList.add('is-revealed'));
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.35, rootMargin: '0px 0px -8% 0px' });

    headings.forEach(heading => observer.observe(heading));
}

function initGrowthCardEmphasis(reduceMotion) {
    const card = document.querySelector('#plans [aria-label="Flip Growth plan card"]');
    if (!card) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
        card.classList.add('growth-entered');
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('growth-entered');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.52 });

    observer.observe(card);
}

function initAudioWaveforms() {
    document.querySelectorAll('.audio-player-panel').forEach((panel, panelIndex) => {
        if (panel.querySelector('.audio-waveform')) return;

        const waveform = document.createElement('div');
        waveform.className = 'audio-waveform';
        waveform.setAttribute('aria-hidden', 'true');

        for (let index = 0; index < 16; index += 1) {
            const bar = document.createElement('span');
            bar.style.setProperty('--wave-height', `${28 + ((index * 19 + panelIndex * 11) % 62)}%`);
            bar.style.setProperty('--wave-delay', `${index * -55}ms`);
            waveform.appendChild(bar);
        }

        const timer = panel.querySelector('[id^="timer-audio-"]');
        panel.insertBefore(waveform, timer || panel.querySelector('.audio-seek'));
    });
}

function initKpiStorytelling() {
    document.querySelectorAll('.counter-animate').forEach(counter => {
        const card = counter.closest('.proof-strip-grid > div, #testimonials .grid > div, #about .grid > div')
            || counter.parentElement?.parentElement;
        if (!card || card.querySelector('.kpi-storyline')) return;

        card.classList.add('kpi-motion-card');
        const target = Number(counter.dataset.target) || 0;
        const width = target >= 1000 ? 94 : target >= 100 ? 100 : 78;
        const line = document.createElement('span');
        line.className = 'kpi-storyline';
        line.setAttribute('aria-hidden', 'true');
        line.style.setProperty('--kpi-width', `${width}%`);
        card.appendChild(line);
    });
}

function initPremiumButtons() {
    const selector = [
        'a[href="#contact"]',
        '.subscribe-btn',
        '#submit-btn',
        '.faq-all-link',
        '.prefooter-cta a',
        '.mobile-sticky-cta'
    ].join(',');

    document.querySelectorAll(selector).forEach(button => button.classList.add('premium-motion-button'));
}

function initAnimatedFaqDetails(reduceMotion) {
    if (reduceMotion) return;

    document.querySelectorAll('.faq-preview-list details').forEach(detail => {
        detail.parentElement?.classList.add('faq-motion-enhanced');
        const summary = detail.querySelector('summary');
        const answer = detail.querySelector('p');
        if (!summary || !answer) return;

        summary.addEventListener('click', event => {
            if (detail.dataset.animating === 'true') return;
            event.preventDefault();
            detail.dataset.animating = 'true';

            if (!detail.open) {
                detail.open = true;
                const animation = answer.animate([
                    { opacity: 0, maxHeight: '0px', transform: 'translateY(-6px)' },
                    { opacity: 1, maxHeight: `${answer.scrollHeight + 32}px`, transform: 'translateY(0)' }
                ], { duration: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
                animation.onfinish = () => { delete detail.dataset.animating; };
            } else {
                const animation = answer.animate([
                    { opacity: 1, maxHeight: `${answer.scrollHeight + 32}px`, transform: 'translateY(0)' },
                    { opacity: 0, maxHeight: '0px', transform: 'translateY(-6px)' }
                ], { duration: 220, easing: 'ease' });
                animation.onfinish = () => {
                    detail.open = false;
                    delete detail.dataset.animating;
                };
            }
        });
    });
}

function initInternalPageTransitions(reduceMotion) {
    if (reduceMotion) return;

    document.querySelectorAll('a[href]').forEach(link => {
        link.addEventListener('click', event => {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            if (link.target === '_blank' || link.hasAttribute('download')) return;

            const destination = new URL(link.href, window.location.href);
            const current = new URL(window.location.href);
            const isSameDocumentHash = destination.pathname === current.pathname && destination.search === current.search && destination.hash;
            if (destination.origin !== current.origin || isSameDocumentHash) return;

            event.preventDefault();
            document.body.classList.add('page-transition-out');
            window.setTimeout(() => { window.location.href = destination.href; }, 150);
        });
    });
}

function initInsightScrollProgress() {
    const isInsightPage = Boolean(document.querySelector('.insight-article'));
    const isHomepage = Boolean(document.querySelector('#main-content #home'));
    if (!isInsightPage && !isHomepage) return;

    const progress = document.createElement('div');
    progress.className = `insight-scroll-progress${isHomepage ? ' homepage-scroll-progress' : ''}`;
    progress.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progress);

    let ticking = false;
    const update = () => {
        const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        progress.style.transform = `scaleX(${Math.min(window.scrollY / maxScroll, 1)})`;
        ticking = false;
    };

    update();
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
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
        btn.closest('.audio-player-panel')?.classList.remove('is-playing');
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

function populateSubscriberTimeSlots(timeSelect, date, timeRow, timezoneInput) {
    if (!date || !timeSelect) return;
    loadAvailableMeetingSlots({
        date,
        timeSelect,
        timeRow,
        timezoneInput
    });
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
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = hashParams.get('access_token') || params.get('access_token');
    const sessionId = params.get('session_id');
    const legacyEmail = params.get('email');
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

    const verifyWithSessionAndEmail = async (email) => {
        try {
            const query = new URLSearchParams({
                session_id: sessionId,
                email
            });
            const response = await fetch(`/api/verify-subscriber-access?${query.toString()}`);
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

    const showLegacyEmailPrompt = () => {
        loading.innerHTML = `
            <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center ring-8 ring-orange-50 dark:ring-orange-950/40">
                <i class="fa-solid fa-envelope text-brand-orange text-3xl" aria-hidden="true"></i>
            </div>
            <h1 class="text-3xl font-extrabold text-brand-navy dark:text-white mb-3">Confirm your subscription email</h1>
            <p class="text-slate-600 dark:text-slate-300 mb-6">Enter the email address you used at checkout to continue scheduling.</p>
            <form id="legacy-subscriber-email-form" class="max-w-md mx-auto space-y-4 text-left">
                <div class="space-y-1">
                    <label for="legacy-subscriber-email" class="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Checkout email</label>
                    <input id="legacy-subscriber-email" type="email" required autocomplete="email" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-lg outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange" placeholder="you@company.com">
                </div>
                <button type="submit" class="w-full py-3 bg-brand-orange hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg transition-all">Continue</button>
            </form>
        `;

        const legacyForm = document.getElementById('legacy-subscriber-email-form');
        legacyForm?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const emailInput = document.getElementById('legacy-subscriber-email');
            const email = emailInput?.value.trim().toLowerCase();
            if (!email) return;

            loading.querySelector('button[type="submit"]')?.setAttribute('disabled', 'disabled');
            await verifyWithSessionAndEmail(email);
        });
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
        const timezoneInput = document.getElementById('subscriber-timezone');

        if (emailInput) emailInput.value = data.email || '';
        if (planBadge) planBadge.textContent = `Plan: ${data.planDisplayName || 'Subscriber'}`;

        if (dateInput) {
            dateInput.min = getMinimumMeetingDate();

            dateInput.addEventListener('change', function handleDateChange() {
                if (!this.value) {
                    if (timeRow) timeRow.classList.add('hidden');
                    if (timeSelect) {
                        timeSelect.removeAttribute('required');
                        timeSelect.value = '';
                    }
                    return;
                }

                if (!validateMeetingDateInput(this)) {
                    if (timeRow) timeRow.classList.add('hidden');
                    if (timeSelect) timeSelect.removeAttribute('required');
                    return;
                }

                populateSubscriberTimeSlots(timeSelect, this.value, timeRow, timezoneInput);
            });
        }
    };

    const verifyAccess = async () => {
        if (accessToken) {
            try {
                const response = await fetch(`/api/verify-subscriber-access?access_token=${encodeURIComponent(accessToken)}`);
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
            return;
        }

        if (!sessionId || !legacyEmail) {
            if (sessionId && !legacyEmail) {
                showLegacyEmailPrompt();
                return;
            }

            showDenied('This page requires a valid onboarding link. Use the link from your subscription confirmation email.');
            return;
        }

        await verifyWithSessionAndEmail(legacyEmail);
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

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = hashParams.get('access_token');

    if (!accessToken) {
        scheduleLink.classList.add('hidden');
        return;
    }

    scheduleLink.href = `schedule-onboarding.html#access_token=${encodeURIComponent(accessToken)}`;
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

    const cardHeight = Math.ceil(maxContentHeight + 16);
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
                    const payload = await response.json().catch(() => ({}));
                    const errorMessage = payload.message
                        || (response.status === 409
                            ? 'That meeting time is no longer available. Please choose another time.'
                            : 'Failed to submit form. Please try again.');
                    console.error('Form submission failed:', response.status, errorMessage);
                    alert(errorMessage);

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

/* ============================================
   CONVERSION INTERACTION SUITE
   ============================================ */
function openInteractionDialog(dialog, trigger) {
    if (!dialog) return;
    dialog._lastTrigger = trigger || document.activeElement;
    if (typeof dialog.showModal === 'function') {
        dialog.showModal();
    } else {
        dialog.setAttribute('open', '');
    }
}

function initInteractionDialog(dialog) {
    if (!dialog) return;

    dialog.querySelectorAll('[data-dialog-close]').forEach(button => {
        button.addEventListener('click', () => dialog.close());
    });

    dialog.addEventListener('click', event => {
        if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener('close', () => {
        if (dialog._lastTrigger && typeof dialog._lastTrigger.focus === 'function') {
            dialog._lastTrigger.focus();
        }
    });
}

function initGuidedHowItWorks() {
    const stepper = document.querySelector('.guided-stepper');
    if (!stepper) return;

    const tabs = Array.from(stepper.querySelectorAll('[data-how-step]'));
    const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
    const nodes = Array.from(stepper.querySelectorAll('.guided-pipeline-node'));
    const tabList = stepper.querySelector('[role="tablist"]');
    const pipeline = stepper.querySelector('.guided-pipeline');
    const status = document.getElementById('guided-pipeline-status');
    const states = [
        { status: 'Strategy being mapped', label: 'Strategy call is the active stage' },
        { status: 'Onboarding in progress', label: 'Onboarding is the active stage' },
        { status: 'Campaign being prepared', label: 'Campaign setup is the active stage' },
        { status: 'Calls active · QA reviewing', label: 'Calling and QA is the active stage' },
        { status: 'Qualified lead ready', label: 'Qualified lead delivery is the active stage' }
    ];
    const compactLayout = window.matchMedia('(max-width: 980px)');
    const syncOrientation = () => tabList?.setAttribute('aria-orientation', compactLayout.matches ? 'horizontal' : 'vertical');

    syncOrientation();
    if (typeof compactLayout.addEventListener === 'function') {
        compactLayout.addEventListener('change', syncOrientation);
    }

    const activateStep = (index, moveFocus = false) => {
        if (index < 0 || index >= tabs.length) return;

        stepper.dataset.activeStep = String(index);
        tabs.forEach((tab, tabIndex) => {
            const isActive = tabIndex === index;
            tab.classList.toggle('is-active', isActive);
            tab.setAttribute('aria-selected', String(isActive));
            tab.tabIndex = isActive ? 0 : -1;
            if (panels[tabIndex]) panels[tabIndex].hidden = !isActive;
        });

        nodes.forEach((node, nodeIndex) => {
            node.classList.toggle('is-active', nodeIndex === index);
            node.classList.toggle('is-complete', nodeIndex < index);
        });

        if (status) status.textContent = states[index].status;
        pipeline?.setAttribute('aria-label', states[index].label);
        if (moveFocus) tabs[index].focus();
    };

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => activateStep(index));
        tab.addEventListener('keydown', event => {
            let nextIndex = index;
            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length;
            else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;
            else if (event.key === 'Home') nextIndex = 0;
            else if (event.key === 'End') nextIndex = tabs.length - 1;
            else return;

            event.preventDefault();
            activateStep(nextIndex, true);
        });
    });

    activateStep(0);
}

function initPlanRecommender() {
    const form = document.getElementById('plan-advisor-form');
    const planName = document.getElementById('advisor-plan-name');
    const reason = document.getElementById('advisor-plan-reason');
    const highlights = document.getElementById('advisor-plan-highlights');
    const applyButton = document.getElementById('advisor-apply-plan');
    const seePlan = document.getElementById('advisor-see-plan');
    if (!form || !planName || !reason || !highlights) return;

    const plans = {
        'Essential': {
            reason: 'Your dialer and data are already in place, so the essential one-caller setup fits at any campaign pace.',
            highlights: ['1 dedicated caller', 'Uses your dialer and data', 'Daily reporting and QA']
        },
        'Growth': {
            reason: 'You want a consistent campaign with the operating stack managed for you.',
            highlights: ['Managed campaign infrastructure', 'Dedicated caller support', 'Reporting, QA, and optimization']
        },
        'Scale': {
            reason: 'A managed two-caller campaign at a focused or consistent pace fits the Scale plan.',
            highlights: ['2 managed callers', 'Focused or consistent campaign', 'Advanced reporting and optimization']
        },
        'Custom+': {
            reason: 'Three or more callers or a multi-market campaign requires a custom capacity plan.',
            highlights: ['3+ callers or multi-market scope', 'Flexible markets and workflows', 'Tailored reporting and fulfillment']
        }
    };

    let recommendation = 'Essential';

    const getValue = name => form.querySelector(`input[name="${name}"]:checked`)?.value;
    const centerPlanCard = card => {
        const slider = document.getElementById('pricing-slider');
        if (!slider || !card || slider.scrollWidth <= slider.clientWidth) return;

        const sliderRect = slider.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        const centeredLeft = slider.scrollLeft
            + (cardRect.left - sliderRect.left)
            - ((slider.clientWidth - cardRect.width) / 2);
        const maxScroll = Math.max(0, slider.scrollWidth - slider.clientWidth);
        const targetLeft = Math.min(maxScroll, Math.max(0, centeredLeft));
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        slider.scrollTo({
            left: targetLeft,
            behavior: reduceMotion ? 'auto' : 'smooth'
        });
    };

    const choosePlan = (shouldCenterCard = false) => {
        const stack = getValue('advisor-stack');
        const callers = getValue('advisor-callers');
        const volume = getValue('advisor-volume');

        if (callers === 'three-plus' || volume === 'multi') recommendation = 'Custom+';
        else if (stack === 'managed' && callers === 'two') recommendation = 'Scale';
        else if (callers === 'two') recommendation = 'Custom+';
        else if (stack === 'owned') recommendation = 'Essential';
        else recommendation = 'Growth';

        const result = plans[recommendation];
        planName.textContent = recommendation;
        reason.textContent = result.reason;
        highlights.innerHTML = result.highlights.map(item => `<li>${item}</li>`).join('');
        seePlan?.setAttribute('aria-label', `See ${recommendation} plan details`);

        let recommendedCard = null;
        document.querySelectorAll('[data-plan-card]').forEach(card => {
            const isMatch = card.dataset.planCard === recommendation;
            card.classList.toggle('is-recommended-plan', isMatch);
            if (isMatch) {
                card.setAttribute('data-recommendation-label', 'Recommended for you');
                recommendedCard = card;
            }
            else card.removeAttribute('data-recommendation-label');
        });

        if (shouldCenterCard) centerPlanCard(recommendedCard);
    };

    form.addEventListener('change', () => choosePlan(true));
    choosePlan();

    seePlan?.addEventListener('click', () => {
        window.setTimeout(() => {
            const card = document.querySelector(`[data-plan-card="${recommendation}"]`);
            centerPlanCard(card);
            card?.focus({ preventScroll: true });
        }, 450);
    });

    applyButton?.addEventListener('click', () => {
        const serviceSelect = document.getElementById('service-select');
        const quantitySelect = document.getElementById('quantity-select');
        if (!serviceSelect) return;

        serviceSelect.value = recommendation === 'Custom+' ? 'Custom Quote' : recommendation;
        serviceSelect.dispatchEvent(new Event('change', { bubbles: true }));

        if (quantitySelect && recommendation !== 'Custom+') {
            const callers = getValue('advisor-callers');
            quantitySelect.value = callers === 'two' ? '2-3 Seats' : '1 Seat';
            quantitySelect.dispatchEvent(new Event('change', { bubbles: true }));
        }

        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(() => serviceSelect.focus(), 500);
    });
}

const initializedTrustpilotCarousels = new WeakSet();

function initTrustpilotCarousel() {
    const carousel = document.querySelector('[data-trustpilot-carousel]');
    if (!carousel || initializedTrustpilotCarousels.has(carousel)) return;

    const viewport = carousel.querySelector('.trustpilot-carousel-viewport');
    const track = carousel.querySelector('.trustpilot-carousel-track');
    if (!viewport || !track) return;

    const slides = [...track.querySelectorAll('[data-review-slide]')];
    if (slides.length < 2) return;

    initializedTrustpilotCarousels.add(carousel);

    // Keep the requested loop order: Rodrigo → Kristian → Keenan → Arya.
    const orderedSlides = [slides[3], slides[0], slides[1], slides[2]].filter(Boolean);
    if (typeof track.replaceChildren === 'function') {
        track.replaceChildren(...orderedSlides);
    } else {
        while (track.firstChild) track.removeChild(track.firstChild);
        orderedSlides.forEach(slide => track.appendChild(slide));
    }
    orderedSlides.forEach(slide => slide.setAttribute('aria-hidden', 'false'));
    // Three copies keep a full copy available on either side while dragging,
    // matching the seamless marquee pattern used by the portfolio site.
    [1, 2].forEach(() => orderedSlides.forEach(slide => {
        const clone = slide.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.removeAttribute('data-review-slide');
        track.appendChild(clone);
    }));

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const frameDelay = 24;
    const clock = () => (
        typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now()
    );
    let segmentWidth = 0;
    let dragging = false;
    let dragStartX = 0;
    let dragStartScroll = 0;
    let positioned = false;
    let autoplayTimer = null;
    let lastAutoplayAt = 0;
    let manualPauseUntil = 0;
    let autoplayWriteUntil = 0;
    let resizeFrame = null;

    const clearAutoplayTimer = () => {
        if (autoplayTimer === null) return;
        window.clearTimeout(autoplayTimer);
        autoplayTimer = null;
    };

    const wrapScroll = (includeLeftEdge = true) => {
        if (!segmentWidth) return;
        const position = viewport.scrollLeft;
        const shouldWrap = position >= segmentWidth * 2 || (includeLeftEdge && position <= 0);
        if (!shouldWrap) return;

        const offset = ((position % segmentWidth) + segmentWidth) % segmentWidth;
        viewport.scrollLeft = segmentWidth + offset;
    };

    const measureSegment = () => {
        const middleCopy = track.children[orderedSlides.length];
        const measuredWidth = middleCopy?.offsetLeft || (track.scrollWidth / 3);
        if (!Number.isFinite(measuredWidth) || measuredWidth <= 0) {
            segmentWidth = 0;
            return false;
        }

        const previousWidth = segmentWidth;
        segmentWidth = measuredWidth;

        if (!positioned || !previousWidth) {
            // Show real content immediately on narrow screens. Desktop starts
            // in the middle copy; mobile begins at the first card so Safari
            // never paints an apparently empty rail during initial layout.
            viewport.scrollLeft = window.matchMedia('(max-width: 640px)').matches ? 0 : segmentWidth;
            positioned = true;
        } else if (Math.abs(previousWidth - measuredWidth) > 0.5) {
            const copyIndex = Math.max(0, Math.min(1, Math.floor(viewport.scrollLeft / previousWidth)));
            const relativePosition = Math.min(1, Math.max(0, (viewport.scrollLeft - (copyIndex * previousWidth)) / previousWidth));
            viewport.scrollLeft = (copyIndex + relativePosition) * measuredWidth;
            wrapScroll(false);
        }

        return true;
    };

    const canAutoplay = () => (
        !document.hidden && !dragging && !reducedMotion.matches && clock() >= manualPauseUntil
    );

    const runAutoplay = () => {
        autoplayTimer = null;
        if (!canAutoplay()) {
            if (!document.hidden && !dragging && !reducedMotion.matches) scheduleAutoplay();
            return;
        }

        const now = clock();
        const elapsed = lastAutoplayAt ? Math.max(frameDelay, now - lastAutoplayAt) : frameDelay;
        lastAutoplayAt = now;
        let nextDelay = frameDelay;

        try {
            if (!measureSegment()) {
                nextDelay = 120;
            } else {
                autoplayWriteUntil = now + 100;
                wrapScroll(false);
                viewport.scrollLeft += elapsed / frameDelay;
            }
        } catch (error) {
            nextDelay = 120;
            console.warn('Trustpilot carousel recovered from an autoplay error', error);
        }

        if (canAutoplay()) scheduleAutoplay(nextDelay);
    };

    function scheduleAutoplay(delay = frameDelay) {
        clearAutoplayTimer();
        if (document.hidden || dragging || reducedMotion.matches) return;

        const wait = Math.max(delay, manualPauseUntil - clock());
        autoplayTimer = window.setTimeout(runAutoplay, wait);
    }

    const pauseForInteraction = (duration = 220) => {
        const now = clock();
        manualPauseUntil = Math.max(manualPauseUntil, now + duration);
        lastAutoplayAt = now;
        scheduleAutoplay();
    };

    const scheduleMeasure = () => {
        if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(() => {
            resizeFrame = null;
            measureSegment();
        });
    };

    viewport.addEventListener('pointerdown', event => {
        dragging = true;
        clearAutoplayTimer();
        dragStartX = event.clientX;
        dragStartScroll = viewport.scrollLeft;
        viewport.setPointerCapture?.(event.pointerId);
        viewport.classList.add('is-dragging');
    });
    viewport.addEventListener('pointermove', event => {
        if (!dragging) return;
        viewport.scrollLeft = dragStartScroll - (event.clientX - dragStartX);
        wrapScroll(true);
    });
    const stopDragging = event => {
        if (!dragging) return;
        dragging = false;
        try {
            viewport.releasePointerCapture?.(event.pointerId);
        } catch (error) {
            // The browser may release the pointer before this event arrives.
        }
        viewport.classList.remove('is-dragging');
        lastAutoplayAt = clock();
        pauseForInteraction();
    };
    viewport.addEventListener('pointerup', stopDragging);
    viewport.addEventListener('pointercancel', stopDragging);
    viewport.addEventListener('lostpointercapture', stopDragging);
    window.addEventListener('pointerup', stopDragging, { passive: true });
    window.addEventListener('pointercancel', stopDragging, { passive: true });
    window.addEventListener('blur', stopDragging);
    viewport.addEventListener('scroll', () => {
        wrapScroll(true);
        if (!dragging && clock() > autoplayWriteUntil) pauseForInteraction();
    }, { passive: true });
    viewport.addEventListener('scrollend', () => {
        const now = clock();
        if (now <= autoplayWriteUntil) return;
        if (now < manualPauseUntil) {
            scheduleAutoplay();
            return;
        }
        manualPauseUntil = 0;
        lastAutoplayAt = now;
        scheduleAutoplay();
    });
    viewport.addEventListener('keydown', event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        pauseForInteraction(700);
        const scrollAmount = event.key === 'ArrowRight' ? 184 : -184;
        if (typeof viewport.scrollBy === 'function') {
            viewport.scrollBy({
                left: scrollAmount,
                behavior: reducedMotion.matches ? 'auto' : 'smooth'
            });
        } else {
            viewport.scrollLeft += scrollAmount;
        }
    });

    const handleVisibilityChange = () => {
        if (document.hidden) {
            clearAutoplayTimer();
            dragging = false;
            viewport.classList.remove('is-dragging');
            if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
            resizeFrame = null;
            return;
        }

        if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(() => {
            resizeFrame = null;
            measureSegment();
            wrapScroll(false);
            manualPauseUntil = 0;
            lastAutoplayAt = clock();
            scheduleAutoplay();
        });
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleReducedMotionChange = event => {
        if (event.matches) {
            clearAutoplayTimer();
            return;
        }
        lastAutoplayAt = clock();
        scheduleAutoplay();
    };
    if (typeof reducedMotion.addEventListener === 'function') {
        reducedMotion.addEventListener('change', handleReducedMotionChange);
    } else {
        reducedMotion.addListener?.(handleReducedMotionChange);
    }

    window.addEventListener('resize', scheduleMeasure, { passive: true });
    if (typeof ResizeObserver === 'function') {
        const resizeObserver = new ResizeObserver(scheduleMeasure);
        resizeObserver.observe(viewport);
        resizeObserver.observe(track);
    }

    measureSegment();
    window.requestAnimationFrame(measureSegment);
    scheduleAutoplay();
}

function initDeliverablePreviews() {
    const dialog = document.getElementById('deliverable-dialog');
    const title = document.getElementById('deliverable-dialog-title');
    const intro = document.getElementById('deliverable-dialog-intro');
    const preview = document.getElementById('deliverable-dialog-preview');
    if (!dialog || !title || !intro || !preview) return;

    const deliverables = {
        report: {
            title: 'Daily call report',
            intro: 'Each VA’s end-of-shift report shows dial capacity, call outcomes, and immediate follow-up priorities.',
            preview: '<div class="sample-metrics"><div><span>Dials / hour</span><strong>Up to 300</strong></div><div><span>Shift length</span><strong>4 hours</strong></div><div><span>Daily dials</span><strong>Up to 1,200</strong></div><div><span>Dialer</span><strong>Triple line</strong></div></div><div class="sample-callout"><span>POWER DIALING CAPACITY</span><p>Using a triple-line power dialer, a VA can place up to 1,200 dials across a four-hour shift. Actual totals vary by list quality, pickup rate, and campaign conditions.</p></div>'
        },
        notes: {
            title: 'Lead notes',
            intro: 'Every submitted lead follows an MTCP format so acquisitions receives complete seller and property context.',
            preview: '<div class="sample-note"><div><span>BASIC INFORMATION</span><strong>Name · phone · address · occupancy · lead status</strong></div><div class="sample-mtcp-grid"><div><b>M</b><p><strong>Motivation</strong><small>Why the seller is considering a sale</small></p></div><div><b>T</b><p><strong>Timeline</strong><small>When they want or need to sell</small></p></div><div><b>C</b><p><strong>Condition</strong><small>Specific property-condition details</small></p></div><div><b>P</b><p><strong>Property</strong><small>Specifications and relevant facts</small></p></div></div><div class="sample-condition-checklist"><span>PROPERTY CONDITION CHECKLIST</span><ul><li>Roof age</li><li>HVAC age</li><li>Plumbing issues</li><li>Electrical issues</li><li>Foundation issues</li><li>Last kitchen and bathroom upgrades</li></ul></div></div>'
        },
        qa: {
            title: 'QA feedback',
            intro: 'Coaching turns call reviews into a small set of specific actions for the next dialing block.',
            preview: '<div class="sample-qa"><div><span>Rapport</span><i><b style="width:88%"></b></i><strong>Strong</strong></div><div><span>Discovery</span><i><b style="width:72%"></b></i><strong>Refine</strong></div><div><span>Next step</span><i><b style="width:80%"></b></i><strong>Clear</strong></div></div><div class="sample-callout"><span>COACHING ACTION</span><p>Ask one more timeline question before moving to the close.</p></div>'
        },
        kpi: {
            title: 'KPI tracking',
            intro: 'At the end of every VA shift, call dispositions are submitted to a shared Google spreadsheet for daily visibility.',
            preview: '<div class="sample-kpi-sheet"><div class="sample-sheet-head"><span>DAILY GOOGLE SHEET SUBMISSION</span><b>End of shift</b></div><div class="sample-sheet-grid"><div><span>Total dials</span><strong>1,182</strong></div><div><span>No answers</span><strong>624</strong></div><div><span>Answering machines</span><strong>371</strong></div><div><span>Wrong numbers</span><strong>42</strong></div><div><span>Interested</span><strong>6</strong></div><div><span>Callbacks</span><strong>14</strong></div></div></div>'
        },
        pipeline: {
            title: 'Pipeline updates',
            intro: 'Lead temperature combines asking price against Zillow’s estimate with motivation and expected selling timeline.',
            preview: '<div class="sample-pipeline"><div><span class="pipeline-dot pipeline-dot--ready"></span><p><strong>Hot lead</strong><small>Asking below 80% of Zillow’s estimate with strong motivation to sell</small></p><b>&lt; 80%</b></div><div><span class="pipeline-dot pipeline-dot--warm"></span><p><strong>Warm lead</strong><small>Asking within 90%–99% of Zillow’s estimate and somewhat motivated</small></p><b>90%–99%</b></div><div><span class="pipeline-dot pipeline-dot--new"></span><p><strong>Cold lead</strong><small>3–6 month timeline · retail-or-higher asking price · no urgent motivation</small></p><b>Retail+</b></div></div>'
        }
    };

    initInteractionDialog(dialog);
    document.querySelectorAll('[data-deliverable]').forEach(button => {
        button.addEventListener('click', () => {
            const item = deliverables[button.dataset.deliverable];
            if (!item) return;
            title.textContent = item.title;
            intro.textContent = item.intro;
            preview.innerHTML = item.preview;
            openInteractionDialog(dialog, button);
        });
    });
}

function initAudioBreakdowns() {
    const dialog = document.getElementById('audio-breakdown-dialog');
    const title = document.getElementById('audio-breakdown-title');
    const summary = document.getElementById('audio-breakdown-summary');
    const tags = document.getElementById('audio-breakdown-tags');
    const grid = document.getElementById('audio-breakdown-grid');
    const playButton = document.getElementById('audio-breakdown-play');
    if (!dialog || !title || !summary || !tags || !grid) return;

    const breakdowns = {
        'audio-richard': { title: 'Qualifying a Hot, Motivated Seller', summary: 'Listen for a calm response that acknowledges the concern before guiding the seller toward a useful next step.', tags: ['Acknowledgment', 'Pacing', 'Next step'], focus: ['Make the seller feel heard', 'Avoid arguing with the objection', 'Keep the close specific'] },
        'audio-joe': { title: 'Building Rapport From a Wrong-Contact Opener', summary: 'Listen for curiosity, permission, and a natural tone that keeps the conversation open.', tags: ['Curiosity', 'Permission', 'Tone'], focus: ['Open without pressure', 'Use context to build trust', 'Transition naturally'] },
        'audio-3': { title: 'Nurturing a Seller Who Isn’t Ready Yet', summary: 'Listen for patience and continuity in a conversation that is not ready to convert today.', tags: ['Patience', 'Recall', 'Follow-up'], focus: ['Preserve relationship context', 'Confirm what changed', 'Set a useful follow-up'] },
        'audio-4': { title: 'Capturing Complete MTCP From a Warm Lead', summary: 'Listen for complete discovery across motivation, timeline, condition, and price without making the call feel like an interrogation.', tags: ['Motivation', 'Timeline', 'Condition + price'], focus: ['Ask one question at a time', 'Probe incomplete answers', 'Capture usable notes'] },
        'audio-5': { title: 'Qualifying a Warm Lead for Acquisitions', summary: 'Listen for clear fit checks, constraints, and a handoff that gives acquisitions enough context to act.', tags: ['Fit', 'Constraints', 'Handoff'], focus: ['Confirm seller intent', 'Surface decision factors', 'State the next owner'] },
        'audio-6': { title: 'Turning a Warm Conversation Into a Qualified Opportunity', summary: 'Listen for respectful verification and clean routing when identifying whether the contact matches the campaign.', tags: ['Verification', 'Respect', 'Data hygiene'], focus: ['Verify without friction', 'Protect the brand experience', 'Route or disposition clearly'] }
    };

    let activeAudioId = '';
    initInteractionDialog(dialog);

    document.querySelectorAll('[data-audio-breakdown]').forEach(button => {
        button.addEventListener('click', () => {
            activeAudioId = button.dataset.audioBreakdown;
            const item = breakdowns[activeAudioId];
            if (!item) return;
            title.textContent = item.title;
            summary.textContent = item.summary;
            tags.innerHTML = item.tags.map(tag => `<span>${tag}</span>`).join('');
            grid.innerHTML = item.focus.map((focus, index) => `<div><span>0${index + 1}</span><p>${focus}</p></div>`).join('');
            openInteractionDialog(dialog, button);
        });
    });

    playButton?.addEventListener('click', () => {
        const audio = document.getElementById(activeAudioId);
        const playerButton = audio?.closest('.audio-player-panel')?.querySelector('button');
        dialog.close();
        if (audio && playerButton && audio.paused) toggleAudio(activeAudioId, playerButton);
    });
}

function initBookingSummary() {
    const service = document.getElementById('service-select');
    const quantity = document.getElementById('quantity-select');
    const date = document.getElementById('preferred-date');
    const time = document.getElementById('preferred-time');
    const timezone = document.getElementById('preferred-timezone');
    const planOutput = document.getElementById('booking-summary-plan');
    const teamOutput = document.getElementById('booking-summary-team');
    const scheduleOutput = document.getElementById('booking-summary-schedule');
    const progressOutput = document.getElementById('booking-summary-progress');
    if (!service || !planOutput || !teamOutput || !scheduleOutput || !progressOutput) return;

    const selectedText = select => select?.value ? select.options[select.selectedIndex]?.textContent.trim() : '';
    const update = () => {
        const isCustom = service.value === 'Custom Quote';
        const hasTeam = isCustom || Boolean(quantity?.value);
        const hasDate = Boolean(date?.value);
        const ready = Number(Boolean(service.value)) + Number(hasTeam) + Number(hasDate);

        planOutput.textContent = selectedText(service) || 'Choose a service';
        teamOutput.textContent = isCustom ? 'Scoped during strategy call' : (selectedText(quantity) || 'Select caller count');

        if (hasDate) {
            const parsedDate = new Date(`${date.value}T12:00:00`);
            const dateLabel = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(parsedDate);
            const timeLabel = selectedText(time);
            scheduleOutput.textContent = timeLabel ? `${dateLabel} · ${timeLabel} ${timezone?.value || 'EST'}` : `${dateLabel} · choose a time`;
        } else {
            scheduleOutput.textContent = 'Choose a date';
        }

        progressOutput.textContent = `${ready}/3 ready`;
    };

    [service, quantity, date, time].forEach(control => control?.addEventListener('change', update));
    update();
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

/**
 * TrendWave — Premium Glassmorphism Animation Engine
 * Powered by GSAP + ScrollTrigger
 * 
 * Features:
 *   1. Floating glass orbs (background particles)
 *   2. Enhanced 3D card tilt with frosted glare
 *   3. Aurora shimmer border animation (CSS-driven, JS-triggered)
 *   4. Morphing glass blobs (GSAP parallax)
 *   5. Frosted glass scroll reveal
 *   6. Glass ripple effect on click/tap
 *   7. Enhanced cursor glow (GSAP-smoothed)
 */

(function () {
    'use strict';

    // Bail out if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Wait for GSAP to load
    if (typeof gsap === 'undefined') {
        console.warn('[GlassAnimations] GSAP not found. Skipping animations.');
        return;
    }

    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const isMobile = !isDesktop;

    // =========================================================================
    //  0. LENIS SMOOTH SCROLL (Rule 6 Compliant)
    // =========================================================================
    let lenisInstance = null;
    function initLenis() {
        if (typeof Lenis === 'undefined') return;
        try {
            lenisInstance = new Lenis({
                duration: 1.15,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                orientation: 'vertical',
                gestureOrientation: 'vertical',
                smoothWheel: true,
                wheelMultiplier: 1.0,
                touchMultiplier: 1.5,
            });

            lenisInstance.on('scroll', ScrollTrigger.update);

            gsap.ticker.add((time) => {
                lenisInstance.raf(time * 1000);
            });

            gsap.ticker.lagSmoothing(0);
        } catch (err) {
            console.warn('[GlassAnimations] Lenis init failed:', err);
        }
    }

    // =========================================================================
    //  0.1 DYNAMIC AMBIENT THUMBNAIL BACKDROP ENGINE
    // =========================================================================
    function initAmbientBackdrop() {
        const container = document.getElementById('ambient-backdrop-container');
        const layerA = document.getElementById('ambient-backdrop-a');
        const layerB = document.getElementById('ambient-backdrop-b');
        const cardHalo = document.getElementById('ambient-card-halo');

        if (!layerA || !layerB) return;

        let activeLayer = 'a';
        let currentThumbnail = null;
        let defaultThumbnail = null;
        let hoverTimeout = null;

        function setAmbientThumbnail(url, isDefault = false) {
            if (!url || url === currentThumbnail) return;

            if (isDefault) {
                defaultThumbnail = url;
            }

            const targetLayer = activeLayer === 'a' ? layerB : layerA;
            const currentLayer = activeLayer === 'a' ? layerA : layerB;

            // Preload image to prevent flicker or empty transitions
            const img = new Image();
            img.onload = () => {
                targetLayer.style.backgroundImage = `url("${url}")`;
                targetLayer.classList.add('active');
                targetLayer.classList.add('zooming');
                currentLayer.classList.remove('active');
                currentLayer.classList.remove('zooming');
                activeLayer = activeLayer === 'a' ? 'b' : 'a';
                currentThumbnail = url;
            };
            img.src = url;
        }

        // Expose to window for external triggers
        window.setAmbientThumbnail = setAmbientThumbnail;

        // Listen for initial trending videos ready event
        window.addEventListener('trendingVideosReady', (e) => {
            if (e.detail && e.detail.topThumbnail) {
                setAmbientThumbnail(e.detail.topThumbnail, true);
            }
        });

        // Check if cards already exist in DOM
        const checkInitialCard = () => {
            const firstCard = document.querySelector('.video-card');
            if (firstCard && firstCard.dataset.thumbnail) {
                setAmbientThumbnail(firstCard.dataset.thumbnail, true);
                return true;
            }
            return false;
        };

        if (!checkInitialCard()) {
            setTimeout(checkInitialCard, 400);
            setTimeout(checkInitialCard, 1200);
            setTimeout(checkInitialCard, 2500);
        }

        // Desktop: Hover interactions & Card Halo
        if (isDesktop) {
            const videoGrid = document.getElementById('video-grid');
            if (videoGrid) {
                videoGrid.addEventListener('mouseover', (e) => {
                    const card = e.target.closest('.video-card');
                    if (!card) return;

                    const thumb = card.dataset.thumbnail;
                    if (!thumb) return;

                    clearTimeout(hoverTimeout);
                    hoverTimeout = setTimeout(() => {
                        setAmbientThumbnail(thumb);
                    }, 70); // 70ms debounce

                    if (cardHalo) {
                        const rect = card.getBoundingClientRect();
                        cardHalo.style.left = `${rect.left + rect.width / 2}px`;
                        cardHalo.style.top = `${rect.top + rect.height / 2}px`;
                        cardHalo.classList.add('active');
                    }
                });

                videoGrid.addEventListener('mousemove', (e) => {
                    const card = e.target.closest('.video-card');
                    if (!card || !cardHalo) return;
                    const rect = card.getBoundingClientRect();
                    cardHalo.style.left = `${rect.left + rect.width / 2}px`;
                    cardHalo.style.top = `${rect.top + rect.height / 2}px`;
                }, { passive: true });

                videoGrid.addEventListener('mouseleave', () => {
                    clearTimeout(hoverTimeout);
                    if (cardHalo) cardHalo.classList.remove('active');
                    // Smoothly revert to default top video thumbnail after mouse leaves grid
                    hoverTimeout = setTimeout(() => {
                        if (defaultThumbnail) {
                            setAmbientThumbnail(defaultThumbnail);
                        }
                    }, 350);
                });
            }
        }

        // Mobile: Synchronize ambient backdrop with viewport center card
        if (isMobile && 'IntersectionObserver' in window) {
            let mobileObserver = null;
            function setupMobileObserver() {
                const cards = document.querySelectorAll('.video-card');
                if (!cards.length) return;

                if (mobileObserver) mobileObserver.disconnect();

                mobileObserver = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
                            const thumb = entry.target.dataset.thumbnail;
                            if (thumb) {
                                setAmbientThumbnail(thumb);
                            }
                        }
                    });
                }, {
                    rootMargin: '-20% 0px -20% 0px',
                    threshold: [0.4, 0.6]
                });

                cards.forEach((card) => mobileObserver.observe(card));
            }

            const videoGrid = document.getElementById('video-grid');
            if (videoGrid) {
                const gridObserver = new MutationObserver(() => {
                    setupMobileObserver();
                });
                gridObserver.observe(videoGrid, { childList: true });
            }
        }
    }

    // =========================================================================
    //  1. FLOATING GLASS ORBS (Background Particles)
    // =========================================================================
    function initFloatingOrbs() {
        const container = document.getElementById('glass-particles');
        if (!container) return;

        const orbCount = isMobile ? 7 : 18;

        for (let i = 0; i < orbCount; i++) {
            const orb = document.createElement('div');
            orb.classList.add('glass-orb');

            // Random size between 6px and 50px (desktop) or 4px to 30px (mobile)
            const size = isMobile
                ? Math.random() * 26 + 4
                : Math.random() * 44 + 6;
            orb.style.width = size + 'px';
            orb.style.height = size + 'px';

            // Random starting position
            orb.style.left = Math.random() * 100 + '%';
            orb.style.top = Math.random() * 100 + '%';

            // Random opacity
            orb.style.opacity = (Math.random() * 0.35 + 0.08).toFixed(2);

            container.appendChild(orb);

            // GSAP float animation — each orb has unique path
            const duration = Math.random() * 14 + 10;
            const xDrift = (Math.random() - 0.5) * (isMobile ? 60 : 140);
            const yDrift = (Math.random() - 0.5) * (isMobile ? 50 : 120);

            gsap.to(orb, {
                x: xDrift,
                y: yDrift,
                duration: duration,
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true,
                delay: Math.random() * 5
            });

            // Opacity breathing
            gsap.to(orb, {
                opacity: parseFloat(orb.style.opacity) * (Math.random() * 0.6 + 0.5),
                duration: Math.random() * 6 + 4,
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true,
                delay: Math.random() * 3
            });
        }
    }

    // =========================================================================
    //  2. ENHANCED 3D CARD TILT WITH FROSTED GLARE (Desktop only)
    // =========================================================================
    function initCardTilt() {
        if (!isDesktop) return;

        const videoGrid = document.getElementById('video-grid');
        if (!videoGrid) return;

        // Smooth tilt using GSAP
        videoGrid.addEventListener('mousemove', (e) => {
            const card = e.target.closest('.video-card');
            if (!card) return;

            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            const tiltX = (y - 0.5) * -6;
            const tiltY = (x - 0.5) * 6;

            gsap.to(card, {
                rotateX: tiltX,
                rotateY: tiltY,
                scale: 1.018,
                duration: 0.4,
                ease: 'power2.out',
                overwrite: 'auto'
            });

            // Frosted glare effect
            const glare = card.querySelector('.card-glare');
            if (glare) {
                glare.style.opacity = '0.8';
                glare.style.background = `radial-gradient(circle 350px at ${x * 100}% ${y * 100}%, rgba(255, 255, 255, 0.15), rgba(255, 0, 51, 0.08) 40%, transparent 75%)`;
            }
        }, { passive: true });

        videoGrid.addEventListener('mouseleave', (e) => {
            const card = e.target.closest('.video-card');
            if (!card) return;
            if (!card.contains(e.relatedTarget)) {
                gsap.to(card, {
                    rotateX: 0,
                    rotateY: 0,
                    scale: 1,
                    duration: 0.6,
                    ease: 'elastic.out(1, 0.5)',
                    overwrite: 'auto'
                });
                const glare = card.querySelector('.card-glare');
                if (glare) {
                    gsap.to(glare, { opacity: 0, duration: 0.4 });
                }
            }
        });

        // Also handle mouseout for individual cards
        videoGrid.addEventListener('mouseout', (e) => {
            const card = e.target.closest('.video-card');
            if (!card) return;
            if (!card.contains(e.relatedTarget)) {
                gsap.to(card, {
                    rotateX: 0,
                    rotateY: 0,
                    scale: 1,
                    duration: 0.6,
                    ease: 'elastic.out(1, 0.5)',
                    overwrite: 'auto'
                });
                const glare = card.querySelector('.card-glare');
                if (glare) {
                    gsap.to(glare, { opacity: 0, duration: 0.4 });
                }
            }
        });
    }

    // =========================================================================
    //  3. MORPHING GLASS BLOBS (GSAP Parallax)
    // =========================================================================
    function initMorphingBlobs() {
        const blobs = document.querySelectorAll('.glass-blob');
        if (!blobs.length) return;

        blobs.forEach((blob, i) => {
            // Random morph animation
            const tl = gsap.timeline({ repeat: -1, yoyo: true });

            // Generate random border-radius keyframes for organic morphing
            const shapes = [
                '60% 40% 30% 70% / 60% 30% 70% 40%',
                '30% 60% 70% 40% / 50% 60% 30% 60%',
                '55% 45% 60% 40% / 35% 65% 35% 65%',
                '40% 60% 33% 67% / 55% 35% 55% 45%',
                '70% 30% 50% 50% / 40% 60% 50% 50%'
            ];

            // Pick 3 random shapes for this blob's morph cycle
            const shape1 = shapes[(i * 2) % shapes.length];
            const shape2 = shapes[(i * 3 + 1) % shapes.length];
            const shape3 = shapes[(i + 2) % shapes.length];

            tl.to(blob, {
                borderRadius: shape1,
                duration: Math.random() * 6 + 8,
                ease: 'sine.inOut'
            })
            .to(blob, {
                borderRadius: shape2,
                duration: Math.random() * 6 + 8,
                ease: 'sine.inOut'
            })
            .to(blob, {
                borderRadius: shape3,
                duration: Math.random() * 6 + 8,
                ease: 'sine.inOut'
            });

            // Parallax on scroll — blobs move at different speeds
            const speed = (i % 2 === 0) ? 0.3 : -0.2;
            gsap.to(blob, {
                y: () => window.innerHeight * speed,
                ease: 'none',
                scrollTrigger: {
                    trigger: document.body,
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: 1.5
                }
            });

            // Gentle scale pulse
            gsap.to(blob, {
                scale: 1 + Math.random() * 0.15,
                duration: Math.random() * 8 + 10,
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true,
                delay: i * 1.5
            });
        });
    }

    // =========================================================================
    //  4. FROSTED GLASS SCROLL REVEAL (GSAP ScrollTrigger)
    // =========================================================================
    function initFrostedReveal() {
        // Target elements that should reveal from frosted blur
        const revealTargets = document.querySelectorAll(
            '.video-card, .seo-card, .seo-faq-card, .faq-item, .site-footer .footer-col, .top-guide-bar, .load-more-container'
        );

        if (!revealTargets.length) return;

        revealTargets.forEach((el) => {
            el.classList.add('glass-reveal');
        });

        // Use a MutationObserver to catch dynamically-added video cards
        const videoGrid = document.getElementById('video-grid');
        if (videoGrid) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && node.classList.contains('video-card')) {
                            node.classList.add('glass-reveal');
                            animateReveal(node);
                        }
                    });
                });
            });
            observer.observe(videoGrid, { childList: true });
        }

        // Animate existing elements
        revealTargets.forEach((el) => animateReveal(el));
    }

    function animateReveal(el) {
        gsap.fromTo(el,
            {
                opacity: 0,
                y: 35,
                filter: 'blur(10px)',
            },
            {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                duration: 0.7,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 92%',
                    end: 'top 60%',
                    toggleActions: 'play none none none',
                    once: true
                }
            }
        );
    }

    // =========================================================================
    //  5. GLASS RIPPLE EFFECT ON CLICK/TAP
    // =========================================================================
    function initGlassRipple() {
        // Apply ripple to interactive glass elements
        const rippleSelectors = [
            '.global-pill-btn',
            '.icon-pill-btn',
            '.load-more-button',
            '.glass-button',
            '.category-tab',
            '.top-guide-btn',
            '.faq-question',
            '.watch-direct-btn',
            '.theme-toggle',
            '.hamburger-btn'
        ];

        document.addEventListener('click', (e) => {
            const target = e.target.closest(rippleSelectors.join(','));
            if (!target) return;

            // Create ripple element
            const ripple = document.createElement('span');
            ripple.classList.add('glass-ripple');

            const rect = target.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 2;
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = size + 'px';
            ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';

            // Ensure parent has relative positioning and overflow hidden
            const originalPosition = getComputedStyle(target).position;
            if (originalPosition === 'static') {
                target.style.position = 'relative';
            }
            const originalOverflow = getComputedStyle(target).overflow;
            target.style.overflow = 'hidden';

            target.appendChild(ripple);

            // GSAP animate the ripple
            gsap.fromTo(ripple,
                {
                    scale: 0,
                    opacity: 0.5,
                },
                {
                    scale: 1,
                    opacity: 0,
                    duration: 0.65,
                    ease: 'power2.out',
                    onComplete: () => {
                        ripple.remove();
                        // Restore overflow if we changed it
                        if (originalOverflow !== 'hidden') {
                            target.style.overflow = originalOverflow || '';
                        }
                        if (originalPosition === 'static') {
                            target.style.position = '';
                        }
                    }
                }
            );
        });
    }

    // =========================================================================
    //  6. ENHANCED CURSOR GLOW (GSAP-Smoothed) — Desktop only
    // =========================================================================
    function initCursorGlow() {
        if (!isDesktop) return;

        const cursorGlow = document.getElementById('cursor-glow');
        if (!cursorGlow) return;

        let mouseX = -9999;
        let mouseY = -9999;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            if (!cursorGlow.classList.contains('active')) {
                cursorGlow.classList.add('active');
            }
        }, { passive: true });

        // GSAP smooth follow — much smoother than manual lerp
        gsap.ticker.add(() => {
            gsap.to(cursorGlow, {
                x: mouseX,
                y: mouseY,
                duration: 0.5,
                ease: 'power3.out',
                overwrite: 'auto'
            });
        });
    }

    // =========================================================================
    //  7. HEADER GLASS PARALLAX
    // =========================================================================
    function initHeaderParallax() {
        const header = document.querySelector('.glass-header');
        if (!header) return;

        // Subtle shadow intensification on scroll
        gsap.to(header, {
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            scrollTrigger: {
                trigger: document.body,
                start: 'top top',
                end: '200px top',
                scrub: 1
            }
        });
    }

    // =========================================================================
    //  8. AURORA BORDER TRIGGER — Add class to elements for CSS animation
    // =========================================================================
    function initAuroraBorders() {
        // Add aurora-border class to key glass elements for the CSS animation
        const auroraTargets = document.querySelectorAll(
            '.video-card, .category-tabs, .seo-card, .seo-faq-card'
        );

        auroraTargets.forEach((el) => {
            el.classList.add('aurora-glass');
        });

        // For dynamically added video cards
        const videoGrid = document.getElementById('video-grid');
        if (videoGrid) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && node.classList.contains('video-card')) {
                            node.classList.add('aurora-glass');
                        }
                    });
                });
            });
            observer.observe(videoGrid, { childList: true });
        }
    }

    // =========================================================================
    //  9. STAGGERED ENTRANCE FOR CATEGORY TABS
    // =========================================================================
    function initTabEntrance() {
        const tabs = document.querySelectorAll('.category-tab');
        if (!tabs.length) return;

        gsap.from(tabs, {
            y: 30,
            opacity: 0,
            scale: 0.85,
            duration: 0.5,
            stagger: 0.06,
            ease: 'back.out(1.7)',
            delay: 0.8
        });
    }

    // =========================================================================
    //  INITIALIZE ALL ANIMATIONS
    // =========================================================================
    function init() {
        initLenis();
        initAmbientBackdrop();
        initFloatingOrbs();
        initMorphingBlobs();
        initCursorGlow();
        initCardTilt();
        initFrostedReveal();
        initGlassRipple();
        initHeaderParallax();
        initAuroraBorders();
        initTabEntrance();
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

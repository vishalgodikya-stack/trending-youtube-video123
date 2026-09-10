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
    //  2. BORDERGLOW DIRECTIONAL GLASS ENGINE (Pointer tracking & Intro Sweep)
    // =========================================================================
    function getCenterOfElement(el) {
        const rect = el.getBoundingClientRect();
        return [rect.width / 2, rect.height / 2];
    }

    function getEdgeProximity(el, x, y) {
        const [cx, cy] = getCenterOfElement(el);
        const dx = x - cx;
        const dy = y - cy;
        let kx = Infinity;
        let ky = Infinity;
        if (dx !== 0) kx = cx / Math.abs(dx);
        if (dy !== 0) ky = cy / Math.abs(dy);
        return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
    }

    function getCursorAngle(el, x, y) {
        const [cx, cy] = getCenterOfElement(el);
        const dx = x - cx;
        const dy = y - cy;
        if (dx === 0 && dy === 0) return 0;
        const radians = Math.atan2(dy, dx);
        let degrees = radians * (180 / Math.PI) + 90;
        if (degrees < 0) degrees += 360;
        return degrees;
    }

    // Intro specular sweep inspired by BorderGlow component (vanilla JS + GSAP)
    function triggerCardGlowSweep(card, delay = 0) {
        if (!card || card.classList.contains('sweep-active')) return;
        card.classList.add('sweep-active');

        const sweepState = { angle: 110, proximity: 0 };
        card.style.setProperty('--cursor-angle', '110deg');
        card.style.setProperty('--edge-proximity', '0');

        gsap.timeline({
            delay: delay,
            onComplete: () => {
                card.classList.remove('sweep-active');
                if (!card.matches(':hover')) {
                    card.style.setProperty('--edge-proximity', '0');
                }
            }
        })
        .to(sweepState, {
            proximity: 92,
            duration: 0.35,
            ease: 'power2.out',
            onUpdate: () => {
                if (card.classList.contains('sweep-active')) {
                    card.style.setProperty('--edge-proximity', sweepState.proximity.toFixed(1));
                }
            }
        })
        .to(sweepState, {
            angle: 470,
            duration: 1.25,
            ease: 'power1.inOut',
            onUpdate: () => {
                if (card.classList.contains('sweep-active')) {
                    card.style.setProperty('--cursor-angle', `${sweepState.angle.toFixed(1)}deg`);
                }
            }
        }, '<0.08')
        .to(sweepState, {
            proximity: 0,
            duration: 0.45,
            ease: 'power2.in',
            onUpdate: () => {
                if (card.classList.contains('sweep-active')) {
                    card.style.setProperty('--edge-proximity', sweepState.proximity.toFixed(1));
                }
            }
        }, '-=0.35');
    }

    window.triggerCardGlowSweep = triggerCardGlowSweep;

    function initBorderGlow() {
        if (!isDesktop) return;

        // Pointer move delegation: smooth real-time edge proximity & cursor angle tracking
        document.addEventListener('pointermove', (e) => {
            const card = e.target.closest('.video-card, .border-glow-card');
            if (!card) return;

            // If an intro sweep is running on this card, cancel it so user cursor takes over immediately
            if (card.classList.contains('sweep-active')) {
                card.classList.remove('sweep-active');
            }

            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const edge = getEdgeProximity(card, x, y);
            const angle = getCursorAngle(card, x, y);

            card.style.setProperty('--edge-proximity', (edge * 100).toFixed(2));
            card.style.setProperty('--cursor-angle', `${angle.toFixed(2)}deg`);
        }, { passive: true });

        // Pointer out delegation: reset proximity when leaving card
        document.addEventListener('pointerout', (e) => {
            const fromCard = e.target.closest('.video-card, .border-glow-card');
            if (!fromCard) return;

            const toCard = e.relatedTarget ? e.relatedTarget.closest('.video-card, .border-glow-card') : null;
            if (toCard !== fromCard) {
                fromCard.style.setProperty('--edge-proximity', '0');
            }
        }, { passive: true });

        // Sweep initial static cards if any are present
        const initialCards = document.querySelectorAll('.video-card, .border-glow-card');
        initialCards.forEach((c, i) => {
            triggerCardGlowSweep(c, 0.4 + (i * 0.08));
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
    //  4. FROSTED GLASS SCROLL REVEAL (IntersectionObserver Bidirectional Replay)
    // =========================================================================
    function initFrostedReveal() {
        // Target elements that should reveal
        const revealTargets = document.querySelectorAll(
            '.seo-card, .seo-faq-card, .faq-item, .site-footer .footer-col, .top-guide-bar, .load-more-container'
        );

        if (!revealTargets.length) return;

        // Set initial hidden/offset state on all target elements
        revealTargets.forEach((el) => {
            el.classList.add('glass-reveal');
            gsap.set(el, { opacity: 0, y: 35 });
        });

        // Use IntersectionObserver to reliably detect enter and leave in both scroll directions
        if ('IntersectionObserver' in window) {
            const revealObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    const el = entry.target;
                    if (entry.isIntersecting) {
                        // Whenever element ENTERS the viewport (from top or bottom):
                        // Play existing entrance animation from beginning
                        gsap.fromTo(el,
                            {
                                opacity: 0,
                                y: 35,
                            },
                            {
                                opacity: 1,
                                y: 0,
                                duration: 0.7,
                                ease: 'power3.out',
                                overwrite: 'auto'
                            }
                        );
                    } else {
                        // Whenever element LEAVES the viewport completely (scrolled past in either direction):
                        // Reset to initial hidden/offset state silently offscreen
                        gsap.set(el, {
                            opacity: 0,
                            y: 35,
                            overwrite: 'auto'
                        });
                    }
                });
            }, {
                root: null,
                threshold: 0,
                rootMargin: '0px 0px -20px 0px'
            });

            revealTargets.forEach((el) => {
                revealObserver.observe(el);
            });
        } else {
            // Fallback for older browsers
            revealTargets.forEach((el) => {
                gsap.to(el, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' });
            });
        }
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
    //  9. STAGGERED ENTRANCE & BIDIRECTIONAL REPLAY FOR CATEGORY TABS DOCK
    // =========================================================================
    let isTabsDockInView = false;

    function playTabEntrance(delay = 0) {
        const tabs = document.querySelectorAll('.category-tab');
        const categoryBar = document.getElementById('category-tabs');
        const categoryPill = document.getElementById('category-pill-indicator');
        if (!tabs.length || !categoryBar) return;
        if (isTabsDockInView) return;
        isTabsDockInView = true;

        if (categoryPill) {
            gsap.fromTo(categoryPill,
                { opacity: 0, scale: 0.85 },
                { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out', delay: delay + 0.08, overwrite: 'auto' }
            );
        }

        gsap.fromTo(tabs,
            {
                y: 30,
                opacity: 0,
                scale: 0.85
            },
            {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.5,
                stagger: 0.06,
                ease: 'back.out(1.7)',
                delay: delay,
                overwrite: 'auto',
                onComplete: () => {
                    const activeTab = document.querySelector('.category-tab.active');
                    if (activeTab && window.updateCategoryPill) {
                        window.updateCategoryPill(activeTab);
                    }
                }
            }
        );
    }

    function resetTabEntrance() {
        const tabs = document.querySelectorAll('.category-tab');
        const categoryPill = document.getElementById('category-pill-indicator');
        if (!tabs.length) return;
        isTabsDockInView = false;

        gsap.set(tabs, {
            y: 30,
            opacity: 0,
            scale: 0.85,
            overwrite: 'auto'
        });

        if (categoryPill) {
            gsap.set(categoryPill, { opacity: 0, overwrite: 'auto' });
        }
    }

    // Export so app.js and scroll handlers can trigger reset & replay
    window.playTabEntrance = playTabEntrance;
    window.resetTabEntrance = resetTabEntrance;

    function initTabEntrance() {
        const categoryBar = document.getElementById('category-tabs');
        if (!categoryBar) return;

        // Initial entrance on load with exact existing delay (0.8s)
        playTabEntrance(0.8);

        // IntersectionObserver for the category dock
        if ('IntersectionObserver' in window) {
            const dockObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !categoryBar.classList.contains('tabs-hidden')) {
                        playTabEntrance(0);
                    } else if (!entry.isIntersecting) {
                        resetTabEntrance();
                    }
                });
            }, {
                root: null,
                threshold: 0.1
            });

            dockObserver.observe(categoryBar);
        }
    }

    // =========================================================================
    //  INITIALIZE ALL ANIMATIONS
    // =========================================================================
    function init() {
        initLenis();
        initFloatingOrbs();
        initMorphingBlobs();
        initCursorGlow();
        initBorderGlow();
        initFrostedReveal();
        initGlassRipple();
        initHeaderParallax();
        initTabEntrance();
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

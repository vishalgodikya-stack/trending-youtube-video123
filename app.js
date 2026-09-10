document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const videoGrid = document.getElementById('video-grid');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');
    const retryBtn = document.getElementById('retry-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const currentDateEl = document.getElementById('current-date');
    const regionSelect = document.getElementById('region-select');

    // Set dynamic current date in header
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = new Date().toLocaleDateString('en-US', dateOptions);

    // Scroll-based hide/show for bottom category bar
    const categoryBar = document.getElementById('category-tabs');
    const categoryPill = document.getElementById('category-pill-indicator');
    let lastScrollY = window.scrollY;
    let scrollTicking = false;

    // Helper to position the dynamic sliding red pill indicator
    const updatePillPosition = (activeBtn) => {
        if (!categoryPill || !activeBtn) return;
        const offsetLeft = activeBtn.offsetLeft;
        const width = activeBtn.offsetWidth;
        categoryPill.style.transform = `translateX(${offsetLeft}px)`;
        categoryPill.style.width = `${width}px`;
    };
    window.updateCategoryPill = updatePillPosition;

    // Position pill on start and window resize
    const initialActiveTab = document.querySelector('.category-tab.active');
    if (initialActiveTab) {
        setTimeout(() => updatePillPosition(initialActiveTab), 80);
    }
    window.addEventListener('resize', () => {
        const currentActiveTab = document.querySelector('.category-tab.active');
        if (currentActiveTab) updatePillPosition(currentActiveTab);
    }, { passive: true });

    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            window.requestAnimationFrame(() => {
                const currentScrollY = window.scrollY;
                if (currentScrollY > lastScrollY && currentScrollY > 80) {
                    // Scrolling down — smoothly hide the bar and reset tabs offscreen
                    if (categoryBar && !categoryBar.classList.contains('tabs-hidden')) {
                        categoryBar.classList.add('tabs-hidden');
                        if (window.resetTabEntrance) window.resetTabEntrance();
                    }
                } else if (currentScrollY < lastScrollY) {
                    // Scrolling up — smoothly restore the bar and replay entrance animation
                    if (categoryBar && categoryBar.classList.contains('tabs-hidden')) {
                        categoryBar.classList.remove('tabs-hidden');
                        if (window.playTabEntrance) window.playTabEntrance(0);
                    }
                }
                // When at or near the very top of the page, ensure the dock is visible and animated
                if (currentScrollY <= 20 && categoryBar && categoryBar.classList.contains('tabs-hidden')) {
                    categoryBar.classList.remove('tabs-hidden');
                    if (window.playTabEntrance) window.playTabEntrance(0);
                }
                lastScrollY = currentScrollY;
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    }, { passive: true });

    // Global Toggle & Region Management
    const globalToggleBtn = document.getElementById('global-toggle-btn');
    const regionPickerContainer = document.getElementById('region-picker-container');
    const savedRegion = localStorage.getItem('trendwave_region') || 'IN';
    let isGlobal = localStorage.getItem('trendwave_is_global') === 'true';
    let currentCategory = 'all';

    // Initialize Global Mode UI
    if (isGlobal && globalToggleBtn && regionPickerContainer) {
        globalToggleBtn.classList.add('active');
        regionPickerContainer.classList.add('dimmed');
    }

    if (globalToggleBtn) {
        globalToggleBtn.addEventListener('click', () => {
            isGlobal = !isGlobal;
            localStorage.setItem('trendwave_is_global', isGlobal);

            if (isGlobal) {
                globalToggleBtn.classList.add('active');
                if (regionPickerContainer) regionPickerContainer.classList.add('dimmed');
            } else {
                globalToggleBtn.classList.remove('active');
                if (regionPickerContainer) regionPickerContainer.classList.remove('dimmed');
            }

            const region = regionSelect ? regionSelect.value : 'IN';
            fetchTrendingVideos(region, currentCategory, isGlobal);
        });
    }

    if (regionSelect) {
        regionSelect.value = savedRegion;
        regionSelect.addEventListener('change', (e) => {
            const newRegion = e.target.value;
            localStorage.setItem('trendwave_region', newRegion);

            // Selecting a country automatically turns Global mode off
            if (isGlobal) {
                isGlobal = false;
                localStorage.setItem('trendwave_is_global', false);
                if (globalToggleBtn) globalToggleBtn.classList.remove('active');
                if (regionPickerContainer) regionPickerContainer.classList.remove('dimmed');
            }

            fetchTrendingVideos(newRegion, currentCategory, false);
        });
    }

    // Category Tabs Management
    const categoryTabs = document.querySelectorAll('.category-tab');
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            categoryTabs.forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            updatePillPosition(e.currentTarget);
            
            currentCategory = e.currentTarget.dataset.category;
            const region = regionSelect ? regionSelect.value : 'IN';
            fetchTrendingVideos(region, currentCategory, isGlobal);
        });
    });

    // Dynamic Theme Handling
    const toggleTheme = () => {
        document.body.classList.toggle('light-mode');
        const icon = themeToggle.querySelector('i');
        
        if (document.body.classList.contains('light-mode')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            localStorage.setItem('theme', 'light');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            localStorage.setItem('theme', 'dark');
        }
    };

    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
        themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
    }

    themeToggle.addEventListener('click', toggleTheme);

    // Helpers
    const formatViews = (views) => {
        if (!views) return '0 views';
        if (views >= 1000000) {
            return (views / 1000000).toFixed(1) + 'M';
        } else if (views >= 1000) {
            return (views / 1000).toFixed(1) + 'K';
        }
        return views;
    };

    const formatDuration = (seconds) => {
        if (!seconds || seconds < 0) return 'Live';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const parseRelativeDate = (timestamp) => {
        return timestamp || 'Trending now';
    };

    // Extract exact 11-char YouTube Video ID
    const extractVideoId = (video) => {
        if (video.videoId) return video.videoId;
        if (video.id) return video.id;
        if (typeof video.url === 'string') {
            const match = video.url.match(/(?:v=|\/vi?\/|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
            if (match) return match[1];
        }
        return null;
    };

    // Clean title for targeted YouTube topic search
    const cleanTopicQuery = (title) => {
        if (!title) return 'Trending';
        return title
            .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu, '')
            .replace(/\b(LIVE|STREAM|OFFICIAL VIDEO|OFFICIAL MUSIC VIDEO|FULL EPISODE|4K|HD)\b/gi, '')
            .replace(/[|#].*$/, '')
            .trim() || title;
    };

    // Normalize titles to detect duplicate uploads, mirrors, and re-broadcasts
    const normalizeTitle = (title) => {
        if (!title) return '';
        return title
            .toLowerCase()
            .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu, '')
            .replace(/\b(live|stream|official video|official music video|full episode|4k|hd|2026)\b/gi, '')
            .replace(/[^a-z0-9]/g, '')
            .trim();
    };

    // Extract significant keywords from a title for semantic topic duplicate detection
    const extractTitleKeywords = (title) => {
        if (!title) return new Set();
        const stopWords = new Set([
            'with', 'from', 'this', 'that', 'live', 'video', 'watch', 'today',
            'highlights', 'stream', 'full', 'part', '2026', '2025', 'hindi',
            'official', 'match', 'free', 'news', 'update', 'status'
        ]);
        const clean = title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
        const tokens = clean.split(/\s+/).filter(w => w.length >= 3 && !stopWords.has(w));
        return new Set(tokens);
    };

    // Strict multi-layer deduplication across Video ID, URL, Channel+Title, and same-channel topic overlap
    const deduplicateVideos = (videos) => {
        if (!Array.isArray(videos)) return [];
        const seenIds = new Set();
        const seenUrls = new Set();
        const seenTitleKeys = new Set();
        const seenChannelKeywords = new Map();
        const unique = [];

        for (const video of videos) {
            if (!video) continue;

            const videoId = extractVideoId(video);
            const rawUrl = (video.url || '').trim();
            const rawTitle = (video.title || '').trim();
            const normTitle = normalizeTitle(rawTitle);
            const uploader = (video.uploaderName || '').toLowerCase().trim();
            const uploaderTitleKey = uploader && normTitle ? `${uploader}:::${normTitle}` : null;
            const titleOnlyKey = normTitle && normTitle.length >= 14 ? `title:::${normTitle}` : null;

            // 1. Check Video ID collision (e.g. hvES4oRiYM4)
            if (videoId && seenIds.has(videoId)) continue;

            // 2. Check full raw URL collision
            if (rawUrl && seenUrls.has(rawUrl)) continue;

            // 3. Check Channel + Title collision (same channel re-upload / identical title)
            if (uploaderTitleKey && seenTitleKeys.has(uploaderTitleKey)) continue;

            // 4. Check Identical Normalized Title collision (broadcast mirrors)
            if (titleOnlyKey && seenTitleKeys.has(titleOnlyKey)) continue;

            // 5. Check Same-Channel Topic Overlap (same channel posting multiple live streams/clips for the exact same event)
            if (uploader) {
                const currentKeywords = extractTitleKeywords(rawTitle);
                if (currentKeywords.size >= 2 && seenChannelKeywords.has(uploader)) {
                    const prevKeywordSets = seenChannelKeywords.get(uploader);
                    let isTopicDuplicate = false;
                    for (const prevSet of prevKeywordSets) {
                        let commonCount = 0;
                        for (const kw of currentKeywords) {
                            if (prevSet.has(kw)) commonCount++;
                        }
                        if (commonCount >= 2) {
                            isTopicDuplicate = true;
                            break;
                        }
                    }
                    if (isTopicDuplicate) continue;
                }

                if (!seenChannelKeywords.has(uploader)) {
                    seenChannelKeywords.set(uploader, []);
                }
                seenChannelKeywords.get(uploader).push(currentKeywords);
            }

            // Mark identifiers as seen
            if (videoId) seenIds.add(videoId);
            if (rawUrl) seenUrls.add(rawUrl);
            if (uploaderTitleKey) seenTitleKeys.add(uploaderTitleKey);
            if (titleOnlyKey) seenTitleKeys.add(titleOnlyKey);

            unique.push(video);
        }

        return unique;
    };

    // Ensure creator and topic diversity across the feed:
    // 1. In the initial top 6 batch: strictly maximum 1 video per channel/creator
    // 2. Throughout the rest of the feed: prevent back-to-back consecutive videos from the same creator
    const diversifyFeed = (videos) => {
        if (!Array.isArray(videos) || videos.length <= 1) return videos;

        const topBatch = [];
        const rest = [];
        const seenTopChannels = new Set();

        for (const video of videos) {
            const uploader = (video.uploaderName || '').toLowerCase().trim();
            if (topBatch.length < 6 && uploader && !seenTopChannels.has(uploader)) {
                topBatch.push(video);
                seenTopChannels.add(uploader);
            } else {
                rest.push(video);
            }
        }

        // Interleave remaining videos to avoid consecutive videos from the same creator
        const interleaved = [...topBatch];
        const deferred = [];

        for (const video of rest) {
            const currUploader = (video.uploaderName || '').toLowerCase().trim();
            const lastUploader = interleaved.length > 0
                ? (interleaved[interleaved.length - 1].uploaderName || '').toLowerCase().trim()
                : '';

            if (!currUploader || currUploader !== lastUploader) {
                interleaved.push(video);
            } else {
                deferred.push(video);
            }
        }

        // Safely re-insert any deferred videos where adjacent channels differ
        for (const video of deferred) {
            const currUploader = (video.uploaderName || '').toLowerCase().trim();
            let inserted = false;
            for (let i = 6; i < interleaved.length; i++) {
                const prevUploader = (interleaved[i - 1].uploaderName || '').toLowerCase().trim();
                const nextUploader = (interleaved[i].uploaderName || '').toLowerCase().trim();
                if (currUploader !== prevUploader && currUploader !== nextUploader) {
                    interleaved.splice(i, 0, video);
                    inserted = true;
                    break;
                }
            }
            if (!inserted) {
                interleaved.push(video);
            }
        }

        return interleaved;
    };

    // Verified public Piped instances with CORS enabled
    const API_INSTANCES = [
        'https://api.piped.private.coffee',
        'https://pipedapi.ducks.party',
        'https://pipedapi.kavin.rocks'
    ];

    // Region display names for localized queries
    const REGION_NAMES = {
        IN: 'India',
        US: 'United States',
        GB: 'United Kingdom',
        CA: 'Canada',
        AU: 'Australia',
        JP: 'Japan',
        DE: 'Germany',
        BR: 'Brazil'
    };

    // Category keyword maps for client-side filtering
    const CATEGORY_KEYWORDS = {
        music: ['music', 'song', 'album', 'singer', 'rap', 'hip hop', 'remix', 'lyric', 'melody',
                'concert', 'beat', 'dj', 'rhythm', 'band', 'track', 'acoustic', 'vocal', 'playlist',
                'mv', 'official video', 'music video', 'ft.', 'feat.', 'audio', 'studio', 'cover'],
        gaming: ['game', 'gaming', 'gameplay', 'playthrough', 'walkthrough', 'gamer', 'stream',
                 'fortnite', 'minecraft', 'roblox', 'gta', 'valorant', 'cod', 'warzone', 'apex',
                 'esports', 'speedrun', 'lets play', 'ps5', 'xbox', 'nintendo', 'blox fruits',
                 'ffmic', 'free fire', 'pubg', 'bgmi'],
        news: ['news', 'breaking', 'report', 'live', 'politics', 'election', 'debate', 'press',
               'update', 'crisis', 'protest', 'interview', 'analysis', 'aaj tak', 'ndtv',
               'times now', 'republic', 'cnn', 'fox', 'bbc', 'abc news', 'headlines', 'bulletin'],
        tech: ['tech', 'technology', 'review', 'unboxing', 'gadget', 'phone', 'laptop', 'iphone',
               'samsung', 'google', 'apple', 'android', 'ios', 'ai', 'software', 'hardware',
               'cpu', 'gpu', 'nvidia', 'amd', 'programming', 'coding', 'developer', 'app'],
        entertainment: ['entertainment', 'movie', 'film', 'trailer', 'celebrity', 'drama', 'comedy',
                        'show', 'series', 'episode', 'season', 'reality', 'award', 'red carpet',
                        'bollywood', 'hollywood', 'teaser', 'vlog', 'prank', 'challenge', 'react',
                        'funny', 'sketch', 'standup', 'stand-up', 'talent', 'dance']
    };

    // Check if a video matches a category based on title and channel name
    const matchesCategory = (video, category) => {
        if (category === 'all') return true;
        const keywords = CATEGORY_KEYWORDS[category] || [];
        const searchText = `${video.title || ''} ${video.uploaderName || ''}`.toLowerCase();
        return keywords.some(keyword => searchText.includes(keyword));
    };

    // Detect live streams and tournament broadcasts
    const isLiveVideo = (video) => {
        if (!video) return false;
        if (!video.duration || video.duration <= 0 || video.duration === -1) return true;
        if (video.isLive === true) return true;
        const title = (video.title || '').toLowerCase();
        return /(\b|#)live\b|🔴/.test(title);
    };

    // Check if video was uploaded within target hours (e.g. 48h) or is from official trending
    const isFreshWithin = (video, maxHours = 48) => {
        // Videos directly from official trending feed are current by definition
        if (video.fromTrending) return true;

        // Check numerical millisecond timestamp
        if (video.uploaded && video.uploaded > 0) {
            const diffHours = (Date.now() - video.uploaded) / (1000 * 60 * 60);
            if (diffHours <= maxHours) return true;
            if (diffHours > maxHours) return false;
        }

        // Check relative time string (e.g., '3 hours ago', 'today', 'yesterday', '1 day ago', '2 days ago')
        const dateStr = (video.uploadedDate || '').toLowerCase();
        if (/\b(second|minute|hour|today|yesterday|1 day|2 days)\b/i.test(dateStr)) {
            return true;
        }
        if (/\b([3-9] days|\d+ days|week|month|year)\b/i.test(dateStr)) {
            return false;
        }

        // Default to true for unannotated live or recent streams
        return true;
    };

    // Filter to guarantee ONLY truly worldwide, international content in Global Mode
    const REGIONAL_SCRIPTS_REGEX = /[\u0600-\u06FF\u0900-\u0DFF\u0E00-\u0E7F]/;
    const REGIONAL_CHANNEL_BLOCKLIST = [
        'sumantv', 'puthiyathalaimurai', 'polimer', 'thanthi', 'sun tv', 'etv',
        'abp', 'aaj tak', 'zeenews', 'zee news', 'tv9', 'news18', 'ndtv', 'indiatv',
        'vikatan', 'galatta', 'filmi', 'manorama', 'mathrubhumi', 'asianet', 'dangal'
    ];

    const isAuthenticGlobalVideo = (video) => {
        const title = (video.title || '').trim();
        const uploader = (video.uploaderName || '').toLowerCase();

        // 1. Must NOT contain non-Latin regional language scripts (Tamil, Telugu, Hindi, Bengali, etc.)
        if (REGIONAL_SCRIPTS_REGEX.test(title)) {
            return false;
        }

        // 2. Must NOT be from local regional television or news networks
        if (REGIONAL_CHANNEL_BLOCKLIST.some(ch => uploader.includes(ch))) {
            return false;
        }

        return true;
    };

    // Fetch from a Piped API instance with timeout
    const fetchFromInstance = async (url) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        try {
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    };

    // Try fetching from multiple instances with fallback
    const fetchWithFallback = async (buildUrl) => {
        for (const base of API_INSTANCES) {
            try {
                const url = buildUrl(base);
                const data = await fetchFromInstance(url);
                const items = Array.isArray(data) ? data : (data.items || []);
                if (items.length > 0) return items;
            } catch (error) {
                console.warn(`Failed: ${base}`, error.message);
            }
        }
        return [];
    };

    // Main Fetch Logic — Smart tiered threshold & automatic fallback
    const fetchTrendingVideos = async (
        region = (localStorage.getItem('trendwave_region') || 'IN'),
        category = 'all',
        globalMode = (localStorage.getItem('trendwave_is_global') === 'true')
    ) => {
        hideError();
        showLoader();
        clearGrid();

        const countryName = REGION_NAMES[region] || 'India';
        const candidatePool = [];
        const seenIds = new Set();
        const seenUrls = new Set();
        const seenTitleKeys = new Set();

        const addCandidates = (items, fromTrending = false) => {
            if (!Array.isArray(items)) return;
            items.forEach(item => {
                if (!item) return;

                const videoId = extractVideoId(item);
                const rawUrl = (item.url || '').trim();
                const rawTitle = (item.title || '').trim();
                const normTitle = normalizeTitle(rawTitle);
                const uploader = (item.uploaderName || '').toLowerCase().trim();
                const uploaderTitleKey = uploader && normTitle ? `${uploader}:::${normTitle}` : null;
                const titleOnlyKey = normTitle && normTitle.length >= 14 ? `title:::${normTitle}` : null;

                // 1. Check Video ID collision
                if (videoId && seenIds.has(videoId)) return;

                // 2. Check URL collision
                if (rawUrl && seenUrls.has(rawUrl)) return;

                // 3. Check Channel + Title collision
                if (uploaderTitleKey && seenTitleKeys.has(uploaderTitleKey)) return;

                // 4. Check Normalized Title collision
                if (titleOnlyKey && seenTitleKeys.has(titleOnlyKey)) return;

                // Mark identifiers as seen
                if (videoId) seenIds.add(videoId);
                if (rawUrl) seenUrls.add(rawUrl);
                if (uploaderTitleKey) seenTitleKeys.add(uploaderTitleKey);
                if (titleOnlyKey) seenTitleKeys.add(titleOnlyKey);

                item.fromTrending = fromTrending;
                candidatePool.push(item);
            });
        };

        if (globalMode) {
            // Curated International Worldwide Queries targeting genuine global hits
            const globalQueries = category === 'all'
                ? [
                    'global viral video 2026',
                    'trending international billboard hits',
                    'official movie trailer 2026',
                    'world trending youtube videos english',
                    'top gaming reveals trailers 2026'
                  ]
                : [
                    `trending ${category} global english 2026`,
                    `top ${category} official international hits`
                  ];

            for (const q of globalQueries) {
                const searchItems = await fetchWithFallback(
                    (base) => `${base}/search?q=${encodeURIComponent(q)}&filter=videos`
                );
                addCandidates(searchItems, false);
            }

            // Also fetch worldwide general trending feed as foundation
            const worldTrending = await fetchWithFallback(
                (base) => `${base}/trending?region=US`
            );
            addCandidates(worldTrending, true);

            // Filter by category
            let candidates = candidatePool.filter(v => matchesCategory(v, category));

            // Filter out non-Latin scripts and local regional television channels
            candidates = candidates.filter(isAuthenticGlobalVideo);

            // Global Tier 1: Target 25,000+ views for international blockbuster hits
            let filtered = candidates.filter(v => (Number(v.views) || 0) >= 25000);

            // Global Tier 2 Fallback: Relax to 10,000+ views if fewer than 12 videos qualify
            if (filtered.length < 12) {
                filtered = candidates.filter(v => (Number(v.views) || 0) >= 10000);
            }

            // Global Tier 3 Safety: Relax to 5,000+ views if fewer than 8 videos qualify
            if (filtered.length < 8) {
                filtered = candidates.filter(v => (Number(v.views) || 0) >= 5000);
            }

            if (filtered.length === 0 && candidates.length > 0) {
                filtered = candidates;
            }

            // Deduplicate, sort strictly from HIGH to LOW by view count, and diversify feed
            filtered = deduplicateVideos(filtered);
            filtered.sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0));
            filtered = diversifyFeed(deduplicateVideos(filtered));

            hideLoader();

            if (filtered.length > 0) {
                renderVideos(filtered);
            } else {
                showCustomEmptyState(`Unable to load worldwide trends right now. Click below to retry!`);
            }

        } else {
            // Source 1: Raw Trending endpoint for this region (official verified trending)
            const trendingItems = await fetchWithFallback(
                (base) => `${base}/trending?region=${region}`
            );
            addCandidates(trendingItems, true);

            // Source 2: Fresh present-day trending search for this region
            const regionSearchQuery = category === 'all' 
                ? `trending today ${countryName}`
                : `trending ${category} today ${countryName}`;

            const searchItems = await fetchWithFallback(
                (base) => `${base}/search?q=${encodeURIComponent(regionSearchQuery)}&filter=videos`
            );
            addCandidates(searchItems, false);

            // If category is specific, also fetch a targeted category query
            if (category !== 'all') {
                const categorySearchItems = await fetchWithFallback(
                    (base) => `${base}/search?q=${encodeURIComponent(`top ${category} ${countryName} 2026`)}&filter=videos`
                );
                addCandidates(categorySearchItems, false);
            }

            // 1. Category filter
            let candidates = candidatePool.filter(v => matchesCategory(v, category));

            // 2. Tier 1: Target >= 1,000 views and fresh within 48 hours
            let filtered = candidates.filter(v => {
                const views = Number(v.views) || 0;
                return views >= 1000 && isFreshWithin(v, 48);
            });

            // 3. Tier 2 Smart Fallback: If fewer than 8 videos qualify, automatically relax to all official trending videos
            if (filtered.length < 8) {
                console.log(`Tier 1 yielded only ${filtered.length} videos. Activating smart fallback for ${countryName}.`);
                const existingIds = new Set(filtered.map(v => extractVideoId(v)).filter(Boolean));
                const existingUrls = new Set(filtered.map(v => v.url));
                candidates.forEach(v => {
                    const vId = extractVideoId(v);
                    if (!existingUrls.has(v.url) && (!vId || !existingIds.has(vId))) {
                        if (v.fromTrending || (Number(v.views) || 0) >= 500) {
                            existingUrls.add(v.url);
                            if (vId) existingIds.add(vId);
                            filtered.push(v);
                        }
                    }
                });
            }

            // 4. Ultimate safety fallback: If still empty, display all category candidates
            if (filtered.length === 0 && candidates.length > 0) {
                filtered = candidates;
            }

            // Deduplicate, sort strictly from HIGH to LOW by view count, and diversify feed
            filtered = deduplicateVideos(filtered);
            filtered.sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0));
            filtered = diversifyFeed(deduplicateVideos(filtered));

            hideLoader();

            if (filtered.length > 0) {
                renderVideos(filtered);
            } else {
                const scopeText = `${countryName} (${category.toUpperCase()})`;
                showCustomEmptyState(`No videos currently available for ${scopeText}. Click below to retry!`);
            }
        }
    };

    // Video Batching & Pagination State (Show max 6 videos initially, then load more)
    const BATCH_SIZE = 6;
    let currentFilteredVideos = [];
    let displayedVideoCount = 0;
    const loadMoreContainer = document.getElementById('load-more-container');
    const loadMoreBtn = document.getElementById('load-more-btn');

    // Mobile Drawer Navigation Elements
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeDrawerBtn = document.getElementById('close-drawer-btn');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const mobileDrawerOverlay = document.getElementById('mobile-drawer-overlay');
    const topGuideToggleBtn = document.getElementById('top-guide-toggle-btn');

    // Render Next Batch of Video Cards
    const renderNextVideoBatch = () => {
        const nextBatch = currentFilteredVideos.slice(displayedVideoCount, displayedVideoCount + BATCH_SIZE);
        if (nextBatch.length === 0) {
            if (loadMoreContainer) loadMoreContainer.classList.add('hidden');
            return;
        }

        nextBatch.forEach((video, batchIndex) => {
            const videoId = extractVideoId(video);
            const cleanTopic = cleanTopicQuery(video.title);
            const isLive = isLiveVideo(video);
            
            // Topic exploration search link (opens exact matching topic results)
            const topicSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanTopic)}`;
            
            // Direct video playback link fallback
            const watchDirectUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : topicSearchUrl;
            
            const tNavUrl = video.thumbnail || 'https://via.placeholder.com/640x360.png?text=No+Thumbnail';
            const avatarUrl = video.uploaderAvatar;
            
            const durationHtml = isLive 
                ? `<div class="video-duration live-badge"><i class="fas fa-circle"></i> LIVE</div>`
                : `<div class="video-duration">${formatDuration(video.duration)}</div>`;
            
            const card = document.createElement('article');
            card.className = 'video-card';
            card.dataset.thumbnail = tNavUrl;
            card.title = `Explore "${cleanTopic}" on YouTube`;
            
            // Clicking card explores the trending topic on YouTube
            card.addEventListener('click', (e) => {
                window.open(topicSearchUrl, '_blank', 'noopener,noreferrer');
            });
            
            // Set initial invisible state for animation
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            card.innerHTML = `
                <div class="card-glare"></div>
                <div class="thumbnail-container">
                    <img src="${tNavUrl}" alt="${video.title}" class="video-thumbnail" loading="lazy">
                    <a href="${watchDirectUrl}" target="_blank" rel="noopener noreferrer" class="play-overlay" title="Watch direct video" onclick="event.stopPropagation();">
                        <i class="fas fa-play-circle"></i>
                    </a>
                    ${durationHtml}
                </div>
                <div class="card-content">
                    <span class="topic-tag"><i class="fas fa-fire"></i> Trending Topic</span>
                    <h3 class="video-title" title="${video.title}">${video.title}</h3>
                    <div class="channel-info">
                        ${avatarUrl ? 
                            `<img src="${avatarUrl}" alt="${video.uploaderName}" class="channel-avatar" loading="lazy">` : 
                            `<div class="channel-avatar"><i class="fas fa-user"></i></div>`
                        }
                        <span class="channel-name">${video.uploaderName}</span>
                    </div>
                    <div class="video-stats">
                        <span class="stat"><i class="fas fa-eye"></i> ${formatViews(video.views)}</span>
                        <span class="stat"><i class="fas fa-clock"></i> ${parseRelativeDate(video.uploadedDate)}</span>
                    </div>
                    <div class="card-action">
                        <span class="topic-explore-btn"><i class="fab fa-youtube"></i> Explore Topic</span>
                        <a href="${watchDirectUrl}" target="_blank" rel="noopener noreferrer" class="watch-direct-btn" title="Watch direct video" onclick="event.stopPropagation();">
                            <i class="fas fa-play"></i> Watch
                        </a>
                    </div>
                </div>
            `;
            
            videoGrid.appendChild(card);
            
            // Trigger animation sequentially, then clear inline transform so 3D tilt can control it
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = '';
            }, 50 + (batchIndex * 50));
        });

        displayedVideoCount += nextBatch.length;
        videoGrid.classList.remove('hidden');

        // Show/hide load more button based on remaining videos
        if (loadMoreContainer) {
            if (displayedVideoCount < currentFilteredVideos.length) {
                loadMoreContainer.classList.remove('hidden');
            } else {
                loadMoreContainer.classList.add('hidden');
            }
        }
    };

    // Render Logic with Final Guard against Duplicate Video Cards and Creator Bursts
    const renderVideos = (videos) => {
        const uniqueVideos = diversifyFeed(deduplicateVideos(videos));
        currentFilteredVideos = uniqueVideos.slice(0, 36);
        displayedVideoCount = 0;
        videoGrid.innerHTML = '';
        renderNextVideoBatch();

        // Notify dynamic ambient backdrop engine of top video thumbnail
        if (currentFilteredVideos.length > 0 && currentFilteredVideos[0].thumbnail) {
            window.dispatchEvent(new CustomEvent('trendingVideosReady', {
                detail: { topThumbnail: currentFilteredVideos[0].thumbnail }
            }));
        }
    };

    // UI State Toggles
    const showLoader = () => {
        loader.classList.remove('hidden');
        if (loadMoreContainer) loadMoreContainer.classList.add('hidden');
    };
    const hideLoader = () => loader.classList.add('hidden');
    const showError = () => {
        errorMessage.querySelector('p').innerHTML = 'Whoops! Failed to catch the latest wave.<br>Our sources might be down. Please try again later.';
        errorMessage.querySelector('i').className = 'fas fa-exclamation-circle';
        errorMessage.classList.remove('hidden');
        if (loadMoreContainer) loadMoreContainer.classList.add('hidden');
    };
    const showCustomEmptyState = (customText) => {
        errorMessage.querySelector('p').innerHTML = customText;
        errorMessage.querySelector('i').className = 'fas fa-clock';
        errorMessage.classList.remove('hidden');
        if (loadMoreContainer) loadMoreContainer.classList.add('hidden');
    };
    const hideError = () => errorMessage.classList.add('hidden');
    const clearGrid = () => {
        videoGrid.innerHTML = '';
        videoGrid.classList.add('hidden');
        if (loadMoreContainer) loadMoreContainer.classList.add('hidden');
    };

    // Event Listeners
    retryBtn.addEventListener('click', () => {
        const region = regionSelect ? regionSelect.value : 'IN';
        fetchTrendingVideos(region, currentCategory, isGlobal);
    });

    // Load More Trending Videos Handler
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            renderNextVideoBatch();
        });
    }

    // Mobile Drawer Navigation Toggles
    const openDrawer = () => {
        if (mobileDrawer) {
            mobileDrawer.classList.add('open');
            mobileDrawer.setAttribute('aria-hidden', 'false');
        }
        if (mobileDrawerOverlay) mobileDrawerOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    const closeDrawer = () => {
        if (mobileDrawer) {
            mobileDrawer.classList.remove('open');
            mobileDrawer.setAttribute('aria-hidden', 'true');
        }
        if (mobileDrawerOverlay) mobileDrawerOverlay.classList.remove('open');
        document.body.style.overflow = '';
    };

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openDrawer);
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
    if (mobileDrawerOverlay) mobileDrawerOverlay.addEventListener('click', closeDrawer);
    document.querySelectorAll('.drawer-link, .drawer-link-sub').forEach(link => {
        link.addEventListener('click', closeDrawer);
    });

    // Close drawer on Escape key for desktop accessibility
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileDrawer && mobileDrawer.classList.contains('open')) {
            closeDrawer();
        }
    });

    // Top Quick Guide / Answers Scroll Handler
    if (topGuideToggleBtn) {
        topGuideToggleBtn.addEventListener('click', () => {
            const guideSection = document.getElementById('seo-guide-section');
            if (guideSection) {
                guideSection.scrollIntoView({ behavior: 'smooth' });
                // Expand the first SEO guide accordion item if none are open
                const openItem = guideSection.querySelector('.faq-item.open');
                if (!openItem) {
                    const firstItem = guideSection.querySelector('.faq-item');
                    if (firstItem) {
                        firstItem.classList.add('open');
                        const qBtn = firstItem.querySelector('.faq-question');
                        if (qBtn) qBtn.setAttribute('aria-expanded', 'true');
                    }
                }
            }
        });
    }

    // Generic Accordion Initializer for Homepage SEO Guide and FAQ
    const setupAccordion = (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        const questions = container.querySelectorAll('.faq-question');
        questions.forEach(btn => {
            btn.addEventListener('click', () => {
                const item = btn.closest('.faq-item');
                if (!item) return;
                const isOpen = item.classList.contains('open');

                // Close other items in this accordion for clean single-expanded view
                container.querySelectorAll('.faq-item').forEach(i => {
                    i.classList.remove('open');
                    const b = i.querySelector('.faq-question');
                    if (b) b.setAttribute('aria-expanded', 'false');
                });

                // Toggle selected item
                if (!isOpen) {
                    item.classList.add('open');
                    btn.setAttribute('aria-expanded', 'true');
                }
            });
        });
    };

    // Initialize both Homepage SEO Guide & FAQ Accordions
    setupAccordion('home-faq-accordion');
    setupAccordion('seo-guide-accordion');

    // =========================================================================
    //  Dynamic Video Thumbnail Background on Card Hover
    //  - When hovering any video card, use that video's thumbnail as page background
    //  - Background image itself remains completely SHARP and CLEAR
    //  - Zero blur, fog, haze, milky overlay, or filter on dynamic background
    //  - Smooth crossfade between cards
    //  - Smooth restore to normal background when cursor leaves video cards
    // =========================================================================
    const initDynamicThumbnailBackground = () => {
        const container = document.getElementById('dynamic-thumbnail-bg');
        const layerA = document.getElementById('dynamic-bg-layer-a');
        const layerB = document.getElementById('dynamic-bg-layer-b');
        if (!container || !layerA || !layerB) return;

        let activeLayer = null;
        let currentUrl = '';
        let hideTimer = null;

        const showThumbnail = (url) => {
            if (!url) return;
            if (hideTimer) {
                clearTimeout(hideTimer);
                hideTimer = null;
            }

            if (currentUrl === url && container.classList.contains('active')) {
                return;
            }

            currentUrl = url;

            if (!activeLayer || activeLayer === 'b') {
                layerA.style.backgroundImage = `url("${url}")`;
                layerA.style.zIndex = '2';
                layerB.style.zIndex = '1';
                layerA.classList.add('visible');
                layerB.classList.remove('visible');
                activeLayer = 'a';
            } else {
                layerB.style.backgroundImage = `url("${url}")`;
                layerB.style.zIndex = '2';
                layerA.style.zIndex = '1';
                layerB.classList.add('visible');
                layerA.classList.remove('visible');
                activeLayer = 'b';
            }

            container.classList.add('active');
        };

        const hideThumbnail = () => {
            if (hideTimer) clearTimeout(hideTimer);
            hideTimer = setTimeout(() => {
                container.classList.remove('active');
                setTimeout(() => {
                    if (!container.classList.contains('active')) {
                        if (layerA) layerA.classList.remove('visible');
                        if (layerB) layerB.classList.remove('visible');
                        currentUrl = '';
                        activeLayer = null;
                    }
                }, 400);
            }, 80);
        };

        // Delegated mouseover: catch any video card enter
        document.addEventListener('mouseover', (e) => {
            const card = e.target.closest('.video-card');
            if (!card) return;

            const thumbImg = card.querySelector('.video-thumbnail');
            const url = card.dataset.thumbnail || (thumbImg ? thumbImg.src : null);
            if (url) {
                showThumbnail(url);
            }
        }, { passive: true });

        // Delegated mouseout: detect leaving a video card
        document.addEventListener('mouseout', (e) => {
            const fromCard = e.target.closest('.video-card');
            if (!fromCard) return;

            const toCard = e.relatedTarget ? e.relatedTarget.closest('.video-card') : null;
            if (toCard === fromCard) {
                // Moving between elements inside the same card
                return;
            }

            if (!toCard) {
                // Moving outside all video cards
                hideThumbnail();
            } else {
                // Moving directly to another card
                const thumbImg = toCard.querySelector('.video-thumbnail');
                const nextUrl = toCard.dataset.thumbnail || (thumbImg ? thumbImg.src : null);
                if (nextUrl) {
                    showThumbnail(nextUrl);
                }
            }
        }, { passive: true });

        window.addEventListener('blur', hideThumbnail);
        document.addEventListener('mouseleave', hideThumbnail);
    };

    initDynamicThumbnailBackground();

    // Initial Bootstrap
    fetchTrendingVideos(savedRegion, currentCategory, isGlobal);
});

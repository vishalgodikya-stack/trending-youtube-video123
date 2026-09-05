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
    let lastScrollY = window.scrollY;
    let scrollTicking = false;

    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            window.requestAnimationFrame(() => {
                const currentScrollY = window.scrollY;
                if (currentScrollY > lastScrollY && currentScrollY > 100) {
                    // Scrolling down — hide the bar
                    categoryBar.classList.add('tabs-hidden');
                } else {
                    // Scrolling up — show the bar
                    categoryBar.classList.remove('tabs-hidden');
                }
                lastScrollY = currentScrollY;
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    });

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
            e.target.classList.add('active');
            
            currentCategory = e.target.dataset.category;
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

    // Strict 24-hour present day filter & 5k minimum views & non-live
    const isStrictlyTrendingToday = (video) => {
        // 1. Exclude live streams (must have a valid positive duration)
        if (!video.duration || video.duration <= 0) return false;

        // 2. Minimum 5,000 views
        const views = Number(video.views) || 0;
        if (views < 5000) return false;

        // 3. Must be uploaded strictly within the last 24 hours (present day)
        if (video.uploaded && video.uploaded > 0) {
            const diffMs = Date.now() - video.uploaded;
            if (diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000) {
                return true;
            }
            // If uploaded timestamp is older than 24h, reject
            if (diffMs > 24 * 60 * 60 * 1000) {
                return false;
            }
        }

        // Check relative time string (e.g., '3 hours ago', '45 minutes ago', 'today')
        const dateStr = (video.uploadedDate || '').toLowerCase();
        const isWithin24h = /minute|hour|today|moments/i.test(dateStr);
        const isOlder = /day|week|month|year/i.test(dateStr);

        return isWithin24h && !isOlder;
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

        // 3. For Global mode, require at least 50,000 views to ensure massive worldwide reach
        const views = Number(video.views) || 0;
        if (views < 50000) {
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

    // Main Fetch Logic — 24h present-day trending, >= 5k views, sorted high-to-low
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
        const seenUrls = new Set();

        const addCandidates = (items) => {
            if (!Array.isArray(items)) return;
            items.forEach(item => {
                if (item && item.url && !seenUrls.has(item.url)) {
                    seenUrls.add(item.url);
                    candidatePool.push(item);
                }
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
                addCandidates(searchItems);
            }
        } else {
            // Source 1: Raw Trending endpoint for this region
            const trendingItems = await fetchWithFallback(
                (base) => `${base}/trending?region=${region}`
            );
            addCandidates(trendingItems);

            // Source 2: Fresh present-day trending search for this region
            const regionSearchQuery = category === 'all' 
                ? `trending today ${countryName}`
                : `trending ${category} today ${countryName}`;

            const searchItems = await fetchWithFallback(
                (base) => `${base}/search?q=${encodeURIComponent(regionSearchQuery)}&filter=videos`
            );
            addCandidates(searchItems);

            // If category is specific, also fetch a targeted category query
            if (category !== 'all') {
                const categorySearchItems = await fetchWithFallback(
                    (base) => `${base}/search?q=${encodeURIComponent(`top ${category} ${countryName} 2026`)}&filter=videos`
                );
                addCandidates(categorySearchItems);
            }
        }

        // Apply filters:
        // 1. Category filter
        let filtered = candidatePool.filter(v => matchesCategory(v, category));

        // 2. Strict 24h present day + >= 5k views + non-live
        filtered = filtered.filter(isStrictlyTrendingToday);

        // 3. For Global Mode: Strictly enforce international authenticity (block regional scripts, TV stations, 50K+ min views)
        if (globalMode) {
            filtered = filtered.filter(isAuthenticGlobalVideo);
        }

        // 4. Sort strictly from HIGH to LOW by view count
        filtered.sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0));

        hideLoader();

        if (filtered.length > 0) {
            renderVideos(filtered);
        } else {
            const scopeText = globalMode ? `Worldwide (${category.toUpperCase()})` : `${countryName} (${category.toUpperCase()})`;
            console.warn(`No videos strictly matched the 24h present-day and 5k+ view filter for ${scopeText}.`);
            showCustomEmptyState(`No videos with 5,000+ views uploaded in the last 24 hours found for ${scopeText}. Try another selection!`);
        }
    };

    // Render Logic
    const renderVideos = (videos) => {
        const videoList = videos.slice(0, 30);
        
        videoList.forEach((video, index) => {
            const videoId = extractVideoId(video);
            const cleanTopic = cleanTopicQuery(video.title);
            
            // Topic exploration search link (opens exact matching topic results)
            const topicSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanTopic)}`;
            
            // Direct video playback link fallback
            const watchDirectUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : topicSearchUrl;
            
            const tNavUrl = video.thumbnail || 'https://via.placeholder.com/640x360.png?text=No+Thumbnail';
            const avatarUrl = video.uploaderAvatar;
            
            const card = document.createElement('article');
            card.className = 'video-card';
            card.title = `Explore "${cleanTopic}" on YouTube`;
            
            // Clicking card explores the trending topic on YouTube
            card.addEventListener('click', (e) => {
                window.open(topicSearchUrl, '_blank', 'noopener,noreferrer');
            });
            
            // Set initial invisible state for animation
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            card.innerHTML = `
                <div class="thumbnail-container">
                    <img src="${tNavUrl}" alt="${video.title}" class="video-thumbnail" loading="lazy">
                    <a href="${watchDirectUrl}" target="_blank" rel="noopener noreferrer" class="play-overlay" title="Watch direct video" onclick="event.stopPropagation();">
                        <i class="fas fa-play-circle"></i>
                    </a>
                    <div class="video-duration">${formatDuration(video.duration)}</div>
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
            
            // Trigger animation sequentially
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 50 + (index * 50));
        });

        videoGrid.classList.remove('hidden');
    };

    // UI State Toggles
    const showLoader = () => loader.classList.remove('hidden');
    const hideLoader = () => loader.classList.add('hidden');
    const showError = () => {
        errorMessage.querySelector('p').innerHTML = 'Whoops! Failed to catch the latest wave.<br>Our sources might be down. Please try again later.';
        errorMessage.querySelector('i').className = 'fas fa-exclamation-circle';
        errorMessage.classList.remove('hidden');
    };
    const showCustomEmptyState = (customText) => {
        errorMessage.querySelector('p').innerHTML = customText;
        errorMessage.querySelector('i').className = 'fas fa-clock';
        errorMessage.classList.remove('hidden');
    };
    const hideError = () => errorMessage.classList.add('hidden');
    const clearGrid = () => {
        videoGrid.innerHTML = '';
        videoGrid.classList.add('hidden');
    };

    // Event Listeners
    retryBtn.addEventListener('click', () => {
        const region = regionSelect ? regionSelect.value : 'IN';
        fetchTrendingVideos(region, currentCategory, isGlobal);
    });

    // Initial Bootstrap
    fetchTrendingVideos(savedRegion, currentCategory, isGlobal);
});

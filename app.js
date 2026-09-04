document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const videoGrid = document.getElementById('video-grid');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');
    const retryBtn = document.getElementById('retry-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const currentDateEl = document.getElementById('current-date');
    const regionSelect = document.getElementById('region-select');

    // Set dynamic current date
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = new Date().toLocaleDateString('en-US', dateOptions);

    // Region Management
    const savedRegion = localStorage.getItem('trendwave_region') || 'IN';
    let currentCategory = 'all';

    if (regionSelect) {
        regionSelect.value = savedRegion;
        regionSelect.addEventListener('change', (e) => {
            const newRegion = e.target.value;
            localStorage.setItem('trendwave_region', newRegion);
            fetchTrendingVideos(newRegion, currentCategory);
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
            fetchTrendingVideos(region, currentCategory);
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
    const getApiUrls = (region, category) => {
        if (category === 'all') {
            return [
                `https://api.piped.private.coffee/trending?region=${region}`,
                `https://pipedapi.ducks.party/trending?region=${region}`,
                `https://pipedapi.kavin.rocks/trending?region=${region}`
            ];
        } else {
            const query = `trending ${category}`;
            return [
                `https://api.piped.private.coffee/search?q=${encodeURIComponent(query)}&filter=videos`,
                `https://pipedapi.ducks.party/search?q=${encodeURIComponent(query)}&filter=videos`,
                `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=videos`
            ];
        }
    };

    // Fetch Logic
    const fetchTrendingVideos = async (region = (localStorage.getItem('trendwave_region') || 'IN'), category = 'all') => {
        hideError();
        showLoader();
        clearGrid();

        const apiUrls = getApiUrls(region, category);
        let data = null;
        let fetchSuccess = false;

        for (const url of apiUrls) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 6000);
                
                const response = await fetch(url, { 
                    headers: { 'Accept': 'application/json' },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                
                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                
                data = await response.json();
                
                let itemsArray = Array.isArray(data) ? data : (data.items || []);
                
                if (itemsArray.length > 0) {
                    data = itemsArray;
                    fetchSuccess = true;
                    break;
                }
            } catch (error) {
                console.warn(`Failed fetching from ${url}:`, error.message);
            }
        }

        hideLoader();

        if (fetchSuccess && data) {
            renderVideos(data);
        } else {
            console.error('All API instances failed to return data.');
            showError();
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
    const showError = () => errorMessage.classList.remove('hidden');
    const hideError = () => errorMessage.classList.add('hidden');
    const clearGrid = () => {
        videoGrid.innerHTML = '';
        videoGrid.classList.add('hidden');
    };

    // Event Listeners
    retryBtn.addEventListener('click', () => {
        const region = regionSelect ? regionSelect.value : 'IN';
        fetchTrendingVideos(region, currentCategory);
    });

    // Initial Bootstrap
    fetchTrendingVideos(savedRegion, currentCategory);
});

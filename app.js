document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const videoGrid = document.getElementById('video-grid');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');
    const retryBtn = document.getElementById('retry-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const currentDateEl = document.getElementById('current-date');

    // Set dynamic current date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = new Date().toLocaleDateString('en-US', options);

    // Dynamic Theme Handling
    const toggleTheme = () => {
        document.body.classList.toggle('light-mode');
        const icon = themeToggle.querySelector('i');
        
        if (document.body.classList.contains('light-mode')) {
            // Switch to Light Mode
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            localStorage.setItem('theme', 'light');
        } else {
            // Switch to Dark Mode
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            localStorage.setItem('theme', 'dark');
        }
    };

    // Initialize Theme from LocalStorage
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
        // Piped often returns seconds, or string duration "2 days ago". Let's handle generic inputs.
        // Assuming Piped returns an uploadedDate string like "1 day ago"
        return timestamp || 'Recently';
    };

    // Fetch Logic
    const fetchTrendingVideos = async () => {
        // Reset UI states
        hideError();
        showLoader();
        clearGrid();

        // Piped API endpoints (Privacy-friendly YouTube frontend alternative)
        // These are public instances that we fallback upon for reliability.
        const apiUrls = [
            'https://pipedapi.kavin.rocks/trending?region=US',
            'https://pipedapi.tokhmi.xyz/trending?region=US',
            'https://pipedapi.lunar.icu/trending?region=US',
            'https://pipedapi.smnz.de/trending?region=US'
        ];

        let data = null;
        let fetchSuccess = false;

        // Try instances sequentially until one succeeds
        for (const url of apiUrls) {
            try {
                console.log(`Attempting to fetch trends from: ${url}`);
                const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
                
                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                
                data = await response.json();
                
                if (Array.isArray(data) && data.length > 0) {
                    fetchSuccess = true;
                    console.log(`Successfully fetched from: ${url}`);
                    break;
                }
            } catch (error) {
                console.warn(`Failed fetching from ${url}. Moving to next instance. Error:`, error.message);
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
        // Render up to 30 top trending videos
        const videoList = videos.slice(0, 30);
        
        videoList.forEach((video, index) => {
            // Staggered delay for cascading animation entrance
            const animationDelay = index * 0.05;
            
            // Reconstruct proper YouTube URLs from API payload
            const videoUrl = `https://www.youtube.com${video.url}`;
            const tNavUrl = video.thumbnail || 'https://via.placeholder.com/640x360.png?text=No+Thumbnail';
            const avatarUrl = video.uploaderAvatar;
            
            const card = document.createElement('a');
            card.href = videoUrl;
            card.target = '_blank';
            card.rel = 'noopener noreferrer';
            card.className = 'video-card';
            
            // Set initial invisible state for animation
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            card.innerHTML = `
                <div class="thumbnail-container">
                    <img src="${tNavUrl}" alt="${video.title}" class="video-thumbnail" loading="lazy">
                    <div class="play-overlay"><i class="fas fa-play-circle"></i></div>
                    <div class="video-duration">${formatDuration(video.duration)}</div>
                </div>
                <div class="card-content">
                    <h3 class="video-title" title="${video.title}">${video.title}</h3>
                    <div class="channel-info">
                        ${avatarUrl ? 
                            `<img src="${avatarUrl}" alt="${video.uploaderName}" class="channel-avatar" loading="lazy">` : 
                            `<div class="channel-avatar"><i class="fas fa-user"></i></div>`
                        }
                        <span class="channel-name">${video.uploaderName}</span>
                    </div>
                    <div class="video-stats">
                        <span class="stat"><i class="fas fa-fire"></i> ${formatViews(video.views)} views</span>
                        <span class="stat"><i class="fas fa-clock"></i> ${parseRelativeDate(video.uploadedDate)}</span>
                    </div>
                </div>
            `;
            
            videoGrid.appendChild(card);
            
            // Trigger animation sequentially
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 50 + (index * 60));
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
    retryBtn.addEventListener('click', fetchTrendingVideos);

    // Initial Bootstrap
    fetchTrendingVideos();
});

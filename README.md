# 🌊 TrendWave — Real-Time YouTube Trends Dashboard

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)

**Discover and explore today's hottest YouTube videos with a sleek, real-time glassmorphic dashboard.**

[View Demo](#-how-to-run--use) • [Report Bug](https://github.com/) • [Request Feature](https://github.com/)

</div>

---

## 📌 Project Overview

**TrendWave** is a lightweight, responsive web application designed to track and display real-time trending YouTube videos for the current day. Built with vanilla web technologies, the application delivers a distraction-free user experience featuring a modern dark-mode glassmorphism interface, smooth micro-animations, and dynamic theme switching.

The project retrieves live trending data directly through privacy-friendly public Piped API instances with automatic multi-instance failover, ensuring instant loading without requiring any API keys, authentication, or server-side dependencies.

---

## ✨ Features

- 🔥 **Real-Time Trending Feed**: Automatically fetches and displays today's top trending YouTube videos.
- 🔄 **Multi-Instance API Fallback**: Queries multiple reliable API endpoints sequentially to ensure uninterrupted service availability even if an instance is temporarily unreachable.
- 🌓 **Dark & Light Mode Switcher**: Seamlessly toggles between a vibrant dark-mode glassmorphism aesthetic and a clean light theme, with user preference saved in localStorage.
- 📊 **Smart Metadata Formatting**: Converts raw view counts into readable abbreviations (1.2M, 450K) and formats durations (HH:MM:SS / MM:SS / Live).
- 🎨 **Modern Glassmorphism UI**: Features floating animated background gradient blobs, backdrop blur effects, interactive card lift & glow on hover, and custom video duration badges.
- 📱 **Fully Responsive Layout**: Built with CSS Grid and Flexbox to adapt effortlessly across mobile phones, tablets, and desktop displays.
- 🛡️ **Error Handling & Retry Mechanism**: Clear visual feedback with an interactive retry button if network connectivity fails.
- ⚡ **Pure Vanilla Stack**: 100% zero external npm dependencies or bundlers required—runs natively in any modern web browser.

---

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| **HTML5** | Semantic structure, accessibility, and meta tags |
| **CSS3** | Glassmorphism (ackdrop-filter), CSS Custom Properties (Variables), CSS Grid, Flexbox, Keyframe animations |
| **JavaScript (ES6+)** | Asynchronous Fetch API, DOM manipulation, state management, and localStorage persistence |
| **Font Awesome 6.4.0** | Vector icon system for controls, indicators, and stats |
| **Google Fonts (Outfit)** | Modern sans-serif typography |
| **Piped API** | Privacy-friendly public proxy endpoints for YouTube trending data (No API key needed) |

---

## 📂 Project Structure

`	ext
youtube-trends/
├── assets/
│   └── screenshots/
│       └── .gitkeep             # Placeholder directory for repository screenshots
├── scripts/
│   └── start-server.ps1         # Optional local development server for Windows PowerShell
├── .gitignore                   # Standard Git ignore rules for OS, IDE, and temporary files
├── app.js                       # Core application logic, API fetching, and UI rendering
├── index.html                   # Main entry point and semantic HTML layout
├── styles.css                   # Glassmorphism styling, CSS variables, and animations
└── README.md                    # Comprehensive project documentation
`

---

## 🚀 How to Run & Use

Because TrendWave is built with standard web standards, you can run it locally in several easy ways:

### Option 1: Direct Browser Launch (Fastest)
Simply double-click index.html or open it with any web browser (Chrome, Edge, Firefox, Safari).

---

### Option 2: Using the Included PowerShell Server (Windows)
If you prefer running a local HTTP server:
`powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-server.ps1
`
Then open your browser and navigate to:
`	ext
http://localhost:8080
`

---

### Option 3: Using VS Code Live Server Extension
1. Open the project folder in **Visual Studio Code**.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Right-click index.html and select **"Open with Live Server"**.

---

### Option 4: Using Python HTTP Server
If you have Python installed:
`ash
# Python 3.x
python -m http.server 8080
`

---

### Option 5: Free 1-Click Cloud Deployment
You can host this project 24/7 for free using:
- **GitHub Pages**: Go to your repository settings > **Pages** > Select branch main and folder / (root).
- **Netlify Drop**: Drag and drop the project folder into [app.netlify.com/drop](https://app.netlify.com/drop).
- **Vercel**: Import your GitHub repository to deploy in seconds.

---

## 📸 Screenshots

<div align="center">

<!-- Place your actual screenshots in the assets/screenshots/ directory and update the path below -->
<img src="assets/screenshots/preview.png" alt="TrendWave Dashboard Preview" width="800" onerror="this.onerror=null; this.src='https://placehold.co/800x450/0d1117/ffffff?text=TrendWave+Dashboard+Preview';" />

*Figure 1: TrendWave Dashboard with live YouTube trends, glassmorphism cards, and dark theme.*

</div>

> **Tip**: To add your own screenshot:
> 1. Take a screenshot of the running website.
> 2. Save it as preview.png inside the ssets/screenshots/ folder.
> 3. Commit and push the image to GitHub.

---

## 🔮 Future Improvements & Roadmap

- [ ] **Regional Filters**: Add a country selection dropdown (US, UK, IN, JP, DE, etc.) to view localized trending topics.
- [ ] **Category Tabs**: Filter trending videos by categories (Music, Gaming, News, Tech, Entertainment).
- [ ] **In-App Search**: Real-time search bar to filter trending videos by title or creator.
- [ ] **Modal Video Player**: Preview and watch videos directly inside an embedded modal window.
- [ ] **Bookmark Favorites**: Save favorite trending videos to a local watch-later list.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/) to submit improvements or bug reports.

1. Fork the repository
2. Create your feature branch (git checkout -b feature/AmazingFeature)
3. Commit your changes (git commit -m 'Add some AmazingFeature')
4. Push to the branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👤 Author

- **GitHub**: [@YourUsername](https://github.com/)
- **Project Name**: TrendWave

<div align="center">
Made with ❤️ for exploring trending content on YouTube.
</div>

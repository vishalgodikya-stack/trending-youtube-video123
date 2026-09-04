# 🌊 TrendWave — Real-Time YouTube Trends Dashboard

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel)

**Discover and explore today's hottest YouTube trends with a sleek, real-time glassmorphic dashboard.**

[View Live Demo](https://video123.vercel.app/) • [Report Bug](https://github.com/vishalgodikya-stack/trending-youtube-video123/issues) • [Request Feature](https://github.com/vishalgodikya-stack/trending-youtube-video123/issues)

</div>

---

## 📌 Project Overview

**TrendWave** is a lightweight, responsive web application designed to track and display real-time trending YouTube topics. Built with vanilla web technologies, the application delivers a distraction-free user experience featuring a modern dark-mode glassmorphism interface, smooth micro-animations, and regional filtering capabilities.

The project retrieves live trending data directly through privacy-friendly public Piped API instances with automatic multi-instance failover, ensuring instant loading without requiring any API keys, authentication, or server-side dependencies.

---

## ✨ Features

- 🔥 **Real-Time Trending Feed**: Automatically fetches and displays today's top trending YouTube topics and videos.
- 🌍 **Regional Filtering**: View what's trending across different countries (Global, US, UK, India, Japan, Germany, and Brazil). Your selection is automatically saved!
- 🔄 **Multi-Instance API Fallback**: Queries multiple reliable API endpoints sequentially to ensure uninterrupted service availability.
- 🌓 **Dark & Light Mode Switcher**: Seamlessly toggles between a vibrant dark-mode glassmorphism aesthetic and a clean light theme.
- 📊 **Smart Metadata Formatting**: Converts raw view counts into readable abbreviations and formats durations dynamically.
- 🎨 **Modern Glassmorphism UI**: Features floating animated background gradient blobs, backdrop blur effects, and interactive card lift.
- ⚡ **Pure Vanilla Stack**: 100% zero external npm dependencies or bundlers required—runs natively in any modern web browser.

---

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| **HTML5** | Semantic structure, accessibility, and meta tags |
| **CSS3** | Glassmorphism (`backdrop-filter`), CSS Grid, Flexbox, Keyframe animations |
| **JavaScript (ES6+)** | Asynchronous Fetch API, DOM manipulation, AbortControllers, and localStorage persistence |
| **Font Awesome 6.4.0** | Vector icon system for controls, indicators, and stats |
| **Piped API** | Privacy-friendly public proxy endpoints for YouTube trending data |

---

## 🚀 How to Run & Use Locally

Because TrendWave is built with standard web standards, you can run it locally in seconds.

### Option 1: Using VS Code Live Server
1. Open the project folder in **Visual Studio Code**.
2. Install the **Live Server** extension.
3. Right-click `index.html` and select **"Open with Live Server"**.

### Option 2: Using the Included PowerShell Server (Windows)
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-server.ps1
```
Then open your browser and navigate to `http://localhost:8080`.

### Option 3: Using Python HTTP Server
```bash
python -m http.server 8080
```

---

## 📸 Screenshots

<div align="center">

<img src="assets/screenshots/preview.png" alt="TrendWave Dashboard Preview" width="800" onerror="this.onerror=null; this.src='https://placehold.co/800x450/0d1117/ffffff?text=TrendWave+Dashboard+Preview';" />

*Figure 1: TrendWave Dashboard with live YouTube trends, glassmorphism cards, and regional selector.*

</div>

---

## 🔮 Future Improvements & Roadmap

- [x] **Regional Filters**: Added a country selection dropdown to view localized trending topics.
- [x] **Category Tabs**: Filter trending videos by categories (Music, Gaming, News, Tech, Entertainment).
- [ ] **In-App Search**: Real-time search bar to filter trending videos by title or creator.
- [ ] **Modal Video Player**: Preview and watch videos directly inside an embedded modal window.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/vishalgodikya-stack/trending-youtube-video123/issues) to submit improvements or bug reports.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👤 Author

- **GitHub**: [@vishalgodikya-stack](https://github.com/vishalgodikya-stack)
- **Project**: TrendWave

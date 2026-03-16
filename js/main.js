// ==========================================
// 1. CONFIG & API KEYS
// ==========================================
const OPENWEATHER_API_KEY = "https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=39.099724&lon=-94.578331&dt=1643803200&appid={API key}";

// ==========================================
// 2. DATA FETCHING 
// ==========================================
const fetchLiveWeather = async (query) => {
    if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === "https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=39.099724&lon=-94.578331&dt=1643803200&appid={API key}") return "☁️ Weather Offline";
   try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${query}&units=metric&appid=${OPENWEATHER_API_KEY}`;
        const res = await fetch(url);
        if (!res.ok) return "🌍 Weather N/A";
        
        const data = await res.json();
        const emojis = { Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️', Thunderstorm: '🌩️', Snow: '❄️', Mist: '🌫️', Haze: '🌫️' };
        return `${emojis[data.weather[0].main] || '🌡️'} ${data.weather[0].main}, ${Math.round(data.main.temp)}°C`;
    } catch (e) { return "🌍 Weather N/A"; }
};

const fetchDestinations = async (query) => {
    try {
        const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
        const res = await fetch(url);
        if (!res.ok) return [];
        
        const data = await res.json();
        const results = data.query?.search || [];
        const weatherInfo = await fetchLiveWeather(query);

        return results.map(item => ({ ...item, weather: weatherInfo }));
    } catch (e) { return []; }
};

const getImageUrl = (title) => `https://picsum.photos/seed/${encodeURIComponent(title)}/600/400`;

// ==========================================
// 3. STORAGE & FAVORITES
// ==========================================
const getFavorites = () => {
    try { return JSON.parse(localStorage.getItem("saved_destinations")) || []; } 
    catch (e) { return []; }
};
const isFavorite = (title) => getFavorites().some(fav => fav.title === title);

window.toggleFavorite = (title, weatherInfo, btnElement) => { 
    try {
        let favorites = getFavorites();
        if (isFavorite(title)) {
            favorites = favorites.filter(fav => fav.title !== title);
            btnElement.classList.remove("active");
        } else {
            const card = btnElement.closest('.travel-card');
            const snippet = card.querySelector('.text-muted').innerText;
            const imageUrl = card.querySelector('.card-img-top').src;
            favorites.push({ title, snippet, image: imageUrl, weather: weatherInfo });
            btnElement.classList.add("active");
        }
        localStorage.setItem("saved_destinations", JSON.stringify(favorites));
        renderCards(getFavorites(), document.getElementById("favoritesResults"));
    } catch (e) { console.error(e); }
};

// ==========================================
// 4. UI RENDERING 
// ==========================================
const generateCardHTML = (item) => {
    const safeTitle = item.title ? item.title.replace(/'/g, "\\'") : "Unknown";
    const activeClass = isFavorite(item.title) ? "active" : "";
    const imageUrl = item.image || getImageUrl(item.title);
    const weatherInfo = item.weather || "🌍 Data N/A"; 
    
    return `
        <div class="travel-card shadow-sm h-100 position-relative d-flex flex-column">
            <div class="weather-badge">${weatherInfo}</div>
            <button class="favorite-btn ${activeClass}" onclick="toggleFavorite('${safeTitle}', '${weatherInfo}', this)" title="Save to Favorites">
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1.2em" width="1.2em"><path d="M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z"></path></svg>
            </button>
            <img src="${imageUrl}" alt="${item.title}" class="card-img-top" loading="lazy">
            <div class="p-4 d-flex flex-column flex-grow-1">
                <h5 class="font-weight-bold mb-3">${item.title}</h5>
                <p class="small text-muted mb-4">${item.snippet}</p>
                <div class="mt-auto d-flex gap-2">
                    <button onclick="openMap('${safeTitle}')" class="btn btn-sm btn-info flex-fill mr-2" style="background: var(--accent); border: none; color: white;">📍 Map</button>
                    <button onclick="openWiki('${safeTitle}')" class="btn btn-sm btn-outline-primary flex-fill">Wiki</button>
                </div>
            </div>
        </div>`;
};

const renderCards = (dataArray, containerEl) => {
    if (!containerEl) return;
    containerEl.innerHTML = "";
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
        containerEl.innerHTML = `<div class="col-12 text-center mt-5"><p class="text-muted-custom">No destinations found.</p></div>`;
        return;
    }
    dataArray.forEach((item, index) => {
        const col = document.createElement("div");
        col.className = "col-md-4 mb-4 fade-in";
        col.style.animationDelay = `${index * 0.1}s`; 
        col.innerHTML = generateCardHTML(item);
        containerEl.appendChild(col);
    });
};

// ==========================================
// 5. MODALS (Maps & Wiki)
// ==========================================
window.openMap = (location) => {
    const modal = document.getElementById("mapModal");
    const mapContainer = document.getElementById("mapContainer");
    if(modal && mapContainer) {
        mapContainer.innerHTML = `<iframe src="https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=&z=13&ie=UTF8&iwloc=&output=embed" allowfullscreen></iframe>`;
        modal.classList.remove("d-none");
        setTimeout(() => modal.classList.add("show"), 10);
    }
};

window.openWiki = async (title) => {
    const modal = document.getElementById("wikiModal");
    const contentEl = document.getElementById("wikiContent");
    const titleEl = document.getElementById("wikiTitle");
    const loaderEl = document.getElementById("wikiLoader");
    const linkEl = document.getElementById("wikiExternalLink");

    if(!modal || !contentEl) return;

    titleEl.textContent = title;
    contentEl.innerHTML = "";
    linkEl.href = `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
    
    modal.classList.remove("d-none");
    setTimeout(() => modal.classList.add("show"), 10);
    loaderEl.classList.remove("d-none");

    try {
        const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(title)}&format=json&origin=*`;
        const res = await fetch(url);
        const data = await res.json();
        const pages = data.query.pages;
        const extract = pages[Object.keys(pages)[0]].extract;
        contentEl.innerHTML = extract ? `<p>${extract.replace(/\n/g, '<br><br>')}</p>` : `<p>No summary available.</p>`;
    } catch (e) {
        contentEl.innerHTML = `<p class="text-danger">Failed to load summary.</p>`;
    } finally {
        loaderEl.classList.add("d-none");
    }
};

// ==========================================
// 6. GLOBAL SEARCH LOGIC
// ==========================================
window.triggerSearch = async (query) => {
    const searchInput = document.getElementById("searchInput");
    const spinnerEl = document.getElementById("spinner");
    const searchResultsEl = document.getElementById("searchResults");
    
    if (searchInput) searchInput.value = query;
    if (spinnerEl) spinnerEl.classList.remove("d-none");
    if (searchResultsEl) searchResultsEl.innerHTML = "";

    document.getElementById('sectionExplore')?.scrollIntoView({ behavior: 'smooth' });

    try {
        const results = await fetchDestinations(query);
        renderCards(results, searchResultsEl);
    } catch (e) {
        if (searchResultsEl) searchResultsEl.innerHTML = `<p class="text-danger text-center">Failed to load.</p>`;
    } finally {
        if (spinnerEl) spinnerEl.classList.add("d-none");
    }
};

// ==========================================
// 7. INITIALIZATION & EVENT LISTENERS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    
    // Theme Toggle
    const themeToggleBtn = document.getElementById("themeToggle");
    if (themeToggleBtn) {
        if (localStorage.getItem("theme") === "dark") {
            document.documentElement.setAttribute("data-theme", "dark");
            themeToggleBtn.textContent = "☀️";
        }
        themeToggleBtn.addEventListener("click", () => {
            if (document.documentElement.getAttribute("data-theme") === "dark") {
                document.documentElement.removeAttribute("data-theme");
                localStorage.setItem("theme", "light");
                themeToggleBtn.textContent = "🌙";
            } else {
                document.documentElement.setAttribute("data-theme", "dark");
                localStorage.setItem("theme", "dark");
                themeToggleBtn.textContent = "☀️";
            }
        });
    }

    // Live Search Input
    let searchTimeout = null;
    const searchInputEl = document.getElementById("searchInput");
    const searchResultsEl = document.getElementById("searchResults");
    const spinnerEl = document.getElementById("spinner");

    if (searchInputEl) {
        searchInputEl.addEventListener("input", (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            if (!query) {
                if (searchResultsEl) searchResultsEl.innerHTML = "";
                if (spinnerEl) spinnerEl.classList.add("d-none");
                return;
            }
            if (spinnerEl) spinnerEl.classList.remove("d-none");
            if (searchResultsEl) searchResultsEl.innerHTML = "";

            searchTimeout = setTimeout(async () => {
                const results = await fetchDestinations(query);
                renderCards(results, searchResultsEl);
                if (spinnerEl) spinnerEl.classList.add("d-none");
            }, 500); 
        });
        searchInputEl.addEventListener("keydown", (e) => { if (e.key === "Enter") e.preventDefault(); });
    }

    // Load Trending & Favorites
    const trendingData = [
        { title: "Tokyo", snippet: "Japan's busy capital, mixes the ultramodern and the traditional.", weather: "🌧️ Rain, 18°C" },
        { title: "Paris", snippet: "France's capital, a global center for art, fashion, and culture.", weather: "⛅ Partly Cloudy, 22°C" },
        { title: "Bali", snippet: "An Indonesian island known for its forested volcanic mountains.", weather: "☀️ Sunny, 30°C" },
        { title: "New York City", snippet: "The largest city in the USA, known for its skyline and culture.", weather: "🌧️ Rain, 16°C" },
        { title: "Swiss Alps", snippet: "A mountain range offering skiing, hiking, and stunning views.", weather: "❄️ Snow, -5°C" },
         { title: "London", snippet: "The capital of England, known for its history and culture.", weather: "⛅ Partly Cloudy, 19°C" },
        { title: "Maldives", snippet: "Tropical nation in the Indian Ocean known for its beaches.", weather: "☀️ Sunny, 32°C" },
        { title: "Hawaii", snippet: "A state in the United States known for its islands and volcanoes.", weather: "☀️ Sunny, 28°C" },
        { title: "Indonesia", snippet: "An Indonesian island known for its forested volcanic mountains.", weather: "☀️ Sunny, 30°C" }
    ];
    renderCards(trendingData, document.getElementById("trendingResults"));
    renderCards(getFavorites(), document.getElementById("favoritesResults"));

    // Typewriter Effect
    const typewriterEl = document.getElementById("typewriter-text");
    if (typewriterEl) {
        const textToType = "Let's Explore the World";
        let charIndex = 0;
        const typeWriter = () => {
            if (charIndex < textToType.length) {
                typewriterEl.textContent += textToType.charAt(charIndex);
                charIndex++;
                setTimeout(typeWriter, Math.floor(Math.random() * 70) + 60);
            }
        };
        setTimeout(typeWriter, 500);
    }

    // Particles.js
    if (typeof particlesJS !== 'undefined' && document.getElementById('particles-js')) {
        particlesJS("particles-js", {
            "particles": {
                "number": { "value": 80 },
                "color": { "value": "#888888" },
                "shape": { "type": "circle" },
                "opacity": { "value": 0.5 },
                "size": { "value": 3, "random": true },
                "line_linked": { "enable": true, "distance": 150, "color": "#888888", "opacity": 0.4, "width": 1 },
                "move": { "enable": true, "speed": 2 }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" }, "resize": true },
                "modes": { "grab": { "distance": 140, "line_linked": { "opacity": 1 } }, "push": { "particles_nb": 4 } }
            },
            "retina_detect": true
        });
    }

    // Gallery & Lightbox
    const galleryGrid = document.getElementById("galleryGrid");
    const lightboxModal = document.getElementById("lightboxModal");
    const lightboxImg = document.getElementById("lightboxImg");
    if (galleryGrid) {
        const keywords = ["paris", "tokyo", "bali", "newyork", "swiss", "maldives"];
        keywords.forEach(keyword => {
            const imgEl = document.createElement("img");
            imgEl.src = `https://picsum.photos/seed/${keyword}/600/400`;
            imgEl.className = "gallery-img shadow-sm";
            imgEl.addEventListener("click", () => {
                lightboxImg.src = `https://picsum.photos/seed/${keyword}/1200/800`;
                lightboxModal.classList.remove("d-none");
                setTimeout(() => lightboxModal.classList.add("show"), 10);
            });
            galleryGrid.appendChild(imgEl);
        });
    }

    // Close Modals
    const closeModals = () => {
        document.querySelectorAll('.modal-overlay.show').forEach(m => {
            m.classList.remove("show");
            setTimeout(() => m.classList.add("d-none"), 300);
        });
    };
    document.getElementById("closeMapBtn")?.addEventListener("click", closeModals);
    document.getElementById("closeWikiBtn")?.addEventListener("click", closeModals);
    document.getElementById("closeLightboxBtn")?.addEventListener("click", closeModals);

    // Contact Form
    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
        contactForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector("button");
            const formSuccess = document.getElementById("formSuccess");
            btn.textContent = "Sending...";
            btn.disabled = true;
            setTimeout(() => {
                formSuccess.classList.remove("d-none");
                contactForm.reset();
                btn.textContent = "Send Message";
                btn.disabled = false;
                setTimeout(() => formSuccess.classList.add("d-none"), 4000);
            }, 1500);
        });
    }

    // Scroll to Top
    const scrollTopBtn = document.getElementById("scrollTopBtn");
    if (scrollTopBtn) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 300) scrollTopBtn.classList.add("show");
            else scrollTopBtn.classList.remove("show");
        });
        scrollTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    }
});
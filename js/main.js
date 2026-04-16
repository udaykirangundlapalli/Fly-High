
const OPENWEATHER_API_KEY = "";

const weatherIcons = {
    Clear: "Sunny",
    Clouds: "Cloudy",
    Rain: "Rain",
    Drizzle: "Drizzle",
    Thunderstorm: "Storm",
    Snow: "Snow",
    Mist: "Mist",
    Haze: "Haze"
};

function getImageUrl(title) {
    return `https://picsum.photos/seed/${encodeURIComponent(title)}/900/700`;
}

const curatedDestinations = [
    {
        title: "Kyoto",
        region: "Japan",
        vibe: "Cultural calm",
        bestFor: "Temples, gardens, and quiet streets",
        tags: ["Culture", "Historic", "Slow travel"],
        snippet: "A refined city of temple walks, seasonal colors, tea houses, and calm neighborhoods that reward slow travel.",
        image: getImageUrl("Kyoto temple travel"),
        weather: "Clear skies, 21 deg C"
    },
    {
        title: "Amalfi Coast",
        region: "Italy",
        vibe: "Scenic romance",
        bestFor: "Cliffside drives and coastal stays",
        tags: ["Coast", "Romance", "Luxury"],
        snippet: "Colorful villages, sea-view terraces, and dramatic roads make this one of the easiest destinations to fall for.",
        image: getImageUrl("Amalfi coast scenic"),
        weather: "Bright, 24 deg C"
    },
    {
        title: "Bali",
        region: "Indonesia",
        vibe: "Tropical reset",
        bestFor: "Beach clubs, surf, and villas",
        tags: ["Beach", "Wellness", "Island"],
        snippet: "A flexible island escape with beach energy, rice terrace views, wellness stays, and easy long-weekend planning.",
        image: getImageUrl("Bali tropical"),
        weather: "Sunny, 30 deg C"
    },
    {
        title: "Seoul",
        region: "South Korea",
        vibe: "Creative city energy",
        bestFor: "Design, food, and nightlife",
        tags: ["City", "Food", "Nightlife"],
        snippet: "Fast, stylish, and packed with neighborhoods that blend food culture, retail, late nights, and visual contrast.",
        image: getImageUrl("Seoul nightlife"),
        weather: "Cloudy, 19 deg C"
    },
    {
        title: "Reykjavik",
        region: "Iceland",
        vibe: "Wild horizons",
        bestFor: "Road trips and geothermal stops",
        tags: ["Adventure", "Nature", "Road trip"],
        snippet: "A cinematic launch point for waterfalls, black sand beaches, geothermal pools, and dramatic weather shifts.",
        image: getImageUrl("Reykjavik road trip"),
        weather: "Cool breeze, 8 deg C"
    },
    {
        title: "Marrakech",
        region: "Morocco",
        vibe: "Warm texture",
        bestFor: "Courtyards, markets, and riads",
        tags: ["Culture", "Markets", "Architecture"],
        snippet: "A vivid mix of color, craftsmanship, fragrant markets, and intimate courtyard hotels that feels instantly transportive.",
        image: getImageUrl("Marrakech riad"),
        weather: "Warm, 29 deg C"
    },
    {
        title: "Paris",
        region: "France",
        vibe: "Romantic city classic",
        bestFor: "Museums, cafes, and river walks",
        tags: ["City", "Romance", "Art"],
        snippet: "A timeless favorite for first-time Europe trips thanks to its museums, cafe rhythm, and polished neighborhoods.",
        image: getImageUrl("Paris river"),
        weather: "Mild, 22 deg C"
    },
    {
        title: "Swiss Alps",
        region: "Switzerland",
        vibe: "Alpine calm",
        bestFor: "Scenic trains and mountain air",
        tags: ["Mountains", "Scenery", "Adventure"],
        snippet: "Crisp air, scenic rail journeys, and dramatic mountain villages make it ideal for high-contrast landscapes.",
        image: getImageUrl("Swiss Alps"),
        weather: "Fresh, 6 deg C"
    },
    {
        title: "Santorini",
        region: "Greece",
        vibe: "Sunset escape",
        bestFor: "Sea views and boutique stays",
        tags: ["Island", "Romance", "Luxury"],
        snippet: "Whitewashed villages, open sea views, and memorable sunsets give this island a strong sense of occasion.",
        image: getImageUrl("Santorini sunset"),
        weather: "Sunny, 26 deg C"
    }
];

function normalizeText(value) {
    return (value || "").toLowerCase().trim();
}

function cleanSnippet(snippet) {
    return (snippet || "")
        .replace(/<[^>]+>/g, "")
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim();
}

function buildCardMetadata(item) {
    const tags = Array.isArray(item.tags) ? item.tags.slice(0, 3) : [];
    return {
        region: item.region || "Destination guide",
        vibe: item.vibe || "Travel pick",
        bestFor: item.bestFor || "Exploration and planning",
        tags
    };
}

function scoreCuratedDestination(item, query) {
    const search = normalizeText(query);
    const title = normalizeText(item.title);
    const haystack = [item.title, item.region, item.vibe, item.bestFor, ...(item.tags || []), item.snippet].join(" ").toLowerCase();

    let score = 0;
    if (title === search) score += 12;
    if (title.includes(search)) score += 8;
    if (haystack.includes(search)) score += 5;

    const tokens = search.split(/\s+/).filter(Boolean);
    tokens.forEach((token) => {
        if (title.includes(token)) score += 3;
        if (haystack.includes(token)) score += 1;
    });
    return score;
}

function findCuratedMatches(query) {
    return curatedDestinations
        .map((item) => ({ ...item, score: scoreCuratedDestination(item, query) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map(({ score, ...item }) => item);
}

const fetchLiveWeather = async (query) => {
    if (!OPENWEATHER_API_KEY) return "Weather offline";

    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&units=metric&appid=${OPENWEATHER_API_KEY}`;
        const res = await fetch(url);
        if (!res.ok) return "Weather unavailable";

        const data = await res.json();
        const label = weatherIcons[data.weather?.[0]?.main] || "Conditions";
        return `${label}, ${Math.round(data.main.temp)}°C`;
    } catch (error) {
        return "Weather unavailable";
    }
};

const fetchDestinations = async (query) => {
    const curatedMatches = findCuratedMatches(query);
    try {
        const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
        const res = await fetch(url);
        if (!res.ok) return curatedMatches;

        const data = await res.json();
        const results = (data.query?.search || []).slice(0, 6);
        const weatherInfo = await fetchLiveWeather(query);
        const wikiResults = results
            .filter((item) => !curatedMatches.some((curated) => curated.title.toLowerCase() === item.title.toLowerCase()))
            .map((item) => ({
                title: item.title,
                snippet: cleanSnippet(item.snippet) || "A destination worth exploring in more detail.",
                weather: weatherInfo,
                image: getImageUrl(item.title),
                region: "Wikipedia travel result",
                vibe: "Discovery pick",
                bestFor: "Flexible inspiration and quick reading",
                tags: ["Guide", "Explore", "Discover"]
            }));

        return [...curatedMatches, ...wikiResults].slice(0, 6);
    } catch (error) {
        return curatedMatches;
    }
};

const getFavorites = () => {
    try {
        return JSON.parse(localStorage.getItem("saved_destinations")) || [];
    } catch (error) {
        return [];
    }
};

const isFavorite = (title) => getFavorites().some((fav) => fav.title === title);

const setResultsMeta = (message = "") => {
    const metaEl = document.getElementById("resultsMeta");
    if (!metaEl) return;

    if (!message) {
        metaEl.textContent = "";
        metaEl.classList.add("d-none");
        return;
    }

    metaEl.textContent = message;
    metaEl.classList.remove("d-none");
};

const closeMobileNav = () => {
    const nav = document.getElementById("siteNav");
    const toggle = document.getElementById("navToggle");
    if (!nav || !toggle) return;

    nav.classList.remove("is-open");
    toggle.classList.remove("is-active");
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
};

window.toggleFavorite = (title, weatherInfo, btnElement) => {
    try {
        let favorites = getFavorites();

        if (isFavorite(title)) {
            favorites = favorites.filter((fav) => fav.title !== title);
            btnElement.classList.remove("active");
            btnElement.setAttribute("aria-pressed", "false");
        } else {
            const card = btnElement.closest(".travel-card");
            const snippet = card.querySelector(".text-muted").innerText;
            const imageUrl = card.querySelector(".card-img-top").src;
            const region = card.querySelector(".card-region")?.innerText || "Destination guide";
            const bestFor = card.querySelector(".card-highlight span")?.innerText || "Exploration and planning";
            const pills = Array.from(card.querySelectorAll(".card-meta-pill")).map((el) => el.innerText);
            const [vibe = "Travel pick", ...tags] = pills;
            favorites.push({ title, snippet, image: imageUrl, weather: weatherInfo, region, vibe, bestFor, tags });
            btnElement.classList.add("active");
            btnElement.setAttribute("aria-pressed", "true");
        }

        localStorage.setItem("saved_destinations", JSON.stringify(favorites));
        renderCards(getFavorites(), document.getElementById("favoritesResults"));
    } catch (error) {
        console.error(error);
    }
};

const generateCardHTML = (item) => {
    const safeTitle = item.title ? item.title.replace(/'/g, "\\'") : "Unknown";
    const activeClass = isFavorite(item.title) ? "active" : "";
    const imageUrl = item.image || getImageUrl(item.title);
    const weatherInfo = item.weather || "Travel data available";
    const { region, vibe, bestFor, tags } = buildCardMetadata(item);
    const tagsMarkup = tags.map((tag) => `<span class="card-meta-pill">${tag}</span>`).join("");

    return `
        <div class="travel-card h-100 position-relative d-flex flex-column">
            <div class="card-media">
                <div class="weather-badge">${weatherInfo}</div>
                <button class="favorite-btn ${activeClass}" onclick="toggleFavorite('${safeTitle}', '${weatherInfo}', this)" title="Save destination" aria-label="Save ${safeTitle}" aria-pressed="${activeClass ? "true" : "false"}">
                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1.1em" width="1.1em"><path d="M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z"></path></svg>
                </button>
                <img src="${imageUrl}" alt="${item.title}" class="card-img-top" loading="lazy">
            </div>
            <div class="card-body-custom flex-grow-1">
                <span class="card-region">${region}</span>
                <h5>${item.title}</h5>
                <div class="card-meta">
                    <span class="card-meta-pill">${vibe}</span>
                    ${tagsMarkup}
                </div>
                <p class="small text-muted mb-4">${item.snippet}</p>
                <div class="card-highlight">
                    <strong>Best For</strong>
                    <span>${bestFor}</span>
                </div>
                <div class="card-actions">
                    <button onclick="openMap('${safeTitle}')" class="card-action-btn primary">Map</button>
                    <button onclick="openWiki('${safeTitle}')" class="card-action-btn">Guide</button>
                </div>
            </div>
        </div>`;
};

const renderCards = (dataArray, containerEl) => {
    if (!containerEl) return;

    containerEl.innerHTML = "";

    if (!Array.isArray(dataArray) || dataArray.length === 0) {
        const emptyMessage = containerEl.id === "favoritesResults"
            ? "No saved destinations yet. Tap the heart on any card to build your shortlist."
            : "No destinations found yet. Try a broader search or a different travel mood.";
        containerEl.innerHTML = `<div class="col-12 text-center mt-5"><p class="text-muted-custom">${emptyMessage}</p></div>`;
        return;
    }

    dataArray.forEach((item, index) => {
        const col = document.createElement("div");
        col.className = "col-md-6 col-lg-4 mb-4 fade-in";
        col.style.animationDelay = `${index * 0.08}s`;
        col.innerHTML = generateCardHTML(item);
        containerEl.appendChild(col);
    });
};
window.openMap = (location) => {
    const modal = document.getElementById("mapModal");
    const mapContainer = document.getElementById("mapContainer");
    if (!modal || !mapContainer) return;

    mapContainer.innerHTML = `<iframe src="https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=&z=13&ie=UTF8&iwloc=&output=embed" allowfullscreen loading="lazy"></iframe>`;
    modal.classList.remove("d-none");
    setTimeout(() => modal.classList.add("show"), 10);
};

window.openWiki = async (title) => {
    const modal = document.getElementById("wikiModal");
    const contentEl = document.getElementById("wikiContent");
    const titleEl = document.getElementById("wikiTitle");
    const loaderEl = document.getElementById("wikiLoader");
    const linkEl = document.getElementById("wikiExternalLink");

    if (!modal || !contentEl || !titleEl || !loaderEl || !linkEl) return;

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
        contentEl.innerHTML = extract ? `<p>${extract.replace(/\n/g, "<br><br>")}</p>` : "<p>No summary available for this destination yet.</p>";
    } catch (error) {
        contentEl.innerHTML = '<p class="text-danger">Failed to load summary.</p>';
    } finally {
        loaderEl.classList.add("d-none");
    }
};

window.triggerSearch = async (query) => {
    const searchInput = document.getElementById("searchInput");
    const spinnerEl = document.getElementById("spinner");
    const searchResultsEl = document.getElementById("searchResults");

    if (searchInput) searchInput.value = query;
    if (spinnerEl) spinnerEl.classList.remove("d-none");
    if (searchResultsEl) searchResultsEl.innerHTML = "";
    setResultsMeta(`Searching for "${query}"...`);

    document.getElementById("sectionExplore")?.scrollIntoView({ behavior: "smooth" });

    try {
        const results = await fetchDestinations(query);
        renderCards(results, searchResultsEl);
        setResultsMeta(results.length ? `${results.length} destination ideas for "${query}".` : `No strong matches for "${query}" yet.`);
    } catch (error) {
        if (searchResultsEl) searchResultsEl.innerHTML = '<p class="text-danger text-center">Failed to load destinations.</p>';
        setResultsMeta("Something went wrong while loading destinations.");
    } finally {
        if (spinnerEl) spinnerEl.classList.add("d-none");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const themeToggleBtn = document.getElementById("themeToggle");
    const navToggleBtn = document.getElementById("navToggle");
    const navLinks = document.getElementById("siteNav");

    if (themeToggleBtn) {
        if (localStorage.getItem("theme") === "dark") {
            document.documentElement.setAttribute("data-theme", "dark");
            themeToggleBtn.textContent = "Sun";
        } else {
            themeToggleBtn.textContent = "Moon";
        }

        themeToggleBtn.addEventListener("click", () => {
            if (document.documentElement.getAttribute("data-theme") === "dark") {
                document.documentElement.removeAttribute("data-theme");
                localStorage.setItem("theme", "light");
                themeToggleBtn.textContent = "Moon";
            } else {
                document.documentElement.setAttribute("data-theme", "dark");
                localStorage.setItem("theme", "dark");
                themeToggleBtn.textContent = "Sun";
            }
        });
    }

    if (navToggleBtn && navLinks) {
        navToggleBtn.addEventListener("click", () => {
            const isOpen = navLinks.classList.toggle("is-open");
            navToggleBtn.classList.toggle("is-active", isOpen);
            navToggleBtn.setAttribute("aria-expanded", String(isOpen));
            document.body.classList.toggle("nav-open", isOpen);
        });

        navLinks.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", closeMobileNav);
        });
    }

    let searchTimeout = null;
    const searchInputEl = document.getElementById("searchInput");
    const searchResultsEl = document.getElementById("searchResults");
    const spinnerEl = document.getElementById("spinner");

    if (searchInputEl) {
        searchInputEl.addEventListener("input", (event) => {
            clearTimeout(searchTimeout);
            const query = event.target.value.trim();

            if (!query) {
                if (searchResultsEl) searchResultsEl.innerHTML = "";
                if (spinnerEl) spinnerEl.classList.add("d-none");
                setResultsMeta("");
                return;
            }

            if (spinnerEl) spinnerEl.classList.remove("d-none");
            if (searchResultsEl) searchResultsEl.innerHTML = "";
            setResultsMeta(`Searching for "${query}"...`);

            searchTimeout = setTimeout(async () => {
                try {
                    const results = await fetchDestinations(query);
                    renderCards(results, searchResultsEl);
                    setResultsMeta(results.length ? `${results.length} destination ideas for "${query}".` : `No strong matches for "${query}" yet.`);
                } catch (error) {
                    if (searchResultsEl) searchResultsEl.innerHTML = '<p class="text-danger text-center">Failed to load destinations.</p>';
                    setResultsMeta("Something went wrong while loading destinations.");
                } finally {
                    if (spinnerEl) spinnerEl.classList.add("d-none");
                }
            }, 400);
        });

        searchInputEl.addEventListener("keydown", (event) => {
            if (event.key === "Enter") event.preventDefault();
        });
    }
    const trendingData = [
        curatedDestinations[0],
        curatedDestinations[5],
        curatedDestinations[2],
        curatedDestinations[4],
        curatedDestinations[1],
        curatedDestinations[3]
    ];

    renderCards(trendingData, document.getElementById("trendingResults"));
    renderCards(getFavorites(), document.getElementById("favoritesResults"));

    const typewriterEl = document.getElementById("typewriter-text");
    if (typewriterEl) {
        const textToType = "Travel with better taste";
        let charIndex = 0;

        const typeWriter = () => {
            if (charIndex < textToType.length) {
                typewriterEl.textContent += textToType.charAt(charIndex);
                charIndex += 1;
                setTimeout(typeWriter, Math.floor(Math.random() * 55) + 45);
            }
        };

        setTimeout(typeWriter, 350);
    }

    if (typeof particlesJS !== "undefined" && document.getElementById("particles-js")) {
        particlesJS("particles-js", {
            particles: {
                number: { value: 58 },
                color: { value: ["#d96f32", "#d0b59c", "#9ac6bb"] },
                shape: { type: "circle" },
                opacity: { value: 0.4, random: true },
                size: { value: 4, random: true },
                line_linked: { enable: true, distance: 140, color: "#c4a489", opacity: 0.18, width: 1 },
                move: { enable: true, speed: 1.8 }
            },
            interactivity: {
                detect_on: "canvas",
                events: {
                    onhover: { enable: true, mode: "grab" },
                    onclick: { enable: true, mode: "push" },
                    resize: true
                },
                modes: {
                    grab: { distance: 140, line_linked: { opacity: 0.5 } },
                    push: { particles_nb: 3 }
                }
            },
            retina_detect: true
        });
    }

    const galleryGrid = document.getElementById("galleryGrid");
    const lightboxModal = document.getElementById("lightboxModal");
    const lightboxImg = document.getElementById("lightboxImg");

    if (galleryGrid && lightboxModal && lightboxImg) {
        const galleryItems = [
            { key: "amalfi", title: "Coastal Light", subtitle: "Amalfi mornings", className: "large" },
            { key: "kyoto", title: "Quiet Rituals", subtitle: "Kyoto alleys", className: "tall" },
            { key: "bali", title: "Tropical Reset", subtitle: "Bali escapes", className: "wide" },
            { key: "seoul", title: "City Energy", subtitle: "Seoul after dark", className: "wide" },
            { key: "reykjavik", title: "Wild Horizons", subtitle: "Iceland road views", className: "large" },
            { key: "marrakech", title: "Warm Textures", subtitle: "Marrakech courtyards", className: "wide" },
            { key: "santorini", title: "Blue Horizon", subtitle: "Santorini coastlines", className: "large" },
            { key: "swissalps", title: "Alpine Calm", subtitle: "Swiss mountain air", className: "tall" },
            { key: "tokyo", title: "Night Motion", subtitle: "Tokyo city glow", className: "wide" }
        ];

        galleryItems.forEach((item) => {
            const tile = document.createElement("article");
            tile.className = `gallery-tile ${item.className}`;
            tile.innerHTML = `
                <img src="https://picsum.photos/seed/${item.key}/900/900" alt="${item.title}" class="gallery-img" loading="lazy">
                <div class="gallery-overlay">
                    <strong>${item.title}</strong>
                    <span>${item.subtitle}</span>
                </div>`;
            tile.addEventListener("click", () => {
                lightboxImg.src = `https://picsum.photos/seed/${item.key}/1600/1100`;
                lightboxModal.classList.remove("d-none");
                setTimeout(() => lightboxModal.classList.add("show"), 10);
            });
            galleryGrid.appendChild(tile);
        });
    }
    const closeModals = () => {
        document.querySelectorAll(".modal-overlay.show").forEach((modal) => {
            modal.classList.remove("show");
            setTimeout(() => modal.classList.add("d-none"), 250);
        });
    };

    document.getElementById("closeMapBtn")?.addEventListener("click", closeModals);
    document.getElementById("closeWikiBtn")?.addEventListener("click", closeModals);
    document.getElementById("closeLightboxBtn")?.addEventListener("click", closeModals);
    document.querySelectorAll(".modal-overlay").forEach((modal) => {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) closeModals();
        });
    });

    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
        const btn = contactForm.querySelector("button");
        const formSuccess = document.getElementById("formSuccess");
        const url = new URL(window.location.href);

        if (url.searchParams.get("sent") === "1" && formSuccess) {
            formSuccess.classList.remove("d-none");
            setTimeout(() => formSuccess.classList.add("d-none"), 4000);
            url.searchParams.delete("sent");
            window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
        }

        contactForm.addEventListener("submit", () => {
            if (!btn) return;
            btn.textContent = "Sending...";
            btn.disabled = true;
        });
    }

    const scrollTopBtn = document.getElementById("scrollTopBtn");
    if (scrollTopBtn) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 300) scrollTopBtn.classList.add("show");
            else scrollTopBtn.classList.remove("show");
        });

        scrollTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeModals();
            closeMobileNav();
        }
    });
});

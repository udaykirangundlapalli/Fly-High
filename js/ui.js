const searchResultsEl = document.getElementById("searchResults");
const favoritesResultsEl = document.getElementById("favoritesResults");

// 1. Renders the live search results
const renderCards = (results) => {
    if (!searchResultsEl) return;
    searchResultsEl.innerHTML = "";

    // Safety check: Make sure results actually exist
    if (!Array.isArray(results) || results.length === 0) {
        searchResultsEl.innerHTML = `
            <div class="col-12 text-center mt-5 fade-in">
                <h4 style="color: #94a3b8;">No destinations found.</h4>
                <p style="color: #64748b;">Try searching for a different city, country, or landmark.</p>
            </div>`;
        return;
    }

    results.forEach((item, index) => {
        const col = document.createElement("div");
        col.className = "col-md-4 mb-4 fade-in";
        col.style.animationDelay = `${index * 0.1}s`; 
        
        // SAFETY CHECK: Ensure the storage function exists before trying to use it
        let activeClass = "";
        if (typeof isFavorite === "function") {
            activeClass = isFavorite(item.title) ? "active" : "";
        }
        
        // Prevents crashes if a title has weird quotation marks in it
        const safeTitle = item.title ? item.title.replace(/'/g, "\\'") : "Unknown";

        col.innerHTML = `
            <div class="travel-card shadow-sm h-100 position-relative">
                <button class="favorite-btn ${activeClass}" onclick="toggleFavorite('${safeTitle}', this)" title="Save to Favorites">
                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1.2em" width="1.2em" xmlns="http://www.w3.org/2000/svg"><path d="M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z"></path></svg>
                </button>
                <div>
                    <h5 class="font-weight-bold mb-3 pr-4">${item.title}</h5>
                    <p class="small text-muted">${item.snippet}...</p>
                </div>
                <div class="mt-auto pt-3">
                    <a href="https://en.wikipedia.org/wiki/${item.title}" target="_blank" class="btn btn-sm btn-outline-primary w-100">Learn More</a>
                </div>
            </div>`;
        searchResultsEl.appendChild(col);
    });
};

// 2. Renders the saved favorites section
const renderFavorites = () => {
    if (!favoritesResultsEl) return;
    favoritesResultsEl.innerHTML = "";
    
    // Safety check for getFavorites
    const favorites = (typeof getFavorites === "function") ? getFavorites() : [];

    if (!Array.isArray(favorites) || favorites.length === 0) {
        favoritesResultsEl.innerHTML = `
            <div class="col-12 text-center mt-5 fade-in">
                <h4 style="color: #94a3b8;">No favorites yet.</h4>
                <p style="color: #64748b;">Click the heart icon on any destination to save it here.</p>
            </div>`;
        return;
    }

    favorites.forEach((item, index) => {
        const col = document.createElement("div");
        col.className = "col-md-4 mb-4 fade-in";
        col.style.animationDelay = `${index * 0.1}s`; 
        const safeTitle = item.title ? item.title.replace(/'/g, "\\'") : "Unknown";

        col.innerHTML = `
            <div class="travel-card shadow-sm h-100 position-relative">
                <button class="favorite-btn active" onclick="toggleFavorite('${safeTitle}', this)" title="Remove from Favorites">
                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1.2em" width="1.2em" xmlns="http://www.w3.org/2000/svg"><path d="M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z"></path></svg>
                </button>
                <div>
                    <h5 class="font-weight-bold mb-3 pr-4">${item.title}</h5>
                    <p class="small text-muted">${item.snippet}</p>
                </div>
                <div class="mt-auto pt-3">
                    <a href="https://en.wikipedia.org/wiki/${item.title}" target="_blank" class="btn btn-sm btn-outline-primary w-100">Learn More</a>
                </div>
            </div>`;
        favoritesResultsEl.appendChild(col);
    });
};

document.addEventListener("DOMContentLoaded", renderFavorites);
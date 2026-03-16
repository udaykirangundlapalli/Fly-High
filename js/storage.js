// Fetches the saved objects
const getFavorites = () => JSON.parse(localStorage.getItem("saved_destinations")) || [];

// Checks if the title exists in our saved objects array
const isFavorite = (title) => getFavorites().some(fav => fav.title === title);

// Toggles the favorite status and saves the data
const toggleFavorite = (title, btnElement) => {
    let favorites = getFavorites();
    
    if (isFavorite(title)) {
        favorites = favorites.filter(fav => fav.title !== title);
        btnElement.classList.remove("active");
    } else {
        const card = btnElement.closest('.travel-card');
        const snippet = card.querySelector('.text-muted').innerHTML;
        favorites.push({ title, snippet });
        btnElement.classList.add("active");
    }
    
    localStorage.setItem("saved_destinations", JSON.stringify(favorites));
    
    if (typeof renderFavorites === "function") {
        renderFavorites();
    }
};
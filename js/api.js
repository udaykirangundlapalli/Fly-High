const fetchDestinations = async (query) => {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query}&format=json&origin=*`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        return data.query.search;
    } catch (e) { return []; }
};
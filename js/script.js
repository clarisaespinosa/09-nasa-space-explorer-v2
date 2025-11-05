// --- CONSTANTS AND GLOBAL DATA ---
// NOTE: REPLACE THIS URL with the actual JSON file link provided by your professor.
const DATA_URL = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json'; 

const galleryContainer = document.getElementById('gallery-container');
const loadingIndicator = document.getElementById('loading-indicator');
const errorMessage = document.getElementById('error-message');
const detailsModal = document.getElementById('details-modal');
const modalTitle = document.getElementById('modal-title');
const modalDate = document.getElementById('modal-date');
const modalMedia = document.getElementById('modal-media');
const modalExplanation = document.getElementById('modal-explanation');
const startDateInput = document.getElementById('start-date');
const fetchButton = document.getElementById('fetch-button');
const factTextElement = document.getElementById('fact-text');
const didYouKnowSection = document.getElementById('did-you-know');

let fullApodData = [];

// List of "Did You Know?" facts (in English)
const DID_YOU_KNOW_FACTS = [
    "The universe is vast and contains billions of galaxies, each with billions of stars.",
    "Sunlight takes approximately 8 minutes and 20 seconds to reach Earth.",
    "Jupiter is the largest planet in our solar system and hosts a giant storm that has lasted for centuries.",
    "The Milky Way, our galaxy, is a barred spiral galaxy and has a supermassive black hole at its center.",
    "There are more stars in the universe than grains of sand on all the beaches on Earth."
];

// --- UTILITY FUNCTIONS ---
function formatDate(dateString) {
    if (!dateString) return 'Unknown Date';
    try {
        const [year, month, day] = dateString.split('-');
        return `${month}/${day}/${year}`; 
    } catch (e) {
        return dateString; 
    }
}

// Expose modal functions globally so HTML elements can call them
window.openModal = openModal;
window.closeModal = closeModal;


// --- CORE DATA FETCHING ---
async function fetchInitialData() {
    didYouKnowSection.classList.add('hidden'); 
    loadingIndicator.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    galleryContainer.innerHTML = ''; 

    // Display a random fact
    const randomFact = DID_YOU_KNOW_FACTS[Math.floor(Math.random() * DID_YOU_KNOW_FACTS.length)];
    factTextElement.textContent = randomFact;
    didYouKnowSection.classList.remove('hidden');

    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        fullApodData = await response.json();
        
        // Sort by descending date to find the newest entry
        fullApodData.sort((a, b) => new Date(b.date) - new Date(a.date));
        const maxDate = fullApodData[0]?.date || new Date().toISOString().split('T')[0];
        startDateInput.setAttribute('max', maxDate);
        startDateInput.value = maxDate; 

        // Load initial gallery on the newest date
        filterAndRenderGallery(maxDate); 

    } catch (error) {
        console.error("Error fetching initial JSON data:", error);
        loadingIndicator.classList.add('hidden');
        errorMessage.classList.remove('hidden');
        errorMessage.querySelector('p').textContent = 'An error occurred while loading the JSON file. Please check the data source URL.';
    }
}

// --- GALLERY RENDERING AND FILTERING (Ensures 9 images are shown) ---
function filterAndRenderGallery(selectedDate) {
    
    loadingIndicator.classList.remove('hidden');
    galleryContainer.innerHTML = '';
    errorMessage.classList.add('hidden');

    // Filter elements up to and including the selected date
    const filteredData = fullApodData.filter(item => {
        return item.date <= selectedDate; 
    });

    // Sort newest first
    filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Take the 9 most recent entries
    const finalData = filteredData.slice(0, 9);

    if (finalData.length === 0) {
        loadingIndicator.classList.add('hidden');
        errorMessage.classList.remove('hidden');
        errorMessage.querySelector('p').textContent = 'No APOD entries were found for the selected date. Try an earlier date.';
        return;
    }

    const cardsHtml = finalData.map(item => createCard(item)).join('');
    galleryContainer.innerHTML = cardsHtml;
    
    // Hide loading indicator
    loadingIndicator.classList.add('hidden');
}

// Function to create an individual gallery card
function createCard(item) {
    let mediaUrl = '';
    let mediaIcon = '';

    if (item.media_type === 'video' && item.thumbnail_url) {
        mediaUrl = item.thumbnail_url;
        mediaIcon = `<div class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <svg class="w-16 h-16 text-white transition duration-300 hover:text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                        </svg>
                     </div>`;
    } else if (item.media_type === 'image') {
        mediaUrl = item.url;
    } else {
        mediaUrl = 'https://placehold.co/600x400/161b22/8b5cf6?text=MEDIA+NOT+AVAILABLE';
        mediaIcon = `<div class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center text-xl font-bold text-gray-400">No Content</div>`;
    }

    const itemJson = encodeURIComponent(JSON.stringify(item));

    return `
        <div class="apod-card rounded-xl overflow-hidden shadow-lg" onclick="openModal('${itemJson}')">
            <div class="relative pt-[66.666%] bg-gray-700"> 
                <img src="${mediaUrl}" 
                     onerror="this.onerror=null;this.src='${item.url || 'https://placehold.co/600x400/161b22/8b5cf6?text=LOAD+ERROR'}';"
                     alt="${item.title}" 
                     loading="lazy"
                     class="absolute top-0 left-0 w-full h-full object-cover transition duration-500 ease-in-out transform hover:scale-105">
                ${mediaIcon}
            </div>
            <div class="p-4">
                <h3 class="text-lg font-semibold text-purple-200 truncate">${item.title}</h3>
                <p class="text-sm text-gray-400">${formatDate(item.date)}</p>
            </div>
        </div>
    `;
}

// --- MODAL FUNCTIONS ---
function openModal(encodedItem) {
    const item = JSON.parse(decodeURIComponent(encodedItem));

    modalTitle.textContent = item.title;
    modalDate.textContent = formatDate(item.date);
    modalExplanation.textContent = item.explanation;
    modalMedia.innerHTML = ''; 

    let mediaElement;

    if (item.media_type === 'video' && item.url) {
        if (item.url.includes('youtube.com/embed') || item.url.includes('player.vimeo')) {
            mediaElement = document.createElement('iframe');
            mediaElement.setAttribute('src', item.url);
            mediaElement.setAttribute('frameborder', '0');
            mediaElement.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
            mediaElement.setAttribute('allowfullscreen', 'true');
            mediaElement.setAttribute('title', item.title);
            mediaElement.classList.add('w-full', 'h-full', 'rounded-lg');
        } else {
            mediaElement = document.createElement('div');
            mediaElement.classList.add('w-full', 'h-full', 'flex', 'flex-col', 'items-center', 'justify-center', 'text-center', 'text-2xl', 'text-gray-500', 'p-10');
            mediaElement.innerHTML = `
                <p class="mb-4">Video content available at the following link:</p>
                <a href="${item.url}" target="_blank" class="text-purple-400 hover:text-purple-300 underline transition duration-300">View External Video</a>
            `;
        }
    } else if (item.media_type === 'image') {
        const imageUrl = item.hdurl || item.url;
        mediaElement = document.createElement('img');
        mediaElement.setAttribute('src', imageUrl);
        mediaElement.setAttribute('alt', item.title);
        mediaElement.classList.add('w-full', 'h-full', 'object-contain', 'rounded-lg');
        mediaElement.setAttribute('onerror', `this.onerror=null;this.src='${item.url || 'https://placehold.co/800x600/161b22/8b5cf6?text=Image+Error'}';`);
    } else {
         mediaElement = document.createElement('div');
         mediaElement.classList.add('w-full', 'h-full', 'flex', 'items-center', 'justify-center', 'text-2xl', 'text-gray-500', 'p-10');
         mediaElement.textContent = 'Incompatible media type or URL not found.';
    }

    modalMedia.appendChild(mediaElement);
    detailsModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

function closeModal(event) {
    if (event && event.target !== detailsModal) return;

    detailsModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    
    // Stop video playback when closing
    modalMedia.innerHTML = '';
}

// --- EVENT LISTENER (The main button handler) ---
fetchButton.addEventListener('click', () => {
    const selectedDate = startDateInput.value;
    if (selectedDate) {
        filterAndRenderGallery(selectedDate);
    } else {
        errorMessage.classList.remove('hidden');
        errorMessage.querySelector('p').textContent = 'Please select a start date.';
    }
});

// --- INITIALIZATION ---
window.onload = fetchInitialData;

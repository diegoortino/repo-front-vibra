
// =====================
// App State
// =====================
let currentTrack = null;
let isPlaying = false;
let visualizerActive = false;
let searchResults = [];
// =====================
// Search Functions
// =====================
async function handleSearch(event) {
    event.preventDefault();
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    showLoading();
    
    // Simular búsqueda - aquí integrarías con YouTube API
    setTimeout(() => {
        const mockResults = generateMockResults(query);
        displayResults(mockResults);
    }, 1500);
}

function searchSuggestion(suggestion) {
    document.getElementById('searchInput').value = suggestion;
    handleSearch({ preventDefault: () => {} });
}

function generateMockResults(query) {
    const artists = ['The Beatles', 'Queen', 'Led Zeppelin', 'Pink Floyd', 'AC/DC', 'Nirvana', 'Radiohead', 'Coldplay'];
    const songs = ['Yesterday', 'Hey Jude', 'Let It Be', 'Come Together', 'Here Comes The Sun'];
    
    return Array.from({ length: 6 }, (_, i) => ({
        id: `track-${i}`,
        title: `${query} ${i + 1}`,
        artist: artists[Math.floor(Math.random() * artists.length)],
        duration: `${Math.floor(Math.random() * 4) + 2}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        thumbnail: `https://via.placeholder.com/300x180/7B68EE/FFFFFF?text=🎵`
    }));
}

function showLoading() {
    document.getElementById('searchResults').innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
        </div>
    `;
}

// =====================
// Player Functions
// =====================
export function playTrack(trackId, title, artist) {
    currentTrack = { id: trackId, title, artist };
    isPlaying = true;
    
    // Update player UI
    document.getElementById('currentSong').textContent = title;
    document.getElementById('currentArtist').textContent = artist;
    document.getElementById('playPauseBtn').textContent = '⏸️';
    document.getElementById('playerSection').classList.add('active');
    
    // Simular reproducción
    console.log(`Reproduciendo: ${title} - ${artist}`);
}

function togglePlay() {
    isPlaying = !isPlaying;
    const btn = document.getElementById('playPauseBtn');
    btn.textContent = isPlaying ? '⏸️' : '▶️';
    
    if (isPlaying) {
        console.log('Reproduciendo...');
    } else {
        console.log('Pausado');
    }
}

function previousTrack() {
    console.log('Canción anterior');
}

function nextTrack() {
    console.log('Siguiente canción');
}

function toggleVisualizer() {
    visualizerActive = !visualizerActive;
    const btn = document.getElementById('visualizerBtn');
    
    if (visualizerActive) {
        btn.classList.add('active');
        btn.textContent = '✨ Visualizador ON';
        console.log('Visualizador activado');
        // Aquí activarías las visualizaciones IA
    } else {
        btn.classList.remove('active');
        btn.textContent = '✨ Visualizador';
        console.log('Visualizador desactivado');
    }
}

function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        console.log('Cerrando sesión...');
        // Aquí redirigirías al landing page
        window.location.reload();
    }
}
// 2.homePage/index.js
// =====================
// Canvas waves animation
// =====================
let canvas, ctx, waves = [];
let width = 0, height = 0;
let mouseY = window.innerHeight / 2;

const CONFIG = {
    WAVE_LINES: 6,
    ANIMATION_SPEED: 0.002,
    WAVE_FREQUENCY_BASE: 0.004,
    WAVE_FREQUENCY_INCREMENT: 0.0008,
    WAVE_AMPLITUDE_BASE: 25,
    WAVE_AMPLITUDE_INCREMENT: 8,
    WAVE_PHASE_INCREMENT: 30
};

function initCanvas() {
    canvas = document.getElementById('waves');
    if (!canvas) return;
    
    ctx = canvas.getContext('2d');
    resizeCanvas();
    
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', e => mouseY = e.clientY);
    
    animateWaves();
}

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    createWaves();
}

function createWaves() {
    waves = [];
    for (let i = 0; i < CONFIG.WAVE_LINES; i++) {
        waves.push({
            amplitude: CONFIG.WAVE_AMPLITUDE_BASE + i * CONFIG.WAVE_AMPLITUDE_INCREMENT,
            frequency: CONFIG.WAVE_FREQUENCY_BASE + i * CONFIG.WAVE_FREQUENCY_INCREMENT,
            phase: i * CONFIG.WAVE_PHASE_INCREMENT,
            offsetY: (i + 0.5) * (height / CONFIG.WAVE_LINES)
        });
    }
}

function animateWaves(time = 0) {
    if (!ctx) return;
    
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(160,120,255,0.4)';
    ctx.shadowBlur = 8;

    const amplitudeFactor = 1 + (mouseY - height / 2) / (height * 2);

    waves.forEach((wave, index) => {
        const opacity = 0.3 - index * 0.04;
        ctx.strokeStyle = `rgba(160,120,255,${opacity})`;
        
        ctx.beginPath();
        for (let x = 0; x < width; x += 2) {
            const y = wave.offsetY +
                Math.sin(x * wave.frequency + time * CONFIG.ANIMATION_SPEED + wave.phase) *
                wave.amplitude * amplitudeFactor;
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
    });

    requestAnimationFrame(animateWaves);
}

// =====================
// App State
// =====================
let currentTrack = null;
let isPlaying = false;
let visualizerActive = false;
let searchResults = [];

function loadHeader() {
    const header = document.querySelector('.header');
    header.innerHTML = ''; // Limpia el contenido previo

    // Logo
    const logoContainer = createElement('div', 'logo-container');
    logoContainer.onclick = showHome;

    const titulo = createElement('h1', 'titulo', 'VIBRA');
    const subtitulo = createElement('p', 'subtitulo', 'Tu música, tu universo');

    logoContainer.appendChild(titulo);
    logoContainer.appendChild(subtitulo);

    // Nav
    const navContainer = createElement('nav', 'nav-container');
    const navLinks = createElement('ul', 'nav-links');

    const linksData = [
        { text: 'Sobre VIBRA', action: showAbout },
        { text: 'Cómo funciona', action: showHow },
        { text: 'Contacto', action: showContact }
    ];

    linksData.forEach(link => {
        const li = createElement('li', 'nav-link', link.text);
        li.onclick = link.action;
        navLinks.appendChild(li);
    });

    const ctaButton = createElement('button', 'cta-button', 'Comenzar');
    ctaButton.onclick = showLogin;

    navContainer.appendChild(navLinks);
    navContainer.appendChild(ctaButton);

    // Agregar todo al header
    header.appendChild(logoContainer);
    header.appendChild(navContainer);
}

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

function displayResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <div class="icon">😔</div>
                <h3>No se encontraron resultados</h3>
                <p>Intenta con otros términos de búsqueda</p>
            </div>
        `;
        return;
    }

    const resultsHTML = `
        <div class="results-grid">
            ${results.map(track => `
                <div class="result-card" data-track-id="${track.id}">
                    <div class="result-thumbnail">
                        🎵
                    </div>
                    <div class="result-info">
                        <h3 class="result-title">${track.title}</h3>
                        <p class="result-artist">${track.artist}</p>
                        <p class="result-duration">${track.duration}</p>
                        <button class="play-btn" onclick="playTrack('${track.id}', '${track.title}', '${track.artist}')">
                            <span>▶️</span>
                            Reproducir con IA
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    resultsContainer.innerHTML = resultsHTML;
    searchResults = results;
}

// =====================
// Player Functions
// =====================
function playTrack(trackId, title, artist) {
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

// =====================
// Keyboard shortcuts
// =====================
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    
    switch(e.key) {
        case ' ':
            e.preventDefault();
            if (currentTrack) togglePlay();
            break;
        case 'ArrowLeft':
            previousTrack();
            break;
        case 'ArrowRight':
            nextTrack();
            break;
        case 'v':
            if (currentTrack) toggleVisualizer();
            break;
    }
});

// =====================
// Initialize app
// =====================
document.addEventListener('DOMContentLoaded', () => {
    initCanvas();
    loadHeader();
    // Focus en el input de búsqueda
    document.getElementById('searchInput').focus();
});
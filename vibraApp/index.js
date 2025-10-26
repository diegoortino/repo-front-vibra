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

// =====================
// Search Functions
// =====================

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
    // loadHeader();
    // Focus en el input de búsqueda
    document.getElementById('searchInput').focus();
});
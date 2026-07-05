// --- DOM Elements ---
const trendingContainer = document.getElementById('trending-container');
const artistContainer = document.getElementById('artist-container');
const albumContainer = document.getElementById('album-container');

const musicPlayer = document.getElementById('musicPlayer');
const playBtn = document.getElementById('player-play');
const prevBtn = document.getElementById('player-prev');
const nextBtn = document.getElementById('player-next');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');

const seekBar = document.getElementById('seek-bar');
const volumeBar = document.getElementById('volume-bar');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');

const playerImg = document.getElementById('player-img');
const playerTitle = document.getElementById('player-title');
const playerArtist = document.getElementById('player-artist');
const originalFoot = document.querySelector('.foot'); 

// --- Global Variables ---
let currentPlaylist = []; // Holds the songs for the carousel you just clicked
let currentSongIndex = 0;
let currentAudio = new Audio();
let isPlaying = false;

// --- 1. Fetch Data for Specific Sections ---
async function initializeMusic() {
    // 1. Fetch Trending Songs (Search: "viral hits")
    fetchSectionData('viral hits', trendingContainer, 'song');
    
    // 2. Fetch Artists (Search: "top pop artists")
    fetchSectionData('top pop artists', artistContainer, 'artist');
    
    // 3. Fetch Albums (Search: "movie soundtracks")
    fetchSectionData('movie soundtracks', albumContainer, 'album');
}

// Reusable function to fetch and format data based on the section type
async function fetchSectionData(searchTerm, container, type) {
    try {
        // Fetch 50 results to ensure we have enough after filtering out duplicates/missing audio
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=song&limit=50`);
        const data = await response.json();
        
        // Format the raw data
    
        const validTracks = data.results
            .filter(song => song.previewUrl) 
            .map(song => ({
                title: song.trackName,
                artist: song.artistName,
                album: song.collectionName,
                image: song.artworkUrl100.replace('100x100', '300x300'), // High-res image
                audioUrl: song.previewUrl
            }));

        let finalData = [];

        // Filter the data differently based on which carousel we are building
        if (type === 'song') {
            finalData = validTracks.slice(0, 15); // Just take the first 15 tracks
        } 
        else if (type === 'artist') {
            const artistNames = new Set();
            validTracks.forEach(track => {
                if (!artistNames.has(track.artist) && finalData.length < 15) {
                    artistNames.add(track.artist);
                    finalData.push(track);
                }
            });
        } 
        else if (type === 'album') {
            const albumNames = new Set();
            validTracks.forEach(track => {
                if (!albumNames.has(track.album) && finalData.length < 15) {
                    albumNames.add(track.album);
                    finalData.push(track);
                }
            });
        }

        renderCards(finalData, container, type);

    } catch (error) {
        console.error(`Error fetching data for ${searchTerm}:`, error);
    }
}

// --- 2. Render Cards Generator ---
function renderCards(dataArray, container, type) {
    container.innerHTML = ''; 

    dataArray.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = type === 'artist' ? 'music-card artist-card' : 'music-card';
        
        // Determine what text to show based on the section
        let titleText = item.title;
        let subText = item.artist;
        
        if (type === 'artist') {
            titleText = item.artist;
            subText = 'Artist';
        } else if (type === 'album') {
            titleText = item.album;
            subText = item.artist;
        }

        card.innerHTML = `
            <img src="${item.image}" alt="Cover Art">
            <h2 class="title" style="font-weight:bold; font-size: 15px; margin-top:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width: 100%;">${titleText}</h2>
            <p class="content" style="color:#b3b3b3; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width: 100%;">${subText}</p>
        `;

        // IMPORTANT: When clicked, update the global playlist to match THIS carousel's data
        card.addEventListener('click', () => {
            currentPlaylist = dataArray; 
            loadAndPlaySong(index);
        });

        container.appendChild(card);
    });
}

// --- 3. Audio Player Logic ---
function loadAndPlaySong(index) {
    currentSongIndex = index;
    const song = currentPlaylist[currentSongIndex];

    playerTitle.innerText = song.title;
    playerArtist.innerText = song.artist;
    playerImg.src = song.image;

    if(originalFoot) originalFoot.style.display = 'none';
    musicPlayer.style.display = 'flex';

    currentAudio.src = song.audioUrl;
    currentAudio.play();
    isPlaying = true;
    updatePlayPauseButton();
}

function togglePlay() {
    if (isPlaying) {
        currentAudio.pause();
    } else {
        currentAudio.play();
    }
    isPlaying = !isPlaying;
    updatePlayPauseButton();
}

function updatePlayPauseButton() {
    if (isPlaying) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    } else {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    }
}

function playNext() {
    if (currentPlaylist.length === 0) return;
    let nextIndex = currentSongIndex + 1;
    if (nextIndex >= currentPlaylist.length) nextIndex = 0;
    loadAndPlaySong(nextIndex);
}

function playPrev() {
    if (currentPlaylist.length === 0) return;
    let prevIndex = currentSongIndex - 1;
    if (prevIndex < 0) prevIndex = currentPlaylist.length - 1;
    loadAndPlaySong(prevIndex);
}

// --- 4. Timers, Seekbar & Volume Logic ---
function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

currentAudio.addEventListener('timeupdate', () => {
    if (currentAudio.duration) {
        const progressPercent = (currentAudio.currentTime / currentAudio.duration) * 100;
        seekBar.value = progressPercent;
        currentTimeEl.innerText = formatTime(currentAudio.currentTime);
        totalTimeEl.innerText = formatTime(currentAudio.duration);
    }
});

seekBar.addEventListener('input', () => {
    const seekTime = (seekBar.value / 100) * currentAudio.duration;
    currentAudio.currentTime = seekTime;
});

volumeBar.addEventListener('input', (e) => {
    currentAudio.volume = e.target.value / 100;
});

currentAudio.addEventListener('ended', playNext);

playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', playNext);
prevBtn.addEventListener('click', playPrev);

// --- 5. Carousel Scroll Logic ---
const carousels = document.querySelectorAll('.carousel-wrapper');
const scrollAmount = 400; 

carousels.forEach(wrapper => {
    const container = wrapper.querySelector('.carousel-container');
    const prevScroll = wrapper.querySelector('.prev-btn');
    const nextScroll = wrapper.querySelector('.next-btn');

    prevScroll.addEventListener('click', () => {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    nextScroll.addEventListener('click', () => {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
});

// --- Initialize App ---
initializeMusic();
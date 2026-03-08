/* =========================================================
   CONFIGURATION
   Edit these variables to customize logic, assets, puzzle,
   music, blur, and expandable easter egg answers.
========================================================= */
const CONFIG = {
  TRUE_ANSWER: 'my Ran',
  GRID_SIZE: 6,
  PHOTO_PATHS: [
    'assets/our-photo.jpg',
	'assets/our-photo2.jpg',
    'assets/our-photo2.jpg',
    'assets/our-photo3.jpg',
  ],  
  MUSIC_PATH: 'https://cdn.pixabay.com/audio/2026/02/19/audio_e36c7bb28d.mp3',
  PREVIEW_BLUR_PX: 6,
  IGNORE_CASE: true,
  TRIM_SPACES: true,
  EASTER_EGGS: {
    layla: 'what do i can you',
    manal: 'hadik khlass ...',
	idk: 'ask for a hint or 2 hints',
	'i dont know': 'ask for a hint or 2 hints',
	hint: 'detective',
	'my love':'not that easy',
	'2 hints': 'instagram + detective',
	hind: 'lay3mrha dar',
	abir: 'kheti hhh',
	mostafa: '3adiiim',
	bassa: 'the origin story',
	oumaima: 'like a sister',
	issam: 'KHOUYA ISSAM',
	soumiya: 'li fahma l7ayat',
	noura: 'naaadia hhh',
	amira: 'the princess',
	wife: 'inchaellah',
	'my wife': 'inchaelllaah',
	'my darling': 'that is true but no be more creative',
	  whatever: 'hhhhhh no',
	  whomever: 'no but try it',
	  ran: 'close but no cigar',
	  chihab: '3ziz 3lik nti machi ana',
  }
};

const SELECTED_PHOTO = CONFIG.PHOTO_PATHS[Math.floor(Math.random() * CONFIG.PHOTO_PATHS.length)];
/* =========================================================
   DOM REFERENCES
========================================================= */
const screens = {
  lock: document.getElementById('screen-lock'),
  puzzle: document.getElementById('screen-puzzle'),
  reveal: document.getElementById('screen-reveal')
};
const textBank = document.getElementById('text-bank');
const unlockForm = document.getElementById('unlock-form');
const answerInput = document.getElementById('answer-input');
const unlockFeedback = document.getElementById('unlock-feedback');
const puzzleGrid = document.getElementById('puzzle-grid');
const correctCount = document.getElementById('correct-count');
const percentText = document.getElementById('percent-text');
const progressFill = document.getElementById('progress-fill');
const previewBtn = document.getElementById('preview-btn');
const reshuffleBtn = document.getElementById('reshuffle-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const letterBtn = document.getElementById('letter-btn');
const musicToggle = document.getElementById('music-toggle');
const popupModal = document.getElementById('popup-modal');
const popupTitle = document.getElementById('popup-title');
const popupMessage = document.getElementById('popup-message');
const previewModal = document.getElementById('preview-modal');
const letterModal = document.getElementById('letter-modal');
const previewImage = document.getElementById('preview-image');
const finalPhoto = document.getElementById('final-photo');
const bgMusic = document.getElementById('bg-music');

/* =========================================================
   PUZZLE STATE
   board = which source tile is currently shown in each position.
   solved board = [0,1,2,3,...,35]
========================================================= */
const TOTAL_TILES = CONFIG.GRID_SIZE * CONFIG.GRID_SIZE;
const state = {
  board: [],
  selectedIndex: null,
  unlocked: false,
  musicReady: false,
  musicPlaying: false
};

/* =========================================================
   INIT
========================================================= */
function init() {
  document.documentElement.style.setProperty('--preview-blur', `${CONFIG.PREVIEW_BLUR_PX}px`);
  previewImage.src = CONFIG.PHOTO_PATH;
  finalPhoto.src = CONFIG.PHOTO_PATH;
  if (bgMusic.querySelector('source')) {
    bgMusic.querySelector('source').src = CONFIG.MUSIC_PATH;
    bgMusic.load();
  }
  createParticles();
  bindEvents();
}

function bindEvents() {
  unlockForm.addEventListener('submit', handleUnlock);
  previewBtn.addEventListener('click', () => openModal(previewModal));
  reshuffleBtn.addEventListener('click', startPuzzle);
  playAgainBtn.addEventListener('click', () => {
    startPuzzle();
    switchScreen('puzzle');
  });
  letterBtn.addEventListener('click', () => openModal(letterModal));
  musicToggle.addEventListener('click', toggleMusic);

  document.querySelectorAll('[data-close="popup"]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(popupModal));
  });
  document.querySelectorAll('[data-close="preview"]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(previewModal));
  });
  document.querySelectorAll('[data-close="letter"]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(letterModal));
  });

  [popupModal, previewModal, letterModal].forEach(modal => {
    modal.addEventListener('click', (event) => {
      if (event.target === modal || event.target.classList.contains('modal-backdrop')) {
        closeModal(modal);
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal(popupModal);
      closeModal(previewModal);
      closeModal(letterModal);
    }
  });
}

/* =========================================================
   UNLOCK LOGIC
   - true answer unlocks
   - easter egg answers show popup
   - everything else shows subtle neutral feedback
========================================================= */
function normalizeAnswer(value) {
  let output = value;
  if (CONFIG.TRIM_SPACES) output = output.trim();
  if (CONFIG.IGNORE_CASE) output = output.toLowerCase();
  return output;
}

function handleUnlock(event) {
  event.preventDefault();
  const typedRaw = answerInput.value;
  const typed = normalizeAnswer(typedRaw);
  const trueAnswer = normalizeAnswer(CONFIG.TRUE_ANSWER);

  if (!typed) {
    unlockFeedback.textContent = textBank.dataset.neutralMessage;
    return;
  }

  if (typed === trueAnswer) {
    unlockFeedback.textContent = textBank.dataset.unlockedMessage;
    state.unlocked = true;
    startPuzzle();
    attemptMusicStart();
    setTimeout(() => switchScreen('puzzle'), 380);
    return;
  }

  const matchedEggKey = Object.keys(CONFIG.EASTER_EGGS).find(
    (key) => normalizeAnswer(key) === typed
  );

  if (matchedEggKey) {
    showPopup(textBank.dataset.easterEggTitle, CONFIG.EASTER_EGGS[matchedEggKey]);
    unlockFeedback.textContent = '';
    return;
  }

  unlockFeedback.textContent = textBank.dataset.neutralMessage;
}

/* =========================================================
   SCREEN FLOW
========================================================= */
function switchScreen(name) {
  Object.values(screens).forEach(screen => screen.classList.remove('active'));
  screens[name].classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* =========================================================
   MUSIC
========================================================= */
async function attemptMusicStart() {
  try {
    await bgMusic.play();
    state.musicPlaying = true;
    updateMusicButton();
  } catch (error) {
    state.musicPlaying = false;
    updateMusicButton();
    unlockFeedback.textContent = textBank.dataset.musicBlockedMessage;
  }
}

async function toggleMusic() {
  if (state.musicPlaying) {
    bgMusic.pause();
    state.musicPlaying = false;
    updateMusicButton();
    return;
  }

  try {
    await bgMusic.play();
    state.musicPlaying = true;
  } catch (error) {
    state.musicPlaying = false;
  }
  updateMusicButton();
}

function updateMusicButton() {
  musicToggle.textContent = state.musicPlaying ? '♫' : '♪';
  musicToggle.setAttribute('aria-pressed', String(state.musicPlaying));
  musicToggle.title = state.musicPlaying ? 'Mute music' : 'Play music';
}

/* =========================================================
   PUZZLE
========================================================= */
function startPuzzle() {
  state.selectedIndex = null;
  state.board = Array.from({ length: TOTAL_TILES }, (_, index) => index);
  shuffleBoard();
  renderPuzzle();
  updateProgress();
}

function shuffleBoard() {
  // Shuffle until it is not already solved and not too close to solved.
  let attempts = 0;
  do {
    for (let i = state.board.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.board[i], state.board[j]] = [state.board[j], state.board[i]];
    }
    attempts += 1;
  } while ((isSolved() || countCorrectTiles() > TOTAL_TILES - 6) && attempts < 20);
}

function renderPuzzle() {
  puzzleGrid.innerHTML = '';

  state.board.forEach((tileId, boardIndex) => {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'tile';
    tile.dataset.boardIndex = String(boardIndex);
    tile.dataset.tileId = String(tileId);
    applyTileImage(tile, tileId);

    if (state.selectedIndex === boardIndex) {
      tile.classList.add('selected');
    }
    if (tileId === boardIndex) {
      tile.classList.add('correct-hint');
    }

    tile.addEventListener('click', () => onTileClick(boardIndex));
    puzzleGrid.appendChild(tile);
  });
}

function onTileClick(index) {
  if (state.selectedIndex === null) {
    state.selectedIndex = index;
    renderPuzzle();
    return;
  }

  if (state.selectedIndex === index) {
    state.selectedIndex = null;
    renderPuzzle();
    return;
  }

  swapTiles(state.selectedIndex, index);
  state.selectedIndex = null;
  renderPuzzle();
  updateProgress();

  if (isSolved()) {
    setTimeout(handleSolved, 260);
  }
}

function swapTiles(a, b) {
  [state.board[a], state.board[b]] = [state.board[b], state.board[a]];
}

function applyTileImage(element, tileId) {
  const row = Math.floor(tileId / CONFIG.GRID_SIZE);
  const col = tileId % CONFIG.GRID_SIZE;
  element.style.backgroundImage = `url("${CONFIG.PHOTO_PATH}")`;
  element.style.backgroundPosition = `${(col / (CONFIG.GRID_SIZE - 1)) * 100}% ${(row / (CONFIG.GRID_SIZE - 1)) * 100}%`;
}

function countCorrectTiles() {
  return state.board.reduce((count, tileId, boardIndex) => {
    return count + (tileId === boardIndex ? 1 : 0);
  }, 0);
}

function updateProgress() {
  const correct = countCorrectTiles();
  const percent = Math.round((correct / TOTAL_TILES) * 100);
  correctCount.textContent = `${correct} / ${TOTAL_TILES}`;
  percentText.textContent = `${percent}%`;
  progressFill.style.width = `${percent}%`;
}

function isSolved() {
  return state.board.every((tileId, index) => tileId === index);
}

function handleSolved() {
  switchScreen('reveal');
}

/* =========================================================
   MODALS
========================================================= */
function showPopup(title, message) {
  popupTitle.textContent = title;
  popupMessage.textContent = message;
  openModal(popupModal);
}

function openModal(modal) {
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal(modal) {
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}

/* =========================================================
   DECORATIVE PARTICLES
========================================================= */
function createParticles() {
  const container = document.getElementById('particles');
  const icons = ['✦', '•', '✧'];

  for (let i = 0; i < 18; i += 1) {
    const particle = document.createElement('span');
    particle.className = 'particle';
    particle.textContent = icons[Math.floor(Math.random() * icons.length)];
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.fontSize = `${12 + Math.random() * 10}px`;
    particle.style.animationDuration = `${16 + Math.random() * 12}s`;
    particle.style.animationDelay = `${Math.random() * -18}s`;
    container.appendChild(particle);
  }
}

init();

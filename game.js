// Game State
let gameState = {
    score: 0,
    streak: 0,
    bestStreak: 0,
    correct: 0,
    wrong: 0,
    lives: 3,
    level: 1,
    xp: 0,
    currentAnswer: 0,
    playerAnswer: '',
    startTime: null,
    questionStartTime: null,
    timerInterval: null,
    playerName: '',
    isMobile: false,
    globalLeaderboard: [],
    power: 0,
    powerTurns: 0,
    mission: null,
    settings: {
        sound: true,
        table: null,
        dark: false
    }
};

// JSONBin.io Configuration
// These values are injected during the GitHub Actions build process
// DO NOT commit your real credentials to the repository
const JSONBIN_ID = 'YOUR_BIN_ID_HERE';
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_ID}`;
const JSONBIN_API_KEY = '$2a$10$YOUR_API_KEY_HERE';
const IS_CONFIGURED = !JSONBIN_ID.includes('YOUR_') && !JSONBIN_API_KEY.includes('YOUR_');

const SETTINGS_KEY = 'mathBlasterSettings';
const LEGACY_LOCAL_SCORES_KEY = 'mathBlasterGlobalScores';

// Device Detection
function detectMobile() {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    return (isTouch && isSmallScreen) || isMobileUA;
}

// Initialize device type
gameState.isMobile = detectMobile();

// Update body class for CSS targeting
if (gameState.isMobile) {
    document.body.classList.add('mobile-device');
    document.body.classList.remove('desktop-device');
} else {
    document.body.classList.add('desktop-device');
    document.body.classList.remove('mobile-device');
}

function loadSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (typeof parsed.sound === 'boolean') gameState.settings.sound = parsed.sound;
        if (typeof parsed.dark === 'boolean') gameState.settings.dark = parsed.dark;
        if (parsed.table === null || parsed.table === undefined || parsed.table === '') {
            gameState.settings.table = null;
        } else {
            const t = Number(parsed.table);
            gameState.settings.table = Number.isFinite(t) ? t : null;
        }
    } catch {
        // ignore
    }
}

function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        sound: !!gameState.settings.sound,
        table: gameState.settings.table === null ? '' : String(gameState.settings.table),
        dark: !!gameState.settings.dark
    }));
}

function applySettingsToUI() {
    const soundEl = document.getElementById('setting-sound');
    const tableEl = document.getElementById('setting-table');
    const darkEl = document.getElementById('setting-dark');
    if (soundEl) soundEl.checked = !!gameState.settings.sound;
    if (tableEl) tableEl.value = gameState.settings.table === null ? '' : String(gameState.settings.table);
    if (darkEl) darkEl.checked = !!gameState.settings.dark;
    applyTheme();
}

function applyTheme() {
    document.body.classList.toggle('dark-mode', !!gameState.settings.dark);
}

// Sound (simple WebAudio beeps)
let audioCtx = null;
function ensureAudio() {
    if (!gameState.settings.sound) return null;
    if (audioCtx) return audioCtx;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        return audioCtx;
    } catch {
        return null;
    }
}

function beep(type) {
    if (!gameState.settings.sound) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);

    const now = ctx.currentTime;
    const base = type === 'correct' ? 660 : type === 'power' ? 880 : 220;
    o.frequency.setValueAtTime(base, now);
    o.type = 'triangle';
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    o.start(now);
    o.stop(now + 0.2);
}

function tinyHaptic() {
    if (!gameState.isMobile) return;
    if (navigator.vibrate) navigator.vibrate(15);
}

// Global Leaderboard Management (JSONBin.io)
async function fetchGlobalLeaderboard() {
    if (!IS_CONFIGURED) {
        console.log('JSONBin not configured yet');
        return null;
    }
    
    try {
        const response = await fetch(JSONBIN_URL + '/latest', {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        const scores = data.record.scores || [];
        // Normalize platform info for entries missing it
        for (let e of scores) {
            if (!('platform' in e)) {
                e.platform = (e.isMobile ? 'Mobile' : 'Desktop');
            }
        }
        gameState.globalLeaderboard = scores;
        return gameState.globalLeaderboard;
    } catch (error) {
        console.error('Error fetching global leaderboard:', error);
        return null;
    }
}

async function updateGlobalLeaderboard(name, score, time) {
    if (!IS_CONFIGURED) {
        console.log('JSONBin not configured, score not saved');
        return null;
    }
    
    try {
        // Get current scores
        const fetched = await fetchGlobalLeaderboard();
        if (!Array.isArray(fetched)) throw new Error('Global leaderboard unavailable');
        const currentScores = fetched;
        
        // Add new score
        currentScores.push({
            name: sanitizeName(name),
            score: score,
            time: time,
            date: new Date().toISOString(),
            isMobile: gameState.isMobile,
            platform: gameState.isMobile ? 'Mobile' : 'Desktop'
        });
        
        // Sort by score (descending), then by time (ascending)
        currentScores.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.time - b.time;
        });
        
        // Keep only top 20 (more than display to allow for filtering)
        currentScores.splice(20);
        
        // Update JSONBin
        const response = await fetch(JSONBIN_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify({ scores: currentScores })
        });
        
        if (!response.ok) throw new Error('Failed to update');
        
        gameState.globalLeaderboard = currentScores;
        
        return currentScores;
    } catch (error) {
        console.error('Error updating global leaderboard:', error);
        return null;
    }
}

// Combined leaderboard function
async function addToLeaderboard(name, score, time) {
    // Try to update global leaderboard
    await updateGlobalLeaderboard(name, score, time);
    // Return global leaderboard only
    const fetched = await fetchGlobalLeaderboard();
    return Array.isArray(fetched) ? fetched.slice(0, 10) : [];
}

async function getMergedLeaderboard() {
    const global = await fetchGlobalLeaderboard();
    if (!Array.isArray(global) || global.length === 0) return [];
    const sorted = global.slice().sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.time - b.time;
    });
    return sorted.slice(0, 10);
}

function getRank(score, time) {
    const leaderboard = gameState.globalLeaderboard || [];
    
    let rank = 1;
    for (let entry of leaderboard) {
        if (entry.score > score) rank++;
        else if (entry.score === score && entry.time < time) rank++;
    }
    return rank;
}

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Name Entry
function addToName(char) {
    const input = document.getElementById('player-name');
    if (input.value.length < 15) {
        input.value += char;
    }
}

function backspaceName() {
    const input = document.getElementById('player-name');
    input.value = input.value.slice(0, -1);
}

// Game Logic
function startGame() {
    const name = sanitizeName(document.getElementById('player-name').value);
    gameState.playerName = name || 'Player';
    
    // Reset game state
    gameState.score = 0;
    gameState.streak = 0;
    gameState.bestStreak = 0;
    gameState.correct = 0;
    gameState.wrong = 0;
    gameState.lives = 3;
    gameState.level = 1;
    gameState.xp = 0;
    gameState.playerAnswer = '';
    gameState.startTime = Date.now();
    gameState.questionStartTime = Date.now();
    gameState.power = 0;
    gameState.powerTurns = 0;
    gameState.mission = pickMission();
    
    // Re-detect device
    gameState.isMobile = detectMobile();
    updateDeviceUI();
    
    // Update UI
    updateStats();
    updateProgressBar();
    
    // Start timer
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(updateTimer, 1000);
    
    // Generate first question
    generateQuestion();
    
    // Show game screen
    showScreen('game-screen');

    setMascot('🚀', `Hi ${gameState.playerName}! Let's play!`);
}

function sanitizeName(name) {
    const cleaned = String(name || '').trim().replace(/\s+/g, ' ');
    // Keep it short for small screens
    return cleaned.slice(0, 12);
}

function escapeHtml(s) {
    return String(s)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function updateDeviceUI() {
    if (gameState.isMobile) {
        document.body.classList.add('mobile-device');
        document.body.classList.remove('desktop-device');
    } else {
        document.body.classList.add('desktop-device');
        document.body.classList.remove('mobile-device');
    }
    
    const mobileHint = document.querySelector('.mobile-hint');
    const desktopHint = document.querySelector('.desktop-hint');
    
    if (mobileHint) {
        mobileHint.style.display = gameState.isMobile ? 'block' : 'none';
    }
    
    if (desktopHint) {
        desktopHint.style.display = gameState.isMobile ? 'none' : 'block';
    }
}

function setMascot(face, text) {
    const f = document.getElementById('mascot-face');
    const b = document.getElementById('mascot-bubble');
    if (f) f.textContent = face;
    if (b) b.textContent = text;
}

function updateLivesUI() {
    const el = document.getElementById('lives');
    if (!el) return;
    const hearts = Math.max(0, Math.min(3, gameState.lives));
    el.textContent = '❤'.repeat(hearts) + '♡'.repeat(3 - hearts);
}

function updatePowerUI() {
    const fill = document.getElementById('power-fill');
    if (!fill) return;
    const pct = Math.max(0, Math.min(100, gameState.power));
    fill.style.width = pct + '%';
    fill.classList.toggle('active', gameState.powerTurns > 0);
}

const MISSION_POOL = [
    { type: 'streak', target: 3, text: '3-streak!' },
    { type: 'streak', target: 5, text: '5-streak!' },
    { type: 'fast', target: 4, text: 'Fast! <4s' },
    { type: 'correct', target: 8, text: '8 correct!' },
    { type: 'score', target: 120, text: '120 pts!' }
];

function pickMission() {
    const m = MISSION_POOL[Math.floor(Math.random() * MISSION_POOL.length)];
    return { ...m, done: false };
}

function updateMissionUI() {
    const el = document.getElementById('mission');
    if (!el || !gameState.mission) return;
    if (gameState.mission.done) {
        el.textContent = '🏅 Mission complete! Keep going!';
        el.classList.add('done');
        return;
    }
    el.classList.remove('done');
    el.textContent = `🎯 Mission: ${gameState.mission.text}`;
}

function checkMission({ lastAnswerSeconds }) {
    const m = gameState.mission;
    if (!m || m.done) return;

    if (m.type === 'streak' && gameState.streak >= m.target) m.done = true;
    if (m.type === 'fast' && typeof lastAnswerSeconds === 'number' && lastAnswerSeconds <= m.target) m.done = true;
    if (m.type === 'correct' && gameState.correct >= m.target) m.done = true;
    if (m.type === 'score' && gameState.score >= m.target) m.done = true;

    if (m.done) {
        gameState.score += 30;
        showFeedback('correct', '🏅 MISSION COMPLETE! +30');
        setMascot('🛸', 'Nice! You earned a mission bonus!');
        beep('power');
        createConfetti();
    }
}

// Generate 2-number multiplication (1-12)
function generateQuestion() {
    let num1 = Math.floor(Math.random() * 12) + 1;
    let num2 = Math.floor(Math.random() * 12) + 1;

    const focus = gameState.settings.table;
    if (focus && focus >= 2 && focus <= 12) {
        // Pick a random partner for the focused table
        const partner = Math.floor(Math.random() * 12) + 1;
        if (Math.random() < 0.5) {
            num1 = focus;
            num2 = partner;
        } else {
            num1 = partner;
            num2 = focus;
        }
    }
    
    gameState.currentAnswer = num1 * num2;
    document.getElementById('question').textContent = `${num1} × ${num2} =`;
    gameState.questionStartTime = Date.now();
    clearAnswer();

    updateMissionUI();
    updatePowerUI();
}

function addDigit(digit) {
    if (gameState.playerAnswer.length < 6) {
        gameState.playerAnswer += digit;
        updateAnswerDisplay();
    }
}

function clearAnswer() {
    gameState.playerAnswer = '';
    updateAnswerDisplay();
    hideFeedback();
}

function updateAnswerDisplay() {
    const display = document.getElementById('answer-display');
    display.textContent = gameState.playerAnswer || '?';
    display.classList.toggle('has-value', gameState.playerAnswer.length > 0);
}

function submitAnswer() {
    if (!gameState.playerAnswer) return;
    
    const guess = parseInt(gameState.playerAnswer);
    
    if (guess === gameState.currentAnswer) {
        handleCorrect();
    } else {
        handleWrong();
    }
}

function handleCorrect() {
    const now = Date.now();
    const seconds = Math.max(0, (now - (gameState.questionStartTime || now)) / 1000);

    // Base points
    let points = 10;

    // Speed bonus keeps things exciting
    if (seconds <= 3) points += 8;
    else if (seconds <= 5) points += 4;

    // Streak
    gameState.streak++;
    if (gameState.streak > gameState.bestStreak) {
        gameState.bestStreak = gameState.streak;
    }
    if (gameState.streak >= 3) points += 5;
    if (gameState.streak >= 5) points += 5;
    if (gameState.streak >= 10) points += 10;

    // Power mode: double points for a few turns
    if (gameState.powerTurns > 0) {
        points *= 2;
        gameState.powerTurns = Math.max(0, gameState.powerTurns - 1);
        if (gameState.powerTurns === 0) {
            setMascot('🚀', 'Power mode used up! Fill the bar again!');
        }
    }

    gameState.score += points;
    gameState.correct++;

    // Fill power bar
    gameState.power = Math.min(100, gameState.power + 20);
    if (gameState.power >= 100) {
        gameState.power = 0;
        gameState.powerTurns = 5;
        showFeedback('correct', '✨ POWER MODE! Next 5 = DOUBLE!');
        setMascot('✨', 'POWER MODE! Double points!');
        beep('power');
    } else {
        const cheer = [
            '✅ Nailed it!',
            '🌟 Great job!',
            '🚀 Blast off!',
            '💥 BOOM! Correct!',
            '🧠 Smart move!'
        ];
        showFeedback('correct', cheer[Math.floor(Math.random() * cheer.length)]);
        setMascot('😄', seconds <= 3 ? 'Super fast!' : 'Nice one!');
        beep('correct');
    }

    tinyHaptic();
    checkMission({ lastAnswerSeconds: seconds });

    updateStats();
    updateProgressBar();

    setTimeout(() => {
        generateQuestion();
    }, 700);
}

function handleWrong() {
    gameState.wrong++;
    gameState.streak = 0;
    gameState.lives = Math.max(0, gameState.lives - 1);

    showFeedback('wrong', `💥 Oops! It was ${gameState.currentAnswer}`);
    setMascot('😵', gameState.lives > 0 ? 'You got this! Try the next one!' : 'Good game!');
    beep('wrong');
    tinyHaptic();

    updateStats();

    setTimeout(() => {
        if (gameState.lives > 0) generateQuestion();
        else endGame();
    }, 1100);
}

function showFeedback(type, message) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.className = 'feedback ' + type;
}

function hideFeedback() {
    const feedback = document.getElementById('feedback');
    feedback.textContent = '';
    feedback.className = 'feedback';
}

function updateStats() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('streak').textContent = gameState.streak;
    updateLivesUI();
    updateMissionUI();
    updatePowerUI();
}

function updateTimer() {
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    document.getElementById('timer').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateProgressBar() {
    const progress = (gameState.score % 50) / 50 * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
}

async function endGame() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    
    gameState.elapsedTime = (Date.now() - gameState.startTime) / 1000;
    
    // Add to global leaderboard
    await addToLeaderboard(gameState.playerName, gameState.score, gameState.elapsedTime);
    
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('final-correct').textContent = gameState.correct;
    document.getElementById('final-streak').textContent = gameState.bestStreak;
    
    const minutes = Math.floor(gameState.elapsedTime / 60);
    const seconds = Math.floor(gameState.elapsedTime % 60);
    document.getElementById('final-time').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const rank = getRank(gameState.score, gameState.elapsedTime);
    const rankMessage = document.getElementById('rank-message');
    
    if (rank === 1) {
        rankMessage.textContent = '🏆 NEW GLOBAL HIGH SCORE! 🏆';
        createConfetti();
    } else if (rank <= 3) {
        rankMessage.textContent = `🥉 Rank #${rank} Globally!`;
        createConfetti();
    } else if (rank <= 10) {
        rankMessage.textContent = `Great job! You're #${rank} on the global leaderboard!`;
    } else {
        rankMessage.textContent = 'Good try! Play again to beat your score!';
    }
    
    showScreen('gameover-screen');
}

function createConfetti() {
    const container = document.getElementById('confetti-container');
    container.innerHTML = '';
    
    const colors = ['#ff6b6b', '#ffd43b', '#51cf66', '#74c0fc', '#da77f2'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        container.appendChild(confetti);
    }
    
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

function quitGame() {
    if (confirm('Are you sure you want to quit?')) {
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
            gameState.timerInterval = null;
        }
        showScreen('menu-screen');
    }
}

function playAgain() {
    showScreen('name-screen');
}

// Leaderboard Screen
async function showLeaderboard() {
    const listElement = document.getElementById('leaderboard-list');
    // Re-detect so the leaderboard matches the device you're currently on
    gameState.isMobile = detectMobile();
    updateDeviceUI();

    const currentPlatform = gameState.isMobile ? 'Mobile' : 'Desktop';
    const otherPlatform = currentPlatform === 'Mobile' ? 'Desktop' : 'Mobile';

    listElement.innerHTML = '<div class="loading">Loading scores...</div>';
    showScreen('leaderboard-screen');

    if (!IS_CONFIGURED) {
        listElement.innerHTML = '<div class="config-notice">⚠️ Global leaderboard is not configured</div>';
        return;
    }

    const fetched = await fetchGlobalLeaderboard();
    const baseScores = Array.isArray(fetched) ? fetched : [];

    // Helper to collect top scores for a given platform from current source
    function collectScoresForPlatform(platform) {
        const merged = (baseScores || []).filter(e => {
            const plat = e.platform || (e.isMobile ? 'Mobile' : 'Desktop');
            return plat === platform;
        });
        // Deduplicate by name-score-time
        const seen = new Set();
        const uniq = [];
        for (const s of merged) {
            const plat = s.platform || (s.isMobile ? 'Mobile' : 'Desktop');
            const key = `${s.name}-${s.score}-${s.time}-${plat}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniq.push(s);
            }
        }
        uniq.sort((a,b) => b.score - a.score || a.time - b.time);
        return uniq.slice(0, 10);
    }

    // Build sections
    const currentList = collectScoresForPlatform(currentPlatform);
    const otherList = collectScoresForPlatform(otherPlatform);

    function renderList(entries) {
        if (!entries || entries.length === 0) {
            return '<div class="empty-leaderboard">No scores yet! Be the first to play!</div>';
        }
        return entries.map((entry, idx) => {
            const rank = idx + 1;
            const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
            const platformLabel = entry.platform || (entry.isMobile ? 'Mobile' : 'Desktop');
            const deviceIcon = platformLabel === 'Mobile' ? '📱' : '💻';
            const safeName = escapeHtml(sanitizeName(entry.name));
            return `
                <div class="leaderboard-item">
                    <span class="leaderboard-rank ${rankClass}">${medal}</span>
                    <span class="leaderboard-name">${deviceIcon} ${safeName} <span class="plat">(${platformLabel})</span></span>
                    <span class="leaderboard-score">${entry.score} pts</span>
                </div>
            `;
        }).join('');
    }

    let html = '';
    html += `<div class="leaderboard-section"><h3>${currentPlatform} Scores</h3>${renderList(currentList)}</div>`;
    html += `<div class="leaderboard-section other-device"><h3>${otherPlatform} Scores</h3>${renderList(otherList)}</div>`;

    // JSONBin only
    
    listElement.innerHTML = html;
}

// Keyboard Support - Only for desktop
if (!gameState.isMobile) {
    document.addEventListener('keydown', (e) => {
        if (!document.getElementById('game-screen').classList.contains('active')) return;
        
        if (e.key >= '0' && e.key <= '9') {
            addDigit(parseInt(e.key));
        } else if (e.key === 'Enter') {
            submitAnswer();
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
            gameState.playerAnswer = gameState.playerAnswer.slice(0, -1);
            updateAnswerDisplay();
        } else if (e.key === 'Escape') {
            clearAnswer();
        }
    });
}

// Prevent zoom on double tap for mobile
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Handle window resize
window.addEventListener('resize', () => {
    gameState.isMobile = detectMobile();
    updateDeviceUI();
});

// Initialize UI on load
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    updateDeviceUI();
    applySettingsToUI();

    // Remove legacy local scores (JSONBin-only leaderboard)
    localStorage.removeItem(LEGACY_LOCAL_SCORES_KEY);

    const soundEl = document.getElementById('setting-sound');
    if (soundEl) {
        soundEl.addEventListener('change', () => {
            gameState.settings.sound = !!soundEl.checked;
            saveSettings();
            if (gameState.settings.sound) beep('correct');
        });
    }

    const tableEl = document.getElementById('setting-table');
    if (tableEl) {
        tableEl.addEventListener('change', () => {
            const v = tableEl.value;
            gameState.settings.table = v ? Number(v) : null;
            saveSettings();
            setMascot('🧠', gameState.settings.table ? `Practice ×${gameState.settings.table}!` : 'Mixed mode!');
        });
    }

    const darkEl = document.getElementById('setting-dark');
    if (darkEl) {
        darkEl.addEventListener('change', () => {
            gameState.settings.dark = !!darkEl.checked;
            saveSettings();
            applyTheme();
        });
    }

    // Pre-fetch global leaderboard
    fetchGlobalLeaderboard();
});

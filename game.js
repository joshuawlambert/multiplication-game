// Game State
let gameState = {
    score: 0,
    streak: 0,
    bestStreak: 0,
    correct: 0,
    wrong: 0,
    currentAnswer: 0,
    playerAnswer: '',
    startTime: null,
    timerInterval: null,
    playerName: '',
    isMobile: false,
    globalLeaderboard: []
};

// JSONBin.io Configuration
// These values are injected during the GitHub Actions build process
// DO NOT commit your real credentials to the repository
const JSONBIN_ID = 'YOUR_BIN_ID_HERE';
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_ID}`;
const JSONBIN_API_KEY = '$2a$10$YOUR_API_KEY_HERE';
const IS_CONFIGURED = JSONBIN_ID !== 'YOUR_BIN_ID_HERE' && !JSONBIN_API_KEY.includes('YOUR_API_KEY');

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

// Global Leaderboard Management (JSONBin.io)
async function fetchGlobalLeaderboard() {
    if (!IS_CONFIGURED) {
        console.log('JSONBin not configured yet, using localStorage only');
        return getLocalLeaderboard();
    }
    
    try {
        const response = await fetch(JSONBIN_URL + '/latest', {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        gameState.globalLeaderboard = data.record.scores || [];
        return gameState.globalLeaderboard;
    } catch (error) {
        console.error('Error fetching global leaderboard:', error);
        // Fallback to localStorage
        return getLocalLeaderboard();
    }
}

async function updateGlobalLeaderboard(name, score, time) {
    if (!IS_CONFIGURED) {
        console.log('JSONBin not configured, saving to localStorage only');
        return addToLocalLeaderboard(name, score, time);
    }
    
    try {
        // Get current scores
        const currentScores = await fetchGlobalLeaderboard();
        
        // Add new score
        currentScores.push({
            name: name,
            score: score,
            time: time,
            date: new Date().toISOString(),
            isMobile: gameState.isMobile
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
        
        // Also save to localStorage as backup
        addToLocalLeaderboard(name, score, time);
        
        return currentScores;
    } catch (error) {
        console.error('Error updating global leaderboard:', error);
        // Fallback to localStorage
        return addToLocalLeaderboard(name, score, time);
    }
}

// Local Leaderboard Management (LocalStorage)
function getLocalLeaderboard() {
    const stored = localStorage.getItem('mathBlasterGlobalScores');
    return stored ? JSON.parse(stored) : [];
}

function saveLocalLeaderboard(scores) {
    localStorage.setItem('mathBlasterGlobalScores', JSON.stringify(scores));
}

function addToLocalLeaderboard(name, score, time) {
    const scores = getLocalLeaderboard();
    scores.push({
        name: name,
        score: score,
        time: time,
        date: new Date().toISOString(),
        isMobile: gameState.isMobile
    });
    
    scores.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.time - b.time;
    });
    
    scores.splice(20);
    saveLocalLeaderboard(scores);
    return scores;
}

// Combined leaderboard function
async function addToLeaderboard(name, score, time) {
    // Try to update global leaderboard
    await updateGlobalLeaderboard(name, score, time);
    // Return merged leaderboard
    return await getMergedLeaderboard();
}

async function getMergedLeaderboard() {
    const global = await fetchGlobalLeaderboard();
    const local = getLocalLeaderboard();
    
    // Merge and deduplicate (prefer global scores)
    const seen = new Set();
    const merged = [];
    
    [...global, ...local].forEach(entry => {
        const key = `${entry.name}-${entry.score}-${entry.time}`;
        if (!seen.has(key)) {
            seen.add(key);
            merged.push(entry);
        }
    });
    
    // Sort and limit
    merged.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.time - b.time;
    });
    
    return merged.slice(0, 10);
}

function getRank(score, time) {
    const leaderboard = gameState.globalLeaderboard.length > 0 ? 
        gameState.globalLeaderboard : getLocalLeaderboard();
    
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
    const name = document.getElementById('player-name').value.trim();
    gameState.playerName = name || 'Player';
    
    // Reset game state
    gameState.score = 0;
    gameState.streak = 0;
    gameState.bestStreak = 0;
    gameState.correct = 0;
    gameState.wrong = 0;
    gameState.playerAnswer = '';
    gameState.startTime = Date.now();
    
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

// Generate 2-number multiplication (1-12)
function generateQuestion() {
    const num1 = Math.floor(Math.random() * 12) + 1;
    const num2 = Math.floor(Math.random() * 12) + 1;
    
    gameState.currentAnswer = num1 * num2;
    document.getElementById('question').textContent = `${num1} × ${num2} =`;
    clearAnswer();
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
    let points = 10;
    
    gameState.streak++;
    if (gameState.streak > gameState.bestStreak) {
        gameState.bestStreak = gameState.streak;
    }
    
    if (gameState.streak >= 3) points += 5;
    if (gameState.streak >= 5) points += 5;
    if (gameState.streak >= 10) points += 10;
    
    gameState.score += points;
    gameState.correct++;
    
    let message = '✓ CORRECT!';
    if (gameState.streak >= 10) message = '🔥 UNSTOPPABLE!';
    else if (gameState.streak >= 5) message = '⚡ AMAZING!';
    else if (gameState.streak >= 3) message = '🔥 AWESOME!';
    
    showFeedback('correct', message);
    updateStats();
    updateProgressBar();
    
    setTimeout(() => {
        generateQuestion();
    }, 800);
}

function handleWrong() {
    gameState.wrong++;
    gameState.streak = 0;
    
    showFeedback('wrong', `✗ The answer was ${gameState.currentAnswer}`);
    updateStats();
    
    setTimeout(() => {
        endGame();
    }, 1500);
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
    
    // Show loading
    listElement.innerHTML = '<div class="loading">Loading global scores...</div>';
    showScreen('leaderboard-screen');
    
    // Fetch global leaderboard
    const leaderboard = await getMergedLeaderboard();
    
    if (leaderboard.length === 0) {
        listElement.innerHTML = '<div class="empty-leaderboard">No scores yet! Be the first to play!</div>';
        return;
    }
    
    let html = '<div class="leaderboard-section"><h3>🌍 Global Leaderboard</h3>';
    
    html += leaderboard.map((entry, index) => {
        const rank = index + 1;
        const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
        const deviceIcon = entry.isMobile ? '📱' : '💻';
        
        return `
            <div class="leaderboard-item">
                <span class="leaderboard-rank ${rankClass}">${medal}</span>
                <span class="leaderboard-name">${deviceIcon} ${entry.name}</span>
                <span class="leaderboard-score">${entry.score} pts</span>
            </div>
        `;
    }).join('');
    
    html += '</div>';
    
    // Show connection status
    if (!IS_CONFIGURED) {
        html += '<div class="config-notice">⚠️ Global leaderboard not configured yet</div>';
    }
    
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
    updateDeviceUI();
    // Pre-fetch global leaderboard
    fetchGlobalLeaderboard();
});

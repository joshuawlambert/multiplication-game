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
    isMobile: false
};

// Device Detection
function detectMobile() {
    // Check for touch device and small screen
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

// Leaderboard Management - Separate for Mobile and Desktop
function getLeaderboardKey() {
    return gameState.isMobile ? 'mathBlasterLeaderboardMobile' : 'mathBlasterLeaderboardDesktop';
}

function getLeaderboard() {
    const key = getLeaderboardKey();
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
}

function saveLeaderboard(leaderboard) {
    const key = getLeaderboardKey();
    localStorage.setItem(key, JSON.stringify(leaderboard));
}

function addToLeaderboard(name, score, time) {
    const leaderboard = getLeaderboard();
    leaderboard.push({
        name: name,
        score: score,
        time: time,
        date: new Date().toISOString(),
        isMobile: gameState.isMobile
    });
    
    // Sort by score (descending), then by time (ascending)
    leaderboard.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.time - b.time;
    });
    
    // Keep only top 10
    leaderboard.splice(10);
    saveLeaderboard(leaderboard);
    return leaderboard;
}

function getRank(score) {
    const leaderboard = getLeaderboard();
    let rank = 1;
    for (let entry of leaderboard) {
        if (entry.score > score) rank++;
        else if (entry.score === score && entry.time < gameState.elapsedTime) rank++;
    }
    return rank;
}

// Get the other device's leaderboard for comparison
function getOtherLeaderboard() {
    const key = gameState.isMobile ? 'mathBlasterLeaderboardDesktop' : 'mathBlasterLeaderboardMobile';
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
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
    
    // Re-detect device in case of orientation change or resize
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
    // Update body classes
    if (gameState.isMobile) {
        document.body.classList.add('mobile-device');
        document.body.classList.remove('desktop-device');
    } else {
        document.body.classList.add('desktop-device');
        document.body.classList.remove('mobile-device');
    }
    
    // Show/hide appropriate input hints
    const numpad = document.querySelector('.numpad');
    const mobileHint = document.querySelector('.mobile-hint');
    const desktopHint = document.querySelector('.desktop-hint');
    
    if (numpad) {
        numpad.style.display = 'flex';
    }
    
    if (mobileHint) {
        mobileHint.style.display = gameState.isMobile ? 'block' : 'none';
    }
    
    if (desktopHint) {
        desktopHint.style.display = gameState.isMobile ? 'none' : 'block';
    }
}

// Simplified: Always 2 numbers (1-12) for 8-10 year olds
function generateQuestion() {
    // Always generate 2 numbers for age-appropriate difficulty
    const num1 = Math.floor(Math.random() * 12) + 1;
    const num2 = Math.floor(Math.random() * 12) + 1;
    
    // Calculate answer
    gameState.currentAnswer = num1 * num2;
    
    // Display question
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
    // Points: base 10 points per correct answer
    let points = 10;
    
    // Streak bonus
    gameState.streak++;
    if (gameState.streak > gameState.bestStreak) {
        gameState.bestStreak = gameState.streak;
    }
    
    // Bonus for streaks of 3 or more
    if (gameState.streak >= 3) {
        points += 5; // Extra 5 points for streaks
    }
    if (gameState.streak >= 5) {
        points += 5; // Another 5 for longer streaks
    }
    if (gameState.streak >= 10) {
        points += 10; // Big bonus for 10+ streak
    }
    
    gameState.score += points;
    gameState.correct++;
    
    // Show feedback
    let message = '✓ CORRECT!';
    if (gameState.streak >= 10) message = '🔥 UNSTOPPABLE!';
    else if (gameState.streak >= 5) message = '⚡ AMAZING!';
    else if (gameState.streak >= 3) message = '🔥 AWESOME!';
    
    showFeedback('correct', message);
    
    // Update UI
    updateStats();
    updateProgressBar();
    
    // Generate next question after delay
    setTimeout(() => {
        generateQuestion();
    }, 800);
}

function handleWrong() {
    gameState.wrong++;
    gameState.streak = 0;
    
    // Show feedback
    showFeedback('wrong', `✗ The answer was ${gameState.currentAnswer}`);
    
    // Update UI
    updateStats();
    
    // End game after delay
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
    // Progress toward next level (every 50 points = new level)
    const progress = (gameState.score % 50) / 50 * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
}

function endGame() {
    // Stop timer
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    
    // Calculate final time
    gameState.elapsedTime = (Date.now() - gameState.startTime) / 1000;
    
    // Add to leaderboard
    addToLeaderboard(gameState.playerName, gameState.score, gameState.elapsedTime);
    
    // Update game over screen
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('final-correct').textContent = gameState.correct;
    document.getElementById('final-streak').textContent = gameState.bestStreak;
    
    const minutes = Math.floor(gameState.elapsedTime / 60);
    const seconds = Math.floor(gameState.elapsedTime % 60);
    document.getElementById('final-time').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Show rank message
    const rank = getRank(gameState.score);
    const deviceLabel = gameState.isMobile ? '📱 Mobile' : '💻 Desktop';
    const rankMessage = document.getElementById('rank-message');
    
    if (rank === 1) {
        rankMessage.textContent = `🏆 NEW ${deviceLabel} HIGH SCORE! 🏆`;
        createConfetti();
    } else if (rank <= 3) {
        rankMessage.textContent = `🥉 Rank #${rank} on ${deviceLabel}!`;
        createConfetti();
    } else if (rank <= 10) {
        rankMessage.textContent = `Great job! You're #${rank} on ${deviceLabel}!`;
    } else {
        rankMessage.textContent = 'Good try! Play again to beat your score!';
    }
    
    // Show game over screen
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
    
    // Clear confetti after animation
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
function showLeaderboard() {
    const currentLeaderboard = getLeaderboard();
    const otherLeaderboard = getOtherLeaderboard();
    const listElement = document.getElementById('leaderboard-list');
    const deviceLabel = gameState.isMobile ? '📱 Mobile' : '💻 Desktop';
    
    let html = `<div class="leaderboard-section"><h3>${deviceLabel} Scores</h3>`;
    
    if (currentLeaderboard.length === 0) {
        html += '<div class="empty-leaderboard">No scores yet! Be the first to play!</div>';
    } else {
        html += currentLeaderboard.map((entry, index) => {
            const rank = index + 1;
            const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
            
            return `
                <div class="leaderboard-item">
                    <span class="leaderboard-rank ${rankClass}">${medal}</span>
                    <span class="leaderboard-name">${entry.name}</span>
                    <span class="leaderboard-score">${entry.score} pts</span>
                </div>
            `;
        }).join('');
    }
    
    html += '</div>';
    
    // Show other device leaderboard for comparison
    const otherLabel = gameState.isMobile ? '💻 Desktop' : '📱 Mobile';
    html += `<div class="leaderboard-section other-device"><h3>${otherLabel} Scores</h3>`;
    
    if (otherLeaderboard.length === 0) {
        html += '<div class="empty-leaderboard">No scores on this device yet!</div>';
    } else {
        html += otherLeaderboard.slice(0, 5).map((entry, index) => {
            const rank = index + 1;
            const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
            
            return `
                <div class="leaderboard-item other-device-item">
                    <span class="leaderboard-rank ${rankClass}">${medal}</span>
                    <span class="leaderboard-name">${entry.name}</span>
                    <span class="leaderboard-score">${entry.score} pts</span>
                </div>
            `;
        }).join('');
    }
    
    html += '</div>';
    
    listElement.innerHTML = html;
    showScreen('leaderboard-screen');
}

// Keyboard Support - Only for desktop
if (!gameState.isMobile) {
    document.addEventListener('keydown', (e) => {
        // Only handle keyboard if game screen is active
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

// Handle window resize to re-detect device
window.addEventListener('resize', () => {
    gameState.isMobile = detectMobile();
    updateDeviceUI();
});

// Initialize UI on load
document.addEventListener('DOMContentLoaded', () => {
    updateDeviceUI();
});

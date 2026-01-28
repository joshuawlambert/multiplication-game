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
    playerName: ''
};

// Leaderboard Management
function getLeaderboard() {
    const stored = localStorage.getItem('mathBlasterLeaderboard');
    return stored ? JSON.parse(stored) : [];
}

function saveLeaderboard(leaderboard) {
    localStorage.setItem('mathBlasterLeaderboard', JSON.stringify(leaderboard));
}

function addToLeaderboard(name, score, time) {
    const leaderboard = getLeaderboard();
    leaderboard.push({
        name: name,
        score: score,
        time: time,
        date: new Date().toISOString()
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

function getDifficulty() {
    // Difficulty increases every 10 points
    return Math.min(2 + Math.floor(gameState.score / 10), 6);
}

function generateQuestion() {
    const difficulty = getDifficulty();
    const numbers = [];
    
    // Generate random numbers based on difficulty
    for (let i = 0; i < difficulty; i++) {
        // For kids, keep numbers 1-12
        numbers.push(Math.floor(Math.random() * 12) + 1);
    }
    
    // Calculate answer
    gameState.currentAnswer = numbers.reduce((acc, num) => acc * num, 1);
    
    // Display question
    document.getElementById('question').textContent = numbers.join(' × ') + ' =';
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
    // Calculate points based on difficulty and streak
    const difficulty = getDifficulty();
    let points = difficulty;
    
    // Streak bonus
    gameState.streak++;
    if (gameState.streak > gameState.bestStreak) {
        gameState.bestStreak = gameState.streak;
    }
    
    if (gameState.streak >= 3) {
        points += Math.floor(gameState.streak / 3);
    }
    
    gameState.score += points;
    gameState.correct++;
    
    // Show feedback
    showFeedback('correct', gameState.streak >= 3 ? '🔥 AWESOME!' : '✓ CORRECT!');
    
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
    const progress = (gameState.score % 10) / 10 * 100;
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
    const rankMessage = document.getElementById('rank-message');
    if (rank === 1) {
        rankMessage.textContent = '🏆 NEW HIGH SCORE! 🏆';
        createConfetti();
    } else if (rank <= 3) {
        rankMessage.textContent = `🥉 Rank #${rank} on the leaderboard!`;
        createConfetti();
    } else if (rank <= 10) {
        rankMessage.textContent = `Great job! You're #${rank} on the leaderboard!`;
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
    const leaderboard = getLeaderboard();
    const listElement = document.getElementById('leaderboard-list');
    
    if (leaderboard.length === 0) {
        listElement.innerHTML = '<div class="empty-leaderboard">No scores yet! Be the first to play!</div>';
    } else {
        listElement.innerHTML = leaderboard.map((entry, index) => {
            const rank = index + 1;
            const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
            const minutes = Math.floor(entry.time / 60);
            const seconds = Math.floor(entry.time % 60);
            
            return `
                <div class="leaderboard-item">
                    <span class="leaderboard-rank ${rankClass}">${medal}</span>
                    <span class="leaderboard-name">${entry.name}</span>
                    <span class="leaderboard-score">${entry.score} pts</span>
                </div>
            `;
        }).join('');
    }
    
    showScreen('leaderboard-screen');
}

// Keyboard Support
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

// Prevent zoom on double tap for mobile
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

# 🎮 Math Blaster - Multiplication Game

A fun, interactive multiplication learning game designed for kids aged 7-10. Built for GitHub Pages with **global leaderboard** support!

## 🌟 Play Now

**Live Game:** https://joshuawlambert.github.io/multiplication-game/

## ✨ Features

- **🎨 Kid-Friendly Design** - Colorful, engaging interface with big buttons
- **📱 Mobile Optimized** - No scrolling required, fits perfectly on phone screens
- **💻 Desktop Support** - Keyboard input for faster gameplay
- **🎯 Age-Appropriate** - Only 2-number multiplication (1×1 to 12×12)
- **⭐ Score Tracking** - 10 points per answer + streak bonuses
- **🔥 Streak System** - 3+ streak = +5pts, 5+ = +10pts, 10+ = +20pts
- **🏆 GLOBAL Leaderboard** - Scores sync across ALL devices worldwide!
- **📲 Device Detection** - Automatically adapts to touch or keyboard input
- **🎉 Confetti Celebration** - Party effects for high scores!

## 🎯 How to Play

1. Enter your name
2. Solve multiplication problems (e.g., 7 × 8 = ?)
3. **Mobile:** Tap the on-screen numpad buttons
4. **Desktop:** Type numbers on your keyboard + press Enter
5. Build streaks for bonus points!
6. One wrong answer ends the game
7. Try to get on the **global leaderboard**!

## 📱 Mobile vs Desktop

The game automatically detects your device:

**Mobile (Phone/Tablet):**
- Touch-optimized interface
- Large tap targets (58-65px buttons)
- No on-screen keyboard (uses custom numpad)
- Everything fits on one screen

**Desktop (Computer):**
- Keyboard support (0-9 keys)
- Enter to submit, Backspace to delete
- Larger display

## 🏆 Global Leaderboard Setup

This game uses **JSONBin.io** for a shared global leaderboard that works across all devices!

### Setting Up Your Own Global Leaderboard:

1. **Create a free JSONBin.io account:**
   - Go to https://jsonbin.io/
   - Sign up for a free account

2. **Create a new bin:**
   - Click "New Bin"
   - Set the content to: `{"scores": []}`
   - Click "Create"

3. **Get your credentials:**
   - Copy your **Bin ID** from the URL
   - Go to API Keys and copy your **$2a$10** Master Key

4. **Update game.js:**
   ```javascript
   const JSONBIN_ID = 'your-bin-id-here';
   const JSONBIN_API_KEY = '$2a$10$your-api-key-here';
   ```

5. **Push to GitHub** - Your global leaderboard is now live!

### Without Setup:
The game works great with just **localStorage** - scores will be saved on each device separately.

## 🚀 Deploy to GitHub Pages

1. Fork this repository
2. Go to Settings → Pages
3. Select "Deploy from a branch"
4. Choose "main" branch and "/ (root)" folder
5. Click Save
6. Your game will be live at `https://yourusername.github.io/multiplication-game/`

## 🏗️ Tech Stack

- HTML5
- CSS3 (with animations)
- Vanilla JavaScript (no dependencies)
- **JSONBin.io** for global leaderboard storage
- LocalStorage for offline backup

## 📱 Mobile Features

- Responsive design works on all screen sizes
- Touch-friendly buttons
- Prevents zoom on double-tap
- Compact layout (no scrolling)
- Works offline after first load

## 🎓 Educational Value

- Reinforces multiplication tables (1-12)
- Builds mental math speed
- Encourages accuracy over guessing
- Tracks progress with streaks
- Makes math practice fun!

## 📁 Files

- `index.html` - Main game page
- `style.css` - Styling and animations
- `game.js` - Game logic and leaderboard (update JSONBin credentials here)
- `README.md` - This file

## 🐛 Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📝 License

MIT License - Feel free to use and modify!

---

Made with ❤️ for young mathematicians everywhere!

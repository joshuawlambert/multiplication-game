# 🎮 Times Table Dash - Multiplication Game

A fun, interactive multiplication learning game designed for kids aged 8-10. Built for GitHub Pages with a **global leaderboard**!

## 🌟 Play Now

**Live Game:** https://joshuawlambert.github.io/multiplication-game/

## ✨ Features

- **🎨 Kid-Friendly Design** - Colorful, engaging interface with big buttons
- **📱 Mobile Optimized** - No scrolling required, fits perfectly on phone screens
- **💻 Desktop Support** - Keyboard input for faster gameplay
- **🎯 Age-Appropriate** - Only 2-number multiplication (1×1 to 12×12)
- **❤️ 3 Lives** - A wrong answer costs a heart, then you keep going
- **⭐ Score Tracking** - Points + speed bonus + streak bonuses
- **🔥 Streak System** - 3+ streak = +5pts, 5+ = +10pts, 10+ = +20pts
- **✨ Power Mode** - Fill the bar to get 5 double-point answers
- **🏅 Missions** - Quick goals for bonus points and celebrations
- **🏆 Global Leaderboard** - Scores sync across all devices (JSONBin)
- **📲 Device Detection** - Automatically adapts to touch or keyboard input
- **🎉 Confetti Celebration** - Party effects for high scores!

## 🎯 How to Play

1. Enter your name
2. Solve multiplication problems (e.g., 7 × 8 = ?)
3. **Mobile:** Tap the on-screen numpad buttons
4. **Desktop:** Type numbers on your keyboard + press Enter
5. Build streaks for bonus points!
6. You have 3 lives — keep going after mistakes
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

## 🏆 Global Leaderboard Setup (Secure)

This game uses **JSONBin.io** for a shared global leaderboard that works across all devices! Your API keys are kept secure using **GitHub Secrets**.

### Setting Up Your Secure Global Leaderboard:

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

4. **Add Repository Secrets to GitHub:**
   - Go to your GitHub repo: `https://github.com/joshuawlambert/multiplication-game`
   - Click **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Add `JSONBIN_ID` with your bin ID
   - Add another secret: `JSONBIN_API_KEY` with your API key (without the `$2a$10$` prefix)
   
   Example:
   - Name: `JSONBIN_ID` | Value: `abc123xyz`
   - Name: `JSONBIN_API_KEY` | Value: `yourkeyhere123` (NOT `$2a$10$yourkeyhere123`)

5. **Enable GitHub Actions:**
   - Make sure GitHub Pages is set to deploy from **GitHub Actions** (not from a branch)
   - Push any change to trigger the workflow

The secrets are automatically injected during the build process and **never exposed** in your public code!

### Without Setup:
The game still plays, but the **leaderboard will not save** until JSONBin is configured.

## 🚀 Deploy to GitHub Pages

### Option A: Using GitHub Actions (Recommended for Global Leaderboard)

1. Fork this repository
2. Go to **Settings** → **Pages**
3. Under "Build and deployment", select **GitHub Actions**
4. The workflow file is already in `.github/workflows/deploy.yml`
5. Add your JSONBin secrets (see Global Leaderboard Setup above)
6. Push any change to trigger deployment
7. Your game will be live at `https://yourusername.github.io/multiplication-game/`

### Option B: Deploy from Branch (Simpler, No Global Leaderboard)

1. Fork this repository
2. Go to Settings → Pages
3. Select "Deploy from a branch"
4. Choose "main" branch and "/ (root)" folder
5. Click Save
6. Your game will be live (without global leaderboard sync)

## 🏗️ Tech Stack

- HTML5
- CSS3 (with animations)
- Vanilla JavaScript (no dependencies)
- **JSONBin.io** for global leaderboard storage

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

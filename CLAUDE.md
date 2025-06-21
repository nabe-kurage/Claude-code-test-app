# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a simple emoji search web application that converts text descriptions to corresponding emojis. Users input descriptive words like "悲しい" (sad), "お祝い" (celebration), "眠い" (sleepy) and get matching emojis in return.

## Tech Stack

- **Frontend**: Pure HTML/CSS/JavaScript (no frameworks)
- **Architecture**: Client-side only, no backend required
- **Deployment**: Static files that can be served from any web server

## File Structure

```
├── index.html      # Main HTML file with UI structure
├── style.css       # Styling and responsive design
├── app.js          # JavaScript logic and emoji dictionary
└── CLAUDE.md       # This documentation file
```

## Development Commands

### Running the Application
```bash
# Open directly in browser
open index.html

# Or serve with a simple HTTP server
python3 -m http.server 8000
# Then visit http://localhost:8000
```

### Testing
- Manual testing by opening index.html in a web browser
- Test various keyword combinations (single and multiple words)
- Verify responsive design on different screen sizes

## Architecture Details

### Core Components

1. **Emoji Dictionary** (`app.js`): 
   - Comprehensive mapping of Japanese keywords to emoji
   - Categories: emotions, weather, animals, food, nature, sports, etc.
   - ~100+ keyword mappings with fallback handling

2. **Search Logic**:
   - Space-separated keyword processing
   - Each keyword maps to corresponding emoji
   - Unknown keywords return fallback emoji (❓🤔)

3. **UI Features**:
   - Real-time search with Enter key support
   - Loading animation for user feedback
   - Responsive design for mobile and desktop
   - Clean, modern interface with gradient styling

### Key Functions

- `searchEmojis(inputText)`: Core search logic in app.js:158
- `performSearch()`: UI update handler in app.js:169
- Event listeners for button clicks and keyboard input

## Configuration

- Claude Code settings: `.claude/settings.local.json`
- No external dependencies or build process required
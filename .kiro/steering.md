# Watched! - YouTube Extension Steering Document

## Project Overview
Browser extension that adds one-click "remove from Watch Later" buttons to YouTube videos, reducing the interaction from 2 steps to 1 step.

## Architecture

### Core Components
- **Content Script** (`watch_later.js`) - Injects the main functionality
- **Injected Script** (`injected.js`) - Main logic for button creation and video removal
- **Storage Utilities** (`storage_utilities.js`) - Chrome extension storage wrapper
- **Options Page** (`options.html/js`) - Settings interface for debug mode

### Key Features
- Adds "Watched!" buttons to playlist video renderers
- Hides original YouTube "Remove from Watch later" popup
- Configurable debug logging
- Auto-refreshes buttons every 2 seconds for dynamic content

## Technical Details

### Manifest v3 Extension
- Permissions: `storage`
- Matches: `https://*.youtube.com/*`
- Web accessible resources for cross-context communication

### Button Placement
- Positioned absolutely at `right: 35px, top: 47px`
- Uses YouTube's CSS variables for theming
- SVG icons with hover effects

### Storage System
- Uses Chrome sync storage
- Message passing between content/injected scripts
- Default debug mode enabled

## Development Workflow

### File Structure
```
src/
├── manifest.json          # Extension manifest
├── watch_later.js         # Content script entry point
├── injected.js           # Main functionality
├── storage_utilities.js  # Storage abstraction
├── options.html         # Settings UI
└── options.js           # Settings logic
```

### Installation (Edge)
1. Enable Developer Mode in `edge://extensions/`
2. Load unpacked from `src/` folder

## Maintenance Notes

### Key Selectors
- Target: `ytd-playlist-video-renderer`
- Button injection point: Video thumbnail containers

### Timing Considerations
- 2-second interval for button injection
- Handles dynamic content loading via polling

### Debugging
- Toggle via options page
- Console logging for button creation/removal events

## Credits
Based on [not-interested-youtube](https://github.com/lozog/not-interested-youtube) by lozog.
